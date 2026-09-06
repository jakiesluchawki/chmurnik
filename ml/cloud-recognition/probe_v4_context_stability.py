"""Fixed six-view sensitivity diagnostic; validation only, no fit or policy change."""
import argparse
import hashlib
import json
from pathlib import Path
import time

import numpy as np
from PIL import Image, ImageOps
import torch
from torchvision import transforms

from labels import GENERA
from model import build_model
from probe_v4_mac_import import verify_source_row
from train_v4_dinob import MANIFEST_SHA256, metrics, sha256
from v4_checkpoint import atomic_save
from v4_data import validate_manifest
from v4_metrics import metrics as grouped_metrics


CHECKPOINT_SHA256 = "d63fd93f1c5dc6eb35935ebc4b3d5b11d230703a17ea62fbd923d16d31ef2f86"
CONTROL_SHA256 = "671382d070d721e4e31d699516264ceffc60bf8231129b24d73b96a8b25a4dbe"
VIEW_NAMES = ("center", "left_8", "right_8", "up_8", "down_8", "center_horizontal_flip")


def context_views(image):
    image = transforms.Resize(248)(image)
    left, top = round((image.width - 224) / 2), round((image.height - 224) / 2)
    boxes = [(left + dx, top + dy, left + dx + 224, top + dy + 224)
             for dx, dy in ((0, 0), (-8, 0), (8, 0), (0, -8), (0, 8))]
    if any(x < 0 or y < 0 or right > image.width or bottom > image.height for x, y, right, bottom in boxes):
        raise ValueError("Shifted crop outside resized photograph")
    tensor = transforms.ToTensor()
    values = [tensor(image.crop(box)) for box in boxes]
    values.append(values[0].flip(2))
    result = torch.stack(values)
    return result, {"resized_size": list(image.size), "boxes": [list(box) for box in boxes] + [list(boxes[0])],
                    "tensor_sha256": [hashlib.sha256(value.numpy().tobytes()).hexdigest() for value in result]}


def summarize(rows, logits):
    values = np.asarray(logits)
    if values.shape != (len(rows), 6, 11) or not np.isfinite(values).all():
        raise ValueError("Expected six finite eleven-class views per photograph")
    labels = np.array([row["label"] for row in rows])
    predictions = values.argmax(2)
    stable = np.all(predictions == predictions[:, :1], axis=1)
    mean_logits = values.mean(1)
    correct = predictions[:, 0] == labels
    scores = {}
    for name, output in (("center", values[:, 0]), ("fixed_mean", mean_logits)):
        predicted = output.argmax(1)
        exponentials = np.exp(output - output.max(1, keepdims=True))
        probabilities = exponentials / exponentials.sum(1, keepdims=True)
        observations = [{**row, "probabilities": probabilities[i].tolist()} for i, row in enumerate(rows)]
        scores[name] = {**metrics(labels, predicted), "correct": int(np.sum(predicted == labels)),
                        "count": len(rows), "grouped": grouped_metrics(observations,
                            {"minimum_confidence": 1.01, "margin_threshold": 1.})}
    subsets = {}
    for name, mask in (("stable", stable), ("unstable", ~stable)):
        subsets[name] = {"count": int(mask.sum()), "center_correct": int(np.sum(correct & mask)),
                         "center_agreement_with_source": float(correct[mask].mean()) if mask.any() else None}
    mean_correct = mean_logits.argmax(1) == labels
    return {"scores": scores, "stability_diagnostic_only": subsets,
            "corrected": int(np.sum(mean_correct & ~correct)), "regressed": int(np.sum(correct & ~mean_correct)),
            "view_top1_changes_vs_center": {name: int(np.sum(predictions[:, i] != predictions[:, 0]))
                                           for i, name in enumerate(VIEW_NAMES)},
            "development_gain": all(scores["fixed_mean"][key] > scores["center"][key] for key in ("accuracy", "macro_f1")),
            "release_approved": False}


def check_cache(saved, contract, rows, source_hashes):
    count = len(saved["records"])
    if saved["contract"] != contract or not 0 < count <= len(rows):
        raise ValueError("Context cache contract/count changed")
    values = saved["logits"]
    if tuple(values.shape) != (count, 6, 11) or values.dtype != torch.float32 or not torch.isfinite(values).all():
        raise ValueError("Context cache logits invalid")
    for index, record in enumerate(saved["records"]):
        if record["id"] != rows[index]["id"] or record["source_sha256"] != source_hashes[index]:
            raise ValueError("Context cache source identity mismatch")
    return count


