"""Separate JPEG import, image preparation and inference using native pixel receipts."""

import argparse
import hashlib
import json
from pathlib import Path
import subprocess
import time

import numpy as np
from PIL import Image
import torch
from torchvision.transforms.functional import to_tensor

from labels import GENERA
from model import build_model
from probe_v4_mac_import import CHECKPOINT_SHA256, development_rows, imported_rows, verify_source_row
from train_v4 import TrainingImages
from train_v4_dinob import MANIFEST_SHA256, sha256
from verify_v4_coreml import export_identity


def compare(ids, expected, actual):
    expected, actual = np.asarray(expected), np.asarray(actual)
    for values in (expected, actual):
        if (not ids or len(set(ids)) != len(ids) or values.shape != (len(ids), len(GENERA))
                or not np.isfinite(values).all() or (values < 0).any() or (values > 1).any()
                or not np.allclose(values.sum(1), 1, rtol=0, atol=.01)):
            raise ValueError("Invalid comparison identities or probabilities")
    changed = expected.argmax(1) != actual.argmax(1)
    sorted_values = np.sort(expected, axis=1)
    margins = sorted_values[:, -1] - sorted_values[:, -2]
    difference = np.abs(expected - actual)
    return {
        "maximum_probability_error": float(difference.max()),
        "all_top1_changes": [id_ for id_, yes in zip(ids, changed) if yes],
        "non_tie_01_changes": [id_ for id_, yes in zip(ids, changed & (margins > .01)) if yes],
        "non_tie_05_changes": [id_ for id_, yes in zip(ids, changed & (margins > .05)) if yes],
        "strict_inference_gate": bool(difference.max() <= .01 and not (changed & (margins > .01)).any()),
        "native_decision_gate": bool(not (changed & (margins > .05)).any()),
    }


def prepared_tensor(row, receipt, index, directory):
    path = Path(row["path"])
    if (receipt["id"] != row["id"] or receipt["inputSHA256"] != sha256(path)
            or receipt["inputByteCount"] != path.stat().st_size
            or receipt["preparedPNG"] != f"{index:05d}.png"):
        raise ValueError("Native input or prepared filename mismatch")
    prepared = directory / receipt["preparedPNG"]
    if sha256(prepared) != receipt["preparedPNGSHA256"]:
        raise ValueError("Prepared PNG bytes changed")
    with Image.open(prepared) as image:
        if image.format != "PNG" or image.mode != "RGB" or image.size != (224, 224):
            raise ValueError("Expected exact prepared RGB224 PNG, not another transform")
        if hashlib.sha256(image.tobytes()).hexdigest() != receipt["preparedRGBSHA256"]:
            raise ValueError("PNG does not contain the RGB pixels passed to Vision")
        return to_tensor(image)


def exact_ids(records, ids):
    if len(records) != len(ids) or {row["id"] for row in records} != set(ids):
        raise ValueError("Missing or duplicated prediction identities")
    return {row["id"]: row for row in records}


