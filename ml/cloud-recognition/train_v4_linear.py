"""Compare a frozen DINOv2 representation without looking at any held-out test."""

import argparse
import hashlib
import json
from pathlib import Path
import time

import numpy as np
import torch
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import f1_score
from sklearn.preprocessing import StandardScaler
from threadpoolctl import threadpool_limits
from torch.utils.data import DataLoader

from dinov2_model import DINOV2_REVISION
from labels import GENERA
from model import build_model
from train_v4 import TrainingImages
from v4_checkpoint import atomic_save, cpu_tree
from v4_data import validate_manifest


def fold_scaler(coefficients, intercept, mean, scale):
    weights = coefficients / scale[None, :]
    return weights, intercept - weights @ mean


@torch.inference_mode()
def cached_features(model, rows, size, device, path, digest, views):
    features, completed = [], 0
    if path.exists():
        saved = torch.load(path, weights_only=True)
        if saved["manifest_sha256"] != digest or saved["size"] != size or saved["views"] != views or saved["revision"] != DINOV2_REVISION:
            raise ValueError("Feature cache contract mismatch")
        completed = saved["completed"]
        if saved["ids"] != [row["id"] for row in rows[:completed]]:
            raise ValueError("Feature cache image order mismatch")
        features = [saved["features"]]
    loader = DataLoader(TrainingImages(rows[completed:], size), batch_size=4)
    for batch, (images, _) in enumerate(loader):
        images = images.to(device)
        values = [model.features(images).cpu()]
        if views == 2:
            values.append(model.features(images.flip(3)).cpu())
        features.append(torch.stack(values, dim=1).reshape(-1, 768))
        completed += len(images)
        if (batch + 1) % 25 == 0 or completed == len(rows):
            merged = torch.cat(features)
            atomic_save({"manifest_sha256": digest, "revision": DINOV2_REVISION,
                         "size": size, "views": views, "completed": completed,
                         "ids": [row["id"] for row in rows[:completed]], "features": merged}, path)
            features = [merged]
            print(f"features {path.name}: {completed}/{len(rows)}", flush=True)
    return torch.cat(features).numpy()


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--manifest", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--device", choices=["cpu", "mps"], default="cpu")
    parser.add_argument("--size", type=int, default=224)
    args = parser.parse_args()
    if args.size % 14:
        raise ValueError("DINOv2 input must be a multiple of 14")
    if (args.output / "cloud-genus-net.pt").exists():
        raise ValueError("Completed trial exists; preserve it")
    args.output.mkdir(parents=True, exist_ok=True)
    torch.set_num_threads(2)
    torch.manual_seed(7042)
    manifest = json.loads(args.manifest.read_text())
    validate_manifest(manifest["rows"])
    digest = hashlib.sha256(args.manifest.read_bytes()).hexdigest()
    train = [row for row in manifest["rows"] if row["split"] == "train"]
    validation = [row for row in manifest["rows"] if row["split"] == "validation"]
    device = torch.device(args.device)
    model = build_model(len(GENERA), architecture="dinov2_vits14_linear", pretrained=True).eval().to(device)
    started = time.monotonic()
    x = cached_features(model, train, args.size, device, args.output / "train-features.pt", digest, 2)
    v = cached_features(model, validation, args.size, device, args.output / "validation-features.pt", digest, 1)
    y = np.repeat([row["label"] for row in train], 2)
    vy = np.asarray([row["label"] for row in validation])
    scaler = StandardScaler().fit(x)
    x, v = scaler.transform(x), scaler.transform(v)
    best, selected, history = -1, None, []
    with threadpool_limits(limits=2):
        for regularization in [.01, .1, 1., 10.]:
            classifier = LogisticRegression(C=regularization, class_weight="balanced", max_iter=1500, random_state=7042)
            classifier.fit(x, y)
            predicted = classifier.predict(v)
            score = float(f1_score(vy, predicted, labels=list(range(len(GENERA))), average="macro", zero_division=0))
            row = {"C": regularization, "validation_accuracy": float(np.mean(predicted == vy)), "validation_macro_f1": score}
            print(json.dumps(row), flush=True)
            history.append(row)
            if score > best:
                best, selected = score, classifier
    if selected.classes_.tolist() != list(range(len(GENERA))):
        raise ValueError("Classifier output order mismatch")
    weights, bias = fold_scaler(selected.coef_, selected.intercept_, scaler.mean_, scaler.scale_)
    with torch.no_grad():
        model.classifier.weight.copy_(torch.from_numpy(weights).to(device=device, dtype=torch.float32))
        model.classifier.bias.copy_(torch.from_numpy(bias).to(device=device, dtype=torch.float32))
    selected_row = next(row for row in history if row["C"] == selected.C)
    contract = {"architecture": "dinov2_vits14_linear", "pipeline_version": 4,
                "input_size": args.size, "preprocess": "center_crop", "crop_fraction": .902,
                "classes": GENERA, "seed": 7042, "manifest_sha256": digest,
                "backbone_revision": DINOV2_REVISION, "backbone_license": "Apache-2.0",
                "selection": "frozen backbone; train-only scaler/logistic fit; C selected on validation macro-F1",
                "epoch": 0, "regularization_C": selected.C, "history": history,
                "validation": {"accuracy": selected_row["validation_accuracy"], "macro_f1": best},
                "training_count": len(train), "validation_count": len(validation), "seconds": round(time.monotonic() - started, 1)}
    (args.output / "contract.json").write_text(json.dumps(contract, indent=2) + "\n")
    atomic_save({**contract, "state_dict": cpu_tree(model.state_dict())}, args.output / "cloud-genus-net.pt")
    print(json.dumps({"completed": True, **contract}), flush=True)


if __name__ == "__main__":
    main()
