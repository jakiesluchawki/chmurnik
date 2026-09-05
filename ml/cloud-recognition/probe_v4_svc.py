"""Validation-only maximum-margin trial over the existing frozen Small features."""

import argparse
import json
from pathlib import Path
import time

import numpy as np
from sklearn.metrics import confusion_matrix
from sklearn.metrics.pairwise import rbf_kernel
from sklearn.preprocessing import StandardScaler
from sklearn.svm import SVC
from threadpoolctl import threadpool_limits
import torch

from labels import GENERA
from probe_v4_cross_backbone import checked_features
from train_v4_dinob import MANIFEST_SHA256, metrics, sha256
from v4_checkpoint import atomic_save
from v4_data import validate_manifest


VALIDATION_BAR = .6437451661744025
REGULARIZATIONS = (.1, 1., 10., 100.)
GAMMA = .25 / 768


def pairwise_coefficients(classifier):
    if classifier.classes_.tolist() != list(range(len(GENERA))):
        raise ValueError("Unexpected SVC class order")
    offsets = np.r_[0, np.cumsum(classifier.n_support_)]
    coefficients = np.zeros((len(classifier.support_), len(GENERA) * (len(GENERA) - 1) // 2))
    column = 0
    for first in range(len(GENERA)):
        for second in range(first + 1, len(GENERA)):
            a, b = slice(offsets[first], offsets[first + 1]), slice(offsets[second], offsets[second + 1])
            coefficients[a, column] = classifier.dual_coef_[second - 1, a]
            coefficients[b, column] = classifier.dual_coef_[first, b]
            column += 1
    return coefficients


def ovr_scores(decisions):
    if decisions.ndim != 2 or decisions.shape[1] != 55 or not np.isfinite(decisions).all():
        raise ValueError("Invalid eleven-class pairwise decisions")
    votes, confidence = np.zeros((len(decisions), 11)), np.zeros((len(decisions), 11))
    column = 0
    for first in range(11):
        for second in range(first + 1, 11):
            margin = decisions[:, column]
            votes[:, first] += margin >= 0
            votes[:, second] += margin < 0
            confidence[:, first] += margin
            confidence[:, second] -= margin
            column += 1
    return votes + confidence / (3 * (np.abs(confidence) + 1))


def fit_trial(x, y, v, targets, regularization, gamma=GAMMA):
    started = time.monotonic()
    classifier = SVC(C=regularization, kernel="precomputed", class_weight="balanced",
                     decision_function_shape="ovr", break_ties=True, probability=False,
                     cache_size=256, random_state=7042)
    classifier.fit(rbf_kernel(x, gamma=gamma), y)
    if classifier.fit_status_ != 0:
        raise ValueError("SVC fit failed to converge")
    validation_kernel = rbf_kernel(v, x, gamma=gamma)
    expected = classifier.decision_function(validation_kernel)
    coefficients = pairwise_coefficients(classifier)
    pairwise = validation_kernel[:, classifier.support_] @ coefficients + classifier.intercept_
    scores = ovr_scores(pairwise)
    error = float(np.max(np.abs(scores - expected)))
    if error > 1e-7 or not np.array_equal(scores.argmax(1), classifier.predict(validation_kernel)):
        raise ValueError("SVC reconstruction differs from sklearn")
    return {"C": regularization, "gamma": gamma, "validation": metrics(targets, scores.argmax(1)),
            "support": torch.from_numpy(x[classifier.support_]), "support_indices": torch.from_numpy(classifier.support_),
            "coefficients": torch.from_numpy(coefficients), "intercept": torch.from_numpy(classifier.intercept_),
            "validation_scores": torch.from_numpy(scores), "validation_labels": torch.from_numpy(targets),
            "reconstruction_max_error": error, "seconds": round(time.monotonic() - started, 1),
            "confusion": confusion_matrix(targets, scores.argmax(1), labels=list(range(11))).tolist()}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--manifest", type=Path, required=True)
    parser.add_argument("--features", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()
    if (args.output / "evaluation.json").exists():
        raise ValueError("Preserve completed SVC trial")
    if sha256(args.manifest) != MANIFEST_SHA256:
        raise ValueError("Frozen V2 manifest required")
    manifest = json.loads(args.manifest.read_text())
    validate_manifest(manifest["rows"])
    arrays, targets, ids, hashes = {}, {}, {}, {}
    torch.set_num_threads(2)
    for split, views in (("train", 2), ("validation", 1)):
        rows = [row for row in manifest["rows"] if row["split"] == split]
        if len(rows) != {"train": 2325, "validation": 452}[split]:
            raise ValueError("Unexpected development row count")
        path = args.features / f"{split}-features.pt"
        arrays[split] = checked_features(torch.load(path, weights_only=True, mmap=True), rows, MANIFEST_SHA256,
                                        views, "small")
        targets[split] = np.repeat([row["label"] for row in rows], views)
        ids[split] = [row["id"] for row in rows]
        hashes[split] = sha256(path)
    scaler = StandardScaler().fit(arrays["train"])
    contract = {"manifest_sha256": MANIFEST_SHA256, "feature_hashes": hashes, "classes": GENERA,
                "code_sha256": sha256(Path(__file__)), "C": list(REGULARIZATIONS), "gamma": GAMMA,
                "fit": "class-balanced SVC; train-only scaler; original+flip; break_ties True; probability False",
                "selection": "validation macro-F1 only", "validation_bar": VALIDATION_BAR,
                "calibration_evaluated": False, "holdouts_evaluated": False, "release_approved": False}
    args.output.mkdir(parents=True, exist_ok=True)
    recipe_path = args.output / "recipe.json"
    if recipe_path.exists() and json.loads(recipe_path.read_text()) != contract:
        raise ValueError("SVC recovery provenance mismatch")
    recipe_path.write_text(json.dumps(contract, indent=2) + "\n")
    digest = sha256(recipe_path)
    results = []
    with threadpool_limits(limits=2):
        for regularization in REGULARIZATIONS:
            path = args.output / f"svc-{regularization:g}.pt"
            if path.exists():
                result = torch.load(path, weights_only=True)
                if result["recipe_sha256"] != digest or result["validation_ids"] != ids["validation"]:
                    raise ValueError("Fitted head provenance mismatch")
            else:
                result = fit_trial(scaler.transform(arrays["train"]), targets["train"],
                                   scaler.transform(arrays["validation"]), targets["validation"], regularization)
                result.update({"mean": torch.from_numpy(scaler.mean_), "scale": torch.from_numpy(scaler.scale_),
                               "recipe_sha256": digest, "validation_ids": ids["validation"]})
                atomic_save(result, path)
            row = {key: value for key, value in result.items()
                   if key in {"C", "gamma", "validation", "reconstruction_max_error", "seconds", "confusion"}}
            row.update({"support_count": len(result["support"]), "head_sha256": sha256(path)})
            results.append(row)
            print(json.dumps(row), flush=True)
    best = max(results, key=lambda row: row["validation"]["macro_f1"])
    report = {**contract, "results": results, "selected": best,
              "eligible_for_further_evaluation": best["validation"]["macro_f1"] > VALIDATION_BAR}
    (args.output / "evaluation.json").write_text(json.dumps(report, indent=2) + "\n")
    print(json.dumps({"completed": True, "selected_C": best["C"],
                      "eligible_for_further_evaluation": report["eligible_for_further_evaluation"]}), flush=True)


if __name__ == "__main__":
    main()
