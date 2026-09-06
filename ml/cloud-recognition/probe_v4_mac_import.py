"""One fixed train-only kernel fit matching Mac JPEG import; no holdout access."""
import argparse
import json
from pathlib import Path
import subprocess

import numpy as np
from sklearn.metrics import confusion_matrix
from threadpoolctl import threadpool_limits
import torch

from kernel_model import StableFeatureRBF
from labels import GENERA
from model import build_model
from probe_v4_cross_backbone import checked_features
from probe_v4_reliability import ALPHA, GAMMA, fit_weighted
from train_v4_dinob import MANIFEST_SHA256, metrics, sha256
from train_v4_linear import cached_features
from v4_checkpoint import atomic_save
from v4_data import image_fingerprint, validate_manifest


CHECKPOINT_SHA256 = "1b8c30b1c319abf259e99ed1a27387c451863a6cd158533ea5431bdbaf2c2195"


def development_rows(manifest):
    validate_manifest(manifest["rows"])
    return [row for row in manifest["rows"] if row["split"] in {"train", "validation"}]


def verify_source_row(row):
    path = Path(row["path"])
    # IMGW fingerprints describe originals; artifact hashes bind resized JPEGs.
    if "artifact_sha256" in row:
        valid = sha256(path) == row["artifact_sha256"]
    else:
        valid = image_fingerprint(path)[0] == row["pixel_sha256"]
    if not valid:
        raise ValueError(f"Frozen source identity changed: {row['id']}")


def imported_rows(rows, receipts, directory):
    if (not rows or any(row["split"] not in {"train", "validation"} for row in rows)
            or len({row["id"] for row in rows}) != len(rows)
            or [row["id"] for row in receipts] != [row["id"] for row in rows]):
        raise ValueError("Import receipt split or identity mismatch")
    result = []
    for index, (row, receipt) in enumerate(zip(rows, receipts)):
        if receipt["file"] != f"{index:05d}.jpg":
            raise ValueError("Unexpected encoded filename")
        path = directory / receipt["file"]
        if (sha256(Path(row["path"])) != receipt["sourceSHA256"]
                or sha256(path) != receipt["encodedSHA256"]
                or path.stat().st_size != receipt["encodedBytes"]):
            raise ValueError("Import receipt bytes changed")
        result.append({**row, "path": str(path.resolve())})
    return result


