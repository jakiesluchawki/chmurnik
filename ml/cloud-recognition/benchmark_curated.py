"""Benchmark a trained model on CHMURNIK's independent Wikimedia atlas photos."""

from __future__ import annotations

import argparse
import json
from pathlib import Path

import numpy as np
import torch
from PIL import Image
from torch.utils.data import DataLoader

from labels import GENERA
from model import build_model
from train_ccsn import (
    ROOT,
    Evaluation,
    ImageItemsDataset,
    metric_report,
    outlier_report,
)


ATLAS = ROOT / "public/assets/clouds"
PROJECT_OUTLIERS = [
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


def atlas_label(path: Path) -> int:
    for index, genus in sorted(
        enumerate(GENERA[:-1]), key=lambda pair: len(pair[1]), reverse=True
    ):
        if path.name.startswith(genus):
            return index
    raise ValueError(f"Cannot infer atlas label from {path.name}")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--artifacts",
        type=Path,
        default=ROOT / ".local/ml-artifacts/cloud-recognition-ccsn",
    )
    args = parser.parse_args()
    checkpoint = torch.load(
        args.artifacts / "cloud-genus-net.pt", map_location="cpu", weights_only=True
    )
    model = build_model(checkpoint["architecture"], len(GENERA))
    model.load_state_dict(checkpoint["state_dict"])
    model.eval()

    atlas_items = [(path, atlas_label(path)) for path in sorted(ATLAS.glob("*.jpg"))]
    atlas_loader = DataLoader(
        ImageItemsDataset(atlas_items, training=False), batch_size=32, shuffle=False
    )
    logits: list[np.ndarray] = []
    labels: list[np.ndarray] = []
    paths: list[str] = []
    with torch.inference_mode():
        for images, batch_labels, batch_paths in atlas_loader:
            logits.append(model(images).numpy())
            labels.append(batch_labels.numpy())
            paths.extend(batch_paths)
    evaluation = Evaluation(
        logits=np.concatenate(logits),
        labels=np.concatenate(labels),
        paths=paths,
        loss=float("nan"),
    )
    policy = checkpoint["abstention_policy"]
    temperature = float(checkpoint["temperature"])
    atlas_report = metric_report(evaluation, temperature, policy)

    outlier_loader = DataLoader(
        ImageItemsDataset([(path, -1) for path in PROJECT_OUTLIERS], training=False),
        batch_size=16,
        shuffle=False,
    )
    project_report = outlier_report(
        model, outlier_loader, torch.device("cpu"), temperature, policy
    )
    benchmark_path = args.artifacts / "benchmark.json"
    benchmark = json.loads(benchmark_path.read_text())
    benchmark["independent_curated_atlas"] = atlas_report
    benchmark["project_outlier_sanity"] = project_report
    benchmark_path.write_text(
        json.dumps(benchmark, indent=2, ensure_ascii=False) + "\n"
    )
    print(
        json.dumps(
            {
                "atlas": {
                    key: atlas_report[key]
                    for key in (
                        "sample_count",
                        "top1_accuracy",
                        "top3_accuracy",
                        "selective_precision",
                        "selective_coverage",
                    )
                },
                "project_outlier_abstention": project_report["abstention_rate"],
            },
            indent=2,
        )
    )


if __name__ == "__main__":
    main()
