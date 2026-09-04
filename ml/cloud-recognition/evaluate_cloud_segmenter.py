"""Locked-checkpoint test evaluation, plus separately labeled visual transfer QA."""

import argparse
from collections import defaultdict
import json
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageOps
import torch
from torch.nn import functional as F
from torch.utils.data import DataLoader
from torchvision.transforms.functional import to_tensor

from cloud_segmenter import CloudSegmenter
from dlr_segmentation_data import binary_labels, load_manifest, read_pair, sha256
from labels import GENERA
from segmentation_metrics import appearance_mask, confusion, metrics, summarize
from skyseg_model import SkySegmentation
from train_cloud_segmenter import evaluate, SegmentationDataset


def checked_candidate(checkpoint, manifest):
    training = json.loads((checkpoint.parent / "training.json").read_text())
    if training["checkpoint_sha256"] != sha256(checkpoint):
        raise ValueError("Checkpoint changed since validation selection")
    saved = torch.load(checkpoint, map_location="cpu", weights_only=True)
    if training["contract"] != saved["contract"] or saved["contract"]["manifest_sha256"] != sha256(manifest):
        raise ValueError("Candidate/data provenance mismatch")
    if saved["epoch"] != training["selected_epoch"] or saved["validation"] != training["validation"]:
        raise ValueError("Candidate validation evidence mismatch")
    history = training["history"]
    if [row["epoch"] for row in history] != list(range(1, 31)):
        raise ValueError("Declared training trial has not completed")
    chosen = max(history, key=lambda row: row["validation"]["cloud_iou"])
    if chosen["epoch"] != saved["epoch"] or chosen["validation"] != saved["validation"]["summary"]:
        raise ValueError("Checkpoint is not the declared best validation epoch")
    for name, digest in saved["contract"]["sources"].items():
        if sha256(Path(__file__).parent / name) != digest:
            raise ValueError(f"Source changed since training: {name}")
    return saved


def row_report(row, counts):
    return {"id": row["id"], "group": row["group"], "day": row["day"], "camera": row["camera"],
            "counts": counts, **metrics(counts)}


@torch.inference_mode()
def evaluate_test(model, root, rows, device):
    result = evaluate(model, DataLoader(SegmentationDataset(root, rows), batch_size=16), device)
    baseline, full, full_baseline = [], [], []
    for row in rows:
        image, mask = read_pair(root, row)
        target, valid = binary_labels(mask)
        baseline.append(row_report(row, confusion(appearance_mask(np.asarray(image), valid), target, valid)))
        image512, mask512 = read_pair(root, row, size=512)
        target512, valid512 = binary_labels(mask512)
        probability = model(to_tensor(image)[None].to(device)).sigmoid()
        prediction512 = F.interpolate(probability, size=(512, 512), mode="bilinear", align_corners=False)[0, 0].cpu().numpy() >= .5
        full.append(row_report(row, confusion(prediction512, target512, valid512)))
        full_baseline.append(row_report(row, confusion(appearance_mask(np.asarray(image512), valid512), target512, valid512)))
    cameras = defaultdict(list)
    for row in result["rows"]:
        cameras[row["camera"]].append(row)
    return {"mask_grid": "256x256, nearest-neighbor ground truth", "model": result,
            "rgb_baseline": {"summary": summarize(baseline), "rows": baseline},
            "full_resolution": {"mask_grid": "512x512 original ground truth; bilinear probability upsample, threshold .5",
                                "model": {"summary": summarize(full), "rows": full},
                                "rgb_baseline": {"summary": summarize(full_baseline), "rows": full_baseline}},
            "by_camera": {name: summarize(values) for name, values in cameras.items()}}


def overlay(image, score):
    values = np.asarray(image).astype(np.float32)
    color = np.array([185, 35, 210], dtype=np.float32)
    alpha = np.asarray(score, dtype=np.float32)[..., None] * .60
    return Image.fromarray(np.uint8(np.clip(values * (1 - alpha) + color * alpha, 0, 255)))


