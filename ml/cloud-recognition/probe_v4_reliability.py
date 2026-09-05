"""One group-held-out reliability-weighting experiment; never relabel a photograph."""

import argparse
from collections import Counter
import json
from pathlib import Path

import numpy as np
from sklearn.kernel_ridge import KernelRidge
from sklearn.metrics import confusion_matrix
from sklearn.metrics.pairwise import rbf_kernel
from sklearn.model_selection import StratifiedGroupKFold
from sklearn.preprocessing import StandardScaler
from threadpoolctl import threadpool_limits
import torch

from kernel_model import StableFeatureRBF
from labels import GENERA
from probe_v4_cross_backbone import checked_features
from train_v4_dinob import MANIFEST_SHA256, metrics, sha256
from v4_checkpoint import atomic_save
from v4_data import validate_manifest


GAMMA = .25 / 768
ALPHA = .1
VALIDATION_BAR = .6437451661744025


def training_folds(rows):
    if not rows or any(row["split"] != "train" for row in rows):
        raise ValueError("Reliability folds require training-only rows")
    if len({row["id"] for row in rows}) != len(rows):
        raise ValueError("Repeated training IDs")
    groups = np.asarray([row.get("split_group", row["group"]) for row in rows])
    labels = np.asarray([row["label"] for row in rows])
    folds = []
    visits = np.zeros(len(rows), dtype=np.int32)
    splitter = StratifiedGroupKFold(n_splits=5, shuffle=True, random_state=7042)
    for train, query in splitter.split(np.arange(len(rows)), labels, groups):
        if set(groups[train]) & set(groups[query]):
            raise ValueError("Observation/capture group leaks between folds")
        duplicate_train = {rows[i]["group"] for i in train}
        if duplicate_train & {rows[i]["group"] for i in query}:
            raise ValueError("Duplicate group leaks between folds")
        if set(labels[train]) != set(range(11)):
            raise ValueError("A training fold is missing a class")
        visits[query] += 1
        folds.append((train, query))
    if not np.all(visits == 1):
        raise ValueError("Each training photo must be withheld exactly once")
    return folds


def weighted_counts(labels, quality):
    if (labels.shape != quality.shape or len(labels) == 0 or (labels < 0).any() or (labels > 10).any()
            or not np.isfinite(quality).all() or (quality <= 0).any()):
        raise ValueError("Invalid training weights")
    totals = np.bincount(labels, weights=quality, minlength=11)
    if (totals == 0).any():
        raise ValueError("Every class needs positive training support")
    return len(labels) * quality / (11 * totals[labels])


def reliability(rows, oof):
    if (not rows or any(row["split"] != "train" for row in rows)
            or oof.shape != (len(rows), 11) or not np.isfinite(oof).all()):
        raise ValueError("Reliability requires complete training-only OOF scores")
    top3 = np.argsort(-oof, axis=1, kind="stable")[:, :3]
    return np.asarray([.25 if row["source"] == "ccsn" and row["label"] not in predicted else 1.
                       for row, predicted in zip(rows, top3)])


def fit_weighted(raw_x, labels, raw_v, quality):
    scaler = StandardScaler().fit(raw_x)
    x, v = scaler.transform(raw_x), scaler.transform(raw_v)
    estimator = KernelRidge(alpha=ALPHA, kernel="precomputed")
    estimator.fit(rbf_kernel(x, gamma=GAMMA), np.eye(11)[labels] * 10,
                  sample_weight=weighted_counts(labels, quality))
    expected = estimator.predict(rbf_kernel(v, x, gamma=GAMMA))
    return expected, scaler, x, estimator.dual_coef_


