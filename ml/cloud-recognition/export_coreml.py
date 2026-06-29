"""Export the calibrated CHMURNIK classifier as a Core ML package."""

from __future__ import annotations

import argparse
import json
from pathlib import Path

import coremltools as ct
import torch

from labels import GENERA
from model import build_model


ROOT = Path(__file__).resolve().parents[2]
DEFAULT_ARTIFACTS = ROOT / ".local/ml-artifacts/cloud-recognition"
DEFAULT_OUTPUT = ROOT / "ios/App/App/Models/CloudGenusClassifier.mlpackage"


class CalibratedModel(torch.nn.Module):
    def __init__(
        self, model: torch.nn.Module, temperature: float, probability_mode: str
    ) -> None:
        super().__init__()
        self.model = model
        self.temperature = temperature
        self.probability_mode = probability_mode

    def forward(self, image: torch.Tensor) -> torch.Tensor:
        logits = self.model(image) / self.temperature
        if self.probability_mode == "softmax":
            return torch.softmax(logits, dim=1)
        return torch.sigmoid(logits)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--artifacts", type=Path, default=DEFAULT_ARTIFACTS)
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    args = parser.parse_args()

    checkpoint = torch.load(
        args.artifacts / "cloud-genus-net.pt", map_location="cpu", weights_only=True
    )
    architecture = checkpoint.get("architecture", "tiny")
    classes = checkpoint.get("classes", GENERA)
    input_size = int(checkpoint.get("input_size", 64))
    model = build_model(architecture, len(classes))
    model.load_state_dict(checkpoint["state_dict"])
    model.eval()
    calibrated = CalibratedModel(
        model,
        float(checkpoint["temperature"]),
        checkpoint.get("probability_mode", "sigmoid"),
    ).eval()
    input_width = input_size if "input_size" in checkpoint else 100
    example = torch.zeros(1, 3, input_size, input_width)
    traced = torch.jit.trace(calibrated, example)

    converted = ct.convert(
        traced,
        convert_to="mlprogram",
        inputs=[
            ct.ImageType(
                name="image",
                shape=example.shape,
                scale=1 / 255.0,
                color_layout=ct.colorlayout.RGB,
            )
        ],
        outputs=[ct.TensorType(name="probabilities")],
        minimum_deployment_target=ct.target.iOS17,
        compute_precision=ct.precision.FLOAT32,
    )
    converted.author = "CHMURNIK / Mieszko Mahboob"
    converted.license = (
        "Model code: project license. Training data: CCSN CC0 1.0; "
        "clear-sky tensor supplement MIT."
    )
    converted.short_description = "On-device WMO cloud-genus hypothesis model."
    converted.version = "1.0"
    converted.user_defined_metadata["classes"] = json.dumps(classes)
    converted.user_defined_metadata["minimum_confidence"] = str(
        checkpoint["abstention_policy"].get("minimum_confidence", 0.0)
    )
    converted.user_defined_metadata["abstention_margin_threshold"] = str(
        checkpoint["abstention_policy"]["margin_threshold"]
    )
    converted.user_defined_metadata["abstention_target_precision"] = str(
        checkpoint["abstention_policy"]["target_precision"]
    )
    converted.user_defined_metadata["training_data_doi"] = "10.7910/DVN/CADDPD"
    converted.user_defined_metadata["architecture"] = architecture
    converted.user_defined_metadata["probability_mode"] = checkpoint.get(
        "probability_mode", "sigmoid"
    )

    args.output.parent.mkdir(parents=True, exist_ok=True)
    if args.output.exists():
        import shutil

        shutil.rmtree(args.output)
    converted.save(str(args.output))
    print(args.output)


if __name__ == "__main__":
    main()
