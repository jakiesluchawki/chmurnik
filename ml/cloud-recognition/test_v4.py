import unittest
import random
import hashlib
import json
import tempfile
from unittest.mock import MagicMock, patch
from pathlib import Path

import numpy as np
import torch

from v4_checkpoint import atomic_save, random_state, restore_random_state, verify_contract
from v4_data import assign_groups, group_fingerprints, validate_manifest
from v4_metrics import choose_cloud_policy, metrics, paired_accuracy, unique_labeled_rows, wilson
from v4_gate import classification_gates, confirmatory_gates
from train_v4_linear import fold_scaler, reuse_parent_features
from dinov2_model import DINOV2_REVISION
from freeze_imgw_v4 import assign_imgw, capture_day, check_source_split, stratified_roles
from imgw_data import RangeReader
from finetune_v4_dino import trainable_names
from archive_frozen_candidate import main as archive_checkpoint, restore as restore_archive
from export_coreml import classification_export_evidence, data_attribution
from labels import GENERA


def record(identifier, label=0, role="available", digest=None, dhash=0):
    return {"id": identifier, "label": label, "source": "ccsn", "reserved": role,
            "pixel_sha256": digest or identifier, "dhash": f"{dhash:064x}"}


class DataContractTests(unittest.TestCase):
    def test_feature_reuse_requires_unchanged_parent_and_development_role(self):
        parent = {"rows": [{"id": "a", "split": "train", "label": 1}]}
        child = {"parent_sha256": "old", "rows": parent["rows"] + [{"id": "b", "split": "train", "label": 2}]}
        cache = {"manifest_sha256": "old", "revision": DINOV2_REVISION, "size": 224,
                 "views": 2, "completed": 1, "ids": ["a"], "features": torch.ones(2, 768)}
        self.assertIs(reuse_parent_features(parent, child, cache, 224, 2, "train", "old"), cache)
        with self.assertRaisesRegex(ValueError, "unchanged prefix"):
            reuse_parent_features(parent, {**child, "rows": child["rows"][::-1]}, cache, 224, 2, "train", "old")
        with self.assertRaisesRegex(ValueError, "development features"):
            reuse_parent_features(parent, child, cache, 224, 2, "confirmatory", "old")
        with self.assertRaisesRegex(ValueError, "cache contract"):
            reuse_parent_features(parent, child, {**cache, "views": 1}, 224, 2, "train", "old")
    def test_stratification_preserves_capture_groups(self):
        rows = [{"label": index % 2, "split": "unassigned", "split_group": str(index // 2)} for index in range(80)]
        stratified_roles(rows)
        check_source_split(rows)
        self.assertEqual({row["split"] for row in rows}, {"train", "validation", "calibration", "confirmatory"})

    def test_capture_day_parses_only_valid_full_timestamp(self):
        self.assertEqual(capture_day("Stratus/012823124757_307107.jpg"), "2023-01-28")
        self.assertIsNone(capture_day("missing_102600.jpg"))
        self.assertIsNone(capture_day("999923124757_307107.jpg"))

    def test_imgw_capture_dates_stay_in_one_role_without_merging_labels(self):
        rows = [record("a", 0, dhash=0), record("b", 1, dhash=(1 << 256) - 1)]
        for index, row in enumerate(rows):
            row["archive_name"] = f"Cirrus/01282312{index:02d}00_{index}.jpg"
        assign_imgw([], rows)
        self.assertEqual(rows[0]["split"], rows[1]["split"])
        self.assertNotEqual(rows[0]["group"], rows[1]["group"])
        check_source_split(rows)

    def test_imgw_overlap_is_excluded_without_mutating_original_role(self):
        old = [record("old", role="test")]
        old[0]["split"] = "test"
        new = [record("new")]
        new[0]["archive_name"] = "missing_1.jpg"
        assign_imgw(old, new)
        self.assertEqual(new[0]["split"], "imgw-overlap")
        self.assertEqual(old[0]["split"], "test")

    def test_confirmatory_overlap_with_training_is_forbidden(self):
        with self.assertRaisesRegex(ValueError, "Split leakage"):
            validate_manifest([{"group": "same", "split": role, "label": 0} for role in ["train", "confirmatory"]])

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
    def test_confident_but_wrong_calibration_does_not_accept_everything(self):
        probabilities = np.full((30, 11), .01)
        probabilities[:, 0] = .9
        policy = choose_cloud_policy(probabilities, np.ones(30, dtype=int))
        self.assertFalse(policy["target_met"])
        self.assertEqual(policy["accepted_count"], 0)
        self.assertGreater(policy["minimum_confidence"], 1.)
        self.assertEqual(policy["margin_threshold"], 1.)
        self.assertEqual(policy["best_failed_attempt"]["precision"], 0.)
        rows = [{"id": str(index), "label": 1, "probabilities": [1.] + [0.] * 10} for index in range(30)]
        self.assertEqual(metrics(rows, policy)["accepted_count"], 0)

    def test_flat_predictions_fail_closed_during_calibration(self):
        policy = choose_cloud_policy(np.full((30, 11), 1 / 11), np.arange(30) % 10)
        self.assertFalse(policy["target_met"])
        self.assertEqual(policy["accepted_count"], 0)
        self.assertEqual(policy["margin_threshold"], 1.)

    def test_scaler_folding_preserves_raw_feature_logits(self):
        rng = np.random.default_rng(3)
        features, coefficients = rng.normal(size=(5, 12)), rng.normal(size=(11, 12))
        intercept, mean, scale = rng.normal(size=11), rng.normal(size=12), rng.uniform(.5, 2, size=12)
        weights, bias = fold_scaler(coefficients, intercept, mean, scale)
        np.testing.assert_allclose(features @ weights.T + bias, ((features - mean) / scale) @ coefficients.T + intercept, atol=1e-12)

    def test_better_abstention_alone_does_not_pass_model_gate(self):
        previous = {"top1_accuracy": .6, "macro_f1": .5, "selective_precision": .85,
                    "accepted_count": 30, "selective_coverage": .3, "sample_count": 100}
        previous["cloud_only"] = previous.copy()
        candidate = {**previous, "selective_precision": 1.}
        result = classification_gates({split: candidate for split in ["test", "diagnostic", "stress"]},
                                      {split: previous for split in ["test", "diagnostic", "stress"]})
        self.assertFalse(result["passed"])
        self.assertFalse(result["checks"]["test_top1_plus_5pp"])

    def test_easy_clear_skies_do_not_select_the_cloud_threshold(self):
        labels = np.arange(40) % 10
        probabilities = np.full((40, 11), .01)
        probabilities[np.arange(40), labels] = .9
        clouds_only = choose_cloud_policy(probabilities, labels)
        with_clear = choose_cloud_policy(np.concatenate([probabilities, np.eye(11)[[10] * 100]]), np.concatenate([labels, [10] * 100]))
        self.assertEqual(clouds_only, with_clear)

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

    def test_paired_bootstrap_keeps_capture_days_together(self):
        rows = [{"id": str(i), "label": 0, "split_group": "one-day", "probabilities": np.eye(11)[0].tolist()} for i in range(3)]
        result = paired_accuracy(rows, rows)
        self.assertEqual(result["bootstrap_cluster_count"], 1)
        self.assertEqual(result["sample_count"], 3)

    def test_fresh_confirmation_requires_cloud_precision_and_actual_accuracy_gain(self):
        previous = {"top1_accuracy": .5, "macro_f1": .45}
        candidate = {"top1_accuracy": .6, "macro_f1": .55,
                     "cloud_only": {"selective_precision": .9, "accepted_count": 25}}
        self.assertTrue(confirmatory_gates(candidate, previous)["passed"])
        self.assertFalse(confirmatory_gates({**candidate, "top1_accuracy": .52}, previous)["passed"])
        self.assertFalse(confirmatory_gates({**candidate, "cloud_only": {"selective_precision": .9, "accepted_count": 5}}, previous)["passed"])


class CheckpointTests(unittest.TestCase):
    def test_lossless_archive_retains_metadata_and_fails_on_changed_source(self):
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            shared, candidate = root / "shared.pt", root / "candidate.pt"
            atomic_save({"state_dict": {"backbone": torch.ones(100), "head": torch.ones(1)}}, shared)
            atomic_save({"state_dict": {"backbone": torch.ones(100), "head": torch.zeros(1)}, "temperature": 1.2}, candidate)
            with patch("sys.argv", ["archive", "--checkpoint", str(candidate), "--shared", str(shared), "--remove-duplicate"]):
                archive_checkpoint()
            self.assertFalse(candidate.exists())
            restored = restore_archive(root / "archived-checkpoint.pt")
            self.assertEqual(restored["temperature"], 1.2)
            self.assertEqual(list(restored["state_dict"]), ["backbone", "head"])
            self.assertTrue(torch.equal(restored["state_dict"]["head"], torch.zeros(1)))
            atomic_save({"state_dict": {"backbone": torch.zeros(100), "head": torch.ones(1)}}, shared)
            with self.assertRaisesRegex(ValueError, "Shared checkpoint changed"):
                restore_archive(root / "archived-checkpoint.pt")

    def test_raw_dino_archive_restores_prefix_head_and_normalization(self):
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            shared, candidate = root / "official.pth", root / "candidate.pt"
            atomic_save({"block": torch.ones(1000)}, shared)
            state = {"backbone.block": torch.ones(1000), "classifier.weight": torch.zeros(10),
                     "image_mean": torch.ones(3)}
            atomic_save({"state_dict": state, "architecture": "dinov2_vitb14_mlp"}, candidate)
            with patch("sys.argv", ["archive", "--checkpoint", str(candidate), "--shared", str(shared),
                                    "--shared-format", "dinov2-backbone", "--remove-duplicate"]):
                archive_checkpoint()
            self.assertFalse(candidate.exists())
            restored = restore_archive(root / "archived-checkpoint.pt")
            self.assertEqual(restored["architecture"], "dinov2_vitb14_mlp")
            self.assertEqual(list(restored["state_dict"]), list(state))
            for key, value in state.items():
                torch.testing.assert_close(restored["state_dict"][key], value, atol=0, rtol=0)

    def test_v4_export_requires_hash_checked_training_attribution(self):
        with tempfile.TemporaryDirectory() as temporary:
            path = Path(temporary) / "manifest.json"
            manifest = {"classes": GENERA, "rows": [{"source": "imgw-2024-samples", "split": "train"}],
                        "imgw_provenance": {"license": "CC-BY-4.0", "authors": "IMGW authors", "doi": "10.1002/qj.4865",
                                            "transform": "Oriented RGB", "source": "https://danepubliczne.imgw.pl/"}}
            path.write_text(json.dumps(manifest))
            checkpoint = {"pipeline_version": 4, "manifest_sha256": hashlib.sha256(path.read_bytes()).hexdigest()}
            license_text, sources = data_attribution(checkpoint, path)
            self.assertIn("IMGW CC BY 4.0, IMGW authors", license_text)
            self.assertIn("Oriented RGB", license_text)
            self.assertEqual(sources[-1], "https://danepubliczne.imgw.pl/")
            with self.assertRaisesRegex(ValueError, "requires its frozen manifest"):
                data_attribution(checkpoint, None)
            with self.assertRaisesRegex(ValueError, "manifest mismatch"):
                data_attribution({**checkpoint, "manifest_sha256": "changed"}, path)

    def test_failed_atomic_save_preserves_previous_and_removes_partial_file(self):
        with tempfile.TemporaryDirectory() as temporary:
            path = Path(temporary) / "resume.pt"
            atomic_save({"epoch": 1}, path)
            with patch("v4_checkpoint.torch.save", side_effect=OSError("disk full")):
                with self.assertRaisesRegex(OSError, "disk full"):
                    atomic_save({"epoch": 2}, path)
            self.assertEqual(torch.load(path, weights_only=True), {"epoch": 1})
            self.assertFalse(path.with_suffix(".pending.pt").exists())
    def test_finetuning_only_unfreezes_declared_visual_blocks(self):
        model = torch.nn.Module()
        model.backbone = torch.nn.Module()
        model.backbone.blocks = torch.nn.ModuleList([torch.nn.Linear(2, 2) for _ in range(4)])
        model.backbone.norm = torch.nn.LayerNorm(2)
        model.classifier = torch.nn.Linear(2, 1)
        names = trainable_names(model, 2)
        self.assertNotIn("backbone.blocks.0.weight", names)
        self.assertNotIn("backbone.blocks.1.weight", names)
        self.assertIn("backbone.blocks.2.weight", names)
        self.assertIn("backbone.norm.weight", names)
        self.assertIn("classifier.weight", names)

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


class ExportGateTests(unittest.TestCase):
    def test_unmeasured_v4_checkpoint_cannot_be_exported_as_approved(self):
        with tempfile.TemporaryDirectory() as temporary:
            path = Path(temporary) / "cloud-genus-net.pt"
            with self.assertRaisesRegex(ValueError, "paired evaluation"):
                classification_export_evidence({"pipeline_version": 4}, path)
            evidence = classification_export_evidence({"pipeline_version": 4}, path, research_only=True)
            self.assertIn("not approved", evidence["classification_approval"])

    def test_export_recomputes_gates_and_checks_exact_checkpoint_hash(self):
        with tempfile.TemporaryDirectory() as temporary:
            path = Path(temporary) / "cloud-genus-net.pt"
            path.write_bytes(b"test checkpoint")
            previous = {"top1_accuracy": .6, "macro_f1": .5, "selective_precision": .9,
                        "accepted_count": 30, "selective_coverage": .3, "sample_count": 100}
            previous["cloud_only"] = previous.copy()
            candidate = {**previous, "top1_accuracy": .7, "macro_f1": .6,
                         "cloud_only": {**previous["cloud_only"], "top1_accuracy": .7}}
            checkpoint = {"pipeline_version": 4, "manifest_sha256": "frozen", "abstention_policy": {"target_met": True}}
            evidence = {"manifest_sha256": "frozen", "calibrated_checkpoint_sha256": hashlib.sha256(path.read_bytes()).hexdigest(),
                        "holdouts_evaluated": True, "confirmatory_evaluated": True,
                        "reports": {key: candidate.copy() for key in ("test", "diagnostic", "stress", "confirmatory")},
                        "baseline_reports": {key: previous for key in ("test", "diagnostic", "stress", "confirmatory")}}
            report = path.parent / "evaluation.json"
            report.write_text(json.dumps(evidence))
            self.assertIn("native parity", classification_export_evidence(checkpoint, path)["classification_approval"])
            evidence["confirmatory_evidence"] = "previously_exposed_regression"
            report.write_text(json.dumps(evidence))
            with self.assertRaisesRegex(ValueError, "fresh confirmation"):
                classification_export_evidence(checkpoint, path)
            del evidence["confirmatory_evidence"]
            report.write_text(json.dumps(evidence))
            with self.assertRaisesRegex(ValueError, "fresh confirmation"):
                classification_export_evidence({**checkpoint, "confirmatory_set_exposed": True}, path)
            evidence["reports"]["diagnostic"]["top1_accuracy"] = .3
            report.write_text(json.dumps(evidence))
            with self.assertRaisesRegex(ValueError, "gates failed"):
                classification_export_evidence(checkpoint, path)
            path.write_bytes(b"different weights")
            with self.assertRaisesRegex(ValueError, "not bound"):
                classification_export_evidence(checkpoint, path)


class RemoteArchiveTests(unittest.TestCase):
    def test_bounded_ranges_are_snapshot_checked_and_cached(self):
        with patch("imgw_data.http.client.HTTPSConnection") as connection:
            response = MagicMock()
            response.__enter__.return_value = response
            response.status = 206
            response.headers = {"Content-Range": "bytes 10-99/100", "ETag": '"fixed"'}
            response.read.return_value = bytes(range(10, 100))
            connection.return_value.getresponse.return_value = response
            with RangeReader("https://example.test/data.zip", 100, '"fixed"') as reader:
                reader.seek(10)
                self.assertEqual(reader.read(3), bytes([10, 11, 12]))
                self.assertEqual(reader.read(2), bytes([13, 14]))
                self.assertEqual(connection.return_value.request.call_count, 1)
                self.assertEqual(reader.transferred, 90)

    def test_ignored_range_is_rejected_before_downloading_archive(self):
        with patch("imgw_data.http.client.HTTPSConnection") as connection:
            response = MagicMock()
            response.__enter__.return_value = response
            response.status = 200
            connection.return_value.getresponse.return_value = response
            with RangeReader("https://example.test/data.zip", 100, '"fixed"') as reader:
                with self.assertRaisesRegex(ValueError, "ignored byte range"):
                    reader.read(5)
            response.read.assert_not_called()


if __name__ == "__main__":
    unittest.main()
