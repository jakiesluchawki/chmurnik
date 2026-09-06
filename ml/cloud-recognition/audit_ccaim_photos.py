"""Inspect a frozen CCAiM development sample without accepting source labels."""

import argparse
from collections import Counter
import hashlib
import json
from pathlib import Path
import shutil
import urllib.request
from urllib.parse import urlsplit

from PIL import Image, ImageDraw, ImageOps

from audit_ccaim_metadata import IMAGE_PATH, MANIFEST_SHA256, REVISION, load_pinned
from audit_globe_photos import inspect_image
from labels import GENERA


PROFILE_SHA256 = "5317fcc6a01a235f415462c72f916b87c738ae466dccec7f8b44b59d1702a195"
SEED = 13042
PER_CLASS = 6
MAX_FILE_BYTES = 12_000_000
MAX_TOTAL_BYTES = 128_000_000
SOURCE = f"https://huggingface.co/datasets/serbekun/CCAiM-CloudsDataset/resolve/{REVISION}/"
HOSTS = {"huggingface.co", "cdn-lfs.huggingface.co", "cdn-lfs.hf.co", "cas-bridge.xethub.hf.co",
         "us.aws.cdn.hf.co"}


def select_sample(profile):
    if profile["revision"] != REVISION or profile["training_approved"] is not False:
        raise ValueError("Unexpected source revision or training approval")
    candidates = profile["review_screen"]["candidates"]
    seen_ids, seen_hashes = set(), set()
    for row in candidates:
        match = IMAGE_PATH.fullmatch(row["path"])
        if (not match or match[1] != row["image_id"] or row["image_id"] in seen_ids
                or row["sha256"] in seen_hashes or len(row["sha256"]) != 64
                or any(c not in "0123456789abcdef" for c in row["sha256"])
                or type(row["size"]) is not int or row["size"] <= 0
                or row["source_label"].lower() not in GENERA[:-1]):
            raise ValueError("Invalid or repeated candidate")
        seen_ids.add(row["image_id"])
        seen_hashes.add(row["sha256"])
    selected = []
    for genus in GENERA[:-1]:
        pool = [row for row in candidates if row["source_label"].lower() == genus]
        if not pool:
            raise ValueError(f"Source class missing: {genus}")
        ordered = sorted(pool, key=lambda row: hashlib.sha256(f"{SEED}:{row['sha256']}".encode()).hexdigest())
        selected.extend(ordered[:PER_CLASS])
    if (any(row["size"] > MAX_FILE_BYTES for row in selected)
            or sum(row["size"] for row in selected) > MAX_TOTAL_BYTES):
        raise ValueError("Selected sample exceeds declared budget; do not replace its photos")
    return {"schema": 1, "seed": SEED, "per_class": PER_CLASS, "revision": REVISION,
            "profile_sha256": PROFILE_SHA256, "manifest_sha256": MANIFEST_SHA256,
            "scope": "development-only visual audit; not fresh model evaluation or verified training labels",
            "training_approved": False, "fresh_test_approved": False,
            "source_label_counts": dict(sorted(Counter(row["source_label"] for row in selected).items())),
            "declared_bytes": sum(row["size"] for row in selected),
            "photos": [{**row, "audit_id": f"C{index:03d}"} for index, row in enumerate(selected, 1)]}


def validate_url(url):
    parts = urlsplit(url)
    if (parts.scheme != "https" or parts.hostname not in HOSTS or parts.username
            or parts.password or parts.port not in {None, 443} or parts.fragment):
        raise ValueError("Unexpected photo source or redirect")


class PhotoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, request, fp, code, message, headers, new_url):
        validate_url(new_url)
        return super().redirect_request(request, fp, code, message, headers, new_url)


def verify_photo(row, path):
    if path.stat().st_size != row["size"]:
        raise ValueError("Photo size differs from pinned inventory")
    with path.open("rb") as stream:
        if hashlib.file_digest(stream, "sha256").hexdigest() != row["sha256"]:
            raise ValueError("Photo hash differs from pinned inventory")
    info = inspect_image(path)
    from v4_data import image_fingerprint
    pixel_sha256, dhash = image_fingerprint(path)
    return {**info, "pixel_sha256": pixel_sha256, "dhash": f"{dhash:064x}"}


def fetch_photo(row, path):
    if path.exists():
        return verify_photo(row, path)
    url = SOURCE + row["path"]
    validate_url(url)
    temporary = path.with_suffix(".part")
    total = 0
    created = False
    try:
        request = urllib.request.Request(url, headers={"User-Agent": "CHMURNIK cloud-data research audit"})
        with urllib.request.build_opener(PhotoRedirect()).open(request, timeout=30) as response, temporary.open("xb") as stream:
            created = True
            validate_url(response.url)
            for chunk in iter(lambda: response.read(65536), b""):
                total += len(chunk)
                if total > min(row["size"], MAX_FILE_BYTES):
                    raise ValueError("Photo exceeds its pinned byte budget")
                stream.write(chunk)
        result = verify_photo(row, temporary)
        temporary.rename(path)
        return result
    finally:
        if created:
            temporary.unlink(missing_ok=True)


