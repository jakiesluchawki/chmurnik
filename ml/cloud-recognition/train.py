"""Train and benchmark the compact CHMURNIK cloud classifier."""

from __future__ import annotations

import argparse
import json
import math
import random
from dataclasses import dataclass
from pathlib import Path

import h5py
import numpy as np
import torch
from PIL import Image, ImageOps
from sklearn.metrics import average_precision_score, precision_recall_fscore_support
from torch import nn
from torch.utils.data import ConcatDataset, DataLoader, Dataset
from tqdm import tqdm

from labels import GENERA, to_genus_labels
from model import build_model


ROOT = Path(__file__).resolve().parents[2]
DEFAULT_DATA = ROOT / ".local/ml-data/wmo-rosenberger-2024"
DEFAULT_OUTPUT = ROOT / ".local/ml-artifacts/cloud-recognition"
DEFAULT_OOD_PATHS = [
    ROOT / "public/assets/convection-still-life.png",
    ROOT / "public/assets/observer-guide-still-life.png",
    ROOT / "public/assets/atmosphere-still-life.png",
    ROOT / "public/assets/wind-profile-still-life.png",
    ROOT / "public/assets/hero-atlas-swiatla.png",
    ROOT / "public/brand/chmurnik-wordmark.png",
    ROOT / "public/assets/upper-atmosphere/nacreous-clouds-antarctica.jpg",
    ROOT / "public/assets/upper-atmosphere/polar-stratospheric-cloud-type-i.jpg",
    ROOT / "public/assets/upper-atmosphere/noctilucent-clouds-laboe.jpg",
]


def seed_everything(seed: int) -> None:
    random.seed(seed)
    np.random.seed(seed)
    torch.manual_seed(seed)


def load_split(data_dir: Path, split: str) -> tuple[np.ndarray, np.ndarray]:
    with h5py.File(data_dir / f"img_{split}.nc", "r") as handle:
        images = np.asarray(handle["Full_period"], dtype=np.uint8)
    synop = np.loadtxt(
        data_dir / f"GroundTruth_{split}.csv", delimiter=",", dtype=np.float32
    )
    return images, to_genus_labels(synop)


class DirectionDataset(Dataset):
    def __init__(self, images: np.ndarray, labels: np.ndarray, augment: bool) -> None:
        self.images = images
        self.labels = labels
        self.augment = augment

    def __len__(self) -> int:
        return len(self.images) * 4

    def __getitem__(self, index: int) -> tuple[torch.Tensor, torch.Tensor, int]:
        instance_index, direction = divmod(index, 4)
        image = torch.from_numpy(self.images[instance_index, direction].copy())
        image = image.permute(2, 0, 1).float().div_(255.0)
        if self.augment:
            if torch.rand(()) < 0.5:
                image = torch.flip(image, dims=(2,))
            brightness = torch.empty(()).uniform_(0.82, 1.18)
            contrast = torch.empty(()).uniform_(0.86, 1.14)
            mean = image.mean(dim=(1, 2), keepdim=True)
            image = (image - mean) * contrast + mean
            image = image * brightness
            if torch.rand(()) < 0.3:
                image = image + torch.randn_like(image) * 0.012
            image = image.clamp_(0.0, 1.0)
        return image, torch.from_numpy(self.labels[instance_index]), instance_index


