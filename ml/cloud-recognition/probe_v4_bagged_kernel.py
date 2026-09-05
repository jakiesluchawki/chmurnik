"""One fixed, group-bagged kernel candidate; validation only, no threshold search."""

import argparse
import json
from pathlib import Path
import time

import numpy as np
from sklearn.metrics import confusion_matrix
from threadpoolctl import threadpool_limits
import torch

from kernel_model import StableFeatureRBF
from labels import GENERA
from probe_v4_cross_backbone import checked_features
from probe_v4_reliability import ALPHA, GAMMA, fit_weighted, training_folds, view_indices
from train_v4_dinob import MANIFEST_SHA256, metrics, sha256
from v4_checkpoint import atomic_save
from v4_data import validate_manifest


VALIDATION_BAR = .6445474034701404
CONTROL_SHA256 = "abf3cb9050bdaf15c34b5fdd772a98175cd53c8962fd7c14bed9ea504e19f9f2"


def committee_logits(scores):
    if (not isinstance(scores, (list, tuple)) or len(scores) != 5
            or any(value.ndim != 2 or value.shape != scores[0].shape or value.shape[1] != 11
                   or len(value) == 0 or not np.isfinite(value).all() for value in scores)):
        raise ValueError("Five aligned finite 11-class score arrays are required")
    return np.mean(np.stack(scores), axis=0)


