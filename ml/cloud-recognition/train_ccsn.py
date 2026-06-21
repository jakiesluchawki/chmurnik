"""Train and calibrate CHMURNIK's single-photo cloud recognizer."""

from __future__ import annotations

import argparse
import json
import math
import random
from dataclasses import dataclass
from itertools import cycle
from pathlib import Path

import numpy as np
import torch
from PIL import Image
from sklearn.metrics import classification_report, confusion_matrix, f1_score
from torch import nn
from torch.utils.data import ConcatDataset, DataLoader, Dataset
from torchvision import transforms

from labels import CODE_TO_GENUS, GENERA
from model import build_model


ROOT = Path(__file__).resolve().parents[2]
INPUT_SIZE = 224
MEAN = torch.tensor([0.485, 0.456, 0.406]).view(3, 1, 1)
STD = torch.tensor([0.229, 0.224, 0.225]).view(3, 1, 1)


def seed_all(seed: int) -> None:
    random.seed(seed)
    np.random.seed(seed)
    torch.manual_seed(seed)


def split_indices(count: int, seed: int) -> dict[str, list[int]]:
    values = list(range(count))
    random.Random(seed).shuffle(values)
    n = max(1, round(count * 0.15))
    return {"val": values[:n], "test": values[n : 2 * n], "train": values[2 * n :]}


def transform(training: bool):
    if training:
        return transforms.Compose(
            [
                transforms.Resize(248),
                transforms.RandomCrop(INPUT_SIZE),
                transforms.RandomHorizontalFlip(),
                transforms.RandomRotation(4),
                transforms.ColorJitter(0.12, 0.12, 0.08, 0.015),
                transforms.ToTensor(),
            ]
        )
    return transforms.Compose(
        [transforms.Resize(248), transforms.CenterCrop(INPUT_SIZE), transforms.ToTensor()]
    )


class PhotoDataset(Dataset):
    def __init__(self, items: list[tuple[Path, int]], training: bool) -> None:
        self.items = items
        self.transform = transform(training)

    def __len__(self) -> int:
        return len(self.items)

    def __getitem__(self, index: int):
        path, label = self.items[index]
        with Image.open(path) as image:
            value = self.transform(image.convert("RGB"))
        return value, label, str(path)


class ClearDataset(Dataset):
    def __init__(self, payload: dict, indices: list[int], training: bool) -> None:
        self.images = payload["images"]
        self.names = payload["filenames"]
        self.indices = indices
        self.transform = transform(training)

    def __len__(self) -> int:
        return len(self.indices)

    def __getitem__(self, index: int):
        source = self.indices[index]
        image = (self.images[source] * STD + MEAN).clamp(0, 1)
        value = self.transform(transforms.functional.to_pil_image(image))
        return value, len(GENERA) - 1, f"clear/{self.names[source]}"


@dataclass
class Evaluation:
    logits: np.ndarray
    labels: np.ndarray
    paths: list[str]
    loss: float


def collect(data: Path, seed: int):
    known = {name: [] for name in ("train", "val", "test")}
    for offset, (code, genus) in enumerate(CODE_TO_GENUS.items()):
        paths = sorted((data / code).glob("*.jpg"))
        splits = split_indices(len(paths), seed + offset * 101)
        label = GENERA.index(genus)
        for name, indices in splits.items():
            known[name].extend((paths[index], label) for index in indices)
    contrails = sorted((data / "Ct").glob("*.jpg"))
    outlier_splits = split_indices(len(contrails), seed + 7001)
    outliers = {
        name: [(contrails[index], -1) for index in indices]
        for name, indices in outlier_splits.items()
    }
    return known, outliers


@torch.inference_mode()
def evaluate(model, loader, loss_fn, device) -> Evaluation:
    model.eval()
    logits, labels, paths, losses = [], [], [], []
    for images, targets, batch_paths in loader:
        values = model(images.to(device))
        targets = targets.to(device)
        losses.append(float(loss_fn(values, targets).cpu()))
        logits.append(values.cpu().numpy())
        labels.append(targets.cpu().numpy())
        paths.extend(batch_paths)
    return Evaluation(np.concatenate(logits), np.concatenate(labels), paths, float(np.mean(losses)))


def softmax(logits: np.ndarray, temperature: float) -> np.ndarray:
    values = logits / temperature
    values -= values.max(axis=1, keepdims=True)
    values = np.exp(values)
    return values / values.sum(axis=1, keepdims=True)


