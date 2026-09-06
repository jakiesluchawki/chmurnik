"""Inspect the pinned Genera archive as data, never through Keras deserialization."""
import argparse
from collections import Counter
import hashlib
import io
import json
import os
from pathlib import Path
import zipfile

os.environ["HDF5_PLUGIN_PRELOAD"] = "::"
import h5py
import numpy as np


ARCHIVE_SHA256 = "d7f57ea9ac891d36648f6d690e2d207452de934c8a44f8d8e677cf7d4eba9c0e"
ARCHIVE_BYTES = 88386880
MEMBER_LIMITS = {"config.json": 65536, "metadata.json": 4096, "model.weights.h5": 90000000}
CLASSES = ("altocumulus", "altostratus", "cirrocumulus", "cirrostratus", "cirrus",
           "clear_sky", "contrail", "cumulonimbus", "cumulus", "nimbostratus",
           "stratocumulus", "stratus")


def digest(data):
    return hashlib.sha256(data).hexdigest()


def unique_object(pairs):
    result = {}
    for key, value in pairs:
        if key in result:
            raise ValueError("Duplicate JSON key")
        result[key] = value
    return result


def archive_members(data):
    with zipfile.ZipFile(io.BytesIO(data)) as archive:
        members = archive.infolist()
        if len(members) != len(MEMBER_LIMITS) or {m.filename for m in members} != set(MEMBER_LIMITS):
            raise ValueError("Unexpected or duplicate ZIP member")
        result = {}
        for member in members:
            if (member.file_size > MEMBER_LIMITS[member.filename] or member.flag_bits & 1
                    or member.compress_type not in (zipfile.ZIP_STORED, zipfile.ZIP_DEFLATED)
                    or member.external_attr >> 16 & 0o170000 == 0o120000):
                raise ValueError("Unsafe ZIP member")
            with archive.open(member) as stream:
                value = stream.read(MEMBER_LIMITS[member.filename] + 1)
            if len(value) != member.file_size:
                raise ValueError("ZIP size mismatch")
            result[member.filename] = value
        return result


def numeric_inventory(data):
    # Also clear search paths if another module initialized HDF5 before import.
    while h5py.h5pl.size():
        h5py.h5pl.remove(0)
    arrays, inventory, seen = {}, [], set()
    total = 0
    with h5py.File(io.BytesIO(data), "r") as root:
        def visit(group, depth=0):
            nonlocal total
            if depth > 12:
                raise ValueError("Excessive HDF5 nesting")
            for name in group:
                if not isinstance(group.get(name, getlink=True), h5py.HardLink):
                    raise ValueError("External/soft HDF5 link rejected")
                value = group[name]
                address = h5py.h5o.get_info(value.id).addr
                if address in seen or len(seen) >= 4096:
                    raise ValueError("Repeated or excessive HDF5 object")
                seen.add(address)
                if isinstance(value, h5py.Group):
                    visit(value, depth + 1)
                elif isinstance(value, h5py.Dataset):
                    properties = value.id.get_create_plist()
                    if (value.dtype.kind not in "fi" or value.dtype.itemsize not in (4, 8)
                            or value.ndim > 4 or value.size > 25000000
                            or value.is_virtual or properties.get_external_count()
                            or properties.get_nfilters()):
                        raise ValueError("Unsupported HDF5 dataset")
                    total += value.size * value.dtype.itemsize
                    if total > 90000000:
                        raise ValueError("Excessive numeric payload")
                    array = value[()]
                    if not np.isfinite(array).all():
                        raise ValueError("Non-finite numeric weight")
                    key = value.name.lstrip("/")
                    arrays[key] = np.asarray(array)
                    inventory.append({"path": key, "shape": list(value.shape), "dtype": str(value.dtype),
                                      "bytes": array.nbytes, "sha256": digest(array.tobytes())})
                else:
                    raise ValueError("Unsupported HDF5 object")
        visit(root)
    return arrays, inventory


def inspect_archive(path):
    if path.stat().st_size != ARCHIVE_BYTES:
        raise ValueError("Pinned archive size mismatch")
    data = path.read_bytes()
    if digest(data) != ARCHIVE_SHA256:
        raise ValueError("Pinned archive checksum mismatch")
    members = archive_members(data)
    config = json.loads(members["config.json"], object_pairs_hook=unique_object)
    metadata = json.loads(members["metadata.json"], object_pairs_hook=unique_object)
    arrays, inventory = numeric_inventory(members["model.weights.h5"])
    serialized = Counter()
    markers = []
    def walk(value, path=""):
        if isinstance(value, dict):
            if isinstance(value.get("class_name"), str):
                serialized[value["class_name"]] += 1
                if value["class_name"] in ("Lambda", "__lambda__", "function"):
                    markers.append(path)
            for key, item in value.items():
                if key in ("code", "function", "function_type"):
                    markers.append(path + "/" + key)
                walk(item, path + "/" + key)
        elif isinstance(value, list):
            for index, item in enumerate(value):
                walk(item, path + "/" + str(index))
    walk(config)
    report = {"archive_sha256": ARCHIVE_SHA256, "archive_bytes": len(data),
              "members": {name: {"bytes": len(value), "sha256": digest(value)} for name, value in members.items()},
              "metadata": metadata, "serialized_classes": dict(serialized), "function_markers": markers,
              "numeric_datasets": inventory, "numeric_bytes": sum(item["bytes"] for item in inventory),
              "keras_deserialized": False, "author_code_executed": False, "security_certified": False,
              "scanner_warning_resolved": False, "release_approved": False}
    return config, arrays, report


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--archive", required=True, type=Path)
    parser.add_argument("--report", required=True, type=Path)
    args = parser.parse_args()
    _, _, report = inspect_archive(args.archive)
    with args.report.open("x") as output:
        output.write(json.dumps(report, indent=2) + "\n")
    print(json.dumps({key: value for key, value in report.items() if key != "numeric_datasets"}, indent=2))


if __name__ == "__main__":
    main()
