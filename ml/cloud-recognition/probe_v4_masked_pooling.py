"""A single segmentation-guided feature trial, confined to development data."""

import argparse
import json
from pathlib import Path
import time

import numpy as np
from sklearn.metrics import confusion_matrix
from threadpoolctl import threadpool_limits
import torch

from cloud_segmenter import CloudSegmenter
from dinov2_model import DinoCloudNet
from kernel_model import StableFeatureRBF
from labels import GENERA
from probe_v4_bagged_kernel import predict_head
from probe_v4_reliability import GAMMA, ALPHA, fit_weighted
from segmentation_pooling import CONTEXT_FLOOR, SegmentationPooledDino
from skyseg_model import SkySegmentation, WEIGHTS_SHA, PARAM_SHA
from train_v4_dinob import MANIFEST_SHA256, metrics, sha256
from train_v4_linear import cached_features
from v4_checkpoint import atomic_save
from v4_data import image_fingerprint, validate_manifest


DINO_SHA = "d34d1f2d871ebaaed612c6132ee10575016e939f5072a289ff837520fc1cea87"
CLOUD_SHA = "33363342726c34dae0c0ea0f05e3c7ff1f9ed08b1710413db7e14d84b33cffb2"
VALIDATION_BAR = .6545474034701404


def verify_development_image(row):
    if row["split"] not in {"train", "validation"}:
        raise ValueError("Only development images may enter this trial")
    if row["source"] == "imgw-2024-samples":
        matches = sha256(Path(row["path"])) == row.get("artifact_sha256")
    else:
        matches = image_fingerprint(Path(row["path"]))[0] == row["pixel_sha256"]
    if not matches:
        raise ValueError(f"Development photograph changed since manifest freeze: {row['id']}")


