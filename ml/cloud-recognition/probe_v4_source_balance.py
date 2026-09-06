"""One fixed source-within-class weighting experiment; development data only."""

import argparse
from collections import defaultdict
import json
from pathlib import Path
import time

import numpy as np
from threadpoolctl import threadpool_limits
import torch

from kernel_model import StableFeatureRBF
from labels import GENERA
from probe_v4_bagged_kernel import predict_head
from probe_v4_cross_backbone import checked_features
from probe_v4_multilayer import logit_parity, retained_quality
from probe_v4_reliability import ALPHA, GAMMA, fit_weighted, weighted_counts
from probe_v4_robust_loss import BAR, FEATURE_SHA, REFERENCE_SHA, eligible, summarize, validation_populations
from train_v4_dinob import MANIFEST_SHA256, sha256
from v4_checkpoint import atomic_save
from v4_data import validate_manifest


def source_factors(rows, quality):
    if (not rows or any(r["split"] != "train" for r in rows)
            or len({r["id"] for r in rows}) != len(rows)
            or quality.shape != (len(rows),) or not np.isfinite(quality).all()
            or (quality <= 0).any()
            or any(type(r["label"]) is not int or not 0 <= r["label"] < len(GENERA)
                   or not isinstance(r["source"], str) or not r["source"] for r in rows)):
        raise ValueError("Source weighting requires aligned, finite training-only photo factors")
    totals, sources = defaultdict(float), defaultdict(set)
    for row, factor in zip(rows, quality):
        totals[row["label"], row["source"]] += factor
        sources[row["label"]].add(row["source"])
    factors = np.array([q / (len(sources[r["label"]]) * totals[r["label"], r["source"]])
                        for r, q in zip(rows, quality)])
    if not np.isfinite(factors).all() or (factors <= 0).any():
        raise ValueError("Non-finite or empty source/class mass")
    return factors


def influence(rows, quality):
    labels = np.asarray([r["label"] for r in rows])
    weights = weighted_counts(labels, quality)
    sources = np.asarray([r["source"] for r in rows])
    return {"total_weight": float(weights.sum()),
            "source_totals": {s: float(weights[sources == s].sum()) for s in sorted(set(sources))},
            "class_sources": {GENERA[c]: {s: {
                "count": int(((labels == c) & (sources == s)).sum()),
                "weight": float(weights[(labels == c) & (sources == s)].sum()),
                "share_within_class": float(weights[(labels == c) & (sources == s)].sum() / weights[labels == c].sum())}
                for s in sorted(set(sources[labels == c]))} for c in range(len(GENERA))}}


def source_gate(candidate, control):
    return (eligible(candidate, control, control) and
            all(candidate[name]["correct"] >= control[name]["correct"]
                for name in ("source_ccsn", "source_imgw-2024-samples")))


