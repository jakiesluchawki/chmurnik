"""Compare the research Swift resampler with installed Pillow, without inference."""
import argparse
import hashlib
import json
from pathlib import Path
import subprocess

import numpy as np
from PIL import Image, __version__ as pillow_version


def digest(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--binary", required=True, type=Path)
    parser.add_argument("--output", required=True, type=Path)
    parser.add_argument("--photo-audit", type=Path)
    args = parser.parse_args()
    args.output.mkdir(parents=True, exist_ok=False)
    fixtures, expectations, descriptions = [], [], []

    def add(pixels, size, description):
        number = len(fixtures)
        height, width, channels = pixels.shape
        assert channels == 3 and pixels.dtype == np.uint8
        source = args.output / f"{number:03}-source.rgb"
        target = args.output / f"{number:03}-actual.rgb"
        expected = args.output / f"{number:03}-expected.rgb"
        source.write_bytes(pixels.tobytes())
        expected.write_bytes(Image.fromarray(pixels).resize(size, Image.Resampling.BILINEAR).tobytes())
        fixtures.append(dict(input=str(source.resolve()), output=str(target.resolve()),
                             width=width, height=height, outputWidth=size[0], outputHeight=size[1]))
        expectations.append(expected)
        descriptions.append(description)

    rng = np.random.default_rng(7042)
    shapes = [(1, 1), (1, 17), (17, 1), (2, 3), (3, 2), (17, 31),
              (31, 17), (248, 248), (400, 400), (640, 180), (180, 640)]
    for width, height in shapes:
        yy, xx, cc = np.indices((height, width, 3))
        patterns = {
            "black": np.zeros((height, width, 3), dtype=np.uint8),
            "white": np.full((height, width, 3), 255, dtype=np.uint8),
            "ramp": ((xx * 11 + yy * 17 + cc * 53) % 256).astype(np.uint8),
            "checker": (((xx + yy + cc) % 2) * 255).astype(np.uint8),
            "random": rng.integers(0, 256, (height, width, 3), dtype=np.uint8),
        }
        targets = [(width, height), (1, 1), (23, 29), (width, 19), (19, height), (248, 248)]
        for name, pixels in patterns.items():
            for target in dict.fromkeys(targets):
                add(pixels, target, f"{name}:{width}x{height}->{target[0]}x{target[1]}")
    if args.photo_audit:
        photo_paths = sorted(args.photo_audit.glob("*-native-decoded.png"))
        if len(photo_paths) != 7:
            raise ValueError("The declared seven-photo audit must contain exactly seven decoded images")
        for path in photo_paths:
            with Image.open(path) as original:
                pixels = np.asarray(original.convert("RGB"))
            height, width = pixels.shape[:2]
            short = round(224 / .902)
            size = (short, int(short * height / width)) if width <= height else (int(short * width / height), short)
            add(pixels, size, f"same-native-decode:{path.name}")

    selection = args.output / "inputs.json"
    selection.write_text(json.dumps(fixtures, indent=2) + "\n")
    subprocess.run([str(args.binary.resolve()), str(selection.resolve())], check=True)
    rows = []
    for fixture, expected, description in zip(fixtures, expectations, descriptions):
        actual = Path(fixture["output"])
        a = np.frombuffer(actual.read_bytes(), dtype=np.uint8)
        b = np.frombuffer(expected.read_bytes(), dtype=np.uint8)
        assert a.shape == b.shape
        error = np.abs(a.astype(int) - b.astype(int))
        rows.append(dict(description=description, source_sha256=digest(fixture["input"]),
                         expected_sha256=digest(expected), actual_sha256=digest(actual),
                         mismatch_count=int(np.count_nonzero(error)), max_error=int(error.max())))
    report = dict(pillow_version=pillow_version, binary_sha256=digest(args.binary),
                  verifier_sha256=digest(__file__), input_manifest_sha256=digest(selection),
                  passed=all(row["mismatch_count"] == 0 for row in rows), rows=rows)
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
