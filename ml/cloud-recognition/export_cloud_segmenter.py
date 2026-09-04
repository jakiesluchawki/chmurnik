"""Research-only Core ML export with source binding and real pixel parity."""

import argparse
import json
from pathlib import Path
import time

import coremltools as ct
import numpy as np
from PIL import Image, ImageOps
import torch
from torchvision.transforms.functional import to_tensor

from cloud_segmenter import CloudSegmenter
from dlr_segmentation_data import load_manifest, read_pair, sha256
from evaluate_cloud_segmenter import checked_candidate


class Probabilities(torch.nn.Module):
    def __init__(self, model):
        super().__init__()
        self.model = model

    def forward(self, image):
        return self.model(image).sigmoid()


@torch.inference_mode()
def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--manifest", type=Path, required=True)
    parser.add_argument("--checkpoint", type=Path, required=True)
    parser.add_argument("--evaluation", type=Path, required=True)
    parser.add_argument("--atlas-manifest", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()
    if args.output.exists():
        raise ValueError("Preserve previous Core ML export")
    manifest = load_manifest(args.manifest)
    saved = checked_candidate(args.checkpoint, args.manifest)
    evaluation = json.loads(args.evaluation.read_text())
    if (evaluation["protocol"]["checkpoint_sha256"] != sha256(args.checkpoint)
            or evaluation["protocol"]["manifest_sha256"] != sha256(args.manifest)
            or evaluation["validation"] != saved["validation"]["summary"]):
        raise ValueError("Evaluation belongs to different weights/data")
    validation, test = evaluation["validation"], evaluation["test"]["model"]["summary"]
    baseline = evaluation["test"]["rgb_baseline"]["summary"]
    if not (validation["cloud_iou"] >= .7 and test["cloud_iou"] >= .7
            and validation["precision"] >= .8 and test["precision"] >= .8
            and test["cloud_iou"] > baseline["cloud_iou"]):
        raise ValueError("Declared segmentation research gates failed")
    args.output.mkdir(parents=True)
    torch.set_num_threads(2)
    net = CloudSegmenter().eval()
    net.load_state_dict(saved["state_dict"], strict=True)
    model = Probabilities(net).eval()
    example = torch.zeros(1, 3, 256, 256)
    traced = torch.jit.trace(model, example)
    converted = ct.convert(traced, convert_to="mlprogram", minimum_deployment_target=ct.target.iOS15,
                           inputs=[ct.ImageType(name="image", shape=example.shape, scale=1 / 255., color_layout=ct.colorlayout.RGB)],
                           outputs=[ct.TensorType(name="cloud")], compute_precision=ct.precision.FLOAT32,
                           skip_model_load=True)
    converted.author = "CHMURNIK"
    converted.version = "4.0-research"
    converted.short_description = "Experimental cloud/clear-sky mask. Not cloud genera, height, instances or weather safety."
    converted.license = "Training data: DLR/CIEMAT Almeria v1.0.1, CC BY 4.0, doi:10.5281/zenodo.16647156; torchvision encoder code BSD-3-Clause."
    converted.user_defined_metadata.update({"checkpoint_sha256": sha256(args.checkpoint),
        "manifest_sha256": sha256(args.manifest), "evaluation_sha256": sha256(args.evaluation),
        "release_approved": "false", "preprocess": "oriented RGB, whole image scaleFill 256; ImageNet normalization inside graph",
        "training_attribution": "Yann Fabel, David Magiera, Bijan Nouri, Niklas Blum, Luis F. Zarzalejo; DLR/CIEMAT"})
    path = args.output / "CloudMaskV4Research.mlpackage"
    converted.save(str(path))
    began = time.monotonic()
    native = ct.models.MLModel(str(path), compute_units=ct.ComputeUnit.ALL)
    load_seconds = time.monotonic() - began
    inputs = []
    for row in manifest["rows"]:
        if row["split"] == "test":
            image, _ = read_pair(args.manifest.parent, row)
            inputs.append((row["id"], image))
    atlas = json.loads(args.atlas_manifest.read_text())
    for row in atlas["rows"]:
        if row["source"] == "atlas":
            with Image.open(row["path"]) as original:
                image = ImageOps.exif_transpose(original).convert("RGB").resize((256, 256), Image.Resampling.BILINEAR)
                inputs.append((row["id"], image))
    reports = []
    for identifier, image in inputs:
        expected = model(to_tensor(image)[None])[0, 0].numpy()
        started = time.monotonic()
        actual = np.asarray(native.predict({"image": image})["cloud"]).reshape(256, 256)
        reports.append({"id": identifier, "max_probability_error": float(np.abs(expected - actual).max()),
                        "binary_agreement": float(((expected >= .5) == (actual >= .5)).mean()),
                        "seconds": time.monotonic() - started})
    passed = bool(reports) and all(row["max_probability_error"] <= .01 and row["binary_agreement"] >= .995 for row in reports)
    report = {"passed": passed, "release_approved": False, "precision": "float32", "compute_units": "ALL",
              "scope": "identical resized pixels only; original-photo native preprocessing remains unverified",
              "checkpoint_sha256": sha256(args.checkpoint), "manifest_sha256": sha256(args.manifest),
              "evaluation_sha256": sha256(args.evaluation), "export_code_sha256": sha256(__file__),
              "package_files": {str(file.relative_to(path)): sha256(file) for file in sorted(path.rglob("*")) if file.is_file()},
              "load_seconds": load_seconds, "rows": reports}
    (args.output / "parity.json").write_text(json.dumps(report, indent=2, allow_nan=False) + "\n")
    print(json.dumps({"passed": passed, "images": len(reports), "load_seconds": load_seconds,
                      "max_probability_error": max(row["max_probability_error"] for row in reports),
                      "min_binary_agreement": min(row["binary_agreement"] for row in reports),
                      "warm_median_seconds": float(np.median([row["seconds"] for row in reports[1:]])),
                      "package_bytes": sum(file.stat().st_size for file in path.rglob("*") if file.is_file())}, indent=2), flush=True)
    if not passed:
        raise ValueError("Core ML probability parity failed")


if __name__ == "__main__":
    main()
