"""Build a blinded training-only IMGW label audit; never apply returned labels."""

import argparse
from collections import Counter
import csv
import hashlib
import html
import json
from pathlib import Path
import shutil
import zipfile

from labels import GENERA, CODE_TO_GENUS
from imgw_data import SOURCE_PAGE

MANIFEST_SHA256 = "d5b0ca33e0867bbb0d0fd25dbd08fc20cfeea316a89299e53f63a6bee5d0ea1c"
SEED = 9042
FIELDS = ["photo_id", "image_file", "image_sha256", "assessment", "genera", "alternatives", "comment"]


def digest(data):
    return hashlib.sha256(data).hexdigest()


def order_key(row, phase):
    return digest(f"{SEED}/{phase}/{row['id']}".encode())


def select_sample(rows, per_class=3):
    eligible = [row for row in rows if row["source"] == "imgw-2024-samples" and row["split"] == "train"]
    if len({row["id"] for row in eligible}) != len(eligible):
        raise ValueError("Duplicate source IDs")
    pools = {label: [row for row in eligible if row["label"] == label] for label in range(len(GENERA))}
    labels = sorted(pools, key=lambda label: (len({row["split_group"] for row in pools[label]}), label))
    chosen, groups, days = [], set(), set()
    for label in labels:
        count = 0
        for row in sorted(pools[label], key=lambda row: order_key(row, "selection")):
            if not row.get("group") or not row.get("split_group"):
                raise ValueError("Missing duplicate/capture group")
            if row["group"] in groups or row["split_group"] in days:
                continue
            chosen.append(row)
            groups.add(row["group"])
            days.add(row["split_group"])
            count += 1
            if count == per_class:
                break
        if count != per_class:
            raise ValueError(f"Insufficient independent training observations for {GENERA[label]}")
    if any(row["split"] != "train" and
           (row.get("group") in groups or row.get("split_group") in days) for row in rows):
        raise ValueError("Selected group overlaps a non-training role")
    return sorted(chosen, key=lambda row: order_key(row, "presentation"))


def validate_review(rows, public_items):
    """Return counts only. Never infer or write ground-truth labels."""
    expected = {item["photo_id"]: item for item in public_items}
    seen, counts = set(), Counter()
    for row in rows:
        identifier = row.get("photo_id")
        if identifier not in expected or identifier in seen:
            raise ValueError("Unknown or repeated review ID")
        seen.add(identifier)
        for key in FIELDS[:3]:
            if row.get(key) != expected[identifier][key]:
                raise ValueError("Review identity or image checksum changed")
        assessment, genera, alternatives, comment = [str(row.get(key) or "").strip() for key in FIELDS[3:]]
        if not assessment:
            if genera or alternatives or comment:
                raise ValueError("Partial answer requires an assessment code")
            counts["not_reviewed"] += 1
            continue
        if assessment not in {"single", "mixed", "uncertain", "clear", "unusable"}:
            raise ValueError("Unknown assessment code")
        confirmed = genera.split("|") if genera else []
        possible = alternatives.split("|") if alternatives else []
        for values in [confirmed, possible]:
            if len(set(values)) != len(values) or any(value not in CODE_TO_GENUS for value in values):
                raise ValueError("Invalid or duplicate genus code")
        if (assessment == "single" and len(confirmed) != 1 or
                assessment == "mixed" and len(confirmed) < 2 or
                assessment in {"uncertain", "clear", "unusable"} and confirmed or
                assessment != "uncertain" and possible or not comment):
            raise ValueError("Assessment does not match evidence fields")
        counts[assessment] += 1
    if seen != set(expected):
        raise ValueError("Missing review rows; retain blank rows for unreviewed photos")
    return dict(counts)


