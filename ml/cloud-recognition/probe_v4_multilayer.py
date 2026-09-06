"""One paired frozen multi-layer representation probe, never calibration/test."""

import argparse
import json
from pathlib import Path
import time

import numpy as np
from sklearn.kernel_ridge import KernelRidge
from sklearn.metrics.pairwise import rbf_kernel
from sklearn.preprocessing import StandardScaler
from threadpoolctl import threadpool_limits
import torch

from dinov2_model import DinoCloudNet
from kernel_model import StableFeatureRBF
from labels import GENERA
from multilayer_dino import FEATURE_COUNT, LAST_FEATURE_COUNT, MultiLayerDino, feature_parity
from probe_v4_bagged_kernel import predict_head
from probe_v4_cross_backbone import checked_features
from probe_v4_masked_pooling import DINO_SHA, verify_development_image
from probe_v4_reliability import ALPHA, reliability, weighted_counts
from probe_v4_robust_loss import BAR, FEATURE_SHA, REFERENCE_SHA, eligible, summarize, validation_populations
from train_v4_dinob import MANIFEST_SHA256, sha256
from train_v4_linear import cached_features
from v4_checkpoint import atomic_save
from v4_data import validate_manifest


def fit_head(train, labels, validation, quality):
    if (train.ndim != 2 or validation.ndim != 2 or not len(validation)
            or train.shape[1] not in (LAST_FEATURE_COUNT, FEATURE_COUNT)
            or train.shape[1] != validation.shape[1] or len(train) != len(labels)
            or not np.isfinite(train).all() or not np.isfinite(validation).all()):
        raise ValueError("Invalid paired kernel inputs")
    weights = weighted_counts(labels, quality)
    scaler = StandardScaler().fit(train)
    x, v = scaler.transform(train), scaler.transform(validation)
    gamma = .25 / train.shape[1]
    estimator = KernelRidge(alpha=ALPHA, kernel="precomputed")
    estimator.fit(rbf_kernel(x, gamma=gamma), np.eye(11)[labels] * 10, sample_weight=weights)
    logits = estimator.predict(rbf_kernel(v, x, gamma=gamma))
    head = StableFeatureRBF(scaler.mean_, scaler.scale_, x, estimator.dual_coef_, gamma).eval()
    return logits, head


def logit_parity(actual, expected):
    if (actual.shape != expected.shape or actual.ndim != 2 or not len(actual)
            or actual.shape[1] != 11 or not np.isfinite(actual).all()
            or not np.isfinite(expected).all()):
        raise ValueError("Invalid paired classification scores")
    error = float(np.abs(actual - expected).max())
    changes = int((actual.argmax(1) != expected.argmax(1)).sum())
    return {"max_logit_error": error, "label_mismatches": changes,
            "passed": error <= .001 and changes == 0}


def retained_quality(reference, rows):
    if (not rows or any(row["split"] != "train" for row in rows)
            or reference["train_ids"] != [row["id"] for row in rows]):
        raise ValueError("Reference training identity mismatch")
    expected = reliability(rows, reference["oof_scores"].numpy())
    actual = reference["quality"].numpy()
    if not np.array_equal(actual, expected):
        raise ValueError("Reference weights disagree with training-only OOF scores")
    return np.repeat(actual, 2)


