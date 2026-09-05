"""Inspect a fixed development-only sample; do not silently replace failed images."""

import argparse
import hashlib
import json
from pathlib import Path
import shutil
import urllib.request
from urllib.parse import urlsplit

from PIL import Image, ImageDraw, ImageOps

from globe_gaze_data import CATEGORIES, DIRECTIONS, MD5, photo_fields, read_observations


PER_FILE_LIMIT = 2_000_000
TOTAL_LIMIT = 50_000_000


def select_photos(observations, per_category=6):
    candidates = []
    for observation in observations:
        for direction in DIRECTIONS:
            photo = photo_fields(observation, direction)
            if (photo is None or photo["status"] != "classified" or len(photo["labels"]) != 1
                    or photo["agreement"] < .8 or photo["count"] < 5
                    or photo["labels"][0] not in CATEGORIES[:7]):
                continue
            observation_id = observation["Observation Number"]
            candidates.append({"id": "gaze-" + hashlib.sha256(photo["url"].encode()).hexdigest()[:20],
                               "observation_id": observation_id, "date": observation["Measurement Date (UTC)"],
                               "direction": direction, "source_category": photo["labels"][0], "url": photo["url"],
                               "agreement": photo["agreement"], "classification_count": photo["count"],
                               "sort_key": hashlib.sha256(f"7042:{observation_id}:{direction}".encode()).hexdigest()})
    chosen, seen = [], set()
    for category in CATEGORIES[:7]:
        available = sorted((row for row in candidates if row["source_category"] == category), key=lambda row: row["sort_key"])
        count = 0
        for row in available:
            if row["observation_id"] in seen:
                continue
            seen.add(row["observation_id"])
            chosen.append(row)
            count += 1
            if count == per_category:
                break
        if count != per_category:
            raise ValueError(f"Insufficient distinct observations for {category}")
    return {"source_md5": MD5, "seed": 7042, "per_category": per_category,
            "scope": "development-only exposure; all other views of these observations also excluded from future fresh tests",
            "development_only_observation_ids": sorted(seen), "max_file_bytes": PER_FILE_LIMIT,
            "max_total_bytes": TOTAL_LIMIT, "photos": chosen}


def validate_url(url):
    parsed = urlsplit(url)
    if (parsed.scheme != "https" or parsed.netloc != "data.globe.gov"
            or not parsed.path.startswith("/system/photos/") or parsed.query or parsed.fragment):
        raise ValueError("Unexpected photo source URL")


class PhotoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, request, fp, code, message, headers, new_url):
        validate_url(new_url)
        return super().redirect_request(request, fp, code, message, headers, new_url)


def inspect_image(path):
    with Image.open(path) as image:
        if image.format != "JPEG" or image.width * image.height > 30_000_000:
            raise ValueError("Unexpected image format or excessive pixel count")
        dimensions = list(image.size)
        image.verify()
    with Image.open(path) as image:
        image.load()
    with path.open("rb") as stream:
        digest = hashlib.file_digest(stream, "sha256").hexdigest()
    return {"bytes": path.stat().st_size, "sha256": digest, "dimensions": dimensions}


def fetch_photo(row, path, byte_limit):
    validate_url(row["url"])
    if path.exists():
        if path.stat().st_size > byte_limit:
            raise ValueError("Existing file exceeds its byte limit")
        return inspect_image(path)
    temporary = path.with_suffix(".part")
    total = 0
    try:
        request = urllib.request.Request(row["url"], headers={"User-Agent": "CHMURNIK cloud-data research audit"})
        with urllib.request.build_opener(PhotoRedirect()).open(request, timeout=30) as response, temporary.open("wb") as stream:
            validate_url(response.url)
            for chunk in iter(lambda: response.read(65536), b""):
                total += len(chunk)
                if total > byte_limit:
                    raise ValueError("Photo exceeds declared download budget")
                stream.write(chunk)
        info = inspect_image(temporary)
        temporary.rename(path)
        return info
    finally:
        temporary.unlink(missing_ok=True)


def audit_photo(row, path, byte_limit, previous):
    if previous.get("status") == "downloaded":
        # Integrity failures must not erase the original hash on a later resume.
        info = fetch_photo(row, path, byte_limit)
        if previous["sha256"] != info["sha256"]:
            raise ValueError("Previously inspected photo changed")
        return {"status": "downloaded", **info}
    try:
        return {"status": "downloaded", **fetch_photo(row, path, byte_limit)}
    except Exception as error:
        return {"status": "failed", "error": str(error)}


def render_sheets(manifest, results, output):
    for category_index, category in enumerate(CATEGORIES[:7]):
        rows = [row for row in manifest["photos"] if row["source_category"] == category]
        sheet = Image.new("RGB", (1200, 700), "#f5f3ef")
        draw = ImageDraw.Draw(sheet)
        draw.text((14, 10), f"SOURCE LABEL: {category} / development audit, not expert ground truth", fill="black")
        for index, row in enumerate(rows):
            x, y = (index % 3) * 400, 40 + (index // 3) * 330
            result = results.get(row["id"], {})
            if result.get("status") == "downloaded":
                with Image.open(output / "photos" / f"{row['id']}.jpg") as original:
                    image = ImageOps.exif_transpose(original).convert("RGB")
                    image.thumbnail((390, 280))
                    sheet.paste(image, (x + (400 - image.width) // 2, y + (280 - image.height) // 2))
            else:
                draw.text((x + 10, y + 120), "DOWNLOAD FAILED / not replaced", fill="red")
            draw.text((x + 10, y + 283), f"{index + 1}: {row['id']} / {row['direction']}", fill="black")
            draw.text((x + 10, y + 299), f"{row['date']} / agreement {row['agreement']} / n={row['classification_count']}", fill="black")
        sheet.save(output / f"contact-{category_index + 1:02}.jpg", quality=90)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--source", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()
    with args.source.open("rb") as stream:
        if hashlib.file_digest(stream, "md5").hexdigest() != MD5:
            raise ValueError("GLOBE source checksum mismatch")
    with args.source.open(newline="") as stream:
        observations, _ = read_observations(stream)
    manifest = select_photos(observations)
    args.output.mkdir(parents=True, exist_ok=True)
    selection = args.output / "selection.json"
    if selection.exists() and json.loads(selection.read_text()) != manifest:
        raise ValueError("Selection changed; preserve the previous audit")
    selection.write_text(json.dumps(manifest, indent=2) + "\n")
    photos = args.output / "photos"
    photos.mkdir(exist_ok=True)
    state_path = args.output / "downloads.json"
    results = json.loads(state_path.read_text()) if state_path.exists() else {}
    used = 0
    for row in manifest["photos"]:
        if shutil.disk_usage(args.output).free < 2 * 1024 ** 3:
            raise RuntimeError("Leave at least 2GiB free for other host tasks")
        info = audit_photo(row, photos / f"{row['id']}.jpg", min(PER_FILE_LIMIT, TOTAL_LIMIT - used),
                           results.get(row["id"], {}))
        results[row["id"]] = info
        if info["status"] == "downloaded":
            used += info["bytes"]
        state_path.write_text(json.dumps(results, indent=2) + "\n")
        print(row["id"], results[row["id"]]["status"], flush=True)
    render_sheets(manifest, results, args.output)
    print(json.dumps({"selected": len(manifest["photos"]), "downloaded": sum(row["status"] == "downloaded" for row in results.values()),
                      "total_bytes": used, "selection_sha256": hashlib.sha256(selection.read_bytes()).hexdigest()}), flush=True)


if __name__ == "__main__":
    main()
