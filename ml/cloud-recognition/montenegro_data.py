"""Audit the pinned multi-observer data; never invent single-genus ground truth."""

import argparse
from collections import Counter, defaultdict
import csv
from datetime import datetime
import hashlib
import json
from pathlib import Path
import re


SOURCE = "https://zenodo.org/records/21787669"
FILES = {
    "annotations.csv": "fc76ca479d36d9dba7b3fd3748d0a0e9",
    "annotation_items.csv": "f9a3206339316b7c1e8221623375505a",
    "labels.csv": "f85e47c844eeb2be156054ddb89330cb",
    "README.md": "4b151b0f7945116bf0febd966bade084",
    "LICENSE.txt": "aece74fc3e6f94d416bfb34d7b3661ee",
}
ALTITUDE = "Cloud classification by altitude (dominant type recorded)"
COVER = "Total cloud cover in oktas"
LOW_COVER = "Amount of low cloud covering the sky"
HEIGHT = "Height of base of lowest cloud"
LOW, MIDDLE, HIGH = "CL - Low cloud type", "CM - Middle cloud type", "CH - High cloud type"
VARIABLES = {ALTITUDE: "44", COVER: "46", LOW_COVER: "47", HEIGHT: "45",
             LOW: "48", MIDDLE: "49", HIGH: "50"}
ITEM_HEADER = ["id", "name", "item_url", "item_type", "item_received"]
ANNOTATION_HEADER = ["annotation_item_id", "user_id", *VARIABLES]
LABEL_HEADER = ["id", "label_type_id", "name", "description"]
NAME = re.compile(r"snapshot_(\d{8})_(\d{6})_(\d{3})\.jpg\Z")
GENUS_CODES = {
    LOW: {"1": ("cumulus",), "2": ("cumulus",), "3": ("cumulonimbus",),
          "4": ("stratocumulus",), "5": ("stratocumulus",), "6": ("stratus",),
          "7": ("stratus", "cumulus"), "8": ("cumulus", "stratocumulus"),
          "9": ("cumulonimbus",)},
    MIDDLE: {"1": ("altostratus",), "2": ("altostratus", "nimbostratus"),
             "3": ("altocumulus",), "4": ("altocumulus",), "5": ("altocumulus",),
             "6": ("altocumulus",), "7": ("altocumulus", "altostratus"),
             "8": ("altocumulus",), "9": ("altocumulus",)},
    HIGH: {"1": ("cirrus",), "2": ("cirrus",), "3": ("cirrus",), "4": ("cirrus",),
           "5": ("cirrus", "cirrostratus"), "6": ("cirrus", "cirrostratus"),
           "7": ("cirrostratus",), "8": ("cirrostratus",), "9": ("cirrocumulus",)},
}


def read_table(stream, header):
    reader = csv.reader(stream)
    if next(reader, None) != header:
        raise ValueError("Unexpected Montenegro CSV header")
    rows = []
    for values in reader:
        if len(values) != len(header):
            raise ValueError("Unexpected Montenegro CSV row width")
        rows.append(dict(zip(header, values)))
    return rows


def normalize_codes(annotations):
    corrected, changes = [], Counter()
    for original in annotations:
        row = dict(original)
        for field in VARIABLES:
            if field != ALTITUDE and row[field] != row[field].strip():
                value = row[field].strip()
                changes[(field, row[field], value)] += 1
                row[field] = value
        corrected.append(row)
    return corrected, [{"field": field, "from": before, "to": after, "count": count}
                       for (field, before, after), count in sorted(changes.items())]


def check_tables(items, annotations, labels):
    if not items or not annotations or not labels:
        raise ValueError("Empty source table")
    enums = defaultdict(set)
    keys = set()
    for row in labels:
        if row["id"] in keys or row["label_type_id"] not in VARIABLES.values():
            raise ValueError("Repeated or unknown code-book entry")
        keys.add(row["id"])
        if row["name"] in enums[row["label_type_id"]]:
            raise ValueError("Repeated variable/code pair")
        enums[row["label_type_id"]].add(row["name"])
    expected = {str(n) for n in range(10)}
    for field in (COVER, LOW_COVER, HEIGHT, LOW, MIDDLE, HIGH):
        if enums[VARIABLES[field]] != (expected if field == COVER else expected | {"/"}):
            raise ValueError("Incomplete or changed code book")
    if enums["44"] != {"Clear", "Low", "Low clouds", "Middle clouds", "High clouds",
                        "Clouds of vertical development"}:
        raise ValueError("Changed altitude code book")
    by_id, names = {}, set()
    for row in items:
        if (not row["id"].isdigit() or row["id"] in by_id or row["name"] in names
                or row["item_url"] != "/images/" or row["item_type"] != "image"):
            raise ValueError("Invalid or repeated image identity")
        match = NAME.fullmatch(row["name"])
        if not match:
            raise ValueError("Unexpected photograph filename")
        captured = datetime.strptime("".join(match.groups()), "%Y%m%d%H%M%S%f")
        received = datetime.strptime(row["item_received"], "%Y-%m-%d %H:%M:%S")
        if abs((captured - received).total_seconds()) > 1:
            raise ValueError("Filename and inventory time disagree")
        names.add(row["name"])
        by_id[row["id"]] = row
    pairs, observed = set(), set()
    for row in annotations:
        pair = row["annotation_item_id"], row["user_id"]
        if pair in pairs or pair[0] not in by_id or not pair[1].isdigit():
            raise ValueError("Duplicate annotation or invalid image/observer reference")
        pairs.add(pair)
        observed.add(pair[0])
        for field, code in VARIABLES.items():
            if row[field] and row[field] not in enums[code]:
                raise ValueError("Invalid annotation code")
    if observed != set(by_id):
        raise ValueError("Image inventory has missing annotations")
    return by_id


