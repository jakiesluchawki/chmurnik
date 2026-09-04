"""Bounded, validation-only input-geometry study; no fitting or release approval."""

import argparse
import hashlib
import json
from pathlib import Path
import time

import numpy as np
from PIL import Image, ImageOps
import torch
from torchvision import transforms

from labels import GENERA
from model import build_model
from train_ccsn import softmax
from v4_checkpoint import atomic_save
from v4_data import validate_manifest
from v4_metrics import metrics, paired_accuracy


STUDY_VERSION = 1
MODES = ("center", "full_frame", "three_windows")


def validation_rows(manifest):
    validate_manifest(manifest["rows"])
    rows = [row for row in manifest["rows"] if row["split"] == "validation"]
    if not rows or any(row["label"] not in range(len(GENERA)) for row in rows):
        raise ValueError("The study requires labeled validation photographs")
    return rows


def long_axis_bounds(width, height):
    if width < 1 or height < 1:
        raise ValueError("Image dimensions must be positive")
    side = max(1, int(min(width, height) * .902))
    bounds = []
    for fraction in (0., .5, 1.):
        left = round((width - side) * (fraction if width >= height else .5))
        top = round((height - side) * (fraction if height > width else .5))
        bounds.append((left, top, left + side, top + side))
    return bounds


def image_views(image, size):
    tensor = transforms.ToTensor()
    center = transforms.Compose([
        transforms.Resize(round(size / .902)), transforms.CenterCrop(size), tensor,
    ])
    bounds = long_axis_bounds(*image.size)
    views = [center(image), tensor(image.resize((size, size), Image.Resampling.BILINEAR))]
    views.extend(tensor(image.crop(box).resize((size, size), Image.Resampling.BILINEAR)) for box in bounds)
    return torch.stack(views), bounds


def merge_views(logits):
    values = np.asarray(logits)
    if values.ndim != 3 or values.shape[1:] != (5, len(GENERA)) or not np.isfinite(values).all():
        raise ValueError("Expected finite logits for five views and every class")
    probabilities = softmax(values.reshape(-1, len(GENERA)), 1).reshape(values.shape)
    return {"center": probabilities[:, 0], "full_frame": probabilities[:, 1],
            "three_windows": probabilities[:, 2:].mean(axis=1)}


def report_rows(rows, probabilities):
    return [{**{key: row[key] for key in ("id", "label", "source", "split", "group", "split_group") if key in row},
             "probabilities": probability.tolist()}
            for row, probability in zip(rows, probabilities, strict=True)]


@torch.inference_mode()
def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--manifest", type=Path, required=True)
    parser.add_argument("--checkpoint", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--device", choices=("cpu", "mps"), default="cpu")
    args = parser.parse_args()
    if (args.output / "evaluation.json").exists():
        raise ValueError("Completed study exists; preserve it")
    manifest = json.loads(args.manifest.read_text())
    rows = validation_rows(manifest)
    digest = hashlib.sha256(args.manifest.read_bytes()).hexdigest()
    checkpoint = torch.load(args.checkpoint, weights_only=True, map_location="cpu")
    if checkpoint["manifest_sha256"] != digest or checkpoint["classes"] != GENERA:
        raise ValueError("Checkpoint does not match the frozen manifest/classes")
    if checkpoint.get("temperature", 1) != 1 or "abstention_policy" in checkpoint:
        raise ValueError("Use the uncalibrated, validation-selected checkpoint")
    contract = {"study_version": STUDY_VERSION, "manifest_sha256": digest,
                "checkpoint_sha256": hashlib.sha256(args.checkpoint.read_bytes()).hexdigest(),
                "architecture": checkpoint["architecture"], "input_size": checkpoint["input_size"],
                "modes": MODES, "ids": [row["id"] for row in rows], "classes": GENERA,
                "population": "validation only; no calibration or held-out images loaded",
                "selection": "geometry diagnostic only; no release approval or threshold fitting"}
    args.output.mkdir(parents=True, exist_ok=True)
    cache_path = args.output / "views.pt"
    logits, sizes, bounds, durations = [], [], [], []
    if cache_path.exists():
        cached = torch.load(cache_path, weights_only=True)
        if cached["contract"] != contract:
            raise ValueError("Input-study cache provenance mismatch")
        if not 0 < len(cached["sizes"]) <= len(rows):
            raise ValueError("Input-study cache image count mismatch")
        merge_views(cached["logits"].numpy())
        if len(cached["logits"]) != len(cached["sizes"]) or len(cached["bounds"]) != len(cached["sizes"]):
            raise ValueError("Incomplete input-study cache")
        logits = list(cached["logits"])
        sizes, bounds, durations = cached["sizes"], cached["bounds"], cached["seconds"]
    torch.set_num_threads(2)
    device = torch.device(args.device)
    model = build_model(len(GENERA), architecture=checkpoint["architecture"])
    model.load_state_dict(checkpoint["state_dict"])
    del checkpoint
    model = model.eval().to(device)
    for index, row in enumerate(rows[len(logits):], start=len(logits)):
        if row["split"] != "validation":
            raise ValueError("Refusing to open a non-validation image")
        with Image.open(row["path"]) as original:
            image = ImageOps.exif_transpose(original).convert("RGB")
            views, boxes = image_views(image, contract["input_size"])
            sizes.append(list(image.size))
        started = time.monotonic()
        values = model(views.to(device)).cpu()
        durations.append(time.monotonic() - started)
        logits.append(values)
        bounds.append(boxes)
        if (index + 1) % 20 == 0 or index + 1 == len(rows):
            atomic_save({"contract": contract, "logits": torch.stack(logits), "sizes": sizes,
                         "bounds": bounds, "seconds": durations}, cache_path)
            print(f"validation input study {index + 1}/{len(rows)}", flush=True)
    predictions = {mode: report_rows(rows, values) for mode, values in merge_views(torch.stack(logits).numpy()).items()}
    reject_all = {"minimum_confidence": 1.01, "margin_threshold": 1.}
    result = {**contract, "calibration_evaluated": False, "holdouts_evaluated": False,
              "reports": {mode: metrics(values, reject_all) for mode, values in predictions.items()},
              "paired_vs_center": {mode: paired_accuracy(values, predictions["center"])
                                   for mode, values in predictions.items() if mode != "center"},
              "by_source": {source: {mode: metrics([row for row in values if row["source"] == source], reject_all)
                                     for mode, values in predictions.items()}
                            for source in sorted({row["source"] for row in rows})},
              "five_view_seconds": {"median": float(np.median(durations)), "p95": float(np.quantile(durations, .95))},
              "rows": [{"id": row["id"], "size": size, "window_bounds": boxes,
                        "logits": value.tolist()} for row, size, boxes, value in zip(rows, sizes, bounds, logits, strict=True)]}
    (args.output / "evaluation.json").write_text(json.dumps(result, indent=2) + "\n")
    print(json.dumps({mode: {key: value for key, value in report.items()
                            if key in {"sample_count", "top1_accuracy", "macro_f1", "cloud_only"}}
                      for mode, report in result["reports"].items()}, indent=2))
    print(json.dumps(result["paired_vs_center"], indent=2))


if __name__ == "__main__":
    main()
