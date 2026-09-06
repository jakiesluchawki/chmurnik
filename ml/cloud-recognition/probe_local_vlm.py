"""Frozen local VLM diagnostic; no model fitting, remote inference or release."""
import argparse
from collections import Counter
import hashlib
import importlib.metadata
import json
import math
import os
from pathlib import Path
import resource
import statistics
import time

from PIL import Image, ImageOps
from labels import GENERA

MANIFEST_SHA = "d5b0ca33e0867bbb0d0fd25dbd08fc20cfeea316a89299e53f63a6bee5d0ea1c"
CONTROL_SHA = "671382d070d721e4e31d699516264ceffc60bf8231129b24d73b96a8b25a4dbe"
REVISION = "2fd8dacbdb8f1e54b8c005f081ec5bf79c56376b"
WEIGHT_SHA = "90eeb02604181dbcccd0a30a1f550a4a8928ca7dcbee4aee1449239306cfdfca"
CODES = "ABCDEFGHIJKX"
PROMPT = """Classify the most prominent cloud structure visible in this sky photograph.
Use only visible evidence, not an assumed location, season, altitude or forecast.
Choose one code:
A: Cirrus
B: Cirrocumulus
C: Cirrostratus
D: Altocumulus
E: Altostratus
F: Nimbostratus
G: Stratocumulus
H: Stratus
I: Cumulus
J: Cumulonimbus
K: Clearly visible sky without clouds
X: Cannot identify reliably from this photograph
Reply with only the single uppercase code, without explanation."""


def sha(path):
    with Path(path).open("rb") as stream:
        return hashlib.file_digest(stream, "sha256").hexdigest()


def save(path, value):
    temp = path.with_suffix(path.suffix + ".partial")
    temp.write_text(json.dumps(value, indent=2, allow_nan=False) + "\n")
    temp.replace(path)


def parse_code(text):
    code = text.strip() if isinstance(text, str) else ""
    if len(code) != 1 or code not in CODES:
        return -1, "invalid"
    return (CODES.index(code), "answer") if code != "X" else (-1, "refused")


def full_frame(image):
    result = ImageOps.exif_transpose(image).convert("RGB")
    result.thumbnail((448, 448), Image.Resampling.LANCZOS)
    return result


def validate_records(inputs, records, contract):
    if len({row["id"] for row in inputs}) != len(inputs) or len(records) > len(inputs):
        raise ValueError("Duplicate input IDs or excessive results")
    for expected, actual in zip(inputs, records):
        if (actual["id"] != expected["id"] or actual["input_sha256"] != expected["sha256"]
                or actual["contract"] != contract):
            raise ValueError("Prediction input or contract mismatch")
        if not isinstance(actual["text"], str) or not math.isfinite(actual["seconds"]) or actual["seconds"] < 0:
            raise ValueError("Invalid output receipt")
    return len(records)


def score(rows, predictions):
    if not rows or len(rows) != len(predictions):
        raise ValueError("Complete prediction population required")
    matrix = [[0] * 12 for _ in GENERA]
    for row, predicted in zip(rows, predictions):
        if type(predicted) is not int or not -1 <= predicted < 11 or not 0 <= row["label"] < 11:
            raise ValueError("Invalid genus index")
        matrix[row["label"]][predicted if predicted >= 0 else 11] += 1
    f1 = []
    for label in range(11):
        true_positive = matrix[label][label]
        denominator = sum(matrix[label]) + sum(r[label] for r in matrix)
        f1.append(2 * true_positive / denominator if denominator else 0.)
    correct = sum(matrix[i][i] for i in range(11))
    return {"count": len(rows), "correct": correct, "accuracy": correct / len(rows),
            "macro_f1": sum(f1) / 11, "per_class_f1": dict(zip(GENERA, f1)),
            "confusion_columns": GENERA + ["unanswered"], "confusion_matrix": matrix}


def compare(rows, records):
    if ([row["id"] for row in rows] != [r["id"] for r in records]
            or len({r["id"] for r in records}) != len(records)):
        raise ValueError("Result IDs missing, duplicated or out of order")
    parsed = [parse_code(r["text"]) for r in records]
    predictions = [p[0] for p in parsed]
    baseline = [row["control_prediction"] for row in rows]
    selected = {}
    for index, row in enumerate(rows):
        group = row.get("group", row["id"])
        if group in selected and rows[selected[group]]["label"] != row["label"]:
            raise ValueError("Contradictory validation group")
        if group not in selected or row["source_id"] < rows[selected[group]]["source_id"]:
            selected[group] = index
    grouped = sorted(selected.values())
    result = {"baseline": score(rows, baseline), "candidate": score(rows, predictions),
              "responses": dict(Counter(p[1] for p in parsed)),
              "grouped_baseline": score([rows[i] for i in grouped], [baseline[i] for i in grouped]),
              "grouped_candidate": score([rows[i] for i in grouped], [predictions[i] for i in grouped]),
              "gains": sum(p == r["label"] and b != r["label"] for r, p, b in zip(rows, predictions, baseline)),
              "regressions": sum(p != r["label"] and b == r["label"] for r, p, b in zip(rows, predictions, baseline)),
              "release_approved": False}
    result["development_gain"] = all(result["candidate"][k] > result["baseline"][k] for k in ("accuracy", "macro_f1"))
    result["by_source"] = {}
    for source in sorted({r["source"] for r in rows}):
        ids = [i for i, r in enumerate(rows) if r["source"] == source]
        result["by_source"][source] = {"baseline": score([rows[i] for i in ids], [baseline[i] for i in ids]),
                                       "candidate": score([rows[i] for i in ids], [predictions[i] for i in ids])}
    return result


