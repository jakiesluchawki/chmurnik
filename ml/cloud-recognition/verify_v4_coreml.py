"""Check probability parity on identical RGB inputs, separate from photo geometry."""

import argparse
import hashlib
import json
from pathlib import Path
import time

import coremltools as ct
import numpy as np
from PIL import Image
import torch

from labels import GENERA
from model import build_model
from train_v4 import TrainingImages


def export_identity(checkpoint, checkpoint_path, metadata):
    if checkpoint.get("classes") != GENERA or json.loads(metadata["classes"]) != GENERA:
        raise ValueError("Checkpoint/Core ML class order mismatch")
    expected = {
        "checkpoint_sha256": hashlib.sha256(checkpoint_path.read_bytes()).hexdigest(),
        "manifest_sha256": checkpoint["manifest_sha256"],
        "architecture": checkpoint["architecture"],
        "input_size": str(checkpoint["input_size"]),
        "crop_fraction": str(checkpoint["crop_fraction"]),
        "calibration_temperature": str(checkpoint["temperature"]),
        "minimum_confidence": str(checkpoint["abstention_policy"]["minimum_confidence"]),
        "abstention_margin_threshold": str(checkpoint["abstention_policy"]["margin_threshold"]),
    }
    for key, value in expected.items():
        if metadata.get(key) != value:
            raise ValueError(f"Core ML export identity mismatch: {key}")
    if metadata.get("export_precision") not in {"float16", "float32"}:
        raise ValueError("Unrecognized export precision")
    return {**expected, "export_precision": metadata["export_precision"],
            "classification_approval": metadata.get("classification_approval", "missing")}


def probability_comparison(expected, actual):
    expected, actual = np.asarray(expected), np.asarray(actual)
    for name, values in (("Torch", expected), ("Core ML", actual)):
        if values.shape != (len(GENERA),) or not np.isfinite(values).all():
            raise ValueError(f"Invalid {name} probability tensor")
        if (values < 0).any() or (values > 1).any() or abs(float(values.sum()) - 1) > .01:
            raise ValueError(f"Invalid {name} probability distribution")
    margin = float(np.sort(expected)[-1] - np.sort(expected)[-2])
    return {"max_absolute_error": float(np.max(np.abs(expected - actual))),
            "torch_top": GENERA[int(expected.argmax())], "coreml_top": GENERA[int(actual.argmax())],
            "near_tie": margin <= .01,
            "torch_probabilities": expected.tolist(), "coreml_probabilities": actual.tolist()}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--artifacts", type=Path, required=True)
    parser.add_argument("--model", type=Path, required=True)
    parser.add_argument("--manifest", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--all-validation", action="store_true")
    args = parser.parse_args()
    if args.output.exists():
        raise ValueError("Preserve previous parity results")
    torch.set_num_threads(2)
    checkpoint_path = args.artifacts / "cloud-genus-net.pt"
    checkpoint = torch.load(checkpoint_path, map_location="cpu", weights_only=True)
    manifest = json.loads(args.manifest.read_text())
    if checkpoint["manifest_sha256"] != hashlib.sha256(args.manifest.read_bytes()).hexdigest():
        raise ValueError("Manifest mismatch")
    model = build_model(len(GENERA), architecture=checkpoint["architecture"], model_config=checkpoint.get("model_config"))
    model.load_state_dict(checkpoint["state_dict"])
    model.eval()
    loaded = time.monotonic()
    coreml = ct.models.MLModel(str(args.model), compute_units=ct.ComputeUnit.ALL)
    load_seconds = time.monotonic() - loaded
    identity = export_identity(checkpoint, checkpoint_path, coreml.user_defined_metadata)
    selected = []
    for label in range(len(GENERA)):
        rows = [row for row in manifest["rows"] if row["split"] == "validation" and row["label"] == label]
        selected.extend(rows if args.all_validation else rows[:3])
    if not selected or len({row["id"] for row in selected}) != len(selected):
        raise ValueError("Validation selection is empty or contains repeated IDs")
    dataset = TrainingImages(selected, checkpoint["input_size"])
    results = []
    for index, row in enumerate(selected):
        tensor, _ = dataset[index]
        pixels = np.rint(tensor.permute(1, 2, 0).numpy() * 255).astype(np.uint8)
        image = Image.fromarray(pixels)
        with torch.inference_mode():
            expected = torch.softmax(model(tensor.unsqueeze(0)) / checkpoint["temperature"], dim=1).numpy()[0]
        started = time.monotonic()
        actual = np.asarray(coreml.predict({"image": image})["probabilities"]).reshape(-1)
        seconds = time.monotonic() - started
        results.append({"id": row["id"], "label": row["label"], "source": row["source"],
                        "input_rgb_sha256": hashlib.sha256(pixels.tobytes()).hexdigest(),
                        **probability_comparison(expected, actual), "seconds": seconds})
        if index % 50 == 0:
            print(f"Parity {index + 1}/{len(selected)}", flush=True)
    maximum = max(row["max_absolute_error"] for row in results)
    mismatches = [row["id"] for row in results if row["torch_top"] != row["coreml_top"] and not row["near_tie"]]
    latencies = [row["seconds"] for row in results[1:]]
    result = {"scope": "Identical resized RGB pixels; native camera/original-frame geometry still requires separate verification",
              "export_identity": identity,
              "package_files_sha256": {str(path.relative_to(args.model)): hashlib.sha256(path.read_bytes()).hexdigest()
                                       for path in sorted(args.model.rglob("*")) if path.is_file()},
              "verifier_sha256": hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),
              "selection": "all validation rows" if args.all_validation else "first three validation rows per class",
              "sample_count": len(results), "maximum_absolute_error": maximum,
              "non_tie_top1_mismatches": mismatches, "passed": maximum <= .01 and not mismatches,
              "model_load_seconds": load_seconds, "first_inference_seconds": results[0]["seconds"],
              "warm_median_seconds": float(np.median(latencies)), "warm_p95_seconds": float(np.quantile(latencies, .95)),
              "package_bytes": sum(path.stat().st_size for path in args.model.rglob("*") if path.is_file()), "rows": results}
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(result, indent=2) + "\n")
    print(json.dumps({key: value for key, value in result.items() if key != "rows"}, indent=2))
    if not result["passed"]:
        raise SystemExit("Core ML parity failed")


if __name__ == "__main__":
    main()
