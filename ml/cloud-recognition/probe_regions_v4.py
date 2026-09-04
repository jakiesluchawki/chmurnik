"""Visual QA of native proposals; not a labeled segmentation benchmark."""

import argparse
import json
from pathlib import Path
import subprocess
import tempfile

import numpy as np
from PIL import Image, ImageDraw, ImageOps
import torch
from torchvision.transforms.functional import to_tensor

from labels import GENERA
from model import build_model
from skyseg_model import SkySegmentation
from appearance_regions import propose as appearance_proposals


@torch.inference_mode()
def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--manifest", type=Path, required=True)
    parser.add_argument("--checkpoint", type=Path, required=True)
    parser.add_argument("--native", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--sky-model", type=Path)
    parser.add_argument("--appearance", action="store_true")
    args = parser.parse_args()
    if args.appearance and not args.sky_model:
        raise ValueError("Appearance proposals require the learned sky mask")
    if args.output.exists():
        raise ValueError("Preserve previous visual QA")
    args.output.mkdir(parents=True)
    torch.set_num_threads(2)
    checkpoint = torch.load(args.checkpoint, map_location="cpu", weights_only=True)
    model = build_model(len(GENERA), architecture=checkpoint["architecture"]).eval()
    model.load_state_dict(checkpoint["state_dict"])
    del checkpoint
    sky = SkySegmentation(args.sky_model).eval() if args.sky_model else None
    manifest = json.loads(args.manifest.read_text())
    atlas = [row for row in manifest["rows"] if row["source"] == "atlas"]
    selected = [next(row for row in atlas if row["label"] == label) for label in range(10)]
    previews, reports = [], []
    with tempfile.TemporaryDirectory(prefix="chmurnik-region-probe-") as temporary:
        feature_path, result_path = Path(temporary) / "features.json", Path(temporary) / "regions.json"
        for row in selected:
            with Image.open(row["path"]) as original:
                image = ImageOps.exif_transpose(original).convert("RGB")
            reduced = ImageOps.contain(image, (224, 224), Image.Resampling.BILINEAR)
            x, y = (224 - reduced.width) // 2, (224 - reduced.height) // 2
            full = Image.new("RGB", (224, 224), (124, 116, 104))
            full.paste(reduced, (x, y))
            tokens = model.backbone.forward_features((to_tensor(full).unsqueeze(0) - model.image_mean) / model.image_std)["x_norm_patchtokens"]
            request = {"features": tokens.flatten().tolist(), "columns": 16, "rows": 16,
                       "channels": 384, "content": [x / 224, y / 224, reduced.width / 224, reduced.height / 224]}
            if sky is not None:
                mask = sky(to_tensor(image.resize((384, 384), Image.Resampling.BILINEAR)).unsqueeze(0))[0, 0].numpy()
                letterbox = np.zeros((224, 224), dtype=np.float32)
                letterbox[y:y + reduced.height, x:x + reduced.width] = np.asarray(Image.fromarray(mask).resize(reduced.size, Image.Resampling.BILINEAR))
                request["skyScores"] = letterbox.reshape(16, 14, 16, 14).mean(axis=(1, 3)).flatten().tolist()
            if args.appearance:
                grid = np.asarray(image.resize((96, 96), Image.Resampling.BILINEAR), dtype=np.float32)
                sky_grid = np.asarray(Image.fromarray(mask).resize((96, 96), Image.Resampling.BILINEAR))
                regions = appearance_proposals(grid, sky_grid)
            else:
                feature_path.write_text(json.dumps(request))
                subprocess.run([str(args.native), str(feature_path), str(result_path)], check=True)
                regions = json.loads(result_path.read_text())
            preview = ImageOps.contain(image, (360, 240), Image.Resampling.LANCZOS)
            draw = ImageDraw.Draw(preview)
            for index, region in enumerate(regions):
                left, top, width, height = region["bounds"]
                rectangle = [left * preview.width, top * preview.height, (left + width) * preview.width, (top + height) * preview.height]
                draw.rectangle(rectangle, outline=(255, 0, 200), width=2)
                draw.text((rectangle[0] + 3, rectangle[1] + 3), str(index + 1), fill="black", stroke_width=2, stroke_fill="white")
            card = Image.new("RGB", (380, 280), "white")
            card.paste(preview, ((380 - preview.width) // 2, 30))
            ImageDraw.Draw(card).text((10, 8), f"{GENERA[row['label']]} | {len(regions)} visual regions", fill="black")
            previews.append(card)
            reports.append({"id": row["id"], "source_label": GENERA[row["label"]], "regions": regions})
            print(f"{GENERA[row['label']]}: {len(regions)} regions", flush=True)
    contact = Image.new("RGB", (380 * 2, 280 * 5), "#ddd")
    for index, preview in enumerate(previews):
        contact.paste(preview, ((index % 2) * 380, (index // 2) * 280))
    contact.save(args.output / "contact.jpg", quality=92)
    (args.output / "regions.json").write_text(json.dumps({"warning": "Unsupervised visual components only. Neither automatic cloud labels nor segmentation-accuracy evidence.", "rows": reports}, indent=2) + "\n")


if __name__ == "__main__":
    main()
