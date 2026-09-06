"""Frozen development-only GLOBE sample; preserve partial source labels."""

import argparse
import collections
import csv
import hashlib
import json
from pathlib import Path
import shutil

from PIL import Image, ImageDraw, ImageOps

from audit_globe_photos import audit_photo, PER_FILE_LIMIT
from globe_gaze_data import DIRECTIONS, MD5, photo_fields, read_observations


ALLOWED = {
    "Stratocumulus": ["Stratocumulus"],
    "Cirrocumulus/Altocumulus": ["Cirrocumulus", "Altocumulus"],
    "Cirrus/Cirrostratus": ["Cirrus", "Cirrostratus"],
    "Altostratus/Stratus": ["Altostratus", "Stratus"],
    "Cumulus": ["Cumulus"],
    "Clearsky": ["Clear"],
}
TOTAL_LIMIT = 150_000_000


def select(observations, excluded, per_category=64):
    if type(per_category) is not int or per_category < 1 or per_category > 64:
        raise ValueError("Invalid fixed sample size")
    candidates = []
    for observation in observations:
        oid = observation["Observation Number"]
        if oid in excluded:
            continue
        for direction in DIRECTIONS:
            photo = photo_fields(observation, direction)
            if (photo is None or photo["status"] != "classified" or len(photo["labels"]) != 1
                    or photo["labels"][0] not in ALLOWED or photo["agreement"] < .8 or photo["count"] < 5):
                continue
            category = photo["labels"][0]
            candidates.append({"observation_id": oid, "direction": direction, "url": photo["url"],
                               "date": observation["Measurement Date (UTC)"], "source_category": category,
                               "allowed_genera": ALLOWED[category], "agreement": photo["agreement"],
                               "classification_count": photo["count"], "split": "train",
                               "sort_key": hashlib.sha256(f"9042:{oid}:{direction}".encode()).hexdigest()})
    chosen, seen, urls = [], set(excluded), set()
    for category in ALLOWED:
        available = sorted((row for row in candidates if row["source_category"] == category),
                           key=lambda row: row["sort_key"])
        count = 0
        for row in available:
            if row["observation_id"] in seen or row["url"] in urls:
                continue
            chosen.append({"id": f"G{len(chosen) + 1:03d}", **row})
            seen.add(row["observation_id"])
            urls.add(row["url"])
            count += 1
            if count == per_category:
                break
    return {"schema": 1, "source_md5": MD5, "seed": 9042, "photos": chosen,
            "per_category_limit": per_category, "excluded_observations": sorted(excluded),
            "scope": "development-only crowd partial labels; no fresh test or expert ground truth",
            "max_file_bytes": PER_FILE_LIMIT, "max_total_bytes": TOTAL_LIMIT}


def freeze(path, value):
    if path.exists():
        if json.loads(path.read_text()) != value:
            raise ValueError(f"Frozen artifact differs: {path.name}")
    else:
        with path.open("x") as stream:
            json.dump(value, stream, indent=2)
            stream.write("\n")


def render(selection, state, output):
    rows = selection["photos"]
    for start in range(0, len(rows), 24):
        sheet = Image.new("RGB", (1600, 1500), "#f5f3ef")
        draw = ImageDraw.Draw(sheet)
        draw.text((12, 6), "Technical visual screen only / full frames / source labels unchanged", fill="black")
        for index, row in enumerate(rows[start:start + 24]):
            x, y = index % 4 * 400, 24 + index // 4 * 245
            info = state.get(row["id"], {})
            if info.get("status") == "downloaded":
                with Image.open(output / "photos" / f"{row['id']}.jpg") as original:
                    image = ImageOps.exif_transpose(original).convert("RGB")
                    image.thumbnail((390, 216))
                    sheet.paste(image, (x + (400 - image.width) // 2, y + (216 - image.height) // 2))
            else:
                draw.text((x + 15, y + 80), "DOWNLOAD FAILED", fill="red")
            draw.text((x + 8, y + 216), f"{row['id']}  {row['source_category']}", fill="black")
            draw.text((x + 8, y + 229), f"{row['date']} / {row['direction']}", fill="black")
        sheet.save(output / f"contact-{start // 24 + 1:02d}.jpg", quality=90)


def screen_fingerprints(rows, existing, max_distance=8):
    exclusions = collections.defaultdict(list)
    for index, row in enumerate(rows):
        for other in [*existing, *rows[:index]]:
            same = row["pixel_sha256"] == other["pixel_sha256"]
            distance = (int(row["dhash"], 16) ^ int(other["dhash"], 16)).bit_count()
            if same or distance <= max_distance:
                reason = {"other_id": other["id"], "pixel_equal": same, "dhash_distance": distance}
                exclusions[row["id"]].append(reason)
                if index and other in rows[:index]:
                    exclusions[other["id"]].append({**reason, "other_id": row["id"]})
    return dict(exclusions)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--source", type=Path, required=True)
    parser.add_argument("--previous-selection", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--download", action="store_true")
    args = parser.parse_args()
    if hashlib.md5(args.source.read_bytes()).hexdigest() != MD5:
        raise ValueError("Pinned CSV checksum mismatch")
    with args.source.open(newline="") as stream:
        observations, _ = read_observations(stream)
    previous = json.loads(args.previous_selection.read_text())
    selection = select(observations, set(previous["development_only_observation_ids"]))
    args.output.mkdir(parents=True, exist_ok=True)
    freeze(args.output / "selection.json", selection)
    print(json.dumps({"selected": len(selection["photos"]),
                      "categories": dict(collections.Counter(row["source_category"] for row in selection["photos"])),
                      "dates": dict(collections.Counter(row["date"] for row in selection["photos"]))}), flush=True)
    if not args.download:
        return
    photos = args.output / "photos"
    photos.mkdir(exist_ok=True)
    state_path = args.output / "downloads.json"
    state = json.loads(state_path.read_text()) if state_path.exists() else {}
    used = 0
    for index, row in enumerate(selection["photos"]):
        if shutil.disk_usage(args.output).free < 2 * 1024 ** 3:
            raise RuntimeError("Keep 2 GiB free for other host tasks")
        previous = state.get(row["id"], {})
        if previous.get("status") == "failed":
            info = previous
        else:
            info = audit_photo(row, photos / f"{row['id']}.jpg", min(PER_FILE_LIMIT, TOTAL_LIMIT - used), previous)
        state[row["id"]] = info
        if info["status"] == "downloaded":
            used += info["bytes"]
        temporary = state_path.with_suffix(".tmp")
        temporary.write_text(json.dumps(state, indent=2) + "\n")
        temporary.replace(state_path)
        if (index + 1) % 24 == 0:
            print(json.dumps({"completed": index + 1, "bytes": used}), flush=True)
    render(selection, state, args.output)
    print(json.dumps({"downloaded": sum(r["status"] == "downloaded" for r in state.values()),
                      "bytes": used, "selection_sha256": hashlib.sha256((args.output / "selection.json").read_bytes()).hexdigest()}), flush=True)


if __name__ == "__main__":
    main()
