"""Masked segmentation metrics with capture-group uncertainty, not pixel CIs."""

from collections import defaultdict

import numpy as np


def confusion(predicted, target, valid):
    predicted, target, valid = (np.asarray(value, dtype=bool) for value in (predicted, target, valid))
    if predicted.shape != target.shape or target.shape != valid.shape:
        raise ValueError("Mask shape mismatch")
    return {"tp": int((predicted & target & valid).sum()), "fp": int((predicted & ~target & valid).sum()),
            "fn": int((~predicted & target & valid).sum()), "tn": int((~predicted & ~target & valid).sum())}


def metrics(counts):
    tp, fp, fn, tn = (counts[key] for key in ("tp", "fp", "fn", "tn"))

    def ratio(top, bottom):
        return top / bottom if bottom else None

    return {"cloud_iou": ratio(tp, tp + fp + fn), "dice": ratio(2 * tp, 2 * tp + fp + fn),
            "precision": ratio(tp, tp + fp), "recall": ratio(tp, tp + fn),
            "specificity": ratio(tn, tn + fp), "accuracy": ratio(tp + tn, tp + fp + fn + tn)}


def summarize(rows, repetitions=2000):
    counts = {key: sum(row["counts"][key] for row in rows) for key in ("tp", "fp", "fn", "tn")}
    per_image = [metrics(row["counts"])["cloud_iou"] for row in rows]
    defined = [value for value in per_image if value is not None]
    clear = [row for row in rows if row["counts"]["tp"] + row["counts"]["fn"] == 0]
    groups = defaultdict(lambda: np.zeros(4, dtype=np.int64))
    for row in rows:
        groups[row["group"]] += np.array([row["counts"][key] for key in ("tp", "fp", "fn", "tn")])
    interval = None
    if len(groups) >= 2 and repetitions:
        array = np.stack(list(groups.values()))
        rng = np.random.default_rng(7042)
        samples = array[rng.integers(len(array), size=(repetitions, len(array)))].sum(axis=1)
        union = samples[:, :3].sum(axis=1)
        values = samples[union > 0, 0] / union[union > 0]
        if len(values):
            interval = np.quantile(values, [.025, .975]).tolist()
    return {"images": len(rows), "capture_duplicate_groups": len(groups), "counts": counts,
            **metrics(counts), "cloud_iou_cluster_95ci": interval,
            "mean_image_iou": float(np.mean(defined)) if defined else None,
            "undefined_empty_image_iou": len(per_image) - len(defined),
            "clear_images": len(clear), "clear_images_with_false_cloud_pixels": sum(row["counts"]["fp"] > 0 for row in clear),
            "clear_image_false_cloud_fraction": (sum(row["counts"]["fp"] for row in clear) /
                sum(row["counts"]["fp"] + row["counts"]["tn"] for row in clear)) if clear else None}


def appearance_mask(rgb, valid):
    """Freeze the prior RGB heuristic without using ground-truth cloud labels."""
    ratio = rgb[..., 0].astype(np.float32) / np.maximum(rgb[..., 2], 16)
    if not valid.any():
        return np.zeros(valid.shape, dtype=bool)
    base = float(np.quantile(ratio[valid.astype(bool)], .1))
    threshold = min(.86, max(.62, base + .16))
    return valid.astype(bool) & (np.ones_like(valid, dtype=bool) if base >= .78 else ratio >= threshold)
