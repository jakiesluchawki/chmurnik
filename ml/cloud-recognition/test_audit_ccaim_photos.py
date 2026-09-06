import copy
import hashlib
import io
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

from PIL import Image

from audit_ccaim_metadata import REVISION
from audit_ccaim_photos import audit_photo, fetch_photo, possible_reuse, select_sample, validate_url
from labels import GENERA


def inventory():
    candidates = []
    for genus in GENERA[:-1]:
        for _ in range(8 if genus != "stratus" else 2):
            identifier = str(len(candidates))
            candidates.append({"image_id": identifier, "path": f"clouds_1/{identifier}.jpg",
                "sha256": hashlib.sha256(identifier.encode()).hexdigest(),
                "source_label": genus.capitalize(), "size": 1000})
    return {"revision": REVISION, "training_approved": False,
            "review_screen": {"candidates": candidates}}


class CcaimPhotoAuditTests(unittest.TestCase):
    def test_selection_order_is_fixed_and_rare_classes_are_not_duplicated(self):
        profile = inventory()
        selected = select_sample(profile)
        profile["review_screen"]["candidates"].reverse()
        self.assertEqual(select_sample(profile), selected)
        self.assertEqual(len(selected["photos"]), 56)
        self.assertEqual(selected["source_label_counts"]["Stratus"], 2)
        self.assertFalse(selected["training_approved"])
        self.assertFalse(selected["fresh_test_approved"])

    def test_malformed_and_repeated_candidates_are_rejected(self):
        for key, value in (("path", "../private.jpg"), ("size", -1), ("sha256", "g" * 64),
                           ("source_label", "Clear"), ("image_id", "absent")):
            profile = inventory()
            profile["review_screen"]["candidates"][0][key] = value
            with self.subTest(key=key), self.assertRaises(ValueError):
                select_sample(profile)
        profile = inventory()
        profile["review_screen"]["candidates"].append(copy.deepcopy(profile["review_screen"]["candidates"][0]))
        with self.assertRaises(ValueError):
            select_sample(profile)

    def test_changed_revision_and_oversized_selection_fail_before_download(self):
        profile = inventory()
        profile["revision"] = "main"
        with self.assertRaises(ValueError):
            select_sample(profile)
        profile = inventory()
        for row in profile["review_screen"]["candidates"]:
            row["size"] = 12_000_001
        with self.assertRaisesRegex(ValueError, "budget"):
            select_sample(profile)

    def test_redirects_reject_credentials_http_and_foreign_hosts(self):
        validate_url("https://cas-bridge.xethub.hf.co/path?signature=public-download")
        validate_url("https://us.aws.cdn.hf.co/path?signature=public-download")
        for url in ("http://huggingface.co/a", "https://huggingface.co.evil.example/a",
                    "https://user:secret@huggingface.co/a", "https://huggingface.co:81/a",
                    "https://example.com/a", "https://huggingface.co/a#fragment"):
            with self.subTest(url=url), self.assertRaises(ValueError):
                validate_url(url)

    def test_pinned_download_resume_integrity_and_byte_budget(self):
        encoded = io.BytesIO()
        Image.new("RGB", (4, 3), "blue").save(encoded, format="JPEG")
        data = encoded.getvalue()
        row = {"path": "clouds_1/1.jpg", "size": len(data), "sha256": hashlib.sha256(data).hexdigest()}

        def response():
            stream = io.BytesIO(data)
            stream.url = "https://cdn-lfs.hf.co/image.jpg"
            return stream

        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "C001.jpg"
            with patch("audit_ccaim_photos.urllib.request.build_opener") as opener:
                opener.return_value.open.return_value = response()
                with self.assertRaisesRegex(ValueError, "budget"):
                    fetch_photo({**row, "size": 4}, path)
                self.assertFalse(path.exists())
                self.assertFalse(path.with_suffix(".part").exists())
                opener.return_value.open.return_value = response()
                saved = audit_photo(row, path, {})
                self.assertEqual(saved["status"], "downloaded")
                self.assertEqual(saved["dimensions"], [4, 3])
                opener.return_value.open.side_effect = AssertionError("No repeat download")
                self.assertEqual(audit_photo(row, path, saved), saved)
                path.write_bytes(data[:-1])
                with self.assertRaisesRegex(ValueError, "size"):
                    audit_photo(row, path, saved)
                self.assertEqual(saved["status"], "downloaded")

    def test_hash_mismatch_is_not_an_accepted_photo(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "C001.jpg"
            path.write_bytes(b"not an image")
            result = audit_photo({"size": 12, "sha256": "a" * 64}, path, {})
            self.assertEqual(result, {"status": "failed", "error_type": "ValueError"})

    def test_existing_partial_download_is_preserved(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "C001.jpg"
            partial = path.with_suffix(".part")
            partial.write_bytes(b"earlier attempt")
            stream = io.BytesIO(b"unused")
            stream.url = "https://cdn-lfs.hf.co/image.jpg"
            with patch("audit_ccaim_photos.urllib.request.build_opener") as opener:
                opener.return_value.open.return_value = stream
                with self.assertRaises(FileExistsError):
                    fetch_photo({"path": "clouds_1/1.jpg", "size": 6, "sha256": "a" * 64}, path)
            self.assertEqual(partial.read_bytes(), b"earlier attempt")
            self.assertFalse(path.exists())

    def test_reuse_checks_all_roles_without_changing_their_labels(self):
        info = {"pixel_sha256": "a", "dhash": "0" * 64}
        prior = [{"id": "train", "split": "train", "pixel_sha256": "a", "dhash": "f" * 64},
                 {"id": "test", "split": "test", "pixel_sha256": "b", "dhash": "0" * 63 + "f"},
                 {"id": "unrelated", "split": "calibration", "pixel_sha256": "c", "dhash": "f" * 64}]
        sample = {"C001": {**info, "status": "downloaded"},
                  "C002": {**info, "status": "downloaded"}, "C003": {"status": "failed"}}
        original = copy.deepcopy(prior)
        matches = possible_reuse(info, prior, sample, "C001")
        self.assertEqual({row["id"] for row in matches}, {"train", "test", "C002"})
        self.assertEqual(matches[0]["exact_pixels"], True)
        self.assertEqual(matches[1]["exact_pixels"], False)
        self.assertEqual(prior, original)


if __name__ == "__main__":
    unittest.main()
