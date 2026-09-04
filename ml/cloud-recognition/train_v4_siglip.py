"""Compare two predeclared SigLIP 2 heads; never open calibration/test images."""

import argparse
import copy
from importlib.metadata import version
import json
from pathlib import Path
import time

import numpy as np
from PIL import Image, ImageOps
import torch
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import f1_score
from sklearn.preprocessing import StandardScaler
from threadpoolctl import threadpool_limits
from torch.utils.data import DataLoader, Dataset, TensorDataset

from dinov2_model import FeatureMLP
from labels import GENERA
from siglip2_model import DATA_CONFIG, MODEL_ID, REVISION, TIMM_VERSION, WEIGHT_SHA256
from siglip2_model import file_digest, load_backbone, validate_feature_cache
from train_v4_linear import fold_scaler
from v4_checkpoint import atomic_save, random_state, restore_random_state
from v4_data import validate_manifest


class DevelopmentImages(Dataset):
    def __init__(self, rows, transform):
        if not rows or any(row["split"] not in {"train", "validation"} for row in rows):
            raise ValueError("Only development images may enter this trial")
        self.rows, self.transform = rows, transform

    def __len__(self):
        return len(self.rows)

    def __getitem__(self, index):
        row = self.rows[index]
        with Image.open(row["path"]) as source:
            return self.transform(ImageOps.exif_transpose(source).convert("RGB"))


@torch.inference_mode()
def extract(model, transform, rows, views, path, contract, device):
    if views not in (1, 2) or not rows or any(row["split"] not in {"train", "validation"} for row in rows):
        raise ValueError("Feature extraction requires development images and one or two views")
    provenance = {**contract, "ids": [row["id"] for row in rows], "views": views}
    features, completed = [], 0
    if path.exists():
        saved = torch.load(path, weights_only=True)
        completed = validate_feature_cache(saved, provenance, len(rows), views)
        features = [saved["features"]]
    if completed == len(rows):
        return features[0]
    loader = DataLoader(DevelopmentImages(rows[completed:], transform), batch_size=4)
    for batch, images in enumerate(loader):
        images = images.to(device)
        values = [model(images).cpu()]
        if views == 2:
            values.append(model(images.flip(3)).cpu())
        output = torch.stack(values, dim=1).reshape(-1, 768)
        if not torch.isfinite(output).all():
            raise ValueError("Non-finite model features; cache not advanced")
        features.append(output)
        completed += len(images)
        if (batch + 1) % 20 == 0 or completed == len(rows):
            merged = torch.cat(features)
            atomic_save({"contract": provenance, "completed": completed, "features": merged}, path)
            features = [merged]
            print(f"{path.name}: {completed}/{len(rows)}", flush=True)
    return torch.cat(features)


def score_predictions(labels, predictions):
    return {"accuracy": float(np.mean(np.asarray(labels) == np.asarray(predictions))),
            "macro_f1": float(f1_score(labels, predictions, labels=list(range(len(GENERA))),
                                      average="macro", zero_division=0))}


def linear_head(x, y, v, vy, output, contract):
    path = output / "linear.pt"
    if path.exists():
        saved = torch.load(path, weights_only=True)
        if saved["contract"] != contract:
            raise ValueError("Linear head provenance mismatch")
        return saved
    scaler = StandardScaler().fit(x.numpy())
    train, validation = scaler.transform(x.numpy()), scaler.transform(v.numpy())
    selected, best, history = None, -1., []
    with threadpool_limits(limits=2):
        for c in (.01, .1, 1., 10.):
            model = LogisticRegression(C=c, class_weight="balanced", max_iter=1500, random_state=7042)
            model.fit(train, y.numpy())
            row = {"C": c, **score_predictions(vy.numpy(), model.predict(validation))}
            history.append(row)
            print(json.dumps({"head": "linear", **row}), flush=True)
            if row["macro_f1"] > best:
                selected, best = model, row["macro_f1"]
    if selected.classes_.tolist() != list(range(len(GENERA))):
        raise ValueError("Head class order mismatch")
    weight, bias = fold_scaler(selected.coef_, selected.intercept_, scaler.mean_, scaler.scale_)
    head = torch.nn.Linear(768, len(GENERA))
    with torch.no_grad():
        head.weight.copy_(torch.from_numpy(weight).float())
        head.bias.copy_(torch.from_numpy(bias).float())
        if not np.array_equal(head(v).argmax(1).numpy(), selected.predict(validation)):
            raise ValueError("Float32 linear head changed validation predictions")
    report = next(row for row in history if row["C"] == selected.C)
    saved = {"contract": contract, "head": "linear", "state": head.state_dict(),
             "validation": report, "history": history}
    atomic_save(saved, path)
    return saved