@torch.inference_mode()
def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--manifest", required=True, type=Path)
    parser.add_argument("--checkpoint", required=True, type=Path)
    parser.add_argument("--control", required=True, type=Path)
    parser.add_argument("--output", required=True, type=Path)
    parser.add_argument("--device", choices=("cpu", "mps"), default="cpu")
    args = parser.parse_args()
    if (args.output / "evaluation.json").exists():
        raise ValueError("Preserve completed context diagnostic")
    if (sha256(args.manifest) != MANIFEST_SHA256 or sha256(args.checkpoint) != CHECKPOINT_SHA256
            or sha256(args.control) != CONTROL_SHA256):
        raise ValueError("Frozen input or checkpoint changed")
    manifest = json.loads(args.manifest.read_text())
    validate_manifest(manifest["rows"])
    rows = [row for row in manifest["rows"] if row["split"] == "validation"]
    if len(rows) != 452 or len({row["id"] for row in rows}) != 452:
        raise ValueError("Unexpected validation population")
    for row in rows:
        verify_source_row(row)
    source_hashes = [sha256(Path(row["path"])) for row in rows]
    control = torch.load(args.control, weights_only=True, map_location="cpu")
    if control["validation_ids"] != [row["id"] for row in rows]:
        raise ValueError("Control IDs changed")
    root = Path(__file__).parent
    contract = {"manifest_sha256": MANIFEST_SHA256, "checkpoint_sha256": CHECKPOINT_SHA256,
                "control_sha256": CONTROL_SHA256, "views": list(VIEW_NAMES), "device": args.device,
                "input": "EXIF transpose RGB; short side 248 BILINEAR; 224 crops at center and +/-8 px; center horizontal mirror",
                "code_sha256": {name: sha256(root / name) for name in
                    ("probe_v4_context_stability.py", "dinov2_model.py", "kernel_model.py", "model.py", "probe_v4_mac_import.py")},
                "aggregation": "equal arithmetic mean of all six raw logit vectors",
                "training": False, "calibration_evaluated": False, "holdouts_evaluated": False,
                "selection_ground_truth_available": False, "release_approved": False}
    args.output.mkdir(parents=True, exist_ok=True)
    path = args.output / "recipe.json"
    if path.exists() and json.loads(path.read_text()) != contract:
        raise ValueError("Earlier recipe differs")
    path.write_text(json.dumps(contract, indent=2) + "\n")
    values, records, completed = [], [], 0
    cache = args.output / "views.pt"
    if cache.exists():
        saved = torch.load(cache, weights_only=True, map_location="cpu")
        completed = check_cache(saved, contract, rows, source_hashes)
        values, records = list(saved["logits"]), saved["records"]
    checkpoint = torch.load(args.checkpoint, weights_only=True, map_location="cpu")
    torch.set_num_threads(2)
    model = build_model(11, architecture=checkpoint["architecture"], model_config=checkpoint["model_config"])
    model.load_state_dict(checkpoint["state_dict"])
    model = model.eval().requires_grad_(False).to(args.device)
    for index in range(completed, len(rows)):
        row = rows[index]
        with Image.open(row["path"]) as original:
            tensors, record = context_views(ImageOps.exif_transpose(original).convert("RGB"))
        start = time.monotonic()
        logits = model(tensors.to(args.device)).cpu()
        if tuple(logits.shape) != (6, 11) or not torch.isfinite(logits).all():
            raise ValueError("Unexpected context predictions")
        values.append(logits)
        records.append({**record, "id": row["id"], "source_sha256": source_hashes[index],
                        "six_view_seconds": time.monotonic() - start})
        if (index + 1) % 25 == 0 or index + 1 == len(rows):
            atomic_save({"contract": contract, "logits": torch.stack(values), "records": records}, cache)
            print(json.dumps({"completed": index + 1, "total": len(rows)}), flush=True)
    output = torch.stack(values).numpy()
    original = control["validation_logits"].numpy()
    control_error = float(np.max(np.abs(output[:, 0] - original)))
    control_changes = int(np.sum(output[:, 0].argmax(1) != original.argmax(1)))
    if control_error > .001 or control_changes:
        raise ValueError(f"Center control reproduction failed: {control_error}, {control_changes}")
    result = {**contract, "recipe_sha256": sha256(path), "views_sha256": sha256(cache),
              "control_max_logit_error": control_error, "control_top1_changes": control_changes,
              **summarize(rows, output), "by_source": {}}
    for source in sorted({row["source"] for row in rows}):
        indices = [i for i, row in enumerate(rows) if row["source"] == source]
        result["by_source"][source] = summarize([rows[i] for i in indices], output[indices])
    result["six_view_seconds"] = {"median": float(np.median([row["six_view_seconds"] for row in records])),
                                   "total": float(sum(row["six_view_seconds"] for row in records))}
    (args.output / "evaluation.json").write_text(json.dumps(result, indent=2) + "\n")
    print(json.dumps({key: value for key, value in result.items() if key not in ("by_source", "scores")}, indent=2))
    print(json.dumps({key: {k: v for k, v in value.items() if k != "grouped"} for key, value in result["scores"].items()}, indent=2))


if __name__ == "__main__":
    main()
