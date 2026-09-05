"""Fixed kernel comparison using aligned, frozen Small and Base development features."""

import argparse
import json
from pathlib import Path
import time

import numpy as np
from sklearn.kernel_ridge import KernelRidge
from sklearn.metrics import confusion_matrix
from sklearn.metrics.pairwise import rbf_kernel
from sklearn.preprocessing import StandardScaler
from threadpoolctl import threadpool_limits
import torch

from dinov2_model import DINOV2_REVISION
from kernel_model import StableFeatureRBF
from labels import GENERA
from train_v4_dinob import MANIFEST_SHA256, VALIDATION_BAR, WEIGHT_SHA256, metrics, sha256
from train_v4_linear import validate_feature_cache
from v4_checkpoint import atomic_save
from v4_data import validate_manifest


GAMMA = .25
ALPHA = .1


def checked_features(cache, rows, digest, views, backbone, identity=None):
    if not rows or {row["split"] for row in rows} not in ({"train"}, {"validation"}):
        raise ValueError("Only a single development split is permitted")
    if len({row["id"] for row in rows}) != len(rows):
        raise ValueError("Repeated image IDs")
    if backbone == "small":
        size, width = 224, 768
        if identity is not None:
            raise ValueError("The historical Small cache has no identity field")
    elif backbone == "base":
        size, width = 336, 1536
        required = {"architecture": "dinov2_vitb14", "weight_sha256": WEIGHT_SHA256,
                    "feature_count": width, "pooling": "final_normalized_cls_plus_mean_patch",
                    "crop_fraction": .902, "preprocess": "center_crop"}
        if not isinstance(identity, dict) or any(identity.get(key) != value for key, value in required.items()):
            raise ValueError("Unexpected Base feature identity")
    else:
        raise ValueError("Unsupported backbone")
    expected = {"manifest_sha256": digest, "size": size, "views": views,
                "revision": DINOV2_REVISION, "identity": identity}
    completed = validate_feature_cache(cache, expected, [row["id"] for row in rows], views, width)
    if completed != len(rows):
        raise ValueError("Incomplete feature cache")
    return cache["features"].numpy().astype(np.float64)


def normalized_groups(training, validation):
    if not training or len(training) != len(validation):
        raise ValueError("Feature groups must pair")
    means, scales = [], []
    for x, v in zip(training, validation):
        if (x.ndim != 2 or v.ndim != 2 or x.shape[1] != v.shape[1] or x.shape[1] == 0
                or len(x) != len(training[0]) or len(v) != len(validation[0])
                or not np.isfinite(x).all() or not np.isfinite(v).all()):
            raise ValueError("Invalid paired feature groups")
        scaler = StandardScaler().fit(x)
        means.append(scaler.mean_)
        # Each backbone contributes equally, regardless of embedding dimension.
        scales.append(scaler.scale_ * np.sqrt(x.shape[1] * len(training)))
    mean, scale = np.concatenate(means), np.concatenate(scales)
    x, v = np.concatenate(training, axis=1), np.concatenate(validation, axis=1)
    return mean, scale, x, v


