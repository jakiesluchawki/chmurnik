import unittest
import random
import tempfile
from pathlib import Path

import numpy as np
import torch

from v4_checkpoint import atomic_save, random_state, restore_random_state, verify_contract
from v4_data import assign_groups, group_fingerprints, validate_manifest
from v4_metrics import metrics, paired_accuracy, unique_labeled_rows, wilson


def record(identifier, label=0, role="available", digest=None, dhash=0):
    return {"id": identifier, "label": label, "source": "ccsn", "reserved": role,
            "pixel_sha256": digest or identifier, "dhash": f"{dhash:064x}"}


class DataContractTests(unittest.TestCase):
    def test_transitive_groups_are_indivisible(self):
        rows = [record("a", dhash=0), record("b", dhash=1), record("c", dhash=3)]
        self.assertEqual(group_fingerprints(rows, 1), [[0, 1, 2]])

    def test_duplicate_group_follows_reserved_test(self):
        rows = [record("a"), record("b", role="calibration"), record("c", role="test")]
        assign_groups(rows, [[0, 1, 2]], 42)
        self.assertEqual({row["split"] for row in rows}, {"test"})

    def test_cross_class_conflict_is_excluded(self):
        rows = [record("a", 0), record("b", 1)]
        assign_groups(rows, [[0, 1]], 42)
        self.assertEqual({row["split"] for row in rows}, {"conflicting-labels"})

    def test_external_duplicate_cannot_enter_training(self):
        rows = [record("a"), record("b", role="stress")]
        rows[1]["source"] = "ccaim-old"
        assign_groups(rows, [[0, 1]], 42)
        self.assertEqual([row["split"] for row in rows], ["external-overlap", "stress"])

    def test_leakage_fails_before_training(self):
        rows = [{"group": "same", "split": split, "label": 0} for split in ["train", "test"]]
        with self.assertRaisesRegex(ValueError, "Split leakage"):
            validate_manifest(rows)

    def test_validation_assignment_is_deterministic_and_grouped(self):
        rows = [record(str(index)) for index in range(20)]
        other = [row.copy() for row in rows]
        groups = [[index, index + 1] for index in range(0, 20, 2)]
        assign_groups(rows, groups, 12)
        assign_groups(other, groups, 12)
        self.assertEqual(rows, other)
        self.assertEqual(sum(row["split"] == "validation" for row in rows), 4)
        for indices in groups:
            self.assertEqual(len({rows[index]["split"] for index in indices}), 1)


class MetricsTests(unittest.TestCase):
    def test_conflicting_diagnostic_group_not_scored_twice(self):
        rows = [{"id": str(i), "group": "a", "label": label} for i, label in enumerate([0, 1])]
        unique, excluded = unique_labeled_rows(rows)
        self.assertEqual(unique, [])
        self.assertEqual(excluded, ["a"])

    def test_perfect_small_sample_is_not_certain(self):
        lower, upper = wilson(10, 10)
        self.assertLess(lower, 0.75)
        self.assertAlmostEqual(upper, 1)
        self.assertIsNone(wilson(0, 0))

    def test_single_present_class_does_not_divide_f1_by_eleven(self):
        row = {"id": "a", "label": 0, "probabilities": [1.] + [0.] * 10}
        result = metrics([row], {"minimum_confidence": .5, "margin_threshold": .5})
        self.assertEqual(result["macro_f1"], 1)
        self.assertAlmostEqual(result["macro_f1_all_classes"], 1 / 11)

    def test_paired_comparison_requires_same_labels_and_ids(self):
        row = {"id": "a", "label": 0, "probabilities": np.eye(11)[0].tolist()}
        with self.assertRaisesRegex(ValueError, "Missing or mismatched"):
            paired_accuracy([row], [])
        result = paired_accuracy([row], [row])
        self.assertEqual(result["top1_difference"], 0)
        self.assertEqual(result["paired_bootstrap_interval_95"], [0, 0])


class CheckpointTests(unittest.TestCase):
    def test_random_state_restores_sampler_and_augmentations(self):
        generator = torch.Generator().manual_seed(34)
        state = random_state(generator, torch.device("cpu"))
        expected = (random.random(), float(np.random.random()), float(torch.rand(1)), float(torch.rand(1, generator=generator)))
        restore_random_state(state, generator, torch.device("cpu"))
        actual = (random.random(), float(np.random.random()), float(torch.rand(1)), float(torch.rand(1, generator=generator)))
        self.assertEqual(actual, expected)

    def test_atomic_checkpoint_is_weights_only_loadable(self):
        with tempfile.TemporaryDirectory() as temporary:
            path = Path(temporary) / "resume.pt"
            payload = {"weights": torch.ones(2), "random": random_state(torch.Generator(), torch.device("cpu"))}
            atomic_save(payload, path)
            saved = torch.load(path, weights_only=True)
            self.assertTrue(torch.equal(saved["weights"], payload["weights"]))
            self.assertFalse(path.with_suffix(".pending.pt").exists())

    def test_resume_rejects_different_dataset(self):
        with self.assertRaisesRegex(ValueError, "manifest_sha256"):
            verify_contract({"manifest_sha256": "old"}, {"manifest_sha256": "new"})


if __name__ == "__main__":
    unittest.main()
