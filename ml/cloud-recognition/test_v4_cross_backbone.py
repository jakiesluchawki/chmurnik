import unittest

import numpy as np
import torch

from dinov2_model import DINOV2_REVISION
from kernel_model import StableFeatureRBF
from probe_v4_cross_backbone import checked_features, fit_trial, normalized_groups
from train_v4_dinob import WEIGHT_SHA256


class CrossBackboneTests(unittest.TestCase):
    def test_balanced_group_distance_and_train_only_statistics(self):
        rng = np.random.default_rng(8)
        x = [rng.normal(size=(30, d)) for d in (8, 16)]
        v = [rng.normal(size=(7, d)) + 100 for d in (8, 16)]
        mean, scale, raw, query = normalized_groups(x, v)
        np.testing.assert_allclose(mean, np.concatenate([values.mean(0) for values in x]))
        standardized = (raw - mean) / scale
        np.testing.assert_allclose(standardized[:, :8].var(0).sum(), .5)
        np.testing.assert_allclose(standardized[:, 8:].var(0).sum(), .5)
        self.assertEqual(query.shape, (7, 24))
        with self.assertRaises(ValueError):
            normalized_groups(x, [v[0], v[1][:-1]])

    def test_feature_identity_order_and_split_are_checked(self):
        rows = [{"id": "one", "split": "validation"}, {"id": "two", "split": "validation"}]
        identity = {"architecture": "dinov2_vitb14", "weight_sha256": WEIGHT_SHA256, "feature_count": 1536,
                    "pooling": "final_normalized_cls_plus_mean_patch", "crop_fraction": .902, "preprocess": "center_crop"}
        cache = {"manifest_sha256": "frozen", "size": 336, "views": 1, "revision": DINOV2_REVISION,
                 "identity": identity, "ids": ["one", "two"], "completed": 2, "features": torch.zeros(2, 1536)}
        self.assertEqual(checked_features(cache, rows, "frozen", 1, "base", identity).shape, (2, 1536))
        with self.assertRaisesRegex(ValueError, "order"):
            checked_features(cache, rows[::-1], "frozen", 1, "base", identity)
        with self.assertRaisesRegex(ValueError, "identity"):
            checked_features(cache, rows, "frozen", 1, "base", {**identity, "weight_sha256": "different"})
        with self.assertRaisesRegex(ValueError, "development"):
            checked_features(cache, [{"id": "one", "split": "test"}], "frozen", 1, "base", identity)
        with self.assertRaisesRegex(ValueError, "Incomplete"):
            checked_features({**cache, "completed": 1, "ids": ["one"], "features": torch.zeros(1, 1536)}, rows,
                             "frozen", 1, "base", identity)

    def test_fixed_trial_and_generalized_head_match_reference(self):
        rng = np.random.default_rng(3)
        x = [rng.normal(size=(33, d)) for d in (768, 1536)]
        v = [rng.normal(size=(4, d)) for d in (768, 1536)]
        result = fit_trial(x, np.arange(33) % 11, v, np.arange(4))
        self.assertTrue(result["parity_passed"])
        self.assertEqual(result["feature_count"], 2304)
        head = StableFeatureRBF.empty(33, .25, feature_count=2304)
        head.load_state_dict(result["state"])
        np.testing.assert_allclose(head(torch.from_numpy(np.concatenate(v, axis=1)).float()).numpy(),
                                   result["validation_logits"].numpy(), atol=.001, rtol=0)
        for dimension in (0, -1, 4097, 1.5):
            with self.assertRaises(ValueError):
                StableFeatureRBF.empty(3, .25, dimension)


if __name__ == "__main__":
    unittest.main()
