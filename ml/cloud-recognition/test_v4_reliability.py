import unittest

import numpy as np

from probe_v4_reliability import reliability, training_folds, view_indices, weighted_counts


class ReliabilityTests(unittest.TestCase):
    def test_folds_keep_images_duplicates_and_capture_days_together(self):
        rows = [{"id": str(i), "label": i % 11, "split": "train", "group": f"duplicate-{i // 2}",
                 "split_group": f"day-{i // 4}"} for i in range(220)]
        first, second = training_folds(rows), training_folds(rows)
        seen = []
        for (train, query), (_, again) in zip(first, second):
            np.testing.assert_equal(query, again)
            seen.extend(query)
            self.assertFalse(set(view_indices(train)) & set(view_indices(query)))
            for key in ("group", "split_group"):
                self.assertFalse({rows[i][key] for i in train} & {rows[i][key] for i in query})
        self.assertEqual(sorted(seen), list(range(220)))
        with self.assertRaisesRegex(ValueError, "training-only"):
            training_folds([{**rows[0], "split": "validation"}])

    def test_weights_keep_total_class_influence_even_without_relabeling(self):
        labels = np.arange(33) % 11
        quality = np.where(np.arange(33) % 2, .25, 1.)
        weights = weighted_counts(labels, quality)
        np.testing.assert_allclose(np.bincount(labels, weights=weights), np.full(11, 3.))
        self.assertTrue((weights > 0).all())
        with self.assertRaises(ValueError):
            weighted_counts(labels, np.zeros(33))
        with self.assertRaises(ValueError):
            weighted_counts(labels[labels != 10], quality[labels != 10])

    def test_only_ccsn_labels_outside_top3_are_downweighted(self):
        rows = [{"id": str(i), "split": "train", "source": source, "label": label}
                for i, (source, label) in enumerate((("ccsn", 10), ("ccsn", 8), ("imgw", 10), ("clear", 10)))]
        scores = np.tile(np.arange(11, dtype=float), (4, 1))
        scores[:, 10] = -1
        np.testing.assert_equal(reliability(rows, scores), [.25, 1, 1, 1])
        self.assertEqual(rows[0]["label"], 10)
        with self.assertRaises(ValueError):
            reliability(rows, scores[:-1])
        scores[0, 0] = np.nan
        with self.assertRaises(ValueError):
            reliability(rows, scores)


if __name__ == "__main__":
    unittest.main()
