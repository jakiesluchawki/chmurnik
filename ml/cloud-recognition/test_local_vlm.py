import copy
import unittest

import numpy as np
from PIL import Image
from sklearn.metrics import f1_score

from probe_local_vlm import compare, full_frame, parse_code, score, validate_records


class LocalVLMTests(unittest.TestCase):
    def test_codes_are_exact_and_refusal_is_never_clear_sky(self):
        self.assertEqual(parse_code(" K\n"), (10, "answer"))
        self.assertEqual(parse_code("X"), (-1, "refused"))
        for text in ("", "a", "A: Cirrus", "A or B", "AA", "Unknown", None):
            self.assertEqual(parse_code(text), (-1, "invalid"))

    def test_metrics_keep_unknown_answers_and_all_eleven_classes(self):
        labels, predicted = [0, 0, 1, 10], [0, -1, 0, 10]
        result = score([{"label": n} for n in labels], predicted)
        self.assertEqual((result["count"], result["correct"]), (4, 2))
        self.assertEqual(result["confusion_matrix"][0][11], 1)
        self.assertAlmostEqual(result["macro_f1"], f1_score(labels, predicted,
                              labels=list(range(11)), average="macro", zero_division=0))

    def test_duplicate_groups_use_original_id_and_invalid_responses_count(self):
        rows = [{"id": "V0", "source_id": "z", "group": "same", "source": "a", "label": 0, "control_prediction": 0},
                {"id": "V1", "source_id": "a", "group": "same", "source": "a", "label": 0, "control_prediction": 0},
                {"id": "V2", "source_id": "b", "group": "other", "source": "b", "label": 1, "control_prediction": 0}]
        records = [{"id": "V0", "text": "A"}, {"id": "V1", "text": "X"}, {"id": "V2", "text": "B maybe"}]
        result = compare(rows, records)
        self.assertEqual(result["candidate"]["correct"], 1)
        self.assertEqual(result["grouped_candidate"]["correct"], 0)
        self.assertEqual(result["grouped_candidate"]["count"], 2)
        self.assertEqual(result["responses"], {"answer": 1, "refused": 1, "invalid": 1})
        self.assertFalse(result["development_gain"])
        self.assertFalse(result["release_approved"])
        with self.assertRaises(ValueError):
            compare(rows, records[:-1])
        changed = copy.deepcopy(rows)
        changed[1]["label"] = 3
        with self.assertRaises(ValueError):
            compare(changed, records)

    def test_frame_preserves_both_ends_and_does_not_upscale(self):
        pixels = np.zeros((200, 800, 3), dtype=np.uint8)
        pixels[:, :400, 0] = 255
        pixels[:, 400:, 2] = 255
        result = full_frame(Image.fromarray(pixels))
        self.assertEqual(result.size, (448, 112))
        self.assertEqual(result.getpixel((0, 50)), (255, 0, 0))
        self.assertEqual(result.getpixel((447, 50)), (0, 0, 255))
        self.assertEqual(full_frame(Image.new("RGB", (64, 128))).size, (64, 128))

    def test_cache_binds_recipe_id_and_image_bytes(self):
        inputs = [{"id": "a", "sha256": "pixels"}]
        contract = {"model": "hash", "prompt": "fixed"}
        record = {"id": "a", "input_sha256": "pixels", "contract": contract, "text": "A", "seconds": .1}
        self.assertEqual(validate_records(inputs, [record], contract), 1)
        for key, value in (("id", "b"), ("input_sha256", "other"), ("contract", {}),
                           ("seconds", float("nan")), ("text", None)):
            changed = {**record, key: value}
            with self.assertRaises(ValueError):
                validate_records(inputs, [changed], contract)
        with self.assertRaises(ValueError):
            validate_records(inputs, [record, record], contract)

    def test_improvement_does_not_approve_a_release(self):
        rows = [{"id": "a", "source_id": "a", "source": "a", "label": 0, "control_prediction": 1}]
        result = compare(rows, [{"id": "a", "text": "A"}])
        self.assertTrue(result["development_gain"])
        self.assertFalse(result["release_approved"])


if __name__ == "__main__":
    unittest.main()
