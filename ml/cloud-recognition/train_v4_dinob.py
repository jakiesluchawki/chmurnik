"""Bounded, validation-only DINOv2 Base trial; never fit on held-out photos."""

import argparse
import copy
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
from torch.utils.data import DataLoader, TensorDataset

from dinov2_model import DINOV2_REVISION, FeatureMLP
from labels import GENERA
from model import build_model
from train_v4_linear import cached_features, fold_scaler
from v4_checkpoint import atomic_save, cpu_tree, random_state, restore_random_state
from v4_data import validate_manifest


WEIGHT_URL = "https://dl.fbaipublicfiles.com/dinov2/dinov2_vitb14/dinov2_vitb14_pretrain.pth"
WEIGHT_SHA256 = "0b8b82f85de91b424aded121c7e1dcc2b7bc6d0adeea651bf73a13307fad8c73"
WEIGHT_BYTES = 346378731
MANIFEST_SHA256 = "d5b0ca33e0867bbb0d0fd25dbd08fc20cfeea316a89299e53f63a6bee5d0ea1c"
FEATURE_COUNT = 1536
INPUT_SIZE = 336
SEED = 7042
VALIDATION_BAR = .64303164872


def sha256(path):
    with path.open("rb") as stream:
        return hashlib.file_digest(stream, "sha256").hexdigest()


def verify_source(path):
    if path.stat().st_size != WEIGHT_BYTES or sha256(path) != WEIGHT_SHA256:
        raise ValueError("Official DINOv2 Base weight identity mismatch")


def metrics(labels, predicted):
    return {"accuracy": float(np.mean(np.asarray(labels) == np.asarray(predicted))),
            "macro_f1": float(f1_score(labels, predicted, labels=list(range(len(GENERA))),
                                       average="macro", zero_division=0))}


def linear_trials(x, y, v, vy, output):
    scaler = StandardScaler().fit(x)
    tx, tv = scaler.transform(x), scaler.transform(v)
    results = []
    with threadpool_limits(limits=2):
        for regularization in [.01, .1, 1., 10.]:
            path = output / f"linear-{regularization:g}.pt"
            if path.exists():
                results.append(torch.load(path, weights_only=True))
                continue
            classifier = LogisticRegression(C=regularization, class_weight="balanced", max_iter=1500, random_state=SEED)
            classifier.fit(tx, y)
            if classifier.classes_.tolist() != list(range(len(GENERA))):
                raise ValueError("Unexpected classifier label order")
            weights, bias = fold_scaler(classifier.coef_, classifier.intercept_, scaler.mean_, scaler.scale_)
            state = {"weight": torch.tensor(weights, dtype=torch.float32), "bias": torch.tensor(bias, dtype=torch.float32)}
            logits = torch.nn.functional.linear(torch.from_numpy(v), **state).numpy()
            error = float(np.max(np.abs(logits - classifier.decision_function(tv))))
            if error > .001 or not np.array_equal(logits.argmax(1), classifier.predict(tv)):
                raise ValueError("Folded float32 head failed sklearn parity")
            result = {"architecture": "dinov2_vitb14_linear", "C": regularization, "epoch": 0,
                      "validation": metrics(vy, logits.argmax(1)), "parity_max_error": error, "state": state}
            atomic_save(result, path)
            print(json.dumps({key: value for key, value in result.items() if key != "state"}), flush=True)
            results.append(result)
    return results


