import unittest

import torch

from labels import GENERA
from probe_v4_head_pair import equal_probability_logits, verify_members


class HeadPairTests(unittest.TestCase):
    def test_combines_probabilities_not_logits(self):
        torch.manual_seed(3)
        left, right = torch.randn(4, len(GENERA)) * 7, torch.randn(4, len(GENERA))
        actual = equal_probability_logits(left, right)
        torch.testing.assert_close(actual.softmax(1), (left.softmax(1) + right.softmax(1)) / 2)
        self.assertTrue(torch.isfinite(actual).all())
        self.assertFalse(torch.allclose(actual.softmax(1), ((left + right) / 2).softmax(1)))

    def test_shared_backbone_check_includes_image_normalization(self):
        member = {"architecture": "dinov2_vits14_mlp", "classes": GENERA,
                  "input_size": 224, "preprocess": "center_crop", "crop_fraction": .902,
                  "backbone_revision": "pinned", "state_dict": {"image_mean": torch.zeros(3), "classifier.bias": torch.zeros(11)}}
        verify_members(member, member)
        changed = {**member, "state_dict": {**member["state_dict"], "image_mean": torch.ones(3)}}
        with self.assertRaisesRegex(ValueError, "same backbone"):
            verify_members(member, changed)
        with self.assertRaisesRegex(ValueError, "uncalibrated"):
            verify_members(member, {**member, "temperature": 1.2})

    def test_refuses_mismatched_output_labels_and_preprocessing(self):
        with self.assertRaises(ValueError):
            equal_probability_logits(torch.zeros(1, 10), torch.zeros(1, 11))
        member = {"architecture": "dinov2_vits14_mlp", "classes": GENERA,
                  "input_size": 224, "preprocess": "center_crop", "crop_fraction": .902,
                  "backbone_revision": "pinned", "state_dict": {}}
        with self.assertRaisesRegex(ValueError, "contract differs"):
            verify_members(member, {**member, "crop_fraction": .9})


if __name__ == "__main__":
    unittest.main()
