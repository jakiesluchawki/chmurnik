"""One frozen training-support error-ranking probe; never change genus predictions."""

import argparse
from collections import Counter
import json
from pathlib import Path

import numpy as np
from sklearn.metrics import roc_auc_score
from sklearn.metrics.pairwise import euclidean_distances
from sklearn.preprocessing import StandardScaler
from threadpoolctl import threadpool_limits
import torch

from labels import GENERA
from probe_v4_cross_backbone import checked_features
from train_ccsn import softmax
from train_v4_dinob import MANIFEST_SHA256, sha256
from v4_data import validate_manifest
from v4_metrics import unique_labeled_rows, wilson


HEAD_SHA = "671382d070d721e4e31d699516264ceffc60bf8231129b24d73b96a8b25a4dbe"
FEATURE_SHA = {
    "train": "74e2116e9358198404267608a74b192e173bb3f289f9cb6cc937ec99d8a6b4b7",
    "validation": "0376ac821a6c9cc587d117e72d3a13c95c31ee84a201783c1c2bc69a40c87ef1",
}
K = 10
KEEP = .9


def check_separation(train, query):
    if (not train or not query or any(r["split"] != "train" for r in train)
            or any(r["split"] != "validation" for r in query)):
        raise ValueError("Training and validation rows only")
    for key in ("id", "group", "split_group"):
        left = {r.get(key, r["group"]) for r in train}
        right = {r.get(key, r["group"]) for r in query}
        if left & right:
            raise ValueError(f"Training/query leakage: {key}")
    if any(len({r["id"] for r in rows}) != len(rows) for rows in (train, query)):
        raise ValueError("Repeated image IDs")


def fit_support(features, rows, *, k=K, keep=KEEP, classes=len(GENERA)):
    if (not rows or any(r["split"] != "train" for r in rows)
            or features.ndim != 2 or len(features) != len(rows)
            or features.shape[1] == 0 or not np.isfinite(features).all()
            or len({r["id"] for r in rows}) != len(rows)
            or any(not 0 <= r["label"] < classes for r in rows)
            or not isinstance(k, int) or k < 1 or not 0 < keep <= 1):
        raise ValueError("Invalid training support")
    unique, excluded = unique_labeled_rows(rows)
    positions = {row["id"]: i for i, row in enumerate(rows)}
    x = features[[positions[row["id"]] for row in unique]]
    labels = np.asarray([row["label"] for row in unique])
    scaler = StandardScaler().fit(x)
    x = scaler.transform(x)
    cores, ids, counts = [], [], []
    for label in range(classes):
        indices = np.flatnonzero(labels == label)
        if len(indices) <= k:
            raise ValueError("Insufficient independent class support")
        distances = euclidean_distances(x[indices])
        # Exclude the query itself, not a possibly distinct equal-valued photo.
        np.fill_diagonal(distances, np.inf)
        radius = np.partition(distances, k - 1, axis=1)[:, k - 1]
        cutoff = np.quantile(radius, keep)
        retained = indices[radius <= cutoff]
        cores.append(x[retained])
        ids.append([unique[i]["id"] for i in retained])
        counts.append({"before": len(indices), "after": len(retained)})
    return {"scaler": scaler, "cores": cores, "ids": ids, "counts": counts,
            "excluded_conflicting_groups": excluded, "unique_training_count": len(unique)}


def support_trust(index, features, predicted):
    classes = len(index["cores"])
    if (features.ndim != 2 or len(features) != len(predicted) or not len(features)
            or features.shape[1] != index["scaler"].n_features_in_
            or not np.isfinite(features).all() or predicted.shape != (len(features),)
            or not np.issubdtype(predicted.dtype, np.integer)
            or (predicted < 0).any() or (predicted >= classes).any()):
        raise ValueError("Invalid support query")
    x = index["scaler"].transform(features)
    distances = np.stack([euclidean_distances(x, core).min(axis=1) for core in index["cores"]], axis=1)
    own = distances[np.arange(len(x)), predicted].copy()
    distances[np.arange(len(x)), predicted] = np.inf
    other = distances.min(axis=1)
    return np.divide(other, own + other, out=np.full(len(x), .5), where=(own + other) > 1e-12)


def rank_metrics(scores, correct):
    if (scores.ndim != 1 or scores.shape != correct.shape or not len(scores)
            or not np.isfinite(scores).all() or correct.dtype != np.bool_):
        raise ValueError("Invalid ranking population")
    order = np.argsort(-scores, kind="stable")
    sorted_scores, outcomes = scores[order], correct[order]
    # Accept an entire equal-score block, so input ordering cannot hide errors.
    counts = np.r_[np.flatnonzero(np.diff(sorted_scores) != 0) + 1, len(scores)]
    successes = np.cumsum(outcomes)[counts - 1]
    precision = successes / counts
    risks = 1 - precision
    area = float(np.sum(risks * np.diff(np.r_[0, counts]) / len(scores)))
    top = int(np.flatnonzero(counts >= int(np.ceil(.1 * len(scores))))[0])
    minimum = max(25, round(.08 * len(scores)))
    qualified = np.flatnonzero((counts >= minimum) & (precision >= .9))

    def selected(i):
        return {"count": int(counts[i]), "correct": int(successes[i]),
                "precision": float(precision[i]), "coverage": float(counts[i] / len(scores)),
                "precision_interval_95": wilson(int(successes[i]), int(counts[i])),
                "threshold": float(sorted_scores[counts[i] - 1])}

    return {"count": len(scores), "correct": int(correct.sum()), "accuracy": float(correct.mean()),
            "correctness_auc": float(roc_auc_score(correct, scores)) if len(set(correct)) == 2 else None,
            "risk_coverage_area": area, "top_decile": selected(top),
            "validation_only_max_coverage_at_90pct": selected(qualified[-1]) if len(qualified) else None,
            "minimum_accepted_count": minimum}


