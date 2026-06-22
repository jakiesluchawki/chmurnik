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


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--artifacts", type=Path, required=True)
    parser.add_argument("--model", type=Path, required=True)
    parser.add_argument("--image", type=Path, required=True)
    args = parser.parse_args()
    checkpoint = torch.load(args.artifacts / "cloud-genus-net.pt", map_location="cpu", weights_only=True)
    model = build_model(
        len(GENERA),
        architecture=checkpoint.get("architecture", "mobilenet_v3_small"),
    )
    model.load_state_dict(checkpoint["state_dict"])
    model.eval()
    image = Image.open(args.image).convert("RGB")
    if checkpoint.get("pipeline_version") == 3:
        image_transform = v3_transform(
            False,
            checkpoint["input_size"],
            checkpoint.get("preprocess", "full_frame"),
        )
    else:
        image_transform = v2_transform(False)
    tensor = image_transform(image).unsqueeze(0)
    with torch.inference_mode():
        torch_values = torch.softmax(model(tensor) / checkpoint["temperature"], dim=1).numpy()[0]
    coreml = ct.models.MLModel(str(args.model))
    coreml_image = transforms.functional.to_pil_image(tensor[0])
    coreml_values = np.asarray(
        coreml.predict({"image": coreml_image})["probabilities"]
    ).reshape(-1)
    difference = float(np.max(np.abs(torch_values - coreml_values)))
    print({"max_absolute_error": difference, "top": GENERA[int(coreml_values.argmax())]})
    if difference > 0.01:
        raise SystemExit("Core ML parity exceeds tolerance")


if __name__ == "__main__":
    main()
