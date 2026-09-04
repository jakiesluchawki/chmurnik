"""One preregistered equal-probability head pair on V2 validation only."""

import argparse
import hashlib
import json
from pathlib import Path

import numpy as np
import torch
from sklearn.metrics import f1_score

from dinov2_model import DINOV2_REVISION, FeatureMLP
from labels import GENERA
from probe_v4_views import report_rows
from train_ccsn import softmax
from v4_checkpoint import atomic_save
from v4_data import validate_manifest
from v4_metrics import metrics, paired_accuracy


def equal_probability_logits(first, second):
    if first.shape != second.shape or first.ndim != 2 or first.shape[1] != len(GENERA):
        raise ValueError("Both heads must return the same full label set")
    values = torch.stack([first.log_softmax(1), second.log_softmax(1)])
    return values.logsumexp(0) - np.log(2)


def verify_members(first, second):
    for member in (first, second):
        if (member["architecture"] != "dinov2_vits14_mlp" or member["classes"] != GENERA
                or member.get("temperature", 1) != 1 or "abstention_policy" in member):
            raise ValueError("Require uncalibrated DINO MLP members with matching labels")
    for key in ("input_size", "preprocess", "crop_fraction", "backbone_revision"):
        if first[key] != second[key]:
            raise ValueError(f"Member input/feature contract differs: {key}")
    left = {key: value for key, value in first["state_dict"].items() if not key.startswith("classifier.")}
    right = {key: value for key, value in second["state_dict"].items() if not key.startswith("classifier.")}
    if left.keys() != right.keys() or any(not torch.equal(value, right[key]) for key, value in left.items()):
        raise ValueError("Members do not share the exact same backbone and normalization")


def verify_parent(parent, manifest, digest):
    validate_manifest(parent["rows"])
    validate_manifest(manifest["rows"])
    if manifest.get("parent_sha256") != digest or manifest["rows"][:len(parent["rows"])] != parent["rows"]:
        raise ValueError("Parent manifest is not an unchanged prefix")
    validation = [row for row in manifest["rows"] if row["split"] == "validation"]
    trained = {row["group"] for row in parent["rows"] if row["split"] == "train"}
    if trained & {row["group"] for row in validation}:
        raise ValueError("A member trained on validation groups")
    return validation


@torch.inference_mode()
def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--manifest", type=Path, required=True)
    parser.add_argument("--parent", type=Path, required=True)
    parser.add_argument("--first", type=Path, required=True)
    parser.add_argument("--second", type=Path, required=True)
    parser.add_argument("--features", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()
    if args.output.exists():
        raise ValueError("Preserve previous pair study")
    torch.set_num_threads(2)
    digest = lambda path: hashlib.sha256(path.read_bytes()).hexdigest()
    parent, manifest = json.loads(args.parent.read_text()), json.loads(args.manifest.read_text())
    manifest_digest, parent_digest = digest(args.manifest), digest(args.parent)
    rows = verify_parent(parent, manifest, parent_digest)
    members = [torch.load(path, map_location="cpu", weights_only=True) for path in (args.first, args.second)]
    verify_members(*members)
    if members[0]["manifest_sha256"] != parent_digest or members[1]["manifest_sha256"] != manifest_digest:
        raise ValueError("Member manifest provenance mismatch")
    cached = torch.load(args.features, weights_only=True)
    if (cached["manifest_sha256"] != manifest_digest or cached["size"] != members[1]["input_size"]
            or cached["revision"] != DINOV2_REVISION or cached["views"] != 1
            or cached["completed"] != len(rows) or cached["ids"] != [row["id"] for row in rows]
            or cached["features"].shape != (len(rows), 768) or not torch.isfinite(cached["features"]).all()):
        raise ValueError("Validation features do not match the study")
    heads, logits = [], []
    for member in members:
        head = FeatureMLP(len(GENERA)).eval()
        head.load_state_dict({key.removeprefix("classifier."): value for key, value in member["state_dict"].items()
                              if key.startswith("classifier.")}, strict=True)
        logits.append(head(cached["features"]))
        heads.append(head.state_dict())
    logits.append(equal_probability_logits(*logits))
    names = ("v1", "v2", "equal_pair")
    predictions = {name: report_rows(rows, softmax(values.numpy(), 1)) for name, values in zip(names, logits, strict=True)}
    labels = np.asarray([row["label"] for row in rows])
    validation = {name: {"accuracy": float(np.mean(values.argmax(1).numpy() == labels)),
                         "macro_f1": float(f1_score(labels, values.argmax(1).numpy(), labels=list(range(len(GENERA))), average="macro", zero_division=0))}
                  for name, values in zip(names, logits, strict=True)}
    rejected = {"minimum_confidence": 1.01, "margin_threshold": 1.}
    eligible = validation["equal_pair"]["macro_f1"] > max(validation[name]["macro_f1"] for name in ("v1", "v2"))
    result = {"manifest_sha256": manifest_digest, "parent_sha256": parent_digest,
              "member_sha256": [digest(args.first), digest(args.second)], "mixing": "equal mean of uncalibrated probabilities",
              "backbone_identical": True, "holdouts_evaluated": False, "calibration_evaluated": False,
              "eligible_for_further_evaluation": eligible, "release_approved": False,
              "selection_population": "validation only", "raw_validation": validation,
              "reports": {name: metrics(predictions[name], rejected) for name in names},
              "paired_vs_v2": {name: paired_accuracy(predictions[name], predictions["v2"]) for name in ("v1", "equal_pair")},
              "rows": predictions}
    args.output.mkdir(parents=True)
    atomic_save({"contract": {key: value for key, value in result.items() if key != "rows"},
                 "members": heads, "validation_logits": torch.stack(logits)}, args.output / "pair.pt")
    (args.output / "evaluation.json").write_text(json.dumps(result, indent=2) + "\n")
    print(json.dumps({key: result[key] for key in ("raw_validation", "paired_vs_v2", "eligible_for_further_evaluation")}, indent=2))


if __name__ == "__main__":
    main()
