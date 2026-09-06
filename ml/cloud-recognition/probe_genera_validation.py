"""Single fixed diagnostic of numeric-only Genera on reused validation photos."""
import argparse
import hashlib
import json
from pathlib import Path
import time

import numpy as np
from PIL import Image
import torch
from sklearn.metrics import confusion_matrix

from audit_genera_archive import ARCHIVE_SHA256, CLASSES, inspect_archive, unique_object
from genera_numeric import NumericGenera
from labels import GENERA
from probe_v4_mac_import import verify_source_row
from train_v4_dinob import MANIFEST_SHA256, metrics, sha256
from v4_data import validate_manifest


CONTROL_SHA256 = "671382d070d721e4e31d699516264ceffc60bf8231129b24d73b96a8b25a4dbe"
SOURCE_LABELS = ("Altocumulus", "Altostratus", "Cirrocumulus", "Cirrostratus", "Cirrus",
                 "Clear Sky", "Contrail", "Cumulonimbus", "Cumulus", "Nimbostratus",
                 "Stratocumulus", "Stratus")


def validate_labels(data):
    mapping = json.loads(data, object_pairs_hook=unique_object)
    if (mapping.get("int_to_label") != {str(i): name for i, name in enumerate(SOURCE_LABELS)}
            or mapping.get("label_to_int") != {name: i for i, name in enumerate(SOURCE_LABELS)}):
        raise ValueError("Published label order mismatch")


def mapped_top(probabilities):
    mapping = np.array([GENERA.index(name) if name in GENERA else -1 for name in CLASSES])
    return mapping[probabilities.argmax(1)]


def result_metrics(rows, predictions):
    labels = np.array([row["label"] for row in rows])
    return {**metrics(labels, predictions), "correct": int(np.sum(labels == predictions)),
            "count": len(rows), "unsupported": int(np.sum(predictions < 0)),
            "confusion_labels": [-1] + list(range(len(GENERA))),
            "confusion": confusion_matrix(labels, predictions, labels=[-1] + list(range(len(GENERA)))).tolist()}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--archive", required=True, type=Path)
    parser.add_argument("--labels", required=True, type=Path)
    parser.add_argument("--manifest", required=True, type=Path)
    parser.add_argument("--control", required=True, type=Path)
    parser.add_argument("--output", required=True, type=Path)
    parser.add_argument("--device", choices=("cpu", "mps"), default="cpu")
    args = parser.parse_args()
    if args.output.exists():
        raise ValueError("Preserve earlier Genera diagnostic output")
    if sha256(args.manifest) != MANIFEST_SHA256 or sha256(args.control) != CONTROL_SHA256:
        raise ValueError("Frozen manifest or control mismatch")
    label_bytes = args.labels.read_bytes()
    blob = hashlib.sha1(b"blob " + str(len(label_bytes)).encode() + b"\0" + label_bytes).hexdigest()
    if blob != "de3351f9951fa0f408eb65542a8dcef8ebc18bfb":
        raise ValueError("Pinned label JSON mismatch")
    validate_labels(label_bytes)
    manifest = json.loads(args.manifest.read_text())
    validate_manifest(manifest["rows"])
    rows = [row for row in manifest["rows"] if row["split"] == "validation"]
    if len(rows) != 452 or len({row["id"] for row in rows}) != 452:
        raise ValueError("Unexpected validation rows")
    for row in rows:
        verify_source_row(row)
    control = torch.load(args.control, weights_only=True, map_location="cpu")
    if control["validation_ids"] != [row["id"] for row in rows]:
        raise ValueError("Control validation order mismatch")
    control_logits = control["validation_logits"].numpy()
    if control_logits.shape != (452, 11) or not np.isfinite(control_logits).all():
        raise ValueError("Control logit matrix invalid")
    config, arrays, audit = inspect_archive(args.archive)
    if audit["function_markers"]:
        raise ValueError("Serialized function marker prevents numeric probe")
    torch.set_num_threads(2)
    model = NumericGenera(config, arrays).eval().requires_grad_(False).to(args.device)
    del arrays
    root = Path(__file__).parent
    recipe = {"archive_sha256": ARCHIVE_SHA256, "labels_sha256": sha256(args.labels),
              "manifest_sha256": MANIFEST_SHA256, "control_sha256": CONTROL_SHA256,
              "classes": CLASSES, "device": args.device, "input": "whole RGB Pillow BICUBIC 299x299 /255; no EXIF transform",
              "code_sha256": {name: sha256(root / name) for name in
                  ("audit_genera_archive.py", "genera_numeric.py", "probe_genera_validation.py", "probe_v4_mac_import.py")},
              "runtime": {"torch": torch.__version__, "numpy": np.__version__, "pillow": Image.__version__},
              "development_only": True, "training_overlap_unknown": True,
              "calibration_evaluated": False, "holdouts_evaluated": False,
              "keras_deserialized": False, "author_code_executed": False, "release_approved": False}
    args.output.mkdir()
    (args.output / "recipe.json").write_text(json.dumps(recipe, indent=2) + "\n")
    records, latencies = [], []
    with torch.inference_mode():
        for index, row in enumerate(rows):
            with Image.open(row["path"]) as original:
                rgb = original.convert("RGB").resize((299, 299), Image.Resampling.BICUBIC)
                values = np.asarray(rgb, dtype=np.float32) / np.float32(255)
            tensor = torch.from_numpy(values).permute(2, 0, 1)[None].contiguous().to(args.device)
            if args.device == "mps":
                torch.mps.synchronize()
            start = time.monotonic()
            logits = model(tensor).cpu()[0]
            latencies.append(time.monotonic() - start)
            probabilities = logits.softmax(0).numpy()
            if not np.isfinite(probabilities).all() or not np.isclose(probabilities.sum(), 1):
                raise ValueError("Non-finite or invalid output")
            records.append({"id": row["id"], "label": row["label"], "source": row["source"],
                            "source_sha256": sha256(Path(row["path"])),
                            "input_hwc_float32_sha256": hashlib.sha256(values.tobytes()).hexdigest(),
                            "logits": logits.tolist(), "probabilities": probabilities.tolist()})
            if index % 25 == 0:
                print(json.dumps({"completed": index + 1, "total": len(rows),
                                  "last_seconds": latencies[-1]}), flush=True)
    probabilities = np.array([record["probabilities"] for record in records])
    predictions = mapped_top(probabilities)
    control_predictions = control_logits.argmax(1)
    candidate_score = result_metrics(rows, predictions)
    control_score = result_metrics(rows, control_predictions)
    results = {**recipe, "recipe_sha256": sha256(args.output / "recipe.json"),
               "control": control_score, "candidate": candidate_score,
               "development_bar_passed": all(candidate_score[key] > control_score[key] for key in ("accuracy", "macro_f1")),
               "timing_seconds": {"first": latencies[0], "warm_median": float(np.median(latencies[1:])), "sum": sum(latencies)},
               "by_source": {}, "observations": records}
    for source in sorted({row["source"] for row in rows}):
        indices = [i for i, row in enumerate(rows) if row["source"] == source]
        subset = [rows[i] for i in indices]
        results["by_source"][source] = {"control": result_metrics(subset, control_predictions[indices]),
                                           "candidate": result_metrics(subset, predictions[indices])}
    (args.output / "evaluation.json").write_text(json.dumps(results, indent=2) + "\n")
    print(json.dumps({key: value for key, value in results.items() if key not in ("observations", "by_source")}, indent=2))


if __name__ == "__main__":
    main()
