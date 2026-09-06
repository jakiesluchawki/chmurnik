"""Paired development-only training with explicitly unresolved GLOBE labels."""

import argparse
import collections
import copy
import csv
import hashlib
import json
from pathlib import Path
import time

import numpy as np
from PIL import Image, ImageOps
import torch
from sklearn.metrics import confusion_matrix, f1_score
from torch.utils.data import DataLoader, TensorDataset

from dinov2_model import DINOV2_REVISION, FeatureMLP
from globe_partial_data import ALLOWED, freeze, screen_fingerprints
from labels import GENERA
from model import build_model
from train_v4 import TrainingImages
from train_v4_kernel import development_cache
from train_v4_linear import validate_feature_cache
from v4_checkpoint import atomic_save
from v4_data import image_fingerprint, validate_manifest


REVIEW_ACTIONS = {"include", "exclude_person", "exclude_unusable", "exclude_invalid"}
REVIEW_FIELDS = ["id", "sha256", "action", "note"]
BAR = .6545474034701404
BACKBONE_CHECKPOINT_SHA256 = "2363831b37253517daeddb82fe31b852893db31d393e0ca4bd9b6a9a671263ac"
ORIGINAL_CACHE_SHA256 = {
    "train": "74e2116e9358198404267608a74b192e173bb3f289f9cb6cc937ec99d8a6b4b7",
    "validation": "0376ac821a6c9cc587d117e72d3a13c95c31ee84a201783c1c2bc69a40c87ef1",
}


def sha(path):
    with path.open("rb") as stream:
        return hashlib.file_digest(stream, "sha256").hexdigest()


def allowed_mask(names):
    canonical = ["clear_sky" if name == "Clear" else name.lower() for name in names]
    if not canonical or len(canonical) != len(set(canonical)) or any(name not in GENERA for name in canonical):
        raise ValueError("Invalid partial genus set")
    return torch.tensor([name in canonical for name in GENERA], dtype=torch.bool)


def original_cache(cached, rows, digest, views):
    # Original caches predate the optional identity field; hashes and replay bind them.
    if cached.get("identity") is not None:
        raise ValueError("Original unmasked Small cache identity mismatch")
    return development_cache(cached, rows, digest, views)


def feature_parity(actual, expected):
    if (actual.shape != expected.shape or not torch.isfinite(actual).all()
            or not torch.isfinite(expected).all()):
        raise ValueError("Invalid backbone/cache parity geometry")
    error = float((actual - expected).abs().max())
    if error > .001:
        raise ValueError(f"Backbone does not reproduce the original feature cache: {error}")
    return error


@torch.inference_mode()
def bind_original_caches(model, manifest, datasets):
    result = {}
    for split, views, per_source in (("train", 2, 16), ("validation", 1, 8)):
        rows = [r for r in manifest["rows"] if r["split"] == split]
        indices = []
        for source in sorted({r["source"] for r in rows}):
            choices = [i for i, r in enumerate(rows) if r["source"] == source]
            choices.sort(key=lambda i: hashlib.sha256(f"9042:{rows[i]['id']}".encode()).digest())
            indices.extend(choices[:per_source])
        selected = [rows[i] for i in indices]
        for row in selected:
            path = Path(row["path"])
            if "artifact_sha256" in row:
                if sha(path) != row["artifact_sha256"]:
                    raise ValueError("Prepared original training artifact changed")
            elif image_fingerprint(path)[0] != row["pixel_sha256"]:
                raise ValueError("Original development photograph changed")
        actual = []
        for images, _ in DataLoader(TrainingImages(selected, 224), batch_size=4):
            values = [model.features(images)]
            if views == 2:
                values.append(model.features(images.flip(3)))
            actual.append(torch.stack(values, dim=1).reshape(-1, 768))
        cache_indices = [i * views + view for i in indices for view in range(views)]
        error = feature_parity(torch.cat(actual), datasets[split][0][cache_indices])
        result[split] = {"ids": [r["id"] for r in selected], "views": views, "max_abs_error": error}
    return result


def partial_loss(logits, allowed):
    if (logits.ndim != 2 or allowed.shape != logits.shape or allowed.dtype != torch.bool
            or not allowed.any(dim=1).all() or not torch.isfinite(logits).all()):
        raise ValueError("Invalid partial-supervision batch")
    return (torch.logsumexp(logits, dim=1)
            - torch.logsumexp(logits.masked_fill(~allowed, -torch.inf), dim=1)).mean()