def main():
    import coremltools as ct

    parser = argparse.ArgumentParser()
    parser.add_argument("--runner", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()
    if args.output.exists():
        raise ValueError("Preserve the previous diagnostic, including incomplete output")
    root = Path(__file__).resolve().parents[2]
    local = root / ".local/v4"
    core = local / "dino-reliability-coreml-20260906"
    imported = local / "mac-import-training-20260906-v2/imported"
    checkpoint_path = local / "dinov2-reliability-calibrated/cloud-genus-net.pt"
    manifest_path = local / "data-v2/manifest.json"
    legacy_path = core / "float32-mac-import/report.json"
    native_path = core / "float32-mac-import/native.json"
    pinned = {
        manifest_path: MANIFEST_SHA256, checkpoint_path: CHECKPOINT_SHA256,
        legacy_path: "bf99ff215093a80b0525a7526bff49abc42a9c1e429b05117d15108922e18e2d",
        native_path: "24a98cf314c4df79f319f474c869fd8248213d901eb672a367f18384a7dc96c0",
        imported / "receipts.json": "7f2195e0952f3afd683a0a43a818cf6fcfe1452d359a71ac43766e4d60bad9f0",
    }
    if any(sha256(path) != expected for path, expected in pinned.items()):
        raise ValueError("Frozen input/checkpoint/report changed")
    manifest = json.loads(manifest_path.read_text())
    development = development_rows(manifest)
    for row in development:
        verify_source_row(row)
    mapped = imported_rows(development, json.loads((imported / "receipts.json").read_text()), imported)
    rows = [row for row in development if row["split"] == "validation"]
    encoded_rows = [row for row in mapped if row["split"] == "validation"]
    ids = [row["id"] for row in rows]
    if len(rows) != 452 or ids != [row["id"] for row in encoded_rows]:
        raise ValueError("The complete frozen validation split is required")
    legacy = json.loads(legacy_path.read_text())
    old_rows = exact_ids(legacy["rows"], ids)
    old_native = exact_ids(json.loads(native_path.read_text()), ids)
    for row in encoded_rows:
        before = old_native[row["id"]]
        if sha256(Path(row["path"])) != before["inputSHA256"] or Path(row["path"]).stat().st_size != before["inputByteCount"]:
            raise ValueError("Prior native prediction did not use the same imported JPEG")
    package = core / "float32/CloudGenusResearch.mlpackage"
    package_hashes = {str(path.relative_to(package)): sha256(path) for path in sorted(package.rglob("*")) if path.is_file()}
    if package_hashes != legacy["package_files_sha256"]:
        raise ValueError("Research Core ML package changed")
    torch.set_num_threads(2)
    checkpoint = torch.load(checkpoint_path, map_location="cpu", weights_only=True)
    metadata = ct.models.MLModel(str(package), skip_model_load=True).user_defined_metadata
    identity = export_identity(checkpoint, checkpoint_path, metadata)
    if identity != legacy["export_identity"] or identity["export_precision"] != "float32":
        raise ValueError("Prior export identity changed")
    contract = {
        "scope": "All452 validation inputs; CPU Torch; separate import/preparation/inference; no training",
        "export_identity": identity, "package_files_sha256": package_hashes,
        "source_artifacts_sha256": {str(path.relative_to(root)): value for path, value in pinned.items()},
        "runner_sha256": sha256(args.runner), "code_sha256": {
            name: sha256(root / name) for name in (
                "ml/cloud-recognition/probe_v4_import_pixels.py", "ml/cloud-recognition/train_v4.py",
                "tests/native-recognition-parity/main.swift", "tests/native-recognition-parity/ReferenceBilinear.swift",
                "ios/App/App/CloudImagePreprocessor.swift")},
        "calibration_evaluated": False, "holdouts_evaluated": False, "release_approved": False,
    }
    args.output.mkdir(parents=True)
    (args.output / "recipe.json").write_text(json.dumps(contract, indent=2) + "\n")
    inputs = args.output / "inputs.json"
    inputs.write_text(json.dumps([{"id": row["id"], "path": row["path"]} for row in encoded_rows], indent=2) + "\n")
    current_native_path = args.output / "native.json"
    prepared_directory = args.output / "prepared"
    started = time.monotonic()
    subprocess.run([str(args.runner.resolve()), str(inputs.resolve()), str(package),
                    str(current_native_path.resolve()), str(prepared_directory.resolve())], check=True)
    fresh_records = json.loads(current_native_path.read_text())
    exact_ids(fresh_records, ids)
    if [row["id"] for row in fresh_records] != ids:
        raise ValueError("Native runner reordered inputs")
    # Validate every prepared pixel receipt before running any Torch inference.
    for index, (row, receipt) in enumerate(zip(encoded_rows, fresh_records)):
        prepared_tensor(row, receipt, index, prepared_directory)
    model = build_model(len(GENERA), architecture=checkpoint["architecture"], model_config=checkpoint["model_config"])
    model.load_state_dict(checkpoint["state_dict"], strict=True)
    model.eval().requires_grad_(False)
    datasets = {"raw": TrainingImages(rows, 224), "imported": TrainingImages(encoded_rows, 224)}
    output_rows = []
    with torch.inference_mode():
        for index, (row, encoded, receipt) in enumerate(zip(rows, encoded_rows, fresh_records)):
            tensors = {name: dataset[index][0] for name, dataset in datasets.items()}
            tensors["prepared"] = prepared_tensor(encoded, receipt, index, prepared_directory)
            probabilities = {
                name: torch.softmax(model(tensor.unsqueeze(0)) / checkpoint["temperature"], 1)[0].numpy().tolist()
                for name, tensor in tensors.items()}
            probabilities["vision"] = receipt["probabilities"]
            probabilities["historical_raw"] = old_rows[row["id"]]["torch_probabilities"]
            probabilities["historical_vision"] = old_native[row["id"]]["probabilities"]
            output_rows.append({"id": row["id"], "source_sha256": sha256(Path(row["path"])),
                                "native_receipt": receipt, "probabilities": probabilities})
            if index % 50 == 0:
                print(f"Pixel-bound CPU comparison {index + 1}/{len(rows)}", flush=True)
    arms = ["raw", "imported", "prepared", "vision", "historical_raw", "historical_vision"]
    arrays = {name: np.asarray([row["probabilities"][name] for row in output_rows]) for name in arms}
    pairs = (("raw", "imported"), ("imported", "prepared"), ("prepared", "vision"),
             ("imported", "vision"), ("raw", "vision"), ("historical_raw", "raw"), ("historical_vision", "vision"))
    comparisons = {f"{a}_to_{b}": compare(ids, arrays[a], arrays[b]) for a, b in pairs}
    report = {**contract, "recipe_sha256": sha256(args.output / "recipe.json"),
              "native_sha256": sha256(current_native_path), "sample_count": len(rows),
              "elapsed_seconds": time.monotonic() - started, "comparisons": comparisons, "rows": output_rows}
    (args.output / "report.json").write_text(json.dumps(report, indent=2) + "\n")
    print(json.dumps({key: value for key, value in report.items() if key != "rows"}, indent=2))


if __name__ == "__main__":
    main()
