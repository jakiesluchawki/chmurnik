import unittest
from types import SimpleNamespace

import numpy as np
import torch
from torch import nn

from multilayer_dino import FEATURE_COUNT, MultiLayerDino, feature_parity
from probe_v4_multilayer import fit_head, logit_parity, retained_quality
from train_v4_linear import validate_feature_cache


class Backbone(nn.Module):
    embed_dim = 384
    blocks = range(12)

    def get_intermediate_layers(self, image, **kwargs):
        self.image, self.arguments = image, kwargs
        return tuple((torch.arange(256).float()[None, :, None].expand(len(image), -1, 384) + i * 1000,
                      torch.full((len(image), 384), float(i))) for i in (8, 9, 10, 11))


def stub_dino():
    return SimpleNamespace(backbone=Backbone(), image_mean=torch.full((1, 3, 1, 1), .4),
                           image_std=torch.full((1, 3, 1, 1), .2))


class MultiLayerTests(unittest.TestCase):
    def test_official_order_normalization_and_only_last_patch_mean(self):
        dino = stub_dino()
        model = MultiLayerDino(dino)
        result = model.features(torch.ones(2, 3, 224, 224))
        self.assertEqual(result.shape, (2, FEATURE_COUNT))
        for i in range(4):
            torch.testing.assert_close(result[:, i * 384:(i + 1) * 384], torch.full((2, 384), float(8 + i)))
        torch.testing.assert_close(result[:, -384:], torch.full((2, 384), 11127.5))
        torch.testing.assert_close(dino.backbone.image, torch.full((2, 3, 224, 224), 3.))
        self.assertEqual(dino.backbone.arguments,
                         {"n": 4, "reshape": False, "return_class_token": True, "norm": True})

    def test_other_backbones_and_missing_blocks_are_rejected(self):
        dino = stub_dino()
        dino.backbone.embed_dim = 768
        with self.assertRaises(ValueError):
            MultiLayerDino(dino)
        dino = stub_dino()
        dino.backbone.blocks = range(24)
        with self.assertRaises(ValueError):
            MultiLayerDino(dino)
        dino = stub_dino()
        dino.backbone.get_intermediate_layers = lambda image, **kw: []
        with self.assertRaises(ValueError):
            MultiLayerDino(dino).features(torch.zeros(1, 3, 224, 224))

    def test_feature_parity_checks_all_rows_not_only_labels(self):
        values = torch.arange(2 * FEATURE_COUNT).float().reshape(2, FEATURE_COUNT)
        last = values[:, -768:].clone()
        self.assertEqual(feature_parity(values, last)["max_feature_error"], 0)
        for wrong in (last.flip(0), last + .01, last[:, :-1], last * float("nan")):
            with self.assertRaises(ValueError):
                feature_parity(values, wrong)
        with self.assertRaises(ValueError):
            feature_parity(values[:0], last[:0])

    def test_last_four_cache_identity_cannot_reuse_last_only_or_wrong_order(self):
        identity = {"blocks": [8, 9, 10, 11], "feature_count": FEATURE_COUNT}
        expected = {"identity": identity, "views": 2, "manifest_sha256": "pinned"}
        saved = {**expected, "completed": 2, "ids": ["one", "two"], "features": torch.zeros(4, FEATURE_COUNT)}
        self.assertEqual(validate_feature_cache(saved, expected, ["one", "two"], 2, FEATURE_COUNT), 2)
        for changed in ({"identity": None}, {"features": torch.zeros(4, 768)},
                        {"ids": ["two", "one"]}, {"views": 1}, {"manifest_sha256": "other"}):
            with self.assertRaises(ValueError):
                validate_feature_cache({**saved, **changed}, expected, ["one", "two"], 2, FEATURE_COUNT)

    def test_quality_is_training_only_aligned_recomputed_and_repeated_per_view(self):
        rows = [{"id": "one", "split": "train", "label": 7, "source": "ccsn"},
                {"id": "two", "split": "train", "label": 7, "source": "imgw-2024-samples"}]
        scores = torch.zeros(2, 11)
        scores[:, :3] = 2
        reference = {"train_ids": ["one", "two"], "oof_scores": scores, "quality": torch.tensor([.25, 1.])}
        np.testing.assert_array_equal(retained_quality(reference, rows), [.25, .25, 1., 1.])
        for wrong in (rows[::-1], [{**r, "split": "test"} for r in rows]):
            with self.assertRaises(ValueError):
                retained_quality(reference, wrong)
        with self.assertRaises(ValueError):
            retained_quality({**reference, "quality": torch.ones(2)}, rows)

    def test_control_and_new_head_keep_training_only_statistics_and_float32_parity(self):
        rng = np.random.default_rng(44)
        for width in (768, FEATURE_COUNT):
            x = rng.normal(size=(33, width))
            v = rng.normal(size=(4, width))
            labels, quality = np.arange(33) % 11, np.ones(33)
            expected, head = fit_head(x, labels, v, quality)
            _, shifted = fit_head(x, labels, v + 100, quality)
            np.testing.assert_allclose(head.mean.numpy(), x.mean(0), atol=1e-7)
            np.testing.assert_allclose(head.scale.numpy(), x.std(0), atol=1e-7)
            torch.testing.assert_close(head.mean, shifted.mean, atol=0, rtol=0)
            torch.testing.assert_close(head.coefficients, shifted.coefficients, atol=0, rtol=0)
            self.assertEqual(head.gamma, .25 / width)
            self.assertTrue(logit_parity(head(torch.from_numpy(v).float()).numpy(), expected)["passed"])

    def test_invalid_kernel_inputs_and_missing_class_support_are_rejected(self):
        x, v, labels = np.zeros((33, 768)), np.zeros((2, 768)), np.arange(33) % 11
        for tx, tv, y, q in ((x[:, :-1], v[:, :-1], labels, np.ones(33)),
                              (x, v * np.nan, labels, np.ones(33)),
                              (x, v, labels * 0, np.ones(33)),
                              (x, v, labels, np.zeros(33))):
            with self.assertRaises(ValueError):
                fit_head(tx, y, tv, q)

    def test_small_logit_changes_that_flip_labels_still_fail(self):
        logits = np.zeros((1, 11))
        logits[0, 0] = .0001
        changed = logits.copy()
        changed[0, 1] = .0002
        self.assertFalse(logit_parity(changed, logits)["passed"])
        self.assertFalse(logit_parity(logits + .002, logits)["passed"])
        for bad in (np.zeros((0, 11)), logits * np.nan, np.zeros((1, 10))):
            with self.assertRaises(ValueError):
                logit_parity(bad, logits)


if __name__ == "__main__":
    unittest.main()
