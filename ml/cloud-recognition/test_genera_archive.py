import io
import json
import unittest
import warnings
import zipfile

import h5py
import numpy as np

from audit_genera_archive import archive_members, numeric_inventory, unique_object


class GeneraArchiveTests(unittest.TestCase):
    def archive(self, pairs):
        buffer = io.BytesIO()
        with warnings.catch_warnings(), zipfile.ZipFile(buffer, "w") as output:
            warnings.simplefilter("ignore", UserWarning)
            for name, data in pairs:
                output.writestr(name, data)
        return buffer.getvalue()

    def test_exact_bounded_member_set(self):
        pairs = [("config.json", b"{}"), ("metadata.json", b"{}"), ("model.weights.h5", b"data")]
        self.assertEqual(archive_members(self.archive(pairs)), dict(pairs))
        for modified in (pairs + [pairs[0]], pairs[:-1], pairs + [("../escape", b"")],
                         [("config.json", b" " * 65537)] + pairs[1:]):
            with self.subTest(modified=[p[0] for p in modified]), self.assertRaises(ValueError):
                archive_members(self.archive(modified))

    def hdf(self, populate):
        buffer = io.BytesIO()
        with h5py.File(buffer, "w") as output:
            populate(output)
        return buffer.getvalue()

    def test_numeric_values_and_hash_receipts(self):
        data = self.hdf(lambda root: root.create_dataset("layer/vars/0", data=np.arange(6, dtype="f4").reshape(2, 3)))
        arrays, report = numeric_inventory(data)
        np.testing.assert_array_equal(arrays["layer/vars/0"], np.arange(6).reshape(2, 3))
        self.assertEqual(report[0]["bytes"], 24)
        self.assertEqual(len(report[0]["sha256"]), 64)

    def test_rejects_links_cycles_strings_filters_nonfinite(self):
        def external(root):
            root["link"] = h5py.ExternalLink("must-not-open.h5", "/")
        def soft(root):
            root["link"] = h5py.SoftLink("/missing")
        def cycle(root):
            root["loop"] = root
        cases = [external, soft, cycle,
                 lambda root: root.create_dataset("text", data=b"not numeric"),
                 lambda root: root.create_dataset("nan", data=np.array([np.nan], dtype="f4")),
                 lambda root: root.create_dataset("filtered", data=np.ones(4, dtype="f4"), compression="gzip")]
        for populate in cases:
            with self.subTest(case=populate), self.assertRaises(ValueError):
                numeric_inventory(self.hdf(populate))

    def test_duplicate_json_keys(self):
        with self.assertRaises(ValueError):
            json.loads('{"deploy":true,"deploy":false}', object_pairs_hook=unique_object)


if __name__ == "__main__":
    unittest.main()
