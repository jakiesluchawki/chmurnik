"""Source auditing must not silently accept unsafe files or ambiguous reuse."""

import hashlib
import io
import stat
import unittest
from unittest.mock import patch
import zipfile

from PIL import Image

import audit_howard_source as audit


PATH = "Howard-Cloud-X/train/Cumulus/example.jpg"


class HowardAuditTests(unittest.TestCase):
    def archive(self, names):
        buffer = io.BytesIO()
        with zipfile.ZipFile(buffer, "w") as archive:
            for name in names:
                archive.writestr(name, b"photo")
        return zipfile.ZipFile(buffer)

    def test_valid_inventory(self):
        with self.archive([PATH]) as archive:
            self.assertEqual([r.filename for r in audit.members(archive)], [PATH])

    def test_rejects_unsafe_paths_and_nonimages(self):
        for name in ["../photo.jpg", "/photo.jpg", PATH.replace("train/", "train/../"),
                     PATH.replace("train/", "train//"), PATH.replace("/", "\\"),
                     PATH.replace("example.jpg", "run.py"), PATH.replace("Cumulus", "Unknown")]:
            with self.subTest(name=name), self.archive([name]) as archive:
                with self.assertRaises(ValueError):
                    audit.members(archive)

    def test_rejects_duplicate_symlink_and_encryption(self):
        import warnings
        with warnings.catch_warnings():
            warnings.simplefilter("ignore", UserWarning)
            with self.archive([PATH, PATH]) as archive:
                with self.assertRaises(ValueError):
                    audit.members(archive)
        with self.archive([PATH]) as archive:
            archive.infolist()[0].external_attr = (stat.S_IFLNK | 0o777) << 16
            with self.assertRaises(ValueError):
                audit.members(archive)
        with self.archive([PATH]) as archive:
            archive.infolist()[0].flag_bits |= 1
            with self.assertRaises(ValueError):
                audit.members(archive)

    def test_enforces_both_byte_budgets_and_entry_limit(self):
        for limit, value in [("MAX_MEMBER", 4), ("MAX_TOTAL", 4), ("MAX_ENTRIES", 0)]:
            with self.subTest(limit=limit), self.archive([PATH]) as archive:
                with patch.object(audit, limit, value), self.assertRaises(ValueError):
                    audit.members(archive)

    def test_pixel_receipt_matches_known_rgb(self):
        image = Image.new("RGB", (17, 16), (20, 40, 60))
        buffer = io.BytesIO()
        image.save(buffer, format="PNG")
        result = audit.inspect_pixels(buffer.getvalue())
        self.assertEqual(result["pixel_sha256"], hashlib.sha256(image.tobytes() + b"(17, 16)").hexdigest())
        self.assertEqual(result["dhash"], "0" * 64)
        with patch.object(audit, "MAX_PIXELS", 100), self.assertRaises(ValueError):
            audit.inspect_pixels(buffer.getvalue())

    def test_nonimage_and_animation_not_admitted(self):
        with self.assertRaises(OSError):
            audit.inspect_pixels(b"not an image")
        buffer = io.BytesIO()
        Image.new("RGB", (20, 20)).save(buffer, format="GIF")
        with self.assertRaises(ValueError):
            audit.inspect_pixels(buffer.getvalue())

    def test_reference_original_and_retained_evidence_remain_distinct(self):
        row = {"status": "decoded", "sha256": "original", "pixel_sha256": "pixels", "dhash": "0"}
        ref = {"id": "r", "source": "source", "split": "confirmatory", "label": 2,
               "retained_sha256": "derivative", "original_sha256": "original",
               "retained_pixel_sha256": "different", "original_pixel_sha256": "pixels",
               "retained_dhash": "ffff", "original_dhash": "ffff"}
        match = audit.compare_references(row, [ref])[0]
        self.assertTrue(match["exact_file"])
        self.assertTrue(match["exact_pixels"])
        self.assertEqual(match["split"], "confirmatory")
        ref.update(original_sha256=None, original_pixel_sha256="another", original_dhash="ff")
        match = audit.compare_references(row, [ref])[0]
        self.assertFalse(match["exact_file"])
        self.assertFalse(match["exact_pixels"])
        self.assertEqual(match["dhash_distance"], 8)
        ref["original_dhash"] = "1ff"
        self.assertEqual(audit.compare_references(row, [ref]), [])
        self.assertEqual(audit.compare_references({"status": "failed"}, [ref]), [])

    def test_internal_conflicts_are_reported_not_resolved(self):
        rows = [{"id": "a", "status": "decoded", "pixel_sha256": "same", "source_label": "Cirrus", "source_split": "train"},
                {"id": "b", "status": "decoded", "pixel_sha256": "same", "source_label": "Stratus", "source_split": "test"},
                {"id": "c", "status": "failed"}]
        groups = audit.duplicate_groups(rows)
        self.assertEqual(len(groups), 1)
        self.assertTrue(groups[0]["cross_label"])
        self.assertTrue(groups[0]["cross_split"])

    def test_sample_is_order_invariant_and_keeps_failures(self):
        rows = [{"id": str(i), "sha256": str(i), "source_label": "Cumulus", "status": "failed"} for i in range(8)]
        chosen = audit.sample_rows(rows)
        self.assertEqual(chosen, audit.sample_rows(list(reversed(rows))))
        self.assertEqual(len(chosen), 6)
        self.assertTrue(all(row["status"] == "failed" for row in chosen))


if __name__ == "__main__":
    unittest.main()
