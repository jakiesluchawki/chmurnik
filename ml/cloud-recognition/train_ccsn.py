"""Train a single-photo WMO genus classifier on the CC0 CCSN dataset."""

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
from tqdm import tqdm

from labels import GENERA
from model import build_model


ROOT = Path(__file__).resolve().parents[2]
DEFAULT_DATA = ROOT / ".local/ml-data/ccsn-dataverse/CCSN_v2"
DEFAULT_CLEAR = ROOT / ".local/ml-data/cloud-sky-vis/clear_sky_tensor.pt"
DEFAULT_OUTPUT = ROOT / ".local/ml-artifacts/cloud-recognition-ccsn"
INPUT_SIZE = 224

CODE_TO_GENUS = {
    "Ci": "cirrus",
    "Cc": "cirrocumulus",
    "Cs": "cirrostratus",
    "Ac": "altocumulus",
    "As": "altostratus",
    "Ns": "nimbostratus",
    "Sc": "stratocumulus",
    "St": "stratus",
    "Cu": "cumulus",
    "Cb": "cumulonimbus",
}

IMAGE_MEAN = torch.tensor([0.485, 0.456, 0.406]).view(3, 1, 1)
IMAGE_STD = torch.tensor([0.229, 0.224, 0.225]).view(3, 1, 1)


def seed_everything(seed: int) -> None:
    random.seed(seed)
    np.random.seed(seed)
    torch.manual_seed(seed)


def split_indices(count: int, seed: int) -> dict[str, list[int]]:
    indices = list(range(count))
    random.Random(seed).shuffle(indices)
    validation_count = max(1, round(count * 0.15))
    test_count = max(1, round(count * 0.15))
    return {
        "train": indices[validation_count + test_count :],
        "val": indices[:validation_count],
        "test": indices[validation_count : validation_count + test_count],
    }


def image_transforms(training: bool) -> transforms.Compose:
    if training:
        return transforms.Compose(
            [
                transforms.Resize(248),
                transforms.RandomCrop(INPUT_SIZE),
                transforms.RandomHorizontalFlip(),
                transforms.RandomRotation(4),
                transforms.ColorJitter(
                    brightness=0.12, contrast=0.12, saturation=0.08, hue=0.015
                ),
                transforms.ToTensor(),
            ]
        )
    return transforms.Compose(
        [
            transforms.Resize(256),
            transforms.CenterCrop(INPUT_SIZE),
            transforms.ToTensor(),
        ]
    )


class ImageItemsDataset(Dataset):
    def __init__(
        self,
        items: list[tuple[Path, int]],
        training: bool,
    ) -> None:
        self.items = items
        self.transform = image_transforms(training)

    def __len__(self) -> int:
        return len(self.items)

    def __getitem__(self, index: int) -> tuple[torch.Tensor, int, str]:
        path, label = self.items[index]
        with Image.open(path) as image:
            tensor = self.transform(image.convert("RGB"))
        return tensor, label, str(path)


class ClearSkyDataset(Dataset):
    def __init__(
        self,
        source: Path,
        indices: list[int],
        training: bool,
    ) -> None:
        payload = torch.load(source, map_location="cpu", weights_only=True)
        self.images = payload["images"]
        self.filenames = payload["filenames"]
        self.indices = indices
        self.transform = image_transforms(training)

    def __len__(self) -> int:
        return len(self.indices)

    def __getitem__(self, index: int) -> tuple[torch.Tensor, int, str]:
        source_index = self.indices[index]
        normalized = self.images[source_index]
        image = (normalized * IMAGE_STD + IMAGE_MEAN).clamp(0, 1)
        pil_image = transforms.functional.to_pil_image(image)
        return (
            self.transform(pil_image),
            len(GENERA) - 1,
            f"clear-sky/{self.filenames[source_index]}",
        )


@dataclass
class Evaluation:
    logits: np.ndarray
    labels: np.ndarray
    paths: list[str]
    loss: float


def collect_items(data_dir: Path, seed: int) -> dict[str, list[tuple[Path, int]]]:
    result: dict[str, list[tuple[Path, int]]] = {
        "train": [],
        "val": [],
        "test": [],
    }
    for class_offset, (code, genus) in enumerate(CODE_TO_GENUS.items()):
        paths = sorted((data_dir / code).glob("*.jpg"))
        if not paths:
            raise FileNotFoundError(f"No CCSN images for {code} in {data_dir}")
        class_index = GENERA.index(genus)
        splits = split_indices(len(paths), seed + class_offset * 101)
        for split, indices in splits.items():
            result[split].extend((paths[index], class_index) for index in indices)
    return result


