import tempfile
import unittest
from pathlib import Path

import numpy as np
from PIL import Image
import torch
from torchvision import transforms

from siglip2_model import validate_feature_cache
from train_v4_siglip import DevelopmentImages, extract
from train_v4_linear import fold_scaler


class SiglipTrialTests(unittest.TestCase):
    def test_refuses_calibration_and_every_holdout_before_reading_images(self):
        for split in ("calibration", "test", "diagnostic", "stress", "confirmatory"):
            with self.assertRaisesRegex(ValueError, "development"):
                DevelopmentImages([{"split": split}], lambda image: image)
            with self.assertRaisesRegex(ValueError, "development"):
                extract(None, None, [{"split": split}], 1, None, {}, torch.device("cpu"))

    def test_cache_binds_split_order_model_and_preprocessing(self):
        contract = {"ids": ["a", "b"], "weight_sha256": "pinned", "crop": .9}
        saved = {"contract": contract, "completed": 1, "features": torch.zeros(2, 768)}
        self.assertEqual(validate_feature_cache(saved, contract, 2, 2), 1)
        for altered in ({**contract, "ids": ["b", "a"]}, {**contract, "weight_sha256": "changed"},
                        {**contract, "crop": .902}):
            with self.assertRaisesRegex(ValueError, "provenance"):
                validate_feature_cache(saved, altered, 2, 2)

    def test_rejects_partial_corrupt_and_nonfinite_features(self):
        for values in (torch.zeros(1, 768), torch.zeros(2, 767), torch.zeros(2, 768).double(),
                       torch.full((2, 768), float("nan"))):
            with self.assertRaises(ValueError):
                validate_feature_cache({"contract": {}, "completed": 1, "features": values}, {}, 2, 2)
        with self.assertRaises(ValueError):
            validate_feature_cache({"contract": {}, "completed": 3, "features": torch.zeros(6, 768)}, {}, 2, 2)

    def test_train_only_scaler_fold_preserves_logits(self):
        rng = np.random.default_rng(42)
        x, w, b = rng.normal(size=(3, 4)), rng.normal(size=(2, 4)), rng.normal(size=2)
        mean, scale = x.mean(0), x.std(0)
        folded, bias = fold_scaler(w, b, mean, scale)
        np.testing.assert_allclose((x - mean) / scale @ w.T + b, x @ folded.T + bias, atol=1e-12)

    def test_original_flip_order_and_completed_cache_resume(self):
        class Pixels(torch.nn.Module):
            def forward(self, images):
                return images[:, :, 0, 0].repeat(1, 256)

        class MustNotRun(torch.nn.Module):
            def forward(self, images):
                raise AssertionError("Completed cache should not re-read images")

        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            image = Image.new("RGB", (2, 2), "red")
            image.putpixel((1, 0), (0, 0, 255))
            image.save(root / "test.png")
            rows = [{"id": "a", "split": "train", "path": str(root / "test.png")}]
            cache = root / "features.pt"
            values = extract(Pixels(), transforms.ToTensor(), rows, 2, cache, {}, torch.device("cpu"))
            torch.testing.assert_close(values[0, :3], torch.tensor([1., 0., 0.]))
            torch.testing.assert_close(values[1, :3], torch.tensor([0., 0., 1.]))
            (root / "test.png").unlink()
            restored = extract(MustNotRun(), transforms.ToTensor(), rows, 2, cache, {}, torch.device("cpu"))
            torch.testing.assert_close(values, restored)


if __name__ == "__main__":
    unittest.main()
