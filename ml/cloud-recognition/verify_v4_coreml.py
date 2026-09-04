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


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--artifacts", type=Path, required=True)
    parser.add_argument("--model", type=Path, required=True)
    parser.add_argument("--manifest", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()
    if args.output.exists():
        raise ValueError("Preserve previous parity results")
    torch.set_num_threads(2)
    checkpoint = torch.load(args.artifacts / "cloud-genus-net.pt", map_location="cpu", weights_only=True)
    manifest = json.loads(args.manifest.read_text())
    if checkpoint["manifest_sha256"] != hashlib.sha256(args.manifest.read_bytes()).hexdigest():
        raise ValueError("Manifest mismatch")
    model = build_model(len(GENERA), architecture=checkpoint["architecture"])
    model.load_state_dict(checkpoint["state_dict"])
    model.eval()
    loaded = time.monotonic()
    coreml = ct.models.MLModel(str(args.model), compute_units=ct.ComputeUnit.ALL)
    load_seconds = time.monotonic() - loaded
    if json.loads(coreml.user_defined_metadata["classes"]) != GENERA:
        raise ValueError("Core ML class order mismatch")
    selected = []
    for label in range(len(GENERA)):
        selected.extend([row for row in manifest["rows"] if row["split"] == "validation" and row["label"] == label][:3])
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
        difference = float(np.max(np.abs(expected - actual)))
        margin = float(np.sort(expected)[-1] - np.sort(expected)[-2])
        results.append({"id": row["id"], "max_absolute_error": difference,
                        "torch_top": GENERA[int(expected.argmax())], "coreml_top": GENERA[int(actual.argmax())],
                        "seconds": seconds, "near_tie": margin <= .01})
    maximum = max(row["max_absolute_error"] for row in results)
    mismatches = [row["id"] for row in results if row["torch_top"] != row["coreml_top"] and not row["near_tie"]]
    latencies = [row["seconds"] for row in results[1:]]
    result = {"scope": "Identical resized RGB pixels; native camera/original-frame geometry still requires separate verification",
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
