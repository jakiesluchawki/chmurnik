"""Train CHMURNIK v3 with full-frame input and duplicate-safe splits."""

from __future__ import annotations

import argparse
import hashlib
import json
import math
import random
from dataclasses import dataclass
from itertools import cycle
from pathlib import Path

import numpy as np
import torch
from PIL import Image, ImageOps
from sklearn.metrics import f1_score
from torch import nn
from torch.utils.data import ConcatDataset, DataLoader, Dataset
from torchvision import transforms

from labels import CODE_TO_GENUS, GENERA
from model import build_model
from train_ccsn import Evaluation, calibrate, choose_policy, evaluate, outlier_report, report, softmax


MEAN = torch.tensor([0.485, 0.456, 0.406]).view(3, 1, 1)
STD = torch.tensor([0.229, 0.224, 0.225]).view(3, 1, 1)
FAMILY_BY_CLASS = torch.tensor([0, 0, 0, 1, 1, 2, 2, 2, 3, 3, 4])
FAMILY_GROUPS = ((0, 1, 2), (3, 4), (5, 6, 7), (8, 9), (10,))


def seed_all(seed: int) -> None:
    random.seed(seed)
    np.random.seed(seed)
    torch.manual_seed(seed)


class FitSquare:
    def __init__(self, size: int) -> None:
        self.size = size

    def __call__(self, image: Image.Image) -> Image.Image:
        return ImageOps.pad(
            image,
            (self.size, self.size),
            method=Image.Resampling.BICUBIC,
            color=(0, 0, 0),
            centering=(0.5, 0.5),
        )


def build_transform(training: bool, input_size: int, preprocess: str):
    if preprocess == "full_frame":
        geometry = [FitSquare(input_size)]
    elif preprocess == "center_crop":
        resize = round(input_size * 1.11)
        geometry = [transforms.Resize(resize), transforms.RandomCrop(input_size) if training else transforms.CenterCrop(input_size)]
    else:
        raise ValueError(f"Unsupported preprocessing mode: {preprocess}")
    augmentation = (
        [
            transforms.RandomHorizontalFlip(),
            transforms.RandomRotation(4, fill=0),
            transforms.ColorJitter(0.14, 0.14, 0.1, 0.02),
        ]
        if training
        else []
    )
    return transforms.Compose([*geometry, *augmentation, transforms.ToTensor()])


class PhotoDataset(Dataset):
    def __init__(
        self,
        items: list[tuple[Path, int]],
        training: bool,
        input_size: int,
        preprocess: str,
    ) -> None:
        self.items = items
        self.transform = build_transform(training, input_size, preprocess)

    def __len__(self) -> int:
        return len(self.items)

    def __getitem__(self, index: int):
        path, label = self.items[index]
        with Image.open(path) as image:
            value = self.transform(image.convert("RGB"))
        return value, label, str(path)


class ClearDataset(Dataset):
    def __init__(
        self,
        payload: dict,
        indices: list[int],
        training: bool,
        input_size: int,
        preprocess: str,
    ) -> None:
        self.images = payload["images"]
        self.names = payload["filenames"]
        self.indices = indices
        self.transform = build_transform(training, input_size, preprocess)

    def __len__(self) -> int:
        return len(self.indices)

    def __getitem__(self, index: int):
        source = self.indices[index]
        image = (self.images[source] * STD + MEAN).clamp(0, 1)
        value = self.transform(transforms.functional.to_pil_image(image))
        return value, len(GENERA) - 1, f"clear/{self.names[source]}"


def perceptual_hash(path: Path, size: int = 16) -> int:
    with Image.open(path) as image:
        pixels = np.asarray(
            image.convert("L").resize((size + 1, size), Image.Resampling.BILINEAR),
            dtype=np.int16,
        )
    bits = pixels[:, 1:] > pixels[:, :-1]
    value = 0
    for bit in bits.flat:
        value = (value << 1) | int(bit)
    return value


def duplicate_groups(paths: list[Path], distance: int) -> list[list[Path]]:
    hashes = [perceptual_hash(path) for path in paths]
    parents = list(range(len(paths)))

    def find(value: int) -> int:
        while parents[value] != value:
            parents[value] = parents[parents[value]]
            value = parents[value]
        return value

    def union(left: int, right: int) -> None:
        left_root, right_root = find(left), find(right)
        if left_root != right_root:
            parents[right_root] = left_root

    for left in range(len(paths)):
        for right in range(left + 1, len(paths)):
            if bin(hashes[left] ^ hashes[right]).count("1") <= distance:
                union(left, right)
    grouped: dict[int, list[Path]] = {}
    for index, path in enumerate(paths):
        grouped.setdefault(find(index), []).append(path)
    return list(grouped.values())


def grouped_split(paths: list[Path], seed: int, distance: int) -> dict[str, list[Path]]:
    groups = duplicate_groups(paths, distance)
    random.Random(seed).shuffle(groups)
    targets = {"train": len(paths) * 0.70, "val": len(paths) * 0.15, "test": len(paths) * 0.15}
    result = {name: [] for name in targets}
    for group in groups:
        deficits = {
            name: (targets[name] - len(result[name])) / max(targets[name], 1)
            for name in targets
        }
        selected = max(deficits, key=lambda name: deficits[name])
        result[selected].extend(group)
    return result


