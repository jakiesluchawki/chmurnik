"""Audit a pinned source archive without executing code or admitting labels."""

import argparse
from collections import Counter, defaultdict
import hashlib
import io
import json
from pathlib import Path, PurePosixPath
import stat
import warnings
import zipfile

from PIL import Image, ImageDraw, ImageOps

from audit_ccaim_metadata import load_pinned, MANIFEST_SHA256


ARCHIVE_SHA256 = "5469d479d8fb1101101b0ac8eaac6394a478632547f7f9236785d38ba4fa7b65"
MAX_ARCHIVE = 350_000_000
MAX_TOTAL = 600_000_000
MAX_MEMBER = 12_000_000
MAX_ENTRIES = 10_000
MAX_PIXELS = 30_000_000
SEED = 7042
SOURCE_LABELS = {
    "Altocumulus", "Altostratus", "Cirroculumulus", "Cirrostratus", "Cirrus",
    "Cumulonimbus", "Cumulus", "Nimbostratus", "Stratocumulus", "Stratus",
}
EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".bmp", ".102373"}


def digest(path):
    with path.open("rb") as stream:
        return hashlib.file_digest(stream, "sha256").hexdigest()


def immutable_json(path, value):
    if path.exists():
        if json.loads(path.read_text()) != value:
            raise ValueError(f"Changed audit receipt: {path.name}")
    else:
        with path.open("x", encoding="utf-8") as stream:
            json.dump(value, stream, indent=2)
            stream.write("\n")


def members(archive):
    entries = archive.infolist()
    if not entries or len(entries) > MAX_ENTRIES:
        raise ValueError("Invalid archive entry count")
    seen, files, total = set(), [], 0
    for entry in entries:
        path = PurePosixPath(entry.filename)
        mode = entry.external_attr >> 16
        if (path.is_absolute() or ".." in path.parts or "\\" in entry.filename
                or path.as_posix().rstrip("/") != entry.filename.rstrip("/")
                or entry.filename != entry.orig_filename or entry.filename in seen
                or entry.flag_bits & 1 or stat.S_IFMT(mode) not in {0, stat.S_IFREG, stat.S_IFDIR}
                or entry.file_size > MAX_MEMBER):
            raise ValueError("Unsafe, duplicate or oversized archive member")
        seen.add(entry.filename)
        total += entry.file_size
        if total > MAX_TOTAL:
            raise ValueError("Archive exceeds expanded byte budget")
        if entry.is_dir():
            continue
        if (len(path.parts) != 4 or path.parts[0] != "Howard-Cloud-X"
                or path.parts[1] not in {"train", "test", "val", "validation"}
                or path.parts[2] not in SOURCE_LABELS
                or path.suffix.lower() not in EXTENSIONS):
            raise ValueError("Unexpected source member; do not execute or extract it")
        files.append(entry)
    return sorted(files, key=lambda entry: entry.filename)


def inspect_pixels(data):
    if not data or len(data) > MAX_MEMBER:
        raise ValueError("Invalid image byte size")
    with warnings.catch_warnings():
        warnings.simplefilter("error", Image.DecompressionBombWarning)
        with Image.open(io.BytesIO(data)) as image:
            if image.format not in {"JPEG", "PNG", "WEBP", "BMP"}:
                raise ValueError("Unsupported actual image format")
            if image.width * image.height > MAX_PIXELS or getattr(image, "n_frames", 1) != 1:
                raise ValueError("Oversized or animated image")
            result = {"format": image.format, "dimensions": list(image.size)}
            image.verify()
        from v4_data import image_fingerprint
        pixel, dhash = image_fingerprint(io.BytesIO(data))
    return {**result, "pixel_sha256": pixel, "dhash": f"{dhash:064x}"}


def references(manifest):
    from v4_data import image_fingerprint
    result = []
    for index, row in enumerate(manifest["rows"]):
        path = Path(row["path"])
        raw = digest(path)
        pixel, dhash = image_fingerprint(path)
        if row.get("artifact_sha256"):
            if raw != row["artifact_sha256"]:
                raise ValueError(f"Changed retained reference: {row['id']}")
        elif pixel != row["pixel_sha256"]:
            raise ValueError(f"Changed reference pixels: {row['id']}")
        result.append({"id": row["id"], "source": row["source"], "split": row["split"],
                       "label": row["label"], "retained_sha256": raw,
                       "original_sha256": row.get("original_file_sha256"),
                       "retained_pixel_sha256": pixel, "original_pixel_sha256": row["pixel_sha256"],
                       "retained_dhash": f"{dhash:064x}", "original_dhash": row["dhash"]})
        if index % 500 == 0:
            print(f"References {index + 1}/{len(manifest['rows'])}", flush=True)
    return result


def compare_references(row, previous):
    if row["status"] != "decoded":
        return []
    result = []
    own_dhash = int(row["dhash"], 16)
    for ref in previous:
        raw = row["sha256"] in {ref["retained_sha256"], ref["original_sha256"]}
        exact = row["pixel_sha256"] in {ref["retained_pixel_sha256"], ref["original_pixel_sha256"]}
        distance = min((own_dhash ^ int(ref[key], 16)).bit_count()
                       for key in ("retained_dhash", "original_dhash"))
        if raw or exact or distance <= 8:
            result.append({key: ref[key] for key in ("id", "source", "split", "label")}
                          | {"exact_file": raw, "exact_pixels": exact, "dhash_distance": distance})
    return result


