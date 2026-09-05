import unittest

import numpy as np
from sklearn.kernel_ridge import KernelRidge
from sklearn.metrics.pairwise import rbf_kernel
import torch

from assemble_v4_kernel import checked_precision, checked_reliability
from kernel_model import StableFeatureRBF
from train_v4_kernel import FeatureRBF, development_cache
from train_v4_dinob import MANIFEST_SHA256
from labels import GENERA


class KernelHeadTests(unittest.TestCase):
    def test_weighted_multioutput_prediction_matches_sklearn(self):
        rng = np.random.default_rng(42)
        support, query = rng.normal(size=(20, 768)), rng.normal(size=(4, 768))
        mean, scale = rng.normal(size=768), rng.uniform(.5, 2, 768)
        target = np.eye(11)[np.arange(20) % 11] * 10
        gamma = 1 / 768
        fitted = KernelRidge(alpha=.1, kernel="precomputed").fit(rbf_kernel(support, gamma=gamma), target, sample_weight=rng.uniform(.5, 2, 20))
        head = FeatureRBF(mean, scale, support, fitted.dual_coef_, gamma)
        actual = head(torch.from_numpy(query * scale + mean).float()).numpy()
        np.testing.assert_allclose(actual, fitted.predict(rbf_kernel(query, support, gamma=gamma)), atol=1e-5)

    def test_rejects_invalid_head_and_non_development_cache(self):
        with self.assertRaises(ValueError):
            FeatureRBF(np.zeros(768), np.zeros(768), np.zeros((2, 768)), np.zeros((2, 11)), .1)
        with self.assertRaises(ValueError):
            FeatureRBF(np.zeros(768), np.ones(768), np.zeros((2, 768)), np.full((2, 11), np.nan), .1)
        with self.assertRaisesRegex(ValueError, "development"):
            development_cache({}, [{"split": "test"}], "digest", 1)

    def test_stable_head_preserves_rbf_with_large_opposing_coefficients(self):
        rng = np.random.default_rng(7)
        support = rng.normal(size=(4650, 768)).astype(np.float32)
        coefficients = rng.normal(size=(4650, 11)).astype(np.float32) * 30
        coefficients -= coefficients.mean(0)
        head = StableFeatureRBF(np.zeros(768), np.ones(768), support, coefficients, .25 / 768)
        query = torch.from_numpy(rng.normal(size=(4, 768)).astype(np.float32))
        expected = rbf_kernel(query.double().numpy(), support.astype(np.float64), gamma=.25 / 768) @ coefficients.astype(np.float64)
        np.testing.assert_allclose(head(query).numpy(), expected, atol=.001, rtol=0)
        np.testing.assert_allclose(torch.cat([head(row[None]) for row in query]).numpy(), expected, atol=.001, rtol=0)
        restored = StableFeatureRBF.empty(4650, .25 / 768)
        restored.load_state_dict(head.state_dict())
        torch.testing.assert_close(restored(query), head(query), atol=0, rtol=0)

    def test_stable_head_rejects_bad_geometry_and_scale(self):
        for count in (0, -1, 20001, 1.5):
            with self.assertRaises(ValueError):
                StableFeatureRBF.empty(count, .1)
        with self.assertRaises(ValueError):
            StableFeatureRBF.empty(2, float("nan"))
        with self.assertRaises(ValueError):
            StableFeatureRBF(torch.zeros(768), torch.zeros(768), torch.zeros(2, 768), torch.zeros(2, 11), .1)

    def test_assembly_requires_matching_complete_numerical_evidence(self):
        saved = {"contract": {"manifest_sha256": "manifest", "validation_count": 452}, "validation": {"macro_f1": .64}}
        report = {"head_sha256": "head", "implementation_sha256": "code", "manifest_sha256": "manifest",
                  "selected": saved["validation"], "variants": {f"stable_head_batch_{n}": {"max_error": .0002, "argmax_mismatches": 0}
                                                               for n in (1, 4, 32, 452)}}
        checked_precision(report, saved, "head", "code")
        with self.assertRaises(ValueError):
            checked_precision(report, saved, "different", "code")
        report["variants"]["stable_head_batch_1"]["max_error"] = .002
        with self.assertRaisesRegex(ValueError, "parity"):
            checked_precision(report, saved, "head", "code")
        report["variants"]["stable_head_batch_1"]["max_error"] = float("nan")
        with self.assertRaisesRegex(ValueError, "parity"):
            checked_precision(report, saved, "head", "code")

    def test_reliability_assembly_rejects_changed_provenance_and_failed_precision(self):
        recipe = {"manifest_sha256": MANIFEST_SHA256, "classes": GENERA, "code_sha256": {"kernel_model.py": "code"},
                  "validation_bar": .6437451661744025, "gamma": .25 / 768, "alpha": .1}
        saved = {"recipe_sha256": "recipe", "validation": {"macro_f1": .645}, "train_ids": list(range(2325)),
                 "validation_ids": list(range(452)), "gamma": .25 / 768, "state": {"support": torch.zeros(4650, 768)}}
        report = {"recipe_sha256": "recipe", "head_sha256": "head", "validation": saved["validation"],
                  "eligible_for_further_evaluation": True,
                  "parity": {str(n): {"max_error": .0002, "label_mismatches": 0} for n in (1, 4, 32, 452)}}
        checked_reliability(report, saved, recipe, "recipe", "head", "code")
        with self.assertRaisesRegex(ValueError, "provenance"):
            checked_reliability(report, saved, recipe, "other", "head", "code")
        report["parity"]["1"]["max_error"] = float("nan")
        with self.assertRaisesRegex(ValueError, "parity"):
            checked_reliability(report, saved, recipe, "recipe", "head", "code")


if __name__ == "__main__":
    unittest.main()
