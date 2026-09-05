import io
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

from PIL import Image

from audit_globe_photos import audit_photo, fetch_photo, inspect_image, select_photos, validate_url
from globe_gaze_data import CATEGORIES, DIRECTIONS
from test_globe_gaze_data import observation


class GlobePhotoAuditTests(unittest.TestCase):
    def test_selection_is_deterministic_balanced_and_observation_disjoint(self):
        records = []
        for category in CATEGORIES[:7]:
            for _ in range(8):
                row = observation()
                index = len(records)
                row["Observation Number"] = f"observation-{index}"
                for direction_index, direction in enumerate(DIRECTIONS):
                    row[f"{direction} Image URL"] = f"https://data.globe.gov/system/photos/2022/01/01/{index * 5 + direction_index}/original.jpg"
                    for label in CATEGORIES:
                        row[f"{direction} {label}"] = "1" if label == category else "0"
                records.append(row)
        selected = select_photos(records)
        self.assertEqual(selected, select_photos(list(reversed(records))))
        self.assertEqual(len(selected["photos"]), 42)
        self.assertEqual(len(selected["development_only_observation_ids"]), 42)
        self.assertIn("development-only", selected["scope"])
        for category in CATEGORIES[:7]:
            self.assertEqual(sum(row["source_category"] == category for row in selected["photos"]), 6)
        with self.assertRaisesRegex(ValueError, "Insufficient"):
            select_photos(records[:3])

    def test_untrusted_url_and_redirect_destinations_are_rejected(self):
        for url in ("http://data.globe.gov/system/photos/a.jpg", "https://example.com/system/photos/a.jpg",
                    "https://user@data.globe.gov/system/photos/a.jpg", "https://data.globe.gov/account",
                    "https://data.globe.gov/system/photos/a.jpg?private=1"):
            with self.assertRaises(ValueError):
                validate_url(url)

    def test_download_limit_removes_partial_and_existing_file_needs_no_network(self):
        encoded = io.BytesIO()
        Image.new("RGB", (4, 3), "blue").save(encoded, format="JPEG")
        row = {"url": "https://data.globe.gov/system/photos/2022/01/01/1/original.jpg"}

        def response():
            value = io.BytesIO(encoded.getvalue())
            value.url = row["url"]
            return value

        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "photo.jpg"
            with patch("audit_globe_photos.urllib.request.build_opener") as opener:
                opener.return_value.open.return_value = response()
                with self.assertRaisesRegex(ValueError, "budget"):
                    fetch_photo(row, path, 4)
                self.assertFalse(path.exists())
                self.assertFalse(path.with_suffix(".part").exists())
                opener.return_value.open.return_value = response()
                saved = fetch_photo(row, path, 10000)
                self.assertEqual(saved["dimensions"], [4, 3])
                opener.return_value.open.side_effect = AssertionError("Completed photo must not download again")
                self.assertEqual(fetch_photo(row, path, 10000), saved)

    def test_resuming_changed_or_corrupt_photo_preserves_original_evidence(self):
        row = {"url": "https://data.globe.gov/system/photos/2022/01/01/1/original.jpg"}
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "photo.jpg"
            Image.new("RGB", (4, 3), "blue").save(path, format="JPEG")
            original = audit_photo(row, path, 10000, {})
            Image.new("RGB", (4, 3), "red").save(path, format="JPEG")
            for _ in range(2):
                with self.assertRaisesRegex(ValueError, "Previously inspected photo changed"):
                    audit_photo(row, path, 10000, original)
                self.assertEqual(original["status"], "downloaded")
                self.assertNotEqual(original["sha256"], inspect_image(path)["sha256"])
            path.write_bytes(path.read_bytes()[:-20])
            with self.assertRaises(OSError):
                audit_photo(row, path, 10000, original)
            self.assertEqual(original["status"], "downloaded")
            self.assertEqual(audit_photo(row, path, 10000, {})["status"], "failed")


if __name__ == "__main__":
    unittest.main()
