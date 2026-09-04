"""Export the reviewed sky/foreground model and verify Apple probability parity."""

import argparse
import json
from pathlib import Path
import time

import coremltools as ct
import numpy as np
from PIL import Image, ImageOps
import torch
from torchvision.transforms.functional import to_tensor

from skyseg_model import PARAM_SHA, REVISION, WEIGHTS_SHA, SkySegmentation


@torch.inference_mode()
def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--source", type=Path, required=True)
    parser.add_argument("--manifest", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--precision", choices=["fp16", "fp32"], default="fp16")
    args = parser.parse_args()
    if args.output.exists():
        raise ValueError("Preserve the previous sky export")
    args.output.mkdir(parents=True)
    torch.set_num_threads(2)
    model = SkySegmentation(args.source).eval()
    example = torch.zeros(1, 3, 384, 384)
    traced = torch.jit.trace(model, example)
    converted = ct.convert(traced, convert_to="mlprogram",
                           inputs=[ct.ImageType(name="image", shape=example.shape, scale=1 / 255., color_layout=ct.colorlayout.RGB)],
                           outputs=[ct.TensorType(name="sky")], minimum_deployment_target=ct.target.iOS15,
                           compute_precision=ct.precision.FLOAT16 if args.precision == "fp16" else ct.precision.FLOAT32,
                           skip_model_load=True)
    converted.author = "xiongzhu666; Apple conversion by CHMURNIK"
    converted.license = (args.source / "LICENSE").read_text()
    converted.short_description = "Sky versus foreground mask. Not a cloud-type or cloud-instance classifier."
    converted.version = "1.0"
    converted.user_defined_metadata.update({"source_revision": REVISION, "source_param_sha256": PARAM_SHA,
                                             "source_weights_sha256": WEIGHTS_SHA,
                                             "preprocess": "oriented RGB, entire image scaleFill 384; ImageNet normalization in graph"})
    path = args.output / "SkySegmentation.mlpackage"
    converted.save(str(path))
    started = time.monotonic()
    native = ct.models.MLModel(str(path), compute_units=ct.ComputeUnit.ALL)
    load_seconds = time.monotonic() - started
    rows = [row for row in json.loads(args.manifest.read_text())["rows"] if row["source"] == "atlas"]
    reports = []
    for row in rows:
        with Image.open(row["path"]) as original:
            image = ImageOps.exif_transpose(original).convert("RGB").resize((384, 384), Image.Resampling.BILINEAR)
        expected = model(to_tensor(image).unsqueeze(0))[0, 0].numpy()
        started = time.monotonic()
        actual = np.asarray(native.predict({"image": image})["sky"]).reshape(384, 384)
        reports.append({"id": row["id"], "max_absolute_error": float(np.max(np.abs(expected - actual))),
                        "binary_mask_agreement": float(np.mean((expected >= .5) == (actual >= .5))),
                        "native_seconds": time.monotonic() - started})
        print(json.dumps(reports[-1]), flush=True)
    passed = all(row["max_absolute_error"] <= .01 and row["binary_mask_agreement"] >= .995 for row in reports)
    result = {"passed": passed, "precision": args.precision, "scope": "identical resized RGB pixels; not segmentation accuracy",
              "model_load_seconds": load_seconds, "rows": reports}
    (args.output / "parity.json").write_text(json.dumps(result, indent=2) + "\n")
    if not passed:
        raise ValueError("Core ML sky-mask parity failed")


if __name__ == "__main__":
    main()
