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
from train_ccsn import softmax
from train_v4 import TrainingImages
from v4_checkpoint import atomic_save
from v4_gate import classification_gates, confirmatory_gates
from v4_data import validate_manifest
from v4_metrics import balanced_temperature, choose_cloud_policy, metrics, paired_accuracy, unique_labeled_rows


@torch.inference_mode()
def predict(model, rows, size, device):
    values = []
    for images, _ in DataLoader(TrainingImages(rows, size), batch_size=4):
        values.append(model(images.to(device)).cpu().numpy())
    return np.concatenate(values)


def prediction_rows(rows, logits, temperature):
    values = softmax(logits, temperature)
    return [{**{key: row[key] for key in ("id", "label", "source", "split", "group", "split_group") if key in row},
             "probabilities": probability.tolist()}
            for row, probability in zip(rows, values, strict=True)]


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--manifest", type=Path, required=True)
    parser.add_argument("--checkpoint", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--baseline", type=Path)
    parser.add_argument("--evaluate-holdouts", action="store_true")
    parser.add_argument("--evaluate-confirmatory", action="store_true")
    parser.add_argument("--confirmatory-is-regression", action="store_true",
                        help="Mark a previously exposed confirmation set as regression-only evidence")
    parser.add_argument("--private-image", type=Path)
    parser.add_argument("--device", choices=["auto", "cpu", "mps"], default="auto")
    args = parser.parse_args()
    if args.evaluate_confirmatory and not args.evaluate_holdouts:
        raise ValueError("Fresh confirmation also requires calibration and regression evaluation")
    if args.confirmatory_is_regression and not args.evaluate_confirmatory:
        raise ValueError("Regression labeling requires evaluating that set")
    if args.output.exists():
        raise ValueError("Evaluation output already exists; preserve the previous result")
    torch.set_num_threads(4)
    manifest = json.loads(args.manifest.read_text())
    validate_manifest(manifest["rows"])
    digest = hashlib.sha256(args.manifest.read_bytes()).hexdigest()
    checkpoint = torch.load(args.checkpoint, map_location="cpu", weights_only=True)
    if checkpoint.get("confirmatory_set_exposed") and args.evaluate_confirmatory and not args.confirmatory_is_regression:
        raise ValueError("This candidate must label the exposed confirmation set as regression evidence")
    if checkpoint["manifest_sha256"] != digest or checkpoint["classes"] != GENERA:
        raise ValueError("Checkpoint does not match the frozen manifest/classes")
    device = torch.device(("mps" if torch.backends.mps.is_available() else "cpu") if args.device == "auto" else args.device)
    model = build_model(len(GENERA), architecture=checkpoint["architecture"], model_config=checkpoint.get("model_config"))
    model.load_state_dict(checkpoint["state_dict"])
    model = model.eval().to(device)
    validation = [row for row in manifest["rows"] if row["split"] == "validation"]
    validation_logits = predict(model, validation, checkpoint["input_size"], device)
    policy = {"minimum_confidence": .9, "margin_threshold": .5}
    result = {"manifest_sha256": digest, "checkpoint_sha256": hashlib.sha256(args.checkpoint.read_bytes()).hexdigest(),
              "architecture": checkpoint["architecture"], "epoch": checkpoint["epoch"],
              "holdouts_evaluated": args.evaluate_holdouts,
              "confirmatory_evaluated": args.evaluate_confirmatory,
              "confirmatory_evidence": ("previously_exposed_regression" if args.confirmatory_is_regression
                                       else "fresh" if args.evaluate_confirmatory else "not_evaluated"),
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
        calibration_labels = np.asarray([row["label"] for row in calibration])
        temperature = balanced_temperature(calibration_logits, calibration_labels)
        policy = choose_cloud_policy(softmax(calibration_logits, temperature), calibration_labels, .9)
        result.update({"temperature": temperature, "policy": policy, "reports": {}, "baseline_reports": {}, "paired": {}})
        roles = {"calibration", "test", "diagnostic", "stress", "outlier"}
        report_roles = ["calibration", "test", "diagnostic", "stress"]
        if args.evaluate_confirmatory:
            if not any(row["split"] == "confirmatory" for row in baseline_rows):
                raise ValueError("Missing paired fresh confirmation baseline")
            roles.add("confirmatory")
            report_roles.append("confirmatory")
        rows = [row for row in manifest["rows"] if row["split"] in roles]
        if args.private_image:
            rows.append({"id": "private-feedback-dark-sky", "path": str(args.private_image),
                         "label": -1, "source": "private-feedback", "split": "unlabeled", "group": "private"})
        logits = predict(model, rows, checkpoint["input_size"], device)
        predictions = prediction_rows(rows, logits, temperature)
        for split in report_roles:
            selected = [row for row in predictions if row["split"] == split]
            previous = [row for row in baseline_rows if row["split"] == split]
            result["reports"][split] = metrics(selected, policy)
            result["baseline_reports"][split] = metrics(previous, baseline["policy"])
            result["paired"][split] = paired_accuracy(selected, previous)
        result["rows"] = predictions
        result["classification_gates"] = classification_gates(result["reports"], result["baseline_reports"])
        if args.evaluate_confirmatory:
            result["confirmatory_gates"] = confirmatory_gates(result["reports"]["confirmatory"], result["baseline_reports"]["confirmatory"])
        result["source_reports"] = {source: metrics([row for row in predictions if row["source"] == source and row["split"] in {"test", "confirmatory"}], policy)
                                    for source in sorted({row["source"] for row in predictions if row["split"] in {"test", "confirmatory"}})}
        result["rejection_challenges"] = {}
        for source in ("ccsn", "project-outlier"):
            selected = [row for row in predictions if row["label"] == -1 and row["source"] == source]
            if selected:
                ordered = np.sort(np.asarray([row["probabilities"] for row in selected]), axis=1)
                accepted = (ordered[:, -1] >= policy["minimum_confidence"]) & (ordered[:, -1] - ordered[:, -2] >= policy["margin_threshold"])
                result["rejection_challenges"][source] = {"sample_count": len(selected), "abstention_rate": float(1 - accepted.mean())}
        checkpoint.update({"temperature": temperature, "abstention_policy": policy})
        args.output.mkdir(parents=True)
        atomic_save(checkpoint, args.output / "cloud-genus-net.pt")
        result["calibrated_checkpoint_sha256"] = hashlib.sha256((args.output / "cloud-genus-net.pt").read_bytes()).hexdigest()
    else:
        args.output.mkdir(parents=True)
    (args.output / "evaluation.json").write_text(json.dumps(result, indent=2) + "\n")
    print(json.dumps({key: value for key, value in result.items() if key not in {"rows", "baseline_reports", "reports"}}, indent=2), flush=True)
    if args.evaluate_holdouts:
        print(json.dumps({split: {key: value for key, value in report.items() if key in {"sample_count", "top1_accuracy", "macro_f1", "selective_precision", "selective_coverage"}} for split, report in result["reports"].items()}, indent=2))


if __name__ == "__main__":
    main()
