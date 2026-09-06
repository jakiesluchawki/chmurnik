import csv
import hashlib
import json
import math
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

import numpy as np
from PIL import Image
import torch

from labels import GENERA
from probe_vienna_bags import SOURCE_SHA256, REVIEW_FIELDS, admitted_bags, bag_loss, extract, sha, verified_views
from v4_data import image_fingerprint
from vienna_bags import constraints


class BagLossTests(unittest.TestCase):
    def test_uniform_singleton_union_and_clear(self):
        logits = torch.zeros(1, 4, len(GENERA), dtype=torch.float64)
        for groups, expected in (([["cumulus"]], math.log(11)),
                                 ([["altostratus", "nimbostratus"]], math.log(11 / 2)),
                                 ([["clear_sky"]], math.log(11))):
            self.assertAlmostEqual(bag_loss(logits, [groups]).item(), expected)

    def test_positive_selects_one_view_not_every_view(self):
        logits = torch.zeros(1, 4, len(GENERA), dtype=torch.float64)
        label = GENERA.index("cumulus")
        logits[0, 2, label] = 3
        logits.requires_grad_()
        loss = bag_loss(logits, [[["cumulus"]]])
        self.assertAlmostEqual(loss.item(), -logits.log_softmax(-1)[0, 2, label].item())
        loss.backward()
        self.assertTrue(torch.equal(logits.grad[0, [0, 1, 3]], torch.zeros(3, len(GENERA), dtype=torch.float64)))
        self.assertLess(logits.grad[0, 2, label], 0)

    def test_union_sums_classes_before_view_max(self):
        logits = torch.zeros(1, 4, len(GENERA), dtype=torch.float64)
        a, b = GENERA.index("altostratus"), GENERA.index("nimbostratus")
        logits[0, 0, a] = 2
        logits[0, 1, [a, b]] = 1.8
        expected = -logits.softmax(-1)[0, :, [a, b]].sum(-1).max().log()
        self.assertAlmostEqual(bag_loss(logits, [[["altostratus", "nimbostratus"]]]).item(), expected.item())

    def test_each_bag_has_equal_weight_despite_multiple_events(self):
        logits = torch.arange(88, dtype=torch.float64).reshape(2, 4, 11) / 17
        first, second = [["cumulus"], ["stratocumulus"]], [["cirrus"]]
        expected = (bag_loss(logits[:1], [first]) + bag_loss(logits[1:], [second])) / 2
        self.assertAlmostEqual(bag_loss(logits, [first, second]).item(), expected.item())

    def test_clear_requires_all_four_views(self):
        logits = torch.arange(44, dtype=torch.float64).reshape(1, 4, 11) / 7
        label = GENERA.index("clear_sky")
        expected = torch.nn.functional.cross_entropy(logits[0], torch.full((4,), label))
        self.assertAlmostEqual(bag_loss(logits, [[["clear_sky"]]]).item(), expected.item())

    def test_repeated_views_do_not_artificially_increase_evidence(self):
        single = torch.linspace(-1, 2, 11, dtype=torch.float64)
        logits = single.reshape(1, 1, 11).expand(1, 4, 11)
        expected = -single.log_softmax(-1)[GENERA.index("cirrus")]
        self.assertAlmostEqual(bag_loss(logits, [[["cirrus"]]]).item(), expected.item())
        self.assertTrue(torch.equal(bag_loss(logits, [[["cirrus"]]]),
                                    bag_loss(logits[:, [3, 1, 0, 2]], [[["cirrus"]]])))

    def test_extreme_logits_are_finite_and_invalid_inputs_fail(self):
        logits = torch.full((1, 4, 11), -10000.)
        logits[:, :, GENERA.index("clear_sky")] = 10000
        self.assertEqual(bag_loss(logits, [[["cumulus"]]]).item(), 20000.)
        for groups in ([], [[]], [["invalid"]], [["cumulus", "cumulus"]],
                       [["clear_sky", "cumulus"]], [["clear_sky"], ["cumulus"]]):
            with self.assertRaises(ValueError):
                bag_loss(logits, [groups])
        for invalid in (logits[:, :3], logits[:, :, :10], logits * float("nan"), logits[:0]):
            with self.assertRaises(ValueError):
                bag_loss(invalid, [[["cumulus"]]])


