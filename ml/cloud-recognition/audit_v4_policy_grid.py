"""Audit whether a coarse confidence grid caused rejection; never fit on test rows."""

import argparse
import json
from pathlib import Path

import numpy as np

from labels import GENERA
from train_ccsn import choose_policy
from train_v4_dinob import MANIFEST_SHA256, sha256
from v4_metrics import unique_labeled_rows


EVALUATION_SHA = "6b35a443820a9e7564c4400735f79879c07f3861b1f7f1e08e5369ee6ff49f91"
CHECKPOINT_SHA = "d63fd93f1c5dc6eb35935ebc4b3d5b11d230703a17ea62fbd923d16d31ef2f86"


def cloud_arrays(rows):
    if not rows or any(r["split"] != "calibration" for r in rows):
        raise ValueError("Calibration rows only")
    if len({r["id"] for r in rows}) != len(rows):
        raise ValueError("Duplicate calibration IDs")
    unique, _ = unique_labeled_rows(rows)
    clouds = [r for r in unique if 0 <= r["label"] < len(GENERA) - 1]
    if len(clouds) < 25:
        raise ValueError("Too few cloud calibration photographs")
    values = np.asarray([r["probabilities"] for r in clouds])
    if (values.shape != (len(clouds), len(GENERA)) or not np.isfinite(values).all()
            or (values < 0).any() or (values > 1).any()
            or not np.allclose(values.sum(axis=1), 1, rtol=0, atol=1e-6)):
        raise ValueError("Invalid class probabilities")
    return values, np.asarray([r["label"] for r in clouds]), [r["id"] for r in clouds]


def exact_policy(values, labels, target=.9):
    if (values.ndim != 2 or values.shape != (len(labels), len(GENERA)) or len(labels) < 25
            or not np.isfinite(values).all() or (values < 0).any() or (values > 1).any()
            or not np.allclose(values.sum(axis=1), 1, rtol=0, atol=1e-6)
            or not np.issubdtype(labels.dtype, np.integer) or (labels < 0).any()
            or (labels >= len(GENERA) - 1).any() or not .5 < target <= 1):
        raise ValueError("Invalid cloud calibration probabilities or labels")
    order = np.argsort(-values, axis=1)
    confidence = values[np.arange(len(values)), order[:, 0]]
    margin = confidence - values[np.arange(len(values)), order[:, 1]]
    correct = order[:, 0] == labels
    confidence_boundaries = np.unique(np.r_[.2, confidence[confidence >= .2]])
    margin_boundaries = np.unique(np.r_[0., margin])
    minimum_count = max(25, round(.08 * len(labels)))
    best, peak, supported = None, None, 0

    def coverage_key(row):
        return (row["accepted_count"], row["precision"], -row["minimum_confidence"], -row["margin_threshold"])

    for confidence_cutoff in confidence_boundaries:
        masks = (confidence[:, None] >= confidence_cutoff) & (margin[:, None] >= margin_boundaries)
        counts = masks.sum(axis=0)
        successes = (masks & correct[:, None]).sum(axis=0)
        for i in np.flatnonzero(counts >= minimum_count):
            supported += 1
            row = {"minimum_confidence": float(confidence_cutoff), "margin_threshold": float(margin_boundaries[i]),
                   "accepted_count": int(counts[i]), "correct": int(successes[i]),
                   "precision": float(successes[i] / counts[i]), "coverage": float(counts[i] / len(labels))}
            if peak is None or (row["precision"], coverage_key(row)) > (peak["precision"], coverage_key(peak)):
                peak = row
            if row["precision"] >= target and (best is None or coverage_key(row) > coverage_key(best)):
                best = row
    return {"target": target, "minimum_accepted_count": minimum_count, "target_met": best is not None,
            "selected": best, "maximum_supported_precision": peak,
            "distinct_confidence_boundaries": len(confidence_boundaries),
            "distinct_margin_boundaries": len(margin_boundaries), "supported_threshold_pairs": supported}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--evaluation", type=Path, required=True)
    parser.add_argument("--manifest", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()
    if args.output.exists():
        raise ValueError("Preserve the existing audit")
    if sha256(args.evaluation) != EVALUATION_SHA or sha256(args.manifest) != MANIFEST_SHA256:
        raise ValueError("Frozen input fingerprint mismatch")
    evaluation = json.loads(args.evaluation.read_text())
    if evaluation["checkpoint_sha256"] != CHECKPOINT_SHA or evaluation["manifest_sha256"] != MANIFEST_SHA256:
        raise ValueError("Candidate identity mismatch")
    canonical = [r for r in json.loads(args.manifest.read_text())["rows"] if r["split"] == "calibration"]
    rows = [r for r in evaluation["rows"] if r["split"] == "calibration"]
    if len(rows) != len(canonical):
        raise ValueError("Missing calibration rows")
    for expected, actual in zip(canonical, rows, strict=True):
        if any(expected.get(key) != actual.get(key) for key in ("id", "label", "split", "source", "group", "split_group")):
            raise ValueError("Calibration prediction/manifest mismatch")
    values, labels, ids = cloud_arrays(rows)
    args.output.mkdir(parents=True)
    receipt = {"evaluation_sha256": EVALUATION_SHA, "manifest_sha256": MANIFEST_SHA256,
               "code_sha256": {p.name: sha256(p) for p in (Path(__file__), Path(__file__).with_name("train_ccsn.py"))},
               "cloud_calibration_ids": ids, "temperature": evaluation["temperature"],
               "test_labels_evaluated": False, "release_approved": False}
    (args.output / "recipe.json").write_text(json.dumps(receipt, indent=2) + "\n")
    result = {"recipe_sha256": sha256(args.output / "recipe.json"), "calibration_cloud_count": len(labels),
              "historical_grid": choose_policy(values, labels, .9), "exact_boundaries": exact_policy(values, labels),
              "release_approved": False, "test_labels_evaluated": False}
    (args.output / "evaluation.json").write_text(json.dumps(result, indent=2, allow_nan=False) + "\n")
    print(json.dumps(result), flush=True)


if __name__ == "__main__":
    main()