def audit_photo(row, path, previous):
    if previous.get("status") == "downloaded":
        result = verify_photo(row, path)
        for key in ("sha256", "pixel_sha256", "dhash", "dimensions", "bytes"):
            if result[key] != previous[key]:
                raise ValueError("Previously inspected photo changed; preserve its audit")
        return previous
    try:
        return {"status": "downloaded", **fetch_photo(row, path)}
    except (OSError, ValueError) as error:
        # Signed CDN URLs in exception strings do not belong in durable reports.
        return {"status": "failed", "error_type": type(error).__name__}


def possible_reuse(info, previous_rows, sample_results, own_id):
    matches = []
    for row in previous_rows:
        exact = info["pixel_sha256"] == row["pixel_sha256"]
        distance = (int(info["dhash"], 16) ^ int(row["dhash"], 16)).bit_count()
        if exact or distance <= 8:
            matches.append({"scope": "previous_manifest", "id": row["id"], "split": row["split"],
                            "exact_pixels": exact, "dhash_distance": distance})
    for identifier, row in sorted(sample_results.items()):
        if identifier == own_id or row.get("status") != "downloaded":
            continue
        exact = info["pixel_sha256"] == row["pixel_sha256"]
        distance = (int(info["dhash"], 16) ^ int(row["dhash"], 16)).bit_count()
        if exact or distance <= 8:
            matches.append({"scope": "audit_sample", "id": identifier, "exact_pixels": exact,
                            "dhash_distance": distance})
    return matches


def save_json(path, data):
    temporary = path.with_suffix(".tmp")
    temporary.write_text(json.dumps(data, indent=2) + "\n", encoding="utf-8")
    temporary.replace(path)


def render_sheets(selection, results, output):
    for genus in GENERA[:-1]:
        rows = [row for row in selection["photos"] if row["source_label"].lower() == genus]
        sheet = Image.new("RGB", (1200, 720), "#f5f3ef")
        draw = ImageDraw.Draw(sheet)
        draw.text((12, 10), f"SOURCE LABEL: {genus} / visual audit, not verified genus", fill="black")
        for index, row in enumerate(rows):
            x, y = (index % 3) * 400, 45 + (index // 3) * 330
            result = results.get(row["audit_id"], {})
            if result.get("status") == "downloaded":
                with Image.open(output / "photos" / f"{row['audit_id']}.jpg") as original:
                    image = ImageOps.exif_transpose(original).convert("RGB")
                    image.thumbnail((390, 275))
                    sheet.paste(image, (x + (400 - image.width) // 2, y + (275 - image.height) // 2))
            else:
                draw.text((x + 10, y + 120), "DOWNLOAD FAILED / not replaced", fill="red")
            draw.text((x + 10, y + 282), f"{row['audit_id']} / source {row['image_id']}", fill="black")
        sheet.save(output / f"contact-{genus}.jpg", quality=90)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--profile", type=Path, required=True)
    parser.add_argument("--manifest", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--fetch", action="store_true")
    args = parser.parse_args()
    profile = load_pinned(args.profile, PROFILE_SHA256)
    manifest = load_pinned(args.manifest, MANIFEST_SHA256)
    selection = select_sample(profile)
    selection["code_sha256"] = hashlib.sha256(Path(__file__).read_bytes()).hexdigest()
    args.output.mkdir(parents=True, exist_ok=True)
    selection_path = args.output / "selection.json"
    if selection_path.exists():
        if json.loads(selection_path.read_text()) != selection:
            raise ValueError("Frozen selection changed; preserve the previous audit")
    else:
        with selection_path.open("x", encoding="utf-8") as stream:
            stream.write(json.dumps(selection, indent=2) + "\n")
    print(json.dumps({key: selection[key] for key in ("scope", "source_label_counts", "declared_bytes")}), flush=True)
    if not args.fetch:
        return
    photos = args.output / "photos"
    photos.mkdir(exist_ok=True)
    results_path = args.output / "downloads.json"
    results = json.loads(results_path.read_text()) if results_path.exists() else {}
    if set(results) - {row["audit_id"] for row in selection["photos"]}:
        raise ValueError("Unknown IDs in previous download results")
    for row in selection["photos"]:
        if shutil.disk_usage(args.output).free < 2 * 1024 ** 3:
            raise RuntimeError("Leave at least 2GiB free for other host tasks")
        results[row["audit_id"]] = audit_photo(row, photos / f"{row['audit_id']}.jpg", results.get(row["audit_id"], {}))
        save_json(results_path, results)
        print(row["audit_id"], results[row["audit_id"]]["status"], flush=True)
    reuse = {identifier: possible_reuse(info, manifest["rows"], results, identifier)
             for identifier, info in results.items() if info["status"] == "downloaded"}
    save_json(args.output / "possible-reuse.json", {"dhash_distance": 8,
        "limitation": "Similar dHash flags require visual review; absence of a match does not prove independence.",
        "training_approved": False, "fresh_test_approved": False, "matches": reuse})
    render_sheets(selection, results, args.output)
    print(json.dumps({"selected": len(selection["photos"]),
        "downloaded": sum(row["status"] == "downloaded" for row in results.values()),
        "all_downloaded": all(row["status"] == "downloaded" for row in results.values()),
        "flagged_for_reuse_review": sum(bool(matches) for matches in reuse.values()),
        "labels_applied": 0}), flush=True)


if __name__ == "__main__":
    main()