def mlp_head(x, y, v, vy, output, contract):
    path, resume_path = output / "mlp.pt", output / "mlp-resume.pt"
    if path.exists():
        saved = torch.load(path, weights_only=True)
        if saved["contract"] != contract:
            raise ValueError("MLP provenance mismatch")
        return saved
    torch.manual_seed(7042)
    head = FeatureMLP(len(GENERA))
    head.mean.copy_(x.mean(0))
    head.scale.copy_(x.std(0).clamp(min=1e-6))
    weights = torch.bincount(y).max().float().div(torch.bincount(y)).sqrt()
    loss_fn = torch.nn.CrossEntropyLoss(weight=weights, label_smoothing=.05)
    optimizer = torch.optim.AdamW(head.parameters(), lr=.001, weight_decay=.01)
    scheduler = torch.optim.lr_scheduler.CosineAnnealingLR(optimizer, 200, eta_min=.00001)
    generator = torch.Generator().manual_seed(7042)
    loader = DataLoader(TensorDataset(x, y), batch_size=64, shuffle=True, generator=generator)
    first, best, best_epoch, state, history = 1, -1., 0, None, []
    if resume_path.exists():
        saved = torch.load(resume_path, weights_only=True)
        if saved["contract"] != contract:
            raise ValueError("MLP resume provenance mismatch")
        head.load_state_dict(saved["model"])
        optimizer.load_state_dict(saved["optimizer"])
        scheduler.load_state_dict(saved["scheduler"])
        restore_random_state(saved["random"], generator, torch.device("cpu"))
        first, history, state = saved["epoch"] + 1, saved["history"], saved["best_state"]
        best_epoch, best = saved["best_epoch"], saved["best"]
    for epoch in range(first, 201):
        if epoch > 30 and epoch - 1 - best_epoch >= 20:
            break
        head.train()
        for features, targets in loader:
            optimizer.zero_grad(set_to_none=True)
            loss = loss_fn(head(features), targets)
            loss.backward()
            optimizer.step()
        scheduler.step()
        head.eval()
        with torch.inference_mode():
            row = {"epoch": epoch, **score_predictions(vy.numpy(), head(v).argmax(1).numpy())}
        history.append(row)
        if row["macro_f1"] > best:
            best, best_epoch, state = row["macro_f1"], epoch, copy.deepcopy(head.state_dict())
        atomic_save({"contract": contract, "epoch": epoch, "model": head.state_dict(),
                     "optimizer": optimizer.state_dict(), "scheduler": scheduler.state_dict(),
                     "random": random_state(generator, torch.device("cpu")), "history": history,
                     "best": best, "best_epoch": best_epoch, "best_state": state}, resume_path)
        if epoch % 10 == 0:
            print(json.dumps({"head": "mlp", **row, "best_epoch": best_epoch}), flush=True)
    saved = {"contract": contract, "head": "mlp", "state": state,
             "validation": history[best_epoch - 1], "history": history}
    atomic_save(saved, path)
    return saved


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--manifest", type=Path, required=True)
    parser.add_argument("--weights", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--device", choices=("cpu", "mps"), default="cpu")
    args = parser.parse_args()
    if (args.output / "evaluation.json").exists():
        raise ValueError("Completed SigLIP trial exists; preserve it")
    manifest = json.loads(args.manifest.read_text())
    validate_manifest(manifest["rows"])
    rows = {split: [row for row in manifest["rows"] if row["split"] == split]
            for split in ("train", "validation")}
    # Store the complete experiment identity with every cache and resumable head.
    contract = {"study_version": 1, "manifest_sha256": file_digest(args.manifest),
                "model_id": MODEL_ID, "revision": REVISION, "weight_sha256": WEIGHT_SHA256,
                "timm_version": TIMM_VERSION, "license": "Apache-2.0", "data_config": DATA_CONFIG,
                "software": {name: version(name) for name in ("torch", "torchvision", "scikit-learn", "Pillow", "safetensors")},
                "classes": GENERA, "seed": 7042, "device": args.device,
                "train_count": len(rows["train"]), "validation_count": len(rows["validation"]),
                "selection": "validation macro-F1 only; linear C .01/.1/1/10 and fixed 128-unit MLP",
                "holdouts_evaluated": False, "release_approved": False}
    args.output.mkdir(parents=True, exist_ok=True)
    torch.set_num_threads(2)
    torch.manual_seed(7042)
    started = time.monotonic()
    model, transform = load_backbone(args.weights)
    device = torch.device(args.device)
    model.to(device)
    x = extract(model, transform, rows["train"], 2, args.output / "train-features.pt", contract, device)
    v = extract(model, transform, rows["validation"], 1, args.output / "validation-features.pt", contract, device)
    del model
    if device.type == "mps":
        torch.mps.empty_cache()
    y = torch.tensor(np.repeat([row["label"] for row in rows["train"]], 2))
    vy = torch.tensor([row["label"] for row in rows["validation"]])
    candidates = [linear_head(x, y, v, vy, args.output, contract), mlp_head(x, y, v, vy, args.output, contract)]
    selected = max(candidates, key=lambda candidate: candidate["validation"]["macro_f1"])
    selected_path = args.output / "selected-head.pt"
    atomic_save(selected, selected_path)
    result = {**contract, "selected_head": selected["head"], "selected_sha256": file_digest(selected_path),
              "heads": {candidate["head"]: {"validation": candidate["validation"], "history": candidate["history"]}
                        for candidate in candidates}, "seconds": round(time.monotonic() - started, 1)}
    (args.output / "evaluation.json").write_text(json.dumps(result, indent=2) + "\n")
    print(json.dumps(result, indent=2), flush=True)


if __name__ == "__main__":
    main()
