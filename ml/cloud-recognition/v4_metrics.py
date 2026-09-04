"""Group-aware evaluation helpers shared by V4 candidates and shipped baseline."""

from collections import defaultdict
import math

import numpy as np

from benchmark_ensemble import probability_report
from labels import GENERA
from train_ccsn import choose_policy, softmax


def balanced_temperature(logits, labels):
    counts = np.bincount(labels, minlength=len(GENERA))
    weights = 1 / counts[labels]
    options = np.linspace(.45, 3., 180)
    losses = [np.average(-np.log(np.clip(softmax(logits, value)[np.arange(len(labels)), labels], 1e-12, 1)), weights=weights) for value in options]
    return float(options[int(np.argmin(losses))])


def choose_cloud_policy(probabilities, labels, target=.9):
    clouds = (labels >= 0) & (labels < len(GENERA) - 1)
    if int(clouds.sum()) < 25:
        raise ValueError("Too few cloud photographs to calibrate an acceptance policy")
    if int((probabilities[clouds].max(axis=1) >= .2).sum()) < 25:
        return {"minimum_confidence": 1.01, "margin_threshold": 1., "precision": None,
                "coverage": 0., "accepted_count": 0, "target_precision": target, "target_met": False,
                "population": "cloud photographs only; insufficient confident calibration cases"}
    policy = choose_policy(probabilities[clouds], labels[clouds], target)
    if not policy["target_met"]:
        # A softmax can round to exactly 1.0; failed calibration must accept none.
        return {"minimum_confidence": 1.01, "margin_threshold": 1., "precision": None,
                "coverage": 0., "accepted_count": 0, "target_precision": target, "target_met": False,
                "best_failed_attempt": policy,
                "population": "cloud photographs only; no supported threshold meets the precision target"}
    policy["population"] = "cloud photographs only; clear-sky cases do not set the confidence threshold"
    return policy


def wilson(successes, count):
    if not count:
        return None
    z = 1.959963984540054
    proportion = successes / count
    center = (proportion + z * z / (2 * count)) / (1 + z * z / count)
    radius = z * math.sqrt(proportion * (1 - proportion) / count + z * z / (4 * count * count)) / (1 + z * z / count)
    return [max(0, center - radius), min(1, center + radius)]


def unique_labeled_rows(rows):
    """One representative per duplicate group; exclude contradictory ground truth."""
    groups = defaultdict(list)
    for row in rows:
        if row["label"] >= 0:
            groups[row.get("group", row["id"])].append(row)
    chosen, excluded = [], []
    for group, items in sorted(groups.items()):
        if len({row["label"] for row in items}) != 1:
            excluded.append(group)
        else:
            chosen.append(min(items, key=lambda row: row["id"]))
    return chosen, excluded


def metrics(rows, policy):
    unique, excluded = unique_labeled_rows(rows)
    if not unique:
        return {"sample_count": 0, "excluded_conflicting_groups": excluded}
    probabilities = np.asarray([row["probabilities"] for row in unique])
    labels = np.asarray([row["label"] for row in unique])
    result = probability_report(probabilities, labels, policy, include_clear=True)
    # Keep all 11 outputs in the confusion matrix, but do not penalize an absent
    # ground-truth class by counting its undefined F1 as zero in the headline.
    present = sorted(set(labels.tolist()))
    result["macro_f1_all_classes"] = result["macro_f1"]
    result["macro_f1"] = float(np.mean([result["classes"][GENERA[index]]["f1-score"] for index in present]))
    predicted = probabilities.argmax(1)
    order = np.sort(probabilities, axis=1)
    accepted = (order[:, -1] >= policy["minimum_confidence"]) & (order[:, -1] - order[:, -2] >= policy["margin_threshold"])
    correct = predicted == labels
    result["top1_interval_95"] = wilson(int(correct.sum()), len(labels))
    result["selective_precision_interval_95"] = wilson(int(correct[accepted].sum()), int(accepted.sum()))
    clouds = labels < len(GENERA) - 1
    accepted_clouds = clouds & accepted
    cloud_count, accepted_cloud_count = int(clouds.sum()), int(accepted_clouds.sum())
    result["cloud_only"] = {
        "sample_count": cloud_count,
        "top1_accuracy": float(correct[clouds].mean()) if cloud_count else None,
        "accepted_count": accepted_cloud_count,
        "selective_precision": float(correct[accepted_clouds].mean()) if accepted_cloud_count else None,
        "selective_coverage": accepted_cloud_count / cloud_count if cloud_count else None,
        "selective_precision_interval_95": wilson(int(correct[accepted_clouds].sum()), accepted_cloud_count),
    }
    result["nll"] = float(-np.log(np.clip(probabilities[np.arange(len(labels)), labels], 1e-12, 1)).mean())
    expected = np.eye(len(GENERA))[labels]
    result["brier"] = float(np.mean(np.sum((probabilities - expected) ** 2, axis=1)))
    result["raw_labeled_count"] = sum(row["label"] >= 0 for row in rows)
    result["excluded_conflicting_groups"] = excluded
    return result


def paired_accuracy(candidate, baseline, seed=9183):
    candidate, _ = unique_labeled_rows(candidate)
    baseline = {row["id"]: row for row in baseline}
    differences = []
    clusters = defaultdict(list)
    for row in candidate:
        other = baseline.get(row["id"])
        if other is None or other["label"] != row["label"]:
            raise ValueError(f"Missing or mismatched paired baseline: {row['id']}")
        difference = int(np.argmax(row["probabilities"]) == row["label"]) - int(np.argmax(other["probabilities"]) == row["label"])
        differences.append(difference)
        clusters[row.get("split_group", row.get("group", row["id"]))].append(difference)
    if not differences:
        return {"sample_count": 0}
    values = np.asarray(differences)
    random = np.random.default_rng(seed)
    sums = np.asarray([sum(items) for items in clusters.values()])
    counts = np.asarray([len(items) for items in clusters.values()])
    indices = random.integers(0, len(clusters), size=(10000, len(clusters)))
    means = sums[indices].sum(axis=1) / counts[indices].sum(axis=1)
    return {"sample_count": len(values), "top1_difference": float(values.mean()),
            "bootstrap_cluster_count": len(clusters),
            "bootstrap_unit": "capture-day group where known, otherwise duplicate-image group",
            "paired_bootstrap_interval_95": np.quantile(means, [0.025, 0.975]).tolist(),
            "corrected": int((values == 1).sum()), "regressed": int((values == -1).sum())}