def calibrate(logits: np.ndarray, labels: np.ndarray) -> float:
    x, y = torch.from_numpy(logits), torch.from_numpy(labels)
    options = np.linspace(0.45, 3.0, 180)
    losses = [float(nn.functional.cross_entropy(x / value, y)) for value in options]
    return float(options[int(np.argmin(losses))])


def choose_policy(values: np.ndarray, labels: np.ndarray, target: float) -> dict:
    order = np.argsort(-values, axis=1)
    confidence = values[np.arange(len(values)), order[:, 0]]
    margin = confidence - values[np.arange(len(values)), order[:, 1]]
    correct = order[:, 0] == labels
    candidates = []
    for minimum in np.linspace(0.2, 0.9, 71):
        for gap in np.linspace(0, 0.7, 71):
            accepted = (confidence >= minimum) & (margin >= gap)
            if accepted.sum() < max(25, round(len(labels) * 0.08)):
                continue
            candidates.append(
                {
                    "minimum_confidence": float(minimum),
                    "margin_threshold": float(gap),
                    "precision": float(correct[accepted].mean()),
                    "coverage": float(accepted.mean()),
                    "accepted_count": int(accepted.sum()),
                }
            )
    meeting = [row for row in candidates if row["precision"] >= target]
    selected = max(
        meeting or candidates,
        key=(lambda row: (row["coverage"], row["precision"]))
        if meeting
        else (lambda row: row["precision"] * math.sqrt(row["coverage"])),
    )
    selected["target_precision"] = target
    selected["target_met"] = bool(meeting)
    return selected


def report(evaluation: Evaluation, temperature: float, policy: dict) -> dict:
    values = softmax(evaluation.logits, temperature)
    order = np.argsort(-values, axis=1)
    confidence = values[np.arange(len(values)), order[:, 0]]
    margin = confidence - values[np.arange(len(values)), order[:, 1]]
    accepted = (confidence >= policy["minimum_confidence"]) & (margin >= policy["margin_threshold"])
    top1 = order[:, 0] == evaluation.labels
    top3 = np.array([evaluation.labels[i] in order[i, :3] for i in range(len(order))])
    by_class = classification_report(
        evaluation.labels,
        order[:, 0],
        labels=list(range(len(GENERA))),
        target_names=GENERA,
        zero_division=0,
        output_dict=True,
    )
    return {
        "sample_count": len(top1),
        "top1_accuracy": float(top1.mean()),
        "top3_accuracy": float(top3.mean()),
        "macro_f1": float(by_class["macro avg"]["f1-score"]),
        "selective_precision": float(top1[accepted].mean()) if accepted.any() else None,
        "selective_coverage": float(accepted.mean()),
        "accepted_count": int(accepted.sum()),
        "confusion_matrix": confusion_matrix(evaluation.labels, order[:, 0], labels=list(range(len(GENERA)))).tolist(),
        "classes": {name: by_class[name] for name in GENERA},
    }