def advance(control, candidate):
    return (all(candidate["imported"][key] > control["imported"][key] for key in ("accuracy", "macro_f1"))
            and all(candidate["raw"][key] >= control["raw"][key] for key in ("accuracy", "macro_f1")))


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--manifest", required=True, type=Path)
    parser.add_argument("--checkpoint", required=True, type=Path)
    parser.add_argument("--control", required=True, type=Path)
    parser.add_argument("--raw-features", required=True, type=Path)
    parser.add_argument("--importer", required=True, type=Path)
    parser.add_argument("--output", required=True, type=Path)
    parser.add_argument("--device", choices=["cpu", "mps"], default="cpu")
    args = parser.parse_args()
    if (args.output / "evaluation.json").exists():
        raise ValueError("Preserve the completed Mac-import trial")
    if sha256(args.manifest) != MANIFEST_SHA256 or sha256(args.checkpoint) != CHECKPOINT_SHA256:
        raise ValueError("Frozen manifest and checkpoint required")
    manifest = json.loads(args.manifest.read_text())
    rows = development_rows(manifest)
    train = [row for row in rows if row["split"] == "train"]
    validation = [row for row in rows if row["split"] == "validation"]
    if (len(train), len(validation)) != (2325, 452):
        raise ValueError("Unexpected development split sizes")
    control = torch.load(args.control / "head.pt", weights_only=True)
    recipe = json.loads((args.control / "recipe.json").read_text())
    if (control["recipe_sha256"] != sha256(args.control / "recipe.json")
            or recipe["manifest_sha256"] != MANIFEST_SHA256 or recipe["gamma"] != GAMMA
            or recipe["alpha"] != ALPHA or control["train_ids"] != [row["id"] for row in train]
            or control["validation_ids"] != [row["id"] for row in validation]
            or control["quality"].shape != (len(train),)
            or not torch.isfinite(control["quality"]).all()
            or not torch.isin(control["quality"], torch.tensor([.25, 1.])).all()):
        raise ValueError("Control training quality identity mismatch")
    raw_path = args.raw_features / "validation-features.pt"
    if sha256(raw_path) != recipe["feature_hashes"]["validation"]:
        raise ValueError("Raw feature cache changed")
    raw_validation = checked_features(torch.load(raw_path, weights_only=True), validation,
                                      MANIFEST_SHA256, 1, "small")
    root = Path(__file__).parent
    contract = dict(manifest_sha256=MANIFEST_SHA256, checkpoint_sha256=CHECKPOINT_SHA256,
                    control_head_sha256=sha256(args.control / "head.pt"), importer_sha256=sha256(args.importer),
                    raw_features_sha256=sha256(raw_path), gamma=GAMMA, alpha=ALPHA, device=args.device,
                    code_sha256={name: sha256(root / name) for name in
                                 ("probe_v4_mac_import.py", "train_v4_linear.py", "train_v4.py", "dinov2_model.py",
                                  "probe_v4_reliability.py", "kernel_model.py")},
                    admission="strict imported accuracy/F1 gain; no raw accuracy/F1 regression",
                    calibration_evaluated=False, holdouts_evaluated=False, release_approved=False)
    args.output.mkdir(parents=True, exist_ok=True)
    contract_path = args.output / "recipe.json"
    if contract_path.exists() and json.loads(contract_path.read_text()) != contract:
        raise ValueError("Trial contract changed; preserve the original")
    contract_path.write_text(json.dumps(contract, indent=2) + "\n")
    for row in rows:
        verify_source_row(row)
    prepared = args.output / "imported"
    receipts_path = prepared / "receipts.json"
    if not prepared.exists():
        inputs = args.output / "inputs.json"
        inputs.write_text(json.dumps([{key: row[key] for key in ("id", "path")} for row in rows], indent=2) + "\n")
        subprocess.run([str(args.importer.resolve()), str(inputs.resolve()), str(prepared.resolve())], check=True)
    mapped = imported_rows(rows, json.loads(receipts_path.read_text()), prepared)
    identity = {**contract, "import_receipts_sha256": sha256(receipts_path)}
    torch.set_num_threads(2)
    device = torch.device(args.device)
    checkpoint = torch.load(args.checkpoint, map_location="cpu", weights_only=True)
    model = build_model(11, architecture=checkpoint["architecture"], model_config=checkpoint["model_config"])
    model.load_state_dict(checkpoint["state_dict"])
    model.eval().requires_grad_(False).to(device)
    arrays = {}
    for split, views in (("train", 2), ("validation", 1)):
        split_rows = [row for row in mapped if row["split"] == split]
        arrays[split] = cached_features(model, split_rows, 224, device, args.output / f"{split}-features.pt",
                                        MANIFEST_SHA256, views, identity=identity)
    model.to("cpu")
    if device.type == "mps":
        torch.mps.empty_cache()
    del model
    labels = np.asarray([row["label"] for row in validation])
    with threadpool_limits(limits=2):
        expected, scaler, support, coefficients = fit_weighted(arrays["train"],
            np.repeat([row["label"] for row in train], 2), arrays["validation"],
            np.repeat(control["quality"].numpy(), 2))
    fitted = StableFeatureRBF(scaler.mean_, scaler.scale_, support, coefficients, GAMMA).eval()
    original = StableFeatureRBF.empty(4650, GAMMA).eval()
    original.load_state_dict(control["state"])
    scores, logits = {}, {}
    with torch.inference_mode():
        for name, head in (("control", original), ("candidate", fitted)):
            scores[name], logits[name] = {}, {}
            for mode, values in (("raw", raw_validation), ("imported", arrays["validation"])):
                actual = torch.cat([head(block) for block in torch.from_numpy(values).float().split(32)]).numpy()
                scores[name][mode] = {**metrics(labels, actual.argmax(1)),
                    "correct": int(np.sum(actual.argmax(1) == labels)),
                    "confusion": confusion_matrix(labels, actual.argmax(1), labels=list(range(11))).tolist()}
                logits[name][mode] = actual
    parity_error = float(np.max(np.abs(expected - logits["candidate"]["imported"])))
    parity_changes = int(np.sum(expected.argmax(1) != logits["candidate"]["imported"].argmax(1)))
    control_error = float(np.max(np.abs(control["validation_logits"].numpy() - logits["control"]["raw"])))
    control_changes = int(np.sum(control["validation_logits"].numpy().argmax(1) != logits["control"]["raw"].argmax(1)))
    parity_passed = max(parity_error, control_error) <= .001 and parity_changes == control_changes == 0
    report = {**contract, "recipe_sha256": sha256(contract_path), "import_receipts_sha256": sha256(receipts_path),
              "scores": scores, "float32_parity_error": parity_error, "float32_parity_changes": parity_changes,
              "control_reproduction_error": control_error, "control_reproduction_changes": control_changes,
              "eligible_for_further_evaluation": parity_passed and advance(scores["control"], scores["candidate"]),
              "feature_hashes": {split: sha256(args.output / f"{split}-features.pt") for split in arrays}}
    atomic_save({"recipe_sha256": report["recipe_sha256"], "state": fitted.state_dict(),
                 "validation_ids": [row["id"] for row in validation],
                 "logits": {name: {mode: torch.from_numpy(values) for mode, values in modes.items()}
                            for name, modes in logits.items()}}, args.output / "head.pt")
    report["head_sha256"] = sha256(args.output / "head.pt")
    (args.output / "evaluation.json").write_text(json.dumps(report, indent=2) + "\n")
    print(json.dumps({**report, "scores": {name: {mode: {k: v for k, v in result.items() if k != "confusion"}
                                                               for mode, result in modes.items()}
                                          for name, modes in scores.items()}}, indent=2))


if __name__ == "__main__":
    main()
