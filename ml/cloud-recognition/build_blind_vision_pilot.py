"""Freeze a label-blind, two-framing VLM comparison; never update training data."""

from __future__ import annotations

import argparse
import hashlib
import json
import math
from pathlib import Path

from PIL import Image, ImageOps


SEED = "20260906-vision-pilot-1"
PER_CLASS = 2


def digest(data):
    return hashlib.sha256(data).hexdigest()


def ordered_key(row, stage):
    return digest(f"{SEED}:{stage}:{row['id']}".encode())


def select(manifest, baseline):
    rows = manifest["rows"]
    if len({row["id"] for row in rows}) != len(rows):
        raise ValueError("Duplicate source IDs")
    predictions = {row["id"]: row for row in baseline["rows"]}
    if len(predictions) != len(baseline["rows"]):
        raise ValueError("Duplicate baseline IDs")
    selected, used_groups = [], set()
    for label in range(len(manifest["classes"])):
        candidates = sorted(
            (row for row in rows if row["split"] == "test" and row["label"] == label),
            key=lambda row: ordered_key(row, "select"),
        )
        group_rows = []
        for row in candidates:
            if row["group"] in used_groups:
                continue
            previous = predictions.get(row["id"])
            if previous is None or any(previous[key] != row[key] for key in ("split", "label", "source", "group")):
                raise ValueError("Missing or changed baseline identity; do not replace the selected photo")
            group_rows.append(row)
            used_groups.add(row["group"])
            if len(group_rows) == PER_CLASS:
                break
        if len(group_rows) != PER_CLASS:
            raise ValueError("Insufficient unique test groups; do not relax the sample")
        selected.extend(group_rows)
    return sorted(selected, key=lambda row: ordered_key(row, "presentation"))


def crop_geometry(image):
    # Same bounded geometry as v4_baseline; PIL pixels are not UIKit parity.
    side = math.floor(min(image.size) * 0.902)
    if side < 1:
        raise ValueError("Image too small")
    left, top = (image.width - side) / 2, (image.height - side) / 2
    return image.transform((side, side), Image.Transform.AFFINE,
                           (1, 0, left, 0, 1, top), Image.Resampling.BICUBIC)


def build(manifest_path, baseline_path, output):
    manifest_bytes, baseline_bytes = manifest_path.read_bytes(), baseline_path.read_bytes()
    manifest, baseline = json.loads(manifest_bytes), json.loads(baseline_bytes)
    if baseline["manifest_sha256"] != digest(manifest_bytes):
        raise ValueError("Baseline manifest hash mismatch")
    if not baseline["preprocessing"].startswith("Native UIKit/Vision"):
        raise ValueError("Comparison requires measured native baseline")
    chosen = select(manifest, baseline)
    output.mkdir(parents=True, exist_ok=False)
    predictions = {row["id"]: row for row in baseline["rows"]}
    evidence = {"seed": SEED, "manifest_sha256": digest(manifest_bytes),
                "baseline_sha256": digest(baseline_bytes), "per_class": PER_CLASS,
                "scope": "Previously exposed test regression; source-label agreement, not fresh confirmation",
                "training_ready": False, "source_label_key": [], "arms": {"a": [], "b": []}}
    for arm in evidence["arms"]:
        (output / arm).mkdir()
    for number, row in enumerate(chosen, 1):
        photo_id = f"P{number:03d}"
        source = Path(row["path"])
        with Image.open(source) as original:
            image = ImageOps.exif_transpose(original).convert("RGB")
        pixel_sha = digest(image.tobytes() + str(image.size).encode())
        if pixel_sha != row["pixel_sha256"]:
            raise ValueError(f"Changed source pixels: {photo_id}")
        for arm, pixels in (("a", image), ("b", crop_geometry(image))):
            path = output / arm / f"{photo_id}.png"
            pixels.save(path)
            evidence["arms"][arm].append({"photo_id": photo_id, "image_file": path.name,
                                         "sha256": digest(path.read_bytes()), "size": list(pixels.size)})
        evidence["source_label_key"].append({"photo_id": photo_id, "source_id": row["id"],
                                            "group": row["group"], "source": row["source"],
                                            "source_label": manifest["classes"][row["label"]],
                                            "source_sha256": digest(source.read_bytes()),
                                            "native_baseline": predictions[row["id"]]})
    for arm, items in evidence["arms"].items():
        (output / arm / "images.json").write_text(json.dumps(items, indent=2) + "\n")
    (output / "PRIVATE-COMPARISON-KEY.json").write_text(json.dumps(evidence, indent=2) + "\n")
    return evidence


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--manifest", type=Path, required=True)
    parser.add_argument("--baseline", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()
    receipt = build(args.manifest, args.baseline, args.output)
    print(json.dumps({"photos": len(receipt["source_label_key"]),
                      "arms": {arm: len(items) for arm, items in receipt["arms"].items()},
                      "key_sha256": digest((args.output / "PRIVATE-COMPARISON-KEY.json").read_bytes())}))
