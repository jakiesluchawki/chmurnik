"""Fit one regularized nonlinear head on cached training-only representations."""

import argparse
import copy
import hashlib
import json
from pathlib import Path

import numpy as np
import torch
from sklearn.metrics import f1_score
from torch.utils.data import DataLoader, TensorDataset

from dinov2_model import DINOV2_REVISION, FeatureMLP
from labels import GENERA
from model import build_model
from v4_checkpoint import atomic_save, cpu_tree


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--manifest", type=Path, required=True)
    parser.add_argument("--features", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()
    if args.output.exists():
        raise ValueError("Preserve prior head trials")
    args.output.mkdir(parents=True)
    torch.set_num_threads(2)
    torch.manual_seed(7042)
    manifest = json.loads(args.manifest.read_text())
    digest = hashlib.sha256(args.manifest.read_bytes()).hexdigest()
    datasets = {}
    for split, name, views in [("train", "train-features.pt", 2), ("validation", "validation-features.pt", 1)]:
        rows = [row for row in manifest["rows"] if row["split"] == split]
        cached = torch.load(args.features / name, weights_only=True)
        if cached["ids"] != [row["id"] for row in rows] or cached["manifest_sha256"] != digest or cached["views"] != views or cached["revision"] != DINOV2_REVISION:
            raise ValueError("Feature cache does not match complete frozen split")
        labels = torch.tensor(np.repeat([row["label"] for row in rows], views), dtype=torch.long)
        datasets[split] = (cached["features"], labels)
    x, y = datasets["train"]
    v, vy = datasets["validation"]
    head = FeatureMLP(len(GENERA))
    head.mean.copy_(x.mean(0))
    head.scale.copy_(x.std(0).clamp(min=1e-6))
    weights = torch.bincount(y).max().float().div(torch.bincount(y)).sqrt()
    loss_fn = torch.nn.CrossEntropyLoss(weight=weights, label_smoothing=.05)
    optimizer = torch.optim.AdamW(head.parameters(), lr=.001, weight_decay=.01)
    scheduler = torch.optim.lr_scheduler.CosineAnnealingLR(optimizer, 200, eta_min=.00001)
    loader = DataLoader(TensorDataset(x, y), batch_size=64, shuffle=True, generator=torch.Generator().manual_seed(7042))
    best, best_epoch, state, history = -1, 0, None, []
    for epoch in range(1, 201):
        head.train()
        for features, labels in loader:
            optimizer.zero_grad(set_to_none=True)
            loss = loss_fn(head(features), labels)
            loss.backward()
            optimizer.step()
        scheduler.step()
        head.eval()
        with torch.inference_mode():
            predicted = head(v).argmax(1)
        score = float(f1_score(vy, predicted, labels=list(range(len(GENERA))), average="macro", zero_division=0))
        row = {"epoch": epoch, "accuracy": float((predicted == vy).float().mean()), "macro_f1": score}
        history.append(row)
        if score > best:
            best, best_epoch, state = score, epoch, copy.deepcopy(head.state_dict())
            atomic_save({"state": state, "epoch": best_epoch, "validation": row}, args.output / "head.pt")
        if epoch % 10 == 0:
            print(json.dumps({**row, "best_epoch": best_epoch}), flush=True)
            (args.output / "history.json").write_text(json.dumps(history, indent=2) + "\n")
        if epoch >= 30 and epoch - best_epoch >= 20:
            break
    source = torch.load(args.features / "cloud-genus-net.pt", weights_only=True)
    if source["manifest_sha256"] != digest:
        raise ValueError("Backbone provenance mismatch")
    model = build_model(len(GENERA), architecture="dinov2_vits14_mlp")
    missing, unexpected = model.load_state_dict({key: value for key, value in source["state_dict"].items() if not key.startswith("classifier.")}, strict=False)
    if unexpected or any(not key.startswith("classifier.") for key in missing):
        raise ValueError("Unexpected backbone state mismatch")
    model.classifier.load_state_dict(state)
    contract = {key: source[key] for key in ("pipeline_version", "input_size", "preprocess", "crop_fraction", "classes", "seed", "manifest_sha256", "backbone_revision", "backbone_license", "training_count", "validation_count")}
    contract.update({"architecture": "dinov2_vits14_mlp", "epoch": best_epoch,
                     "selection": "fixed 128-unit MLP, training-only normalization, maximum validation macro-F1 with patience 20",
                     "validation": history[best_epoch - 1]})
    atomic_save({**contract, "state_dict": cpu_tree(model.state_dict())}, args.output / "cloud-genus-net.pt")
    (args.output / "contract.json").write_text(json.dumps(contract, indent=2) + "\n")
    (args.output / "history.json").write_text(json.dumps(history, indent=2) + "\n")
    print(json.dumps({"completed": True, **contract}), flush=True)


if __name__ == "__main__":
    main()
