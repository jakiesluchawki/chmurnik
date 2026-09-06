import copy
import unittest

import numpy as np
from PIL import Image
import torch
from torchvision import transforms

from probe_v4_context_stability import check_cache, context_views, summarize


class ContextStabilityTests(unittest.TestCase):
    def test_center_matches_existing_transform_and_all_views_are_in_bounds(self):
        rng = np.random.default_rng(7042)
        for size in ((640, 480), (481, 639), (299, 299), (1, 8)):
            image = Image.fromarray(rng.integers(0, 256, (size[1], size[0], 3), dtype=np.uint8))
            values, receipt = context_views(image)
            original = transforms.Compose([transforms.Resize(248), transforms.CenterCrop(224), transforms.ToTensor()])(image)
            self.assertTrue(torch.equal(original, values[0]))
            self.assertTrue(torch.equal(values[5], original.flip(2)))
            self.assertEqual(tuple(values.shape), (6, 3, 224, 224))
            for x, y, right, bottom in receipt["boxes"]:
                self.assertGreaterEqual(min(x, y), 0)
                self.assertLessEqual(right, receipt["resized_size"][0])
                self.assertLessEqual(bottom, receipt["resized_size"][1])
                self.assertEqual((right - x, bottom - y), (224, 224))
            self.assertEqual(len(receipt["tensor_sha256"]), 6)

    def test_mean_uses_all_six_without_best_view_selection(self):
        rows = [{"id": "first", "label": 0}, {"id": "second", "label": 1}]
        values = np.zeros((2, 6, 11), dtype="f4")
        values[0, 0, 0] = 9
        values[0, 1:, 1] = 2
        values[1, :, 1] = 3
        report = summarize(rows, values)
        self.assertEqual(report["scores"]["center"]["correct"], 2)
        self.assertEqual(report["scores"]["fixed_mean"]["correct"], 1)
        self.assertEqual(report["stability_diagnostic_only"]["stable"]["count"], 1)
        self.assertEqual(report["regressed"], 1)
        self.assertFalse(report["development_gain"])
        self.assertFalse(report["release_approved"])

    def test_wrong_stable_answer_does_not_become_verified(self):
        values = np.zeros((1, 6, 11), dtype="f4")
        values[:, :, 5] = 20
        result = summarize([{"id": "wrong", "label": 0}], values)
        self.assertEqual(result["stability_diagnostic_only"]["stable"]["center_correct"], 0)
        self.assertFalse(result["release_approved"])
        self.assertEqual(result["scores"]["center"]["grouped"]["accepted_count"], 0)

    def test_invalid_logits_are_rejected(self):
        for values in (np.zeros((1, 5, 11)), np.full((1, 6, 11), np.nan)):
            with self.assertRaises(ValueError):
                summarize([{"id": "one", "label": 0}], values)

    def test_cache_binds_ids_bytes_recipe_shapes_and_finiteness(self):
        rows, hashes, contract = [{"id": "one"}], ["source"], {"recipe": 1}
        cache = {"records": [{"id": "one", "source_sha256": "source"}],
                 "logits": torch.zeros(1, 6, 11), "contract": contract}
        self.assertEqual(check_cache(cache, contract, rows, hashes), 1)
        for key, value in (("records", [{"id": "other", "source_sha256": "source"}]),
                           ("records", [{"id": "one", "source_sha256": "different"}]),
                           ("contract", {"recipe": 2}), ("logits", torch.zeros(1, 5, 11)),
                           ("logits", torch.full((1, 6, 11), float("nan")))):
            changed = copy.deepcopy(cache)
            changed[key] = value
            with self.assertRaises(ValueError):
                check_cache(changed, contract, rows, hashes)


if __name__ == "__main__":
    unittest.main()