def outlier_report(model, loader, device, temperature, policy) -> dict:
    rows = []
    model.eval()
    with torch.inference_mode():
        for images, _, paths in loader:
            values = softmax(model(images.to(device)).cpu().numpy(), temperature)
            order = np.argsort(-values, axis=1)
            for i, path in enumerate(paths):
                confidence = float(values[i, order[i, 0]])
                margin = float(confidence - values[i, order[i, 1]])
                accepted = confidence >= policy["minimum_confidence"] and margin >= policy["margin_threshold"]
                rows.append({"path": path, "top_hypothesis": GENERA[int(order[i, 0])], "confidence": confidence, "margin": margin, "abstained": not accepted})
    return {"sample_count": len(rows), "abstention_rate": float(np.mean([row["abstained"] for row in rows])), "samples": rows}


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--data", type=Path, required=True)
    parser.add_argument("--clear", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--epochs", type=int, default=32)
    parser.add_argument("--batch-size", type=int, default=64)
    parser.add_argument("--seed", type=int, default=42)
    parser.add_argument("--learning-rate", type=float, default=0.00035)
    parser.add_argument("--target-precision", type=float, default=0.85)
    args = parser.parse_args()
    seed_all(args.seed)
    args.output.mkdir(parents=True, exist_ok=True)
    device = torch.device("mps" if torch.backends.mps.is_available() else "cpu")
    print(f"device={device}", flush=True)

    known, outliers = collect(args.data, args.seed)
    clear = torch.load(args.clear, map_location="cpu", weights_only=True, mmap=True)
    clear_splits = split_indices(len(clear["images"]), args.seed + 8101)
    datasets = {
        name: ConcatDataset([PhotoDataset(known[name], name == "train"), ClearDataset(clear, clear_splits[name], name == "train")])
        for name in ("train", "val", "test")
    }
    loaders = {name: DataLoader(data, batch_size=args.batch_size, shuffle=name == "train", num_workers=0) for name, data in datasets.items()}
    outlier_loaders = {name: DataLoader(PhotoDataset(rows, name == "train"), batch_size=args.batch_size, shuffle=name == "train", num_workers=0) for name, rows in outliers.items()}

    model = build_model(len(GENERA), pretrained=True).to(device)
    counts = np.bincount([label for _, label in known["train"]] + [len(GENERA) - 1] * len(clear_splits["train"]), minlength=len(GENERA))
    weights = torch.from_numpy(np.sqrt(counts.max() / np.maximum(counts, 1)).astype(np.float32)).to(device)
    train_loss = nn.CrossEntropyLoss(weight=weights, label_smoothing=0.04)
    eval_loss = nn.CrossEntropyLoss()
    optimizer = torch.optim.AdamW(model.parameters(), lr=args.learning_rate, weight_decay=0.0005)
    scheduler = torch.optim.lr_scheduler.CosineAnnealingLR(optimizer, T_max=args.epochs)
    checkpoint = args.output / "cloud-genus-net.pt"
    best, patience, history = -1.0, 0, []
    for epoch in range(1, args.epochs + 1):
        model.train()
        losses, unknown_losses = [], []
        unknown_batches = cycle(outlier_loaders["train"])
        for images, targets, _ in loaders["train"]:
            unknown, _, _ = next(unknown_batches)
            optimizer.zero_grad(set_to_none=True)
            known_logits = model(images.to(device))
            unknown_logits = model(unknown.to(device))
            known_value = train_loss(known_logits, targets.to(device))
            unknown_value = -nn.functional.log_softmax(unknown_logits, dim=1).mean()
            value = known_value + 0.10 * unknown_value
            value.backward()
            optimizer.step()
            losses.append(float(known_value.detach().cpu()))
            unknown_losses.append(float(unknown_value.detach().cpu()))
        scheduler.step()
        validation = evaluate(model, loaders["val"], eval_loss, device)
        predictions = validation.logits.argmax(axis=1)
        accuracy = float(np.mean(predictions == validation.labels))
        macro_f1 = float(f1_score(validation.labels, predictions, labels=list(range(len(GENERA))), average="macro", zero_division=0))
        row = {"epoch": epoch, "train_loss": float(np.mean(losses)), "outlier_loss": float(np.mean(unknown_losses)), "validation_loss": validation.loss, "validation_accuracy": accuracy, "validation_macro_f1": macro_f1}
        history.append(row)
        print(json.dumps(row), flush=True)
        if macro_f1 > best + 0.002:
            best, patience = macro_f1, 0
            torch.save({"state_dict": model.state_dict(), "classes": GENERA, "architecture": "mobilenet_v3_small", "input_size": INPUT_SIZE, "probability_mode": "softmax"}, checkpoint)
        else:
            patience += 1
        if patience >= 10:
            break

    saved = torch.load(checkpoint, map_location="cpu", weights_only=True)
    model.load_state_dict(saved["state_dict"])
    model.to(device)
    validation = evaluate(model, loaders["val"], eval_loss, device)
    temperature = calibrate(validation.logits, validation.labels)
    policy = choose_policy(softmax(validation.logits, temperature), validation.labels, args.target_precision)
    test = evaluate(model, loaders["test"], eval_loss, device)
    benchmark = {
        "dataset": {"name": "CCSN v2", "doi": "10.7910/DVN/CADDPD", "license": "CC0 1.0", "clear_sky_supplement": "jcamier/cloud_sky_vis clear-sky tensors (MIT)"},
        "seed": args.seed,
        "classes": GENERA,
        "input": {"width": INPUT_SIZE, "height": INPUT_SIZE, "channels": 3},
        "temperature": temperature,
        "abstention_policy": policy,
        "history": history,
        "reports": {"validation": report(validation, temperature, policy), "test": report(test, temperature, policy), "contrail_holdout": outlier_report(model, outlier_loaders["test"], device, temperature, policy)},
    }
    (args.output / "benchmark.json").write_text(json.dumps(benchmark, indent=2) + "\n")
    torch.save({**saved, "temperature": temperature, "abstention_policy": policy}, checkpoint)
    print(json.dumps({"checkpoint": str(checkpoint), "policy": policy}), flush=True)


if __name__ == "__main__":
    main()
