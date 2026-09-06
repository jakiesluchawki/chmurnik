import copy
import io
from pathlib import Path
import tempfile
import unittest

import h5py
import numpy as np

from audit_vienna_data import (FILES, RECORD, hdf_inventory, image_reuse_profile,
                               label_profile, read_labels, validate_record)


def row(*codes):
    return ",".join("1" if index == code else "0" for code in codes for index in range(10))


class ViennaLabelsTests(unittest.TestCase):
    def test_missing_is_not_clear(self):
        labels = read_labels(io.StringIO(row(5, None, None)))
        self.assertEqual(labels, [(5, None, None)])
        profile = label_profile(labels)
        self.assertEqual(profile["explicitly_cloud_free_all_levels"], 0)
        self.assertEqual(profile["level_code_counts"]["middle"]["unobserved"], 1)
        self.assertEqual(profile["level_code_counts"]["middle"]["0"], 0)

    def test_explicit_clear_requires_three_observed_zeros(self):
        labels = read_labels(io.StringIO("\n".join([row(0, 0, 0), row(0, 0, None), row(0, 0, 1)])))
        profile = label_profile(labels)
        self.assertEqual(profile["explicitly_cloud_free_all_levels"], 1)
        self.assertEqual(profile["unobserved_at_least_one_level"], 1)
        self.assertFalse(profile["training_admitted"])
        self.assertFalse(profile["fresh_test"])

    def test_one_code_per_level_not_one_label_per_image(self):
        labels = read_labels(io.StringIO(row(8, 2, 9)))
        self.assertEqual(labels, [(8, 2, 9)])
        self.assertEqual(label_profile(labels)["observed_cloudy_level_counts"], {3: 1})

    def test_multiple_codes_within_level_fail(self):
        values = row(0, 0, 0).split(",")
        values[2] = "1"
        with self.assertRaisesRegex(ValueError, "Multiple codes"):
            read_labels(io.StringIO(",".join(values)))

    def test_invalid_values_geometry_or_missing_low_fail(self):
        for value in ("", row(None, 0, 0), row(0, 0), row(0, 0, 0) + ",0",
                      row(0, 0, 0).replace("1", "NaN", 1), "0.0," + row(0, 0, 0)[2:]):
            with self.subTest(value=value), self.assertRaises(ValueError):
                read_labels(io.StringIO(value))

    def test_exact_record_license_and_file_identity(self):
        record = {"id": RECORD, "metadata": {"license": {"id": "cc-by-4.0"}},
                  "files": [{"key": name, "size": size, "checksum": f"md5:{digest}"}
                            for name, (size, digest) in FILES.items()]}
        validate_record(record)
        for key in ("id", "license", "file"):
            changed = copy.deepcopy(record)
            if key == "id":
                changed["id"] += 1
            elif key == "license":
                changed["metadata"]["license"]["id"] = "other"
            else:
                changed["files"][0]["checksum"] = "md5:other"
            with self.subTest(key=key), self.assertRaises(ValueError):
                validate_record(changed)

    def test_four_views_are_one_observation_without_invented_metadata(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "images.nc"
            with h5py.File(path, "w") as handle:
                handle.create_dataset("Full_period", data=np.zeros((2, 4, 64, 100, 3), dtype=np.int16))
            result = hdf_inventory(path, 2)
            self.assertEqual(result["directional_image_count"], 8)
            self.assertEqual(result["observation_count"], 2)
            self.assertFalse(result["temporal_grouping_verified"])
            with self.assertRaises(ValueError):
                hdf_inventory(path, 3)

    def test_invalid_image_values_fail(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "images.nc"
            for invalid in (256, -1):
                with h5py.File(path, "w") as handle:
                    handle.create_dataset("Full_period", data=np.full((1, 4, 64, 100, 3), invalid, dtype=np.int16))
                with self.subTest(invalid=invalid), self.assertRaises(ValueError):
                    hdf_inventory(path, 1)

    def test_reordered_bag_reuse_and_conflicting_labels_remain_visible(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "images.nc"
            bag = np.stack([np.full((64, 100, 3), value, dtype=np.uint8) for value in (0, 30, 70, 100)])
            with h5py.File(path, "w") as handle:
                handle.create_dataset("Full_period", data=np.stack([bag, bag[::-1], bag]))
            result = image_reuse_profile(path, [(1, 0, 0), (2, 0, 0), (1, 0, 0)])
            self.assertEqual(result["unique_exact_bags"], 1)
            self.assertEqual(result["extra_exact_bag_rows"], 2)
            self.assertEqual(result["conflicting_exact_bag_groups"], [[0, 1, 2]])
            self.assertEqual(result["extra_exact_directional_images"], 8)
            self.assertFalse(result["temporal_or_near_duplicate_exclusion_proven"])


if __name__ == "__main__":
    unittest.main()
