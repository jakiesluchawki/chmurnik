"""Compare original-photo ImageIO/CoreGraphics/Vision inference against PyTorch."""

import argparse
import hashlib
import json
from pathlib import Path
import subprocess

import numpy as np
import torch

from labels import GENERA
from model import build_model
from train_v4 import TrainingImages


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--artifacts", type=Path, required=True)
    parser.add_argument("--model", type=Path, required=True)
    parser.add_argument("--manifest", type=Path, required=True)
    parser.add_argument("--native-executable", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()
    if args.output.exists():
        raise ValueError("Preserve previous native parity results")
    args.output.mkdir(parents=True)
    torch.set_num_threads(2)
    checkpoint = torch.load(args.artifacts / "cloud-genus-net.pt", map_location="cpu", weights_only=True)
    if checkpoint["manifest_sha256"] != hashlib.sha256(args.manifest.read_bytes()).hexdigest():
        raise ValueError("Manifest mismatch")
    manifest = json.loads(args.manifest.read_text())
    rows = []
    for label in range(len(GENERA)):
        rows.extend([row for row in manifest["rows"] if row["split"] == "validation" and row["label"] == label][:3])
    inputs = args.output / "inputs.json"
    inputs.write_text(json.dumps([{key: row[key] for key in ("id", "path")} for row in rows], indent=2) + "\n")
    predictions = args.output / "native.json"
    subprocess.run([str(args.native_executable.resolve()), str(inputs.resolve()), str(args.model.resolve()), str(predictions.resolve())], check=True)
    native = {row["id"]: row for row in json.loads(predictions.read_text())}
    if set(native) != {row["id"] for row in rows}:
        raise ValueError("Native output does not cover the requested sample")
    model = build_model(len(GENERA), architecture=checkpoint["architecture"])
    model.load_state_dict(checkpoint["state_dict"])
    model.eval()
    dataset = TrainingImages(rows, checkpoint["input_size"])
    results = []
    policy = checkpoint["abstention_policy"]
    for index, row in enumerate(rows):
        with torch.inference_mode():
            expected = torch.softmax(model(dataset[index][0].unsqueeze(0)) / checkpoint["temperature"], 1).numpy()[0]
        actual = np.asarray(native[row["id"]]["probabilities"])
        ordered = np.sort(expected)
        def accepted(values):
            sorted_values = np.sort(values)
            return bool(sorted_values[-1] >= policy["minimum_confidence"] and sorted_values[-1] - sorted_values[-2] >= policy["margin_threshold"])
        results.append({"id": row["id"], "maximum_error": float(np.max(np.abs(actual - expected))),
                        "torch_top": GENERA[int(expected.argmax())], "native_top": GENERA[int(actual.argmax())],
                        "near_tie": bool(ordered[-1] - ordered[-2] <= .05),
                        "torch_accepted": accepted(expected), "native_accepted": accepted(actual),
                        "seconds": native[row["id"]]["seconds"]})
    mismatches = [row["id"] for row in results if row["torch_top"] != row["native_top"] and not row["near_tie"]]
    decision_changes = [row["id"] for row in results if row["torch_accepted"] != row["native_accepted"]]
    report = {"scope": "Original photographs via native ImageIO, CoreGraphics and Vision; not a simulator screenshot test",
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
