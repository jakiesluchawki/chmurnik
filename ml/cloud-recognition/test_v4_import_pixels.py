import hashlib
from pathlib import Path
import tempfile
import unittest

import numpy as np
from PIL import Image

from probe_v4_import_pixels import compare, exact_ids, prepared_tensor
from train_v4_dinob import sha256


class PixelReceiptTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.source = self.root / "input.jpg"
        self.source.write_bytes(b"bound input bytes")
        self.image = Image.new("RGB", (224, 224), (31, 92, 207))
        self.image.save(self.root / "00000.png")
        self.row = {"id": "validation/example", "path": str(self.source)}
        self.receipt = {"id": self.row["id"], "inputSHA256": sha256(self.source), "inputByteCount": self.source.stat().st_size,
                        "preparedPNG": "00000.png", "preparedPNGSHA256": sha256(self.root / "00000.png"),
                        "preparedRGBSHA256": hashlib.sha256(self.image.tobytes()).hexdigest()}

    def test_exact_pixels_without_second_crop(self):
        tensor = prepared_tensor(self.row, self.receipt, 0, self.root)
        self.assertEqual(tuple(tensor.shape), (3, 224, 224))
        np.testing.assert_array_equal(np.rint(tensor.permute(1, 2, 0).numpy() * 255), np.asarray(self.image))

    def test_rejects_mismatched_native_bindings(self):
        for key, value in (("id", "another"), ("inputSHA256", "wrong"), ("inputByteCount", 0),
                           ("preparedPNG", "../00000.png"), ("preparedPNG", "00001.png"),
                           ("preparedPNGSHA256", "wrong"), ("preparedRGBSHA256", "wrong")):
            with self.subTest(key=key), self.assertRaises(ValueError):
                prepared_tensor(self.row, {**self.receipt, key: value}, 0, self.root)

    def test_rejects_wrong_prepared_dimensions_or_channels(self):
        for image in (Image.new("RGB", (248, 248)), Image.new("RGBA", (224, 224))):
            image.save(self.root / "00000.png")
            receipt = {**self.receipt, "preparedPNGSHA256": sha256(self.root / "00000.png")}
            with self.assertRaises(ValueError):
                prepared_tensor(self.row, receipt, 0, self.root)

    def test_requires_complete_unique_ids(self):
        for records in ([], [{"id": "a"}], [{"id": "a"}, {"id": "a"}], [{"id": "a"}, {"id": "c"}]):
            with self.assertRaises(ValueError):
                exact_ids(records, ["a", "b"])
        self.assertEqual(list(exact_ids([{"id": "b"}, {"id": "a"}], ["a", "b"])), ["b", "a"])


class PixelComparisonTests(unittest.TestCase):
    def test_numeric_failure_not_waived_by_near_tie(self):
        before = np.array([[.50, .49, .01] + [0.] * 8])
        after = np.array([[.48, .51, .01] + [0.] * 8])
        result = compare(["a"], before, after)
        self.assertFalse(result["strict_inference_gate"])
        self.assertTrue(result["native_decision_gate"])
        self.assertEqual(result["all_top1_changes"], ["a"])

    def test_reports_high_margin_switch(self):
        before = np.array([[.6, .4] + [0.] * 9])
        after = before[:, [1, 0, *range(2, 11)]]
        result = compare(["a"], before, after)
        self.assertFalse(result["native_decision_gate"])
        self.assertEqual(result["non_tie_05_changes"], ["a"])
        self.assertTrue(compare(["a"], before, before)["strict_inference_gate"])

    def test_rejects_bad_distributions_and_ids(self):
        good = np.full((1, 11), 1 / 11)
        for values in (np.zeros((1, 11)), np.full((1, 11), np.nan), np.ones((1, 10)),
                       np.array([[-.1, 1.1] + [0.] * 9])):
            with self.assertRaises(ValueError):
                compare(["a"], good, values)
        with self.assertRaises(ValueError):
            compare(["a", "a"], np.repeat(good, 2, axis=0), np.repeat(good, 2, axis=0))


if __name__ == "__main__":
    unittest.main()
