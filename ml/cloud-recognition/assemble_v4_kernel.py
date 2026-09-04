"""Bind a numerically verified kernel head to its unchanged frozen backbone."""

import argparse
import hashlib
import json
from pathlib import Path

import torch

from dinov2_model import DINOV2_REVISION
from kernel_model import StableFeatureRBF
from labels import GENERA
from model import build_model
from v4_checkpoint import atomic_save, cpu_tree


def checked_precision(report, saved, head_digest, implementation_digest):
    if (report["head_sha256"] != head_digest or report["implementation_sha256"] != implementation_digest
            or report["manifest_sha256"] != saved["contract"]["manifest_sha256"]
            or report["selected"] != saved["validation"]):
        raise ValueError("Precision report provenance mismatch")
    if not .6316373630764566 < saved["validation"]["macro_f1"] <= 1:
        raise ValueError("The selected kernel does not improve validation")
    for size in (1, 4, 32, saved["contract"]["validation_count"]):
        evidence = report["variants"][f"stable_head_batch_{size}"]
        if not 0 <= evidence["max_error"] <= .001 or evidence["argmax_mismatches"] != 0:
            raise ValueError("Float32 kernel parity failed")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--trial", type=Path, required=True)
    parser.add_argument("--precision", type=Path, required=True)
    parser.add_argument("--backbone-checkpoint", type=Path, required=True)
    parser.add_argument("--manifest", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()
    if args.output.exists():
        raise ValueError("Preserve previous assembled models")
    head_path = args.trial / "head.pt"
    saved = torch.load(head_path, weights_only=True)
    head_digest = hashlib.sha256(head_path.read_bytes()).hexdigest()
    precision = json.loads(args.precision.read_text())
    checked_precision(precision, saved, head_digest,
                      hashlib.sha256(Path(__file__).with_name("kernel_model.py").read_bytes()).hexdigest())
    source = torch.load(args.backbone_checkpoint, weights_only=True)
    digest = hashlib.sha256(args.manifest.read_bytes()).hexdigest()
    if (source["manifest_sha256"] != digest or saved["contract"]["manifest_sha256"] != digest
            or source["backbone_revision"] != DINOV2_REVISION or source["classes"] != GENERA
            or saved["contract"]["classes"] != GENERA
            or source["architecture"] not in {"dinov2_vits14_linear", "dinov2_vits14_mlp"}):
        raise ValueError("Frozen backbone/manifest mismatch")
    state = saved["state"]
    head = StableFeatureRBF(state["mean"], state["scale"], state["support"], state["coefficients"], saved["gamma"])
    config = {"support_count": len(head.support), "gamma": saved["gamma"]}
    model = build_model(len(GENERA), architecture="dinov2_vits14_kernel", model_config=config)
    missing, unexpected = model.load_state_dict({key: value for key, value in source["state_dict"].items()
                                                if not key.startswith("classifier.")}, strict=False)
    if unexpected or any(not key.startswith("classifier.") for key in missing):
        raise ValueError("Unexpected backbone state mismatch")
    model.classifier.load_state_dict(head.state_dict())
    contract = {key: source[key] for key in ("pipeline_version", "input_size", "preprocess", "crop_fraction",
        "classes", "seed", "manifest_sha256", "backbone_revision", "backbone_license", "training_count", "validation_count")}
    contract.update({"architecture": "dinov2_vits14_kernel", "model_config": config, "epoch": 0,
        "selection": saved["contract"]["selection"], "validation": saved["validation"],
        "kernel_head_sha256": head_digest, "precision_report_sha256": hashlib.sha256(args.precision.read_bytes()).hexdigest(),
        "source_backbone_checkpoint_sha256": hashlib.sha256(args.backbone_checkpoint.read_bytes()).hexdigest(),
        "confirmatory_set_exposed": True, "release_approved": False})
    args.output.mkdir(parents=True)
    path = args.output / "cloud-genus-net.pt"
    atomic_save({**contract, "state_dict": cpu_tree(model.state_dict())}, path)
    report = {**contract, "checkpoint_sha256": hashlib.sha256(path.read_bytes()).hexdigest()}
    (args.output / "contract.json").write_text(json.dumps(report, indent=2) + "\n")
    print(json.dumps(report, indent=2))


if __name__ == "__main__":
    main()
