"""Compare one exported Core ML prediction with the calibrated PyTorch model."""

from __future__ import annotations

import argparse
from pathlib import Path

import coremltools as ct
import h5py
import numpy as np
import torch
from PIL import Image

from labels import GENERA
from model import build_model
from train import ROOT


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--artifacts",
        type=Path,
        default=ROOT / ".local/ml-artifacts/cloud-recognition",
    )
    parser.add_argument(
        "--model",
        type=Path,
        default=ROOT / "ios/App/App/Models/CloudGenusClassifier.mlpackage",
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
    with h5py.File(
        ROOT / ".local/ml-data/wmo-rosenberger-2024/img_test.nc", "r"
    ) as handle:
        image = np.asarray(handle["Full_period"][0, 0], dtype=np.uint8)
    tensor = torch.from_numpy(image.copy()).permute(2, 0, 1)
    tensor = tensor.float().div_(255.0).unsqueeze(0)
    with torch.inference_mode():
        expected = torch.sigmoid(
            model(tensor) / float(checkpoint["temperature"])
        ).numpy().ravel()
    coreml_model = ct.models.MLModel(str(args.model))
    actual = np.asarray(
        coreml_model.predict({"image": Image.fromarray(image)})["probabilities"]
    ).ravel()
    maximum_error = float(np.max(np.abs(expected - actual)))
    if maximum_error > 0.01 or expected.argmax() != actual.argmax():
        raise SystemExit(
            f"Core ML parity failed: error={maximum_error:.6f}, "
            f"pytorch_top={expected.argmax()}, coreml_top={actual.argmax()}"
        )
    print(f"Core ML parity OK: max_abs_error={maximum_error:.6f}")


if __name__ == "__main__":
    main()