class OutOfScopeDataset(Dataset):
    """Small outlier-exposure set for non-photographic and non-tropospheric inputs."""

    def __init__(self, paths: list[Path], output_count: int, repeats: int) -> None:
        self.images = [
            np.asarray(
                ImageOps.fit(Image.open(path).convert("RGB"), (100, 64)),
                dtype=np.uint8,
            )
            for path in paths
        ]
        self.output_count = output_count
        self.repeats = repeats

    def __len__(self) -> int:
        return len(self.images) * self.repeats

    def __getitem__(self, index: int) -> tuple[torch.Tensor, torch.Tensor, int]:
        image = torch.from_numpy(self.images[index % len(self.images)].copy())
        image = image.permute(2, 0, 1).float().div_(255.0)
        if torch.rand(()) < 0.5:
            image = torch.flip(image, dims=(2,))
        brightness = torch.empty(()).uniform_(0.72, 1.28)
        contrast = torch.empty(()).uniform_(0.78, 1.22)
        mean = image.mean(dim=(1, 2), keepdim=True)
        image = ((image - mean) * contrast + mean) * brightness
        if torch.rand(()) < 0.4:
            image = image + torch.randn_like(image) * 0.018
        image = image.clamp_(0.0, 1.0)
        return image, torch.zeros(self.output_count), -1


@dataclass
class Evaluation:
    logits: np.ndarray
    labels: np.ndarray
    instance_ids: np.ndarray
    loss: float


@torch.inference_mode()
def evaluate(
    model: nn.Module,
    loader: DataLoader,
    loss_fn: nn.Module,
    device: torch.device,
) -> Evaluation:
    model.eval()
    logits_parts: list[np.ndarray] = []
    label_parts: list[np.ndarray] = []
    instance_parts: list[np.ndarray] = []
    losses: list[float] = []
    for images, labels, instance_ids in loader:
        images = images.to(device)
        labels = labels.to(device)
        logits = model(images)
        losses.append(float(loss_fn(logits, labels).detach().cpu()))
        logits_parts.append(logits.detach().cpu().numpy())
        label_parts.append(labels.detach().cpu().numpy())
        instance_parts.append(instance_ids.numpy())
    return Evaluation(
        logits=np.concatenate(logits_parts),
        labels=np.concatenate(label_parts),
        instance_ids=np.concatenate(instance_parts),
        loss=float(np.mean(losses)),
    )


def calibrate_temperature(logits: np.ndarray, labels: np.ndarray) -> float:
    logits_tensor = torch.from_numpy(logits)
    labels_tensor = torch.from_numpy(labels)
    candidates = np.linspace(0.55, 3.0, 100)
    losses = [
        float(nn.functional.binary_cross_entropy_with_logits(logits_tensor / t, labels_tensor))
        for t in candidates
    ]
    return float(candidates[int(np.argmin(losses))])


def choose_thresholds(probabilities: np.ndarray, labels: np.ndarray) -> list[float]:
    thresholds: list[float] = []
    for class_index in range(labels.shape[1]):
        best_threshold = 0.5
        best_f1 = -1.0
        for threshold in np.linspace(0.08, 0.82, 75):
            prediction = probabilities[:, class_index] >= threshold
            _, _, f1, _ = precision_recall_fscore_support(
                labels[:, class_index], prediction, average="binary", zero_division=0
            )
            if f1 > best_f1:
                best_f1 = float(f1)
                best_threshold = float(threshold)
        thresholds.append(best_threshold)
    return thresholds


