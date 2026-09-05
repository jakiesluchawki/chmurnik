import copy
import hashlib
import json
from pathlib import Path
import tempfile
import unittest

from PIL import Image

from audit_ccaim_metadata import compare_previous, load_pinned, profile, screen_for_review, unique_object
from v4_data import image_fingerprint


def image(identifier, digest="a" * 64, size=10):
    return {"type": "file", "path": f"clouds_1/{identifier}.jpg", "size": size,
            "lfs": {"oid": digest, "size": size}}


class CcaimMetadataTests(unittest.TestCase):
    def test_conflicts_are_reported_without_relabelling(self):
        labels = {"0": "Stratus", "1": "Cumulus"}
        tree = [image("0"), image("1")]
        original = copy.deepcopy((labels, tree))
        report = profile(labels, tree)
        self.assertEqual(report["conflicting_groups"], 1)
        self.assertEqual(report["unique_lfs_hashes"], 1)
        self.assertEqual(report["duplicate_groups"][0]["labels"], ["Cumulus", "Stratus"])
        self.assertFalse(report["training_approved"])
        self.assertEqual(report["labels_applied"], 0)
        self.assertEqual((labels, tree), original)

    def test_same_label_duplicates_do_not_become_independent_images(self):
        report = profile({"0": "Cumulus", "1": "Cumulus"}, [image("0"), image("1")])
        self.assertEqual(report["conflicting_groups"], 0)
        self.assertEqual(len(report["duplicate_groups"]), 1)

    def test_unlabelled_is_not_clear_sky_or_a_forced_genus(self):
        report = profile({"0": "Cumulus"}, [image("0"), image("591", "b" * 64)])
        self.assertEqual(report["unlabelled_ids"], ["591"])
        self.assertEqual(report["label_counts"], {"Cumulus": 1})

    def test_rejects_missing_image_unknown_label_or_repeated_path(self):
        for labels, tree in [({"1": "Cumulus"}, [image("0")]),
                             ({"0": "Clear"}, [image("0")]),
                             ({"0": "Cumulus"}, [image("0"), image("0")])]:
            with self.subTest(labels=labels, tree=tree), self.assertRaises(ValueError):
                profile(labels, tree)

    def test_rejects_bad_path_hash_and_conflicting_sizes(self):
        bad_path = image("../0")
        bad_hash = image("0", "not-a-hash")
        bad_size = image("0")
        bad_size["lfs"]["size"] = 11
        for tree in [[bad_path], [bad_hash], [bad_size], [image("0"), image("1", size=11)]]:
            with self.subTest(tree=tree), self.assertRaises(ValueError):
                profile({"0": "Cumulus"}, tree)

    def test_json_cannot_silently_override_an_annotation(self):
        with self.assertRaisesRegex(ValueError, "Duplicate JSON key"):
            json.loads('{"0":"Cumulus","0":"Stratus"}', object_pairs_hook=unique_object)

    def test_pinned_source_rejects_modified_bytes(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "labels.json"
            original = b'{"0":"Cumulus"}'
            path.write_bytes(original)
            digest = hashlib.sha256(original).hexdigest()
            self.assertEqual(load_pinned(path, digest), {"0": "Cumulus"})
            path.write_bytes(b'{"0":"Stratus"}')
            with self.assertRaisesRegex(ValueError, "Changed source"):
                load_pinned(path, digest)

    def test_previous_overlap_uses_actual_bytes_and_keeps_conflicting_labels(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "old.jpg"
            Image.new("RGB", (8, 8), "blue").save(path)
            data = path.read_bytes()
            digest = hashlib.sha256(data).hexdigest()
            manifest = {"rows": [{"id": "old-0", "source": "ccaim-old", "path": str(path),
                                  "pixel_sha256": image_fingerprint(path)[0]},
                                 {"source": "unrelated"}]}
            tree = [image("2", digest, len(data)), image("10", digest, len(data))]
            report = compare_previous(manifest, tree, {"2": "Cumulus", "10": "Stratus"})
            self.assertEqual(report["previous_image_count"], 1)
            self.assertEqual(report["matched_image_count"], 1)
            self.assertEqual(report["matches"][0]["current_ids"], ["2", "10"])
            self.assertEqual(report["matches"][0]["current_labels"], ["Cumulus", "Stratus"])
            self.assertEqual(path.read_bytes(), data)

    def test_changed_previous_pixels_are_rejected(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "old.jpg"
            Image.new("RGB", (8, 8), "blue").save(path)
            manifest = {"rows": [{"id": "old-0", "source": "ccaim-old", "path": str(path),
                                  "pixel_sha256": image_fingerprint(path)[0]}]}
            Image.new("RGB", (8, 8), "red").save(path)
            with self.assertRaisesRegex(ValueError, "no longer matches the frozen manifest"):
                compare_previous(manifest, [], {})

    def test_unmatched_bytes_are_not_claimed_to_be_new_photos(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "old.jpg"
            Image.new("RGB", (8, 8), "blue").save(path)
            manifest = {"rows": [{"id": "old-0", "source": "ccaim-old", "path": str(path),
                                  "pixel_sha256": image_fingerprint(path)[0]}]}
            report = compare_previous(manifest, [image("0")], {"0": "Cumulus"})
            self.assertEqual(report["previous_image_count"], 1)
            self.assertEqual(report["matched_image_count"], 0)
            self.assertIn("near-duplicate", report["limitation"])

    def test_review_screen_excludes_overlap_conflicts_and_unlabelled_photos(self):
        labels = {"0": "Cumulus", "1": "Stratus", "2": "Cumulus",
                  "3": "Cirrus", "10": "Cirrus"}
        tree = [image("0"), image("1", "b" * 64), image("2", "b" * 64),
                image("10", "c" * 64), image("3", "c" * 64), image("591", "d" * 64)]
        original = copy.deepcopy((labels, tree))
        overlap = {"matches": [{"sha256": "a" * 64}]}
        report = screen_for_review(labels, tree, overlap)
        self.assertEqual(report["unique_published_hashes"], 1)
        self.assertEqual(report["source_label_counts"], {"Cirrus": 1})
        self.assertEqual(report["candidates"][0]["image_id"], "3")
        self.assertEqual(report["total_bytes"], 10)
        self.assertFalse(report["training_approved"])
        self.assertFalse(report["fresh_test_approved"])
        self.assertEqual(screen_for_review(labels, list(reversed(tree)), overlap), report)
        self.assertEqual((labels, tree), original)


if __name__ == "__main__":
    unittest.main()