def main():
    parser = argparse.ArgumentParser()
    for name in ("manifest", "backbone", "features", "reference", "output"):
        parser.add_argument("--" + name, required=True, type=Path)
    args = parser.parse_args()
    if (args.output / "evaluation.json").exists():
        raise ValueError("Preserve the completed multi-layer probe")
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
    reference = torch.load(args.reference, weights_only=True, map_location="cpu")
    quality = retained_quality(reference, rows["train"])
    vy = np.asarray([r["label"] for r in rows["validation"]])
    if (reference["validation_ids"] != [r["id"] for r in rows["validation"]]
            or not np.array_equal(reference["validation_labels"].numpy(), vy)):
        raise ValueError("Reference validation identity mismatch")
    protocol = Path(__file__).resolve().parents[2] / (
        "lore/1-tasks/active/0042_FEATURE_recognition-first-v4/multilayer-probe.md")
    source = Path(__file__).parent
    identity = {"architecture": "frozen_dinov2_small_last_four", "backbone_sha256": DINO_SHA,
                "feature_count": FEATURE_COUNT, "blocks": [8, 9, 10, 11],
                "pooling": "normalized_cls_each_block_plus_last_normalized_patch_mean",
                "preprocess": "center_crop", "crop_fraction": .902, "device": "cpu",
                "dtype": "float32", "batch_size": 4,
                "code_sha256": {name: sha256(source / name) for name in (
                    "probe_v4_multilayer.py", "multilayer_dino.py", "dinov2_model.py",
                    "train_v4.py", "train_v4_linear.py", "train_v4_dinob.py",
                    "probe_v4_masked_pooling.py", "probe_v4_reliability.py",
                    "probe_v4_cross_backbone.py", "probe_v4_robust_loss.py",
                    "probe_v4_bagged_kernel.py", "kernel_model.py", "v4_data.py",
                    "v4_metrics.py", "v4_checkpoint.py")}}
    recipe = {"identity": identity, "manifest_sha256": MANIFEST_SHA256,
              "reference_sha256": REFERENCE_SHA, "original_feature_sha256": FEATURE_SHA,
              "protocol_sha256": sha256(protocol), "torch_version": str(torch.__version__),
              "classes": GENERA, "input_size": 224, "train_views": 2, "validation_views": 1,
              "alpha": ALPHA, "gamma": ".25 / feature_count", "quality": "frozen train-only OOF",
              "normalization": "training-only StandardScaler", "validation_bar": BAR,
              "calibration_evaluated": False, "holdouts_evaluated": False, "release_approved": False}
    args.output.mkdir(parents=True, exist_ok=True)
    recipe_path = args.output / "recipe.json"
    if recipe_path.exists() and json.loads(recipe_path.read_text()) != recipe:
        raise ValueError("Interrupted probe recipe identity changed")
    recipe_path.write_text(json.dumps(recipe, indent=2) + "\n")
    digest = sha256(recipe_path)
    started = time.monotonic()
    dino = DinoCloudNet(11, head="mlp")
    dino.load_state_dict(torch.load(args.backbone, weights_only=True, map_location="cpu")["state_dict"], strict=True)
    model = MultiLayerDino(dino).eval().requires_grad_(False)
    arrays, feature_checks = {}, {}
    for split, views in (("train", 2), ("validation", 1)):
        arrays[split] = cached_features(model, rows[split], 224, torch.device("cpu"),
            args.output / f"{split}-features.pt", MANIFEST_SHA256, views,
            identity=identity, feature_count=FEATURE_COUNT).astype(np.float64)
        feature_checks[split] = feature_parity(torch.from_numpy(arrays[split]),
                                               torch.from_numpy(original[split]))
    y = np.repeat([r["label"] for r in rows["train"]], 2)
    populations, excluded = validation_populations(rows["validation"])
    results, predicted = {}, {}
    for name, values in (("control", {s: a[:, -LAST_FEATURE_COUNT:] for s, a in arrays.items()}),
                         ("last_four", arrays)):
        with threadpool_limits(limits=2):
            logits, head = fit_head(values["train"], y, values["validation"], quality)
        if name == "control":
            control_check = logit_parity(logits, reference["validation_logits"].numpy())
            if not control_check["passed"]:
                raise ValueError(f"Control no longer reproduces reference: {control_check}")
        parity = {str(n): logit_parity(predict_head(head, values["validation"], n), logits)
                  for n in (1, 4, 32, len(vy))}
        predicted[name] = logits.argmax(1)
        scores = {p: summarize(vy[index], predicted[name][index]) for p, index in populations.items()}
        path = args.output / f"{name}-head.pt"
        atomic_save({"recipe_sha256": digest, "state": head.state_dict(),
                     "gamma": .25 / values["train"].shape[1],
                     "train_ids": [r["id"] for r in rows["train"]],
                     "validation_ids": [r["id"] for r in rows["validation"]],
                     "validation_labels": torch.from_numpy(vy),
                     "validation_logits": torch.from_numpy(logits)}, path)
        results[name] = {"populations": scores, "float32_parity": parity,
                         "head_sha256": sha256(path)}
        print(json.dumps({"arm": name, "validation": scores["raw_all"],
                          "float32_parity": parity}), flush=True)
    reference_predicted = reference["validation_logits"].numpy().argmax(1)
    reference_scores = {p: summarize(vy[index], reference_predicted[index]) for p, index in populations.items()}
    report = {"recipe_sha256": digest, "feature_parity": feature_checks, "control_parity": control_check,
              "results": results, "reference": reference_scores, "duplicate_exclusions": excluded,
              "gains": int(((predicted["last_four"] == vy) & (predicted["control"] != vy)).sum()),
              "regressions": int(((predicted["last_four"] != vy) & (predicted["control"] == vy)).sum()),
              "eligible_for_further_evaluation": eligible(results["last_four"]["populations"],
                    results["control"]["populations"], reference_scores) and
                    all(p["passed"] for r in results.values() for p in r["float32_parity"].values()),
              "feature_sha256": {s: sha256(args.output / f"{s}-features.pt") for s in arrays},
              "seconds": round(time.monotonic() - started, 1),
              "calibration_evaluated": False, "holdouts_evaluated": False, "release_approved": False}
    (args.output / "evaluation.json").write_text(json.dumps(report, indent=2) + "\n")
    print(json.dumps({"completed": True, **{k: report[k] for k in (
        "gains", "regressions", "eligible_for_further_evaluation", "seconds")}}), flush=True)


if __name__ == "__main__":
    main()
