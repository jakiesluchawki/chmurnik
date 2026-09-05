"""Compare blinded training-photo reviews without applying labels or training."""

import argparse
from collections import Counter
import csv
import io
import json
from pathlib import Path
import re

from build_expert_review import FIELDS, MANIFEST_SHA256, SEED, digest, select_sample, validate_review
from labels import CODE_TO_GENUS, GENERA


def verify_pack(manifest_path, pack):
    raw = manifest_path.read_bytes()
    if digest(raw) != MANIFEST_SHA256:
        raise ValueError("Frozen training manifest checksum changed")
    manifest = json.loads(raw)
    if manifest["classes"] != GENERA:
        raise ValueError("Unexpected label order")
    public_path = pack / "reviewer/images.json"
    public_raw = public_path.read_bytes()
    public = json.loads(public_raw)
    key = json.loads((pack / "PRIVATE-KEY-DO-NOT-SEND.json").read_bytes())
    if (public.get("schema") != 1 or key.get("schema") != 1 or
            key.get("seed") != SEED or key.get("manifest_sha256") != MANIFEST_SHA256):
        raise ValueError("Review pack provenance mismatch")
    # Recreate the predeclared sample, not a caller-provided list of trusted IDs.
    selected = select_sample(manifest["rows"])
    expected_public, expected_private = [], []
    for index, row in enumerate(selected, 1):
        item = {"photo_id": f"R{index:03d}", "image_file": f"images/R{index:03d}.jpg",
                "image_sha256": row["artifact_sha256"]}
        expected_public.append(item)
        expected_private.append({**item, "source_id": row["id"], "original_label": GENERA[row["label"]],
                                 "archive_name": row["archive_name"], "group": row["group"],
                                 "split_group": row["split_group"], "role": row["split"]})
        for path in (Path(row["path"]), pack / "reviewer" / item["image_file"]):
            if digest(path.read_bytes()) != item["image_sha256"]:
                raise ValueError(f"Selected photo checksum changed: {item['photo_id']}")
    if public.get("items") != expected_public or key.get("items") != expected_private:
        raise ValueError("Review pack does not match the frozen training sample")
    return expected_private, digest(public_raw)


def read_review(path, items):
    if path.stat().st_size > 1024 * 1024:
        raise ValueError("Review CSV exceeds 1 MiB")
    raw = path.read_bytes()
    reader = csv.DictReader(io.StringIO(raw.decode("utf-8-sig"), newline=""), delimiter=";", strict=True)
    if reader.fieldnames != FIELDS:
        raise ValueError("Review CSV header must retain the original columns and order")
    rows = list(reader)
    if any(set(row) != set(FIELDS) or any(value is None for value in row.values()) for row in rows):
        raise ValueError("Review CSV row has a missing or extra field")
    counts = validate_review(rows, items)
    return rows, counts, digest(raw)


def assessment_key(row):
    return (row["assessment"].strip(),
            tuple(sorted(value for value in row["genera"].strip().split("|") if value)),
            tuple(sorted(value for value in row["alternatives"].strip().split("|") if value)))


def compare_reviews(manifest_path, pack, reviews):
    """Agreement is evidence for adjudication, never automatic ground truth."""
    if not reviews:
        raise ValueError("At least one returned review is required")
    items, public_digest = verify_pack(manifest_path, pack)
    reviewers, answers, identifiers, files, hashes = [], {}, set(), set(), set()
    for identifier, path in reviews:
        if not re.fullmatch(r"[A-Za-z0-9][A-Za-z0-9_-]{0,63}", identifier) or identifier in identifiers:
            raise ValueError("Reviewer IDs must be distinct neutral identifiers")
        stat = path.stat()
        file_identity = (stat.st_dev, stat.st_ino)
        rows, counts, review_digest = read_review(path, items)
        if file_identity in files or review_digest in hashes:
            raise ValueError("The same review file cannot count as two independent reviews")
        identifiers.add(identifier)
        files.add(file_identity)
        hashes.add(review_digest)
        answers[identifier] = {row["photo_id"]: row for row in rows}
        reviewers.append({"reviewer_id": identifier, "csv_sha256": review_digest, "counts": counts})
    decisions = []
    for item in items:
        entries = [{"reviewer_id": reviewer["reviewer_id"],
                    **answers[reviewer["reviewer_id"]][item["photo_id"]]} for reviewer in reviewers]
        completed = [entry for entry in entries if entry["assessment"].strip()]
        keys = {assessment_key(entry) for entry in completed}
        proposed_label = None
        if not completed:
            status = "not_reviewed"
        elif len(keys) > 1:
            status = "disagreement"
        elif len(completed) < 2:
            status = "needs_second_review"
        elif len(completed) != len(entries):
            status = "awaiting_remaining_reviews"
        else:
            assessment, genera, _ = next(iter(keys))
            status = f"agreement_{assessment}"
            if assessment == "single":
                proposed_label = CODE_TO_GENUS[genera[0]]
            elif assessment == "clear":
                proposed_label = "clear_sky"
        decisions.append({**item, "status": status, "completed_review_count": len(completed),
                          "proposed_label": proposed_label,
                          "matches_original": proposed_label == item["original_label"] if proposed_label else None,
                          "training_action": "none", "annotations": entries})
    return {
        "schema": 1, "purpose": "training-label audit; not model evaluation or an importable training manifest",
        "manifest_sha256": MANIFEST_SHA256, "public_manifest_sha256": public_digest,
        "reviewers": reviewers, "reviewer_independence": "not verified by software; requires human confirmation",
        "labels_applied": 0, "training_ready": False,
        "required_next_step": "Independent qualification/independence check and human adjudication before a new development manifest",
        "summary": dict(Counter(item["status"] for item in decisions)), "items": decisions,
    }


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--manifest", required=True, type=Path)
    parser.add_argument("--pack", required=True, type=Path)
    parser.add_argument("--review", required=True, action="append", metavar="NEUTRAL_ID=CSV")
    parser.add_argument("--output", required=True, type=Path, help="New local JSON; includes private source labels")
    args = parser.parse_args()
    if args.output.resolve().is_relative_to((args.pack / "reviewer").resolve()):
        raise ValueError("Private comparison must stay outside the blinded reviewer folder")
    if args.output.exists():
        raise ValueError("Refusing to overwrite a previous review comparison")
    reviews = []
    for value in args.review:
        identifier, separator, path = value.partition("=")
        if not separator or not path:
            raise ValueError("Use --review neutral-id=/path/to/returned.csv")
        reviews.append((identifier, Path(path)))
    result = compare_reviews(args.manifest, args.pack, reviews)
    # Validate all inputs before creating output; never write to the source pack.
    with args.output.open("x", encoding="utf-8") as stream:
        json.dump(result, stream, ensure_ascii=False, indent=2)
        stream.write("\n")
    print(json.dumps({"summary": result["summary"], "labels_applied": 0, "training_ready": False}, indent=2))


if __name__ == "__main__":
    main()