def fit_trial(training, labels, validation, targets):
    mean, scale, raw_x, raw_v = normalized_groups(training, validation)
    x, v = (raw_x - mean) / scale, (raw_v - mean) / scale
    counts = np.bincount(labels, minlength=len(GENERA))
    if counts.shape != (len(GENERA),) or (counts == 0).any():
        raise ValueError("Missing or unexpected training class")
    estimator = KernelRidge(alpha=ALPHA, kernel="precomputed")
    estimator.fit(rbf_kernel(x, gamma=GAMMA), np.eye(len(GENERA))[labels] * 10,
                  sample_weight=len(labels) / (len(GENERA) * counts[labels]))
    expected = estimator.predict(rbf_kernel(v, x, gamma=GAMMA))
    head = StableFeatureRBF(mean, scale, x, estimator.dual_coef_, GAMMA).eval()
    batch_results = {}
    with torch.inference_mode():
        for batch_size in sorted({1, 4, 32, len(raw_v)}):
            actual = np.concatenate([head(torch.from_numpy(raw_v[start:start + batch_size]).float()).numpy()
                                     for start in range(0, len(raw_v), batch_size)])
            batch_results[str(batch_size)] = {"max_logit_error": float(np.max(np.abs(actual - expected))),
                                             "label_mismatches": int(np.sum(actual.argmax(1) != expected.argmax(1)))}
    valid = all(row["max_logit_error"] <= .001 and row["label_mismatches"] == 0 for row in batch_results.values())
    return {"validation": metrics(targets, expected.argmax(1)), "parity": batch_results,
            "parity_passed": valid, "feature_count": len(mean), "state": head.state_dict(),
            "validation_logits": torch.from_numpy(expected), "validation_labels": torch.from_numpy(targets),
            "confusion": confusion_matrix(targets, expected.argmax(1), labels=list(range(len(GENERA)))).tolist()}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--manifest", type=Path, required=True)
    parser.add_argument("--small", type=Path, required=True)
    parser.add_argument("--base", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()
    if (args.output / "evaluation.json").exists():
        raise ValueError("Preserve the completed comparison")
    if sha256(args.manifest) != MANIFEST_SHA256:
        raise ValueError("Frozen V2 manifest required")
    manifest = json.loads(args.manifest.read_text())
    validate_manifest(manifest["rows"])
    recipe = json.loads((args.base / "recipe.json").read_text())
    if recipe["manifest_sha256"] != MANIFEST_SHA256:
        raise ValueError("Base recipe manifest mismatch")
    torch.set_num_threads(2)
    arrays, labels, ids, hashes = {}, {}, {}, {}
    for split, views in (("train", 2), ("validation", 1)):
        rows = [row for row in manifest["rows"] if row["split"] == split]
        if len(rows) != {"train": 2325, "validation": 452}[split]:
            raise ValueError("Unexpected split size")
        ids[split] = [row["id"] for row in rows]
        labels[split] = np.repeat([row["label"] for row in rows], views)
        arrays[split] = []
        for backbone, directory, identity in (("small", args.small, None), ("base", args.base, recipe["identity"])):
            path = directory / f"{split}-features.pt"
            cached = torch.load(path, map_location="cpu", weights_only=True, mmap=True)
            arrays[split].append(checked_features(cached, rows, MANIFEST_SHA256, views, backbone, identity))
            hashes[f"{split}_{backbone}"] = sha256(path)
    contract = {"manifest_sha256": MANIFEST_SHA256, "feature_hashes": hashes, "classes": GENERA,
                "code_sha256": {path.name: sha256(path) for path in (Path(__file__), Path(__file__).with_name("kernel_model.py"))},
                "gamma": GAMMA, "alpha": ALPHA, "normalization": "train-only z-score / sqrt(dimension * group_count)",
                "fit": "class-balanced sample weights; one-hot targets times 10; frozen encoders; original+flip train",
                "trials": ["small-control", "base", "equal-small-base"],
                "validation_bar": VALIDATION_BAR, "selection": "validation macro-F1 only; fixed settings, no grid",
                "calibration_evaluated": False, "holdouts_evaluated": False, "release_approved": False}
    args.output.mkdir(parents=True, exist_ok=True)
    contract_path = args.output / "recipe.json"
    if contract_path.exists() and json.loads(contract_path.read_text()) != contract:
        raise ValueError("Preserve earlier trial provenance")
    contract_path.write_text(json.dumps(contract, indent=2) + "\n")
    digest = sha256(contract_path)
    results = {}
    with threadpool_limits(limits=2):
        for name, indexes in (("small-control", [0]), ("base", [1]), ("equal-small-base", [0, 1])):
            path = args.output / f"{name}.pt"
            if path.exists():
                result = torch.load(path, weights_only=True)
                if result["recipe_sha256"] != digest or result["validation_ids"] != ids["validation"]:
                    raise ValueError("Trial recovery identity mismatch")
            else:
                started = time.monotonic()
                result = fit_trial([arrays["train"][i] for i in indexes], labels["train"],
                                   [arrays["validation"][i] for i in indexes], labels["validation"])
                result.update({"recipe_sha256": digest, "validation_ids": ids["validation"],
                               "seconds": round(time.monotonic() - started, 1)})
                atomic_save(result, path)
            results[name] = {key: value for key, value in result.items()
                             if key not in {"state", "validation_logits", "validation_labels", "validation_ids"}}
            results[name]["head_sha256"] = sha256(path)
            print(json.dumps({"trial": name, **results[name]}), flush=True)
            if name == "small-control" and abs(result["validation"]["macro_f1"] - VALIDATION_BAR) > 1e-10:
                raise ValueError("Small control no longer reproduces the existing selection")
    best = max(("base", "equal-small-base"), key=lambda name: results[name]["validation"]["macro_f1"])
    eligible = results[best]["validation"]["macro_f1"] > VALIDATION_BAR and results[best]["parity_passed"]
    report = {**contract, "results": results, "best_new_trial": best, "eligible_for_further_evaluation": eligible}
    (args.output / "evaluation.json").write_text(json.dumps(report, indent=2) + "\n")
    print(json.dumps({"completed": True, "best_new_trial": best, "eligible_for_further_evaluation": eligible}), flush=True)


if __name__ == "__main__":
    main()