def full_frame(image, size=224):
    image = ImageOps.exif_transpose(image).convert("RGB")
    factor = size / max(image.size)
    width, height = [max(1, round(value * factor)) for value in image.size]
    resized = np.asarray(image.resize((width, height), Image.Resampling.BILINEAR))
    dx, dy = size - width, size - height
    padded = np.pad(resized, ((dy // 2, dy - dy // 2), (dx // 2, dx - dx // 2), (0, 0)), mode="edge")
    return torch.from_numpy(padded.copy()).permute(2, 0, 1).float().div(255)


def read_reviews(path, photos, downloads):
    with path.open(newline="") as stream:
        reader = csv.DictReader(stream)
        if reader.fieldnames != REVIEW_FIELDS:
            raise ValueError("Unexpected visual-review columns")
        rows = list(reader)
    expected = {r["id"] for r in photos if downloads[r["id"]]["status"] == "downloaded"}
    if len(rows) != len(expected) or {r["id"] for r in rows} != expected:
        raise ValueError("Every downloaded photograph needs exactly one review decision")
    for row in rows:
        if row["sha256"] != downloads[row["id"]]["sha256"] or row["action"] not in REVIEW_ACTIONS:
            raise ValueError("Incomplete or mismatched visual review")
        if row["action"] != "include" and not row["note"].strip():
            raise ValueError("An exclusion must state its technical reason")
    return {r["id"]: r for r in rows}


def prepare(sample, manifest):
    selection = json.loads((sample / "selection.json").read_text())
    downloads = json.loads((sample / "downloads.json").read_text())
    fingerprints = []
    for row in selection["photos"]:
        if (row["split"] != "train" or row["source_category"] not in ALLOWED
                or row["allowed_genera"] != ALLOWED[row["source_category"]]):
            raise ValueError("Do not relabel or change the role of auxiliary photographs")
        result = downloads[row["id"]]
        if result["status"] != "downloaded":
            continue
        path = sample / "photos" / f"{row['id']}.jpg"
        if sha(path) != result["sha256"]:
            raise ValueError("Downloaded photograph changed")
        pixel_sha, dhash = image_fingerprint(path)
        fingerprints.append({**row, "pixel_sha256": pixel_sha, "dhash": f"{dhash:064x}",
                             "sha256": result["sha256"], "path": str(path.resolve())})
    # Only identity fingerprints, never old evaluation labels/predictions, enter admission.
    existing = [{key: row[key] for key in ("id", "pixel_sha256", "dhash")} for row in manifest["rows"]]
    excluded = screen_fingerprints(fingerprints, existing)
    freeze(sample / "fingerprints.json", fingerprints)
    freeze(sample / "overlap-screen.json", excluded)
    review_path = sample / "visual-review.csv"
    if not review_path.exists():
        with review_path.open("x", newline="") as stream:
            writer = csv.DictWriter(stream, fieldnames=REVIEW_FIELDS)
            writer.writeheader()
            writer.writerows({"id": r["id"], "sha256": r["sha256"], "action": "", "note": ""} for r in fingerprints)
        print(json.dumps({"review_required": len(fingerprints), "overlap_flagged": len(excluded)}), flush=True)
        return None
    reviews = read_reviews(review_path, selection["photos"], downloads)
    admitted = [r for r in fingerprints if r["id"] not in excluded and reviews[r["id"]]["action"] == "include"]
    counts = collections.Counter(r["source_category"] for r in admitted)
    evidence = {"photos": admitted, "selection_sha256": sha(sample / "selection.json"),
                "downloads_sha256": sha(sample / "downloads.json"), "review_sha256": sha(review_path),
                "overlap_sha256": sha(sample / "overlap-screen.json"), "category_counts": dict(counts),
                "scope": "technical visual screen by Codex; source crowd labels unchanged; development only",
                "date_counts": dict(collections.Counter(r["date"] for r in admitted)),
                "eligible": len(admitted) >= 240 and all(counts[c] >= 32 for c in ALLOWED)}
    freeze(sample / "admitted.json", evidence)
    if not evidence["eligible"]:
        raise ValueError(f"Admission minimum not met: {dict(counts)}")
    return evidence


@torch.inference_mode()
def extract(model, admitted, output, identity):
    path = output / "auxiliary-features.pt"
    ids = [r["id"] for r in admitted]
    expected = {"identity": identity, "revision": DINOV2_REVISION, "views": 2,
                "size": 224, "preprocess": "full-frame-edge-pad"}
    chunks, completed = [], 0
    if path.exists():
        saved = torch.load(path, weights_only=True)
        completed = validate_feature_cache(saved, expected, ids, 2, 768)
        chunks.append(saved["features"])
    for start in range(completed, len(admitted), 4):
        batch = []
        for row in admitted[start:start + 4]:
            with Image.open(row["path"]) as image:
                batch.append(full_frame(image))
        images = torch.stack(batch)
        values = torch.stack([model.features(images), model.features(images.flip(3))], dim=1).reshape(-1, 768)
        if not torch.isfinite(values).all():
            raise ValueError("Non-finite auxiliary features")
        chunks.append(values)
        completed = start + len(batch)
        if completed % 48 == 0 or completed == len(admitted):
            merged = torch.cat(chunks)
            atomic_save({**expected, "completed": completed, "ids": ids[:completed], "features": merged}, path)
            chunks = [merged]
            print(json.dumps({"features": completed, "total": len(admitted)}), flush=True)
    return torch.cat(chunks)


def fit_arm(x, y, validation, vy, auxiliary, masks, sample_weights, output, enabled):
    torch.manual_seed(7042)
    head = FeatureMLP(len(GENERA))
    head.mean.copy_(x.mean(0))
    head.scale.copy_(x.std(0).clamp(min=1e-6))
    counts = torch.bincount(y, minlength=len(GENERA))
    if (counts == 0).any():
        raise ValueError("Original training is missing a genus")
    criterion = torch.nn.CrossEntropyLoss(weight=counts.max().float().div(counts).sqrt(), label_smoothing=.05)
    optimizer = torch.optim.AdamW(head.parameters(), lr=.001, weight_decay=.01)
    scheduler = torch.optim.lr_scheduler.CosineAnnealingLR(optimizer, 200, eta_min=.00001)
    loader = DataLoader(TensorDataset(x, y), batch_size=64, shuffle=True, generator=torch.Generator().manual_seed(7042))
    aux_generator = torch.Generator().manual_seed(9042)
    history, best, best_epoch, selected = [], -1., 0, None
    step = 0
    for epoch in range(1, 201):
        head.train()
        for features, labels in loader:
            optimizer.zero_grad(set_to_none=True)
            loss = criterion(head(features), labels)
            if enabled:
                indices = torch.multinomial(sample_weights, 32, replacement=True, generator=aux_generator)
                # Auxiliary dropout must not consume the original arm's random stream.
                with torch.random.fork_rng(devices=[]):
                    torch.manual_seed(9042 + step)
                    loss = loss + .5 * partial_loss(head(auxiliary[indices]), masks[indices])
            loss.backward()
            optimizer.step()
            step += 1
        scheduler.step()
        head.eval()
        with torch.inference_mode():
            logits = head(validation).detach().clone()
            predicted = logits.argmax(1)
        row = {"epoch": epoch, "correct": int((predicted == vy).sum()), "total": len(vy),
               "accuracy": float((predicted == vy).float().mean()),
               "macro_f1": float(f1_score(vy, predicted, labels=list(range(len(GENERA))), average="macro", zero_division=0))}
        history.append(row)
        if row["macro_f1"] > best:
            best, best_epoch = row["macro_f1"], epoch
            selected = {"state": copy.deepcopy(head.state_dict()), "validation": row, "logits": logits,
                        "confusion": confusion_matrix(vy, predicted, labels=list(range(len(GENERA)))).tolist()}
            atomic_save(selected, output / "head.pt")
        (output / "history.json").write_text(json.dumps(history, indent=2) + "\n")
        if epoch % 10 == 0:
            print(json.dumps({"arm": "partial" if enabled else "control", **row, "best_epoch": best_epoch}), flush=True)
        if epoch >= 30 and epoch - best_epoch >= 20:
            break
    return {"validation": selected["validation"], "epochs": epoch, "head_sha256": sha(output / "head.pt")}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--sample", type=Path, required=True)
    parser.add_argument("--manifest", type=Path, required=True)
    parser.add_argument("--features", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--prepare-only", action="store_true")
    args = parser.parse_args()
    manifest = json.loads(args.manifest.read_text())
    validate_manifest(manifest["rows"])
    admitted = prepare(args.sample, manifest)
    if admitted is None or args.prepare_only:
        return
    if (args.output / "evaluation.json").exists():
        raise ValueError("Preserve the completed partial-supervision trial")
    torch.set_num_threads(2)
    digest = sha(args.manifest)
    datasets = {}
    for split, views in (("train", 2), ("validation", 1)):
        rows = [r for r in manifest["rows"] if r["split"] == split]
        cache_path = args.features / f"{split}-features.pt"
        if sha(cache_path) != ORIGINAL_CACHE_SHA256[split]:
            raise ValueError("Pinned original development feature cache changed")
        cache = torch.load(cache_path, weights_only=True)
        features = original_cache(cache, rows, digest, views)
        datasets[split] = (torch.from_numpy(features).float(), torch.tensor(np.repeat([r["label"] for r in rows], views)))
    source_path = args.features / "cloud-genus-net.pt"
    if sha(source_path) != BACKBONE_CHECKPOINT_SHA256:
        raise ValueError("Pinned original extraction checkpoint changed")
    source = torch.load(source_path, weights_only=True)
    if (source["manifest_sha256"] != digest or source["backbone_revision"] != DINOV2_REVISION
            or source["input_size"] != 224 or source["classes"] != GENERA
            or source["preprocess"] != "center_crop" or source["crop_fraction"] != .902
            or source["architecture"] != "dinov2_vits14_linear"):
        raise ValueError("Frozen backbone provenance mismatch")
    args.output.mkdir(parents=True, exist_ok=True)
    recipe = {"manifest_sha256": digest, "admitted_sha256": sha(args.sample / "admitted.json"),
              "backbone_checkpoint_sha256": sha(source_path), "revision": DINOV2_REVISION,
              "source_code_sha256": sha(Path(__file__)), "data_code_sha256": sha(Path(__file__).with_name("globe_partial_data.py")),
              "original_caches": {split: sha(args.features / f"{split}-features.pt") for split in datasets},
              "classes": GENERA, "seed": 7042, "auxiliary_seed": 9042, "auxiliary_weight": .5,
              "validation_bar": BAR, "calibration_opened": False, "holdouts_opened": False,
              "production_changed": False}
    freeze(args.output / "recipe.json", recipe)
    identity = sha(args.output / "recipe.json")
    model = build_model(len(GENERA), architecture=source["architecture"]).eval()
    model.load_state_dict(source["state_dict"], strict=True)
    binding = bind_original_caches(model, manifest, datasets)
    freeze(args.output / "cache-binding.json", binding)
    auxiliary = extract(model, admitted["photos"], args.output, identity)
    del model, source
    masks = torch.stack([allowed_mask(r["allowed_genera"]) for r in admitted["photos"]]).repeat_interleave(2, dim=0)
    counts = collections.Counter(r["source_category"] for r in admitted["photos"])
    weights = torch.tensor([1 / counts[r["source_category"]] for r in admitted["photos"]]).repeat_interleave(2)
    results = {}
    started = time.monotonic()
    for arm, enabled in (("control", False), ("partial", True)):
        output = args.output / arm
        if (output / "result.json").exists():
            result = json.loads((output / "result.json").read_text())
            if sha(output / "head.pt") != result["head_sha256"]:
                raise ValueError("Preserved selected head changed")
            results[arm] = result
            continue
        if output.exists():
            raise ValueError("Interrupted fit preserved; do not silently restart the arm")
        output.mkdir()
        result = fit_arm(*datasets["train"], *datasets["validation"], auxiliary, masks, weights, output, enabled)
        (output / "result.json").write_text(json.dumps(result, indent=2) + "\n")
        results[arm] = result
    selected = results["partial"]["validation"]["macro_f1"]
    evaluation = {"recipe_sha256": identity, "results": results, "admitted_counts": dict(counts),
                  "eligible_for_further_evaluation": selected >= BAR and selected > results["control"]["validation"]["macro_f1"],
                  "fresh_confirmation": False, "release_approved": False, "seconds": round(time.monotonic() - started, 1)}
    (args.output / "evaluation.json").write_text(json.dumps(evaluation, indent=2) + "\n")
    print(json.dumps(evaluation), flush=True)


if __name__ == "__main__":
    main()
