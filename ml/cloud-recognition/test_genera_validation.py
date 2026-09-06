import json
import unittest

import numpy as np

from labels import GENERA
from probe_genera_validation import mapped_top, result_metrics, validate_labels


class GeneraValidationTests(unittest.TestCase):
    def mapping(self):
        names = ["Altocumulus", "Altostratus", "Cirrocumulus", "Cirrostratus", "Cirrus", "Clear Sky",
                 "Contrail", "Cumulonimbus", "Cumulus", "Nimbostratus", "Stratocumulus", "Stratus"]
        return {"int_to_label": {str(i): v for i, v in enumerate(names)},
                "label_to_int": {v: i for i, v in enumerate(names)}}

    def test_exact_published_bidirectional_label_map(self):
        mapping = self.mapping()
        validate_labels(json.dumps(mapping))
        mapping["int_to_label"]["5"] = "ClearSky"
        with self.assertRaises(ValueError):
            validate_labels(json.dumps(mapping))

    def test_reordered_reverse_map_rejected(self):
        mapping = self.mapping()
        mapping["label_to_int"]["Cirrus"] = 0
        with self.assertRaises(ValueError):
            validate_labels(json.dumps(mapping))

    def test_contrail_is_not_dropped_renormalized_or_clear(self):
        values = np.zeros((3, 12))
        values[0, 6], values[0, 5] = .6, .4
        values[1, 5], values[2, 4] = 1, 1
        predictions = mapped_top(values)
        self.assertEqual(predictions.tolist(), [-1, GENERA.index("clear_sky"), GENERA.index("cirrus")])
        rows = [{"label": GENERA.index("clear_sky")}, {"label": GENERA.index("clear_sky")}, {"label": GENERA.index("cirrus")}]
        score = result_metrics(rows, predictions)
        self.assertEqual(score["correct"], 2)
        self.assertEqual(score["unsupported"], 1)
        self.assertEqual(np.sum(score["confusion"]), 3)


if __name__ == "__main__":
    unittest.main()
