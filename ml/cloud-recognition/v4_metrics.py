"""Group-aware evaluation helpers shared by V4 candidates and shipped baseline."""

from collections import defaultdict
import math

import numpy as np

from benchmark_ensemble import probability_report
from labels import GENERA


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
    for row in candidate:
        other = baseline.get(row["id"])
        if other is None or other["label"] != row["label"]:
            raise ValueError(f"Missing or mismatched paired baseline: {row['id']}")
        differences.append(int(np.argmax(row["probabilities"]) == row["label"]) - int(np.argmax(other["probabilities"]) == row["label"]))
    if not differences:
        return {"sample_count": 0}
    values = np.asarray(differences)
    random = np.random.default_rng(seed)
    means = np.mean(random.choice(values, size=(10000, len(values))), axis=1)
    return {"sample_count": len(values), "top1_difference": float(values.mean()),
            "paired_bootstrap_interval_95": np.quantile(means, [0.025, 0.975]).tolist(),
            "corrected": int((values == 1).sum()), "regressed": int((values == -1).sum())}
