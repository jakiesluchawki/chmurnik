"""One predeclared MobileNet cloud-mask trial with epoch-level recovery."""

import argparse
import hashlib
import json
from pathlib import Path
import random
import time

import numpy as np
from PIL import Image
import torch
from torch.utils.data import DataLoader, Dataset
import torchvision
from torchvision.transforms import ColorJitter
from torchvision.transforms.functional import to_tensor

from cloud_segmenter import CloudSegmenter, masked_loss
from dlr_segmentation_data import binary_labels, load_manifest, read_pair, sha256
from segmentation_metrics import confusion, metrics, summarize
from v4_checkpoint import atomic_save, cpu_tree, random_state, restore_random_state


class SegmentationDataset(Dataset):
    def __init__(self, root, rows, training=False):
        self.rows, self.training = rows, training
        self.pairs = [read_pair(root, row) for row in rows]
        self.jitter = ColorJitter(brightness=.15, contrast=.15, saturation=.15)

    def __len__(self):
        return len(self.rows)

    def __getitem__(self, index):
        image, mask = self.pairs[index]
        if self.training:
            for transform in (Image.Transpose.FLIP_LEFT_RIGHT, Image.Transpose.FLIP_TOP_BOTTOM):
                if torch.rand(()).item() < .5:
                    image, mask = image.transpose(transform), mask.transpose(transform)
            for _ in range(int(torch.randint(4, ()).item())):
                image, mask = image.transpose(Image.Transpose.ROTATE_90), mask.transpose(Image.Transpose.ROTATE_90)
            image = self.jitter(image)
        target, valid = binary_labels(mask)
        return to_tensor(image), torch.from_numpy(target)[None], torch.from_numpy(valid)[None], index


