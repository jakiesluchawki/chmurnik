"""Evaluate the bundled models, not an older or differently trained checkpoint."""

from __future__ import annotations

import argparse
import hashlib
import json
import math
from pathlib import Path
import subprocess
import tempfile

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
    parser.add_argument("--include-confirmatory", action="store_true")
    parser.add_argument("--reuse-parent", type=Path)
    parser.add_argument("--native-executable", type=Path)
    args = parser.parse_args()
    if args.output.exists():
        raise ValueError("Baseline output already exists; preserve the previous measurement")
    manifest = json.loads(args.manifest.read_text())
    policy = {"minimum_confidence": 0.2, "margin_threshold": 0.51}
    models = []
    provenance = []
    for name in ["CloudGenusClassifier", "CloudGenusClassifierV3"]:
        path = args.models / f"{name}.mlpackage"
        model = ct.models.MLModel(str(path), compute_units=ct.ComputeUnit.CPU_AND_GPU, skip_model_load=bool(args.native_executable))
        spec = model.get_spec()
        shape = spec.description.input[0].type.imageType
        models.append((model, shape.width, shape.height))
        hashes = {str(file.relative_to(path)): hashlib.sha256(file.read_bytes()).hexdigest()
                  for file in sorted(path.rglob("*")) if file.is_file()}
        provenance.append({"name": name, "metadata": dict(model.user_defined_metadata), "files": hashes})
    roles = {"calibration", "test", "diagnostic", "stress", "outlier"}
    if args.include_confirmatory:
        roles.add("confirmatory")
    selected = [row for row in manifest["rows"] if row["split"] in roles]
    cached = {}
    if args.reuse_parent:
        parent = json.loads(args.reuse_parent.read_text())
        if parent["manifest_sha256"] != manifest.get("parent_sha256") or parent["models"] != provenance or parent["policy"] != policy:
            raise ValueError("Parent baseline provenance mismatch")
        if bool(args.native_executable) != parent["preprocessing"].startswith("Native UIKit/Vision"):
            raise ValueError("Parent baseline used a different image renderer")
        cached = {row["id"]: row for row in parent["rows"]}
    if args.private_image:
        selected.append({"id": "private-feedback-dark-sky", "path": str(args.private_image),
                         "label": -1, "source": "private-feedback", "split": "unlabeled"})
    native = {}
    if args.native_executable:
        pending = [row for row in selected if row["id"] not in cached]
        with tempfile.TemporaryDirectory(prefix="chmurnik-baseline-") as temporary:
            inputs, outputs = Path(temporary) / "inputs.json", Path(temporary) / "outputs.json"
            inputs.write_text(json.dumps([{key: row[key] for key in ("id", "path")} for row in pending]))
            subprocess.run([str(args.native_executable.resolve()), str(inputs), str(args.models.resolve()), str(outputs)], check=True)
            native = {row["id"]: row for row in json.loads(outputs.read_text())}
            if set(native) != {row["id"] for row in pending}:
                raise ValueError("Native baseline did not return every requested image")
    results = []
    for index, row in enumerate(selected):
        if row["id"] in cached:
            previous = cached[row["id"]]
            if any(row[key] != previous[key] for key in ("label", "split", "source")):
                raise ValueError("Parent baseline image changed role or label")
            results.append(previous)
            continue
        if args.native_executable:
            component = [np.asarray(values) for values in native[row["id"]]["components"]]
        else:
            with Image.open(row["path"]) as original:
                cropped = native_crop_geometry(ImageOps.exif_transpose(original).convert("RGB"))
                component = []
                for model, width, height in models:
                    value = model.predict({"image": cropped.resize((width, height), Image.Resampling.BILINEAR)})
                    component.append(np.asarray(value["probabilities"]).reshape(-1))
        probabilities = 0.4 * component[0] + 0.6 * component[1]
        order = probabilities.argsort()[::-1]
        results.append({"id": row["id"], "group": row.get("group", row["id"]), "source": row["source"], "split": row["split"], "label": row["label"],
                        **({"split_group": row["split_group"]} if "split_group" in row else {}),
                        "probabilities": probabilities.tolist(), "components": [value.tolist() for value in component],
                        "top1": GENERA[int(order[0])], "confidence": float(probabilities[order[0]]),
                        "accepted": bool(probabilities[order[0]] >= 0.2 and probabilities[order[0]] - probabilities[order[1]] >= 0.51)})
        if index % 50 == 0:
            print(f"baseline {index + 1}/{len(selected)}", flush=True)
    reports = {}
    for split in ["calibration", "test", "diagnostic", "stress", "confirmatory"]:
        rows = [row for row in results if row["split"] == split and row["label"] >= 0]
        if rows:
            reports[split] = probability_report(np.asarray([row["probabilities"] for row in rows]),
                                               np.asarray([row["label"] for row in rows]), policy, True)
    outliers = [row for row in results if row["label"] == -1 and row["source"] != "private-feedback"]
    reports["outlier"] = {"sample_count": len(outliers), "abstention_rate": sum(not row["accepted"] for row in outliers) / max(1, len(outliers))}
    result = {"model_version": "3.0-ensemble", "manifest_sha256": hashlib.sha256(args.manifest.read_bytes()).hexdigest(),
              "confirmatory_evaluated": args.include_confirmatory,
              "preprocessing": "Native UIKit/Vision Mac Catalyst execution of the shipped UIImage renderer, 90.2% center square, Vision scaleFill, computeUnits.all" if args.native_executable else "PIL reproduction of native EXIF-oriented 90.2% center-square geometry, then bilinear scaleFill; native parity still requires runtime verification",
              "policy": policy, "models": provenance, "reports": reports, "rows": results}
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(result, indent=2) + "\n")
    print(json.dumps({key: {field: value for field, value in report.items() if field in {"sample_count", "top1_accuracy", "top3_accuracy", "macro_f1", "selective_precision", "selective_coverage", "abstention_rate"}} for key, report in reports.items()}, indent=2))
    if args.private_image:
        print(json.dumps(results[-1], indent=2))


if __name__ == "__main__":
    main()
