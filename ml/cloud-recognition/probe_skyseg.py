"""Verify converted sky masks against NCNN, then render known atlas diagnostics."""

import argparse
import json
from pathlib import Path
import time

import ncnn
import numpy as np
from PIL import Image, ImageDraw, ImageOps
import torch
from torchvision.transforms.functional import to_tensor

from labels import GENERA
from skyseg_model import REVISION, STEM, SkySegmentation


@torch.inference_mode()
def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--model", type=Path, required=True)
    parser.add_argument("--manifest", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()
    if args.output.exists():
        raise ValueError("Preserve previous mask QA")
    args.output.mkdir(parents=True)
    torch.set_num_threads(2)
    model = SkySegmentation(args.model).eval()
    net = ncnn.Net()
    net.opt.use_vulkan_compute = False
    net.opt.num_threads = 2
    net.opt.use_fp16_storage = False
    net.opt.use_fp16_arithmetic = False
    if net.load_param(str(args.model / (STEM + ".param"))) or net.load_model(str(args.model / (STEM + ".bin"))):
        raise ValueError("NCNN could not load the source")
    rows = json.loads(args.manifest.read_text())["rows"]
    selected = [next(row for row in rows if row["source"] == "atlas" and row["label"] == label) for label in range(10)]
    cards, reports = [], []
    for row in selected:
        with Image.open(row["path"]) as original:
            image = ImageOps.exif_transpose(original).convert("RGB")
        tensor = to_tensor(image.resize((384, 384), Image.Resampling.BILINEAR)).unsqueeze(0)
        started = time.monotonic()
        mask = model(tensor)[0, 0].numpy()
        elapsed = time.monotonic() - started
        normalized = ((tensor - model.mean) / model.std)[0].numpy().copy()
        with net.create_extractor() as extractor:
            if extractor.input("input.1", ncnn.Mat(normalized).clone()):
                raise ValueError("NCNN input failed")
            status, result = extractor.extract("1959")
            if status:
                raise ValueError("NCNN output failed")
            reference = np.asarray(result).copy().reshape(384, 384)
        error = float(np.max(np.abs(mask - reference)))
        agreement = float(np.mean((mask >= .5) == (reference >= .5)))
        report = {"id": row["id"], "max_absolute_error": error, "binary_mask_agreement": agreement,
                  "cpu_seconds": elapsed, "sky_fraction": float(np.mean(mask >= .5))}
        reports.append(report)
        preview = ImageOps.contain(image, (360, 240), Image.Resampling.LANCZOS)
        alpha = Image.fromarray(np.uint8(np.clip(mask, 0, 1) * 130)).resize(preview.size, Image.Resampling.BILINEAR)
        overlay = Image.composite(Image.new("RGB", preview.size, "#7246ff"), preview, alpha)
        card = Image.new("RGB", (760, 280), "white")
        card.paste(preview, (10, 30))
        card.paste(overlay, (390, 30))
        ImageDraw.Draw(card).text((10, 8), f"{GENERA[row['label']]} | violet = sky | parity {error:.6f}", fill="black")
        cards.append(card)
        print(json.dumps(report), flush=True)
    contact = Image.new("RGB", (760, 280 * len(cards)), "#ddd")
    for index, card in enumerate(cards):
        contact.paste(card, (0, 280 * index))
    contact.save(args.output / "contact.jpg", quality=92)
    passed = all(row["max_absolute_error"] <= .01 and row["binary_mask_agreement"] >= .995 for row in reports)
    (args.output / "report.json").write_text(json.dumps({"revision": REVISION, "parity_passed": passed, "rows": reports}, indent=2) + "\n")
    if not passed:
        raise ValueError("Sky model conversion parity failed")


if __name__ == "__main__":
    main()
