"""Verify PyTorch/Core ML parity for the shipped probability ensemble."""

from __future__ import annotations

import argparse
from pathlib import Path

import coremltools as ct
import numpy as np
import torch
from PIL import Image
from torchvision import transforms

from labels import GENERA
from model import build_model
from train_ccsn import transform as v2_transform
from train_v3 import build_transform as v3_transform


def load(artifacts: Path):
    checkpoint = torch.load(
        artifacts / "cloud-genus-net.pt",
        map_location="cpu",
        weights_only=True,
    )
    model = build_model(
        len(GENERA),
        architecture=checkpoint.get("architecture", "mobilenet_v3_small"),
    )
    model.load_state_dict(checkpoint["state_dict"])
    return checkpoint, model.eval()


def tensor_for(image: Image.Image, checkpoint: dict) -> torch.Tensor:
    if checkpoint.get("pipeline_version") == 3:
        image_transform = v3_transform(
            False,
            checkpoint["input_size"],
            checkpoint.get("preprocess", "full_frame"),
        )
    else:
        image_transform = v2_transform(False)
    return image_transform(image).unsqueeze(0)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--base-artifacts", type=Path, required=True)
    parser.add_argument("--base-model", type=Path, required=True)
    parser.add_argument("--candidate-artifacts", type=Path, required=True)
    parser.add_argument("--candidate-model", type=Path, required=True)
    parser.add_argument("--image", type=Path, required=True)
    parser.add_argument("--base-weight", type=float, default=0.4)
    args = parser.parse_args()

    image = Image.open(args.image).convert("RGB")
    base_checkpoint, base = load(args.base_artifacts)
    candidate_checkpoint, candidate = load(args.candidate_artifacts)
    base_tensor = tensor_for(image, base_checkpoint)
    candidate_tensor = tensor_for(image, candidate_checkpoint)
    with torch.inference_mode():
        base_values = torch.softmax(
            base(base_tensor) / base_checkpoint["temperature"], dim=1
        ).numpy()[0]
        candidate_values = torch.softmax(
            candidate(candidate_tensor) / candidate_checkpoint["temperature"], dim=1
        ).numpy()[0]
    torch_values = (
        args.base_weight * base_values
        + (1 - args.base_weight) * candidate_values
    )

    base_coreml = ct.models.MLModel(str(args.base_model))
    candidate_coreml = ct.models.MLModel(str(args.candidate_model))
    base_image = transforms.functional.to_pil_image(base_tensor[0])
    candidate_image = transforms.functional.to_pil_image(candidate_tensor[0])
    base_coreml_values = np.asarray(
        base_coreml.predict({"image": base_image})["probabilities"]
    ).reshape(-1)
    candidate_coreml_values = np.asarray(
        candidate_coreml.predict({"image": candidate_image})["probabilities"]
    ).reshape(-1)
    coreml_values = (
        args.base_weight * base_coreml_values
        + (1 - args.base_weight) * candidate_coreml_values
    )
    difference = float(np.max(np.abs(torch_values - coreml_values)))
    print(
        {
            "max_absolute_error": difference,
            "torch_top": GENERA[int(torch_values.argmax())],
            "coreml_top": GENERA[int(coreml_values.argmax())],
        }
    )
    if difference > 0.01:
        raise SystemExit("Core ML ensemble parity exceeds tolerance")


if __name__ == "__main__":
    main()
