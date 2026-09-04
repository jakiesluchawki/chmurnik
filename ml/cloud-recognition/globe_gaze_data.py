"""Audit the pinned GLOBE cloud-type CSV, without downloading/training on photos."""

import argparse
import collections
import csv
from datetime import date
import hashlib
import json
from pathlib import Path
from urllib.parse import urlsplit


MD5 = "7029a6efd57e67b239f1b166a916aa08"
DIRECTIONS = ("North", "East", "South", "West", "Up")
CATEGORIES = ("Clearsky", "Cirrus/Cirrostratus", "Cirrocumulus/Altocumulus", "Altostratus/Stratus",
              "Stratocumulus", "Cumulus", "Cumulonimbus", "Contrails", "Smoke/Haze", "Dust")
BASE = ("Observation Number", "Measurement Date (UTC)", "Measurement Time (UTC)",
        "Observation Latitude", "Observation Longitude")
FIELDS = ("Image URL", *CATEGORIES, "Agreement", "Classification Count", "Retirement")
HEADER = [*BASE, *(f"{direction} {field}" for direction in DIRECTIONS for field in FIELDS)]


def read_observations(stream):
    reader = csv.reader(stream)
    if next(reader, None) != HEADER:
        raise ValueError("Unexpected GLOBE cloud-type CSV header")
    observations, repairs, records = [], [], 0
    for row in reader:
        records += 1
        if len(row) == 61:
            following = next(reader, None)
            records += 1
            # This published file breaks just before the Up block, leaving a leading comma.
            if (following is None or len(following) != 15 or following[0] != ""
                    or row[-1] not in {"consensus", "classification_count"}):
                raise ValueError("Unrecognized GLOBE continuation; refusing to guess column alignment")
            repairs.append({"first_record": records - 1, "second_record": records})
            row = row + following[1:]
        if len(row) != len(HEADER):
            raise ValueError("Unexpected GLOBE row width")
        values = dict(zip(HEADER, row, strict=True))
        if not values["Observation Number"]:
            raise ValueError("Missing observation identifier")
        date.fromisoformat(values["Measurement Date (UTC)"])
        observations.append(values)
    return observations, {"physical_data_records": records, "repaired_continuations": repairs}


def photo_fields(observation, direction):
    get = lambda field: observation[f"{direction} {field}"]
    url = get("Image URL")
    if url in {"", "null"}:
        return None
    parsed = urlsplit(url)
    if parsed.scheme != "https" or parsed.hostname != "data.globe.gov" or not parsed.path.startswith("/system/photos/"):
        raise ValueError("Unexpected public photograph URL")
    flags = [get(category) for category in CATEGORIES]
    if any(flag not in {"0", "1", "5", "", "null"} for flag in flags):
        raise ValueError("Invalid cloud flag; probable shifted columns")
    agreement, count, retirement = get("Agreement"), get("Classification Count"), get("Retirement")
    if agreement in {"", "null"} or count in {"", "null"}:
        return {"url": url, "status": "unclassified", "labels": []}
    agreement, count = float(agreement), int(count)
    if not 0 <= agreement <= 1 or count < 0:
        raise ValueError("Invalid classification metadata")
    labels = [category for category, flag in zip(CATEGORIES, flags, strict=True) if flag == "1"]
    if count == 0 and retirement == "":
        return {"url": url, "status": "missing_classification_metadata", "labels": labels,
                "agreement": agreement, "count": count}
    if count < 1 or retirement not in {"consensus", "classification_count"}:
        raise ValueError("Invalid classification metadata")
    status = "classified" if set(flags) <= {"0", "1"} else "other_or_missing"
    if "Clearsky" in labels and len(labels) > 1:
        status = "contradictory_clear"
    return {"url": url, "status": status, "labels": labels, "agreement": agreement, "count": count}


def profile(observations, ingestion):
    statuses, labels, eligible = collections.Counter(), collections.Counter(), collections.Counter()
    urls, ids, dates, selected_ids, selected_dates = [], [], [], set(), set()
    for observation in observations:
        ids.append(observation["Observation Number"])
        dates.append(observation["Measurement Date (UTC)"])
        for direction in DIRECTIONS:
            photo = photo_fields(observation, direction)
            if photo is None:
                continue
            urls.append(photo["url"])
            statuses[photo["status"]] += 1
            labels.update(photo["labels"])
            if (photo["status"] == "classified" and len(photo["labels"]) == 1
                    and photo["agreement"] >= .8 and photo["count"] >= 5):
                eligible.update(photo["labels"])
                selected_ids.add(observation["Observation Number"])
                selected_dates.add(observation["Measurement Date (UTC)"])
    return {"scope": "metadata audit only; no photo inspection, role assignment or training approval",
            "source_md5": MD5, "ingestion": ingestion,
            "observations": len(observations), "unique_observation_ids": len(set(ids)),
            "observation_date_count": len(set(dates)), "date_range": [min(dates), max(dates)],
            "photo_records": len(urls), "unique_photo_urls": len(set(urls)), "statuses": dict(statuses),
            "positive_label_counts": dict(labels),
            "single_label_point8_min5_counts_before_deduplication": dict(eligible),
            "single_label_point8_min5_observations": len(selected_ids),
            "single_label_point8_min5_date_count": len(selected_dates),
            "cautions": ["Grouped cloud names are union labels, never invented genus labels.",
                         "Crowd agreement is not measured expert accuracy.",
                         "Multiple views of one observation and repeated photos are not independent.",
                         "No training/test partition has been assigned."]}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--source", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()
    if args.output.exists():
        raise ValueError("Preserve the previous audit")
    with args.source.open("rb") as stream:
        if hashlib.file_digest(stream, "md5").hexdigest() != MD5:
            raise ValueError("GLOBE source checksum mismatch")
    with args.source.open(newline="") as stream:
        observations, ingestion = read_observations(stream)
    result = profile(observations, ingestion)
    args.output.write_text(json.dumps(result, indent=2) + "\n")
    print(json.dumps({**result, "ingestion": {"physical_data_records": ingestion["physical_data_records"],
                                            "repaired_continuations": len(ingestion["repaired_continuations"])}}, indent=2))


if __name__ == "__main__":
    main()
