import copy
import unittest

import numpy as np

from probe_v4_reliability import weighted_counts
from probe_v4_source_balance import influence, source_factors, source_gate


def fixture():
    rows, quality = [], []
    for label in range(11):
        for source, count in (("ccsn", 6), ("imgw-2024-samples", 2)):
            for i in range(count):
                rows.append({"id": f"{label}/{source}/{i}", "label": label, "source": source, "split": "train"})
                quality.append(.25 if source == "ccsn" and i == 0 else 1.)
    return rows, np.asarray(quality)


class SourceBalanceTests(unittest.TestCase):
    def test_classes_and_sources_have_equal_total_mass_without_losing_quality_ratios(self):
        rows, q = fixture()
        factors = source_factors(rows, q)
        labels = np.asarray([r["label"] for r in rows])
        weights = weighted_counts(labels, factors)
        report = influence(rows, factors)
        for label, cells in report["class_sources"].items():
            self.assertEqual(set(cells), {"ccsn", "imgw-2024-samples"})
            for cell in cells.values():
                self.assertAlmostEqual(cell["share_within_class"], .5)
                self.assertAlmostEqual(cell["weight"], len(rows) / 22)
        np.testing.assert_allclose(np.bincount(labels, weights=weights), len(rows) / 11)
        self.assertAlmostEqual(weights[0] / weights[1], .25)
        self.assertAlmostEqual(weights.sum(), len(rows))

    def test_original_and_mirror_views_keep_identical_mass(self):
        rows, q = fixture()
        labels = np.asarray([r["label"] for r in rows])
        factors = source_factors(rows, q)
        photos = weighted_counts(labels, factors)
        views = weighted_counts(np.repeat(labels, 2), np.repeat(factors, 2))
        np.testing.assert_allclose(views, np.repeat(photos, 2))

    def test_one_source_is_valid_and_new_cells_are_counted_per_class(self):
        rows, q = fixture()
        keep = [i for i, r in enumerate(rows) if r["label"] != 0 or r["source"] == "ccsn"]
        rows, q = [rows[i] for i in keep], q[keep]
        report = influence(rows, source_factors(rows, q))
        self.assertAlmostEqual(report["class_sources"]["cirrus"]["ccsn"]["share_within_class"], 1)
        self.assertAlmostEqual(report["class_sources"]["cirrocumulus"]["ccsn"]["share_within_class"], .5)

    def test_reordering_and_global_quality_scale_do_not_change_photo_influence(self):
        rows, q = fixture()
        factors = source_factors(rows, q)
        np.testing.assert_allclose(source_factors(rows[::-1], q[::-1])[::-1], factors)
        np.testing.assert_allclose(source_factors(rows, q * 100), factors)

    def test_held_out_and_duplicate_ids_cannot_enter_weight_decisions(self):
        rows, q = fixture()
        for split in ("validation", "test", "calibration"):
            bad = copy.deepcopy(rows)
            bad[0]["split"] = split
            with self.assertRaises(ValueError):
                source_factors(bad, q)
        bad = copy.deepcopy(rows)
        bad[1]["id"] = bad[0]["id"]
        with self.assertRaises(ValueError):
            source_factors(bad, q)

    def test_invalid_quality_labels_and_sources_fail_closed(self):
        rows, q = fixture()
        for invalid in (q[:-1], q * 0, q * -1, q * np.nan):
            with self.assertRaises(ValueError):
                source_factors(rows, invalid)
        for change in ({"label": -1}, {"label": 11}, {"label": 1.1}, {"source": ""}, {"source": None}):
            bad = copy.deepcopy(rows)
            bad[0].update(change)
            with self.assertRaises(ValueError):
                source_factors(bad, q)

    def test_overall_gain_cannot_hide_a_source_regression(self):
        control = {"raw_all": {"macro_f1": .644547, "correct": 290},
                   "raw_clouds": {"correct": 260}, "unique_all": {"macro_f1": .642974},
                   "source_ccsn": {"correct": 182}, "source_imgw-2024-samples": {"correct": 88}}
        candidate = copy.deepcopy(control)
        candidate["raw_all"].update(macro_f1=.67, correct=300)
        candidate["raw_clouds"]["correct"] = 270
        candidate["unique_all"]["macro_f1"] = .66
        self.assertTrue(source_gate(candidate, control))
        for source in ("source_ccsn", "source_imgw-2024-samples"):
            regressed = copy.deepcopy(candidate)
            regressed[source]["correct"] -= 1
            self.assertFalse(source_gate(regressed, control))
        candidate["raw_all"]["macro_f1"] = .65
        self.assertFalse(source_gate(candidate, control))


if __name__ == "__main__":
    unittest.main()