def duplicate_groups(rows):
    groups = defaultdict(list)
    for row in rows:
        if row["status"] == "decoded":
            groups[row["pixel_sha256"]].append(row)
    result = []
    for pixel, group in sorted(groups.items()):
        if len(group) > 1:
            labels = sorted({row["source_label"] for row in group})
            splits = sorted({row["source_split"] for row in group})
            result.append({"pixel_sha256": pixel, "ids": [row["id"] for row in group],
                           "source_labels": labels, "source_splits": splits,
                           "cross_label": len(labels) > 1, "cross_split": len(splits) > 1})
    return result


def sample_rows(rows):
    result = []
    for label in sorted(SOURCE_LABELS):
        pool = [row for row in rows if row["source_label"] == label]
        result.extend(sorted(pool, key=lambda row: (
            hashlib.sha256(f"{SEED}:{row['sha256']}".encode()).hexdigest(), row["id"]))[:6])
    return result


def render_sheets(archive, selected, output):
    for label in sorted(SOURCE_LABELS):
        sheet = Image.new("RGB", (1200, 740), "#f5f3ef")
        draw = ImageDraw.Draw(sheet)
        draw.text((12, 10), f"Source label: {label} / not verified ground truth", fill="black")
        for index, row in enumerate(r for r in selected if r["source_label"] == label):
            x, y = index % 3 * 400, 40 + index // 3 * 345
            if row["status"] == "decoded":
                data = archive.read(row["archive_path"])
                if hashlib.sha256(data).hexdigest() != row["sha256"]:
                    raise ValueError("Selected photo changed")
                with Image.open(io.BytesIO(data)) as original:
                    thumb = ImageOps.exif_transpose(original).convert("RGB")
                    thumb.thumbnail((390, 285))
                    sheet.paste(thumb, (x + (400 - thumb.width) // 2, y + (285 - thumb.height) // 2))
            else:
                draw.text((x + 12, y + 140), "FAILED DECODE / NOT REPLACED", fill="red")
            draw.text((x + 10, y + 291), f"{row['id']} / {row['source_split']} / {row['status']}", fill="black")
        sheet.save(output / f"contact-{label}.jpg", quality=92)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--manifest", type=Path, default=Path(".local/v4/data-v2/manifest.json"))
    args = parser.parse_args()
    output = args.output
    source = output / "howard-v2.zip"
    if source.stat().st_size > MAX_ARCHIVE or digest(source) != ARCHIVE_SHA256:
        raise ValueError("Archive differs from version-2 receipt")
    metadata = json.loads((output / "metadata.json").read_text())
    if (metadata["id"] != 2371703 or metadata["currentVersionNumber"] != 2
            or metadata["isPrivate"] is not False or metadata["ref"] != "imbikramsaha/howard-cloudx"):
        raise ValueError("Unexpected source metadata")
    manifest = load_pinned(args.manifest, MANIFEST_SHA256)
    with zipfile.ZipFile(source) as archive:
        entries = members(archive)
        if sum(entry.file_size for entry in entries) != metadata["totalBytes"]:
            raise ValueError("Expanded bytes disagree with source metadata")
        rows = []
        for index, entry in enumerate(entries):
            data = archive.read(entry)
            parts = PurePosixPath(entry.filename).parts
            row = {"id": f"H{index + 1:04d}", "archive_path": entry.filename,
                   "source_label": parts[2], "source_split": parts[1], "bytes": len(data),
                   "sha256": hashlib.sha256(data).hexdigest()}
            try:
                row.update(status="decoded", **inspect_pixels(data))
            except (OSError, ValueError, SyntaxError, Image.DecompressionBombError,
                    Image.DecompressionBombWarning) as error:
                row.update(status="failed", error_type=type(error).__name__)
            rows.append(row)
            if index % 200 == 0:
                print(f"Source photos {index + 1}/{len(entries)}", flush=True)
        immutable_json(output / "photos.json", rows)
        refs = references(manifest)
        immutable_json(output / "reference-fingerprints.json", refs)
        matches = {row["id"]: compare_references(row, refs) for row in rows}
        duplicates = duplicate_groups(rows)
        selected = sample_rows(rows)
        immutable_json(output / "visual-selection.json", {"seed": SEED, "per_class": 6,
                        "photos": selected, "training_approved": False, "fresh_test_approved": False})
        render_sheets(archive, selected, output)
    exact_ids = {key for key, values in matches.items() if any(
        match["exact_file"] or match["exact_pixels"] for match in values)}
    summary = {"photos": len(rows), "decoded": sum(r["status"] == "decoded" for r in rows),
               "class_counts": dict(sorted(Counter(r["source_label"] for r in rows).items())),
               "split_counts": dict(sorted(Counter(r["source_split"] for r in rows).items())),
               "reference_rows": len(refs), "exact_reference_reuse_photos": len(exact_ids),
               "perceptual_only_flagged_photos": sum(bool(v) and k not in exact_ids for k, v in matches.items()),
               "duplicate_pixel_groups": len(duplicates),
               "cross_label_pixel_groups": sum(g["cross_label"] for g in duplicates),
               "cross_split_pixel_groups": sum(g["cross_split"] for g in duplicates)}
    immutable_json(output / "audit.json", {"summary": summary, "source_version": 2,
                   "archive_sha256": ARCHIVE_SHA256, "metadata_sha256": digest(output / "metadata.json"),
                   "manifest_sha256": MANIFEST_SHA256, "code_sha256": digest(Path(__file__)),
                   "photos_sha256": digest(output / "photos.json"),
                   "references_sha256": digest(output / "reference-fingerprints.json"),
                   "matches": matches, "duplicate_groups": duplicates, "dhash_threshold": 8,
                   "limitations": "Perceptual flags require review; absence of matches does not establish independence or correct labels.",
                   "training_approved": False, "fresh_test_approved": False, "predictions_run": 0})
    print(json.dumps(summary, indent=2), flush=True)


if __name__ == "__main__":
    main()