def view_indices(images):
    return (np.asarray(images)[:, None] * 2 + np.arange(2)).reshape(-1)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--manifest", type=Path, required=True)
    parser.add_argument("--features", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()
    if (args.output / "evaluation.json").exists():
        raise ValueError("Preserve the completed reliability experiment")
    if sha256(args.manifest) != MANIFEST_SHA256:
        raise ValueError("Frozen V2 manifest required")
    manifest = json.loads(args.manifest.read_text())
    validate_manifest(manifest["rows"])
    rows = [row for row in manifest["rows"] if row["split"] == "train"]
    folds = training_folds(rows)
    arrays, labels, hashes, split_ids = {}, {}, {}, {}
    torch.set_num_threads(2)
    for split, views in (("train", 2), ("validation", 1)):
        split_rows = [row for row in manifest["rows"] if row["split"] == split]
        if len(split_rows) != {"train": 2325, "validation": 452}[split]:
            raise ValueError("Unexpected split size")
        path = args.features / f"{split}-features.pt"
        arrays[split] = checked_features(torch.load(path, weights_only=True, mmap=True), split_rows,
                                        MANIFEST_SHA256, views, "small")
        labels[split] = np.repeat([row["label"] for row in split_rows], views)
        split_ids[split] = [row["id"] for row in split_rows]
        hashes[split] = sha256(path)
    contract = {"manifest_sha256": MANIFEST_SHA256, "feature_hashes": hashes, "classes": GENERA,
                "code_sha256": {p.name: sha256(p) for p in (Path(__file__), Path(__file__).with_name("kernel_model.py"))},
                "folds": [{"train_ids": [rows[i]["id"] for i in train], "query_ids": [rows[i]["id"] for i in query]}
                          for train, query in folds],
                "gamma": GAMMA, "alpha": ALPHA, "fold_seed": 7042,
                "quality": "CCSN label outside training-only group-held-out mean-view top3: .25; all others 1",
                "balancing": "equal total sample weight per class after quality weighting",
                "validation_bar": VALIDATION_BAR, "calibration_evaluated": False,
                "holdouts_evaluated": False, "release_approved": False}
    args.output.mkdir(parents=True, exist_ok=True)
    recipe_path = args.output / "recipe.json"
    if recipe_path.exists() and json.loads(recipe_path.read_text()) != contract:
        raise ValueError("Preserve earlier reliability recipe")
    recipe_path.write_text(json.dumps(contract, indent=2) + "\n")
    digest = sha256(recipe_path)
    oof = np.full((len(rows), 11), np.nan)
    with threadpool_limits(limits=2):
        for number, (train, query) in enumerate(folds):
            path = args.output / f"fold-{number}.pt"
            if path.exists():
                saved = torch.load(path, weights_only=True)
                if saved["recipe_sha256"] != digest or saved["query_ids"] != contract["folds"][number]["query_ids"]:
                    raise ValueError("OOF recovery identity mismatch")
                scores = saved["scores"].numpy()
            else:
                train_views, query_views = view_indices(train), view_indices(query)
                scores, _, _, _ = fit_weighted(arrays["train"][train_views], labels["train"][train_views],
                                               arrays["train"][query_views], np.ones(len(train_views)))
                scores = scores.reshape(len(query), 2, 11).mean(1)
                atomic_save({"recipe_sha256": digest, "query_ids": contract["folds"][number]["query_ids"],
                             "scores": torch.from_numpy(scores)}, path)
            oof[query] = scores
            print(json.dumps({"completed_fold": number, "withheld_photos": len(query)}), flush=True)
        quality = reliability(rows, oof)
        expected, scaler, support, coefficients = fit_weighted(arrays["train"], labels["train"],
                                                              arrays["validation"], np.repeat(quality, 2))
    head = StableFeatureRBF(scaler.mean_, scaler.scale_, support, coefficients, GAMMA).eval()
    parity = {}
    with torch.inference_mode():
        for size in (1, 4, 32, len(expected)):
            actual = np.concatenate([head(torch.from_numpy(block).float()).numpy()
                                     for block in np.array_split(arrays["validation"], np.arange(size, len(expected), size))])
            parity[str(size)] = {"max_error": float(np.max(np.abs(expected - actual))),
                                 "label_mismatches": int(np.sum(expected.argmax(1) != actual.argmax(1)))}
    score = metrics(labels["validation"], expected.argmax(1))
    flagged = [row for row, weight in zip(rows, quality) if weight < 1]
    result = {"recipe_sha256": digest, "validation": score, "parity": parity, "flagged_photo_count": len(flagged),
              "flagged_by_source": dict(Counter(row["source"] for row in flagged)),
              "flagged_by_class": {GENERA[label]: sum(row["label"] == label for row in flagged) for label in range(11)},
              "confusion": confusion_matrix(labels["validation"], expected.argmax(1), labels=list(range(11))).tolist(),
              "eligible_for_further_evaluation": score["macro_f1"] > VALIDATION_BAR and
                  all(row["max_error"] <= .001 and row["label_mismatches"] == 0 for row in parity.values()),
              "calibration_evaluated": False, "holdouts_evaluated": False, "release_approved": False}
    atomic_save({"recipe_sha256": digest, "state": head.state_dict(), "validation": score,
                 "gamma": GAMMA, "quality": torch.from_numpy(quality), "oof_scores": torch.from_numpy(oof),
                 "validation_logits": torch.from_numpy(expected), "validation_labels": torch.from_numpy(labels["validation"]),
                 "train_ids": split_ids["train"], "validation_ids": split_ids["validation"]}, args.output / "head.pt")
    result["head_sha256"] = sha256(args.output / "head.pt")
    (args.output / "evaluation.json").write_text(json.dumps(result, indent=2) + "\n")
    print(json.dumps({"completed": True, **result}), flush=True)


if __name__ == "__main__":
    main()
