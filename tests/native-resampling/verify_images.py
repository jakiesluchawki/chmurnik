"""Check lossless RGB/EXIF integration; not JPEG decoder or cloud accuracy QA."""
import argparse
import json
from pathlib import Path
import subprocess

import numpy as np
from PIL import Image, ImageOps, __version__ as pillow_version

from verify import digest


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--binary", required=True, type=Path)
    parser.add_argument("--output", required=True, type=Path)
    args = parser.parse_args()
    args.output.mkdir(parents=True, exist_ok=False)
    entries = []
    expected_paths = []
    # Asymmetric channel patterns expose rotations, mirroring and channel swaps.
    for width, height in [(1, 1), (1, 17), (17, 1), (2, 3), (3, 2), (31, 17),
                          (17, 31), (248, 248), (400, 400), (640, 180), (180, 640), (1800, 1200)]:
        y, x, c = np.indices((height, width, 3))
        image = Image.fromarray(((x * 11 + y * 17 + c * 53) % 256).astype(np.uint8))
        for orientation in range(1, 9):
            name = f"{width}x{height}-orientation{orientation}"
            source, actual, expected = [args.output / f"{name}-{kind}.png" for kind in ("source", "actual", "expected")]
            exif = Image.Exif()
            exif[274] = orientation
            image.save(source, exif=exif)
            with Image.open(source) as decoded:
                oriented = ImageOps.exif_transpose(decoded).convert("RGB")
                w, h = oriented.size
                short = round(224 / .902)
                resized_size = (short, int(short * h / w)) if w <= h else (int(short * w / h), short)
                resized = oriented.resize(resized_size, Image.Resampling.BILINEAR)
                left, top = (round((side - 224) / 2) for side in resized_size)
                resized.crop((left, top, left + 224, top + 224)).save(expected)
            entries.append(dict(input=str(source.resolve()), output=str(actual.resolve())))
            expected_paths.append(expected)
    inputs = args.output / "inputs.json"
    inputs.write_text(json.dumps(entries, indent=2) + "\n")
    subprocess.run([str(args.binary.resolve()), "--images", str(inputs.resolve())], check=True)
    rows = []
    for entry, expected in zip(entries, expected_paths):
        with Image.open(entry["output"]) as actual_image, Image.open(expected) as expected_image:
            actual = np.asarray(actual_image.convert("RGB"))
            wanted = np.asarray(expected_image.convert("RGB"))
        assert actual.shape == wanted.shape == (224, 224, 3)
        delta = np.abs(actual.astype(int) - wanted.astype(int))
        rows.append(dict(input=Path(entry["input"]).name, source_sha256=digest(entry["input"]),
                         actual_sha256=digest(entry["output"]), expected_sha256=digest(expected),
                         max_error=int(delta.max()), mismatch_count=int(np.count_nonzero(delta))))
    report = dict(pillow_version=pillow_version, binary_sha256=digest(args.binary), verifier_sha256=digest(__file__),
                  input_manifest_sha256=digest(inputs), passed=all(row["mismatch_count"] == 0 for row in rows), rows=rows)
    (args.output / "report.json").write_text(json.dumps(report, indent=2) + "\n")
    print(json.dumps({key: value for key, value in report.items() if key != "rows"}, indent=2))
    print(f"Cases: {len(rows)}; failing: {sum(row['mismatch_count'] != 0 for row in rows)}")
    for row in rows:
        if row["mismatch_count"]:
            print(json.dumps(row))
    if not report["passed"]:
        raise SystemExit(1)


if __name__ == "__main__":
    main()
