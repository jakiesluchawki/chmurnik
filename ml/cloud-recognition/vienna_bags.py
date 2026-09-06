"""Fixed auxiliary four-view sample with positive-only SYNOP constraints."""

import argparse
import collections
import csv
import hashlib
import json
from pathlib import Path

import h5py
import numpy as np
from PIL import Image, ImageDraw

from audit_vienna_data import read_labels, validate_record, verify_file
from globe_partial_data import freeze
from labels import GENERA
from v4_data import image_fingerprint, validate_manifest


def constraints(codes):
    if len(codes) != 3 or any(code is not None and (type(code) is not int or not 0 <= code <= 9) for code in codes):
        raise ValueError("Invalid SYNOP codes")
    if codes[0] is None:
        raise ValueError("Missing low-level observation")
    if tuple(codes) == (0, 0, 0):
        return [("clear_sky",)]
    low, middle, high = codes
    events = []
    if low in (1, 2, 8):
        events.append(("cumulus",))
    if low in (3, 9):
        events.append(("cumulonimbus",))
    if low in (4, 5, 8):
        events.append(("stratocumulus",))
    if low == 6:
        events.append(("stratus",))
    if low == 7:
        events.append(("cumulus", "stratus"))
    if middle == 1:
        events.append(("altostratus",))
    if middle == 2:
        events.append(("altostratus", "nimbostratus"))
    if middle is not None and 3 <= middle <= 9:
        events.append(("altocumulus",))
    if high is not None and 1 <= high <= 4:
        events.append(("cirrus",))
    if high is not None and 5 <= high <= 8:
        events.append(("cirrostratus",))
    if high == 9:
        events.append(("cirrocumulus",))
    return sorted(set(events))


def select(observations, per_bucket=16):
    if type(per_bucket) is not int or not 1 <= per_bucket <= 16:
        raise ValueError("Invalid fixed sample bound")
    by_bucket = collections.defaultdict(list)
    for index, codes in enumerate(observations):
        for event in constraints(codes):
            by_bucket[event].append(index)
    selected, used = [], set()
    for event in sorted(by_bucket, key=lambda key: (len(by_bucket[key]), key)):
        indices = sorted(by_bucket[event], key=lambda index: hashlib.sha256(f"6042:{index}".encode()).digest())
        count = 0
        for index in indices:
            if index in used:
                continue
            selected.append({"id": f"V{index:05d}", "row_index": index,
                             "codes": list(observations[index]), "events": [list(e) for e in constraints(observations[index])],
                             "bucket": "+".join(event), "split": "auxiliary-train"})
            used.add(index)
            count += 1
            if count == per_bucket:
                break
    return selected


def overlapping_bags(views, original, threshold=8):
    flagged = collections.defaultdict(list)
    for index, row in enumerate(views):
        for other in [*original, *views[:index]]:
            if row["bag_id"] == other.get("bag_id"):
                continue
            distance = (int(row["dhash"], 16) ^ int(other["dhash"], 16)).bit_count()
            same = row["pixel_sha256"] == other["pixel_sha256"]
            if same or distance <= threshold:
                flagged[row["bag_id"]].append({"view": row["id"], "other": other["id"],
                                               "pixel_equal": same, "distance": distance})
                if other.get("bag_id"):
                    flagged[other["bag_id"]].append({"view": other["id"], "other": row["id"],
                                                    "pixel_equal": same, "distance": distance})
    return dict(flagged)


def render(rows, output):
    for start in range(0, len(rows), 24):
        sheet = Image.new("RGB", (1600, 1810), "#f5f3ef")
        draw = ImageDraw.Draw(sheet)
        for index, row in enumerate(rows[start:start + 24]):
            x, y = index % 4 * 400, index // 4 * 300
            for view in range(4):
                with Image.open(output / "photos" / f"{row['id']}-{view}.png") as image:
                    sheet.paste(image.resize((200, 128), Image.Resampling.NEAREST), (x + view % 2 * 200, y + view // 2 * 128))
            draw.text((x + 5, y + 259), f"{row['id']} / SYNOP {row['codes']}", fill="black")
            draw.text((x + 5, y + 274), "TECHNICAL REVIEW ONLY", fill="black")
        sheet.save(output / f"contact-{start // 24 + 1:02d}.png")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--source", type=Path, required=True)
    parser.add_argument("--manifest", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()
    validate_record(json.loads((args.source / "record.json").read_text()))
    digests = {name: verify_file(args.source / name, name) for name in ("GroundTruth_train.csv", "img_train.nc")}
    with (args.source / "GroundTruth_train.csv").open(newline="") as stream:
        labels = read_labels(stream)
    rows = select(labels)
    if len({row["bucket"] for row in rows}) != 12:
        raise ValueError("Unexpected source constraint buckets")
    manifest = json.loads(args.manifest.read_text())
    validate_manifest(manifest["rows"])
    args.output.mkdir(parents=True, exist_ok=True)
    freeze(args.output / "selection.json", {"rows": rows, "source_sha256": digests, "seed": 6042,
                                            "scope": "weak four-view auxiliary training only; no individual-genus annotation"})
    (args.output / "photos").mkdir(exist_ok=True)
    views, bags = [], []
    with h5py.File(args.source / "img_train.nc", "r") as handle:
        data = handle["Full_period"]
        if data.shape != (len(labels), 4, 64, 100, 3):
            raise ValueError("Invalid image geometry")
        for row in rows:
            array = data[row["row_index"]]
            if not np.isfinite(array).all() or array.min() < 0 or array.max() > 255 or not np.equal(array, np.floor(array)).all():
                raise ValueError("Invalid original image values")
            source = array.astype(np.uint8)
            bag_sha = hashlib.sha256(source.tobytes()).hexdigest()
            bags.append({**row, "sha256": bag_sha})
            for view, values in enumerate(source):
                path = args.output / "photos" / f"{row['id']}-{view}.png"
                if path.exists():
                    with Image.open(path) as original:
                        if not np.array_equal(np.asarray(original), values):
                            raise ValueError("Preserved source photograph changed")
                else:
                    Image.fromarray(values).save(path)
                pixel, dhash = image_fingerprint(path)
                views.append({"id": f"{row['id']}-{view}", "bag_id": row["id"],
                              "path": str(path.resolve()), "sha256": hashlib.sha256(path.read_bytes()).hexdigest(),
                              "pixel_sha256": pixel, "dhash": f"{dhash:064x}"})
    original = [{key: row[key] for key in ("id", "pixel_sha256", "dhash")} for row in manifest["rows"]]
    overlap = overlapping_bags(views, original)
    freeze(args.output / "views.json", views)
    freeze(args.output / "bags.json", bags)
    freeze(args.output / "overlap.json", overlap)
    review = args.output / "reviews.csv"
    if not review.exists():
        with review.open("x", newline="") as stream:
            writer = csv.DictWriter(stream, fieldnames=["id", "sha256", "action", "note"])
            writer.writeheader()
            writer.writerows({"id": row["id"], "sha256": row["sha256"], "action": "", "note": ""} for row in bags)
    render(rows, args.output)
    print(json.dumps({"selected_bags": len(rows), "views": len(views), "overlap_flagged_bags": len(overlap),
                      "buckets": dict(collections.Counter(row["bucket"] for row in rows))}), flush=True)


if __name__ == "__main__":
    main()