def random_split(count: int, seed: int) -> dict[str, list[int]]:
    values = list(range(count))
    random.Random(seed).shuffle(values)
    validation = max(1, round(count * 0.15))
    return {
        "val": values[:validation],
        "test": values[validation : 2 * validation],
        "train": values[2 * validation :],
    }


def collect(data: Path, seed: int, duplicate_distance: int):
    known = {name: [] for name in ("train", "val", "test")}
    split_manifest: dict[str, dict[str, list[str]]] = {}
    for offset, (code, genus) in enumerate(CODE_TO_GENUS.items()):
        paths = sorted((data / code).glob("*.jpg"))
        splits = grouped_split(paths, seed + offset * 101, duplicate_distance)
        label = GENERA.index(genus)
        split_manifest[genus] = {}
        for name, split_paths in splits.items():
            known[name].extend((path, label) for path in split_paths)
            split_manifest[genus][name] = [path.name for path in split_paths]
    contrails = sorted((data / "Ct").glob("*.jpg"))
    outlier_paths = grouped_split(contrails, seed + 7001, duplicate_distance)
    outliers = {
        name: [(path, -1) for path in split_paths]
        for name, split_paths in outlier_paths.items()
    }
    split_manifest["contrail_outlier"] = {
        name: [path.name for path in split_paths]
        for name, split_paths in outlier_paths.items()
    }
    return known, outliers, split_manifest


def collect_supplement(root: Path | None) -> list[tuple[Path, int]]:
    if root is None:
        return []
    items: list[tuple[Path, int]] = []
    for genus in GENERA[:-1]:
        directory = root / genus
        if not directory.is_dir():
            raise ValueError(f"Missing supplement directory: {directory}")
        paths = sorted([*directory.glob("*.jpg"), *directory.glob("*.png")])
        items.extend((path, GENERA.index(genus)) for path in paths)
    return items


