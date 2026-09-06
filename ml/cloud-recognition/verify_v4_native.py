"""Compare original-photo ImageIO/CoreGraphics/Vision inference against PyTorch."""

import argparse
import hashlib
import json
from pathlib import Path
import subprocess

import coremltools as ct
import numpy as np
import torch

from labels import GENERA
from model import build_model
from train_v4 import TrainingImages
from verify_v4_coreml import export_identity, probability_comparison


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--artifacts", type=Path, required=True)
    parser.add_argument("--model", type=Path, required=True)
    parser.add_argument("--manifest", type=Path, required=True)
    parser.add_argument("--native-executable", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--all-validation", action="store_true")
    args = parser.parse_args()
    if args.output.exists():
        raise ValueError("Preserve previous native parity results")
    args.output.mkdir(parents=True)
    torch.set_num_threads(2)
    checkpoint_path = args.artifacts / "cloud-genus-net.pt"
    checkpoint = torch.load(checkpoint_path, map_location="cpu", weights_only=True)
    if checkpoint["manifest_sha256"] != hashlib.sha256(args.manifest.read_bytes()).hexdigest():
        raise ValueError("Manifest mismatch")
    manifest = json.loads(args.manifest.read_text())
    package = ct.models.MLModel(str(args.model), skip_model_load=True)
    identity = export_identity(checkpoint, checkpoint_path, package.user_defined_metadata)
    rows = []
    for label in range(len(GENERA)):
        selected = [row for row in manifest["rows"] if row["split"] == "validation" and row["label"] == label]
        rows.extend(selected if args.all_validation else selected[:3])
    if not rows or len({row["id"] for row in rows}) != len(rows):
        raise ValueError("Validation selection is empty or contains repeated IDs")
    inputs = args.output / "inputs.json"
    inputs.write_text(json.dumps([{key: row[key] for key in ("id", "path")} for row in rows], indent=2) + "\n")
    predictions = args.output / "native.json"
    subprocess.run([str(args.native_executable.resolve()), str(inputs.resolve()), str(args.model.resolve()), str(predictions.resolve())], check=True)
    native_rows = json.loads(predictions.read_text())
    native = {row["id"]: row for row in native_rows}
    if len(native_rows) != len(rows) or set(native) != {row["id"] for row in rows}:
        raise ValueError("Native output does not cover the requested sample")
    model = build_model(len(GENERA), architecture=checkpoint["architecture"], model_config=checkpoint.get("model_config"))
    model.load_state_dict(checkpoint["state_dict"])
    model.eval()
    dataset = TrainingImages(rows, checkpoint["input_size"])
    results = []
    policy = checkpoint["abstention_policy"]
    for index, row in enumerate(rows):
        with torch.inference_mode():
            expected = torch.softmax(model(dataset[index][0].unsqueeze(0)) / checkpoint["temperature"], 1).numpy()[0]
        actual = np.asarray(native[row["id"]]["probabilities"])
        compared = probability_comparison(expected, actual)
        ordered = np.sort(expected)
        def accepted(values):
            sorted_values = np.sort(values)
            return bool(sorted_values[-1] >= policy["minimum_confidence"] and sorted_values[-1] - sorted_values[-2] >= policy["margin_threshold"])
        results.append({"id": row["id"], "maximum_error": compared["max_absolute_error"],
                        "torch_probabilities": compared["torch_probabilities"],
                        "native_probabilities": compared["coreml_probabilities"],
                        "torch_top": GENERA[int(expected.argmax())], "native_top": GENERA[int(actual.argmax())],
                        "near_tie": bool(ordered[-1] - ordered[-2] <= .05),
                        "torch_accepted": accepted(expected), "native_accepted": accepted(actual),
                        "seconds": native[row["id"]]["seconds"]})
        if index % 50 == 0:
            print(f"Native parity {index + 1}/{len(rows)}", flush=True)
    mismatches = [row["id"] for row in results if row["torch_top"] != row["native_top"] and not row["near_tie"]]
    decision_changes = [row["id"] for row in results if row["torch_accepted"] != row["native_accepted"]]
    report = {"scope": "Original photographs via native ImageIO, CoreGraphics and Vision; not a simulator screenshot test",
              "export_identity": identity,
              "package_files_sha256": {str(path.relative_to(args.model)): hashlib.sha256(path.read_bytes()).hexdigest()
                                       for path in sorted(args.model.rglob("*")) if path.is_file()},
              "native_executable_sha256": hashlib.sha256(args.native_executable.read_bytes()).hexdigest(),
              "native_predictions_sha256": hashlib.sha256(predictions.read_bytes()).hexdigest(),
              "verifier_sha256": hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),
              "selection": "all validation rows" if args.all_validation else "first three validation rows per class",
              "near_tie_margin": .05,
              "sample_count": len(results), "non_tie_top1_mismatches": mismatches,
              "acceptance_changes": decision_changes, "maximum_probability_error": max(row["maximum_error"] for row in results),
              "warm_median_seconds": float(np.median([row["seconds"] for row in results[1:]])),
              "passed": not mismatches and not decision_changes, "rows": results}
    (args.output / "report.json").write_text(json.dumps(report, indent=2) + "\n")
    print(json.dumps({key: value for key, value in report.items() if key != "rows"}, indent=2))
    if not report["passed"]:
        raise SystemExit("Native preprocessing changes decisions; review before integration")


if __name__ == "__main__":
    main()