def main():
    parser = argparse.ArgumentParser()
    for name in ("manifest", "backbone", "cloud-mask", "sky-model", "output"):
        parser.add_argument("--" + name, type=Path, required=True)
    parser.add_argument("--device", choices=("cpu", "mps"), default="mps")
    args = parser.parse_args()
    if (args.output / "evaluation.json").exists():
        raise ValueError("Preserve the completed trial")
    for path, expected in ((args.manifest, MANIFEST_SHA256), (args.backbone, DINO_SHA),
                           (args.cloud_mask, CLOUD_SHA)):
        if sha256(path) != expected:
            raise ValueError("Frozen manifest or model checksum mismatch")
    manifest = json.loads(args.manifest.read_text())
    validate_manifest(manifest["rows"])
    rows = {split: [row for row in manifest["rows"] if row["split"] == split]
            for split in ("train", "validation")}
    if (len(rows["train"]), len(rows["validation"])) != (2325, 452):
        raise ValueError("Unexpected development split sizes")
    for split_rows in rows.values():
        for row in split_rows:
            verify_development_image(row)
    device = torch.device(args.device)
    if device.type == "mps" and not torch.backends.mps.is_available():
        raise ValueError("Requested MPS backend is unavailable")
    torch.set_num_threads(2)
    torch.manual_seed(7042)
    source = Path(__file__).parent
    identity = {"architecture": "frozen_dinov2_small_masked_pooling", "backbone_sha256": DINO_SHA,
                "cloud_mask_sha256": CLOUD_SHA, "sky_weights_sha256": WEIGHTS_SHA,
                "sky_param_sha256": PARAM_SHA, "device": args.device,
                "pooling": "normalized CLS plus soft cloud-and-sky weighted patch mean",
                "context_floor": CONTEXT_FLOOR, "input_size": 224, "crop_fraction": .902,
                "mask_sizes": {"cloud": 256, "sky": 384}, "patch_grid": 16,
                "interpolation": "bilinear align_corners=False; product at 256 then 16x16 average pool",
                "code_sha256": {name: sha256(source / name) for name in
                    ("probe_v4_masked_pooling.py", "segmentation_pooling.py", "dinov2_model.py",
                     "cloud_segmenter.py", "skyseg_model.py", "train_v4.py", "train_v4_linear.py",
                     "probe_v4_reliability.py", "kernel_model.py", "v4_data.py")}}
    recipe = {"identity": identity, "manifest_sha256": MANIFEST_SHA256, "classes": GENERA,
              "train_views": 2, "validation_views": 1, "alpha": ALPHA, "gamma": GAMMA,
              "fit": "train-only StandardScaler and class-balanced kernel ridge; targets times 10",
              "validation_bar": VALIDATION_BAR, "selection": "at least .01 macro-F1 above best V2 candidate",
              "calibration_evaluated": False, "holdouts_evaluated": False, "release_approved": False}
    args.output.mkdir(parents=True, exist_ok=True)
    recipe_path = args.output / "recipe.json"
    if recipe_path.exists() and json.loads(recipe_path.read_text()) != recipe:
        raise ValueError("Recovery source or recipe identity changed")
    recipe_path.write_text(json.dumps(recipe, indent=2) + "\n")
    recipe_hash = sha256(recipe_path)
    started = time.monotonic()
    dino = DinoCloudNet(11, head="mlp")
    dino.load_state_dict(torch.load(args.backbone, weights_only=True, map_location="cpu")["state_dict"], strict=True)
    cloud = CloudSegmenter()
    cloud.load_state_dict(torch.load(args.cloud_mask, weights_only=True, map_location="cpu")["state_dict"], strict=True)
    model = SegmentationPooledDino(dino, cloud, SkySegmentation(args.sky_model)).eval().requires_grad_(False).to(device)
    arrays = {}
    for split, views in (("train", 2), ("validation", 1)):
        arrays[split] = cached_features(model, rows[split], 224, device, args.output / f"{split}-features.pt",
                                        MANIFEST_SHA256, views, identity=identity).astype(np.float64)
    model.to("cpu")
    if device.type == "mps":
        torch.mps.empty_cache()
    y = np.repeat([row["label"] for row in rows["train"]], 2)
    vy = np.asarray([row["label"] for row in rows["validation"]])
    with threadpool_limits(limits=2):
        expected, scaler, support, coefficients = fit_weighted(arrays["train"], y, arrays["validation"], np.ones(len(y)))
    head = StableFeatureRBF(scaler.mean_, scaler.scale_, support, coefficients, GAMMA).eval()
    parity = {}
    for size in (1, 4, 32, len(vy)):
        actual = predict_head(head, arrays["validation"], size)
        parity[str(size)] = {"max_logit_error": float(np.max(np.abs(expected - actual))),
                             "label_mismatches": int(np.sum(expected.argmax(1) != actual.argmax(1)))}
    predicted = expected.argmax(1)
    score = metrics(vy, predicted)
    atomic_save({"recipe_sha256": recipe_hash, "state": head.state_dict(), "gamma": GAMMA,
                 "validation_ids": [row["id"] for row in rows["validation"]],
                 "validation_logits": torch.from_numpy(expected), "validation_labels": torch.from_numpy(vy)},
                args.output / "head.pt")
    sources = np.asarray([row["source"] for row in rows["validation"]])
    result = {"recipe_sha256": recipe_hash, "validation": score, "parity": parity,
              "confusion": confusion_matrix(vy, predicted, labels=list(range(11))).tolist(),
              "by_source": {name: {"count": int(np.sum(sources == name)),
                                    **metrics(vy[sources == name], predicted[sources == name])}
                            for name in sorted(set(sources))},
              "feature_sha256": {split: sha256(args.output / f"{split}-features.pt") for split in rows},
              "head_sha256": sha256(args.output / "head.pt"), "seconds": round(time.monotonic() - started, 1),
              "eligible_for_further_evaluation": score["macro_f1"] >= VALIDATION_BAR and
                  all(row["max_logit_error"] <= .001 and row["label_mismatches"] == 0 for row in parity.values()),
              "calibration_evaluated": False, "holdouts_evaluated": False, "release_approved": False}
    (args.output / "evaluation.json").write_text(json.dumps(result, indent=2) + "\n")
    print(json.dumps({"completed": True, **result}), flush=True)


if __name__ == "__main__":
    main()
