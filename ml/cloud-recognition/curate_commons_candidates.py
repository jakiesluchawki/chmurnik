"""Materialize the manually reviewed Commons training and benchmark split."""

from __future__ import annotations

import argparse
import json
import shutil
from pathlib import Path


BENCHMARK = {
    "cirrus": ("002", "003", "012", "016"),
    "cirrocumulus": ("002", "005", "014", "020"),
    "cirrostratus": ("002", "006", "012", "021"),
    "altocumulus": ("001", "006", "010", "017"),
    "altostratus": ("004", "006", "009", "012"),
    "nimbostratus": ("004", "005", "011", "021"),
    "stratocumulus": ("002", "005", "010", "018"),
    "stratus": ("000", "004", "008", "022"),
    "cumulus": ("000", "002", "010", "017"),
    "cumulonimbus": ("002", "003", "008", "020"),
}

ACCEPTED = {
    "cirrus": ("002", "003", "004", "012", "013", "016"),
    "cirrocumulus": ("002", "005", "010", "011", "014", "015", "018", "019", "020", "022"),
    "cirrostratus": ("002", "006", "007", "010", "011", "012", "021"),
    "altocumulus": ("000", "001", "002", "006", "008", "010", "011", "013", "014", "015", "016", "017", "019", "020", "023"),
    "altostratus": ("000", "003", "004", "005", "006", "009", "012", "013", "014", "015", "016", "021", "022"),
    "nimbostratus": ("000", "001", "004", "005", "007", "008", "010", "011", "012", "013", "014", "016", "017", "021", "022"),
    "stratocumulus": ("001", "002", "003", "004", "005", "006", "007", "008", "010", "011", "012", "013", "014", "015", "016", "017", "018", "021", "023"),
    "stratus": ("000", "003", "004", "008", "009", "010", "011", "012", "013", "014", "015", "016", "019", "020", "022", "023"),
    "cumulus": ("000", "001", "002", "003", "004", "005", "006", "007", "008", "009", "010", "011", "012", "013", "014", "015", "016", "017", "018", "020", "021", "022"),
    "cumulonimbus": ("001", "002", "003", "004", "005", "007", "008", "011", "012", "013", "015", "017", "018", "019", "020", "022", "023"),
}


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--candidates", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()
    source_manifest = json.loads((args.candidates / "candidates.json").read_text())
    if args.output.exists():
        shutil.rmtree(args.output)
    manifest = {
        "source": source_manifest["source"],
        "review": "Manual genus review from 24 license-tracked candidates per class.",
        "splits": {"train": [], "benchmark": []},
    }
    for genus, accepted in ACCEPTED.items():
        rows = {
            Path(item["filename"]).stem: item
            for item in source_manifest["classes"][genus]["items"]
        }
        for stem in accepted:
            if stem not in rows:
                raise ValueError(f"Missing {genus}/{stem} in candidate manifest")
            split = "benchmark" if stem in BENCHMARK[genus] else "train"
            row = rows[stem]
            source = args.candidates / genus / row["filename"]
            destination = args.output / split / genus / row["filename"]
            destination.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(source, destination)
            manifest["splits"][split].append({"genus": genus, **row})
    (args.output / "manifest.json").write_text(json.dumps(manifest, indent=2) + "\n")
    print(json.dumps({name: len(rows) for name, rows in manifest["splits"].items()}))


if __name__ == "__main__":
    main()
