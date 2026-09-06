import unittest

from vienna_bags import constraints, overlapping_bags, select


class ViennaBagTests(unittest.TestCase):
    def test_unknown_and_absent_levels_create_no_fake_negative_labels(self):
        self.assertEqual(constraints((0, None, None)), [])
        self.assertEqual(constraints((0, 0, 0)), [("clear_sky",)])
        self.assertEqual(constraints((5, None, None)), [("stratocumulus",)])

    def test_union_does_not_choose_its_member(self):
        self.assertEqual(constraints((7, 2, None)), [("altostratus", "nimbostratus"), ("cumulus", "stratus")])

    def test_cooccurring_clouds_are_two_constraints_not_a_union(self):
        self.assertEqual(constraints((8, 0, 0)), [("cumulus",), ("stratocumulus",)])

    def test_origin_does_not_invent_a_visible_parent_cloud(self):
        self.assertEqual(constraints((0, 6, 3)), [("altocumulus",), ("cirrus",)])
        self.assertEqual(constraints((0, 7, 0)), [("altocumulus",)])

    def test_every_code_has_a_known_positive_constraint(self):
        for level in range(3):
            for code in range(1, 10):
                codes = [0, 0, 0]
                codes[level] = code
                self.assertTrue(constraints(codes))
        for invalid in ((None, 0, 0), (True, 0, 0), (1, 2), (1, 0, 10), (1, "0", 0)):
            with self.assertRaises(ValueError):
                constraints(invalid)

    def test_fixed_sample_never_repeats_or_relabels_a_bag(self):
        rows = [(8, 3, 9), (5, 3, 9), (0, 0, 0), (0, 0, 1), (0, 1, 0)] * 10
        selected = select(rows, per_bucket=3)
        self.assertEqual(selected, select(rows, per_bucket=3))
        self.assertEqual(len({r["row_index"] for r in selected}), len(selected))
        for row in selected:
            self.assertEqual(row["codes"], list(rows[row["row_index"]]))
            self.assertEqual(row["events"], [list(e) for e in constraints(rows[row["row_index"]])])
            self.assertEqual(row["split"], "auxiliary-train")

    def test_cross_bag_overlap_excludes_whole_bags_but_not_internal_overlap(self):
        row = {"id": "a-0", "bag_id": "a", "pixel_sha256": "x", "dhash": "1"}
        same_bag = {**row, "id": "a-1"}
        different = {**row, "id": "b-0", "bag_id": "b"}
        self.assertEqual(overlapping_bags([row, same_bag], []), {})
        self.assertEqual(set(overlapping_bags([row, same_bag, different], [])), {"a", "b"})
        old = {"id": "original", "pixel_sha256": "y", "dhash": "1"}
        self.assertEqual(set(overlapping_bags([row, same_bag], [old])), {"a"})


if __name__ == "__main__":
    unittest.main()