def main():
    parser = argparse.ArgumentParser()
    for name in ("manifest", "features", "reference", "output"):
        parser.add_argument("--" + name, required=True, type=Path)
    args = parser.parse_args()
    if args.output.exists():
        raise ValueError("Preserve completed or interrupted source-balance probes")
    if sha256(args.manifest) != MANIFEST_SHA256 or sha256(args.reference) != REFERENCE_SHA:
        raise ValueError("Frozen manifest/reference mismatch")
    manifest = json.loads(args.manifest.read_text())
    validate_manifest(manifest["rows"])
    rows = {s: [r for r in manifest["rows"] if r["split"] == s] for s in FEATURE_SHA}
    if (len(rows["train"]), len(rows["validation"])) != (2325, 452):
        raise ValueError("Development split sizes changed")
    arrays = {}
    for split, views in (("train", 2), ("validation", 1)):
        path = args.features / f"{split}-features.pt"
        if sha256(path) != FEATURE_SHA[split]:
            raise ValueError("Frozen feature cache hash mismatch")
        arrays[split] = checked_features(torch.load(path, map_location="cpu", weights_only=True),
                                        rows[split], MANIFEST_SHA256, views, "small")
    reference = torch.load(args.reference, weights_only=True, map_location="cpu")
    quality = retained_quality(reference, rows["train"])[::2]
    factors = source_factors(rows["train"], quality)
    vy = np.asarray([r["label"] for r in rows["validation"]])
    y = np.repeat([r["label"] for r in rows["train"]], 2)
    if (reference["validation_ids"] != [r["id"] for r in rows["validation"]]
            or not np.array_equal(reference["validation_labels"].numpy(), vy)):
        raise ValueError("Reference validation identity mismatch")
    torch.set_num_threads(2)
    source = Path(__file__).parent
    protocol = source.resolve().parents[1] / (
        "lore/1-tasks/active/0042_FEATURE_recognition-first-v4/source-balance-probe.md")
    recipe = {"manifest_sha256": MANIFEST_SHA256, "feature_sha256": FEATURE_SHA,
              "reference_sha256": REFERENCE_SHA, "protocol_sha256": sha256(protocol),
              "classes": GENERA, "alpha": ALPHA, "gamma": GAMMA,
              "features": "frozen CPU last-only CLS384 + mean-patch384", "threads": 2,
              "normalization": "training-only StandardScaler", "train_views": 2, "validation_views": 1,
              "source_weighting": "q_i / (source_count_in_class * source_class_quality_sum)",
              "quality": "retained training-only OOF, recomputed and checked",
              "torch_version": str(torch.__version__), "validation_bar": BAR,
              "source_gate": "neither CCSN nor IMGW top-1 may decrease",
              "code_sha256": {name: sha256(source / name) for name in (
                  Path(__file__).name, "probe_v4_reliability.py", "probe_v4_multilayer.py",
                  "probe_v4_robust_loss.py", "probe_v4_cross_backbone.py",
                  "probe_v4_bagged_kernel.py", "kernel_model.py", "v4_data.py",
                  "train_v4_linear.py", "train_v4_dinob.py", "v4_checkpoint.py", "v4_metrics.py")},
              "calibration_evaluated": False, "holdouts_evaluated": False, "release_approved": False}
    args.output.mkdir(parents=True)
    recipe_path = args.output / "recipe.json"
    recipe_path.write_text(json.dumps(recipe, indent=2) + "\n")
    digest = sha256(recipe_path)
    populations, excluded = validation_populations(rows["validation"])
    results, predictions = {}, {}
    started = time.monotonic()
    for name, factor in (("control", quality), ("source_balanced", factors)):
        with threadpool_limits(limits=2):
            logits, scaler, support, coefs = fit_weighted(arrays["train"], y, arrays["validation"],
                                                        np.repeat(factor, 2))
        if name == "control":
            control_parity = logit_parity(logits, reference["validation_logits"].numpy())
            if not control_parity["passed"] or control_parity["max_logit_error"] > 1e-6:
                raise ValueError("Paired control no longer reproduces reference")
        head = StableFeatureRBF(scaler.mean_, scaler.scale_, support, coefs, GAMMA).eval()
        parity = {str(n): logit_parity(predict_head(head, arrays["validation"], n), logits)
                  for n in (1, 4, 32, len(vy))}
        predictions[name] = logits.argmax(1)
        scores = {p: summarize(vy[i], predictions[name][i]) for p, i in populations.items()}
        path = args.output / f"{name}-head.pt"
        atomic_save({"recipe_sha256": digest, "state": head.state_dict(), "gamma": GAMMA,
                     "photo_factors": torch.from_numpy(factor), "validation_logits": torch.from_numpy(logits),
                     "train_ids": [r["id"] for r in rows["train"]],
                     "validation_ids": [r["id"] for r in rows["validation"]],
                     "validation_labels": torch.from_numpy(vy)}, path)
        results[name] = {"populations": scores, "float32_parity": parity,
                         "influence": influence(rows["train"], factor), "head_sha256": sha256(path)}
        print(json.dumps({"arm": name, "validation": {k: v for k, v in scores["raw_all"].items()
                                                      if k != "confusion"}, "float32_parity": parity}), flush=True)
    report = {"recipe_sha256": digest, "control_parity": control_parity, "results": results,
              "duplicate_exclusions": excluded,
              "gains": int(((predictions["source_balanced"] == vy) & (predictions["control"] != vy)).sum()),
              "regressions": int(((predictions["source_balanced"] != vy) & (predictions["control"] == vy)).sum()),
              "eligible_for_further_evaluation": source_gate(results["source_balanced"]["populations"],
                    results["control"]["populations"]) and
                    all(p["passed"] for r in results.values() for p in r["float32_parity"].values()),
              "seconds": round(time.monotonic() - started, 1),
              "calibration_evaluated": False, "holdouts_evaluated": False, "release_approved": False}
    (args.output / "evaluation.json").write_text(json.dumps(report, indent=2) + "\n")
    print(json.dumps({"completed": True, **{k: report[k] for k in (
        "gains", "regressions", "eligible_for_further_evaluation", "seconds")}}), flush=True)


if __name__ == "__main__":
    main()
