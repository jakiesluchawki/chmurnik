"""Compare preserved VLM answers with source labels, without manufacturing truth."""

import argparse
from collections import Counter
import hashlib
import json
from pathlib import Path

from labels import CODE_TO_GENUS


LABELS = {**CODE_TO_GENUS, "clear_sky": "clear_sky", "unknown": None}


def observations(value, expected):
    rows = value["observations"]
    indexed = {row["photo_id"]: row for row in rows}
    if len(indexed) != len(rows) or set(indexed) != set(expected):
        raise ValueError("Missing, duplicate or unexpected image IDs")
    for row in rows:
        if row["best_guess"] not in LABELS:
            raise ValueError("Unsupported leading hypothesis")
        if row["assessment"] not in {"single", "mixed", "uncertain", "clear", "unusable"}:
            raise ValueError("Unsupported assessment")
        if row["confidence"] not in {"low", "medium", "high"}:
            raise ValueError("Qualitative confidence required")
        for field in ("genera", "alternatives"):
            if not isinstance(row[field], list) or any(code not in CODE_TO_GENUS for code in row[field]):
                raise ValueError("Malformed visible/alternative genera")
            if len(set(row[field])) != len(row[field]):
                raise ValueError("Duplicate genera")
        for field in ("evidence_pl", "limits_pl", "next_step_pl"):
            if not isinstance(row[field], str) or not row[field].strip():
                raise ValueError("Missing explanation")
    return indexed


def compare(key, a, b):
    source = {row["photo_id"]: row for row in key["source_label_key"]}
    if len(source) != len(key["source_label_key"]) or not source:
        raise ValueError("Invalid frozen comparison key")
    arms = {"a": observations(a, source), "b": observations(b, source)}
    rows = []
    for photo_id, original in source.items():
        label = original["source_label"]
        native = original["native_baseline"]
        rows.append({"photo_id": photo_id, "source_label": label,
                     "native_top1": native["top1"], "native_accepted": native["accepted"],
                     "native_matches_source": native["top1"] == label,
                     **{arm: {**values[photo_id],
                              "matches_source": LABELS[values[photo_id]["best_guess"]] == label}
                        for arm, values in arms.items()}})
    summaries = {}
    for arm in arms:
        summaries[arm] = {
            "matches_source": sum(row[arm]["matches_source"] for row in rows),
            "unknown_best_guess": sum(row[arm]["best_guess"] == "unknown" for row in rows),
            "assessments": dict(Counter(row[arm]["assessment"] for row in rows)),
            "qualitative_confidence": dict(Counter(row[arm]["confidence"] for row in rows)),
            "matches_where_native_disagrees": [row["photo_id"] for row in rows
                                                if row[arm]["matches_source"] and not row["native_matches_source"]],
            "disagrees_where_native_matches": [row["photo_id"] for row in rows
                                                if not row[arm]["matches_source"] and row["native_matches_source"]],
        }
    return {"scope": "Source-label agreement on a small exposed balanced subset; not verified ground truth or release approval",
            "training_ready": False, "labels_applied": 0, "photos": len(rows),
            "native_matches_source": sum(row["native_matches_source"] for row in rows),
            "arms": summaries,
            "changed_best_guess": [row["photo_id"] for row in rows if row["a"]["best_guess"] != row["b"]["best_guess"]],
            "rows": rows}


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    for argument in ("key", "a", "b", "output"):
        parser.add_argument(f"--{argument}", type=Path, required=True)
    args = parser.parse_args()
    inputs = {name: getattr(args, name).read_bytes() for name in ("key", "a", "b")}
    report = compare(*(json.loads(inputs[name]) for name in ("key", "a", "b")))
    report["sha256"] = {name: hashlib.sha256(data).hexdigest() for name, data in inputs.items()}
    with args.output.open("x") as handle:
        handle.write(json.dumps(report, indent=2, ensure_ascii=False) + "\n")
    print(json.dumps({key: value for key, value in report.items() if key != "rows"}, indent=2))
