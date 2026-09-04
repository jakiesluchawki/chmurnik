import tempfile
import types
import unittest
from pathlib import Path
from unittest.mock import patch

import numpy as np
from PIL import Image
import torch

from dinov2_model import DINOV2_REVISION, DinoCloudNet, FeatureMLP
from model import build_model
from train_v4_dinob import linear_trials, mlp_trial, verify_source
from train_v4_linear import cached_features, validate_feature_cache
from v4_checkpoint import atomic_save


class DinoBaseTrialTests(unittest.TestCase):
    def test_legacy_head_state_remains_compatible_and_base_round_trips(self):
        for width in (768, 1536):
            head = FeatureMLP(11) if width == 768 else FeatureMLP(11, width)
            head.eval()
            restored = FeatureMLP(11, width).eval()
            restored.load_state_dict(head.state_dict())
            sample = torch.randn(2, width)
            torch.testing.assert_close(head(sample), restored(sample))
            self.assertEqual(tuple(head.mean.shape), (width,))

    def test_builder_selects_matching_feature_width_and_rejects_base_kernel(self):
        class Backbone(torch.nn.Module):
            def __init__(self, width):
                super().__init__()
                self.embed_dim = width

            def forward_features(self, image):
                return {"x_norm_clstoken": torch.ones(len(image), self.embed_dim),
                        "x_norm_patchtokens": torch.zeros(len(image), 4, self.embed_dim)}

        backbones = types.ModuleType("dinov2.hub.backbones")
        backbones.dinov2_vits14 = lambda pretrained: Backbone(384)
        backbones.dinov2_vitb14 = lambda pretrained: Backbone(768)
        with patch.dict("sys.modules", {"dinov2.hub.backbones": backbones}), \
                patch("dinov2_model.subprocess.check_output", return_value=DINOV2_REVISION), \
                patch("dinov2_model.Path.is_dir", return_value=True):
            for backbone, width in (("vits14", 768), ("vitb14", 1536)):
                for head in ("linear", "mlp"):
                    model = build_model(11, architecture=f"dinov2_{backbone}_{head}").eval()
                    self.assertEqual(model.feature_count, width)
                    self.assertEqual(tuple(model(torch.zeros(2, 3, 28, 28)).shape), (2, 11))
        with self.assertRaisesRegex(ValueError, "small backbone"):
            DinoCloudNet(11, head="kernel", backbone="vitb14")
        with self.assertRaisesRegex(ValueError, "Unsupported"):
            DinoCloudNet(11, head="typo")

    def test_cache_binds_identity_width_views_and_exact_order(self):
        expected = {"manifest_sha256": "manifest", "revision": DINOV2_REVISION, "size": 336,
                    "views": 2, "identity": {"weight_sha256": "base", "feature_count": 1536}}
        saved = {**expected, "completed": 1, "ids": ["a"], "features": torch.zeros(2, 1536)}
        self.assertEqual(validate_feature_cache(saved, expected, ["a", "b"], 2, 1536), 1)
        for key, value in (("manifest_sha256", "other"), ("revision", "other"), ("size", 224),
                           ("views", 1), ("identity", {"weight_sha256": "small"})):
            with self.assertRaises(ValueError):
                validate_feature_cache(saved, {**expected, key: value}, ["a", "b"], 2, 1536)
        with self.assertRaisesRegex(ValueError, "order"):
            validate_feature_cache(saved, expected, ["b", "a"], 2, 1536)
        for tensor in (torch.zeros(1, 1536), torch.zeros(2, 768), torch.zeros(2, 1536).double(),
                       torch.full((2, 1536), float("nan"))):
            with self.assertRaisesRegex(ValueError, "tensor"):
                validate_feature_cache({**saved, "features": tensor}, expected, ["a", "b"], 2, 1536)
        with self.assertRaisesRegex(ValueError, "completion"):
            validate_feature_cache({**saved, "completed": 3}, expected, ["a", "b"], 2, 1536)

    def test_legacy_small_cache_without_identity_is_accepted(self):
        saved = {"revision": DINOV2_REVISION, "completed": 1, "ids": ["a"], "features": torch.zeros(2, 768)}
        self.assertEqual(validate_feature_cache(saved, {"revision": DINOV2_REVISION, "identity": None}, ["a"], 2, 768), 1)

    def test_held_out_splits_are_rejected_before_reading_images(self):
        for split in ("calibration", "test", "diagnostic", "stress", "confirmatory"):
            with self.assertRaisesRegex(ValueError, "development"):
                cached_features(None, [{"split": split}], 336, None, None, "digest", 1,
                                identity={}, feature_count=1536)

    def test_base_cache_resume_preserves_original_then_flip_order(self):
        class Pixels:
            def features(self, images):
                return images[:, :, 0, 0].repeat(1, 512)

        class MustNotRun:
            def features(self, images):
                raise AssertionError("A complete cache must not run the model again")

        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            photo = Image.new("RGB", (28, 28), "red")
            photo.paste("blue", (14, 0, 28, 28))
            photo.save(root / "photo.png")
            rows = [{"id": "a", "label": 0, "split": "train", "path": str(root / "photo.png")}]
            args = (rows, 28, torch.device("cpu"), root / "cache.pt", "digest", 2)
            values = cached_features(Pixels(), *args, identity={"weight_sha256": "base"}, feature_count=1536)
            self.assertEqual(values.shape, (2, 1536))
            self.assertGreater(values[0, 0], values[0, 2])
            self.assertGreater(values[1, 2], values[1, 0])
            (root / "photo.png").unlink()
            restored = cached_features(MustNotRun(), *args, identity={"weight_sha256": "base"}, feature_count=1536)
            np.testing.assert_array_equal(restored, values)

    def test_linear_grid_preserves_parity_and_completed_trials(self):
        rng = np.random.default_rng(7042)
        x, v = rng.normal(size=(88, 12)).astype(np.float32), rng.normal(size=(22, 12)).astype(np.float32)
        y, vy = np.tile(np.arange(11), 8), np.tile(np.arange(11), 2)
        with tempfile.TemporaryDirectory() as directory:
            results = linear_trials(x, y, v, vy, Path(directory))
            self.assertEqual([row["C"] for row in results], [.01, .1, 1., 10.])
            with patch("train_v4_dinob.LogisticRegression.fit", side_effect=AssertionError("Must reuse completed fits")):
                restored = linear_trials(x, y, v, vy, Path(directory))
            for original, copy in zip(results, restored):
                self.assertLess(original["parity_max_error"], .001)
                torch.testing.assert_close(original["state"]["weight"], copy["state"]["weight"])

    def test_wrong_weight_file_is_rejected_before_loading(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "weights.pt"
            path.write_bytes(b"not a model")
            with self.assertRaisesRegex(ValueError, "weight identity"):
                verify_source(path)

    def test_mlp_resume_restores_optimizer_loader_and_random_state_exactly(self):
        rng = np.random.default_rng(7042)
        x, v = rng.normal(size=(88, 8)).astype(np.float32), rng.normal(size=(22, 8)).astype(np.float32)
        y, vy = np.tile(np.arange(11), 8), np.tile(np.arange(11), 2)

        def interrupt(payload, path):
            atomic_save(payload, path)
            if payload.get("epoch") == 7:
                raise RuntimeError("Simulated interruption after atomic save")

        with tempfile.TemporaryDirectory() as first, tempfile.TemporaryDirectory() as second, \
                patch("train_v4_dinob.FEATURE_COUNT", 8):
            uninterrupted = mlp_trial(x, y, v, vy, Path(first))
            with patch("train_v4_dinob.atomic_save", side_effect=interrupt):
                with self.assertRaisesRegex(RuntimeError, "Simulated interruption"):
                    mlp_trial(x, y, v, vy, Path(second))
            resumed = mlp_trial(x, y, v, vy, Path(second))
            self.assertEqual(uninterrupted["history"], resumed["history"])
            self.assertEqual(uninterrupted["epoch"], resumed["epoch"])
            for name, tensor in uninterrupted["state"].items():
                torch.testing.assert_close(tensor, resumed["state"][name], rtol=0, atol=0)


if __name__ == "__main__":
    unittest.main()
