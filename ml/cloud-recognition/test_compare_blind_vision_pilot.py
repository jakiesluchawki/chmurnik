import copy
import unittest

from compare_blind_vision_pilot import compare


class BlindVisionComparisonTests(unittest.TestCase):
    def fixture(self):
        key = {"source_label_key": [{"photo_id": "P001", "source_label": "cirrus",
                                    "native_baseline": {"top1": "cumulus", "accepted": False}}]}
        answer = {"observations": [{"photo_id": "P001", "best_guess": "Ci",
                                   "assessment": "uncertain", "genera": [], "alternatives": ["Ci", "Cs"],
                                   "confidence": "low", "evidence_pl": "Widoczne smugi.",
                                   "limits_pl": "Brak skali.", "next_step_pl": "Sprawdź szerszy kadr."}]}
        return key, answer, copy.deepcopy(answer)

    def test_counts_agreement_without_relabeling_or_ignoring_unknown(self):
        key, a, b = self.fixture()
        b["observations"][0]["best_guess"] = "unknown"
        report = compare(key, a, b)
        self.assertEqual(report["native_matches_source"], 0)
        self.assertEqual(report["arms"]["a"]["matches_source"], 1)
        self.assertEqual(report["arms"]["a"]["assessments"], {"uncertain": 1})
        self.assertEqual(report["arms"]["b"]["unknown_best_guess"], 1)
        self.assertEqual(report["photos"], 1)
        self.assertEqual(report["labels_applied"], 0)
        self.assertFalse(report["training_ready"])
        self.assertEqual(key["source_label_key"][0]["native_baseline"]["top1"], "cumulus")

    def test_missing_duplicates_and_invalid_codes_fail(self):
        for problem in ("missing", "duplicate", "code"):
            key, a, b = self.fixture()
            if problem == "missing":
                a["observations"] = []
            elif problem == "duplicate":
                a["observations"] *= 2
            else:
                a["observations"][0]["best_guess"] = "cumuliform"
            with self.assertRaises(ValueError):
                compare(key, a, b)


if __name__ == "__main__":
    unittest.main()
