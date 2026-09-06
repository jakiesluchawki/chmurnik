import unittest

import numpy as np

from audit_v4_policy_grid import cloud_arrays, exact_policy
from train_ccsn import choose_policy


class PolicyGridTests(unittest.TestCase):
    def probabilities(self, maximum):
        values = np.zeros((len(maximum), 11))
        values[:, 0], values[:, 1] = maximum, 1 - maximum
        return values

    def test_strict_threshold_outside_historical_grid_is_found(self):
        values = self.probabilities(np.r_[np.full(25, .98), np.full(75, .95)])
        labels = np.r_[np.zeros(25, dtype=int), np.ones(75, dtype=int)]
        self.assertFalse(choose_policy(values, labels, .9)["target_met"])
        result = exact_policy(values, labels)
        self.assertTrue(result["target_met"])
        self.assertEqual(result["selected"]["accepted_count"], 25)
        self.assertEqual(result["selected"]["precision"], 1.)

    def test_score_ties_and_minimum_count_are_not_broken(self):
        values = self.probabilities(np.full(100, .98))
        labels = np.r_[np.zeros(89, dtype=int), np.ones(11, dtype=int)]
        self.assertFalse(exact_policy(values, labels)["target_met"])
        values = self.probabilities(np.r_[np.full(24, .98), np.full(76, .95)])
        labels = np.r_[np.zeros(24, dtype=int), np.ones(76, dtype=int)]
        self.assertFalse(exact_policy(values, labels)["target_met"])

    def test_exact_search_matches_bruteforce_on_random_probabilities(self):
        rng = np.random.default_rng(7042)
        values = rng.dirichlet(np.full(11, .1), size=80)
        labels = rng.integers(0, 10, size=80)
        predicted = values.argmax(axis=1)
        labels[:55] = np.minimum(predicted[:55], 9)
        maximum = values.max(axis=1)
        margin = maximum - np.sort(values, axis=1)[:, -2]
        candidates = []
        for a in np.unique(np.r_[.2, maximum[maximum >= .2]]):
            for b in np.unique(np.r_[0., margin]):
                selected = [i for i in range(80) if maximum[i] >= a and margin[i] >= b]
                if len(selected) >= 25:
                    precision = sum(predicted[i] == labels[i] for i in selected) / len(selected)
                    candidates.append((len(selected), precision, -a, -b))
        result = exact_policy(values, labels)
        self.assertEqual(result["supported_threshold_pairs"], len(candidates))
        self.assertEqual(result["maximum_supported_precision"]["precision"], max(c[1] for c in candidates))
        meeting = [c for c in candidates if c[1] >= .9]
        self.assertEqual(result["target_met"], bool(meeting))
        if meeting:
            best = result["selected"]
            self.assertEqual((best["accepted_count"], best["precision"], -best["minimum_confidence"], -best["margin_threshold"]), max(meeting))

    def test_only_cloud_calibration_rows_can_select_thresholds(self):
        p = self.probabilities(np.full(25, .98))
        rows = [{"id": str(i), "group": str(i), "split": "calibration", "label": 0, "probabilities": v.tolist()}
                for i, v in enumerate(p)]
        self.assertEqual(len(cloud_arrays(rows)[0]), 25)
        for split in ("test", "train", "validation", "confirmatory"):
            with self.assertRaises(ValueError):
                cloud_arrays([{**row, "split": split} for row in rows])
        with self.assertRaises(ValueError):
            cloud_arrays([{**row, "label": 10} for row in rows])
        with self.assertRaises(ValueError):
            exact_policy(p, np.full(25, 10))
        with self.assertRaises(ValueError):
            exact_policy(p * 2, np.zeros(25, dtype=int))


if __name__ == "__main__":
    unittest.main()
