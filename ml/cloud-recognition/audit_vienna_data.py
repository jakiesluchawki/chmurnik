"""Inspect the pinned Vienna training data without inventing photo-level labels."""

import argparse
import collections
import csv
import hashlib
import json
from pathlib import Path


RECORD = 14185063
FILES = {
    "GroundTruth_train.csv": (848632, "1976ccca001a0bb2012d77ac59aeb2a0"),
    "img_train.nc": (837915407, "3718986550e7192d83e4e2181cc623e0"),
}
LEVELS = ("low", "middle", "high")


def validate_record(record):
    if (record.get("id") != RECORD
            or record.get("metadata", {}).get("license", {}).get("id") != "cc-by-4.0"):
        raise ValueError("Unexpected source record or license")
    files = {item["key"]: item for item in record["files"]}
    for name, (size, digest) in FILES.items():
        item = files.get(name, {})
        if item.get("size") != size or item.get("checksum") != f"md5:{digest}":
            raise ValueError("Pinned source file identity changed")


def verify_file(path, name):
    size, digest = FILES[name]
    if path.stat().st_size != size:
        raise ValueError(f"Incomplete or changed source file: {name}")
    with path.open("rb") as stream:
        if hashlib.file_digest(stream, "md5").hexdigest() != digest:
            raise ValueError(f"Source checksum mismatch: {name}")
    with path.open("rb") as stream:
        return hashlib.file_digest(stream, "sha256").hexdigest()


def read_labels(stream):
    observations = []
    for line, row in enumerate(csv.reader(stream), 1):
        if len(row) != 30 or any(value not in {"0", "1"} for value in row):
            raise ValueError(f"Invalid 30-column binary label at row {line}")
        codes = []
        for start in (0, 10, 20):
            positives = [index for index, value in enumerate(row[start:start + 10]) if value == "1"]
            if len(positives) > 1:
                raise ValueError(f"Multiple codes within one SYNOP level at row {line}")
            # All-zero level is unobserved, not the explicit code 0 (no cloud).
            codes.append(positives[0] if positives else None)
        if codes[0] is None:
            raise ValueError(f"Missing low-level observation at row {line}")
        observations.append(tuple(codes))
    if not observations:
        raise ValueError("Empty source labels")
    return observations


def label_profile(observations):
    counts = {}
    for column, level in enumerate(LEVELS):
        frequencies = collections.Counter(row[column] for row in observations)
        counts[level] = {**{str(code): frequencies[code] for code in range(10)},
                         "unobserved": frequencies[None]}
    return {
        "observations": len(observations),
        "level_code_counts": counts,
        "explicitly_cloud_free_all_levels": sum(row == (0, 0, 0) for row in observations),
        "unobserved_at_least_one_level": sum(None in row for row in observations),
        "observed_cloudy_level_counts": dict(collections.Counter(
            sum(code is not None and code > 0 for code in row) for row in observations)),
        "labels_apply_to": "four directional views jointly; not individual photos or cloud regions",
        "unobserved_policy": "unknown/masked supervision; never a negative cloud-presence label",
        "training_admitted": False,
        "fresh_test": False,
    }


def hdf_inventory(path, rows):
    import h5py
    import numpy as np

    inventory = []
    with h5py.File(path, "r") as handle:
        def inspect(name, item):
            if isinstance(item, h5py.Dataset):
                inventory.append({"name": name, "shape": list(item.shape),
                                  "dtype": str(item.dtype), "compression": item.compression,
                                  "attribute_names": sorted(item.attrs)})
        handle.visititems(inspect)
        if "Full_period" not in handle:
            raise ValueError("Source has no Full_period image array")
        images = handle["Full_period"]
        if images.shape != (rows, 4, 64, 100, 3):
            raise ValueError("Image/label count or four-direction RGB geometry mismatch")
        if not np.issubdtype(images.dtype, np.number):
            raise ValueError("Non-numeric image array")
        for index in sorted({0, rows // 2, rows - 1}):
            image = images[index]
            if not np.isfinite(image).all() or image.min() < 0 or image.max() > 255:
                raise ValueError("Invalid source RGB range")
        return {"datasets": inventory, "root_attribute_names": sorted(handle.attrs),
                "observation_geometry": list(images.shape[1:]),
                "observation_count": images.shape[0], "directional_image_count": rows * 4,
                "checked_rgb_rows": sorted({0, rows // 2, rows - 1}),
                "temporal_grouping_verified": False,
                "individual_genus_annotations_available": False}


def image_reuse_profile(path, observations):
    import h5py
    import numpy as np

    bags, views = collections.defaultdict(list), collections.Counter()
    with h5py.File(path, "r") as handle:
        images = handle["Full_period"]
        if images.shape != (len(observations), 4, 64, 100, 3):
            raise ValueError("Unexpected four-view geometry")
        for start in range(0, len(observations), 64):
            chunk = images[start:start + 64]
            if (not np.isfinite(chunk).all() or chunk.min() < 0 or chunk.max() > 255
                    or not np.equal(chunk, np.floor(chunk)).all()):
                raise ValueError("Cannot fingerprint invalid RGB values as bytes")
            for offset, bag in enumerate(chunk.astype(np.uint8)):
                fingerprints = [hashlib.sha256(view.tobytes()).hexdigest() for view in bag]
                views.update(fingerprints)
                # Direction permutation must not hide reuse of the same four views.
                identity = hashlib.sha256("".join(sorted(fingerprints)).encode()).hexdigest()
                bags[identity].append(start + offset)
    repeated = [indices for indices in bags.values() if len(indices) > 1]
    conflicts = [indices for indices in repeated if len({observations[i] for i in indices}) > 1]
    return {"unique_exact_bags": len(bags), "repeated_bag_groups": len(repeated),
            "extra_exact_bag_rows": sum(len(indices) - 1 for indices in repeated),
            "conflicting_exact_bag_groups": conflicts,
            "unique_exact_directional_images": len(views),
            "extra_exact_directional_images": sum(count - 1 for count in views.values()),
            "scan_scope": "all training rows; byte-normalized RGB; direction-invariant exact bag identity",
            "temporal_or_near_duplicate_exclusion_proven": False}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--directory", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--images", action="store_true")
    parser.add_argument("--scan-reuse", action="store_true")
    args = parser.parse_args()
    if args.output.exists():
        raise ValueError("Preserve the previous audit")
    validate_record(json.loads((args.directory / "record.json").read_text()))
    labels_path = args.directory / "GroundTruth_train.csv"
    digest = verify_file(labels_path, labels_path.name)
    with labels_path.open(newline="") as stream:
        labels = read_labels(stream)
    result = {"record": RECORD, "license": "CC-BY-4.0", "training_label_sha256": digest,
              **label_profile(labels)}
    if args.images or args.scan_reuse:
        images_path = args.directory / "img_train.nc"
        result["training_image_sha256"] = verify_file(images_path, images_path.name)
        result["hdf"] = hdf_inventory(images_path, len(labels))
        if args.scan_reuse:
            result["reuse"] = image_reuse_profile(images_path, labels)
    args.output.write_text(json.dumps(result, indent=2) + "\n")
    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()
