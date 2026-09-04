"""Check original-photo ImageIO/CoreGraphics -> Core ML, preserving RGB evidence."""

import argparse
import json
from pathlib import Path
import subprocess
import zipfile

import numpy as np
from PIL import Image
import torch
from torchvision.transforms.functional import to_tensor

from cloud_segmenter import CloudSegmenter
from dlr_segmentation_data import binary_labels, load_manifest, read_pair, sha256
from evaluate_cloud_segmenter import checked_candidate, row_report
from segmentation_metrics import confusion, summarize


@torch.inference_mode()
def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--manifest", type=Path, required=True)
    parser.add_argument("--atlas-manifest", type=Path, required=True)
    parser.add_argument("--checkpoint", type=Path, required=True)
    parser.add_argument("--export", type=Path, required=True)
    parser.add_argument("--evaluation", type=Path, required=True)
    parser.add_argument("--native", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()
    if args.output.exists():
        raise ValueError("Preserve the previous native run")
    manifest = load_manifest(args.manifest)
    saved = checked_candidate(args.checkpoint, args.manifest)
    parity = json.loads((args.export / "parity.json").read_text())
    package = args.export / "CloudMaskV4Research.mlpackage"
    files = {str(file.relative_to(package)): sha256(file) for file in sorted(package.rglob("*")) if file.is_file()}
    if not parity["passed"] or parity["package_files"] != files or parity["checkpoint_sha256"] != sha256(args.checkpoint):
        raise ValueError("Package does not match the parity-checked candidate")
    if parity["manifest_sha256"] != sha256(args.manifest) or parity["evaluation_sha256"] != sha256(args.evaluation):
        raise ValueError("Evaluation/data changed since export")
    evaluation = json.loads(args.evaluation.read_text())
    args.output.mkdir(parents=True)
    originals = args.output / "originals"
    originals.mkdir()
    requests, test_rows = [], {}
    for row in manifest["rows"]:
        if row["split"] != "test":
            continue
        path = originals / f"{len(requests):03d}.jpg"
        with zipfile.ZipFile(args.manifest.parent / row["archive"]) as archive:
            path.write_bytes(archive.read(row["image"]))
        requests.append({"id": row["id"], "path": str(path.resolve())})
        test_rows[row["id"]] = row
    atlas = json.loads(args.atlas_manifest.read_text())
    requests.extend({"id": row["id"], "path": row["path"]} for row in atlas["rows"] if row["source"] == "atlas")
    # Eight lossless EXIF orientations provide a separate geometry regression,
    # not eight additional independent cloud-segmentation test photographs.
    with Image.open(requests[0]["path"]) as original:
        image = original.convert("RGB").crop((0, 0, 400, 280))
    orientations = {2: Image.Transpose.FLIP_LEFT_RIGHT, 3: Image.Transpose.ROTATE_180,
                    4: Image.Transpose.FLIP_TOP_BOTTOM, 5: Image.Transpose.TRANSPOSE,
                    6: Image.Transpose.ROTATE_90, 7: Image.Transpose.TRANSVERSE, 8: Image.Transpose.ROTATE_270}
    for orientation in range(1, 9):
        pixels = image if orientation == 1 else image.transpose(orientations[orientation])
        exif = Image.Exif()
        exif[274] = orientation
        path = originals / f"orientation-{orientation}.tiff"
        pixels.save(path, format="TIFF", compression="tiff_lzw", exif=exif)
        requests.append({"id": f"orientation-{orientation}", "path": str(path.resolve())})
    request_path = args.output / "request.json"
    request_path.write_text(json.dumps(requests, indent=2) + "\n")
    subprocess.run([str(args.native.resolve()), str(request_path.resolve()), str(package.resolve()),
                    str((args.output / "native").resolve())], check=True)
    native = json.loads((args.output / "native/results.json").read_text())
    if [row["id"] for row in native] != [row["id"] for row in requests]:
        raise ValueError("Native probe returned mismatched rows")
    torch.set_num_threads(2)
    model = CloudSegmenter().eval()
    model.load_state_dict(saved["state_dict"])
    reports, measured, orientation_pixels = [], [], {}
    for row in native:
        with Image.open(row["input"]) as original:
            image = original.convert("RGB")
        expected = model(to_tensor(image)[None]).sigmoid()[0, 0].numpy()
        actual = np.fromfile(row["mask"], dtype="<f4").reshape(256, 256)
        reports.append({"id": row["id"], "max_probability_error": float(np.abs(expected - actual).max()),
                        "binary_agreement": float(((expected >= .5) == (actual >= .5)).mean()),
                        "native_seconds_including_preprocess_and_evidence_write": row["seconds"]})
        if row["id"] in test_rows:
            source = test_rows[row["id"]]
            _, mask = read_pair(args.manifest.parent, source)
            target, valid = binary_labels(mask)
            measured.append(row_report(source, confusion(actual >= .5, target, valid)))
        if row["id"].startswith("orientation-"):
            orientation_pixels[row["id"]] = np.asarray(image, dtype=np.int16)
    geometry = {key: int(np.abs(value - orientation_pixels["orientation-1"]).max()) for key, value in orientation_pixels.items()}
    metrics = summarize(measured)
    drop = evaluation["test"]["model"]["summary"]["cloud_iou"] - metrics["cloud_iou"]
    gates = {"identical_native_pixels": all(row["max_probability_error"] <= .01 and row["binary_agreement"] >= .995 for row in reports),
             "test_iou_drop_at_most_one_point": drop <= .01,
             "all_exif_orientations": all(error <= 2 for error in geometry.values())}
    report = {"passed": all(gates.values()), "gates": gates, "release_approved": False,
              "scope": "native Mac ImageIO/CoreGraphics/CoreML with real JPEGs and EXIF fixtures; not iPhone application QA",
              "checkpoint_sha256": sha256(args.checkpoint), "native_binary_sha256": sha256(args.native),
              "export_parity_sha256": sha256(args.export / "parity.json"), "rows": reports,
              "test": {"summary": metrics, "rows": measured}, "test_iou_drop": drop,
              "exif_max_rgb_difference": geometry}
    (args.output / "evaluation.json").write_text(json.dumps(report, indent=2) + "\n")
    print(json.dumps({"gates": gates, "test_iou": metrics["cloud_iou"], "iou_drop": drop,
                      "max_probability_error": max(row["max_probability_error"] for row in reports),
                      "exif_max_rgb_difference": geometry}, indent=2), flush=True)
    if not all(gates.values()):
        raise ValueError("Native original-image validation failed")


if __name__ == "__main__":
    main()
