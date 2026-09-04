import copy
import hashlib
import io
import json
from pathlib import Path
import random
import tempfile
import unittest
import warnings
import zipfile

import numpy as np
from PIL import Image
import torch

from cloud_segmenter import CloudSegmenter, masked_loss
from dlr_segmentation_data import assign_groups, binary_labels, capture_info, check_archive, read_pair, sha256, validate_rows
from evaluate_cloud_segmenter import checked_candidate
from segmentation_metrics import appearance_mask, confusion, metrics, summarize


class DataTests(unittest.TestCase):
    def test_labels_ignore_camera_and_combine_layers(self):
        target, valid = binary_labels(np.array([[0, 1, 2, 3, 4]], dtype=np.uint8))
        np.testing.assert_array_equal(target, [[0, 0, 1, 1, 1]])
        np.testing.assert_array_equal(valid, [[0, 1, 1, 1, 1]])
        with self.assertRaises(ValueError):
            binary_labels(np.array([[255]], dtype=np.uint8))
        with self.assertRaises(ValueError):
            binary_labels(np.zeros((2, 2, 3), dtype=np.uint8))

    def test_capture_year_is_read_not_assumed_from_description(self):
        self.assertEqual(capture_info("kontas_2017/images/asi_001_170328164030.jpg"), ("2017-03-28", "Cloud_Cam_Kontas"))
        self.assertEqual(capture_info("test_set/images/Cloud_Cam_PVotSky/20230126124230_00163.jpg"), ("2023-01-26", "Cloud_Cam_PVotSky"))

    def test_group_split_keeps_days_duplicates_and_test_separate(self):
        rng = random.Random(77)
        rows = [{"id": str(i), "day": f"day-{i}", "pixel_sha256": hashlib.sha256(str(i).encode()).hexdigest(),
                 "dhash": f"{rng.getrandbits(256):064x}", "published_split": "train"} for i in range(12)]
        rows[1]["day"] = rows[0]["day"]
        rows[3]["pixel_sha256"] = rows[2]["pixel_sha256"]
        rows[11]["published_split"] = "test"
        rows[10]["pixel_sha256"] = rows[11]["pixel_sha256"]
        second = copy.deepcopy(rows)
        assign_groups(rows)
        assign_groups(second)
        self.assertEqual(rows, second)
        self.assertEqual(rows[0]["split"], rows[1]["split"])
        self.assertEqual(rows[2]["split"], rows[3]["split"])
        self.assertEqual(rows[10]["split"], "test-overlap")
        self.assertEqual(rows[11]["split"], "test")
        rows[11]["split"] = "train"
        with self.assertRaises(ValueError):
            validate_rows(rows)

    def test_zip_traversal_and_duplicate_names_are_rejected(self):
        for name in ("../mask.png", "/image.jpg", "a\\b.png"):
            buffer = io.BytesIO()
            with zipfile.ZipFile(buffer, "w") as archive:
                archive.writestr(name, b"x")
            with zipfile.ZipFile(buffer) as archive, self.assertRaises(ValueError):
                check_archive(archive)
        buffer = io.BytesIO()
        with zipfile.ZipFile(buffer, "w") as archive, warnings.catch_warnings():
            warnings.simplefilter("ignore", UserWarning)
            archive.writestr("image.jpg", b"a")
            archive.writestr("image.jpg", b"b")
        with zipfile.ZipFile(buffer) as archive, self.assertRaises(ValueError):
            check_archive(archive)

    def test_mask_resizing_preserves_class_indices(self):
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            image, mask = io.BytesIO(), io.BytesIO()
            Image.new("RGB", (4, 4)).save(image, format="PNG")
            labels = np.array([[0, 0, 1, 1], [0, 0, 1, 1], [2, 2, 4, 4], [2, 2, 4, 4]], dtype=np.uint8)
            Image.fromarray(labels).save(mask, format="PNG")
            with zipfile.ZipFile(root / "data.zip", "w") as archive:
                archive.writestr("image.png", image.getvalue())
                archive.writestr("mask.png", mask.getvalue())
            _, resized = read_pair(root, {"archive": "data.zip", "image": "image.png", "mask": "mask.png"}, size=2)
            np.testing.assert_array_equal(np.array(resized), [[0, 1], [2, 4]])