def mlp_trial(x, y, v, vy, output):
    destination, recovery = output / "mlp-head.pt", output / "mlp-recovery.pt"
    if destination.exists():
        return torch.load(destination, weights_only=True)
    torch.manual_seed(SEED)
    x, y, v = torch.from_numpy(x), torch.from_numpy(y), torch.from_numpy(v)
    head = FeatureMLP(len(GENERA), FEATURE_COUNT)
    head.mean.copy_(x.mean(0))
    head.scale.copy_(x.std(0).clamp(min=1e-6))
    counts = torch.bincount(y, minlength=len(GENERA))
    if (counts == 0).any():
        raise ValueError("Missing training class")
    loss_fn = torch.nn.CrossEntropyLoss(weight=counts.max().float().div(counts).sqrt(), label_smoothing=.05)
    optimizer = torch.optim.AdamW(head.parameters(), lr=.001, weight_decay=.01)
    scheduler = torch.optim.lr_scheduler.CosineAnnealingLR(optimizer, 200, eta_min=.00001)
    generator = torch.Generator().manual_seed(SEED)
    loader = DataLoader(TensorDataset(x, y), batch_size=64, shuffle=True, generator=generator)
    best, history, start_epoch = None, [], 1
    if recovery.exists():
        saved = torch.load(recovery, weights_only=True)
        head.load_state_dict(saved["state"])
        optimizer.load_state_dict(saved["optimizer"])
        scheduler.load_state_dict(saved["scheduler"])
        restore_random_state(saved["random"], generator, torch.device("cpu"))
        best, history, start_epoch = saved["best"], saved["history"], saved["epoch"] + 1
    for epoch in range(start_epoch, 201):
        if history and epoch > 30 and epoch - 1 - best["epoch"] >= 20:
            break
        head.train()
        for features, labels in loader:
            optimizer.zero_grad(set_to_none=True)
            loss_fn(head(features), labels).backward()
            optimizer.step()
        scheduler.step()
        head.eval()
        with torch.inference_mode():
            row = {"epoch": epoch, **metrics(vy, head(v).argmax(1).numpy())}
        history.append(row)
        if best is None or row["macro_f1"] > best["validation"]["macro_f1"]:
            best = {"architecture": "dinov2_vitb14_mlp", "epoch": epoch,
                    "validation": row, "state": copy.deepcopy(head.state_dict())}
        atomic_save({"epoch": epoch, "state": head.state_dict(), "optimizer": optimizer.state_dict(),
                     "scheduler": scheduler.state_dict(), "random": random_state(generator, torch.device("cpu")),
                     "best": best, "history": history}, recovery)
        if epoch % 10 == 0:
            print(json.dumps({**row, "best_epoch": best["epoch"]}), flush=True)
    best["history"] = history
    atomic_save(best, destination)
    (output / "mlp-history.json").write_text(json.dumps(history, indent=2) + "\n")
    return best


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--manifest", type=Path, required=True)
    parser.add_argument("--weights", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--device", choices=["cpu", "mps"], default="cpu")
    args = parser.parse_args()
    if (args.output / "cloud-genus-net.pt").exists():
        raise ValueError("Preserve the completed selected trial")
    verify_source(args.weights)
    if sha256(args.manifest) != MANIFEST_SHA256:
        raise ValueError("The trial requires its frozen V2 manifest")
    manifest = json.loads(args.manifest.read_text())
    validate_manifest(manifest["rows"])
    train = [row for row in manifest["rows"] if row["split"] == "train"]
    validation = [row for row in manifest["rows"] if row["split"] == "validation"]
    if (len(train), len(validation)) != (2325, 452):
        raise ValueError("Unexpected development split sizes")
    torch.set_num_threads(2)
    torch.manual_seed(SEED)
    root = Path(__file__).parent
    identity = {"architecture": "dinov2_vitb14", "weight_sha256": WEIGHT_SHA256,
                "feature_count": FEATURE_COUNT, "pooling": "final_normalized_cls_plus_mean_patch",
                "crop_fraction": .902, "preprocess": "center_crop",
                "implementation_sha256": {name: sha256(root / name) for name in
                    ("dinov2_model.py", "model.py", "train_v4.py", "train_v4_linear.py", "train_v4_dinob.py")}}
    recipe = {"identity": identity, "manifest_sha256": MANIFEST_SHA256, "backbone_revision": DINOV2_REVISION,
              "backbone_source": {"url": WEIGHT_URL, "bytes": WEIGHT_BYTES, "sha256": WEIGHT_SHA256,
                                  "license": "Apache-2.0", "s3_version": "UgXoSvH_JJMe1OVbpL.ucwhEuZ6APOrb"},
              "input_size": INPUT_SIZE, "seed": SEED, "classes": GENERA,
              "linear_C": [.01, .1, 1., 10.], "mlp": "128/GELU/dropout.2; standardize train; sqrt class balance; CE smoothing.05; AdamW.001/wd.01; cosine200/eta.00001; batch64; minimum30/patience20",
              "selection": "maximum raw validation macro-F1", "validation_bar": VALIDATION_BAR,
              "confirmatory_set_exposed": True, "release_approved": False}
    args.output.mkdir(parents=True, exist_ok=True)
    recipe_path = args.output / "recipe.json"
    if recipe_path.exists() and json.loads(recipe_path.read_text()) != recipe:
        raise ValueError("Resume recipe or source code changed; preserve the original trial")
    recipe_path.write_text(json.dumps(recipe, indent=2) + "\n")
    started = time.monotonic()
    device = torch.device(args.device)
    model = build_model(len(GENERA), architecture="dinov2_vitb14_linear")
    model.backbone.load_state_dict(torch.load(args.weights, weights_only=True))
    model.eval().requires_grad_(False).to(device)
    x = cached_features(model, train, INPUT_SIZE, device, args.output / "train-features.pt",
                        MANIFEST_SHA256, 2, identity=identity, feature_count=FEATURE_COUNT)
    v = cached_features(model, validation, INPUT_SIZE, device, args.output / "validation-features.pt",
                        MANIFEST_SHA256, 1, identity=identity, feature_count=FEATURE_COUNT)
    model.to("cpu")
    if device.type == "mps":
        torch.mps.empty_cache()
    y = np.repeat([row["label"] for row in train], 2)
    vy = np.asarray([row["label"] for row in validation])
    results = linear_trials(x, y, v, vy, args.output)
    results.append(mlp_trial(x, y, v, vy, args.output))
    selected = max(results, key=lambda row: row["validation"]["macro_f1"])
    if selected["architecture"].endswith("_mlp"):
        model.classifier = FeatureMLP(len(GENERA), FEATURE_COUNT)
    model.classifier.load_state_dict(selected["state"])
    model.eval()
    with torch.inference_mode():
        restored_metrics = metrics(vy, model.classifier(torch.from_numpy(v)).argmax(1).numpy())
    if any(abs(restored_metrics[key] - selected["validation"][key]) > 1e-8 for key in restored_metrics):
        raise ValueError("Selected head failed restoration parity")
    contract = {**recipe, "architecture": selected["architecture"], "pipeline_version": 4,
                "preprocess": "center_crop", "crop_fraction": .902, "backbone_license": "Apache-2.0",
                "training_count": len(train), "validation_count": len(validation),
                "epoch": selected["epoch"], "validation": selected["validation"],
                "regularization_C": selected.get("C"), "seconds": round(time.monotonic() - started, 1),
                "validation_bar_passed": selected["validation"]["macro_f1"] > VALIDATION_BAR,
                "trials": [{key: value for key, value in row.items() if key not in {"state", "history"}} for row in results]}
    atomic_save({**contract, "state_dict": cpu_tree(model.state_dict())}, args.output / "cloud-genus-net.pt")
    (args.output / "contract.json").write_text(json.dumps(contract, indent=2) + "\n")
    print(json.dumps({"completed": True, **contract}), flush=True)


if __name__ == "__main__":
    main()
