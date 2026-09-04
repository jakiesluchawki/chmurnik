"""Visual QA of Swift region proposals from actual native cloud scores."""

import argparse
import json
from pathlib import Path
import subprocess
import tempfile

import numpy as np
from PIL import Image, ImageDraw, ImageOps
import torch
from torchvision.transforms.functional import to_tensor

from dlr_segmentation_data import sha256
from labels import GENERA
from skyseg_model import SkySegmentation


@torch.inference_mode()
def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--native-evaluation", type=Path, required=True)
    parser.add_argument("--atlas-manifest", type=Path, required=True)
    parser.add_argument("--sky-model", type=Path, required=True)
    parser.add_argument("--native-regions", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()
    evaluation = json.loads(args.native_evaluation.read_text())
    if not evaluation["passed"]:
        raise ValueError("Native mask verification must pass first")
    if args.output.exists():
        raise ValueError("Preserve earlier visual QA")
    args.output.mkdir(parents=True)
    root = args.native_evaluation.parent
    native = {row["id"]: row for row in json.loads((root / "native/results.json").read_text())}
    manifest = json.loads(args.atlas_manifest.read_text())
    torch.set_num_threads(2)
    sky = SkySegmentation(args.sky_model).eval()
    cards, reports = [], []
    with tempfile.TemporaryDirectory(prefix="chmurnik-mask-regions-") as temporary:
        request, response = Path(temporary) / "request.json", Path(temporary) / "response.json"
        for row in manifest["rows"]:
            if row["source"] != "atlas":
                continue
            with Image.open(row["path"]) as original:
                photo = ImageOps.exif_transpose(original).convert("RGB")
            cloud = np.fromfile(native[row["id"]]["mask"], dtype="<f4").reshape(256, 256)
            mask = sky(to_tensor(photo.resize((384, 384), Image.Resampling.BILINEAR))[None])[0, 0].numpy()
            mask = np.asarray(Image.fromarray(mask).resize((256, 256), Image.Resampling.BILINEAR))
            request.write_text(json.dumps({"columns": 256, "rows": 256, "cloudScores": cloud.flatten().tolist(),
                                           "skyScores": mask.flatten().tolist()}))
            subprocess.run([str(args.native_regions.resolve()), str(request), str(response)], check=True)
            regions = json.loads(response.read_text())
            preview = ImageOps.contain(photo, (450, 290), Image.Resampling.LANCZOS)
            draw = ImageDraw.Draw(preview)
            for index, region in enumerate(regions):
                x, y, width, height = region["bounds"]
                rectangle = [x * preview.width, y * preview.height, (x + width) * preview.width - 1, (y + height) * preview.height - 1]
                draw.rectangle(rectangle, outline="#ff00aa", width=2)
                draw.text((rectangle[0] + 4, rectangle[1] + 4), str(index + 1), fill="black", stroke_width=2, stroke_fill="white")
            card = Image.new("RGB", (480, 330), "#faf7f1")
            ImageDraw.Draw(card).text((10, 8), f"{GENERA[row['label']]} | {len(regions)} proposed areas", fill="black")
            card.paste(preview, (10, 32))
            cards.append(card)
            reports.append({"id": row["id"], "regions": regions})
    for start in range(0, len(cards), 6):
        selected = cards[start:start + 6]
        sheet = Image.new("RGB", (960, 330 * ((len(selected) + 1) // 2)), "white")
        for index, card in enumerate(selected):
            sheet.paste(card, ((index % 2) * 480, (index // 2) * 330))
        sheet.save(args.output / f"regions-{start // 6 + 1:02d}.jpg", quality=92)
    report = {"warning": "Visual proposal QA only; not independently labeled cloud instances or genus predictions",
              "native_evaluation_sha256": sha256(args.native_evaluation), "native_regions_sha256": sha256(args.native_regions),
              "rows": reports}
    (args.output / "regions.json").write_text(json.dumps(report, indent=2) + "\n")
    print(json.dumps({"images": len(reports), "with_proposals": sum(bool(row["regions"]) for row in reports)}), flush=True)


if __name__ == "__main__":
    main()
