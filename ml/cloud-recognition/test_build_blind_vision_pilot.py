import copy
import hashlib
import json
from pathlib import Path
import tempfile
import unittest

from PIL import Image

from build_blind_vision_pilot import build, crop_geometry, select


class BlindVisionPilotTests(unittest.TestCase):
    def fixture(self):
        rows = [{"id": f"{label}-{n}", "label": label, "split": "test",
                 "source": "fixture", "group": f"g{label}-{n}", "confidence": n / 3}
                for label in range(2) for n in range(3)]
        return {"classes": ["x", "y"], "rows": rows}, {"rows": copy.deepcopy(rows)}

    def test_selection_is_order_and_prediction_independent(self):
        manifest, baseline = self.fixture()
        expected = select(manifest, baseline)
        manifest["rows"].reverse()
        for row in baseline["rows"]:
            row.update(top1="different", confidence=0)
        self.assertEqual(select(manifest, baseline), expected)
        self.assertEqual(len({row["group"] for row in expected}), 4)

    def test_missing_baseline_role_and_groups_fail_closed(self):
        for change in ("missing", "role", "group"):
            manifest, baseline = self.fixture()
            if change == "missing":
                baseline["rows"] = []
            elif change == "role":
                for row in baseline["rows"]:
                    row["split"] = "train"
            else:
                for row in manifest["rows"] + baseline["rows"]:
                    row["group"] = "one"
            with self.assertRaises(ValueError):
                select(manifest, baseline)

    def test_pack_preserves_full_pixels_and_hides_comparison(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            manifest, baseline = self.fixture()
            for i, row in enumerate(manifest["rows"]):
                image = Image.new("RGB", (80, 60), (i * 20, 110, 210))
                source = root / f"source-{i}.png"
                image.save(source)
                row.update(path=str(source), pixel_sha256=hashlib.sha256(image.tobytes() + str(image.size).encode()).hexdigest())
            mp, bp = root / "manifest.json", root / "baseline.json"
            mp.write_text(json.dumps(manifest))
            baseline.update(manifest_sha256=hashlib.sha256(mp.read_bytes()).hexdigest(), preprocessing="Native UIKit/Vision fixture")
            bp.write_text(json.dumps(baseline))
            output = root / "pilot"
            result = build(mp, bp, output)
            self.assertFalse(result["training_ready"])
            for arm in ("a", "b"):
                content = json.loads((output / arm / "images.json").read_text())
                self.assertEqual(len(content), 4)
                self.assertEqual(set(content[0]), {"photo_id", "image_file", "sha256", "size"})
            with Image.open(output / "a/P001.png") as full, Image.open(output / "b/P001.png") as crop:
                self.assertEqual(full.size, (80, 60))
                self.assertEqual(crop.size, (54, 54))
                self.assertEqual(crop.tobytes(), crop_geometry(full).tobytes())
            with self.assertRaises(FileExistsError):
                build(mp, bp, output)
            manifest["rows"][0]["pixel_sha256"] = "changed"
            mp.write_text(json.dumps(manifest))
            with self.assertRaisesRegex(ValueError, "hash mismatch"):
                build(mp, bp, root / "bad")


if __name__ == "__main__":
    unittest.main()
