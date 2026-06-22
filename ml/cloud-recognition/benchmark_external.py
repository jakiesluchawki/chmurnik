"""Evaluate a trained CHMURNIK checkpoint on an external folder dataset."""

from __future__ import annotations

import argparse
import json
from pathlib import Path

import numpy as np
import torch
from sklearn.metrics import classification_report, confusion_matrix
from torch.utils.data import DataLoader

from labels import GENERA
from model import build_model
from train_ccsn import PhotoDataset as V2PhotoDataset
from train_ccsn import softmax
from train_v3 import PhotoDataset as V3PhotoDataset


def collect(root: Path) -> list[tuple[Path, int]]:
    items: list[tuple[Path, int]] = []
    for genus in GENERA[:-1]:
        directory = root / genus
        if not directory.is_dir():
            raise ValueError(f"Missing genus directory: {directory}")
        items.extend((path, GENERA.index(genus)) for path in sorted(directory.glob("*.jpg")))
    if not items:
        raise ValueError(f"No JPEG images found under {root}")
    return items


def external_report(logits: np.ndarray, labels: np.ndarray, temperature: float, policy: dict) -> dict:
    values = softmax(logits, temperature)
    order = np.argsort(-values, axis=1)
    confidence = values[np.arange(len(values)), order[:, 0]]
    margin = confidence - values[np.arange(len(values)), order[:, 1]]
    accepted = (confidence >= policy["minimum_confidence"]) & (margin >= policy["margin_threshold"])
    top1 = order[:, 0] == labels
    top3 = np.array([labels[index] in order[index, :3] for index in range(len(order))])
    cloud_labels = list(range(len(GENERA) - 1))
    details = classification_report(
        labels,
        order[:, 0],
        labels=cloud_labels,
        target_names=GENERA[:-1],
        zero_division=0,
        output_dict=True,
    )
    return {
        "sample_count": len(labels),
        "top1_accuracy": float(top1.mean()),
        "top3_accuracy": float(top3.mean()),
        "macro_f1": float(details["macro avg"]["f1-score"]),
        "selective_precision": float(top1[accepted].mean()) if accepted.any() else None,
        "selective_coverage": float(accepted.mean()),
        "accepted_count": int(accepted.sum()),
        "confusion_matrix": confusion_matrix(labels, order[:, 0], labels=cloud_labels).tolist(),
        "classes": {name: details[name] for name in GENERA[:-1]},
    }


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--checkpoint", type=Path, required=True)
    parser.add_argument("--data", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--name", default="external")
    parser.add_argument("--license", default="unknown")
    parser.add_argument("--source", default="unknown")
    args = parser.parse_args()

    checkpoint = torch.load(args.checkpoint, map_location="cpu", weights_only=True)
    model = build_model(len(GENERA), architecture=checkpoint.get("architecture", "mobilenet_v3_small"))
    model.load_state_dict(checkpoint["state_dict"])
    model.eval()

    items = collect(args.data)
    logits: list[np.ndarray] = []
    labels: list[np.ndarray] = []
    paths: list[str] = []
    if checkpoint.get("pipeline_version") == 3:
        dataset = V3PhotoDataset(
            items,
            False,
            checkpoint["input_size"],
            checkpoint.get("preprocess", "full_frame"),
        )
    else:
        dataset = V2PhotoDataset(items, False)
    with torch.inference_mode():
        for images, targets, names in DataLoader(dataset, batch_size=32):
            logits.append(model(images).numpy())
            labels.append(targets.numpy())
            paths.extend(names)
    logits_value = np.concatenate(logits)
    labels_value = np.concatenate(labels)
    result = {
        "dataset": {"name": args.name, "license": args.license, "source": args.source},
        "checkpoint": str(args.checkpoint),
        "report": external_report(
            logits_value,
            labels_value,
            checkpoint["temperature"],
            checkpoint["abstention_policy"],
        ),
    }
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(result, indent=2) + "\n")
    summary = result["report"]
    print(
        json.dumps(
            {
                key: summary[key]
                for key in (
                    "sample_count",
                    "top1_accuracy",
                    "top3_accuracy",
                    "macro_f1",
                    "selective_precision",
                    "selective_coverage",
                )
            },
            indent=2,
        )
    )


if __name__ == "__main__":
    main()