def choose_abstention_policy(
    probabilities: np.ndarray,
    labels: np.ndarray,
    target_precision: float,
) -> dict:
    """Choose the broadest validation coverage that meets a precision target."""
    genus_probabilities = probabilities[:, :-1]
    genus_labels = labels[:, :-1]
    cloudy = genus_labels.sum(axis=1) > 0
    cloudy_probabilities = genus_probabilities[cloudy]
    top_order = np.argsort(-cloudy_probabilities, axis=1)
    top_indices = top_order[:, 0]
    cloudy_labels = genus_labels[cloudy]
    correct = cloudy_labels[np.arange(len(cloudy_labels)), top_indices] > 0
    margins = (
        cloudy_probabilities[np.arange(len(cloudy_probabilities)), top_order[:, 0]]
        - cloudy_probabilities[np.arange(len(cloudy_probabilities)), top_order[:, 1]]
    )
    minimum_accepted = max(50, int(math.ceil(len(margins) * 0.05)))
    candidates = np.unique(
        np.concatenate((np.linspace(0.0, 0.9, 181), margins))
    )
    options: list[dict] = []
    for threshold in candidates:
        accepted = margins >= threshold
        accepted_count = int(accepted.sum())
        if accepted_count < minimum_accepted:
            continue
        options.append(
            {
                "margin_threshold": float(threshold),
                "precision": float(correct[accepted].mean()),
                "coverage": float(accepted.mean()),
                "accepted_count": accepted_count,
            }
        )
    meeting_target = [row for row in options if row["precision"] >= target_precision]
    if meeting_target:
        selected = max(meeting_target, key=lambda row: row["coverage"])
        selected["target_met"] = True
    elif options:
        selected = max(
            options,
            key=lambda row: row["precision"] * math.sqrt(row["coverage"]),
        )
        selected["target_met"] = False
    else:
        selected = {
            "margin_threshold": 1.0,
            "precision": 0.0,
            "coverage": 0.0,
            "accepted_count": 0,
            "target_met": False,
        }
    selected["target_precision"] = target_precision
    return selected


def aggregate_instances(evaluation: Evaluation) -> tuple[np.ndarray, np.ndarray]:
    instance_count = int(evaluation.instance_ids.max()) + 1
    logits = np.zeros((instance_count, evaluation.logits.shape[1]), dtype=np.float32)
    counts = np.zeros(instance_count, dtype=np.float32)
    labels = np.zeros((instance_count, evaluation.labels.shape[1]), dtype=np.float32)
    for row, instance_id in enumerate(evaluation.instance_ids):
        logits[instance_id] += evaluation.logits[row]
        counts[instance_id] += 1
        labels[instance_id] = evaluation.labels[row]
    return logits / counts[:, None], labels


