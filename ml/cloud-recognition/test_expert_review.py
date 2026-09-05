import csv
import hashlib
import io
import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch
import zipfile

from build_expert_review import GENERA, build_pack, select_sample, validate_review


class ExpertReviewTests(unittest.TestCase):
    def rows(self):
        return [{"id": f"{label}-{index}", "source": "imgw-2024-samples", "label": label,
                 "group": f"group-{label}-{index}", "split_group": f"day-{label}-{index}", "split": "train"}
                for label in range(len(GENERA)) for index in range(5)]

    def test_selection_is_deterministic_training_only_and_unique(self):
        rows = self.rows()
        selected = select_sample(rows)
        self.assertEqual(selected, select_sample(list(reversed(rows))))
        self.assertEqual(len(selected), 33)
        self.assertEqual(len({row["split_group"] for row in selected}), 33)
        for label in range(len(GENERA)):
            self.assertEqual(sum(row["label"] == label for row in selected), 3)
        extra = {**rows[0], "id": "holdout", "group": "other", "split_group": "other", "split": "test"}
        self.assertEqual(selected, select_sample(rows + [extra]))

    def test_missing_groups_and_cross_split_overlap_fail_closed(self):
        rows = self.rows()
        selected = select_sample(rows)
        with self.assertRaisesRegex(ValueError, "overlaps"):
            select_sample(rows + [{**selected[0], "id": "leak", "split": "test"}])
        for row in rows:
            if row["label"] == 0:
                row["split"] = "validation"
        with self.assertRaisesRegex(ValueError, "Insufficient"):
            select_sample(rows)

    def test_review_keeps_unknown_blank_and_mixed_distinct(self):
        base = {"photo_id": "R001", "image_file": "images/R001.jpg", "image_sha256": "abc"}
        self.assertEqual(validate_review([base], [base]), {"not_reviewed": 1})
        for assessment, genera, alternatives in [("single", "Cu", ""), ("mixed", "Cu|Ci", ""),
                                                  ("uncertain", "", "Ac|Sc"), ("clear", "", ""),
                                                  ("unusable", "", "")]:
            answer = {**base, "assessment": assessment, "genera": genera, "alternatives": alternatives,
                      "comment": "Independent visible evidence"}
            self.assertEqual(validate_review([answer], [base]), {assessment: 1})

    def test_bad_identity_and_forced_or_incomplete_labels_are_rejected(self):
        base = {"photo_id": "R001", "image_file": "images/R001.jpg", "image_sha256": "abc"}
        for changes in [{"image_sha256": "changed"}, {"assessment": "single"},
                        {"assessment": "mixed", "genera": "Cu", "comment": "x"},
                        {"assessment": "uncertain", "genera": "Cu", "comment": "x"},
                        {"assessment": "clear", "alternatives": "Ci", "comment": "x"},
                        {"assessment": "single", "genera": "Cu|Cu", "comment": "x"},
                        {"genera": "Cu"}]:
            with self.subTest(changes=changes), self.assertRaises(ValueError):
                validate_review([{**base, **changes}], [base])
        with self.assertRaises(ValueError):
            validate_review([base, base], [base])
        with self.assertRaises(ValueError):
            validate_review([], [base])

    def test_zip_contains_only_blinded_photos_blank_answers_and_attribution(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            photo = root / "source.jpg"
            photo.write_bytes(b"fixture image bytes")
            rows = self.rows()
            for row in rows:
                row.update(path=str(photo), artifact_sha256=hashlib.sha256(photo.read_bytes()).hexdigest(),
                           archive_name=f"original-secret-{row['id']}.jpg")
            manifest = root / "manifest.json"
            manifest.write_text(json.dumps({"classes": GENERA, "rows": rows}))
            with patch("build_expert_review.MANIFEST_SHA256", hashlib.sha256(manifest.read_bytes()).hexdigest()):
                result = build_pack(manifest, root / "pack")
            self.assertTrue((root / "pack/PRIVATE-KEY-DO-NOT-SEND.json").exists())
            with zipfile.ZipFile(result["zip"]) as archive:
                self.assertIsNone(archive.testzip())
                self.assertEqual(len(archive.namelist()), 37)
                self.assertFalse(any("PRIVATE" in name or "secret" in name for name in archive.namelist()))
                public = json.loads(archive.read("CHMURNIK-ocena/images.json"))
                self.assertEqual(public["attribution"]["license"], "CC BY 4.0")
                for item in public["items"]:
                    self.assertEqual(set(item), {"photo_id", "image_file", "image_sha256"})
                answers = list(csv.DictReader(io.StringIO(archive.read("CHMURNIK-ocena/ocena.csv").decode("utf-8-sig")), delimiter=";"))
                self.assertEqual(validate_review(answers, public["items"]), {"not_reviewed": 33})
            with patch("build_expert_review.MANIFEST_SHA256", hashlib.sha256(manifest.read_bytes()).hexdigest()):
                with self.assertRaisesRegex(ValueError, "overwrite"):
                    build_pack(manifest, root / "pack")


if __name__ == "__main__":
    unittest.main()
