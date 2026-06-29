"""Check that known out-of-scope visuals trigger the abstention policy."""

from __future__ import annotations

import argparse
import json
from pathlib import Path

import numpy as np
import torch
from PIL import Image, ImageOps

from labels import GENERA
from model import build_model
from train import DEFAULT_OOD_PATHS, ROOT


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--artifacts",
        type=Path,
        default=ROOT / ".local/ml-artifacts/cloud-recognition",
    )
    args = parser.parse_args()
    checkpoint = torch.load(
        args.artifacts / "cloud-genus-net.pt",
        map_location="cpu",
        weights_only=True,
    )
    architecture = checkpoint.get("architecture", "tiny")
    model = build_model(architecture, len(GENERA))
    model.load_state_dict(checkpoint["state_dict"])
    model.eval()
    threshold = float(checkpoint["abstention_policy"]["margin_threshold"])
    rows = []
    for path in DEFAULT_OOD_PATHS:
        image = ImageOps.fit(Image.open(path).convert("RGB"), (100, 64))
        tensor = torch.from_numpy(np.asarray(image).copy())
        tensor = tensor.permute(2, 0, 1).float().div_(255.0).unsqueeze(0)
        with torch.inference_mode():
            probabilities = torch.sigmoid(
                model(tensor) / float(checkpoint["temperature"])
            )[0].numpy()
        genus_probabilities = probabilities[:-1]
        confidence = float(genus_probabilities.max())
        top_order = np.argsort(-genus_probabilities)
        margin = float(
            genus_probabilities[top_order[0]] - genus_probabilities[top_order[1]]
        )
        rows.append(
            {
                "path": str(path.relative_to(ROOT)),
                "top_hypothesis": GENERA[int(genus_probabilities.argmax())],
                "confidence": confidence,
                "margin": margin,
                "abstained": margin < threshold,
            }
        )
    report = {
        "scope": "limited project-owned outlier sanity set",
        "margin_threshold": threshold,
        "sample_count": len(rows),
        "abstention_rate": sum(row["abstained"] for row in rows) / len(rows),
        "samples": rows,
    }
    benchmark_path = args.artifacts / "benchmark.json"
    benchmark = json.loads(benchmark_path.read_text())
    benchmark["out_of_scope_sanity"] = report
    benchmark_path.write_text(
        json.dumps(benchmark, indent=2, ensure_ascii=False) + "\n"
    )
    print(json.dumps(report, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()
