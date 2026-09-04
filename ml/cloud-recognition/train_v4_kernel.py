"""Bounded RBF head trial over existing, frozen, development-only DINO features."""

import argparse
import hashlib
import json
from pathlib import Path

import numpy as np
import torch
from sklearn.kernel_ridge import KernelRidge
from sklearn.metrics import f1_score
from sklearn.metrics.pairwise import rbf_kernel
from sklearn.preprocessing import StandardScaler
from threadpoolctl import threadpool_limits

from dinov2_model import DINOV2_REVISION
from labels import GENERA
from v4_checkpoint import atomic_save
from v4_data import validate_manifest


class FeatureRBF(torch.nn.Module):
    def __init__(self, mean, scale, support, coefficients, gamma):
        super().__init__()
        if (support.ndim != 2 or support.shape[1] != 768 or mean.shape != (768,)
                or scale.shape != (768,) or coefficients.shape != (len(support), len(GENERA))):
            raise ValueError("Invalid kernel feature or class geometry")
        if not (scale > 0).all() or not np.isfinite(gamma) or gamma <= 0:
            raise ValueError("Invalid normalization or kernel scale")
        for name, value in (("mean", mean), ("scale", scale), ("support", support), ("coefficients", coefficients)):
            tensor = torch.as_tensor(value, dtype=torch.float32)
            if not torch.isfinite(tensor).all():
                raise ValueError("Non-finite kernel parameter")
            self.register_buffer(name, tensor)
        self.register_buffer("support_norm", self.support.square().sum(1))
        self.gamma = float(gamma)

    def forward(self, features):
        values = (features - self.mean) / self.scale
        distances = (values.square().sum(1, keepdim=True) + self.support_norm
                     - 2 * values @ self.support.T).clamp_min(0)
        return (-self.gamma * distances).exp() @ self.coefficients


def development_cache(cached, rows, digest, views):
    if not rows or any(row["split"] not in {"train", "validation"} for row in rows):
        raise ValueError("Only development rows may enter the kernel trial")
    if (cached["manifest_sha256"] != digest or cached["revision"] != DINOV2_REVISION
            or cached["size"] != 224 or cached["views"] != views or cached["completed"] != len(rows)
            or cached["ids"] != [row["id"] for row in rows]
            or cached["features"].shape != (len(rows) * views, 768)
            or not torch.isfinite(cached["features"]).all()):
        raise ValueError("Frozen DINO feature cache mismatch")
    return cached["features"].numpy().astype(np.float64)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--manifest", type=Path, required=True)
    parser.add_argument("--features", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()
    if (args.output / "evaluation.json").exists():
        raise ValueError("Completed kernel trial exists; preserve it")
    torch.set_num_threads(2)
    manifest = json.loads(args.manifest.read_text())
    validate_manifest(manifest["rows"])
    digest = hashlib.sha256(args.manifest.read_bytes()).hexdigest()
    arrays, targets = {}, {}
    for split, views in (("train", 2), ("validation", 1)):
        rows = [row for row in manifest["rows"] if row["split"] == split]
        cached = torch.load(args.features / f"{split}-features.pt", weights_only=True)
        arrays[split] = development_cache(cached, rows, digest, views)
        targets[split] = np.repeat([row["label"] for row in rows], views)
    scaler = StandardScaler().fit(arrays["train"])
    x, v = scaler.transform(arrays["train"]), scaler.transform(arrays["validation"])
    y, vy = targets["train"], targets["validation"]
    counts = np.bincount(y, minlength=len(GENERA))
    sample_weights = len(y) / (len(GENERA) * counts[y])
    desired = np.eye(len(GENERA))[y] * 10
    contract = {"manifest_sha256": digest, "backbone_revision": DINOV2_REVISION,
                "input_size": 224, "classes": GENERA, "training_views": 2,
                "training_count": len(y) // 2, "validation_count": len(vy),
                "selection": "validation macro-F1; gamma {.25,1,4}/768; alpha {.01,.1,1}",
                "training": "train-only standardization; class-balanced samples; one-hot targets times 10",
                "calibration_evaluated": False, "holdouts_evaluated": False, "release_approved": False}
    args.output.mkdir(parents=True, exist_ok=True)
    recovery = args.output / "trial.pt"
    history, best, selected = [], -1., None
    if recovery.exists():
        saved = torch.load(recovery, weights_only=True)
        if saved["contract"] != contract:
            raise ValueError("Kernel trial recovery provenance mismatch")
        history, best, selected = saved["history"], saved["best"], saved["selected"]
    with threadpool_limits(limits=2):
        for factor in (.25, 1., 4.):
            gamma = factor / 768
            if all(any(row["gamma_factor"] == factor and row["alpha"] == alpha for row in history) for alpha in (.01, .1, 1.)):
                continue
            kernel = rbf_kernel(x, gamma=gamma)
            validation_kernel = rbf_kernel(v, x, gamma=gamma)
            for alpha in (.01, .1, 1.):
                if any(row["gamma_factor"] == factor and row["alpha"] == alpha for row in history):
                    continue
                estimator = KernelRidge(alpha=alpha, kernel="precomputed")
                estimator.fit(kernel, desired, sample_weight=sample_weights)
                logits = estimator.predict(validation_kernel)
                predicted = logits.argmax(1)
                row = {"gamma_factor": factor, "alpha": alpha, "accuracy": float(np.mean(predicted == vy)),
                       "macro_f1": float(f1_score(vy, predicted, labels=list(range(len(GENERA))), average="macro", zero_division=0))}
                history.append(row)
                if row["macro_f1"] > best:
                    best = row["macro_f1"]
                    head = FeatureRBF(scaler.mean_, scaler.scale_, x, estimator.dual_coef_, gamma)
                    with torch.inference_mode():
                        deployed = head(torch.from_numpy(arrays["validation"]).float()).numpy()
                    selected = {"validation": row, "gamma": gamma, "state": head.state_dict(),
                                "max_abs_error": float(np.max(np.abs(deployed - logits))),
                                "float32_argmax_mismatches": int(np.sum(deployed.argmax(1) != predicted))}
                atomic_save({"contract": contract, "history": history, "best": best, "selected": selected}, recovery)
                print(json.dumps(row), flush=True)
            del kernel, validation_kernel
    eligible = best > .6316373630764566 and selected["float32_argmax_mismatches"] == 0 and selected["max_abs_error"] <= .001
    atomic_save({"contract": contract, **selected}, args.output / "head.pt")
    result = {**contract, "history": history, "selected": {key: value for key, value in selected.items() if key != "state"},
              "head_sha256": hashlib.sha256((args.output / "head.pt").read_bytes()).hexdigest(),
              "eligible_for_further_evaluation": eligible}
    (args.output / "evaluation.json").write_text(json.dumps(result, indent=2) + "\n")
    print(json.dumps({"selected": result["selected"], "eligible_for_further_evaluation": eligible}), flush=True)


if __name__ == "__main__":
    main()