def metric_report(
    logits: np.ndarray,
    labels: np.ndarray,
    temperature: float,
    thresholds: list[float],
    abstention_policy: dict,
) -> dict:
    probabilities = 1.0 / (1.0 + np.exp(-(logits / temperature)))
    predictions = probabilities >= np.asarray(thresholds)[None, :]
    precision, recall, f1, support = precision_recall_fscore_support(
        labels, predictions, average=None, zero_division=0
    )
    average_precision = average_precision_score(labels, probabilities, average=None)
    genus_probabilities = probabilities[:, :-1]
    genus_labels = labels[:, :-1]
    cloudy = genus_labels.sum(axis=1) > 0
    top_order = np.argsort(-genus_probabilities, axis=1)
    top1_hit = np.array(
        [genus_labels[row, top_order[row, 0]] > 0 for row in range(len(labels))]
    )
    top3_hit = np.array(
        [genus_labels[row, top_order[row, :3]].max() > 0 for row in range(len(labels))]
    )
    top_probabilities = np.take_along_axis(
        genus_probabilities, top_order[:, :2], axis=1
    )
    margin = top_probabilities[:, 0] - top_probabilities[:, 1]
    accepted = cloudy & (
        margin >= float(abstention_policy["margin_threshold"])
    )
    accepted_cloudy = int(accepted.sum())
    brier = float(np.mean((probabilities - labels) ** 2))
    return {
        "sample_count": int(len(labels)),
        "brier_score": brier,
        "macro_average_precision": float(np.nanmean(average_precision)),
        "macro_f1": float(np.mean(f1)),
        "cloudy_top1_hit_rate": float(top1_hit[cloudy].mean()),
        "cloudy_top3_hit_rate": float(top3_hit[cloudy].mean()),
        "selective_top1_precision": (
            float(top1_hit[accepted].mean()) if accepted_cloudy else None
        ),
        "selective_coverage": float(accepted_cloudy / max(int(cloudy.sum()), 1)),
        "abstention_rate": float(1.0 - accepted_cloudy / max(int(cloudy.sum()), 1)),
        "classes": {
            name: {
                "support": int(support[index]),
                "average_precision": float(average_precision[index]),
                "precision": float(precision[index]),
                "recall": float(recall[index]),
                "f1": float(f1[index]),
                "threshold": float(thresholds[index]),
            }
            for index, name in enumerate(GENERA)
        },
    }


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--data", type=Path, default=DEFAULT_DATA)
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    parser.add_argument("--epochs", type=int, default=24)
    parser.add_argument("--batch-size", type=int, default=384)
    parser.add_argument("--seed", type=int, default=42)
    parser.add_argument("--learning-rate", type=float, default=0.003)
    parser.add_argument(
        "--architecture",
        choices=("tiny", "mobilenet_v3_small"),
        default="tiny",
    )
    parser.add_argument("--target-precision", type=float, default=0.85)
    parser.add_argument("--resume", action="store_true")
    parser.add_argument("--progress", action="store_true")
    parser.add_argument("--ood-exposure-repeats", type=int, default=64)
    args = parser.parse_args()

    seed_everything(args.seed)
    args.output.mkdir(parents=True, exist_ok=True)
    device = torch.device("mps" if torch.backends.mps.is_available() else "cpu")
    print(f"device={device}")

    train_images, train_labels = load_split(args.data, "train")
    val_images, val_labels = load_split(args.data, "val")
    train_dataset: Dataset = DirectionDataset(train_images, train_labels, augment=True)
    if args.ood_exposure_repeats > 0:
        train_dataset = ConcatDataset(
            [
                train_dataset,
                OutOfScopeDataset(
                    DEFAULT_OOD_PATHS,
                    len(GENERA),
                    args.ood_exposure_repeats,
                ),
            ]
        )
    train_loader = DataLoader(
        train_dataset,
        batch_size=args.batch_size,
        shuffle=True,
        num_workers=0,
    )
    val_loader = DataLoader(
        DirectionDataset(val_images, val_labels, augment=False),
        batch_size=args.batch_size,
        shuffle=False,
        num_workers=0,
    )

    model = build_model(
        args.architecture,
        len(GENERA),
        pretrained=args.architecture == "mobilenet_v3_small" and not args.resume,
    ).to(device)
    counts = train_labels.sum(axis=0) * 4
    total = len(train_dataset)
    pos_weight = np.clip((total - counts) / np.maximum(counts, 1), 1.0, 14.0)
    loss_fn = nn.BCEWithLogitsLoss(
        pos_weight=torch.from_numpy(pos_weight.astype(np.float32)).to(device)
    )
    optimizer = torch.optim.AdamW(
        model.parameters(), lr=args.learning_rate, weight_decay=0.0002
    )
    scheduler = torch.optim.lr_scheduler.CosineAnnealingLR(optimizer, T_max=args.epochs)

    best_loss = math.inf
    patience = 0
    history: list[dict] = []
    checkpoint = args.output / "cloud-genus-net.pt"
    training_state = args.output / "last-training-state.pt"
    start_epoch = 0
    if args.resume and training_state.exists():
        saved_state = torch.load(training_state, map_location="cpu", weights_only=True)
        model.load_state_dict(saved_state["state_dict"])
        optimizer.load_state_dict(saved_state["optimizer"])
        scheduler.load_state_dict(saved_state["scheduler"])
        best_loss = float(saved_state["best_loss"])
        patience = int(saved_state["patience"])
        history = saved_state["history"]
        start_epoch = int(saved_state["epoch"])
        print(f"resuming epoch={start_epoch + 1}")
    elif args.resume and checkpoint.exists():
        saved_state = torch.load(checkpoint, map_location="cpu", weights_only=True)
        model.load_state_dict(saved_state["state_dict"])
        print("warm-starting from legacy best checkpoint")

    for epoch in range(start_epoch + 1, args.epochs + 1):
        model.train()
        train_losses: list[float] = []
        progress = tqdm(
            train_loader,
            desc=f"epoch {epoch:02d}",
            leave=False,
            disable=not args.progress,
        )
        for images, labels, _ in progress:
            images = images.to(device)
            labels = labels.to(device)
            optimizer.zero_grad(set_to_none=True)
            loss = loss_fn(model(images), labels)
            loss.backward()
            optimizer.step()
            train_losses.append(float(loss.detach().cpu()))
            progress.set_postfix(loss=f"{np.mean(train_losses[-20:]):.4f}")
        scheduler.step()
        validation = evaluate(model, val_loader, loss_fn, device)
        epoch_result = {
            "epoch": epoch,
            "train_loss": float(np.mean(train_losses)),
            "validation_loss": validation.loss,
            "learning_rate": optimizer.param_groups[0]["lr"],
        }
        history.append(epoch_result)
        print(json.dumps(epoch_result))
        if validation.loss < best_loss - 0.001:
            best_loss = validation.loss
            patience = 0
            torch.save(
                {
                    "state_dict": model.state_dict(),
                    "classes": GENERA,
                    "architecture": args.architecture,
                },
                checkpoint,
            )
        else:
            patience += 1
        torch.save(
            {
                "state_dict": model.state_dict(),
                "optimizer": optimizer.state_dict(),
                "scheduler": scheduler.state_dict(),
                "best_loss": best_loss,
                "patience": patience,
                "history": history,
                "epoch": epoch,
                "architecture": args.architecture,
            },
            training_state,
        )
        if patience >= 6:
            break

    saved = torch.load(checkpoint, map_location="cpu", weights_only=True)
    model.load_state_dict(saved["state_dict"])
    model.to(device)
    validation = evaluate(model, val_loader, loss_fn, device)
    temperature = calibrate_temperature(validation.logits, validation.labels)
    validation_probabilities = 1.0 / (
        1.0 + np.exp(-(validation.logits / temperature))
    )
    thresholds = choose_thresholds(validation_probabilities, validation.labels)
    abstention_policy = choose_abstention_policy(
        validation_probabilities, validation.labels, args.target_precision
    )

    reports: dict[str, dict] = {}
    for split in ("val", "test", "outofsample"):
        if split == "val":
            evaluation = validation
        else:
            images, labels = load_split(args.data, split)
            loader = DataLoader(
                DirectionDataset(images, labels, augment=False),
                batch_size=args.batch_size,
                shuffle=False,
                num_workers=0,
            )
            evaluation = evaluate(model, loader, loss_fn, device)
        reports[f"{split}_single_photo"] = metric_report(
            evaluation.logits,
            evaluation.labels,
            temperature,
            thresholds,
            abstention_policy,
        )
        instance_logits, instance_labels = aggregate_instances(evaluation)
        reports[f"{split}_four_view"] = metric_report(
            instance_logits,
            instance_labels,
            temperature,
            thresholds,
            abstention_policy,
        )

    artifact = {
        "dataset": {
            "doi": "10.5281/zenodo.14185063",
            "license": "CC BY 4.0",
        },
        "seed": args.seed,
        "device": str(device),
        "parameter_count": sum(p.numel() for p in model.parameters()),
        "architecture": args.architecture,
        "input": {"width": 100, "height": 64, "channels": 3},
        "classes": GENERA,
        "temperature": temperature,
        "thresholds": dict(zip(GENERA, thresholds, strict=True)),
        "abstention_policy": abstention_policy,
        "history": history,
        "reports": reports,
    }
    (args.output / "benchmark.json").write_text(
        json.dumps(artifact, indent=2, ensure_ascii=False) + "\n"
    )
    torch.save(
        {
            "state_dict": model.cpu().state_dict(),
            "classes": GENERA,
            "temperature": temperature,
            "thresholds": thresholds,
            "abstention_policy": abstention_policy,
            "architecture": args.architecture,
        },
        checkpoint,
    )
    print(json.dumps({"checkpoint": str(checkpoint), "temperature": temperature}))


if __name__ == "__main__":
    main()
