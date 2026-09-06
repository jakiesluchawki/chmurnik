import csv
from pathlib import Path
import tempfile
import unittest

import numpy as np
from PIL import Image
import torch

from labels import GENERA
from probe_globe_partial import (REVIEW_FIELDS, allowed_mask, feature_parity, full_frame,
                                 original_cache, partial_loss, read_reviews)


class PartialLossTests(unittest.TestCase):
    def test_incompatible_cache_identity_fails_before_fitting(self):
        for identity in ({"backbone": "different"}, {"preprocess": "masked"}):
            with self.assertRaisesRegex(ValueError, "identity"):
                original_cache({"identity": identity}, [], "digest", 2)

    def test_feature_binding_rejects_numerical_mismatch(self):
        source = torch.zeros(2, 768)
        self.assertEqual(feature_parity(source, source), 0)
        with self.assertRaises(ValueError):
            feature_parity(source, source + .01)
        with self.assertRaises(ValueError):
            feature_parity(source[:1], source)

    def test_singleton_is_cross_entropy(self):
        logits = torch.tensor([[1., 2., -1.], [0., 1., 3.]], requires_grad=True)
        labels = torch.tensor([0, 2])
        mask = torch.nn.functional.one_hot(labels, 3).bool()
        self.assertTrue(torch.allclose(partial_loss(logits, mask), torch.nn.functional.cross_entropy(logits, labels)))

    def test_union_marginal_not_uniform_pseudolabel(self):
        logits = torch.tensor([[3., 1., 0.]], requires_grad=True)
        mask = torch.tensor([[True, True, False]])
        value = partial_loss(logits, mask)
        expected = -torch.log(logits.softmax(1)[0, :2].sum())
        self.assertAlmostEqual(value.item(), expected.item(), places=6)
        value.backward()
        self.assertLess(logits.grad[0, 0], 0)
        self.assertLess(logits.grad[0, 1], 0)
        self.assertGreater(logits.grad[0, 2], 0)

    def test_extreme_logits_finite_and_invalid_masks_fail(self):
        value = partial_loss(torch.tensor([[10000., -10000.]]), torch.tensor([[False, True]]))
        self.assertEqual(value.item(), 20000.)
        with self.assertRaises(ValueError):
            partial_loss(torch.ones(1, 2), torch.zeros(1, 2, dtype=torch.bool))
        with self.assertRaises(ValueError):
            partial_loss(torch.tensor([[float("nan"), 0.]]), torch.ones(1, 2, dtype=torch.bool))

    def test_all_classes_allowed_has_no_training_signal(self):
        logits = torch.randn(3, 11, requires_grad=True)
        partial_loss(logits, torch.ones_like(logits, dtype=torch.bool)).backward()
        self.assertTrue(torch.equal(logits.grad, torch.zeros_like(logits)))

    def test_clear_and_union_match_real_output_order(self):
        self.assertTrue(allowed_mask(["Clear"])[GENERA.index("clear_sky")])
        mask = allowed_mask(["Cirrocumulus", "Altocumulus"])
        self.assertEqual(torch.where(mask)[0].tolist(), [1, 3])
        with self.assertRaises(ValueError):
            allowed_mask(["Cloud"])

    def test_whole_frame_retains_both_edges_and_pads_without_black(self):
        values = np.zeros((20, 40, 3), dtype=np.uint8)
        values[:, :20] = [255, 0, 0]
        values[:, 20:] = [0, 255, 0]
        result = full_frame(Image.fromarray(values), 40)
        self.assertEqual(tuple(result.shape), (3, 40, 40))
        self.assertEqual(result[:, 0, 0].tolist(), [1., 0., 0.])
        self.assertEqual(result[:, -1, -1].tolist(), [0., 1., 0.])
        self.assertTrue(torch.equal(result[:, 0], result[:, 10]))

    def test_reviews_require_all_identities_and_explicit_decisions(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "reviews.csv"
            photos = [{"id": "G001"}]
            downloads = {"G001": {"status": "downloaded", "sha256": "abc"}}
            def write(rows):
                with path.open("w", newline="") as stream:
                    writer = csv.DictWriter(stream, fieldnames=REVIEW_FIELDS)
                    writer.writeheader()
                    writer.writerows(rows)
            row = {"id": "G001", "sha256": "abc", "action": "include", "note": ""}
            write([row])
            self.assertEqual(read_reviews(path, photos, downloads)["G001"]["action"], "include")
            for invalid in ([{**row, "action": ""}], [row, row], [{**row, "sha256": "different"}],
                            [{**row, "action": "exclude_person", "note": ""}]):
                write(invalid)
                with self.assertRaises(ValueError):
                    read_reviews(path, photos, downloads)


if __name__ == "__main__":
    unittest.main()
