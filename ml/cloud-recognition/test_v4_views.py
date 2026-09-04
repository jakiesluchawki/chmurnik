import unittest

import numpy as np
from PIL import Image
import torch
from torchvision import transforms

from labels import GENERA
from probe_v4_views import image_views, long_axis_bounds, merge_views, validation_rows


class InputViewTests(unittest.TestCase):
    def test_windows_cover_both_long_edges_without_out_of_bounds(self):
        for width, height in ((800, 300), (300, 800), (5, 5), (1, 1)):
            boxes = long_axis_bounds(width, height)
            for left, top, right, bottom in boxes:
                self.assertTrue(0 <= left < right <= width)
                self.assertTrue(0 <= top < bottom <= height)
                self.assertEqual(right - left, bottom - top)
            if width >= height:
                self.assertEqual(boxes[0][0], 0)
                self.assertEqual(boxes[-1][2], width)
            else:
                self.assertEqual(boxes[0][1], 0)
                self.assertEqual(boxes[-1][3], height)

    def test_center_reproduces_training_geometry_exactly(self):
        image = Image.fromarray(np.random.default_rng(7042).integers(0, 256, (127, 283, 3), dtype=np.uint8))
        views, _ = image_views(image, 224)
        existing = transforms.Compose([transforms.Resize(round(224 / .902)), transforms.CenterCrop(224), transforms.ToTensor()])
        self.assertEqual(tuple(views.shape), (5, 3, 224, 224))
        self.assertTrue(torch.equal(views[0], existing(image)))

    def test_three_windows_average_probabilities_not_logits(self):
        logits = np.zeros((1, 5, len(GENERA)))
        logits[0, 2, 0] = 30
        logits[0, 3:, 1] = 10
        merged = merge_views(logits)
        self.assertEqual(merged["three_windows"].argmax(1).tolist(), [1])
        for values in merged.values():
            np.testing.assert_allclose(values.sum(axis=1), 1)

    def test_invalid_predictions_and_dimensions_are_rejected(self):
        for values in (np.zeros((1, 4, len(GENERA))), np.full((1, 5, len(GENERA)), np.nan)):
            with self.assertRaises(ValueError):
                merge_views(values)
        with self.assertRaises(ValueError):
            long_axis_bounds(0, 5)

    def test_only_validation_rows_can_enter_the_study(self):
        rows = [{"id": str(index), "group": str(index), "split": split, "label": 0}
                for index, split in enumerate(("train", "validation", "calibration", "test", "confirmatory"))]
        train = [{"id": f"train-{label}-{index}", "group": f"train-{label}-{index}", "split": "train", "label": label}
                 for label in range(len(GENERA)) for index in range(15)]
        self.assertEqual(validation_rows({"rows": train + rows}), [rows[1]])
        with self.assertRaises(ValueError):
            validation_rows({"rows": train + [rows[-1]]})


if __name__ == "__main__":
    unittest.main()
