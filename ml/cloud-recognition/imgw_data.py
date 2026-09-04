"""Inspect/sample the public IMGW ZIP using bounded, snapshot-checked HTTP ranges."""

import argparse
from collections import Counter
import hashlib
import http.client
import io
import json
from pathlib import Path
import re
import urllib.parse
import zipfile


SOURCE_PAGE = "https://danepubliczne.imgw.pl/en/repository/Artificial-neural-networks-in-automatic-image-classifications-of-cloud-from-ground-based-observations-using-deep-learning-models"
ARCHIVE_URL = "https://danepubliczne.imgw.pl/repositoryData/acc%20group/1.0/cloud_atlas_imgw_genera_samples.zip"
ARCHIVE_SIZE = 2163944712
ARCHIVE_ETAG = '"80fb2d08-622c81f0dad50"'


class RangeReader(io.RawIOBase):
    def __init__(self, url=ARCHIVE_URL, size=ARCHIVE_SIZE, etag=ARCHIVE_ETAG):
        self.url, self.size, self.etag, self.position = url, size, etag, 0
        self.transferred = 0
        parsed = urllib.parse.urlsplit(url)
        if parsed.scheme != "https":
            raise ValueError("Dataset downloads require HTTPS")
        self.connection = http.client.HTTPSConnection(parsed.hostname, parsed.port or 443, timeout=90)
        self.request_path = parsed.path + ("?" + parsed.query if parsed.query else "")
        self.cache_start, self.cache = 0, b""

    def close(self):
        self.connection.close()
        super().close()

    def readable(self):
        return True

    def seekable(self):
        return True

    def tell(self):
        return self.position

    def seek(self, offset, whence=io.SEEK_SET):
        position = offset + ({io.SEEK_SET: 0, io.SEEK_CUR: self.position, io.SEEK_END: self.size}[whence])
        if position < 0:
            raise ValueError("Negative archive offset")
        self.position = position
        return position

    def read(self, size=-1):
        count = min(self.size - self.position, size if size >= 0 else self.size)
        if count <= 0:
            return b""
        if count > 32 * 1024 * 1024:
            raise ValueError("Refusing an unbounded archive read")
        offset = self.position - self.cache_start
        if offset >= 0 and offset + count <= len(self.cache):
            self.position += count
            return self.cache[offset:offset + count]
        start = self.position
        requested = min(self.size - start, max(count, 64 * 1024))
        end = start + requested - 1
        self.connection.request("GET", self.request_path, headers={"Range": f"bytes={start}-{end}",
                                                                 "If-Range": self.etag, "Accept-Encoding": "identity"})
        with self.connection.getresponse() as response:
            expected = f"bytes {start}-{end}/{self.size}"
            if response.status != 206 or response.headers.get("Content-Range") != expected:
                raise ValueError("Server ignored byte range or archive changed")
            if response.headers.get("ETag") != self.etag:
                raise ValueError("Archive snapshot changed")
            result = response.read(requested + 1)
        if len(result) != requested:
            raise ValueError("Incomplete archive range")
        self.cache_start, self.cache = start, result
        self.position += count
        self.transferred += requested
        return result[:count]


def main():
    parser = argparse.ArgumentParser()
    action = parser.add_mutually_exclusive_group(required=True)
    action.add_argument("--inspect", action="store_true")
    action.add_argument("--download", type=Path)
    args = parser.parse_args()
    with RangeReader() as source, zipfile.ZipFile(source) as archive:
        files = [entry for entry in archive.infolist() if not entry.is_dir()]
        if args.download:
            download_images(archive, files, args.download)
            return
        print(json.dumps({"source": SOURCE_PAGE, "archive_size": source.size, "etag": source.etag,
                          "file_count": len(files), "directory_counts": dict(Counter(entry.filename.rsplit('/', 1)[0] for entry in files)),
                          "examples": [{"name": entry.filename, "size": entry.file_size} for entry in files[:30]],
                          "metadata_files": [entry.filename for entry in files if not re.search(r"\.(jpg|jpeg|png)$", entry.filename, re.I)],
                          "bytes_downloaded": source.transferred}, indent=2))


