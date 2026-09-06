import hashlib
import json
from pathlib import Path
import tempfile
import unittest

import coremltools as ct
import numpy as np
import torch

from kernel_model import StableFeatureRBF
from labels import GENERA
from verify_v4_coreml import export_identity, probability_comparison


class CoreMLParityTests(unittest.TestCase):
    def setUp(self):
        self.directory = tempfile.TemporaryDirectory()
        self.addCleanup(self.directory.cleanup)
        self.path = Path(self.directory.name) / "checkpoint.pt"
        self.path.write_bytes(b"test checkpoint")
        self.checkpoint = {"classes": GENERA, "manifest_sha256": "manifest", "architecture": "dinov2_vits14_kernel",
                           "input_size": 224, "crop_fraction": .902, "temperature": 1.5,
                           "abstention_policy": {"minimum_confidence": 1.01, "margin_threshold": 1.0}}
        self.metadata = {"classes": json.dumps(GENERA), "checkpoint_sha256": hashlib.sha256(self.path.read_bytes()).hexdigest(),
                         "manifest_sha256": "manifest", "architecture": "dinov2_vits14_kernel", "input_size": "224",
                         "crop_fraction": "0.902", "calibration_temperature": "1.5", "minimum_confidence": "1.01",
                         "abstention_margin_threshold": "1.0", "export_precision": "float32",
                         "classification_approval": "research-only; not approved for release"}

    def test_exact_identity_preserves_research_status(self):
        identity = export_identity(self.checkpoint, self.path, self.metadata)
        self.assertEqual(identity["export_precision"], "float32")
        self.assertIn("not approved", identity["classification_approval"])

    def test_mismatched_or_missing_identity_rejected(self):
        for key in self.metadata.keys() - {"classes", "classification_approval"}:
            with self.subTest(key=key), self.assertRaises(ValueError):
                export_identity(self.checkpoint, self.path, {**self.metadata, key: "changed"})
            with self.subTest(missing=key), self.assertRaises(ValueError):
                export_identity(self.checkpoint, self.path, {k: v for k, v in self.metadata.items() if k != key})

    def test_changed_checkpoint_bytes_rejected(self):
        self.path.write_bytes(b"another checkpoint")
        with self.assertRaises(ValueError):
            export_identity(self.checkpoint, self.path, self.metadata)

    def test_both_class_orders_verified(self):
        reversed_classes = list(reversed(GENERA))
        with self.assertRaises(ValueError):
            export_identity({**self.checkpoint, "classes": reversed_classes}, self.path, self.metadata)
        with self.assertRaises(ValueError):
            export_identity(self.checkpoint, self.path, {**self.metadata, "classes": json.dumps(reversed_classes)})

    def test_equal_probabilities(self):
        values = np.arange(1, 12, dtype=np.float64) / 66
        result = probability_comparison(values, values)
        self.assertEqual(result["max_absolute_error"], 0)
        self.assertEqual(result["torch_probabilities"], values.tolist())
        self.assertFalse(result["near_tie"])

    def test_non_finite_and_wrong_shapes_rejected(self):
        valid = np.ones(11) / 11
        for bad in (np.zeros(10), valid[None], np.full(11, np.nan), np.full(11, np.inf)):
            for a, b in ((bad, valid), (valid, bad)):
                with self.subTest(bad=bad), self.assertRaises(ValueError):
                    probability_comparison(a, b)

    def test_invalid_probability_ranges_and_sums_rejected(self):
        valid = np.ones(11) / 11
        for bad in (np.zeros(11), np.ones(11), np.array([-1., 2.] + [0.] * 9)):
            with self.subTest(bad=bad), self.assertRaises(ValueError):
                probability_comparison(valid, bad)

    def test_tie_does_not_hide_numeric_error(self):
        first = np.array([.499, .501] + [0.] * 9)
        second = np.array([.52, .48] + [0.] * 9)
        result = probability_comparison(first, second)
        self.assertTrue(result["near_tie"])
        self.assertNotEqual(result["torch_top"], result["coreml_top"])
        self.assertGreater(result["max_absolute_error"], .01)


class KernelConversionTests(unittest.TestCase):
    def test_kernel_aten_converts_without_integer_clamp_bound(self):
        model = StableFeatureRBF.empty(7, .1, feature_count=8).eval()
        example = torch.zeros(1, 8)
        program = torch.export.export(model, (example,)).run_decompositions({})
        converted = ct.convert(program, convert_to="mlprogram",
                               inputs=[ct.TensorType(name="features", shape=example.shape)],
                               outputs=[ct.TensorType(name="logits")],
                               minimum_deployment_target=ct.target.iOS15,
                               compute_precision=ct.precision.FLOAT32, skip_model_load=True)
        self.assertEqual(converted.get_spec().description.output[0].name, "logits")

    def test_float_clamp_preserves_original_eager_formula(self):
        generator = torch.Generator().manual_seed(7042)
        model = StableFeatureRBF(torch.randn(8, generator=generator), torch.rand(8, generator=generator) + .2,
                                 torch.randn(7, 8, generator=generator), torch.randn(7, 11, generator=generator), .1)
        for batch in (1, 4, 32):
            values = torch.randn(batch, 8, generator=generator)
            normalized = (values - model.mean) / model.scale
            distance = (normalized.square().sum(1, keepdim=True) + model.support_norm
                        - 2 * normalized @ model.support.T).clamp_min(0)
            kernel = (-model.gamma * distance).exp()
            center = kernel.mean(1, keepdim=True)
            expected = ((kernel - center).unsqueeze(2) * model.coefficients.unsqueeze(0)).sum(1) + center * model.coefficient_sum
            torch.testing.assert_close(model(values), expected, rtol=0, atol=0)


if __name__ == "__main__":
    unittest.main()
