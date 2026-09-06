"""Paired frozen-feature experiment with weak four-view positive constraints."""

import argparse
import collections
import copy
import csv
import hashlib
import json
from pathlib import Path

import numpy as np
from PIL import Image
from sklearn.metrics import confusion_matrix, f1_score
import torch
from torch.utils.data import DataLoader, TensorDataset

from dinov2_model import DINOV2_REVISION, FeatureMLP
from globe_partial_data import freeze
from labels import GENERA
from model import build_model
from probe_globe_partial import (BACKBONE_CHECKPOINT_SHA256, BAR, ORIGINAL_CACHE_SHA256,
                                 REVIEW_ACTIONS, REVIEW_FIELDS, bind_original_caches,
                                 full_frame, original_cache, sha)
from v4_checkpoint import atomic_save
from v4_data import image_fingerprint, validate_manifest
from vienna_bags import constraints, overlapping_bags


SOURCE_SHA256 = {
    "GroundTruth_train.csv": "682037e48cff55798df4851624f02f9434ab575c7f93a23d4456c662f9fa37c7",
    "img_train.nc": "1752637e1e0707f7236be424febde665eaa13c26aa6c2ac8c2709f213d30f9c3",
}


def bag_loss(logits, events):
    if (logits.ndim != 3 or logits.shape[1:] != (4, len(GENERA))
            or len(events) != len(logits) or not len(events) or not torch.isfinite(logits).all()):
        raise ValueError("Invalid four-view batch")
    logp = logits.log_softmax(-1)
    losses = []
    for index, groups in enumerate(events):
        if not groups or any(not group or len(group) != len(set(group))
                             or any(name not in GENERA for name in group) for group in groups):
            raise ValueError("Invalid positive constraints")
        if any("clear_sky" in group for group in groups):
            if list(map(list, groups)) != [["clear_sky"]]:
                raise ValueError("Clear supervision cannot coexist with clouds")
            losses.append(-logp[index, :, GENERA.index("clear_sky")].mean())
        else:
            losses.append(torch.stack([
                -torch.logsumexp(logp[index, :, [GENERA.index(name) for name in group]], -1).max()
                for group in groups]).mean())
    return torch.stack(losses).mean()


def verified_views(sample, bags):
    views = json.loads((sample / "views.json").read_text())
    by_id = {row["id"]: row for row in views}
    expected = {f"{bag['id']}-{view}" for bag in bags for view in range(4)}
    if len(by_id) != len(views) or set(by_id) != expected:
        raise ValueError("Every selected bag requires four unique source views")
    for bag in bags:
        images = []
        for view in range(4):
            row = by_id[f"{bag['id']}-{view}"]
            path = sample / "photos" / f"{row['id']}.png"
            pixel, dhash = image_fingerprint(path)
            if (row["bag_id"] != bag["id"] or row["sha256"] != sha(path)
                    or row["pixel_sha256"] != pixel or row["dhash"] != f"{dhash:064x}"):
                raise ValueError("Source view fingerprint changed")
            with Image.open(path) as image:
                values = np.asarray(image).copy()
                if image.mode != "RGB" or values.shape != (64, 100, 3):
                    raise ValueError("Original four-view geometry changed")
                images.append(values)
        if hashlib.sha256(np.stack(images).tobytes()).hexdigest() != bag["sha256"]:
            raise ValueError("Four-view bag identity changed")
    return views


def admitted_bags(sample, original):
    bags = json.loads((sample / "bags.json").read_text())
    selection = json.loads((sample / "selection.json").read_text())
    if (selection.get("seed") != 6042 or selection.get("source_sha256") != SOURCE_SHA256
            or [{key: value for key, value in row.items() if key != "sha256"} for row in bags]
            != selection.get("rows")):
        raise ValueError("Bags disagree with frozen source selection")
    for row in bags:
        index = row["row_index"]
        if type(index) is not int or not 0 <= index < 13912 or row["id"] != f"V{index:05d}":
            raise ValueError("Invalid selected source row")
    overlap = json.loads((sample / "overlap.json").read_text())
    views = verified_views(sample, bags)
    fingerprints = [{key: row[key] for key in ("id", "pixel_sha256", "dhash")} for row in original]
    if overlap != overlapping_bags(views, fingerprints):
        raise ValueError("Overlap report does not match verified views and current manifest")
    with (sample / "reviews.csv").open(newline="") as stream:
        reader = csv.DictReader(stream)
        if reader.fieldnames != REVIEW_FIELDS:
            raise ValueError("Invalid review header")
        reviews = list(reader)
    by_id = {r["id"]: r for r in bags}
    if len(by_id) != len(bags) or len(reviews) != len(bags) or {r["id"] for r in reviews} != set(by_id):
        raise ValueError("Every bag requires one technical review")
    for row in bags:
        expected = [list(event) for event in constraints(row["codes"])]
        if (row["split"] != "auxiliary-train" or row["events"] != expected
                or row["bucket"] not in {"+".join(event) for event in expected}):
            raise ValueError("Original constraint or source role changed")
    admitted = []
    for review in reviews:
        row = by_id[review["id"]]
        if (review["sha256"] != row["sha256"] or review["action"] not in REVIEW_ACTIONS
                or not review["note"].strip()):
            raise ValueError("Unfinished or mismatched technical review")
        if review["action"] == "include" and row["id"] not in overlap:
            admitted.append(row)
    counts = collections.Counter(row["bucket"] for row in admitted)
    if len(admitted) < 120 or sum(count >= 6 for count in counts.values()) < 8:
        raise ValueError(f"Predeclared admission minimum not met: {len(admitted)}, {dict(counts)}")
    # Preserve source selection order, independent of the review CSV's ordering.
    included = {row["id"] for row in admitted}
    return [row for row in bags if row["id"] in included]


