import csv
import json
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest
from unittest.mock import patch

from build_expert_review import FIELDS, build_pack, digest
from compare_expert_reviews import compare_reviews, read_review, verify_pack
from labels import GENERA


class ReviewComparisonTests(unittest.TestCase):
    def setUp(self):
        self.temporary = tempfile.TemporaryDirectory()
        self.addCleanup(self.temporary.cleanup)
        self.root = Path(self.temporary.name)
        self.manifest = self.root / "manifest.json"
        self.pack = self.root / "pack"
        self.source = self.root / "source.jpg"
        self.source.write_bytes(b"synthetic checksum fixture, not a model example")
        rows = [{"id": f"{label}-{index}", "source": "imgw-2024-samples", "label": label,
                 "group": f"g-{label}-{index}", "split_group": f"day-{label}-{index}", "split": "train",
                 "path": str(self.source), "artifact_sha256": digest(self.source.read_bytes()),
                 "archive_name": f"original-{label}-{index}.jpg"}
                for label in range(len(GENERA)) for index in range(5)]
        self.manifest.write_text(json.dumps({"classes": GENERA, "rows": rows}))
        self.manifest_digest = digest(self.manifest.read_bytes())
        for module in ("build_expert_review", "compare_expert_reviews"):
            context = patch(f"{module}.MANIFEST_SHA256", self.manifest_digest)
            context.start()
            self.addCleanup(context.stop)
        build_pack(self.manifest, self.pack)
        self.items = json.loads((self.pack / "reviewer/images.json").read_text())["items"]

    def review(self, name, changes=None, reverse=False):
        rows = [{**item, **dict.fromkeys(FIELDS[3:], ""), **(changes or {}).get(index, {})}
                for index, item in enumerate(self.items)]
        path = self.root / f"{name}.csv"
        with path.open("w", encoding="utf-8-sig", newline="") as stream:
            writer = csv.DictWriter(stream, fieldnames=FIELDS, delimiter=";")
            writer.writeheader()
            writer.writerows(list(reversed(rows)) if reverse else rows)
        return name, path

    def compare(self, *reviews):
        return compare_reviews(self.manifest, self.pack, list(reviews))

    def test_blank_is_not_clear_and_one_review_cannot_confirm(self):
        blank = self.compare(self.review("a"))
        self.assertEqual(blank["summary"], {"not_reviewed": 33})
        self.assertEqual(blank["labels_applied"], 0)
        self.assertFalse(blank["training_ready"])
        self.assertTrue(all(item["proposed_label"] is None for item in blank["items"]))
        answer = self.review("b", {0: {"assessment": "single", "genera": "Cu", "comment": "Visible puffs"}})
        result = self.compare(answer)
        self.assertEqual(result["items"][0]["status"], "needs_second_review")
        self.assertIsNone(result["items"][0]["proposed_label"])

    def test_agreement_preserves_mixed_uncertain_and_unusable(self):
        values = [("single", "Cu", ""), ("clear", "", ""), ("mixed", "Cu|Ci", ""),
                  ("uncertain", "", "Ac|Sc"), ("unusable", "", "")]
        left, right = {}, {}
        for index, (assessment, genera, alternatives) in enumerate(values):
            left[index] = {"assessment": assessment, "genera": genera, "alternatives": alternatives,
                           "comment": "First independent observation; with a newline\nPreserve this."}
            right[index] = {**left[index], "genera": "|".join(reversed(genera.split("|"))),
                            "alternatives": "|".join(reversed(alternatives.split("|"))),
                            "comment": "Second observation"}
        result = self.compare(self.review("a", left), self.review("b", right, reverse=True))
        for index, (assessment, _, _) in enumerate(values):
            item = result["items"][index]
            self.assertEqual(item["status"], f"agreement_{assessment}")
            self.assertEqual(item["training_action"], "none")
            self.assertEqual(item["annotations"][0]["comment"], left[index]["comment"])
        self.assertEqual(result["items"][0]["proposed_label"], "cumulus")
        self.assertEqual(result["items"][1]["proposed_label"], "clear_sky")
        self.assertTrue(all(result["items"][index]["proposed_label"] is None for index in (2, 3, 4)))
        self.assertEqual(result["manifest_sha256"], self.manifest_digest)
        self.assertFalse(result["training_ready"])

    def test_disagreement_is_not_majority_vote_or_source_label_override(self):
        cu = {0: {"assessment": "single", "genera": "Cu", "comment": "First"}}
        ci = {0: {"assessment": "single", "genera": "Ci", "comment": "Second"}}
        cu2 = {0: {**cu[0], "comment": "Third"}}
        result = self.compare(self.review("a", cu), self.review("b", ci), self.review("c", cu2))
        item = result["items"][0]
        self.assertEqual(item["status"], "disagreement")
        self.assertEqual(item["completed_review_count"], 3)
        self.assertIsNone(item["proposed_label"])
        self.assertIsNone(item["matches_original"])

    def test_pending_third_review_is_not_silently_ignored(self):
        left = {0: {"assessment": "clear", "comment": "First"}}
        right = {0: {"assessment": "clear", "comment": "Second"}}
        result = self.compare(self.review("a", left), self.review("b", right), self.review("c"))
        self.assertEqual(result["items"][0]["status"], "awaiting_remaining_reviews")
        self.assertIsNone(result["items"][0]["proposed_label"])

    def test_duplicate_reviewers_files_and_copies_fail(self):
        a = self.review("a")
        b = self.review("b")
        for reviews in ((a, ("a", b[1])), (a, ("b", a[1])), (a, b), (("../private", a[1]),)):
            with self.subTest(reviews=reviews), self.assertRaises(ValueError):
                self.compare(*reviews)
        with self.assertRaises(ValueError):
            self.compare()

    def test_changed_pack_labels_order_or_photos_fail(self):
        key_path = self.pack / "PRIVATE-KEY-DO-NOT-SEND.json"
        original = key_path.read_bytes()
        key = json.loads(original)
        key["items"][0]["original_label"] = "invented"
        key_path.write_text(json.dumps(key))
        with self.assertRaisesRegex(ValueError, "frozen training sample"):
            verify_pack(self.manifest, self.pack)
        key_path.write_bytes(original)
        public_path = self.pack / "reviewer/images.json"
        public_raw = public_path.read_bytes()
        public = json.loads(public_raw)
        public["items"].reverse()
        public_path.write_text(json.dumps(public))
        with self.assertRaisesRegex(ValueError, "frozen training sample"):
            verify_pack(self.manifest, self.pack)
        public_path.write_bytes(public_raw)
        (self.pack / "reviewer/images/R001.jpg").write_bytes(b"changed")
        with self.assertRaisesRegex(ValueError, "photo checksum"):
            verify_pack(self.manifest, self.pack)

    def test_changed_source_or_manifest_fail(self):
        self.source.write_bytes(b"changed original")
        with self.assertRaisesRegex(ValueError, "photo checksum"):
            verify_pack(self.manifest, self.pack)
        self.manifest.write_text("{}")
        with self.assertRaisesRegex(ValueError, "manifest checksum"):
            verify_pack(self.manifest, self.pack)

    def test_review_sample_cannot_overlap_holdout_capture_day(self):
        manifest = json.loads(self.manifest.read_bytes())
        key = json.loads((self.pack / "PRIVATE-KEY-DO-NOT-SEND.json").read_bytes())
        selected_day = key["items"][0]["split_group"]
        manifest["rows"].append({**manifest["rows"][0], "id": "holdout", "group": "new",
                                 "split_group": selected_day, "split": "test"})
        self.manifest.write_text(json.dumps(manifest))
        changed_digest = digest(self.manifest.read_bytes())
        key["manifest_sha256"] = changed_digest
        (self.pack / "PRIVATE-KEY-DO-NOT-SEND.json").write_text(json.dumps(key))
        with patch("compare_expert_reviews.MANIFEST_SHA256", changed_digest):
            with self.assertRaisesRegex(ValueError, "non-training"):
                verify_pack(self.manifest, self.pack)

    def test_csv_schema_identity_and_truncated_rows_fail(self):
        _, path = self.review("a")
        raw = path.read_text(encoding="utf-8-sig")
        for changed in (raw.replace("photo_id", "photo_id;photo_id", 1),
                        raw.replace(";assessment", ",assessment", 1),
                        raw.replace("R001;", "R999;", 1),
                        "\n".join(raw.splitlines()[:-1]) + "\n",
                        raw.replace(";;;;\n", ";;;\n", 1)):
            path.write_text(changed)
            with self.subTest(changed=changed[:80]), self.assertRaises(ValueError):
                read_review(path, self.items)

    def test_comparison_does_not_mutate_inputs_or_create_files(self):
        review = self.review("a", {0: {"assessment": "uncertain", "comment": "Cannot establish height"}})
        before = {str(path): digest(path.read_bytes()) for path in self.root.rglob("*") if path.is_file()}
        self.compare(review)
        after = {str(path): digest(path.read_bytes()) for path in self.root.rglob("*") if path.is_file()}
        self.assertEqual(before, after)

    def test_cli_preserves_existing_result_before_reading_inputs(self):
        output = self.root / "result.json"
        output.write_text("previous result")
        result = subprocess.run([sys.executable, str(Path(__file__).with_name("compare_expert_reviews.py")),
                                 "--manifest", "absent", "--pack", "absent", "--review", "a=absent",
                                 "--output", str(output)], capture_output=True, text=True)
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("Refusing to overwrite", result.stderr)
        self.assertEqual(output.read_text(), "previous result")

    def test_cli_cannot_add_private_labels_to_blinded_folder(self):
        output = self.pack / "reviewer/answers.json"
        result = subprocess.run([sys.executable, str(Path(__file__).with_name("compare_expert_reviews.py")),
                                 "--manifest", "absent", "--pack", str(self.pack), "--review", "a=absent",
                                 "--output", str(output)], capture_output=True, text=True)
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("outside the blinded", result.stderr)
        self.assertFalse(output.exists())


if __name__ == "__main__":
    unittest.main()