def prepare(args):
    # Source and control verification run in the existing Torch environment,
    # independently of the memory-bounded MLX inference process.
    import torch
    from v4_data import validate_manifest
    from probe_v4_mac_import import verify_source_row
    if sha(args.manifest) != MANIFEST_SHA or sha(args.control) != CONTROL_SHA:
        raise ValueError("Frozen manifest/control changed")
    manifest = json.loads(args.manifest.read_text())
    validate_manifest(manifest["rows"])
    rows = [row for row in manifest["rows"] if row["split"] == "validation"]
    control = torch.load(args.control, weights_only=True, map_location="cpu")
    if len(rows) != 452 or control["validation_ids"] != [r["id"] for r in rows]:
        raise ValueError("Validation population changed")
    args.output.mkdir(parents=True, exist_ok=False)
    images = args.output / "images"
    images.mkdir()
    inputs, key = [], []
    for index, row in enumerate(rows):
        verify_source_row(row)
        name = f"V{index:04d}"
        path = images / (name + ".png")
        with Image.open(row["path"]) as original:
            image = full_frame(original)
            image.save(path)
        inputs.append({"id": name, "file": path.name, "sha256": sha(path), "size": list(image.size)})
        key.append({"id": name, "source_id": row["id"], "source": row["source"], "group": row["group"],
                    "source_sha256": sha(row["path"]), "label": row["label"],
                    "control_prediction": int(control["validation_logits"][index].argmax())})
    save(args.output / "key.json", key)
    save(args.output / "inputs.json", {"manifest_sha256": MANIFEST_SHA, "control_sha256": CONTROL_SHA,
                                      "key_sha256": sha(args.output / "key.json"), "inputs": inputs})
    print(json.dumps({"prepared": len(inputs), "input_sha256": sha(args.output / "inputs.json")}))


