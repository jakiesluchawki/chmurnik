import copy
import csv
import io
import unittest

from montenegro_data import (ALTITUDE, ANNOTATION_HEADER, COVER, GENUS_CODES, HEIGHT, HIGH,
                             ITEM_HEADER, LOW, LOW_COVER, MIDDLE, VARIABLES,
                             check_tables, consensus, judgement, normalize_codes, profile, read_table)


def annotation(user="68", **codes):
    row = {"annotation_item_id": "1", "user_id": user, ALTITUDE: "Low clouds",
           COVER: "3", LOW_COVER: "3", HEIGHT: "7", LOW: "1", MIDDLE: "0", HIGH: "0"}
    row.update(codes)
    return row


def tables():
    items = [{"id": "1", "name": "snapshot_20251003_160701_607.jpg", "item_url": "/images/",
              "item_type": "image", "item_received": "2025-10-03 16:07:01"}]
    labels = []
    for field, code in VARIABLES.items():
        names = ("Clear", "Low", "Low clouds", "Middle clouds", "High clouds", "Clouds of vertical development") if field == ALTITUDE else [str(n) for n in range(10)] + ([] if field == COVER else ["/"])
        offset = len(labels)
        labels.extend({"id": str(offset + i), "label_type_id": code, "name": name, "description": name}
                      for i, name in enumerate(names))
    return items, [annotation(str(user)) for user in range(68, 73)], labels


class MontenegroTests(unittest.TestCase):
    def test_exact_genus_codes_preserve_mapping(self):
        for field, codes in GENUS_CODES.items():
            for code, genera in codes.items():
                row = annotation(**{LOW: "0", MIDDLE: "0", HIGH: "0", field: code})
                result = judgement(row)
                self.assertEqual(result["possible_genera"], sorted(genera))
                self.assertEqual(result["status"], "single_genus" if len(genera) == 1 else "partial_or_multiple")

    def test_union_and_multiple_cloud_levels_never_become_one_genus(self):
        for codes in ({LOW: "0", MIDDLE: "2"}, {LOW: "8"}, {HIGH: "1"}, {LOW: "0", HIGH: "5"}):
            result = judgement(annotation(**codes))
            self.assertEqual(result["status"], "partial_or_multiple")
            self.assertNotIn("genus", result)

    def test_missing_and_obscured_are_not_clear(self):
        for field in (COVER, LOW, MIDDLE, HIGH):
            for value in ([""] if field == COVER else ["", "/"]):
                result = judgement(annotation(**{field: value}))
                self.assertEqual(result["status"], "unobserved")
                self.assertNotIn("genus", result)
        self.assertEqual(judgement(annotation(**{COVER: "9"}))["status"], "unobserved")

    def test_clear_requires_no_positive_cloud_type(self):
        row = annotation(**{COVER: "0", LOW: "0", LOW_COVER: "0"})
        self.assertEqual(judgement(row)["genus"], "clear_sky")
        self.assertEqual(judgement({**row, LOW: "1"})["status"], "inconsistent_clear")
        self.assertEqual(judgement({**row, LOW_COVER: "3"})["status"], "inconsistent_clear")
        self.assertEqual(judgement({**row, COVER: "3"})["status"], "no_positive_genus")

    def test_consensus_keeps_ambiguous_observers_in_denominator(self):
        rows = [annotation(str(n)) for n in range(5)]
        rows[-1][HIGH] = "/"
        self.assertEqual(consensus(rows)["screened_genus"], "cumulus")
        rows[-2][LOW] = "8"
        self.assertIsNone(consensus(rows)["screened_genus"])
        self.assertIsNone(consensus(rows[:3])["screened_genus"])

    def test_duplicate_votes_and_mixed_images_fail(self):
        for rows in ([annotation(), annotation()],
                     [annotation(), {**annotation("69"), "annotation_item_id": "2"}], []):
            with self.assertRaises(ValueError):
                consensus(rows)

    def test_read_table_checks_header_and_width(self):
        for header, row in ((ITEM_HEADER[::-1], ["a"] * 5), (ITEM_HEADER, ["a"] * 4)):
            stream = io.StringIO()
            csv.writer(stream).writerows([header, row])
            stream.seek(0)
            with self.assertRaises(ValueError):
                read_table(stream, ITEM_HEADER)

    def test_schema_join_and_time_checks(self):
        source = tables()
        self.assertEqual(set(check_tables(*source)), {"1"})
        changes = ((0, "name", "../photo.jpg"), (0, "item_received", "2025-10-04 16:07:01"),
                   (1, "annotation_item_id", "999"), (1, HIGH, "NaN"), (2, "label_type_id", "999"))
        for index, field, value in changes:
            data = copy.deepcopy(source)
            data[index][0][field] = value
            with self.assertRaises(ValueError):
                check_tables(*data)
        for index in (0, 1, 2):
            data = copy.deepcopy(source)
            data[index].append(data[index][0])
            with self.assertRaises(ValueError):
                check_tables(*data)

    def test_profile_counts_images_not_annotation_rows(self):
        result = profile(*tables())
        self.assertEqual(result["image_count"], 1)
        self.assertEqual(result["annotation_count"], 5)
        self.assertEqual(result["screened_before_pixel_deduplication"], {"cumulus": 1})
        self.assertEqual(result["screened_days_by_genus"], {"cumulus": 1})
        self.assertFalse(result["training_approved"])

    def test_invalid_codes_cannot_be_silently_dropped(self):
        for field, value in ((LOW, "10"), (MIDDLE, "nan"), (HIGH, "None"), (COVER, "/")):
            with self.assertRaises(ValueError):
                judgement(annotation(**{field: value}))

    def test_code_whitespace_is_normalized_with_audit_not_numeric_coercion(self):
        row = annotation(**{LOW_COVER: "0 ", MIDDLE: "/ "})
        rows, changes = normalize_codes([row])
        self.assertEqual(rows[0][LOW_COVER], "0")
        self.assertEqual(rows[0][MIDDLE], "/")
        self.assertEqual(row[MIDDLE], "/ ")
        self.assertEqual(sum(change["count"] for change in changes), 2)
        self.assertEqual(judgement(rows[0])["status"], "unobserved")
        invalid, _ = normalize_codes([annotation(**{MIDDLE: "nan "})])
        with self.assertRaises(ValueError):
            judgement(invalid[0])


if __name__ == "__main__":
    unittest.main()
