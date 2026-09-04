"""Evaluate the bundled models, not an older or differently trained checkpoint."""

from __future__ import annotations

import argparse
import hashlib
import json
import math
from pathlib import Path

import coremltools as ct
import numpy as np
from PIL import Image, ImageOps

from benchmark_ensemble import probability_report
from labels import GENERA


def native_crop_geometry(image: Image.Image) -> Image.Image:
    side = math.floor(min(image.size) * 0.902)
    left, top = (image.width - side) / 2, (image.height - side) / 2
    return image.transform((side, side), Image.Transform.AFFINE, (1, 0, left, 0, 1, top), Image.Resampling.BICUBIC)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--manifest", type=Path, required=True)
    parser.add_argument("--models", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--private-image", type=Path)
    args = parser.parse_args()
    if args.output.exists():
        raise ValueError("Baseline output already exists; preserve the previous measurement")
    manifest = json.loads(args.manifest.read_text())
    policy = {"minimum_confidence": 0.2, "margin_threshold": 0.51}
    models = []
    provenance = []
    for name in ["CloudGenusClassifier", "CloudGenusClassifierV3"]:
        path = args.models / f"{name}.mlpackage"
        model = ct.models.MLModel(str(path), compute_units=ct.ComputeUnit.CPU_AND_GPU)
        spec = model.get_spec()
        shape = spec.description.input[0].type.imageType
        models.append((model, shape.width, shape.height))
        hashes = {str(file.relative_to(path)): hashlib.sha256(file.read_bytes()).hexdigest()
                  for file in sorted(path.rglob("*")) if file.is_file()}
        provenance.append({"name": name, "metadata": dict(model.user_defined_metadata), "files": hashes})
    selected = [row for row in manifest["rows"] if row["split"] in {"calibration", "test", "diagnostic", "stress", "outlier"}]
    if args.private_image:
        selected.append({"id": "private-feedback-dark-sky", "path": str(args.private_image),
                         "label": -1, "source": "private-feedback", "split": "unlabeled"})
    results = []
    for index, row in enumerate(selected):
        with Image.open(row["path"]) as original:
            cropped = native_crop_geometry(ImageOps.exif_transpose(original).convert("RGB"))
            component = []
            for model, width, height in models:
                value = model.predict({"image": cropped.resize((width, height), Image.Resampling.BILINEAR)})
                component.append(np.asarray(value["probabilities"]).reshape(-1))
        probabilities = 0.4 * component[0] + 0.6 * component[1]
        order = probabilities.argsort()[::-1]
        results.append({"id": row["id"], "group": row.get("group", row["id"]), "source": row["source"], "split": row["split"], "label": row["label"],
                        "probabilities": probabilities.tolist(), "components": [value.tolist() for value in component],
                        "top1": GENERA[int(order[0])], "confidence": float(probabilities[order[0]]),
                        "accepted": bool(probabilities[order[0]] >= 0.2 and probabilities[order[0]] - probabilities[order[1]] >= 0.51)})
        if index % 50 == 0:
            print(f"baseline {index + 1}/{len(selected)}", flush=True)
    reports = {}
    for split in ["calibration", "test", "diagnostic", "stress"]:
        rows = [row for row in results if row["split"] == split and row["label"] >= 0]
        if rows:
            reports[split] = probability_report(np.asarray([row["probabilities"] for row in rows]),
                                               np.asarray([row["label"] for row in rows]), policy, True)
    outliers = [row for row in results if row["label"] == -1 and row["source"] != "private-feedback"]
    reports["outlier"] = {"sample_count": len(outliers), "abstention_rate": sum(not row["accepted"] for row in outliers) / max(1, len(outliers))}
    result = {"model_version": "3.0-ensemble", "manifest_sha256": hashlib.sha256(args.manifest.read_bytes()).hexdigest(),
              "preprocessing": "PIL reproduction of native EXIF-oriented 90.2% center-square geometry, then bilinear scaleFill; native parity still requires runtime verification",
              "policy": policy, "models": provenance, "reports": reports, "rows": results}
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(result, indent=2) + "\n")
    print(json.dumps({key: {field: value for field, value in report.items() if field in {"sample_count", "top1_accuracy", "top3_accuracy", "macro_f1", "selective_precision", "selective_coverage", "abstention_rate"}} for key, report in reports.items()}, indent=2))
    if args.private_image:
        print(json.dumps(results[-1], indent=2))


if __name__ == "__main__":
    main()