class ModelTests(unittest.TestCase):
    def test_full_resolution_single_binary_output(self):
        torch.set_num_threads(2)
        model = CloudSegmenter().eval()
        with torch.inference_mode():
            output = model(torch.zeros(1, 3, 64, 64))
        self.assertEqual(tuple(output.shape), (1, 1, 64, 64))
        self.assertTrue(torch.isfinite(output).all())

    def test_camera_pixels_have_no_loss_or_gradient(self):
        logits = torch.tensor([[[[.1, .2, .3]]]], requires_grad=True)
        target, valid = torch.tensor([[[[0., 1., 0.]]]]), torch.tensor([[[[1., 1., 0.]]]])
        original = masked_loss(logits, target, valid)
        changed = logits.detach().clone()
        changed[..., 2] = 100
        self.assertAlmostEqual(original.item(), masked_loss(changed, target, valid).item())
        original.backward()
        self.assertEqual(logits.grad[..., 2].item(), 0.)
        with self.assertRaises(ValueError):
            masked_loss(logits, target, torch.zeros_like(valid))


class ProvenanceTests(unittest.TestCase):
    def test_evaluation_requires_selected_completed_unmodified_fit(self):
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            manifest, checkpoint = root / "manifest.json", root / "cloud-mask.pt"
            manifest.write_text("{}")
            contract = {"manifest_sha256": sha256(manifest), "sources": {
                "cloud_segmenter.py": sha256(Path(__file__).parent / "cloud_segmenter.py")}}
            validation = {"summary": {"cloud_iou": .30}}
            saved = {"contract": contract, "epoch": 30, "validation": validation}
            torch.save(saved, checkpoint)
            training = {"checkpoint_sha256": sha256(checkpoint), "contract": contract,
                        "selected_epoch": 30, "validation": validation,
                        "history": [{"epoch": epoch, "validation": {"cloud_iou": epoch / 100}} for epoch in range(1, 31)]}
            report = root / "training.json"
            report.write_text(json.dumps(training))
            self.assertEqual(checked_candidate(checkpoint, manifest), saved)
            for change in ("checkpoint", "unfinished", "selection"):
                broken = copy.deepcopy(training)
                if change == "checkpoint":
                    broken["checkpoint_sha256"] = "wrong"
                elif change == "unfinished":
                    broken["history"].pop()
                else:
                    broken["history"][0]["validation"]["cloud_iou"] = 1.
                report.write_text(json.dumps(broken))
                with self.assertRaises(ValueError):
                    checked_candidate(checkpoint, manifest)
            report.write_text(json.dumps(training))
            manifest.write_text('{"changed":true}')
            with self.assertRaises(ValueError):
                checked_candidate(checkpoint, manifest)


class MetricsTests(unittest.TestCase):
    def test_ignore_region_and_hand_calculated_counts(self):
        counts = confusion([1, 1, 0, 0, 1], [1, 0, 1, 0, 0], [1, 1, 1, 1, 0])
        self.assertEqual(counts, {"tp": 1, "fp": 1, "fn": 1, "tn": 1})
        self.assertAlmostEqual(metrics(counts)["cloud_iou"], 1 / 3)
        self.assertEqual(metrics(counts)["dice"], .5)

    def test_empty_sky_does_not_inflate_iou(self):
        row = {"group": "a", "counts": {"tp": 0, "fp": 0, "fn": 0, "tn": 10}}
        result = summarize([row])
        self.assertIsNone(result["cloud_iou"])
        self.assertIsNone(result["mean_image_iou"])
        self.assertEqual(result["undefined_empty_image_iou"], 1)
        self.assertEqual(result["clear_image_false_cloud_fraction"], 0.)

    def test_cluster_bootstrap_is_deterministic_and_counts_days(self):
        rows = [{"group": name, "counts": {"tp": n, "fp": 2, "fn": 1, "tn": 3}}
                for name, n in [("day1", 5), ("day1", 8), ("day2", 10)]]
        result = summarize(rows, 200)
        self.assertEqual(result, summarize(rows, 200))
        self.assertEqual(result["capture_duplicate_groups"], 2)
        self.assertLessEqual(result["cloud_iou_cluster_95ci"][0], result["cloud_iou"])
        self.assertGreaterEqual(result["cloud_iou_cluster_95ci"][1], result["cloud_iou"])
        json.dumps(result, allow_nan=False)

    def test_color_heuristic_respects_ignored_camera(self):
        image = np.array([[[30, 80, 150], [200, 200, 200], [255, 255, 255]]], dtype=np.uint8)
        result = appearance_mask(image, np.array([[1, 1, 0]], dtype=bool))
        np.testing.assert_array_equal(result, [[False, True, False]])


if __name__ == "__main__":
    unittest.main()