def eligible(candidate, baseline):
    return (candidate["correctness_auc"] is not None and baseline["correctness_auc"] is not None
            and candidate["correctness_auc"] >= baseline["correctness_auc"] + .03
            and candidate["risk_coverage_area"] < baseline["risk_coverage_area"]
            and candidate["top_decile"]["precision"] >= .9)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--manifest", type=Path, required=True)
    parser.add_argument("--features", type=Path, required=True)
    parser.add_argument("--head", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()
    if args.output.exists():
        raise ValueError("Preserve any earlier trust experiment; use a new output directory")
    if sha256(args.manifest) != MANIFEST_SHA256 or sha256(args.head) != HEAD_SHA:
        raise ValueError("Frozen manifest and classifier required")
    manifest = json.loads(args.manifest.read_text())
    validate_manifest(manifest["rows"])
    rows = {split: [r for r in manifest["rows"] if r["split"] == split] for split in FEATURE_SHA}
    check_separation(rows["train"], rows["validation"])
    torch.set_num_threads(2)
    arrays = {}
    for split, views in (("train", 2), ("validation", 1)):
        path = args.features / f"{split}-features.pt"
        if sha256(path) != FEATURE_SHA[split]:
            raise ValueError(f"Feature fingerprint mismatch: {split}")
        arrays[split] = checked_features(torch.load(path, weights_only=True, mmap=True), rows[split],
                                         MANIFEST_SHA256, views, "small")[::views]
    head = torch.load(args.head, weights_only=True, map_location="cpu")
    labels = np.asarray([r["label"] for r in rows["validation"]])
    if (head["validation_ids"] != [r["id"] for r in rows["validation"]]
            or head["train_ids"] != [r["id"] for r in rows["train"]]
            or not np.array_equal(head["validation_labels"].numpy(), labels)):
        raise ValueError("Head prediction identity mismatch")
    logits = head["validation_logits"].numpy()
    if logits.shape != (len(labels), len(GENERA)) or not np.isfinite(logits).all():
        raise ValueError("Invalid frozen logits")
    probabilities = softmax(logits, 1.)
    predicted = probabilities.argmax(axis=1)
    confidence = probabilities.max(axis=1)
    margin = np.sort(probabilities, axis=1)[:, -1] - np.sort(probabilities, axis=1)[:, -2]
    recipe = {"manifest_sha256": MANIFEST_SHA256, "head_sha256": HEAD_SHA,
              "feature_sha256": FEATURE_SHA, "code_sha256": {p.name: sha256(p) for p in
                (Path(__file__), Path(__file__).with_name("v4_metrics.py"))},
              "k": K, "density_keep_fraction": KEEP, "temperature": 1.,
              "views": "original training view only; original validation view",
              "split_counts": {key: len(value) for key, value in rows.items()},
              "thresholds_are_development_only": True, "calibration_evaluated": False,
              "holdouts_evaluated": False, "release_approved": False}
    args.output.mkdir(parents=True)
    (args.output / "recipe.json").write_text(json.dumps(recipe, indent=2) + "\n")
    with threadpool_limits(limits=2):
        index = fit_support(arrays["train"], rows["train"])
        trust = support_trust(index, arrays["validation"], predicted)
    unique, excluded = unique_labeled_rows(rows["validation"])
    positions = {r["id"]: i for i, r in enumerate(rows["validation"])}
    indices = np.asarray([positions[r["id"]] for r in unique])
    clouds = indices[labels[indices] < len(GENERA) - 1]
    populations = {"raw_all": np.arange(len(labels)), "unique_all": indices, "unique_clouds": clouds}
    for source in sorted({r["source"] for r in unique}):
        populations[f"source_{source}"] = np.asarray([positions[r["id"]] for r in unique if r["source"] == source])
    scores = {name: {key: rank_metrics(value[selection], (predicted == labels)[selection])
                    for key, value in (("softmax", confidence), ("margin", margin), ("trust", trust))}
              for name, selection in populations.items()}
    records = [{"id": row["id"], "group": row["group"], "split_group": row.get("split_group", row["group"]),
                "source": row["source"], "label": int(labels[i]), "prediction": int(predicted[i]),
                "softmax": float(confidence[i]), "margin": float(margin[i]), "trust": float(trust[i])}
               for i, row in enumerate(rows["validation"])]
    (args.output / "predictions.json").write_text(json.dumps(records, indent=2, allow_nan=False) + "\n")
    result = {"recipe_sha256": sha256(args.output / "recipe.json"), "metrics": scores,
              "support_counts": dict(zip(GENERA, index["counts"])),
              "unique_training_count": index["unique_training_count"],
              "training_excluded_conflicting_groups": index["excluded_conflicting_groups"],
              "validation_excluded_conflicting_groups": excluded,
              "predictions_sha256": sha256(args.output / "predictions.json"),
              "eligible_for_calibration_study": eligible(scores["unique_clouds"]["trust"], scores["unique_clouds"]["softmax"]),
              "calibration_evaluated": False, "holdouts_evaluated": False, "release_approved": False}
    (args.output / "evaluation.json").write_text(json.dumps(result, indent=2, allow_nan=False) + "\n")
    print(json.dumps({"unique_clouds": scores["unique_clouds"],
                      "eligible_for_calibration_study": result["eligible_for_calibration_study"],
                      "predicted_class_counts": dict(Counter(map(int, predicted)))}), flush=True)


if __name__ == "__main__":
    main()
