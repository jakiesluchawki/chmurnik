"""Isolate native thumbnailing from reference resampling on synthetic RGB PNGs."""
import argparse
import json
from pathlib import Path
import resource
import subprocess

import numpy as np
from PIL import Image, ImageOps, __version__ as pillow_version

from verify import digest


def pixels_for(width, height, pattern):
    x = np.arange(width, dtype=np.uint32)[None, :]
    y = np.arange(height, dtype=np.uint32)[:, None]
    rgb = np.empty((height, width, 3), dtype=np.uint8)
    for channel in range(3):
        if pattern == "smooth":
            rgb[:, :, channel] = (x * 85 // max(1, width - 1) + y * 85 // max(1, height - 1) + channel * 31)
        else:
            rgb[:, :, channel] = (x * 11 + y * 17 + channel * 53) % 256
    return rgb


def prepared(image):
    oriented = ImageOps.exif_transpose(image).convert("RGB")
    width, height = oriented.size
    short = round(224 / .902)
    size = (short, int(short * height / width)) if width <= height else (int(short * width / height), short)
    resized = oriented.resize(size, Image.Resampling.BILINEAR)
    left, top = (round((side - 224) / 2) for side in size)
    return resized.crop((left, top, left + 224, top + 224))


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--binary", required=True, type=Path)
    parser.add_argument("--output", required=True, type=Path)
    args = parser.parse_args()
    args.output.mkdir(parents=True, exist_ok=False)
    inputs, selections = [], []
    for width, height in [(2048, 1536), (3072, 2048), (4032, 3024)]:
        for pattern in ("smooth", "stripes"):
            original = Image.fromarray(pixels_for(width, height, pattern))
            for orientation in range(1, 9):
                name = f"{width}x{height}-{pattern}-orientation{orientation}"
                source = args.output / f"{name}-source.png"
                expected = args.output / f"{name}-expected.png"
                exif = Image.Exif()
                exif[274] = orientation
                original.save(source, exif=exif)
                with Image.open(source) as saved:
                    prepared(saved).save(expected)
                for limit in (1800, 4096):
                    actual = args.output / f"{name}-limit{limit}.png"
                    inputs.append(dict(input=str(source.resolve()), output=str(actual.resolve()), maximumSide=limit))
                    selections.append(dict(name=name, maximumSide=limit, expected=str(expected),
                                           width=width, height=height, pattern=pattern, orientation=orientation))
            original.close()
    assert len(inputs) == 96
    manifest = args.output / "inputs.json"
    manifest.write_text(json.dumps(inputs, indent=2) + "\n")
    subprocess.run([str(args.binary.resolve()), "--images", str(manifest.resolve())], check=True)
    rows = []
    for item, selection in zip(inputs, selections):
        with Image.open(item["output"]) as actual, Image.open(selection["expected"]) as expected:
            a, b = np.asarray(actual.convert("RGB")), np.asarray(expected.convert("RGB"))
        assert a.shape == b.shape == (224, 224, 3)
        delta = np.abs(a.astype(int) - b.astype(int))
        rows.append({**selection, "source_sha256": digest(item["input"]), "actual_sha256": digest(item["output"]),
                     "expected_sha256": digest(selection["expected"]), "mean_error": float(delta.mean()),
                     "maximum_error": int(delta.max()), "mismatch_count": int(np.count_nonzero(delta))})
    arms = {}
    for limit in (1800, 4096):
        selected = [row for row in rows if row["maximumSide"] == limit]
        arms[str(limit)] = dict(cases=len(selected), exact_matches=sum(row["mismatch_count"] == 0 for row in selected),
                                maximum_error=max(row["maximum_error"] for row in selected),
                                mean_error=float(np.mean([row["mean_error"] for row in selected])))
    result = dict(scope="Synthetic lossless PNG thumbnail-limit diagnostic, not app camera or classifier QA",
                  pillow_version=pillow_version, binary_sha256=digest(args.binary), verifier_sha256=digest(__file__),
                  input_manifest_sha256=digest(manifest), arms=arms,
                  child_peak_rss=resource.getrusage(resource.RUSAGE_CHILDREN).ru_maxrss,
                  parent_peak_rss=resource.getrusage(resource.RUSAGE_SELF).ru_maxrss,
                  passed=arms["4096"]["exact_matches"] == 48, rows=rows)
    (args.output / "report.json").write_text(json.dumps(result, indent=2) + "\n")
    print(json.dumps({key: value for key, value in result.items() if key != "rows"}, indent=2))
    if not result["passed"]:
        raise SystemExit(1)


if __name__ == "__main__":
    main()
