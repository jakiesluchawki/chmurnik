"""Reproduce the selected kernel fit to isolate numerical error, not select a model."""

import argparse
import hashlib
import json
from pathlib import Path

import numpy as np
import torch
from sklearn.kernel_ridge import KernelRidge
from sklearn.metrics.pairwise import rbf_kernel
from sklearn.preprocessing import StandardScaler
from threadpoolctl import threadpool_limits

from labels import GENERA
from kernel_model import StableFeatureRBF
from train_v4_kernel import FeatureRBF, development_cache
from v4_data import validate_manifest


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--manifest", type=Path, required=True)
    parser.add_argument("--features", type=Path, required=True)
    parser.add_argument("--trial", type=Path, required=True)
    parser.add_argument("--output", type=Path)
    args = parser.parse_args()
    saved = torch.load(args.trial / "head.pt", weights_only=True)
    manifest = json.loads(args.manifest.read_text())
    validate_manifest(manifest["rows"])
    if hashlib.sha256(args.manifest.read_bytes()).hexdigest() != saved["contract"]["manifest_sha256"]:
        raise ValueError("Selected fit manifest mismatch")
    if args.output and args.output.exists():
        raise ValueError("Preserve the previous numerical report")
    arrays, labels = {}, {}
    for role, views in (("train", 2), ("validation", 1)):
        rows = [row for row in manifest["rows"] if row["split"] == role]
        arrays[role] = development_cache(torch.load(args.features / f"{role}-features.pt", weights_only=True), rows, saved["contract"]["manifest_sha256"], views)
        labels[role] = np.repeat([row["label"] for row in rows], views)
    scaler = StandardScaler().fit(arrays["train"])
    x, v = scaler.transform(arrays["train"]), scaler.transform(arrays["validation"])
    weights = len(x) / (len(GENERA) * np.bincount(labels["train"])[labels["train"]])
    gamma, alpha = saved["gamma"], saved["validation"]["alpha"]
    torch.set_num_threads(2)
    with threadpool_limits(limits=2):
        fitted = KernelRidge(alpha=alpha, kernel="precomputed").fit(rbf_kernel(x, gamma=gamma), np.eye(len(GENERA))[labels["train"]] * 10, sample_weight=weights)
        reference = rbf_kernel(v, x, gamma=gamma) @ fitted.dual_coef_
    head = FeatureRBF(scaler.mean_, scaler.scale_, x, fitted.dual_coef_, gamma)
    for key, value in head.state_dict().items():
        torch.testing.assert_close(value, saved["state"][key], atol=0, rtol=0)
    with torch.inference_mode():
        query = torch.from_numpy(arrays["validation"]).float()
        normalized = (query - head.mean) / head.scale
        variants = {"float32": head(query).numpy()}
        quantized_kernel = rbf_kernel(normalized.double().numpy(), head.support.double().numpy(), gamma=gamma)
        variants["quantized_parameters_float64_math"] = quantized_kernel @ head.coefficients.double().numpy()
        distances = (normalized.square().sum(1, keepdim=True) + head.support_norm
                     - 2 * normalized @ head.support.T).clamp_min(0)
        kernel32 = (-gamma * distances).exp()
        variants["float32_kernel_float64_sum"] = kernel32.double().numpy() @ head.coefficients.double().numpy()
        exact_kernel32 = torch.from_numpy(quantized_kernel).float()
        variants["quantized_float64_kernel_float32_sum"] = (exact_kernel32 @ head.coefficients).numpy()
        for size in (64, 256):
            parts = [kernel32[:, start:start + size] @ head.coefficients[start:start + size]
                     for start in range(0, len(x), size)]
            variants[f"float32_blocked_sum_{size}"] = torch.stack(parts).sum(0).numpy()
        variants["float32_explicit_sum"] = (kernel32[:, :, None] * head.coefficients[None, :, :]).sum(1).numpy()
        products = kernel32[:, :, None] * head.coefficients[None, :, :]
        padded = 1 << (len(x) - 1).bit_length()
        products = torch.nn.functional.pad(products, (0, 0, 0, padded - len(x)))
        while products.shape[1] > 1:
            products = products[:, 0::2, :] + products[:, 1::2, :]
        variants["float32_pairwise_tree_sum"] = products[:, 0, :].numpy()
        center = kernel32.mean(1, keepdim=True)
        coefficient_sum = head.coefficients.double().sum(0).float()
        variants["float32_centered_matmul"] = ((kernel32 - center) @ head.coefficients + center * coefficient_sum).numpy()
        centered_products = (kernel32 - center)[:, :, None] * head.coefficients[None, :, :]
        variants["float32_centered_explicit_sum"] = (centered_products.sum(1) + center * coefficient_sum).numpy()
        centered_products = torch.nn.functional.pad(centered_products, (0, 0, 0, padded - len(x)))
        while centered_products.shape[1] > 1:
            centered_products = centered_products[:, 0::2, :] + centered_products[:, 1::2, :]
        variants["float32_centered_tree_sum"] = (centered_products[:, 0, :] + center * coefficient_sum).numpy()
        direct = []
        for block in normalized.split(4):
            distances = (block[:, None, :] - head.support[None, :, :]).square().sum(2)
            direct.append((-gamma * distances).exp() @ head.coefficients)
        variants["direct_float32_distances"] = torch.cat(direct).numpy()
        stable = StableFeatureRBF(head.mean, head.scale, head.support, head.coefficients, gamma)
        for size in (1, 4, 32, len(query)):
            variants[f"stable_head_batch_{size}"] = torch.cat([stable(block) for block in query.split(size)]).numpy()
    result = {"selected": saved["validation"], "head_sha256": hashlib.sha256((args.trial / "head.pt").read_bytes()).hexdigest(),
                      "implementation_sha256": hashlib.sha256(Path(__file__).with_name("kernel_model.py").read_bytes()).hexdigest(),
                      "manifest_sha256": saved["contract"]["manifest_sha256"],
                      "coefficient_abs_max": float(np.abs(fitted.dual_coef_).max()),
                      "feature_abs_max": float(np.abs(v).max()), "normalization_error": float(np.abs(normalized.numpy() - v).max()),
                      "variants": {key: {"max_error": float(np.abs(value - reference).max()),
                                          "argmax_mismatches": int(np.sum(value.argmax(1) != reference.argmax(1)))}
                                   for key, value in variants.items()}}
    result["eligible_for_calibration"] = (saved["validation"]["macro_f1"] > .6316373630764566
        and all(value["max_error"] <= .001 and value["argmax_mismatches"] == 0
                for key, value in result["variants"].items() if key.startswith("stable_head_batch_")))
    result["release_approved"] = False
    if args.output:
        args.output.write_text(json.dumps(result, indent=2) + "\n")
    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()