@torch.inference_mode()
def extract(model, sample, bags, output, identity):
    path = output / "features.pt"
    photo_rows = {row["id"]: row for row in json.loads((sample / "views.json").read_text())}
    for bag in bags:
        images = []
        for view in range(4):
            name = f"{bag['id']}-{view}"
            photo_path = sample / "photos" / f"{name}.png"
            if sha(photo_path) != photo_rows[name]["sha256"]:
                raise ValueError("Frozen source view changed")
            with Image.open(photo_path) as image:
                images.append(np.asarray(image).copy())
        if hashlib.sha256(np.stack(images).tobytes()).hexdigest() != bag["sha256"]:
            raise ValueError("Four-view bag identity changed")
    ids = [bag["id"] for bag in bags]
    chunks, completed = [], 0
    if path.exists():
        cached = torch.load(path, weights_only=True)
        completed = cached.get("completed")
        if (cached.get("identity") != identity or type(completed) is not int
                or not 0 < completed <= len(bags) or cached.get("ids") != ids[:completed]
                or cached["features"].shape != (completed, 4, 768)
                or not torch.isfinite(cached["features"]).all()):
            raise ValueError("Invalid resumable four-view feature cache")
        chunks.append(cached["features"])
    for start in range(completed, len(bags), 2):
        batch = bags[start:start + 2]
        images = []
        for bag in batch:
            for view in range(4):
                with Image.open(sample / "photos" / f"{bag['id']}-{view}.png") as image:
                    images.append(full_frame(image))
        features = model.features(torch.stack(images)).reshape(len(batch), 4, 768)
        if not torch.isfinite(features).all():
            raise ValueError("Non-finite auxiliary features")
        chunks.append(features)
        completed = start + len(batch)
        if completed % 16 == 0 or completed == len(bags):
            merged = torch.cat(chunks)
            atomic_save({"identity": identity, "ids": ids[:completed], "completed": completed,
                         "features": merged}, path)
            chunks = [merged]
            print(json.dumps({"extracted_bags": completed, "total": len(bags)}), flush=True)
    return torch.cat(chunks)


