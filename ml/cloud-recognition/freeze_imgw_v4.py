"""Add public IMGW development data while reserving a fresh source-level test."""

import argparse
from collections import Counter, defaultdict
from datetime import datetime
import hashlib
import json
from pathlib import Path
import re

import numpy as np
from sklearn.model_selection import StratifiedGroupKFold

from v4_data import group_fingerprints, validate_manifest


def capture_day(archive_name):
    name = Path(archive_name).name
    match = re.match(r"(\d{12})_", name)
    if not match:
        return None
    try:
        return datetime.strptime(match.group(1), "%m%d%y%H%M%S").date().isoformat()
    except ValueError:
        return None


def assign_imgw(old, added):
    combined = old + added
    eligible = []
    for indices in group_fingerprints(combined):
        new = [combined[index] for index in indices if index >= len(old)]
        if not new:
            continue
        prior = [combined[index] for index in indices if index < len(old)]
        key = "imgw-" + min(row["pixel_sha256"] for row in new)[:20]
        conflict = len({row["label"] for row in new}) > 1
        for row in new:
            row["group"] = key
            row["split"] = "imgw-overlap" if prior else ("imgw-conflicting-labels" if conflict else "unassigned")
            row["capture_day"] = capture_day(row["archive_name"])
        if not prior and not conflict:
            eligible.append(new)

    # Keep every photograph from a named capture day in one split, including
    # transitive links from near-duplicate images taken across midnight.
    parents = list(range(len(eligible)))

    def find(index):
        while parents[index] != index:
            parents[index] = parents[parents[index]]
            index = parents[index]
        return index

    days = {}
    for index, group in enumerate(eligible):
        for day in {row["capture_day"] for row in group} - {None}:
            if day in days:
                parents[find(index)] = find(days[day])
            days[day] = index
    units = defaultdict(list)
    for index, group in enumerate(eligible):
        units[find(index)].extend(group)
    for rows in units.values():
        dates = sorted({row["capture_day"] for row in rows} - {None})
        key = "date/" + dates[0] if dates else min(row["group"] for row in rows)
        for row in rows:
            row["split_group"] = key
    return added


def stratified_roles(rows):
    eligible = [row for row in rows if row["split"] == "unassigned"]
    remaining = np.arange(len(eligible))
    for role, folds in [("confirmatory", 4), ("calibration", 5), ("validation", 5)]:
        labels = [eligible[index]["label"] for index in remaining]
        groups = [eligible[index]["split_group"] for index in remaining]
        splitter = StratifiedGroupKFold(n_splits=folds, shuffle=True, random_state=7042)
        kept, selected = next(splitter.split(remaining, labels, groups))
        for index in remaining[selected]:
            eligible[index]["split"] = role
        remaining = remaining[kept]
    for index in remaining:
        eligible[index]["split"] = "train"


def check_source_split(rows):
    roles = defaultdict(set)
    for row in rows:
        if row.get("split_group"):
            roles[row["split_group"]].add(row["split"])
    if any(len(value) != 1 for value in roles.values()):
        raise ValueError("IMGW capture day crosses data roles")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--parent", type=Path, required=True)
    parser.add_argument("--imgw", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()
    if args.output.exists():
        raise ValueError("A frozen manifest already exists; preserve it")
    parent = json.loads(args.parent.read_text())
    dataset = json.loads(args.imgw.read_text())
    if len(dataset["rows"]) != 1298:
        raise ValueError("The declared IMGW snapshot is incomplete")
    for row in dataset["rows"]:
        if row.get("fingerprint_version") != "dhash-256-bilinear":
            raise ValueError("Fingerprint algorithms differ")
        if hashlib.sha256(Path(row["path"]).read_bytes()).hexdigest() != row["artifact_sha256"]:
            raise ValueError("Image changed after collection")
    added = assign_imgw(parent["rows"], dataset["rows"])
    stratified_roles(added)
    rows = parent["rows"] + added
    validate_manifest(rows)
    check_source_split(added)
    counts = {role: dict(sorted(Counter(row["label"] for row in added if row["split"] == role).items()))
              for role in sorted({row["split"] for row in added})}
    if min(counts.get("confirmatory", {}).get(label, 0) for label in range(11)) < 15:
        raise ValueError(f"Insufficient class support in the untouched test: {counts}")
    manifest = {**{key: value for key, value in parent.items() if key != "rows"}, "schema": 2,
                "parent_sha256": hashlib.sha256(args.parent.read_bytes()).hexdigest(),
                "imgw_metadata_sha256": hashlib.sha256(args.imgw.read_bytes()).hexdigest(),
                "imgw_provenance": {key: value for key, value in dataset.items() if key != "rows"},
                "imgw_split_contract": "Group globally by original pixels/dHash256 <=8, exclude all overlap/conflicts; then keep named capture days in one split. StratifiedGroupKFold first fold, shuffle seed7042: 4 folds for confirmatory, then 5 folds each for calibration and validation from the remainder. Approximately 25/15/12/48 percent. No model-dependent selection.",
                "summary": {"splits": dict(Counter(row["split"] for row in rows)), "imgw_classes_by_role": counts},
                "rows": rows}
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(manifest, indent=2) + "\n")
    print(json.dumps({**manifest["summary"], "sha256": hashlib.sha256(args.output.read_bytes()).hexdigest()}, indent=2))


if __name__ == "__main__":
    main()