def fingerprint(image):
    import numpy as np
    from PIL import Image
    digest = hashlib.sha256(image.tobytes() + str(image.size).encode()).hexdigest()
    small = np.asarray(image.convert("L").resize((17, 16), Image.Resampling.BILINEAR))
    value = 0
    for bit in (small[:, 1:] > small[:, :-1]).flat:
        value = (value << 1) | int(bit)
    return digest, f"{value:064x}"


def download_images(archive, files, output):
    from PIL import Image, ImageOps
    from labels import GENERA
    output.mkdir(parents=True, exist_ok=True)
    (output / "images").mkdir(exist_ok=True)
    metadata = output / "download.json"
    rows = json.loads(metadata.read_text())["rows"] if metadata.exists() else []
    by_name = {row["archive_name"]: row for row in rows}
    for index, entry in enumerate(sorted(files, key=lambda item: item.filename)):
        if not re.search(r"\.(jpg|jpeg|png)$", entry.filename, re.I):
            raise ValueError("Unexpected non-image file in this declared dataset")
        if entry.file_size > 32 * 1024 * 1024:
            raise ValueError("Unexpectedly large compressed member")
        existing = by_name.get(entry.filename)
        if existing and existing.get("fingerprint_version") == "dhash-256-bilinear" and Path(existing["path"]).exists():
            if hashlib.sha256(Path(existing["path"]).read_bytes()).hexdigest() != existing["artifact_sha256"]:
                raise ValueError("Downloaded image checksum changed")
            continue
        code = entry.filename.split("/")[-2].lower()
        genus = "clear_sky" if code == "clearsky" else code
        label = GENERA.index(genus)
        raw = archive.read(entry)
        identifier = hashlib.sha256(entry.filename.encode()).hexdigest()[:20]
        destination = output / "images" / f"{identifier}.jpg"
        with Image.open(io.BytesIO(raw)) as original:
            if original.width * original.height > 50_000_000:
                raise ValueError("Image exceeds the dataset memory budget")
            image = ImageOps.exif_transpose(original).convert("RGB")
            original_size = image.size
            digest, dhash = fingerprint(image)
            image.thumbnail((640, 640), Image.Resampling.LANCZOS)
            image.save(destination, "JPEG", quality=92, subsampling=0)
        row = {"id": f"imgw/{identifier}", "archive_name": entry.filename, "path": str(destination.resolve()),
               "label": label, "source": "imgw-2024-samples", "original_size": original_size,
               "original_file_sha256": hashlib.sha256(raw).hexdigest(), "pixel_sha256": digest, "dhash": dhash,
               "fingerprint_version": "dhash-256-bilinear",
               "artifact_sha256": hashlib.sha256(destination.read_bytes()).hexdigest()}
        if existing:
            rows.remove(existing)
        rows.append(row)
        pending = metadata.with_suffix(".pending.json")
        pending.write_text(json.dumps({"schema": 1, "source": SOURCE_PAGE, "url": ARCHIVE_URL,
                                       "archive_etag": ARCHIVE_ETAG, "archive_size": ARCHIVE_SIZE,
                                       "license": "CC-BY-4.0", "authors": "Szymon Kopec; Grzegorz Duniec; Bogdan Bochenek; Mariusz Figurski",
                                       "doi": "10.1002/qj.4865", "transform": "EXIF-oriented RGB; max 640 px; JPEG quality 92, no subsampling; no model-dependent filtering",
                                       "rows": rows}, indent=2) + "\n")
        pending.replace(metadata)
        if (index + 1) % 25 == 0:
            print(f"IMGW: {index + 1}/{len(files)}", flush=True)
    print(json.dumps({"completed": True, "image_count": len(rows), "metadata": str(metadata)}), flush=True)


if __name__ == "__main__":
    main()