def family_loss(logits: torch.Tensor, targets: torch.Tensor) -> torch.Tensor:
    log_probabilities = nn.functional.log_softmax(logits, dim=1)
    family_log_probabilities = torch.stack(
        [torch.logsumexp(log_probabilities[:, indices], dim=1) for indices in FAMILY_GROUPS],
        dim=1,
    )
    family_targets = FAMILY_BY_CLASS.to(targets.device)[targets]
    return nn.functional.nll_loss(family_log_probabilities, family_targets)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--data", type=Path, required=True)
    parser.add_argument("--clear", type=Path, required=True)
    parser.add_argument("--supplement", type=Path)
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--architecture", choices=("mobilenet_v3_large", "efficientnet_b0"), default="mobilenet_v3_large")
    parser.add_argument("--input-size", type=int, default=320)
    parser.add_argument("--preprocess", choices=("full_frame", "center_crop"), default="full_frame")
    parser.add_argument("--epochs", type=int, default=28)
    parser.add_argument("--batch-size", type=int, default=32)
    parser.add_argument("--seed", type=int, default=42)
    parser.add_argument("--learning-rate", type=float, default=0.00025)
    parser.add_argument("--family-loss-weight", type=float, default=0.2)
    parser.add_argument("--outlier-loss-weight", type=float, default=0.1)
    parser.add_argument("--duplicate-distance", type=int, default=8)
    parser.add_argument("--target-precision", type=float, default=0.85)
    args = parser.parse_args()

    seed_all(args.seed)
    args.output.mkdir(parents=True, exist_ok=True)
    device = torch.device("mps" if torch.backends.mps.is_available() else "cpu")
    print(f"device={device}", flush=True)
    known, outliers, split_manifest = collect(args.data, args.seed, args.duplicate_distance)
    supplement = collect_supplement(args.supplement)
    (args.output / "split-manifest.json").write_text(json.dumps(split_manifest, indent=2) + "\n")
    split_counts = {name: len(rows) for name, rows in known.items()}
    print(json.dumps({"known_split_counts": split_counts, "supplement_count": len(supplement)}), flush=True)

    clear = torch.load(args.clear, map_location="cpu", weights_only=True, mmap=True)
    clear_splits = random_split(len(clear["images"]), args.seed + 8101)
    datasets = {
        name: ConcatDataset(
            [
                PhotoDataset(
                    known[name] + (supplement if name == "train" else []),
                    name == "train",
                    args.input_size,
                    args.preprocess,
                ),
                ClearDataset(clear, clear_splits[name], name == "train", args.input_size, args.preprocess),
            ]
        )
        for name in ("train", "val", "test")
    }
    loaders = {
        name: DataLoader(dataset, batch_size=args.batch_size, shuffle=name == "train", num_workers=0)
        for name, dataset in datasets.items()
    }
    outlier_loaders = {
        name: DataLoader(
            PhotoDataset(rows, name == "train", args.input_size, args.preprocess),
            batch_size=args.batch_size,
            shuffle=name == "train",
            num_workers=0,
        )
        for name, rows in outliers.items()
    }

    model = build_model(len(GENERA), pretrained=True, architecture=args.architecture).to(device)
    counts = np.bincount(
        [label for _, label in known["train"] + supplement]
        + [len(GENERA) - 1] * len(clear_splits["train"]),
        minlength=len(GENERA),
    )
    weights = torch.from_numpy(np.sqrt(counts.max() / np.maximum(counts, 1)).astype(np.float32)).to(device)
    train_loss = nn.CrossEntropyLoss(weight=weights, label_smoothing=0.05)
    eval_loss = nn.CrossEntropyLoss()
    optimizer = torch.optim.AdamW(model.parameters(), lr=args.learning_rate, weight_decay=0.0007)
    scheduler = torch.optim.lr_scheduler.CosineAnnealingLR(optimizer, T_max=args.epochs)
    checkpoint_path = args.output / "cloud-genus-net.pt"
    best, patience, history = -1.0, 0, []

    for epoch in range(1, args.epochs + 1):
        model.train()
        losses, family_losses, unknown_losses = [], [], []
        unknown_batches = cycle(outlier_loaders["train"])
        for images, targets, _ in loaders["train"]:
            unknown, _, _ = next(unknown_batches)
            optimizer.zero_grad(set_to_none=True)
            targets = targets.to(device)
            known_logits = model(images.to(device))
            unknown_logits = model(unknown.to(device))
            known_value = train_loss(known_logits, targets)
            family_value = family_loss(known_logits, targets)
            unknown_value = -nn.functional.log_softmax(unknown_logits, dim=1).mean()
            value = known_value + args.family_loss_weight * family_value + args.outlier_loss_weight * unknown_value
            value.backward()
            optimizer.step()
            losses.append(float(known_value.detach().cpu()))
            family_losses.append(float(family_value.detach().cpu()))
            unknown_losses.append(float(unknown_value.detach().cpu()))
        scheduler.step()

        validation = evaluate(model, loaders["val"], eval_loss, device)
        predictions = validation.logits.argmax(axis=1)
        accuracy = float(np.mean(predictions == validation.labels))
        macro_f1 = float(
            f1_score(
                validation.labels,
                predictions,
                labels=list(range(len(GENERA))),
                average="macro",
                zero_division=0,
            )
        )
        row = {
            "epoch": epoch,
            "train_loss": float(np.mean(losses)),
            "family_loss": float(np.mean(family_losses)),
            "outlier_loss": float(np.mean(unknown_losses)),
            "validation_loss": validation.loss,
            "validation_accuracy": accuracy,
            "validation_macro_f1": macro_f1,
        }
        history.append(row)
        print(json.dumps(row), flush=True)
        if macro_f1 > best + 0.002:
            best, patience = macro_f1, 0
            torch.save(
                {
                    "state_dict": model.state_dict(),
                    "classes": GENERA,
                    "architecture": args.architecture,
                    "input_size": args.input_size,
                    "preprocess": args.preprocess,
                    "pipeline_version": 3,
                    "probability_mode": "softmax",
                },
                checkpoint_path,
            )
        else:
            patience += 1
        if patience >= 9:
            break

    saved = torch.load(checkpoint_path, map_location="cpu", weights_only=True)
    model.load_state_dict(saved["state_dict"])
    model.to(device)
    validation = evaluate(model, loaders["val"], eval_loss, device)
    temperature = calibrate(validation.logits, validation.labels)
    policy = choose_policy(softmax(validation.logits, temperature), validation.labels, args.target_precision)
    test = evaluate(model, loaders["test"], eval_loss, device)
    benchmark = {
        "dataset": {
            "name": "CCSN v2",
            "doi": "10.7910/DVN/CADDPD",
            "license": "CC0 1.0",
            "clear_sky_supplement": "jcamier/cloud_sky_vis clear-sky tensors (MIT)",
        },
        "seed": args.seed,
        "architecture": args.architecture,
        "input": {"width": args.input_size, "height": args.input_size, "channels": 3},
        "preprocess": args.preprocess,
        "duplicate_distance": args.duplicate_distance,
        "supplement": {
            "name": "Manually curated Wikimedia Commons genus photographs",
            "count": len(supplement),
            "license": "Per-file license recorded in the curation manifest",
        }
        if supplement
        else None,
        "temperature": temperature,
        "abstention_policy": policy,
        "history": history,
        "reports": {
            "validation": report(validation, temperature, policy),
            "test": report(test, temperature, policy),
            "contrail_holdout": outlier_report(
                model, outlier_loaders["test"], device, temperature, policy
            ),
        },
    }
    (args.output / "benchmark.json").write_text(json.dumps(benchmark, indent=2) + "\n")
    torch.save({**saved, "temperature": temperature, "abstention_policy": policy}, checkpoint_path)
    print(json.dumps({"checkpoint": str(checkpoint_path), "policy": policy}), flush=True)


if __name__ == "__main__":
    main()
