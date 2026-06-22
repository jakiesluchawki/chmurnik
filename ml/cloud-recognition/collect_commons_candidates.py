"""Collect license-tracked Wikimedia Commons candidates for manual curation."""

from __future__ import annotations

import argparse
import json
import random
import time
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path


CATEGORIES = {
    "cirrus": ("Cirrus clouds",),
    "cirrocumulus": ("Cirrocumulus clouds",),
    "cirrostratus": ("Cirrostratus clouds",),
    "altocumulus": ("Altocumulus clouds",),
    "altostratus": ("Altostratus clouds",),
    "nimbostratus": ("Nimbostratus clouds",),
    "stratocumulus": ("Stratocumulus clouds",),
    "stratus": ("Stratus clouds",),
    "cumulus": (
        "Cumulus humilis clouds",
        "Cumulus mediocris clouds",
        "Cumulus congestus clouds",
    ),
    "cumulonimbus": (
        "Cumulonimbus calvus",
        "Cumulonimbus capillatus",
        "Cumulonimbus incus",
    ),
}
API = "https://commons.wikimedia.org/w/api.php"
USER_AGENT = "CHMURNIK dataset audit/3.0 (https://chmurnik.cloud)"
REQUEST_DELAY = 0.6


def open_with_retry(request: urllib.request.Request):
    for attempt in range(5):
        try:
            return urllib.request.urlopen(request, timeout=90)
        except urllib.error.HTTPError as error:
            if error.code != 429 or attempt == 4:
                raise
            retry_after = int(error.headers.get("Retry-After", "0") or 0)
            time.sleep(max(retry_after, 3 * (attempt + 1)))
    raise RuntimeError("Wikimedia request retries exhausted")


def request_json(params: dict[str, str]) -> dict:
    url = f"{API}?{urllib.parse.urlencode(params)}"
    request = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    with open_with_retry(request) as response:
        return json.load(response)


def category_files(category: str, limit: int) -> list[dict]:
    rows: list[dict] = []
    continuation: dict[str, str] = {}
    while len(rows) < limit:
        payload = request_json(
            {
                "action": "query",
                "format": "json",
                "generator": "categorymembers",
                "gcmtitle": f"Category:{category}",
                "gcmtype": "file",
                "gcmlimit": "50",
                "prop": "imageinfo",
                "iiprop": "url|mime|extmetadata",
                "iiurlwidth": "1280",
                **continuation,
            }
        )
        for page in payload.get("query", {}).get("pages", {}).values():
            info = page.get("imageinfo", [{}])[0]
            metadata = info.get("extmetadata", {})
            license_name = metadata.get("LicenseShortName", {}).get("value", "")
            if info.get("mime") not in {"image/jpeg", "image/png"}:
                continue
            if not (license_name.startswith("CC") or license_name in {"Public domain", "PDM", "CC0"}):
                continue
            rows.append(
                {
                    "title": page["title"],
                    "url": info.get("thumburl") or info.get("url"),
                    "page": info.get("descriptionurl"),
                    "license": license_name,
                    "license_url": metadata.get("LicenseUrl", {}).get("value"),
                    "artist": metadata.get("Artist", {}).get("value", ""),
                    "categories": metadata.get("Categories", {}).get("value", ""),
                }
            )
            if len(rows) >= limit:
                break
        continuation = payload.get("continue", {})
        if not continuation:
            break
    return rows


def download(url: str, destination: Path) -> None:
    request = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    with open_with_retry(request) as response:
        destination.write_bytes(response.read())
    time.sleep(REQUEST_DELAY)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--pool-size", type=int, default=80)
    parser.add_argument("--sample-size", type=int, default=30)
    parser.add_argument("--seed", type=int, default=20260622)
    args = parser.parse_args()
    args.output.mkdir(parents=True, exist_ok=True)
    rng = random.Random(args.seed)
    manifest = {
        "source": "Wikimedia Commons category API",
        "api": API,
        "selection": "Candidates only; genus labels require manual visual review.",
        "classes": {},
    }
    for genus, categories in CATEGORIES.items():
        rows: list[dict] = []
        per_category = max(args.sample_size, args.pool_size // len(categories))
        for category in categories:
            rows.extend(category_files(category, per_category))
        rows = list({row["page"]: row for row in rows}.values())
        rng.shuffle(rows)
        selected = rows[: args.sample_size]
        directory = args.output / genus
        directory.mkdir(exist_ok=True)
        for index, row in enumerate(selected):
            suffix = ".png" if row["url"].lower().split("?")[0].endswith(".png") else ".jpg"
            filename = f"{index:03d}{suffix}"
            destination = directory / filename
            if not destination.exists():
                download(row["url"], destination)
            row["filename"] = filename
        manifest["classes"][genus] = {"categories": categories, "items": selected}
        (args.output / "candidates.json").write_text(json.dumps(manifest, indent=2) + "\n")
        print(json.dumps({"genus": genus, "available": len(rows), "downloaded": len(selected)}), flush=True)
    (args.output / "candidates.json").write_text(json.dumps(manifest, indent=2) + "\n")


if __name__ == "__main__":
    main()