def collect_outlier_items(data_dir: Path, seed: int) -> dict[str, list[tuple[Path, int]]]:
    paths = sorted((data_dir / "Ct").glob("*.jpg"))
    splits = split_indices(len(paths), seed + 7001)
    return {
        split: [(paths[index], -1) for index in indices]
        for split, indices in splits.items()
    }


@torch.inference_mode()
def evaluate(
    model: nn.Module,
    loader: DataLoader,
    loss_fn: nn.Module,
    device: torch.device,
) -> Evaluation:
    model.eval()
    logits: list[np.ndarray] = []
    labels: list[np.ndarray] = []
    paths: list[str] = []
    losses: list[float] = []
    for images, batch_labels, batch_paths in loader:
        images = images.to(device)
        batch_labels = batch_labels.to(device)
        batch_logits = model(images)
        losses.append(float(loss_fn(batch_logits, batch_labels).cpu()))
        logits.append(batch_logits.cpu().numpy())
        labels.append(batch_labels.cpu().numpy())
        paths.extend(batch_paths)
    return Evaluation(
        logits=np.concatenate(logits),
        labels=np.concatenate(labels),
        paths=paths,
        loss=float(np.mean(losses)),
    )


def calibrate_temperature(logits: np.ndarray, labels: np.ndarray) -> float:
    logits_tensor = torch.from_numpy(logits)
    labels_tensor = torch.from_numpy(labels)
    candidates = np.linspace(0.45, 3.0, 180)
    losses = [
        float(nn.functional.cross_entropy(logits_tensor / value, labels_tensor))
        for value in candidates
    ]
    return float(candidates[int(np.argmin(losses))])


def probabilities(logits: np.ndarray, temperature: float) -> np.ndarray:
    scaled = logits / temperature
    scaled -= scaled.max(axis=1, keepdims=True)
    exponent = np.exp(scaled)
    return exponent / exponent.sum(axis=1, keepdims=True)


def choose_abstention_policy(
    validation_probabilities: np.ndarray,
    labels: np.ndarray,
    target_precision: float,
) -> dict[str, float | bool | int]:
    order = np.argsort(-validation_probabilities, axis=1)
    confidence = validation_probabilities[np.arange(len(labels)), order[:, 0]]
    margin = confidence - validation_probabilities[np.arange(len(labels)), order[:, 1]]
    correct = order[:, 0] == labels
    options: list[dict[str, float | bool | int]] = []
    for minimum_confidence in np.linspace(0.20, 0.90, 71):
        for minimum_margin in np.linspace(0.0, 0.70, 71):
            accepted = (confidence >= minimum_confidence) & (margin >= minimum_margin)
            accepted_count = int(accepted.sum())
            if accepted_count < max(25, round(len(labels) * 0.08)):
                continue
            options.append(
                {
                    "minimum_confidence": float(minimum_confidence),
                    "margin_threshold": float(minimum_margin),
                    "precision": float(correct[accepted].mean()),
                    "coverage": float(accepted.mean()),
                    "accepted_count": accepted_count,
                }
            )
    meeting_target = [row for row in options if row["precision"] >= target_precision]
    if meeting_target:
        selected = max(meeting_target, key=lambda row: (row["coverage"], row["precision"]))
        selected["target_met"] = True
    else:
        selected = max(
            options,
            key=lambda row: float(row["precision"]) * math.sqrt(float(row["coverage"])),
        )
        selected["target_met"] = False
    selected["target_precision"] = target_precision
    return selected


def metric_report(
    evaluation: Evaluation,
    temperature: float,
    policy: dict[str, float | bool | int],
) -> dict:
    values = probabilities(evaluation.logits, temperature)
    order = np.argsort(-values, axis=1)
    confidence = values[np.arange(len(values)), order[:, 0]]
    margin = confidence - values[np.arange(len(values)), order[:, 1]]
    accepted = (confidence >= float(policy["minimum_confidence"])) & (
        margin >= float(policy["margin_threshold"])
    )
    top1 = order[:, 0] == evaluation.labels
    top3 = np.array(
        [evaluation.labels[row] in order[row, :3] for row in range(len(order))]
    )
    report = classification_report(
        evaluation.labels,
        order[:, 0],
        labels=list(range(len(GENERA))),
        target_names=GENERA,
        zero_division=0,
        output_dict=True,
    )
    return {
        "sample_count": len(evaluation.labels),
        "loss": evaluation.loss,
        "top1_accuracy": float(top1.mean()),
        "top3_accuracy": float(top3.mean()),
        "macro_f1": float(report["macro avg"]["f1-score"]),
        "selective_precision": float(top1[accepted].mean()) if accepted.any() else None,
        "selective_coverage": float(accepted.mean()),
        "accepted_count": int(accepted.sum()),
        "confusion_matrix": confusion_matrix(
            evaluation.labels, order[:, 0], labels=list(range(len(GENERA)))
        ).tolist(),
        "classes": {name: report[name] for name in GENERA},
    }


