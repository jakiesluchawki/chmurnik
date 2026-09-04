"""Hash-checked, zip-backed DLR cloud segmentation data; no private photos."""

from __future__ import annotations

import argparse
from collections import Counter, defaultdict
import csv
from datetime import datetime
import hashlib
import io
import json
from pathlib import Path, PurePosixPath
import random
import stat
import zipfile

import numpy as np
from PIL import Image


FILES = {
    "kontas_2017.zip": (15626097, "c3f4d1731cbd6da4832b92908b864c5a"),
    "test_set.zip": (1198235, "ded931e66433e73f92e2992a08ef7394"),
    "classes.yaml": (86, "bbc359ebd76c8a6ec06f064e4a15f425"),
    "meta_data.yaml": (502, "d3e0ed3304b91bee1e8224e80cd308d6"),
}
ROLES = {"train", "validation", "test", "test-overlap"}


def sha256(path):
    digest = hashlib.sha256()
    with Path(path).open("rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def verify_sources(root):
    result = {}
    for name, (size, md5) in FILES.items():
        path = root / name
        if path.stat().st_size != size or hashlib.md5(path.read_bytes()).hexdigest() != md5:
            raise ValueError(f"Published checksum/length mismatch: {name}")
        result[name] = {"bytes": size, "md5": md5, "sha256": sha256(path)}
    record = json.loads((root / "record.json").read_text())
    if str(record["id"]) != "16647156" or record["metadata"]["license"]["id"] != "cc-by-4.0":
        raise ValueError("Unexpected source identity or license")
    result["record.json"] = {"sha256": sha256(root / "record.json")}
    return result


def check_archive(archive):
    names = set()
    for info in archive.infolist():
        path = PurePosixPath(info.filename)
        if (path.is_absolute() or ".." in path.parts or "\\" in info.filename
                or info.filename in names or stat.S_ISLNK(info.external_attr >> 16)
                or info.file_size > 8 * 1024 * 1024):
            raise ValueError(f"Unsafe/duplicate ZIP member: {info.filename}")
        names.add(info.filename)
    if sum(info.file_size for info in archive.infolist()) > 128 * 1024 * 1024:
        raise ValueError("Archive exceeds decoded size bound")
    return names


def binary_labels(mask):
    mask = np.asarray(mask)
    if mask.ndim != 2 or not np.isin(mask, [0, 1, 2, 3, 4]).all():
        raise ValueError("Expected a two-dimensional DLR class-index mask")
    return (mask >= 2).astype(np.float32), (mask != 0).astype(np.float32)


def fingerprint(image):
    image = image.convert("RGB")
    digest = hashlib.sha256(image.tobytes() + str(image.size).encode()).hexdigest()
    small = np.asarray(image.convert("L").resize((17, 16), Image.Resampling.BILINEAR))
    value = 0
    for bit in (small[:, 1:] > small[:, :-1]).flat:
        value = (value << 1) | int(bit)
    return digest, f"{value:064x}"


def capture_info(name):
    path = PurePosixPath(name)
    if path.stem.startswith("asi_"):
        day = datetime.strptime(path.stem.split("_")[-1], "%y%m%d%H%M%S").date()
        camera = "Cloud_Cam_Kontas"
    else:
        day = datetime.strptime(path.stem.split("_")[0], "%Y%m%d%H%M%S").date()
        camera = path.parent.name
    return str(day), camera


def assign_groups(rows, seed=7042):
    parents = list(range(len(rows)))

    def find(i):
        while parents[i] != i:
            parents[i] = parents[parents[i]]
            i = parents[i]
        return i

    for i, left in enumerate(rows):
        for j in range(i):
            right = rows[j]
            if (left["day"] == right["day"]
                    or left["pixel_sha256"] == right["pixel_sha256"]
                    or (int(left["dhash"], 16) ^ int(right["dhash"], 16)).bit_count() <= 8):
                parents[find(i)] = find(j)
    groups = defaultdict(list)
    for i in range(len(rows)):
        groups[find(i)].append(rows[i])
    available = []
    for group in groups.values():
        group_id = min(row["pixel_sha256"] for row in group)[:20]
        held = any(row["published_split"] == "test" for row in group)
        for row in group:
            row["group"] = group_id
            row["split"] = ("test" if row["published_split"] == "test" else "test-overlap") if held else "train"
        if not held:
            available.append(group)
    available.sort(key=lambda group: group[0]["group"])
    random.Random(seed).shuffle(available)
    for group in available[:max(1, round(len(available) * .2))]:
        for row in group:
            row["split"] = "validation"
    validate_rows(rows)


def validate_rows(rows):
    groups, days = defaultdict(set), defaultdict(set)
    if len({row["id"] for row in rows}) != len(rows):
        raise ValueError("Duplicate row identifiers")
    for row in rows:
        role = row["split"]
        if role not in ROLES or (row["published_split"] == "test") != (role == "test"):
            raise ValueError("Published test was reassigned or unknown split")
        if role != "test-overlap":
            groups[row["group"]].add(role)
            days[row["day"]].add(role)
    if any(len(roles) > 1 for roles in [*groups.values(), *days.values()]):
        raise ValueError("Capture-day or duplicate split leakage")
    if not {"train", "validation", "test"} <= {row["split"] for row in rows}:
        raise ValueError("A required split is empty")


def read_pairs(root):
    rows = []
    for filename, expected_count in [("kontas_2017.zip", 770), ("test_set.zip", 48)]:
        with zipfile.ZipFile(root / filename) as archive:
            names = check_archive(archive)
            validation = set()
            if filename == "kontas_2017.zip":
                records = csv.reader(io.StringIO(archive.read("kontas_2017/validation.csv").decode()))
                next(records)
                validation = {record[0] for record in records if record}
            images = sorted(name for name in names if "/images/" in name and name.endswith(".jpg"))
            masks = {name for name in names if "/seg_masks/" in name and name.endswith(".png")}
            expected_masks = {str(PurePosixPath(name.replace("/images/", "/seg_masks/")).with_suffix(".png")) for name in images}
            if len(images) != expected_count or masks != expected_masks:
                raise ValueError("Incomplete or unexpected image/mask pairs")
            for name in images:
                mask_name = str(PurePosixPath(name.replace("/images/", "/seg_masks/")).with_suffix(".png"))
                with Image.open(io.BytesIO(archive.read(name))) as original, Image.open(io.BytesIO(archive.read(mask_name))) as labels:
                    image, mask = original.convert("RGB"), np.asarray(labels)
                    if image.size != labels.size or image.size != (512, 512):
                        raise ValueError("Unexpected image/mask geometry")
                    _, valid = binary_labels(mask)
                    if not valid.any():
                        raise ValueError("Image has no evaluable pixels")
                    pixel_sha, dhash = fingerprint(image)
                    day, camera = capture_info(name)
                    rows.append({"id": name, "archive": filename, "image": name, "mask": mask_name,
                                 "day": day, "camera": camera, "pixel_sha256": pixel_sha, "dhash": dhash,
                                 "mask_sha256": hashlib.sha256(archive.read(mask_name)).hexdigest(),
                                 "published_split": "test" if filename == "test_set.zip" else
                                 "validation" if PurePosixPath(name).stem in validation else "train"})
    return rows


def load_manifest(path):
    manifest = json.loads(Path(path).read_text())
    validate_rows(manifest["rows"])
    root = Path(path).parent
    if verify_sources(root) != manifest["files"]:
        raise ValueError("Data changed since manifest freeze")
    return manifest


def read_pair(root, row, size=256):
    with zipfile.ZipFile(root / row["archive"]) as archive:
        with Image.open(io.BytesIO(archive.read(row["image"]))) as original:
            image = original.convert("RGB").resize((size, size), Image.Resampling.BILINEAR)
        with Image.open(io.BytesIO(archive.read(row["mask"]))) as original:
            mask = original.resize((size, size), Image.Resampling.NEAREST)
            binary_labels(mask)
            return image, mask.copy()


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--root", type=Path, required=True)
    args = parser.parse_args()
    destination = args.root / "manifest.json"
    if destination.exists():
        raise ValueError("Preserve frozen manifest; do not overwrite")
    files = verify_sources(args.root)
    rows = read_pairs(args.root)
    assign_groups(rows)
    summary = {"rows": len(rows), "splits": dict(Counter(row["split"] for row in rows)),
               "groups": len({row["group"] for row in rows}),
               "days": {role: len({row["day"] for row in rows if row["split"] == role}) for role in sorted(ROLES)},
               "test_years": dict(Counter(row["day"][:4] for row in rows if row["split"] == "test")),
               "test_cameras": dict(Counter(row["camera"] for row in rows if row["split"] == "test"))}
    manifest = {"schema": 1, "dataset": "DLR Almeria segmentation 1.0.1", "record": "https://zenodo.org/records/16647156",
                "license": "CC-BY-4.0", "seed": 7042, "duplicate_distance": 8,
                "class_mapping": {"0": "ignore", "1": "clear sky", "2,3,4": "cloud"},
                "files": files, "summary": summary, "rows": rows}
    destination.write_text(json.dumps(manifest, indent=2) + "\n")
    print(json.dumps({**summary, "manifest_sha256": sha256(destination)}, indent=2), flush=True)


if __name__ == "__main__":
    main()