def predict_head(head, features, batch_size):
    with torch.inference_mode():
        return np.concatenate([head(torch.from_numpy(features[start:start + batch_size]).float()).numpy()
                               for start in range(0, len(features), batch_size)])


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--manifest", type=Path, required=True)
    parser.add_argument("--features", type=Path, required=True)
    parser.add_argument("--control", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()
    if (args.output / "evaluation.json").exists():
        raise ValueError("Preserve the completed comparison")
    if sha256(args.manifest) != MANIFEST_SHA256 or sha256(args.control) != CONTROL_SHA256:
        raise ValueError("Frozen manifest and selected original kernel control are required")
    manifest = json.loads(args.manifest.read_text())
    validate_manifest(manifest["rows"])
    rows = [row for row in manifest["rows"] if row["split"] == "train"]
    validation = [row for row in manifest["rows"] if row["split"] == "validation"]
    if len(rows) != 2325 or len(validation) != 452:
        raise ValueError("Unexpected development split sizes")
    folds = training_folds(rows)
    torch.set_num_threads(2)
    arrays, hashes = {}, {}
    for split, split_rows, views in (("train", rows, 2), ("validation", validation, 1)):
        path = args.features / f"{split}-features.pt"
        cache = torch.load(path, map_location="cpu", weights_only=True, mmap=True)
        arrays[split] = checked_features(cache, split_rows, MANIFEST_SHA256, views, "small")
        hashes[split] = sha256(path)
    labels = np.repeat([row["label"] for row in rows], 2)
    targets = np.asarray([row["label"] for row in validation])
    contract = {"manifest_sha256": MANIFEST_SHA256, "feature_sha256": hashes,
                "control_sha256": CONTROL_SHA256, "classes": GENERA,
                "code_sha256": {p.name: sha256(p) for p in (Path(__file__), Path(__file__).with_name("kernel_model.py"),
                                                         Path(__file__).with_name("probe_v4_reliability.py"))},
                "folds": [{"train_ids": [rows[i]["id"] for i in train],
                           "excluded_ids": [rows[i]["id"] for i in excluded]} for train, excluded in folds],
                "fold_seed": 7042, "gamma": GAMMA, "alpha": ALPHA,
                "fit": "each member: train-only normalization; equal total weight per class; one-hot targets times 10",
                "combine": "arithmetic mean of all five logits, equal weights; no member or threshold selection",
                "validation_bar": VALIDATION_BAR, "selection": "validation macro-F1 must exceed the best selected V2 candidate",
                "calibration_evaluated": False, "holdouts_evaluated": False, "release_approved": False}
    args.output.mkdir(parents=True, exist_ok=True)
    recipe = args.output / "recipe.json"
    if recipe.exists() and json.loads(recipe.read_text()) != contract:
        raise ValueError("Preserve earlier committee provenance")
    recipe.write_text(json.dumps(contract, indent=2) + "\n")
    recipe_hash = sha256(recipe)
    control = torch.load(args.control, map_location="cpu", weights_only=True)
    state = control["state"]
    head = StableFeatureRBF(*(state[key] for key in ("mean", "scale", "support", "coefficients")), control["gamma"])
    control_scores = predict_head(head, arrays["validation"], 32)
    control_metrics = metrics(targets, control_scores.argmax(1))
    if abs(control_metrics["macro_f1"] - .6430316487205148) > 1e-10:
        raise ValueError("Original kernel control no longer reproduces validation")
    scores, members = [], []
    with threadpool_limits(limits=2):
        for index, (train, _) in enumerate(folds):
            path = args.output / f"member-{index}.pt"
            started = time.monotonic()
            if path.exists():
                member = torch.load(path, map_location="cpu", weights_only=True)
                if member["recipe_sha256"] != recipe_hash or member["validation_ids"] != [row["id"] for row in validation]:
                    raise ValueError("Member recovery identity mismatch")
            else:
                train_views = view_indices(train)
                expected, scaler, support, coefficients = fit_weighted(
                    arrays["train"][train_views], labels[train_views], arrays["validation"], np.ones(len(train_views)))
                head = StableFeatureRBF(scaler.mean_, scaler.scale_, support, coefficients, GAMMA).eval()
                parity = {}
                for size in (1, 4, 32, len(validation)):
                    actual = predict_head(head, arrays["validation"], size)
                    parity[str(size)] = {"max_logit_error": float(np.max(np.abs(expected - actual))),
                                         "label_mismatches": int(np.sum(expected.argmax(1) != actual.argmax(1)))}
                member = {"recipe_sha256": recipe_hash, "state": head.state_dict(),
                          "validation_ids": [row["id"] for row in validation],
                          "validation_logits": torch.from_numpy(expected),
                          "native_precision_logits": torch.from_numpy(predict_head(head, arrays["validation"], 32)),
                          "validation": metrics(targets, expected.argmax(1)), "parity": parity,
                          "seconds": round(time.monotonic() - started, 2)}
                atomic_save(member, path)
            scores.append(member["validation_logits"].numpy())
            summary = {key: value for key, value in member.items() if key not in {"state", "validation_ids", "validation_logits", "native_precision_logits"}}
            summary["sha256"] = sha256(path)
            members.append(summary)
            print(json.dumps({"completed_member": index, **summary}), flush=True)
    combined = committee_logits(scores)
    native = committee_logits([torch.load(args.output / f"member-{i}.pt", weights_only=True)["native_precision_logits"].numpy() for i in range(5)])
    parity = {"max_logit_error": float(np.max(np.abs(combined - native))),
              "label_mismatches": int(np.sum(combined.argmax(1) != native.argmax(1)))}
    valid = parity["max_logit_error"] <= .001 and parity["label_mismatches"] == 0
    score = metrics(targets, combined.argmax(1))
    atomic_save({"recipe_sha256": recipe_hash, "validation_ids": [row["id"] for row in validation],
                 "validation_logits": torch.from_numpy(combined), "validation_labels": torch.from_numpy(targets)}, args.output / "predictions.pt")
    result = {"recipe_sha256": recipe_hash, "members": members, "control": control_metrics,
              "validation": score, "committee_parity": parity,
              "confusion": confusion_matrix(targets, combined.argmax(1), labels=list(range(11))).tolist(),
              "corrected_vs_control": int(np.sum((combined.argmax(1) == targets) & (control_scores.argmax(1) != targets))),
              "regressed_vs_control": int(np.sum((combined.argmax(1) != targets) & (control_scores.argmax(1) == targets))),
              "eligible_for_further_evaluation": score["macro_f1"] > VALIDATION_BAR and valid,
              "calibration_evaluated": False, "holdouts_evaluated": False, "release_approved": False}
    (args.output / "evaluation.json").write_text(json.dumps(result, indent=2) + "\n")
    print(json.dumps({"completed": True, **result}), flush=True)


if __name__ == "__main__":
    main()
