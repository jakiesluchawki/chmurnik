import unittest
from pathlib import Path
import tempfile

from PIL import Image
import torch
from torch import nn

from probe_v4_masked_pooling import verify_development_image, sha256, image_fingerprint
from segmentation_pooling import SegmentationPooledDino, weighted_patch_mean


class Backbone(nn.Module):
    def forward_features(self, image):
        return {"x_norm_clstoken": torch.ones(len(image), 384),
                "x_norm_patchtokens": torch.arange(256).float()[None, :, None].expand(len(image), -1, 384)}


class Dino(nn.Module):
    def __init__(self):
        super().__init__()
        self.backbone = Backbone()
        self.image_mean, self.image_std = 0, 1


class Mask(nn.Module):
    def forward(self, image):
        return torch.ones(len(image), 1, *image.shape[-2:])


class SegmentationPoolingTests(unittest.TestCase):
    def test_source_and_artifact_fingerprints_are_not_confused(self):
        with tempfile.TemporaryDirectory() as folder:
            path = Path(folder) / "fixture.png"
            Image.new("RGB", (5, 5), "blue").save(path)
            row = {"id": "fixture", "source": "ccsn", "path": str(path), "split": "train",
                   "pixel_sha256": image_fingerprint(path)[0]}
            verify_development_image(row)
            artifact = {**row, "source": "imgw-2024-samples", "pixel_sha256": "original-pixels",
                        "artifact_sha256": sha256(path)}
            verify_development_image(artifact)
            with self.assertRaises(ValueError):
                verify_development_image({**row, "split": "test"})
            Image.new("RGB", (5, 5), "red").save(path)
            for original in (row, artifact):
                with self.assertRaises(ValueError):
                    verify_development_image(original)

    def test_uniform_and_empty_masks_preserve_the_mean(self):
        tokens = torch.arange(24).float().reshape(2, 4, 3)
        for value in (0., .4, 1.):
            actual = weighted_patch_mean(tokens, torch.full((2, 4, 1), value))
            torch.testing.assert_close(actual, tokens.mean(1))

    def test_weights_follow_patch_positions_without_reordering(self):
        tokens = torch.tensor([[[0.], [10.], [20.], [30.]]])
        weights = torch.tensor([[[0.], [0.], [1.], [0.]]])
        torch.testing.assert_close(weighted_patch_mean(tokens, weights), torch.tensor([[24 / 1.3]]))
        torch.testing.assert_close(weighted_patch_mean(tokens.flip(1), weights.flip(1)),
                                   weighted_patch_mean(tokens, weights))

    def test_bad_geometry_or_scores_fail_closed(self):
        tokens = torch.ones(1, 4, 3)
        for weights in (torch.ones(1, 3, 1), torch.full((1, 4, 1), float("nan")),
                        torch.full((1, 4, 1), -1.), torch.full((1, 4, 1), 1.1)):
            with self.assertRaises(ValueError):
                weighted_patch_mean(tokens, weights)
        with self.assertRaises(ValueError):
            weighted_patch_mean(tokens * float("nan"), torch.ones(1, 4, 1))

    def test_model_keeps_cls_and_aligns_256_tokens_with_masks(self):
        model = SegmentationPooledDino(Dino(), Mask(), Mask())
        actual = model.features(torch.zeros(2, 3, 224, 224))
        self.assertEqual(actual.shape, (2, 768))
        torch.testing.assert_close(actual[:, :384], torch.ones(2, 384))
        torch.testing.assert_close(actual[:, 384:], torch.full((2, 384), 127.5))
        with self.assertRaises(ValueError):
            model.features(torch.zeros(1, 3, 256, 256))


if __name__ == "__main__":
    unittest.main()
