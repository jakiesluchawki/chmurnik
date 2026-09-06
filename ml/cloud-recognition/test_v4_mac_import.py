import copy
import tempfile
from pathlib import Path
import unittest
from unittest.mock import patch

from probe_v4_mac_import import advance, imported_rows, verify_source_row
from train_v4_dinob import sha256


class ImportReceiptTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        source, encoded = self.root / "source", self.root / "00000.jpg"
        source.write_bytes(b"source bytes")
        encoded.write_bytes(b"encoded bytes")
        self.rows = [dict(id="source/one", path=str(source), label=2, split="train", group="group1")]
        self.receipts = [dict(id="source/one", sourceSHA256=sha256(source), file="00000.jpg",
                              encodedSHA256=sha256(encoded), encodedBytes=encoded.stat().st_size)]

    def test_preserves_identity_and_labels(self):
        original = copy.deepcopy(self.rows)
        result = imported_rows(self.rows, self.receipts, self.root)
        self.assertEqual(self.rows, original)
        self.assertEqual(result, [{**original[0], "path": str((self.root / "00000.jpg").resolve())}])

    def test_rejects_non_development_splits(self):
        for split in ("test", "calibration", "external", "unknown"):
            with self.subTest(split=split), self.assertRaises(ValueError):
                imported_rows([{**self.rows[0], "split": split}], self.receipts, self.root)

    def test_rejects_missing_or_repeated_ids(self):
        for rows, receipts in ((self.rows, []), (self.rows * 2, self.receipts * 2),
                               (self.rows, [{**self.receipts[0], "id": "wrong"}])):
            with self.subTest(rows=len(rows), receipts=len(receipts)), self.assertRaises(ValueError):
                imported_rows(rows, receipts, self.root)

    def test_rejects_paths_and_changed_receipts(self):
        for key, value in (("file", "../source"), ("sourceSHA256", "wrong"),
                           ("encodedSHA256", "wrong"), ("encodedBytes", 999)):
            with self.subTest(key=key), self.assertRaises(ValueError):
                imported_rows(self.rows, [{**self.receipts[0], key: value}], self.root)

    def test_rejects_changed_source_and_encoded_files(self):
        for file in ("source", "00000.jpg"):
            path = self.root / file
            before = path.read_bytes()
            path.write_bytes(b"changed")
            with self.subTest(file=file), self.assertRaises(ValueError):
                imported_rows(self.rows, self.receipts, self.root)
            path.write_bytes(before)

    def test_derived_source_uses_frozen_artifact_hash(self):
        row = {**self.rows[0], "artifact_sha256": self.receipts[0]["sourceSHA256"], "pixel_sha256": "original pixels"}
        with patch("probe_v4_mac_import.image_fingerprint", side_effect=AssertionError("Not the original file")):
            verify_source_row(row)
            with self.assertRaises(ValueError):
                verify_source_row({**row, "artifact_sha256": "changed"})

    def test_original_source_uses_frozen_pixels(self):
        with patch("probe_v4_mac_import.image_fingerprint", return_value=("pixels", 0)):
            verify_source_row({**self.rows[0], "pixel_sha256": "pixels"})
            with self.assertRaises(ValueError):
                verify_source_row({**self.rows[0], "pixel_sha256": "different pixels"})


class ImportAdmissionTests(unittest.TestCase):
    def test_requires_both_import_gains_and_no_raw_regression(self):
        control = dict(raw=dict(accuracy=.7, macro_f1=.6), imported=dict(accuracy=.65, macro_f1=.55))
        good = dict(raw=dict(accuracy=.7, macro_f1=.6), imported=dict(accuracy=.66, macro_f1=.56))
        self.assertTrue(advance(control, good))
        self.assertFalse(advance(control, control))
        for mode in ("raw", "imported"):
            for metric in ("accuracy", "macro_f1"):
                candidate = copy.deepcopy(good)
                candidate[mode][metric] = control[mode][metric] - .001
                with self.subTest(mode=mode, metric=metric):
                    self.assertFalse(advance(control, candidate))


if __name__ == "__main__":
    unittest.main()