@torch.inference_mode()
def atlas_qa(model, manifest_path, sky_path, output, device):
    atlas = json.loads(manifest_path.read_text())
    rows = [row for row in atlas["rows"] if row["source"] == "atlas"]
    sky = SkySegmentation(sky_path).eval().to(device)
    cards, details = [], []
    for row in rows:
        with Image.open(row["path"]) as original:
            photo = ImageOps.exif_transpose(original).convert("RGB")
        prediction = model(to_tensor(photo.resize((256, 256), Image.Resampling.BILINEAR))[None].to(device)).sigmoid()[0, 0].cpu().numpy()
        sky_map = sky(to_tensor(photo.resize((384, 384), Image.Resampling.BILINEAR))[None].to(device))[0, 0].cpu().numpy()
        sky_map = np.asarray(Image.fromarray(sky_map).resize((256, 256), Image.Resampling.BILINEAR))
        masked = (prediction >= .5) & (sky_map >= .7)
        preview = ImageOps.contain(photo, (300, 220), Image.Resampling.LANCZOS)
        mask_preview = Image.fromarray((masked * 255).astype(np.uint8)).resize(preview.size, Image.Resampling.NEAREST)
        heat_preview = Image.fromarray(prediction).resize(preview.size, Image.Resampling.BILINEAR)
        card = Image.new("RGB", (960, 270), "#faf7f1")
        draw = ImageDraw.Draw(card)
        draw.text((10, 6), f"{GENERA[row['label']]} | {Path(row['path']).name}", fill="black")
        for column, (label, image) in enumerate([
                ("Original (no region ground truth)", preview),
                ("Cloud score (purple = higher)", overlay(preview, heat_preview)),
                ("Cloud >=.5 AND sky >=.7", overlay(preview, np.asarray(mask_preview) / 255))]):
            draw.text((column * 320 + 10, 24), label, fill="black")
            card.paste(image, (column * 320 + 10, 46))
        cards.append(card)
        details.append({"id": row["id"], "genus_reference": GENERA[row["label"]],
                        "raw_cloud_fraction": float((prediction >= .5).mean()), "sky_masked_cloud_fraction": float(masked.mean())})
    for start in range(0, len(cards), 6):
        selected = cards[start:start + 6]
        sheet = Image.new("RGB", (960, 270 * len(selected)), "white")
        for index, card in enumerate(selected):
            sheet.paste(card, (0, index * 270))
        sheet.save(output / f"atlas-{start // 6 + 1:02d}.jpg", quality=92)
    (output / "atlas.json").write_text(json.dumps({"warning": "Visual transfer QA only, not a labeled segmentation benchmark or genus prediction",
                                                 "atlas_manifest_sha256": sha256(manifest_path), "rows": details}, indent=2) + "\n")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--manifest", type=Path, required=True)
    parser.add_argument("--checkpoint", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--atlas-manifest", type=Path)
    parser.add_argument("--sky-model", type=Path)
    parser.add_argument("--device", choices=["mps", "cpu"], default="mps")
    args = parser.parse_args()
    if args.output.exists():
        raise ValueError("Preserve original test exposure and visual QA")
    if bool(args.atlas_manifest) != bool(args.sky_model):
        raise ValueError("Atlas QA needs the separate pinned sky-versus-ground model")
    manifest = load_manifest(args.manifest)
    saved = checked_candidate(args.checkpoint, args.manifest)
    device = torch.device(args.device)
    if device.type == "mps" and not torch.backends.mps.is_available():
        raise ValueError("MPS unavailable")
    torch.set_num_threads(4)
    model = CloudSegmenter().eval().to(device)
    model.load_state_dict(saved["state_dict"], strict=True)
    args.output.mkdir(parents=True)
    protocol = {"checkpoint_sha256": sha256(args.checkpoint), "manifest_sha256": sha256(args.manifest),
                "evaluation_code_sha256": sha256(__file__), "selected_epoch": saved["epoch"],
                "threshold": .5, "release_approved": False, "test_exposed": True,
                "scope": "cloud/clear pixels on all-sky cameras, not phone segmentation or cloud genera"}
    (args.output / "protocol.json").write_text(json.dumps(protocol, indent=2) + "\n")
    result = evaluate_test(model, args.manifest.parent, [row for row in manifest["rows"] if row["split"] == "test"], device)
    val, test = saved["validation"]["summary"], result["model"]["summary"]
    gates = {"validation_iou": val["cloud_iou"] >= .7, "test_iou": test["cloud_iou"] >= .7,
             "validation_precision": val["precision"] >= .8, "test_precision": test["precision"] >= .8,
             "better_than_rgb": test["cloud_iou"] > result["rgb_baseline"]["summary"]["cloud_iou"]}
    report = {"protocol": protocol, "validation": val, "test": result, "research_gates": gates,
              "research_passed": all(gates.values()), "release_approved": False}
    (args.output / "evaluation.json").write_text(json.dumps(report, indent=2, allow_nan=False) + "\n")
    print(json.dumps({"test": test, "rgb": result["rgb_baseline"]["summary"], "gates": gates}, indent=2), flush=True)
    if args.atlas_manifest:
        atlas_qa(model, args.atlas_manifest, args.sky_model, args.output, device)
        print("Atlas visual transfer sheets saved; these are not labeled segmentation scores.", flush=True)


if __name__ == "__main__":
    main()
