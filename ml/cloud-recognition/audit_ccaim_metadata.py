"""Audit a pinned CCAiM inventory without downloading photos or changing labels."""

import argparse
from collections import Counter, defaultdict
import hashlib
import json
from pathlib import Path
import re

from labels import GENERA


REVISION = "07e790f94faf1f6a6cb39d0547837407ed59ba49"
MANIFEST_SHA256 = "d5b0ca33e0867bbb0d0fd25dbd08fc20cfeea316a89299e53f63a6bee5d0ea1c"
SOURCE_HASHES = {
    "labels.json": "73c9a6363e825ac73b27742d26b2a264637e5b973166d92ec95d7462d8660b5b",
    "revision.json": "91219091d458b587caa403817a5a2fbbf6de38d4892efa216e5c30ea000a64ed",
    "tree.json": "31026dd132d22d04dc0a50aa3c22e2ae1de7661fc8f97173ed4915449e1a14a8",
}
IMAGE_PATH = re.compile(r"clouds_1/(0|[1-9][0-9]*)\.jpg\Z")


def unique_object(pairs):
    result = {}
    for key, value in pairs:
        if key in result:
            raise ValueError(f"Duplicate JSON key: {key}")
        result[key] = value
    return result


def load_pinned(path, expected):
    data = path.read_bytes()
    if hashlib.sha256(data).hexdigest() != expected:
        raise ValueError(f"Changed source: {path.name}")
    return json.loads(data, object_pairs_hook=unique_object)


def profile(labels, tree):
    if not isinstance(labels, dict) or not labels or not isinstance(tree, list):
        raise ValueError("Empty or malformed inventory")
    for key, value in labels.items():
        if not re.fullmatch(r"0|[1-9][0-9]*", key) or value not in {g.capitalize() for g in GENERA[:-1]}:
            raise ValueError("Unknown image ID or genus")
    images, groups = {}, defaultdict(list)
    paths = set()
    for entry in tree:
        path = entry["path"]
        if path in paths:
            raise ValueError("Repeated inventory path")
        paths.add(path)
        if path in {"clouds_1/labels.json", "clouds_1/dataset_stats.txt"}:
            continue
        match = IMAGE_PATH.fullmatch(path)
        lfs = entry.get("lfs", {})
        if (entry.get("type") != "file" or not match
                or not re.fullmatch(r"[0-9a-f]{64}", lfs.get("oid", ""))
                or type(entry.get("size")) is not int or entry["size"] <= 0
                or entry["size"] != lfs.get("size")):
            raise ValueError("Invalid image path, size or LFS hash")
        images[match[1]] = entry
        groups[lfs["oid"]].append(match[1])
    if set(labels) - set(images):
        raise ValueError("A label refers to an absent image")
    duplicates = []
    for digest, ids in sorted(groups.items()):
        if len({images[i]["size"] for i in ids}) != 1:
            raise ValueError("One content hash has inconsistent sizes")
        if len(ids) > 1:
            names = sorted({labels[i] for i in ids if i in labels})
            duplicates.append({"sha256": digest, "image_ids": sorted(ids, key=int),
                               "labels": names, "conflict": len(names) > 1})
    return {"revision": REVISION, "image_count": len(images), "label_count": len(labels),
            "label_counts": dict(sorted(Counter(labels.values()).items())),
            "unlabelled_ids": sorted(set(images) - set(labels), key=int),
            "unique_lfs_hashes": len(groups), "duplicate_groups": duplicates,
            "conflicting_groups": sum(row["conflict"] for row in duplicates),
            "hash_evidence": "published Git LFS SHA256 metadata, not a new rehash of all remote images",
            "training_approved": False, "labels_applied": 0}


def compare_previous(manifest, tree, labels):
    from v4_data import image_fingerprint

    by_hash = defaultdict(list)
    for entry in tree:
        if match := IMAGE_PATH.fullmatch(entry["path"]):
            by_hash[entry["lfs"]["oid"]].append(match[1])
    previous = [row for row in manifest["rows"] if row["source"] == "ccaim-old"]
    matched = []
    for row in previous:
        path = Path(row["path"])
        if image_fingerprint(path)[0] != row["pixel_sha256"]:
            raise ValueError("A previous source photo no longer matches the frozen manifest")
        digest = hashlib.sha256(path.read_bytes()).hexdigest()
        if ids := by_hash.get(digest):
            matched.append({"previous_id": row["id"], "sha256": digest,
                            "current_ids": sorted(ids, key=int),
                            "current_labels": sorted({labels[i] for i in ids if i in labels})})
    return {"previous_image_count": len(previous), "matched_image_count": len(matched),
            "matches": matched,
            "limitation": "Unmatched bytes would not establish absence of resized or near-duplicate photos."}


def screen_for_review(labels, tree, overlap):
    inventory = profile(labels, tree)
    excluded = {row["sha256"] for row in overlap["matches"]}
    excluded.update(row["sha256"] for row in inventory["duplicate_groups"] if row["conflict"])
    groups = defaultdict(list)
    for entry in tree:
        if match := IMAGE_PATH.fullmatch(entry["path"]):
            if match[1] in labels and entry["lfs"]["oid"] not in excluded:
                groups[entry["lfs"]["oid"]].append((int(match[1]), entry))
    candidates = []
    for digest, entries in sorted(groups.items()):
        identifier, entry = min(entries, key=lambda item: item[0])
        candidates.append({"image_id": str(identifier), "path": entry["path"], "sha256": digest,
                           "source_label": labels[str(identifier)], "size": entry["size"]})
    return {"unique_published_hashes": len(candidates),
            "source_label_counts": dict(sorted(Counter(row["source_label"] for row in candidates).items())),
            "total_bytes": sum(row["size"] for row in candidates), "candidates": candidates,
            "status": "requires visual, near-duplicate and independent annotation review",
            "training_approved": False, "fresh_test_approved": False}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--source", type=Path, required=True)
    parser.add_argument("--manifest", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()
    if args.output.exists():
        raise ValueError("Preserve the previous audit")
    data = {name: load_pinned(args.source / name, sha) for name, sha in SOURCE_HASHES.items()}
    if data["revision.json"]["sha"] != REVISION:
        raise ValueError("Wrong source revision")
    manifest = load_pinned(args.manifest, MANIFEST_SHA256)
    report = profile(data["labels.json"], data["tree.json"])
    report["previous_overlap"] = compare_previous(manifest, data["tree.json"], data["labels.json"])
    report["review_screen"] = screen_for_review(data["labels.json"], data["tree.json"], report["previous_overlap"])
    report["source_sha256"] = SOURCE_HASHES
    report["manifest_sha256"] = MANIFEST_SHA256
    report["code_sha256"] = hashlib.sha256(Path(__file__).read_bytes()).hexdigest()
    with args.output.open("x", encoding="utf-8") as stream:
        stream.write(json.dumps(report, indent=2) + "\n")
    print(json.dumps({key: report[key] for key in ("image_count", "label_count", "unique_lfs_hashes",
                                                 "conflicting_groups", "unlabelled_ids", "training_approved")}))
    print(f"Previously exposed photos matched: {report['previous_overlap']['matched_image_count']}")


if __name__ == "__main__":
    main()