class AdmissionTests(unittest.TestCase):
    def setUp(self):
        self.directory = tempfile.TemporaryDirectory()
        self.addCleanup(self.directory.cleanup)
        self.path = Path(self.directory.name)
        codes = ((1, 0, 0), (3, 0, 0), (4, 0, 0), (6, 0, 0),
                 (0, 1, 0), (0, 3, 0), (0, 0, 1), (0, 0, 5))
        self.bags = [{"id": f"V{i:05d}", "row_index": i, "sha256": f"sha{i}", "codes": list(codes[i // 16]),
                      "events": [list(event) for event in constraints(codes[i // 16])],
                      "bucket": "+".join(constraints(codes[i // 16])[0]), "split": "auxiliary-train"}
                     for i in range(128)]
        self.reviews = [{"id": row["id"], "sha256": row["sha256"], "action": "include",
                         "note": "Synthetic technical review"} for row in self.bags]
        verification = patch("probe_vienna_bags.verified_views", return_value=[])
        overlap = patch("probe_vienna_bags.overlapping_bags", return_value={})
        self.verified = verification.start()
        self.overlap = overlap.start()
        self.addCleanup(verification.stop)
        self.addCleanup(overlap.stop)
        self.write()

    def admit(self):
        return admitted_bags(self.path, [])

    def write(self, overlap=None):
        (self.path / "bags.json").write_text(json.dumps(self.bags))
        (self.path / "selection.json").write_text(json.dumps({"seed": 6042, "source_sha256": SOURCE_SHA256,
            "rows": [{key: value for key, value in row.items() if key != "sha256"} for row in self.bags]}))
        (self.path / "overlap.json").write_text(json.dumps(overlap or {}))
        self.overlap.return_value = overlap or {}
        with (self.path / "reviews.csv").open("w", newline="") as stream:
            writer = csv.DictWriter(stream, fieldnames=REVIEW_FIELDS)
            writer.writeheader()
            writer.writerows(self.reviews)

    def test_source_order_and_both_exclusion_paths(self):
        self.reviews[0]["action"] = "exclude_unusable"
        self.reviews.reverse()
        self.write({"V00001": [{"distance": 0}]})
        self.assertEqual(self.admit(), self.bags[2:])

    def test_bag_count_and_bucket_coverage_are_separate_requirements(self):
        for row in self.reviews[:9]:
            row["action"] = "exclude_unusable"
        self.write()
        with self.assertRaisesRegex(ValueError, "minimum"):
            self.admit()
        for row in self.reviews:
            row["action"] = "include"
        for row in self.bags:
            row.update(codes=[1, 0, 0], events=[["cumulus"]], bucket="cumulus")
        self.write()
        with self.assertRaisesRegex(ValueError, "minimum"):
            self.admit()

    def test_unknown_layer_and_exact_source_constraints_preserved(self):
        self.bags[0]["codes"] = [1, None, None]
        self.write()
        self.assertEqual(len(self.admit()), 128)
        self.bags[0]["events"].append(["cirrus"])
        self.write()
        with self.assertRaisesRegex(ValueError, "constraint"):
            self.admit()

    def test_reviews_fail_closed_for_missing_duplicate_and_unfinished(self):
        original = self.reviews[0].copy()
        for changes in ({"sha256": "wrong"}, {"action": ""}, {"note": " "}, {"id": "V00001"}):
            self.reviews[0] = {**original, **changes}
            self.write()
            with self.assertRaises(ValueError):
                self.admit()
        self.reviews = self.reviews[1:]
        self.write()
        with self.assertRaises(ValueError):
            self.admit()

    def test_selection_mismatch_cannot_become_a_new_recipe(self):
        self.bags[0].update(codes=[0, 0, 0], events=[["clear_sky"]], bucket="clear_sky")
        (self.path / "bags.json").write_text(json.dumps(self.bags))
        with self.assertRaisesRegex(ValueError, "selection"):
            self.admit()
        self.bags[0]["row_index"] = 1000000
        self.write()
        with self.assertRaisesRegex(ValueError, "source row"):
            self.admit()

    def test_overlap_is_recomputed_for_current_manifest(self):
        original = [{"id": "old", "pixel_sha256": "same", "dhash": "0"}]
        self.verified.return_value = [{"id": "V00000-0", "bag_id": "V00000", "pixel_sha256": "same", "dhash": "0"}]
        self.overlap.return_value = {"V00000": [{"other": "old", "distance": 0}]}
        with self.assertRaisesRegex(ValueError, "Overlap report"):
            admitted_bags(self.path, original)
        self.overlap.assert_called_with(self.verified.return_value, original)


class FeatureCacheTests(unittest.TestCase):
    def test_resume_binds_pixels_bag_order_recipe_and_tensor(self):
        class Model:
            calls = 0

            def features(self, batch):
                self.calls += 1
                return batch.mean((1, 2, 3))[:, None].expand(-1, 768).clone()

        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory)
            (path / "photos").mkdir()
            bags, views = [], []
            for i in range(3):
                bag_id, images = f"V{i:05d}", []
                for view in range(4):
                    values = np.full((64, 100, 3), 10 * i + view, dtype=np.uint8)
                    images.append(values)
                    name = f"{bag_id}-{view}"
                    photo = path / "photos" / f"{name}.png"
                    Image.fromarray(values).save(photo)
                    pixel, dhash = image_fingerprint(photo)
                    views.append({"id": name, "bag_id": bag_id, "sha256": sha(photo),
                                  "pixel_sha256": pixel, "dhash": f"{dhash:064x}"})
                bags.append({"id": bag_id, "sha256": hashlib.sha256(np.stack(images).tobytes()).hexdigest()})
            (path / "views.json").write_text(json.dumps(views))
            self.assertEqual(verified_views(path, bags), views)
            changed_views = [dict(row) for row in views]
            changed_views[0]["dhash"] = "f" * 64
            (path / "views.json").write_text(json.dumps(changed_views))
            with self.assertRaisesRegex(ValueError, "fingerprint"):
                verified_views(path, bags)
            (path / "views.json").write_text(json.dumps(views))
            model = Model()
            initial = extract(model, path, bags, path, "fixed-recipe")
            self.assertEqual(initial.shape, (3, 4, 768))
            calls = model.calls
            self.assertTrue(torch.equal(extract(model, path, bags, path, "fixed-recipe"), initial))
            self.assertEqual(model.calls, calls)
            with self.assertRaisesRegex(ValueError, "cache"):
                extract(model, path, bags, path, "other-recipe")
            with self.assertRaisesRegex(ValueError, "cache"):
                extract(model, path, bags[::-1], path, "fixed-recipe")
            cached = torch.load(path / "features.pt", weights_only=True)
            cached.update(features=initial[:2], completed=2, ids=[r["id"] for r in bags[:2]])
            torch.save(cached, path / "features.pt")
            self.assertTrue(torch.equal(extract(model, path, bags, path, "fixed-recipe"), initial))
            cached = torch.load(path / "features.pt", weights_only=True)
            cached["features"][0, 0, 0] = float("nan")
            torch.save(cached, path / "features.pt")
            with self.assertRaisesRegex(ValueError, "cache"):
                extract(model, path, bags, path, "fixed-recipe")
            Image.new("RGB", (100, 64), "white").save(path / "photos" / "V00000-0.png")
            with self.assertRaisesRegex(ValueError, "source view"):
                extract(model, path, bags, path, "fixed-recipe")


if __name__ == "__main__":
    unittest.main()
