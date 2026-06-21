import argparse
import json
import shutil
from pathlib import Path

import coremltools as ct
import torch

from labels import GENERA
from model import build_model


class CalibratedModel(torch.nn.Module):
    def __init__(self, model, temperature: float) -> None:
        super().__init__()
        self.model = model
        self.temperature = temperature

    def forward(self, image):
        return torch.softmax(self.model(image) / self.temperature, dim=1)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--artifacts", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()
    checkpoint = torch.load(args.artifacts / "cloud-genus-net.pt", map_location="cpu", weights_only=True)
    model = build_model(len(GENERA))
    model.load_state_dict(checkpoint["state_dict"])
    calibrated = CalibratedModel(model.eval(), float(checkpoint["temperature"])).eval()
    example = torch.zeros(1, 3, 224, 224)
    traced = torch.jit.trace(calibrated, example)
    converted = ct.convert(
        traced,
        convert_to="mlprogram",
        inputs=[ct.ImageType(name="image", shape=example.shape, scale=1 / 255.0, color_layout=ct.colorlayout.RGB)],
        outputs=[ct.TensorType(name="probabilities")],
        minimum_deployment_target=ct.target.iOS15,
        compute_precision=ct.precision.FLOAT16,
    )
    converted.author = "CHMURNIK / Mieszko Mahboob"
    converted.license = "Training data: CCSN CC0 1.0; clear-sky tensor supplement MIT."
    converted.short_description = "On-device WMO cloud-family and genus hypothesis model."
    converted.version = "2.0"
    metadata = converted.user_defined_metadata
    metadata["classes"] = json.dumps(GENERA)
    metadata["minimum_confidence"] = str(checkpoint["abstention_policy"]["minimum_confidence"])
    metadata["abstention_margin_threshold"] = str(checkpoint["abstention_policy"]["margin_threshold"])
    metadata["abstention_target_precision"] = str(checkpoint["abstention_policy"]["target_precision"])
    metadata["training_data_doi"] = "10.7910/DVN/CADDPD"
    metadata["probability_mode"] = "softmax"
    if args.output.exists():
        shutil.rmtree(args.output)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    converted.save(str(args.output))
    print(args.output)


if __name__ == "__main__":
    main()
