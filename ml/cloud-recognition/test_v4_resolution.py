import tempfile
from pathlib import Path
import unittest

import numpy as np
from PIL import Image
import torch

from dinov2_model import DINOV2_REVISION
from probe_v4_resolution import SIZE, checked_resolution_cache, geometry_audit
from train_v4_dinob import MANIFEST_SHA256
from train_v4 import TrainingImages


class ResolutionTests(unittest.TestCase):
    def test_geometry_uses_actual_resize_threshold_and_exif_orientation(self):
        with tempfile.TemporaryDirectory() as directory:
            rows = []
            for i, short in enumerate([372, 373, 574]):
                image = Image.new("RGB", (800, short))
                exif = image.getexif()
                exif[274] = 6
                path = Path(directory) / f"{i}.jpg"
                image.save(path, exif=exif)
                rows.append({"id": str(i), "split": "train", "source": "fixture", "path": str(path)})
            report = geometry_audit(rows)
            self.assertEqual(report["summary"][0]["without_upsampling"], {"224": 3, "336": 2, "518": 1})
            self.assertEqual(report["records"][0]["width"], 372)
            self.assertEqual(report["records"][0]["height"], 800)

    def test_geometry_refuses_holdouts_and_duplicate_ids_before_image_access(self):
        row = {"id": "one", "split": "train", "source": "fixture", "path": "missing"}
        for rows in ([], [row, row], [{**row, "split": "test"}], [{**row, "split": "calibration"}]):
            with self.assertRaises(ValueError):
                geometry_audit(rows)

    def test_input_is_the_existing_crop_at_the_fixed_new_size(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "photo.png"
            Image.new("RGB", (600, 400), color=(100, 150, 200)).save(path)
            image, label = TrainingImages([{"path": str(path), "label": 3}], SIZE)[0]
            self.assertEqual(image.shape, (3, 336, 336))
            self.assertEqual(label, 3)
            np.testing.assert_allclose(image[:, 0, 0].numpy(), np.array([100, 150, 200]) / 255, atol=1e-7)

    def test_cache_size_identity_and_order_cannot_be_mixed_with_224(self):
        rows = [{"id": "one", "split": "train"}, {"id": "two", "split": "train"}]
        identity = {"input": 336, "device": "cpu"}
        saved = {"manifest_sha256": MANIFEST_SHA256, "size": 336, "views": 2,
                 "revision": DINOV2_REVISION, "identity": identity, "ids": ["one", "two"],
                 "completed": 2, "features": torch.zeros(4, 768)}
        self.assertEqual(checked_resolution_cache(saved, rows, identity, 2).shape, (4, 768))
        for changed in ({"size": 224}, {"identity": None}, {"ids": ["two", "one"]},
                        {"revision": "different"}, {"features": torch.zeros(4, 1536)},
                        {"features": torch.full((4, 768), float("nan"))},
                        {"completed": 1, "ids": ["one"], "features": torch.zeros(2, 768)}):
            with self.assertRaises(ValueError):
                checked_resolution_cache({**saved, **changed}, rows, identity, 2)

    def test_cache_rejects_wrong_views_and_non_development_splits(self):
        for rows, views in (([{"id": "x", "split": "test"}], 1),
                            ([{"id": "x", "split": "validation"}], 2),
                            ([{"id": "x", "split": "train"}], 1)):
            with self.assertRaises(ValueError):
                checked_resolution_cache({}, rows, {}, views)


if __name__ == "__main__":
    unittest.main()