def judgement(row):
    """Translate only exact genus support; unions and multiple levels stay unresolved."""
    values = {field: row[field] for field in (COVER, LOW, MIDDLE, HIGH)}
    for field, value in values.items():
        if value not in {"", "/", *(str(n) for n in range(10))} or (field == COVER and value == "/"):
            raise ValueError("Invalid observation code")
    possible = sorted({name for field in GENUS_CODES for name in GENUS_CODES[field].get(values[field], ())})
    if values[COVER] == "0" and possible:
        return {"status": "inconsistent_clear", "possible_genera": possible}
    if any(value in {"", "/"} for value in values.values()) or values[COVER] == "9":
        return {"status": "unobserved", "possible_genera": possible}
    if values[COVER] == "0":
        if row[LOW_COVER] not in {"", "/", "0"}:
            return {"status": "inconsistent_clear", "possible_genera": []}
        return {"status": "clear", "genus": "clear_sky", "possible_genera": []}
    if len(possible) == 1:
        return {"status": "single_genus", "genus": possible[0], "possible_genera": possible}
    return {"status": "partial_or_multiple" if possible else "no_positive_genus", "possible_genera": possible}


def consensus(rows):
    if not rows or len({row["annotation_item_id"] for row in rows}) != 1:
        raise ValueError("Consensus requires one image")
    if len({row["user_id"] for row in rows}) != len(rows):
        raise ValueError("An observer cannot vote twice")
    votes = Counter(value["genus"] for row in rows if "genus" in (value := judgement(row)))
    # Missing/ambiguous judgements remain in the denominator, not silent abstentions.
    eligible = [name for name, count in votes.items() if count >= 4 and count / len(rows) >= .8]
    return {"observer_count": len(rows), "exact_votes": dict(sorted(votes.items())),
            "screened_genus": eligible[0] if len(eligible) == 1 else None,
            "agreement_denominator": "all observers, including missing and ambiguous judgements"}


def profile(items, annotations, labels):
    annotations, normalization = normalize_codes(annotations)
    by_id = check_tables(items, annotations, labels)
    groups = defaultdict(list)
    for row in annotations:
        groups[row["annotation_item_id"]].append(row)
    selected, counts, days_by_genus = [], Counter(), defaultdict(set)
    for image_id, rows in sorted(groups.items()):
        result = consensus(rows)
        name = result["screened_genus"]
        if name is not None:
            item = by_id[image_id]
            day = item["item_received"][:10]
            counts[name] += 1
            days_by_genus[name].add(day)
            selected.append({"id": image_id, "filename": item["name"], "local_day": day, **result})
    dates = sorted({row["item_received"][:10] for row in items})
    return {"source": SOURCE, "scope": "metadata screen only, not ground-truth certification or training approval",
            "code_whitespace_normalizations": normalization,
            "image_count": len(items), "annotation_count": len(annotations),
            "observer_count": len({row["user_id"] for row in annotations}),
            "local_date_count": len(dates), "local_date_range": [dates[0], dates[-1]],
            "images_by_observer_count": dict(sorted(Counter(len(rows) for rows in groups.values()).items())),
            "missing_by_field": {field: sum(row[field] == "" for row in annotations) for field in VARIABLES},
            "unobservable_by_field": {field: sum(row[field] == "/" for row in annotations) for field in VARIABLES},
            "judgement_statuses": dict(Counter(judgement(row)["status"] for row in annotations)),
            "screen": "at least four exact same-genus judgements and at least 80% of all observers; all three levels observed",
            "screened_before_pixel_deduplication": dict(sorted(counts.items())),
            "screened_days_by_genus": {name: len(days) for name, days in sorted(days_by_genus.items())},
            "screened_rows": selected,
            "training_approved": False,
            "cautions": ["Consensus is not a measured probability that a genus is correct.",
                         "Single camera, correlated capture times; split by day/block, never by annotation.",
                         "Missing values and slash codes are not absent cloud labels.",
                         "CM=2 cannot distinguish Altostratus from Nimbostratus.",
                         "Documentation retains unresolved camera/privacy/citation placeholders.",
                         "Dates are local calendar dates; no fixed UTC offset is inferred."]}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--source", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()
    if args.output.exists():
        raise ValueError("Preserve the previous audit")
    hashes = {}
    for name, expected in FILES.items():
        data = (args.source / name).read_bytes()
        if hashlib.md5(data).hexdigest() != expected:
            raise ValueError(f"Source checksum mismatch: {name}")
        hashes[name] = hashlib.sha256(data).hexdigest()
    tables = []
    for name, header in (("annotation_items.csv", ITEM_HEADER), ("annotations.csv", ANNOTATION_HEADER),
                         ("labels.csv", LABEL_HEADER)):
        with (args.source / name).open(encoding="utf-8", newline="") as stream:
            tables.append(read_table(stream, header))
    result = {"source_sha256": hashes, "code_sha256": hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),
              **profile(*tables)}
    args.output.write_text(json.dumps(result, indent=2) + "\n")
    print(json.dumps({key: value for key, value in result.items() if key != "screened_rows"}, indent=2))


if __name__ == "__main__":
    main()
