import hashlib
import io
import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

try:
    import cv2
except ModuleNotFoundError as error:
    if error.name != "cv2":
        raise
    raise unittest.SkipTest("Crop-audit tests require requirements-photo-audit.txt") from error
import numpy as np
from PIL import Image, ImageDraw

from audit_crop_reuse import compare, configure, features, load_previous, load_sample


def scene(seed=42):
    rng = np.random.default_rng(seed)
    pixels = rng.integers(30, 225, (600, 800), dtype=np.uint8)
    pixels = cv2.GaussianBlur(pixels, (9, 9), 2)
    image = Image.fromarray(pixels)
    draw = ImageDraw.Draw(image)
    for _ in range(120):
        x, y = rng.integers(0, 760), rng.integers(0, 560)
        radius = int(rng.integers(4, 25))
        draw.ellipse((int(x), int(y), int(x) + radius, int(y) + radius), fill=int(rng.integers(0, 255)))
    return image


class CropReuseTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        configure()
        cls.original = scene()
        cls.prepared = features(cls.original)

    def test_crop_resize_and_jpeg_recompression(self):
        crop = self.original.crop((100, 75, 700, 525)).resize((510, 383))
        encoded = io.BytesIO()
        crop.save(encoded, format="JPEG", quality=80)
        encoded.seek(0)
        with Image.open(encoded) as image:
            result = compare(self.prepared, features(image))
        self.assertEqual(result["status"], "candidate", result)
        self.assertGreater(result["inliers"], 18)

    def test_brightness_change_and_reverse_direction(self):
        crop = np.array(self.original.crop((80, 50, 750, 550)), dtype=np.float32)
        second = features(Image.fromarray(np.uint8(crop * 0.8 + 15)))
        self.assertEqual(compare(second, self.prepared)["status"], "candidate")

    def test_unrelated_structured_scenes_are_not_matches(self):
        self.assertEqual(compare(self.prepared, features(scene(44)))["status"], "not_flagged")

    def test_uniform_and_repetitive_skies_are_not_proven_duplicates(self):
        for image in (Image.new("L", (800, 600), 128),
                      Image.fromarray(np.uint8((np.indices((600, 800)).sum(axis=0) // 20 % 2) * 200))):
            result = compare(features(image), features(image.copy()))
            self.assertEqual(result["status"], "not_flagged", result)

    def test_small_shared_overlay_is_not_a_shared_photograph(self):
        second = scene(91)
        second.paste(self.original.crop((0, 0, 220, 150)), (0, 0))
        self.assertEqual(compare(self.prepared, features(second))["status"], "not_flagged")

    def test_good_local_features_do_not_override_different_aligned_pixels(self):
        second = self.original.copy()
        ImageDraw.Draw(second).rectangle((0, 250, 800, 600), fill=10)
        result = compare(self.prepared, features(second))
        self.assertEqual(result["status"], "not_flagged", result)
        self.assertEqual(result["reason"], "different_aligned_pixels")

    def test_sample_receipts_and_paths_fail_closed(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            (root / "photos").mkdir()
            path = root / "photos/C001.jpg"
            self.original.save(path)
            digest = hashlib.sha256(path.read_bytes()).hexdigest()
            row = {"audit_id": "C001", "sha256": digest, "size": path.stat().st_size, "source_label": "Cumulus"}
            selection = {"training_approved": False, "fresh_test_approved": False, "photos": [row]}
            (root / "selection.json").write_text(json.dumps(selection))
            (root / "downloads.json").write_text(json.dumps({"C001": {"status": "downloaded", "sha256": digest}}))
            self.assertEqual(set(load_sample(root)[0]), {"C001"})
            path.write_bytes(b"changed")
            with self.assertRaisesRegex(ValueError, "receipt"):
                load_sample(root)
            row["audit_id"] = "../outside"
            (root / "selection.json").write_text(json.dumps(selection))
            with self.assertRaisesRegex(ValueError, "IDs"):
                load_sample(root)

    def test_previous_source_checks_all_roles_and_preserves_duplicate_aliases(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            image = root / "photo.jpg"
            self.original.save(image)
            digest = hashlib.sha256(image.read_bytes()).hexdigest()
            rows = [{"id": f"old-{split}", "source": "ccaim-old", "path": str(image),
                     "split": split, "label": 0} for split in ("train", "stress")]
            manifest, profile = root / "manifest.json", root / "profile.json"
            manifest.write_text(json.dumps({"rows": rows}))
            profile.write_text(json.dumps({"previous_overlap": {"matches": [
                {"previous_id": row["id"], "sha256": digest} for row in rows]}}))
            with patch("audit_crop_reuse.MANIFEST_SHA256", hashlib.sha256(manifest.read_bytes()).hexdigest()), \
                    patch("audit_crop_reuse.PROFILE_SHA256", hashlib.sha256(profile.read_bytes()).hexdigest()):
                prepared, receipt = load_previous(manifest, profile)
                self.assertEqual(len(prepared), 1)
                self.assertEqual(receipt["rows"], 2)
                self.assertEqual({r["split"] for r in receipt["photos"][0]["aliases"]}, {"train", "stress"})
                image.write_bytes(b"changed")
                with self.assertRaisesRegex(ValueError, "pinned"):
                    load_previous(manifest, profile)
                profile.write_text("{}")
                with self.assertRaisesRegex(ValueError, "Changed source"):
                    load_previous(manifest, profile)


if __name__ == "__main__":
    unittest.main()