def fit(x, y, vx, vy, auxiliary, bags, output, enabled):
    torch.manual_seed(7042)
    head = FeatureMLP(len(GENERA))
    head.mean.copy_(x.mean(0))
    head.scale.copy_(x.std(0).clamp(min=1e-6))
    counts = torch.bincount(y, minlength=len(GENERA))
    if (counts == 0).any():
        raise ValueError("Missing original training class")
    loss_fn = torch.nn.CrossEntropyLoss(weight=counts.max().float().div(counts).sqrt(), label_smoothing=.05)
    optimizer = torch.optim.AdamW(head.parameters(), lr=.001, weight_decay=.01)
    scheduler = torch.optim.lr_scheduler.CosineAnnealingLR(optimizer, 200, eta_min=.00001)
    loader = DataLoader(TensorDataset(x, y), batch_size=64, shuffle=True, generator=torch.Generator().manual_seed(7042))
    aux_generator = torch.Generator().manual_seed(6042)
    bucket_counts = collections.Counter(row["bucket"] for row in bags)
    weights = torch.tensor([1 / bucket_counts[row["bucket"]] for row in bags])
    history, best, best_epoch, selected, step = [], -1., 0, None, 0
    for epoch in range(1, 201):
        head.train()
        for features, labels in loader:
            optimizer.zero_grad(set_to_none=True)
            loss = loss_fn(head(features), labels)
            if enabled:
                indices = torch.multinomial(weights, 8, replacement=True, generator=aux_generator)
                with torch.random.fork_rng(devices=[]):
                    torch.manual_seed(6042 + step)
                    bag_logits = head(auxiliary[indices].reshape(-1, 768)).reshape(8, 4, len(GENERA))
                    loss = loss + .5 * bag_loss(bag_logits, [bags[i]["events"] for i in indices.tolist()])
            loss.backward()
            optimizer.step()
            step += 1
        scheduler.step()
        head.eval()
        with torch.inference_mode():
            logits = head(vx).detach().clone()
            predictions = logits.argmax(1)
        row = {"epoch": epoch, "correct": int((predictions == vy).sum()), "total": len(vy),
               "accuracy": float((predictions == vy).float().mean()),
               "macro_f1": float(f1_score(vy, predictions, labels=list(range(len(GENERA))), average="macro", zero_division=0))}
        history.append(row)
        if row["macro_f1"] > best:
            best, best_epoch = row["macro_f1"], epoch
            selected = {"state": copy.deepcopy(head.state_dict()), "validation": row, "logits": logits,
                        "confusion": confusion_matrix(vy, predictions, labels=list(range(len(GENERA)))).tolist()}
            atomic_save(selected, output / "head.pt")
        (output / "history.json").write_text(json.dumps(history, indent=2) + "\n")
        if epoch % 10 == 0:
            print(json.dumps({"arm": "bags" if enabled else "control", **row, "best_epoch": best_epoch}), flush=True)
        if epoch >= 30 and epoch - best_epoch >= 20:
            break
    return {"validation": selected["validation"], "epochs": epoch, "head_sha256": sha(output / "head.pt")}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--sample", type=Path, required=True)
    parser.add_argument("--manifest", type=Path, required=True)
    parser.add_argument("--features", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()
    if (args.output / "evaluation.json").exists():
        raise ValueError("Preserve completed trial")
    manifest = json.loads(args.manifest.read_text())
    validate_manifest(manifest["rows"])
    bags = admitted_bags(args.sample, manifest["rows"])
    digest = sha(args.manifest)
    datasets = {}
    for split, views in (("train", 2), ("validation", 1)):
        rows = [row for row in manifest["rows"] if row["split"] == split]
        path = args.features / f"{split}-features.pt"
        if sha(path) != ORIGINAL_CACHE_SHA256[split]:
            raise ValueError("Original feature cache identity changed")
        data = original_cache(torch.load(path, weights_only=True), rows, digest, views)
        datasets[split] = (torch.from_numpy(data).float(), torch.tensor(np.repeat([r["label"] for r in rows], views)))
    source_path = args.features / "cloud-genus-net.pt"
    if sha(source_path) != BACKBONE_CHECKPOINT_SHA256:
        raise ValueError("Original backbone checkpoint changed")
    source = torch.load(source_path, weights_only=True)
    if source["manifest_sha256"] != digest or source["classes"] != GENERA or source["backbone_revision"] != DINOV2_REVISION:
        raise ValueError("Backbone provenance mismatch")
    args.output.mkdir(parents=True, exist_ok=True)
    recipe = {"manifest_sha256": digest, "source_checkpoint_sha256": sha(source_path),
              "source_caches": ORIGINAL_CACHE_SHA256, "script_sha256": sha(Path(__file__)),
              "data_script_sha256": sha(Path(__file__).with_name("vienna_bags.py")),
              "shared_helper_sha256": sha(Path(__file__).with_name("probe_globe_partial.py")),
              "sample": {name: sha(args.sample / name) for name in
                         ("selection.json", "bags.json", "views.json", "overlap.json", "reviews.csv")},
              "admitted_ids": [row["id"] for row in bags], "auxiliary_weight": .5,
              "seed": 7042, "auxiliary_seed": 6042, "validation_bar": BAR,
              "fresh_confirmation": False, "calibration_opened": False, "test_opened": False,
              "production_changed": False}
    freeze(args.output / "recipe.json", recipe)
    identity = sha(args.output / "recipe.json")
    torch.set_num_threads(2)
    model = build_model(len(GENERA), architecture=source["architecture"]).eval()
    model.load_state_dict(source["state_dict"], strict=True)
    freeze(args.output / "cache-binding.json", bind_original_caches(model, manifest, datasets))
    auxiliary = extract(model, args.sample, bags, args.output, identity)
    del source, model
    results = {}
    for arm, enabled in (("control", False), ("bags", True)):
        path = args.output / arm
        if (path / "result.json").exists():
            result = json.loads((path / "result.json").read_text())
            if sha(path / "head.pt") != result["head_sha256"]:
                raise ValueError("Preserved head changed")
        else:
            if path.exists():
                raise ValueError("Preserve interrupted fit; do not silently restart")
            path.mkdir()
            result = fit(*datasets["train"], *datasets["validation"], auxiliary, bags, path, enabled)
            (path / "result.json").write_text(json.dumps(result, indent=2) + "\n")
        results[arm] = result
    evaluation = {"recipe_sha256": identity, "admitted_bags": len(bags), "results": results,
                  "eligible_for_further_evaluation": results["bags"]["validation"]["macro_f1"] >= BAR
                  and results["bags"]["validation"]["macro_f1"] > results["control"]["validation"]["macro_f1"],
                  "fresh_confirmation": False, "release_approved": False}
    freeze(args.output / "evaluation.json", evaluation)
    print(json.dumps(evaluation), flush=True)


if __name__ == "__main__":
    main()
