import unittest

import numpy as np
from sklearn.svm import SVC

from probe_v4_svc import fit_trial, ovr_scores, pairwise_coefficients


class SVCTrialTests(unittest.TestCase):
    def test_reconstructed_ovo_scores_preserve_sklearn_labels(self):
        rng = np.random.default_rng(42)
        x, v = rng.normal(size=(55, 12)), rng.normal(size=(17, 12))
        for regularization in (.1, 1., 10., 100.):
            result = fit_trial(x, np.arange(55) % 11, v, np.arange(17) % 11, regularization, gamma=.05)
            self.assertLess(result["reconstruction_max_error"], 1e-7)
            self.assertEqual(result["validation_scores"].shape, (17, 11))
            self.assertEqual(result["coefficients"].shape[1], 55)

    def test_votes_are_primary_and_confidence_breaks_ties(self):
        self.assertEqual(ovr_scores(np.ones((1, 55))).argmax(1).item(), 0)
        self.assertEqual(ovr_scores(-np.ones((1, 55))).argmax(1).item(), 10)
        np.testing.assert_equal(ovr_scores(np.zeros((1, 55))), np.arange(10, -1, -1)[None])
        with self.assertRaises(ValueError):
            ovr_scores(np.ones((1, 54)))
        with self.assertRaises(ValueError):
            ovr_scores(np.full((1, 55), np.nan))
        model = SVC().fit([[0], [1], [2], [3]], [0, 0, 1, 1])
        with self.assertRaisesRegex(ValueError, "class order"):
            pairwise_coefficients(model)


if __name__ == "__main__":
    unittest.main()