def outlier_report(
    model: nn.Module,
    loader: DataLoader,
    device: torch.device,
    temperature: float,
    policy: dict[str, float | bool | int],
) -> dict:
    model.eval()
    rows: list[dict] = []
    with torch.inference_mode():
        for images, _, paths in loader:
            values = probabilities(model(images.to(device)).cpu().numpy(), temperature)
            order = np.argsort(-values, axis=1)
            for row, path in enumerate(paths):
                confidence = float(values[row, order[row, 0]])
                margin = float(confidence - values[row, order[row, 1]])
                accepted = confidence >= float(policy["minimum_confidence"]) and (
                    margin >= float(policy["margin_threshold"])
                )
                rows.append(
                    {
                        "path": path,
                        "top_hypothesis": GENERA[int(order[row, 0])],
                        "confidence": confidence,
                        "margin": margin,
                        "abstained": not accepted,
                    }
                )
    return {
        "sample_count": len(rows),
        "abstention_rate": float(np.mean([row["abstained"] for row in rows])),
        "samples": rows,
    }


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--data", type=Path, default=DEFAULT_DATA)
    parser.add_argument("--clear", type=Path, default=DEFAULT_CLEAR)
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    parser.add_argument("--epochs", type=int, default=32)
    parser.add_argument("--batch-size", type=int, default=64)
    parser.add_argument("--learning-rate", type=float, default=0.00035)
    parser.add_argument("--seed", type=int, default=42)
    parser.add_argument("--target-precision", type=float, default=0.88)
    parser.add_argument("--progress", action="store_true")
    args = parser.parse_args()

    seed_everything(args.seed)
    args.output.mkdir(parents=True, exist_ok=True)
    device = torch.device("mps" if torch.backends.mps.is_available() else "cpu")
    print(f"device={device}")

    items = collect_items(args.data, args.seed)
    outliers = collect_outlier_items(args.data, args.seed)
    clear_payload = torch.load(args.clear, map_location="cpu", weights_only=True)
    clear_splits = split_indices(len(clear_payload["images"]), args.seed + 8101)
    del clear_payload

    datasets: dict[str, Dataset] = {}
    for split in ("train", "val", "test"):
        datasets[split] = ConcatDataset(
            [
                ImageItemsDataset(items[split], training=split == "train"),
                ClearSkyDataset(args.clear, clear_splits[split], training=split == "train"),
            ]
        )
    loaders = {
        split: DataLoader(
            dataset,
            batch_size=args.batch_size,
            shuffle=split == "train",
            num_workers=0,
        )
        for split, dataset in datasets.items()
    }
    outlier_loaders = {
        split: DataLoader(
            ImageItemsDataset(rows, training=split == "train"),
            batch_size=args.batch_size,
            shuffle=split == "train",
            num_workers=0,
        )
        for split, rows in outliers.items()
    }

    model = build_model(
        "mobilenet_v3_small", len(GENERA), pretrained=True
    ).to(device)
    counts = np.bincount(
        [label for _, label in items["train"]]
        + [len(GENERA) - 1] * len(clear_splits["train"]),
        minlength=len(GENERA),
    )
    class_weights = np.sqrt(counts.max() / np.maximum(counts, 1))
    known_loss = nn.CrossEntropyLoss(
        weight=torch.from_numpy(class_weights.astype(np.float32)).to(device),
        label_smoothing=0.04,
    )
    evaluation_loss = nn.CrossEntropyLoss()
    optimizer = torch.optim.AdamW(
        model.parameters(), lr=args.learning_rate, weight_decay=0.0005
    )
    scheduler = torch.optim.lr_scheduler.CosineAnnealingLR(
        optimizer, T_max=args.epochs
    )

    best_score = -math.inf
    patience = 0
    history: list[dict] = []
    checkpoint = args.output / "cloud-genus-net.pt"
    for epoch in range(1, args.epochs + 1):
        model.train()
        known_losses: list[float] = []
        unknown_losses: list[float] = []
        outlier_batches = cycle(outlier_loaders["train"])
        progress = tqdm(
            loaders["train"],
            desc=f"epoch {epoch:02d}",
            leave=False,
            disable=not args.progress,
        )
        for images, labels, _ in progress:
            outlier_images, _, _ = next(outlier_batches)
            images = images.to(device)
            labels = labels.to(device)
            outlier_images = outlier_images.to(device)
            optimizer.zero_grad(set_to_none=True)
            logits = model(images)
            outlier_logits = model(outlier_images)
            loss_known = known_loss(logits, labels)
            loss_unknown = -nn.functional.log_softmax(outlier_logits, dim=1).mean()
            loss = loss_known + 0.10 * loss_unknown
            loss.backward()
            optimizer.step()
            known_losses.append(float(loss_known.detach().cpu()))
            unknown_losses.append(float(loss_unknown.detach().cpu()))
            progress.set_postfix(loss=f"{np.mean(known_losses[-20:]):.3f}")
        scheduler.step()
        validation = evaluate(model, loaders["val"], evaluation_loss, device)
        validation_predictions = validation.logits.argmax(axis=1)
        validation_accuracy = float(
            np.mean(validation_predictions == validation.labels)
        )
        validation_macro_f1 = float(
            f1_score(
                validation.labels,
                validation_predictions,
                labels=list(range(len(GENERA))),
                average="macro",
                zero_division=0,
            )
        )
        result = {
            "epoch": epoch,
            "train_loss": float(np.mean(known_losses)),
            "outlier_loss": float(np.mean(unknown_losses)),
            "validation_loss": validation.loss,
            "validation_accuracy": validation_accuracy,
            "validation_macro_f1": validation_macro_f1,
            "learning_rate": optimizer.param_groups[0]["lr"],
        }
        history.append(result)
        print(json.dumps(result))
        if validation_macro_f1 > best_score + 0.002:
            best_score = validation_macro_f1
            patience = 0
            torch.save(
                {
                    "state_dict": model.state_dict(),
                    "classes": GENERA,
                    "architecture": "mobilenet_v3_small",
                    "input_size": INPUT_SIZE,
                    "probability_mode": "softmax",
                },
                checkpoint,
            )
        else:
            patience += 1
        if patience >= 9:
            break

    saved = torch.load(checkpoint, map_location="cpu", weights_only=True)
    model.load_state_dict(saved["state_dict"])
    model.to(device)
    validation = evaluate(model, loaders["val"], evaluation_loss, device)
    temperature = calibrate_temperature(validation.logits, validation.labels)
    policy = choose_abstention_policy(
        probabilities(validation.logits, temperature),
        validation.labels,
        args.target_precision,
    )
    test = evaluate(model, loaders["test"], evaluation_loss, device)

    artifact = {
        "dataset": {
            "name": "Cirrus Cumulus Stratus Nimbus (CCSN) Database v2",
            "doi": "10.7910/DVN/CADDPD",
            "license": "CC0 1.0",
            "clear_sky_supplement": "jcamier/cloud_sky_vis (MIT), clear-sky tensors only",
        },
        "seed": args.seed,
        "device": str(device),
        "parameter_count": sum(parameter.numel() for parameter in model.parameters()),
        "architecture": "mobilenet_v3_small",
        "input": {"width": INPUT_SIZE, "height": INPUT_SIZE, "channels": 3},
        "classes": GENERA,
        "temperature": temperature,
        "abstention_policy": policy,
        "history": history,
        "split_counts": {split: len(dataset) for split, dataset in datasets.items()},
        "reports": {
            "validation": metric_report(validation, temperature, policy),
            "test": metric_report(test, temperature, policy),
            "contrail_holdout": outlier_report(
                model, outlier_loaders["test"], device, temperature, policy
            ),
        },
    }
    (args.output / "benchmark.json").write_text(
        json.dumps(artifact, indent=2, ensure_ascii=False) + "\n"
    )
    torch.save(
        {
            **saved,
            "temperature": temperature,
            "abstention_policy": policy,
        },
        checkpoint,
    )
    print(json.dumps({"checkpoint": str(checkpoint), "policy": policy}))


if __name__ == "__main__":
    main()
