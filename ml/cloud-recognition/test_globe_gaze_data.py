import csv
import io
import unittest

from globe_gaze_data import BASE, CATEGORIES, DIRECTIONS, HEADER, photo_fields, profile, read_observations


def observation():
    row = dict.fromkeys(HEADER, "")
    row.update(dict(zip(BASE, ["test-observation", "2022-01-01", "12:00:00", "0", "0"], strict=True)))
    for direction in DIRECTIONS:
        row[f"{direction} Image URL"] = f"https://data.globe.gov/system/photos/2022/01/01/{direction}/original.jpg"
        for category in CATEGORIES:
            row[f"{direction} {category}"] = "1" if category == "Cumulus" else "0"
        row[f"{direction} Agreement"] = "0.8"
        row[f"{direction} Classification Count"] = "5"
        row[f"{direction} Retirement"] = "consensus"
    return row


def stream(rows, header=HEADER):
    result = io.StringIO(newline="")
    csv.writer(result).writerows([header, *rows])
    result.seek(0)
    return result


class GlobeGazeDataTests(unittest.TestCase):
    def test_only_documented_break_before_up_block_is_reconstructed(self):
        record = observation()
        values = [record[field] for field in HEADER]
        rows, audit = read_observations(stream([values[:61], ["", *values[61:]]]))
        self.assertEqual(rows, [record])
        self.assertEqual(audit["physical_data_records"], 2)
        self.assertEqual(audit["repaired_continuations"], [{"first_record": 1, "second_record": 2}])

    def test_changed_header_wrong_width_and_unrecognized_continuation_fail(self):
        values = [observation()[field] for field in HEADER]
        cases = [stream([values], list(reversed(HEADER))), stream([values[:-1]]),
                 stream([values[:61], ["nonempty", *values[61:]]]), stream([values[:61]])]
        for example in cases:
            with self.assertRaises(ValueError):
                read_observations(example)

    def test_shifted_flags_or_metadata_and_unexpected_urls_fail(self):
        for field, invalid in (("Cumulus", "consensus"), ("Agreement", "nan"),
                               ("Classification Count", "0"), ("Image URL", "https://example.com/photo")):
            row = observation()
            row[f"North {field}"] = invalid
            with self.assertRaises(ValueError):
                photo_fields(row, "North")

    def test_other_empty_and_multiple_labels_never_become_single_genus(self):
        for flags in ([], ["Cumulus", "Stratocumulus"], ["Clearsky", "Cumulus"]):
            row = observation()
            for direction in DIRECTIONS:
                for category in CATEGORIES:
                    row[f"{direction} {category}"] = "1" if category in flags else "0"
            result = profile([row], {})
            self.assertEqual(result["single_label_point8_min5_counts_before_deduplication"], {})
        row = observation()
        for direction in DIRECTIONS:
            row[f"{direction} Cumulus"] = "5"
        self.assertEqual(profile([row], {})["statuses"], {"other_or_missing": 5})

    def test_grouped_names_and_duplicate_urls_remain_explicit(self):
        row = observation()
        for direction in DIRECTIONS:
            row[f"{direction} Cumulus"] = "0"
            row[f"{direction} Cirrus/Cirrostratus"] = "1"
        result = profile([row, row], {})
        self.assertEqual(result["single_label_point8_min5_counts_before_deduplication"], {"Cirrus/Cirrostratus": 10})
        self.assertEqual(result["unique_observation_ids"], 1)
        self.assertEqual(result["photo_records"], 10)
        self.assertEqual(result["unique_photo_urls"], 5)

    def test_zero_count_and_missing_retirement_are_audited_but_excluded(self):
        row = observation()
        for direction in DIRECTIONS:
            row[f"{direction} Classification Count"] = "0"
            row[f"{direction} Retirement"] = ""
        result = profile([row], {})
        self.assertEqual(result["statuses"], {"missing_classification_metadata": 5})
        self.assertEqual(result["single_label_point8_min5_counts_before_deduplication"], {})


if __name__ == "__main__":
    unittest.main()
