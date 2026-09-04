"""Freeze recognition v4 data without exposing calibration/test groups to training."""

from __future__ import annotations

import argparse
import hashlib
import json
import random
from collections import Counter, defaultdict
from pathlib import Path

import torch
from PIL import Image, ImageOps
from torchvision.transforms.functional import to_pil_image

from benchmark_curated import OUTLIERS, label as atlas_label
from benchmark_ensemble import common_holdout
from labels import CODE_TO_GENUS, GENERA
from train_ccsn import MEAN, STD, collect as collect_v2
from train_v3 import collect as collect_v3, random_split


def image_fingerprint(path: Path) -> tuple[str, int]:
    import numpy as np
    with Image.open(path) as original:
        image = ImageOps.exif_transpose(original).convert("RGB")
        digest = hashlib.sha256(image.tobytes() + str(image.size).encode()).hexdigest()
        small = np.asarray(image.convert("L").resize((17, 16), Image.Resampling.BILINEAR))
        value = 0
        for bit in (small[:, 1:] > small[:, :-1]).flat:
            value = (value << 1) | int(bit)
    return digest, value


def group_fingerprints(rows: list[dict], distance: int = 8) -> list[list[int]]:
    parents = list(range(len(rows)))

    def find(i):
        while parents[i] != i:
            parents[i] = parents[parents[i]]
            i = parents[i]
        return i

    for i, left in enumerate(rows):
        for j in range(i):
            right = rows[j]
            if left["pixel_sha256"] == right["pixel_sha256"] or (int(left["dhash"], 16) ^ int(right["dhash"], 16)).bit_count() <= distance:
                parents[find(i)] = find(j)
    groups = defaultdict(list)
    for i in range(len(rows)):
        groups[find(i)].append(i)
    return list(groups.values())


def assign_groups(rows: list[dict], groups: list[list[int]], seed: int) -> None:
    candidates = defaultdict(list)
    for indices in groups:
        group = [rows[i] for i in indices]
        group_id = min(row["pixel_sha256"] for row in group)[:20]
        held_roles = {row["reserved"] for row in group}
        labels = {row["label"] for row in group if row["source"] in {"ccsn", "clear"}}
        if "diagnostic" in held_roles or "stress" in held_roles:
            split = "external-overlap"
        elif len(labels) > 1:
            split = "conflicting-labels"
        elif "test" in held_roles:
            split = "test"
        elif "calibration" in held_roles:
            split = "calibration"
        elif labels == {-1}:
            split = "outlier"
        else:
            split = "unassigned"
            if labels:
                candidates[next(iter(labels))].append(indices)
        for row in group:
            row["group"] = group_id
            row["split"] = row["reserved"] if row["reserved"] in {"diagnostic", "stress"} else split
    for label, label_groups in sorted(candidates.items()):
        random.Random(seed + label * 101).shuffle(label_groups)
        validation_target = max(1, round(sum(len(group) for group in label_groups) * 0.15))
        count = 0
        for indices in label_groups:
            split = "validation" if count < validation_target else "train"
            count += len(indices)
            for index in indices:
                rows[index]["split"] = split


def validate_manifest(rows: list[dict]) -> None:
    by_group = defaultdict(set)
    for row in rows:
        by_group[row["group"]].add(row["split"])
    for group, roles in by_group.items():
        active = roles & {"train", "validation", "calibration", "test", "confirmatory"}
        if len(active) > 1 or (active and roles & {"diagnostic", "stress"}):
            raise ValueError(f"Split leakage in group {group}: {sorted(roles)}")
    counts = Counter(row["label"] for row in rows if row["split"] == "train")
    if any(counts[label] < 15 for label in range(len(GENERA))):
        raise ValueError(f"Insufficient training data after exclusions: {dict(counts)}")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--data", type=Path, required=True)
    parser.add_argument("--clear", type=Path, required=True)
    parser.add_argument("--atlas", type=Path, required=True)
    parser.add_argument("--stress", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--seed", type=int, default=42)
    args = parser.parse_args()
    args.output.mkdir(parents=True, exist_ok=True)
    destination = args.output / "manifest.json"
    if destination.exists():
        raise ValueError("Frozen manifest already exists; use a new output directory to revise the experiment")
    base, _ = collect_v2(args.data, args.seed)
    candidate, _, _ = collect_v3(args.data, args.seed, 8)
    common = common_holdout(base, candidate, args.seed + 9001)
    reserved = {str(path.resolve()): name for name, samples in common.items() for path, _ in samples}
    rows = []

    def add(path, label, source, role="available", identifier=None):
        digest, dhash = image_fingerprint(path)
        rows.append({"id": identifier or f"{source}/{path.parent.name}/{path.name}",
                     "path": str(path.resolve()), "label": label, "source": source,
                     "reserved": role, "pixel_sha256": digest, "dhash": f"{dhash:064x}"})

    for code, genus in CODE_TO_GENUS.items():
        for path in sorted((args.data / code).glob("*.jpg")):
            add(path, GENERA.index(genus), "ccsn", reserved.get(str(path.resolve()), "available"))
    for path in sorted((args.data / "Ct").glob("*.jpg")):
        add(path, -1, "ccsn", "outlier")
    clear = torch.load(args.clear, map_location="cpu", weights_only=True)
    clear_split = random_split(len(clear["images"]), args.seed + 8101)
    held = clear_split["val"] + clear_split["test"]
    import numpy as np
    np.random.default_rng(args.seed + 9101).shuffle(held)
    middle = len(held) // 2
    clear_reserved = {index: "calibration" for index in held[:middle]}
    clear_reserved.update({index: "test" for index in held[middle:]})
    (args.output / "clear").mkdir(exist_ok=True)
    for index, tensor in enumerate(clear["images"]):
        path = args.output / "clear" / f"{index:04d}.png"
        to_pil_image((tensor * STD + MEAN).clamp(0, 1)).save(path)
        add(path, len(GENERA) - 1, "clear", clear_reserved.get(index, "available"), f"clear/{clear['filenames'][index]}")
    for path in sorted(args.atlas.glob("*.jpg")):
        add(path, atlas_label(path), "atlas", "diagnostic")
    for genus in GENERA[:-1]:
        for path in sorted((args.stress / genus).glob("*.jpg")):
            add(path, GENERA.index(genus), "ccaim-old", "stress")
    for path in OUTLIERS:
        if path.exists():
            add(path, -1, "project-outlier", "diagnostic")
    groups = group_fingerprints(rows)
    assign_groups(rows, groups, args.seed + 4200)
    validate_manifest(rows)
    summary = {"rows": len(rows), "groups": len(groups), "splits": dict(Counter(row["split"] for row in rows)),
               "train_classes": {GENERA[label]: count for label, count in sorted(Counter(row["label"] for row in rows if row["split"] == "train").items())}}
    manifest = {"schema": 1, "seed": args.seed, "duplicate_distance": 8, "classes": GENERA,
                "sources": {"ccsn": "https://doi.org/10.7910/DVN/CADDPD", "clear": "https://huggingface.co/datasets/jcamier/cloud_sky_vis", "stress": "local June 2026 CCAiM snapshot; not the September 916-image version"},
                "summary": summary, "rows": rows}
    encoded = json.dumps(manifest, ensure_ascii=False, indent=2) + "\n"
    destination.write_text(encoded)
    print(json.dumps({**summary, "sha256": hashlib.sha256(encoded.encode()).hexdigest()}, indent=2), flush=True)


if __name__ == "__main__":
    main()