def run(args):
    for name in ("HF_HUB_OFFLINE", "TRANSFORMERS_OFFLINE", "HF_HUB_DISABLE_TELEMETRY"):
        os.environ[name] = "1"
    os.environ["TOKENIZERS_PARALLELISM"] = "false"
    import mlx.core as mx
    import numpy as np
    from mlx_vlm import load
    from mlx_vlm.generate import stream_generate
    from mlx_vlm.prompt_utils import apply_chat_template
    from mlx_vlm.utils import load_config, prepare_inputs
    mx.set_memory_limit(4 * 1024**3)
    mx.set_cache_limit(128 * 1024**2)
    receipt = json.loads(args.model_receipt.read_text())
    if receipt["revision"] != REVISION:
        raise ValueError("Model revision changed")
    names = {entry["name"] for entry in receipt["files"]}
    if names != {p.name for p in args.model.iterdir() if p.is_file()} or "model.safetensors" not in names:
        raise ValueError("Unexpected/missing model files")
    for item in receipt["files"]:
        path = args.model / item["name"]
        if path.stat().st_size != item["bytes"] or sha(path) != item["sha256"]:
            raise ValueError("Model file identity mismatch")
    if sha(args.model / "model.safetensors") != WEIGHT_SHA:
        raise ValueError("Pinned model weight mismatch")
    mode = "smoke" if args.smoke else "validation"
    contract = {"runner_sha256": sha(__file__), "model_receipt_sha256": sha(args.model_receipt),
                "prompt": PROMPT, "max_tokens": 8, "temperature": 0., "mode": mode,
                "mlx_limit_bytes": 4 * 1024**3,
                "versions": {name: importlib.metadata.version(name) for name in
                             ("mlx", "mlx-vlm", "mlx-lm", "transformers", "Pillow", "numpy")}}
    if args.smoke:
        args.output.mkdir(parents=True, exist_ok=True)
        image = args.output / "blank.png"
        if not image.exists():
            Image.new("RGB", (224, 224), (127, 127, 127)).save(image)
        inputs = [{"id": "blank", "file": str(image.resolve()), "sha256": sha(image)}]
    else:
        pack = json.loads((args.output / "inputs.json").read_text())
        if pack["manifest_sha256"] != MANIFEST_SHA or len(pack["inputs"]) != 452:
            raise ValueError("Invalid prepared population")
        inputs = pack["inputs"]
        contract["inputs_sha256"] = sha(args.output / "inputs.json")
    state_path = args.output / (mode + "-results.json")
    records = json.loads(state_path.read_text())["records"] if state_path.exists() else []
    start_at = validate_records(inputs, records, contract)
    if start_at == len(inputs):
        raise ValueError("Completed trial already retained")
    state = {"contract": contract, "records": records, "status": "running"}
    save(state_path, state)
    try:
        load_start = time.monotonic()
        model, processor = load(str(args.model.resolve()), trust_remote_code=False)
        state["load_seconds"] = time.monotonic() - load_start
        config = load_config(str(args.model.resolve()))
        prompt = apply_chat_template(processor, config, PROMPT, num_images=1)
        state["formatted_prompt"] = prompt
        print(json.dumps({"loaded": True, "seconds": state["load_seconds"], "mlx_memory": mx.get_active_memory()}), flush=True)
        for item in inputs[start_at:]:
            image = Path(item["file"]) if args.smoke else args.output / "images" / item["file"]
            if image.name != item["file"] and not args.smoke:
                raise ValueError("Unexpected input path")
            if sha(image) != item["sha256"]:
                raise ValueError("Input bytes changed")
            prepared = prepare_inputs(processor, images=[str(image)], prompts=prompt,
                                      image_token_index=getattr(model.config, "image_token_index", None),
                                      add_special_tokens=True)
            tensors = {}
            for name, value in prepared.items():
                if isinstance(value, mx.array):
                    data = np.asarray(value.astype(mx.float32))
                    if not np.isfinite(data).all():
                        raise ValueError("Non-finite model input")
                    tensors[name] = {"shape": list(value.shape), "dtype": str(value.dtype),
                                     "float32_sha256": hashlib.sha256(data.tobytes()).hexdigest()}
            prepared["mask"] = prepared.pop("attention_mask", None)
            start = time.monotonic()
            text = ""
            for part in stream_generate(model, processor, prompt, temperature=0., max_tokens=8, **prepared):
                text += part.text
            records.append({"id": item["id"], "input_sha256": item["sha256"], "contract": contract,
                            "text": text, "seconds": time.monotonic() - start, "input_tensors": tensors,
                            "mlx_peak_bytes": mx.get_peak_memory(),
                            "process_peak_bytes_macos": resource.getrusage(resource.RUSAGE_SELF).ru_maxrss,
                            "prompt_tokens": part.prompt_tokens, "generation_tokens": part.generation_tokens})
            save(state_path, state)
            print(json.dumps({"completed": len(records), "total": len(inputs)}), flush=True)
            del prepared
            mx.clear_cache()
        state["status"] = "complete"
    except BaseException as error:
        state["status"] = "failed"
        state["error"] = f"{type(error).__name__}: {error}"
        raise
    finally:
        save(state_path, state)


def summarize(args):
    key = json.loads((args.output / "key.json").read_text())
    saved = json.loads((args.output / "validation-results.json").read_text())
    pack = json.loads((args.output / "inputs.json").read_text())
    if sha(args.output / "key.json") != pack["key_sha256"]:
        raise ValueError("Comparison key changed")
    if saved["status"] != "complete" or sha(args.output / "inputs.json") != saved["contract"]["inputs_sha256"]:
        raise ValueError("Incomplete or altered trial")
    if validate_records(pack["inputs"], saved["records"], saved["contract"]) != 452:
        raise ValueError("Incomplete prediction count")
    result = compare(key, saved["records"])
    result.update({"results_sha256": sha(args.output / "validation-results.json"), "key_sha256": sha(args.output / "key.json"),
                   "runtime_seconds": sum(r["seconds"] for r in saved["records"]),
                   "median_seconds": statistics.median(r["seconds"] for r in saved["records"]),
                   "mlx_peak_bytes": max(r["mlx_peak_bytes"] for r in saved["records"]),
                   "process_peak_bytes_macos": max(r["process_peak_bytes_macos"] for r in saved["records"])})
    if (args.output / "evaluation.json").exists():
        raise ValueError("Preserve completed evaluation")
    save(args.output / "evaluation.json", result)
    print(json.dumps({k: v for k, v in result.items() if k != "by_source"}, indent=2))


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("action", choices=("prepare", "run", "summarize"))
    parser.add_argument("--output", required=True, type=Path)
    parser.add_argument("--manifest", type=Path)
    parser.add_argument("--control", type=Path)
    parser.add_argument("--model", type=Path)
    parser.add_argument("--model-receipt", type=Path)
    parser.add_argument("--smoke", action="store_true")
    args = parser.parse_args()
    {"prepare": prepare, "run": run, "summarize": summarize}[args.action](args)