@torch.inference_mode()
def evaluate(model, loader, device):
    model.eval()
    rows = []
    for image, target, valid, indices in loader:
        predicted = (model(image.to(device)).sigmoid() >= .5).cpu().numpy()
        for offset, index in enumerate(indices.tolist()):
            row = loader.dataset.rows[index]
            counts = confusion(predicted[offset, 0], target[offset, 0].numpy(), valid[offset, 0].numpy())
            rows.append({"id": row["id"], "group": row["group"], "day": row["day"], "camera": row["camera"],
                         "counts": counts, **metrics(counts)})
    return {"summary": summarize(rows), "rows": rows}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--manifest", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--device", choices=["mps", "cpu"], default="mps")
    parser.add_argument("--resume", action="store_true")
    args = parser.parse_args()
    if args.output.exists() and any(args.output.iterdir()) and not args.resume:
        raise ValueError("Preserve earlier training runs; use --resume for this same trial")
    args.output.mkdir(parents=True, exist_ok=True)
    manifest = load_manifest(args.manifest)
    torch.set_num_threads(4)
    random.seed(7042)
    np.random.seed(7042)
    torch.manual_seed(7042)
    device = torch.device(args.device)
    if device.type == "mps" and not torch.backends.mps.is_available():
        raise RuntimeError("MPS is unavailable; do not silently change execution device")
    initial = Path(torch.hub.get_dir()) / "checkpoints/mobilenet_v3_small-047dcff4.pth"
    initial_hash = sha256(initial)
    if not initial_hash.startswith("047dcff4"):
        raise ValueError("Unexpected torchvision initialization")
    source = Path(__file__).parent
    contract = {"architecture": "mobilenet_v3_small_cloud_mask_v1", "manifest_sha256": sha256(args.manifest),
                "initialization_sha256": initial_hash, "input_size": 256, "threshold": .5, "seed": 7042,
                "epochs": 30, "batch_size": 16, "learning_rate": .0003, "weight_decay": .0001,
                "optimizer": "AdamW", "schedule": "CosineAnnealingLR(T_max=30)",
                "loss": "valid-pixel mean BCE + batch soft Dice", "ignored_source_label": 0,
                "augmentations": "horizontal/vertical flips .5; quarter turns uniform; brightness/contrast/saturation .15",
                "torch": str(torch.__version__), "torchvision": str(torchvision.__version__), "device": str(device),
                "sources": {name: sha256(source / name) for name in
                            ["cloud_segmenter.py", "dlr_segmentation_data.py", "segmentation_metrics.py", "train_cloud_segmenter.py"]},
                "release_approved": False, "scope": "binary cloud pixels; not cloud genus or individual cloud identity"}
    if not args.resume:
        (args.output / "contract.json").write_text(json.dumps(contract, indent=2) + "\n")
    elif json.loads((args.output / "contract.json").read_text()) != contract:
        raise ValueError("Training contract/code changed since interruption")
    train = SegmentationDataset(args.manifest.parent, [row for row in manifest["rows"] if row["split"] == "train"], training=True)
    validation = SegmentationDataset(args.manifest.parent, [row for row in manifest["rows"] if row["split"] == "validation"])
    generator = torch.Generator().manual_seed(7042)
    train_loader = DataLoader(train, batch_size=16, shuffle=True, num_workers=0, generator=generator)
    val_loader = DataLoader(validation, batch_size=16, num_workers=0)
    model = CloudSegmenter(torch.load(initial, map_location="cpu", weights_only=True)).to(device)
    optimizer = torch.optim.AdamW(model.parameters(), lr=.0003, weight_decay=.0001)
    scheduler = torch.optim.lr_scheduler.CosineAnnealingLR(optimizer, T_max=30)
    start, best, history = 0, -1., []
    if args.resume:
        saved = torch.load(args.output / "resume.pt", map_location="cpu", weights_only=True)
        if saved["contract"] != contract:
            raise ValueError("Recovery contract mismatch")
        model.load_state_dict(saved["model"])
        optimizer.load_state_dict(saved["optimizer"])
        scheduler.load_state_dict(saved["scheduler"])
        restore_random_state(saved["random"], generator, device)
        start, best, history = saved["epoch"], saved["best"], saved["history"]
    print(json.dumps({"train": len(train), "validation": len(validation), "parameters": sum(p.numel() for p in model.parameters()),
                      "manifest_sha256": contract["manifest_sha256"], "start_epoch": start}), flush=True)
    for epoch in range(start + 1, 31):
        began = time.monotonic()
        model.train()
        loss_total = 0.
        for image, target, valid, _ in train_loader:
            image, target, valid = (value.to(device) for value in (image, target, valid))
            optimizer.zero_grad(set_to_none=True)
            loss = masked_loss(model(image), target, valid)
            if not torch.isfinite(loss):
                raise ValueError("Non-finite training loss")
            loss.backward()
            optimizer.step()
            loss_total += float(loss.detach().cpu()) * len(image)
        result = evaluate(model, val_loader, device)
        score = result["summary"]["cloud_iou"]
        if score is None:
            raise ValueError("Validation cannot measure cloud IoU")
        record = {"epoch": epoch, "train_loss": loss_total / len(train), "validation": result["summary"],
                  "seconds": time.monotonic() - began, "learning_rate": optimizer.param_groups[0]["lr"]}
        history.append(record)
        if score > best:
            best = score
            atomic_save({"contract": contract, "state_dict": cpu_tree(model.state_dict()), "epoch": epoch,
                         "validation": result}, args.output / "cloud-mask.pt")
        scheduler.step()
        atomic_save({"contract": contract, "model": cpu_tree(model.state_dict()), "optimizer": cpu_tree(optimizer.state_dict()),
                     "scheduler": scheduler.state_dict(), "random": random_state(generator, device),
                     "epoch": epoch, "best": best, "history": history}, args.output / "resume.pt")
        (args.output / "history.json").write_text(json.dumps(history, indent=2) + "\n")
        print(json.dumps(record), flush=True)
    selected = torch.load(args.output / "cloud-mask.pt", map_location="cpu", weights_only=True)
    report = {"contract": contract, "checkpoint_sha256": sha256(args.output / "cloud-mask.pt"),
              "selected_epoch": selected["epoch"], "validation": selected["validation"], "history": history}
    (args.output / "training.json").write_text(json.dumps(report, indent=2) + "\n")
    print(json.dumps({"complete": True, "epoch": selected["epoch"], "best_iou": best,
                      "checkpoint_sha256": report["checkpoint_sha256"]}), flush=True)


if __name__ == "__main__":
    main()
