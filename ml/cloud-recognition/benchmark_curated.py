import argparse
import json
from pathlib import Path

import numpy as np
import torch
from torch.utils.data import DataLoader

from labels import GENERA
from model import build_model
from train_ccsn import Evaluation, PhotoDataset, outlier_report, report


ROOT = Path(__file__).resolve().parents[2]
OUTLIERS = [
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


def label(path: Path) -> int:
    for index, genus in sorted(enumerate(GENERA[:-1]), key=lambda row: len(row[1]), reverse=True):
        if path.name.startswith(genus):
            return index
    raise ValueError(path)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--artifacts", type=Path, required=True)
    args = parser.parse_args()
    checkpoint = torch.load(args.artifacts / "cloud-genus-net.pt", map_location="cpu", weights_only=True)
    model = build_model(len(GENERA))
    model.load_state_dict(checkpoint["state_dict"])
    model.eval()
    items = [(path, label(path)) for path in sorted((ROOT / "public/assets/clouds").glob("*.jpg"))]
    logits, labels, paths = [], [], []
    with torch.inference_mode():
        for images, targets, names in DataLoader(PhotoDataset(items, False), batch_size=32):
            logits.append(model(images).numpy())
            labels.append(targets.numpy())
            paths.extend(names)
    evaluation = Evaluation(np.concatenate(logits), np.concatenate(labels), paths, float("nan"))
    atlas = report(evaluation, checkpoint["temperature"], checkpoint["abstention_policy"])
    outliers = outlier_report(model, DataLoader(PhotoDataset([(path, -1) for path in OUTLIERS], False), batch_size=16), torch.device("cpu"), checkpoint["temperature"], checkpoint["abstention_policy"])
    benchmark_path = args.artifacts / "benchmark.json"
    benchmark = json.loads(benchmark_path.read_text())
    benchmark["independent_curated_atlas"] = atlas
    benchmark["project_outlier_sanity"] = outliers
    benchmark_path.write_text(json.dumps(benchmark, indent=2) + "\n")
    print(json.dumps({"atlas": {key: atlas[key] for key in ("top1_accuracy", "top3_accuracy", "selective_precision", "selective_coverage")}, "outlier_abstention": outliers["abstention_rate"]}, indent=2))


if __name__ == "__main__":
    main()
