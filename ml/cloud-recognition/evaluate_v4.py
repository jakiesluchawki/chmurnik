"""Validation-only by default; explicitly unlock holdouts after model selection."""

import argparse
import hashlib
import json
from pathlib import Path

import numpy as np
import torch
from torch.utils.data import DataLoader

from labels import GENERA
from model import build_model
from train_ccsn import calibrate, choose_policy, softmax
from train_v4 import TrainingImages
from v4_checkpoint import atomic_save
from v4_metrics import metrics, paired_accuracy, unique_labeled_rows


@torch.inference_mode()
def predict(model, rows, size, device):
    values = []
    for images, _ in DataLoader(TrainingImages(rows, size), batch_size=4):
        values.append(model(images.to(device)).cpu().numpy())
    return np.concatenate(values)


def prediction_rows(rows, logits, temperature):
    values = softmax(logits, temperature)
    return [{**{key: row[key] for key in ("id", "label", "source", "split", "group") if key in row},
             "probabilities": probability.tolist()}
            for row, probability in zip(rows, values, strict=True)]


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--manifest", type=Path, required=True)
    parser.add_argument("--checkpoint", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--baseline", type=Path)
    parser.add_argument("--evaluate-holdouts", action="store_true")
    parser.add_argument("--private-image", type=Path)
    args = parser.parse_args()
    if args.output.exists():
        raise ValueError("Evaluation output already exists; preserve the previous result")
    torch.set_num_threads(4)
    manifest = json.loads(args.manifest.read_text())
    digest = hashlib.sha256(args.manifest.read_bytes()).hexdigest()
    checkpoint = torch.load(args.checkpoint, map_location="cpu", weights_only=True)
    if checkpoint["manifest_sha256"] != digest or checkpoint["classes"] != GENERA:
        raise ValueError("Checkpoint does not match the frozen manifest/classes")
    device = torch.device("mps" if torch.backends.mps.is_available() else "cpu")
    model = build_model(len(GENERA), architecture=checkpoint["architecture"])
    model.load_state_dict(checkpoint["state_dict"])
    model = model.eval().to(device)
    validation = [row for row in manifest["rows"] if row["split"] == "validation"]
    validation_logits = predict(model, validation, checkpoint["input_size"], device)
    policy = {"minimum_confidence": .9, "margin_threshold": .5}
    result = {"manifest_sha256": digest, "checkpoint_sha256": hashlib.sha256(args.checkpoint.read_bytes()).hexdigest(),
              "architecture": checkpoint["architecture"], "epoch": checkpoint["epoch"],
              "holdouts_evaluated": args.evaluate_holdouts,
              "validation": metrics(prediction_rows(validation, validation_logits, 1), policy)}
    if args.evaluate_holdouts:
        if args.baseline is None:
            raise ValueError("A paired shipped-model baseline is required")
        baseline = json.loads(args.baseline.read_text())
        if baseline["manifest_sha256"] != digest:
            raise ValueError("Baseline manifest mismatch")
        by_id = {row["id"]: row for row in manifest["rows"]}
        baseline_rows = [{**row, "group": by_id[row["id"]]["group"]} for row in baseline["rows"] if row["id"] in by_id]
        calibration, _ = unique_labeled_rows([row for row in manifest["rows"] if row["split"] == "calibration"])
        calibration_logits = predict(model, calibration, checkpoint["input_size"], device)
        temperature = calibrate(calibration_logits, np.asarray([row["label"] for row in calibration]))
        policy = choose_policy(softmax(calibration_logits, temperature), np.asarray([row["label"] for row in calibration]), .9)
        result.update({"temperature": temperature, "policy": policy, "reports": {}, "baseline_reports": {}, "paired": {}})
        rows = [row for row in manifest["rows"] if row["split"] in {"calibration", "test", "diagnostic", "stress", "outlier"}]
        if args.private_image:
            rows.append({"id": "private-feedback-dark-sky", "path": str(args.private_image),
                         "label": -1, "source": "private-feedback", "split": "unlabeled", "group": "private"})
        logits = predict(model, rows, checkpoint["input_size"], device)
        predictions = prediction_rows(rows, logits, temperature)
        for split in ("calibration", "test", "diagnostic", "stress"):
            selected = [row for row in predictions if row["split"] == split]
            previous = [row for row in baseline_rows if row["split"] == split]
            result["reports"][split] = metrics(selected, policy)
            result["baseline_reports"][split] = metrics(previous, baseline["policy"])
            result["paired"][split] = paired_accuracy(selected, previous)
        result["rows"] = predictions
        checkpoint.update({"temperature": temperature, "abstention_policy": policy})
        args.output.mkdir(parents=True)
        atomic_save(checkpoint, args.output / "cloud-genus-net.pt")
    else:
        args.output.mkdir(parents=True)
    (args.output / "evaluation.json").write_text(json.dumps(result, indent=2) + "\n")
    print(json.dumps({key: value for key, value in result.items() if key not in {"rows", "baseline_reports", "reports"}}, indent=2), flush=True)
    if args.evaluate_holdouts:
        print(json.dumps({split: {key: value for key, value in report.items() if key in {"sample_count", "top1_accuracy", "macro_f1", "selective_precision", "selective_coverage"}} for split, report in result["reports"].items()}, indent=2))


if __name__ == "__main__":
    main()
