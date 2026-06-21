import argparse
from pathlib import Path

import coremltools as ct
import numpy as np
import torch
from PIL import Image
from torchvision import transforms

from labels import GENERA
from model import build_model
from train_ccsn import transform


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--artifacts", type=Path, required=True)
    parser.add_argument("--model", type=Path, required=True)
    parser.add_argument("--image", type=Path, required=True)
    args = parser.parse_args()
    checkpoint = torch.load(args.artifacts / "cloud-genus-net.pt", map_location="cpu", weights_only=True)
    model = build_model(len(GENERA))
    model.load_state_dict(checkpoint["state_dict"])
    model.eval()
    image = Image.open(args.image).convert("RGB")
    tensor = transform(False)(image).unsqueeze(0)
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
