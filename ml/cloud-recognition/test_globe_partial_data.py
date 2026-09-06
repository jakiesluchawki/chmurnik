import unittest

from globe_gaze_data import CATEGORIES, DIRECTIONS, HEADER
from globe_partial_data import ALLOWED, screen_fingerprints, select


def observation(oid, category, direction="Up", count=5, agreement=.8):
    row = dict.fromkeys(HEADER, "")
    row.update({"Observation Number": oid, "Measurement Date (UTC)": "2022-01-01"})
    row[f"{direction} Image URL"] = f"https://data.globe.gov/system/photos/{oid}/{direction}.jpg"
    row[f"{direction} Agreement"] = str(agreement)
    row[f"{direction} Classification Count"] = str(count)
    row[f"{direction} Retirement"] = "consensus"
    for label in CATEGORIES:
        row[f"{direction} {label}"] = "1" if label == category else "0"
    return row


class PartialDataTests(unittest.TestCase):
    def test_unions_are_not_invented_singletons(self):
        row = select([observation("1", "Altostratus/Stratus")], set(), 1)["photos"][0]
        self.assertEqual(row["allowed_genera"], ["Altostratus", "Stratus"])
        self.assertNotIn("label", row)
        self.assertEqual(row["split"], "train")

    def test_observation_exclusions_and_quality_rules(self):
        rows = [observation("1", "Cumulus"), observation("2", "Cumulus", count=4),
                observation("3", "Cumulus", agreement=.79), observation("4", "Cumulonimbus"),
                observation("5", "Cumulus")]
        self.assertEqual([r["observation_id"] for r in select(rows, {"1"})["photos"]], ["5"])

    def test_order_stable_and_no_alternative_views(self):
        row = observation("1", "Cumulus")
        other = observation("1", "Stratocumulus", "North")
        row.update({k: v for k, v in other.items() if k.startswith("North ")})
        source = [row, observation("2", "Cumulus")]
        first = select(source, set(), 1)
        self.assertEqual(first, select(source[::-1], set(), 1))
        ids = [r["observation_id"] for r in first["photos"]]
        self.assertEqual(len(ids), len(set(ids)))
        self.assertEqual(first["photos"][0]["source_category"], "Stratocumulus")

    def test_multiple_positive_labels_rejected(self):
        row = observation("1", "Cumulus")
        row["Up Cirrus/Cirrostratus"] = "1"
        self.assertEqual(select([row], set())["photos"], [])

    def test_near_duplicate_excludes_both_new_rows_and_old_overlap(self):
        rows = [{"id": "A", "pixel_sha256": "a", "dhash": "0"},
                {"id": "B", "pixel_sha256": "b", "dhash": "1"},
                {"id": "C", "pixel_sha256": "c", "dhash": "f" * 64}]
        old = [{"id": "held", "pixel_sha256": "c", "dhash": "f" * 64}]
        result = screen_fingerprints(rows, old)
        self.assertEqual(set(result), {"A", "B", "C"})
        self.assertTrue(result["C"][0]["pixel_equal"])

    def test_category_mapping_has_no_cb_or_precipitation_label(self):
        self.assertEqual(len(ALLOWED), 6)
        self.assertNotIn("Cumulonimbus", ALLOWED)


if __name__ == "__main__":
    unittest.main()