def build_pack(manifest_path, output):
    raw = manifest_path.read_bytes()
    if digest(raw) != MANIFEST_SHA256:
        raise ValueError("Frozen manifest checksum changed")
    manifest = json.loads(raw)
    if manifest["classes"] != GENERA:
        raise ValueError("Unexpected label order")
    if output.exists():
        raise ValueError("Refusing to overwrite an existing review pack")
    chosen = select_sample(manifest["rows"])
    for row in chosen:
        if digest(Path(row["path"]).read_bytes()) != row["artifact_sha256"]:
            raise ValueError("Selected image checksum changed")
    reviewer = output / "reviewer"
    (reviewer / "images").mkdir(parents=True)
    public_items, private_items = [], []
    for index, row in enumerate(chosen, 1):
        identifier = f"R{index:03d}"
        filename = f"images/{identifier}.jpg"
        shutil.copyfile(row["path"], reviewer / filename)
        public_item = {"photo_id": identifier, "image_file": filename, "image_sha256": row["artifact_sha256"]}
        public_items.append(public_item)
        private_items.append({**public_item, "source_id": row["id"], "original_label": GENERA[row["label"]],
                              "archive_name": row["archive_name"], "group": row["group"],
                              "split_group": row["split_group"], "role": row["split"]})
    instructions = Path(__file__).with_name("review-instructions-pl.md").read_text()
    (reviewer / "INSTRUKCJA.md").write_text(instructions)
    with (reviewer / "ocena.csv").open("w", encoding="utf-8-sig", newline="") as stream:
        writer = csv.DictWriter(stream, fieldnames=FIELDS, delimiter=";")
        writer.writeheader()
        writer.writerows(public_items)
    attribution = {"authors": "Szymon Kopeć; Grzegorz Duniec; Bogdan Bochenek; Mariusz Figurski",
                   "source": SOURCE_PAGE, "license": "CC BY 4.0",
                   "license_url": "https://creativecommons.org/licenses/by/4.0/", "doi": "10.1002/qj.4865",
                   "preparation": "EXIF-oriented RGB; max 640px; JPEG quality 92; no additional processing"}
    public = {"schema": 1, "items": public_items, "attribution": attribution}
    (reviewer / "images.json").write_text(json.dumps(public, ensure_ascii=False, indent=2) + "\n")
    key = {"schema": 1, "seed": SEED, "manifest_sha256": MANIFEST_SHA256,
           "purpose": "training-label audit; not independent model evaluation", "items": private_items}
    (output / "PRIVATE-KEY-DO-NOT-SEND.json").write_text(json.dumps(key, indent=2) + "\n")
    cards = "\n".join(f'<figure><a href="{item["image_file"]}"><img src="{item["image_file"]}" '
                       f'alt="Zdjęcie {item["photo_id"]}" loading="lazy"></a><figcaption>{item["photo_id"]}</figcaption></figure>'
                       for item in public_items)
    page = f'''<!doctype html><html lang="pl"><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><title>CHMURNIK: ocena zdjęć</title>
<style>body{{font:17px/1.5 system-ui;margin:24px auto;max-width:1100px;padding:0 20px;background:#fff9f5;color:#343024}}
h1{{font-size:30px}}.grid{{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,280px),1fr));gap:20px}}
figure{{margin:0;background:white;border:1px solid #bbb;padding:12px}}img{{width:100%;height:240px;object-fit:contain}}
figcaption{{font-weight:700}}pre{{white-space:pre-wrap;overflow-wrap:anywhere;font:inherit}}a{{color:#483080}}</style>
<h1>Niezależna ocena zdjęć nieba</h1><p>Kliknij zdjęcie, żeby otworzyć cały plik.
Odpowiedzi wpisz w <a href="ocena.csv" download>ocena.csv</a>. Nic nie jest wysyłane przez tę stronę.</p>
<details open><summary>Instrukcja i pochodzenie zdjęć</summary><pre>{html.escape(instructions)}</pre></details>
<main class="grid">{cards}</main></html>'''
    (reviewer / "index.html").write_text(page)
    archive = output / "CHMURNIK-OCENA-ZDJEC-33.zip"
    with zipfile.ZipFile(archive, "w", zipfile.ZIP_DEFLATED) as bundle:
        for path in sorted(reviewer.rglob("*")):
            if path.is_file():
                bundle.write(path, str(Path("CHMURNIK-ocena") / path.relative_to(reviewer)))
    result = {"count": len(chosen), "capture_days": len({row["split_group"] for row in chosen}),
              "review_returned": False, "zip": str(archive), "zip_sha256": digest(archive.read_bytes()),
              "public_manifest_sha256": digest((reviewer / "images.json").read_bytes())}
    (output / "build.json").write_text(json.dumps(result, indent=2) + "\n")
    return result


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--manifest", required=True, type=Path)
    parser.add_argument("--output", required=True, type=Path)
    args = parser.parse_args()
    print(json.dumps(build_pack(args.manifest, args.output), indent=2))


if __name__ == "__main__":
    main()
