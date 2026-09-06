import unittest

import numpy as np

from probe_v4_trust import check_separation, eligible, fit_support, rank_metrics, support_trust


class TrustTests(unittest.TestCase):
    def fixture(self):
        rows = [{"id": f"{label}-{i}", "group": f"g-{label}-{i}", "label": label, "split": "train"}
                for label in range(2) for i in range(12)]
        x = np.asarray([[label * 100 + i, i / 3] for label in range(2) for i in range(12)], dtype=float)
        return x, rows

    def test_training_only_and_capture_separation(self):
        x, rows = self.fixture()
        query = [{"id": "q", "group": "gq", "split": "validation", "split_group": "day"}]
        check_separation(rows, query)
        for key, value in (("id", rows[0]["id"]), ("group", rows[0]["group"])):
            with self.assertRaisesRegex(ValueError, "leakage"):
                check_separation(rows, [{**query[0], key: value}])
        with self.assertRaisesRegex(ValueError, "leakage"):
            check_separation([{**row, "split_group": "day"} for row in rows], query)
        with self.assertRaisesRegex(ValueError, "training support"):
            fit_support(x, [{**row, "split": "validation"} for row in rows], classes=2)

    def test_duplicate_support_is_not_extra_density_and_conflicts_excluded(self):
        x, rows = self.fixture()
        first = fit_support(x, rows, classes=2)
        duplicated = fit_support(np.vstack([x, x[0]]), rows + [{**rows[0], "id": "zz-copy"}], classes=2)
        self.assertEqual(first["ids"], duplicated["ids"])
        self.assertEqual(duplicated["unique_training_count"], len(rows))
        conflict = fit_support(np.vstack([x, x[0]]), rows + [{**rows[0], "id": "zz-conflict", "label": 1}], classes=2)
        self.assertEqual(conflict["excluded_conflicting_groups"], [rows[0]["group"]])
        self.assertFalse(any(rows[0]["id"] in ids for ids in conflict["ids"]))
        self.assertEqual(rows[0]["label"], 0)

    def test_support_ratio_reverses_for_wrong_class_without_mutating_predictions(self):
        x, rows = self.fixture()
        index = fit_support(x, rows, classes=2)
        predicted = np.asarray([0, 1])
        result = support_trust(index, np.vstack([x[5], x[5]]), predicted)
        self.assertGreater(result[0], .99)
        self.assertLess(result[1], .01)
        np.testing.assert_equal(predicted, [0, 1])
        single = support_trust(index, x[5:6], np.asarray([0]))
        np.testing.assert_allclose(single, result[:1])

    def test_coincident_class_support_is_neutral(self):
        x, rows = self.fixture()
        index = fit_support(np.zeros_like(x), rows, classes=2)
        np.testing.assert_equal(support_trust(index, np.zeros((2, 2)), np.asarray([0, 1])), [.5, .5])

    def test_invalid_or_insufficient_support_fails(self):
        x, rows = self.fixture()
        for k in (0, 12):
            with self.assertRaises(ValueError):
                fit_support(x, rows, k=k, classes=2)
        with self.assertRaises(ValueError):
            fit_support(x[:-1], rows, classes=2)
        invalid = x.copy()
        invalid[0, 0] = np.nan
        with self.assertRaises(ValueError):
            fit_support(invalid, rows, classes=2)
        index = fit_support(x, rows, classes=2)
        with self.assertRaises(ValueError):
            support_trust(index, x[:1], np.asarray([2]))

    def test_ranking_counts_all_ties_and_never_drops_raw_errors(self):
        scores = np.ones(100)
        correct = np.arange(100) < 60
        result = rank_metrics(scores, correct)
        self.assertEqual(result["top_decile"]["count"], 100)
        self.assertEqual(result["top_decile"]["precision"], .6)
        self.assertAlmostEqual(result["risk_coverage_area"], .4)
        self.assertEqual(result["correctness_auc"], .5)
        self.assertIsNone(result["validation_only_max_coverage_at_90pct"])
        self.assertEqual(result, rank_metrics(scores[::-1], correct[::-1]))

    def test_minimum_acceptance_and_screening_are_preserved(self):
        scores = np.arange(30, dtype=float)
        correct = scores >= 10
        result = rank_metrics(scores, correct)
        self.assertEqual(result["top_decile"]["precision"], 1.)
        self.assertIsNone(result["validation_only_max_coverage_at_90pct"])
        self.assertEqual(result["correct"], 20)
        base = {"correctness_auc": .7, "risk_coverage_area": .1, "top_decile": {"precision": .9}}
        self.assertFalse(eligible(base, base))
        candidate = {**base, "correctness_auc": .74, "risk_coverage_area": .09}
        self.assertTrue(eligible(candidate, base))
        self.assertFalse(eligible({**candidate, "top_decile": {"precision": .899}}, base))


if __name__ == "__main__":
    unittest.main()
