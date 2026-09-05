import unittest

import numpy as np

from probe_v4_bagged_kernel import committee_logits


class BaggedKernelTests(unittest.TestCase):
    def test_all_five_members_have_equal_weight(self):
        rows = [np.full((3, 11), value, dtype=float) for value in range(5)]
        np.testing.assert_allclose(committee_logits(rows), np.full((3, 11), 2.))
        rows[0][0, 4] += 10
        self.assertAlmostEqual(committee_logits(rows)[0, 4], 4.)

    def test_missing_misaligned_empty_or_nonfinite_members_fail(self):
        good = [np.zeros((2, 11)) for _ in range(5)]
        cases = [good[:4], [*good[:4], np.zeros((3, 11))], [*good[:4], np.zeros((2, 10))],
                 [np.zeros((0, 11)) for _ in range(5)], [*good[:4], np.full((2, 11), np.nan)],
                 [*good[:4], np.full((2, 11), np.inf)]]
        for case in cases:
            with self.assertRaises(ValueError):
                committee_logits(case)


if __name__ == "__main__":
    unittest.main()
