"""Fixed 336px versus retained 224px RBF trial; development data only."""

import argparse
from collections import defaultdict
import json
from pathlib import Path
import time

import numpy as np
from PIL import Image, ImageOps
from threadpoolctl import threadpool_limits
import torch

from dinov2_model import DINOV2_REVISION, DinoCloudNet
from labels import GENERA
from probe_v4_bagged_kernel import predict_head
from probe_v4_cross_backbone import checked_features
from probe_v4_masked_pooling import DINO_SHA, verify_development_image
from probe_v4_multilayer import fit_head, logit_parity, retained_quality
from probe_v4_reliability import ALPHA, GAMMA
from probe_v4_robust_loss import BAR, FEATURE_SHA, REFERENCE_SHA, eligible, summarize, validation_populations
from train_v4_dinob import MANIFEST_SHA256, sha256
from train_v4_linear import cached_features, validate_feature_cache
from v4_checkpoint import atomic_save
from v4_data import validate_manifest


SIZE = 336


def geometry_audit(rows):
    if (not rows or any(r["split"] not in {"train", "validation"} for r in rows)
            or len({r["id"] for r in rows}) != len(rows)):
        raise ValueError("Geometry audit accepts unique-ID development rows only")
    records, groups = [], defaultdict(list)
    for row in rows:
        with Image.open(row["path"]) as image:
            width, height = ImageOps.exif_transpose(image).size
        record = {"id": row["id"], "split": row["split"], "source": row["source"],
                  "width": width, "height": height}
        records.append(record)
        groups[row["split"], row["source"]].append(min(width, height))
    return {"records": records, "summary": [{"split": split, "source": source,
        "count": len(sizes), "short_side_quantiles": np.percentile(sizes, [0, 25, 50, 75, 100]).tolist(),
        "without_upsampling": {str(size): int(sum(s >= round(size / .902) for s in sizes))
                               for size in (224, 336, 518)}}
        for (split, source), sizes in sorted(groups.items())]}


def checked_resolution_cache(saved, rows, identity, views):
    if (not rows or {r["split"] for r in rows} not in ({"train"}, {"validation"})
            or len({r["id"] for r in rows}) != len(rows)
            or views != (2 if rows[0]["split"] == "train" else 1)):
        raise ValueError("Resolution cache requires the correct development split and views")
    expected = {"manifest_sha256": MANIFEST_SHA256, "size": SIZE, "views": views,
                "revision": DINOV2_REVISION, "identity": identity}
    completed = validate_feature_cache(saved, expected, [r["id"] for r in rows], views, 768)
    if completed != len(rows):
        raise ValueError("Resolution features are incomplete")
    return saved["features"].numpy().astype(np.float64)


def main():
    parser = argparse.ArgumentParser()
    for name in ("manifest", "backbone", "features", "reference", "output"):
        parser.add_argument("--" + name, required=True, type=Path)
    args = parser.parse_args()
    if (args.output / "evaluation.json").exists():
        raise ValueError("Preserve the completed resolution experiment")
    for path, expected in ((args.manifest, MANIFEST_SHA256), (args.backbone, DINO_SHA),
                           (args.reference, REFERENCE_SHA)):
        if sha256(path) != expected:
            raise ValueError("Pinned input hash mismatch")
    manifest = json.loads(args.manifest.read_text())
    validate_manifest(manifest["rows"])
    rows = {s: [r for r in manifest["rows"] if r["split"] == s] for s in FEATURE_SHA}
    if (len(rows["train"]), len(rows["validation"])) != (2325, 452):
        raise ValueError("Development split sizes changed")
    torch.set_num_threads(2)
    torch.manual_seed(7042)
    original = {}
    for split, views in (("train", 2), ("validation", 1)):
        path = args.features / f"{split}-features.pt"
        if sha256(path) != FEATURE_SHA[split]:
            raise ValueError("Historical feature cache changed")
        original[split] = checked_features(torch.load(path, weights_only=True, map_location="cpu"),
                                           rows[split], MANIFEST_SHA256, views, "small")
        for row in rows[split]:
            verify_development_image(row)
    audit = geometry_audit(rows["train"] + rows["validation"])
    reference = torch.load(args.reference, weights_only=True, map_location="cpu")
    quality = retained_quality(reference, rows["train"])
    vy = np.asarray([r["label"] for r in rows["validation"]])
    if (reference["validation_ids"] != [r["id"] for r in rows["validation"]]
            or not np.array_equal(reference["validation_labels"].numpy(), vy)):
        raise ValueError("Reference validation identity mismatch")
    source = Path(__file__).parent
    protocol = source.resolve().parents[1] / (
        "lore/1-tasks/active/0042_FEATURE_recognition-first-v4/resolution-probe.md")
    identity = {"architecture": "frozen_dinov2_small_resolution_336", "backbone_sha256": DINO_SHA,
                "feature_count": 768, "pooling": "final_normalized_cls_plus_mean_patch",
                "preprocess": "center_crop", "crop_fraction": .902, "device": "cpu",
                "dtype": "float32", "batch_size": 4,
                "code_sha256": {name: sha256(source / name) for name in (
                    Path(__file__).name, "dinov2_model.py", "train_v4.py", "train_v4_linear.py",
                    "train_v4_dinob.py", "probe_v4_masked_pooling.py", "probe_v4_reliability.py",
                    "probe_v4_multilayer.py", "probe_v4_cross_backbone.py", "probe_v4_robust_loss.py",
                    "probe_v4_bagged_kernel.py", "kernel_model.py", "v4_data.py", "v4_metrics.py",
                    "v4_checkpoint.py")}}
    recipe = {"identity": identity, "manifest_sha256": MANIFEST_SHA256,
              "reference_sha256": REFERENCE_SHA, "original_feature_sha256": FEATURE_SHA,
              "protocol_sha256": sha256(protocol), "torch_version": str(torch.__version__),
              "classes": GENERA, "input_size": SIZE, "control_input_size": 224,
              "train_views": 2, "validation_views": 1, "alpha": ALPHA, "gamma": GAMMA,
              "quality": "frozen train-only OOF", "normalization": "training-only StandardScaler",
              "validation_bar": BAR, "calibration_evaluated": False,
              "holdouts_evaluated": False, "release_approved": False}
    args.output.mkdir(parents=True, exist_ok=True)
    recipe_path = args.output / "recipe.json"
    if recipe_path.exists() and json.loads(recipe_path.read_text()) != recipe:
        raise ValueError("Interrupted resolution recipe identity changed")
    recipe_path.write_text(json.dumps(recipe, indent=2) + "\n")
    (args.output / "geometry.json").write_text(json.dumps(audit, indent=2) + "\n")
    digest = sha256(recipe_path)
    started = time.monotonic()
    dino = DinoCloudNet(11, head="mlp").eval().requires_grad_(False)
    dino.load_state_dict(torch.load(args.backbone, weights_only=True, map_location="cpu")["state_dict"], strict=True)
    arrays = {}
    for split, views in (("train", 2), ("validation", 1)):
        path = args.output / f"{split}-features.pt"
        cached_features(dino, rows[split], SIZE, torch.device("cpu"), path,
                        MANIFEST_SHA256, views, identity=identity)
        arrays[split] = checked_resolution_cache(torch.load(path, weights_only=True, map_location="cpu"),
                                                 rows[split], identity, views)
    extraction_seconds = round(time.monotonic() - started, 1)
    y = np.repeat([r["label"] for r in rows["train"]], 2)
    populations, excluded = validation_populations(rows["validation"])
    results, predictions = {}, {}
    for name, values in (("control", original), ("resolution_336", arrays)):
        with threadpool_limits(limits=2):
            logits, head = fit_head(values["train"], y, values["validation"], quality)
        if name == "control":
            control_check = logit_parity(logits, reference["validation_logits"].numpy())
            if not control_check["passed"] or control_check["max_logit_error"] > 1e-6:
                raise ValueError("Control does not reproduce the frozen reference")
        parity = {str(n): logit_parity(predict_head(head, values["validation"], n), logits)
                  for n in (1, 4, 32, len(vy))}
        predictions[name] = logits.argmax(1)
        scores = {p: summarize(vy[i], predictions[name][i]) for p, i in populations.items()}
        path = args.output / f"{name}-head.pt"
        atomic_save({"recipe_sha256": digest, "state": head.state_dict(), "gamma": GAMMA,
                     "train_ids": [r["id"] for r in rows["train"]],
                     "validation_ids": [r["id"] for r in rows["validation"]],
                     "validation_labels": torch.from_numpy(vy),
                     "validation_logits": torch.from_numpy(logits)}, path)
        results[name] = {"populations": scores, "float32_parity": parity, "head_sha256": sha256(path)}
        print(json.dumps({"arm": name, "validation": scores["raw_all"], "parity": parity}), flush=True)
    candidate, control = predictions["resolution_336"], predictions["control"]
    report = {"recipe_sha256": digest, "control_parity": control_check, "results": results,
              "duplicate_exclusions": excluded,
              "gains": int(((candidate == vy) & (control != vy)).sum()),
              "regressions": int(((candidate != vy) & (control == vy)).sum()),
              "eligible_for_further_evaluation": eligible(results["resolution_336"]["populations"],
                    results["control"]["populations"], results["control"]["populations"]) and
                    all(p["passed"] for r in results.values() for p in r["float32_parity"].values()),
              "feature_sha256": {s: sha256(args.output / f"{s}-features.pt") for s in arrays},
              "geometry_sha256": sha256(args.output / "geometry.json"),
              "extraction_seconds": extraction_seconds, "seconds": round(time.monotonic() - started, 1),
              "calibration_evaluated": False, "holdouts_evaluated": False, "release_approved": False}
    (args.output / "evaluation.json").write_text(json.dumps(report, indent=2) + "\n")
    print(json.dumps({"completed": True, **{k: report[k] for k in (
        "gains", "regressions", "eligible_for_further_evaluation", "seconds")}}), flush=True)


if __name__ == "__main__":
    main()
