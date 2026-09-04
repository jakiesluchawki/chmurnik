"""Fine-tune a stronger classifier; test data is never loaded during selection."""

from __future__ import annotations

import argparse
import hashlib
import json
import random
import time
from collections import Counter
from pathlib import Path

import numpy as np
import torch
from PIL import Image, ImageOps
from sklearn.metrics import f1_score
from torch import nn
from torch.utils.data import DataLoader, Dataset
from torchvision import transforms

from labels import GENERA
from model import build_model
from v4_checkpoint import atomic_save, cpu_tree, random_state, restore_random_state, verify_contract
from v4_data import validate_manifest


class TrainingImages(Dataset):
    def __init__(self, rows, size, training=False):
        self.rows = rows
        geometry = [transforms.Resize(round(size / 0.902)), transforms.CenterCrop(size)]
        if training:
            geometry = [transforms.RandomResizedCrop(size, scale=(0.72, 1.0), ratio=(0.85, 1.18)),
                        transforms.RandomHorizontalFlip(), transforms.ColorJitter(0.2, 0.2, 0.12, 0.02)]
        self.transform = transforms.Compose([*geometry, transforms.ToTensor()])

    def __len__(self):
        return len(self.rows)

    def __getitem__(self, index):
        row = self.rows[index]
        with Image.open(row["path"]) as original:
            image = ImageOps.exif_transpose(original).convert("RGB")
            return self.transform(image), row["label"]


@torch.inference_mode()
def validate(model, loader, device):
    model.eval()
    logits, targets = [], []
    for images, labels in loader:
        logits.append(model(images.to(device)).cpu())
        targets.append(labels)
    values, labels = torch.cat(logits), torch.cat(targets)
    predicted = values.argmax(1)
    return {"loss": float(nn.functional.cross_entropy(values, labels)),
            "accuracy": float((predicted == labels).float().mean()),
            "macro_f1": float(f1_score(labels.numpy(), predicted.numpy(), labels=list(range(len(GENERA))), average="macro", zero_division=0))}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--manifest", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--architecture", choices=["convnext_tiny", "efficientnet_b0"], default="convnext_tiny")
    parser.add_argument("--epochs", type=int, default=24)
    parser.add_argument("--batch-size", type=int, default=16)
    parser.add_argument("--accumulation-steps", type=int, default=1)
    parser.add_argument("--size", type=int, default=256)
    parser.add_argument("--seed", type=int, default=7042)
    parser.add_argument("--learning-rate", type=float, default=0.00008)
    parser.add_argument("--resume", action="store_true")
    args = parser.parse_args()
    if args.batch_size < 1 or args.accumulation_steps < 1:
        raise ValueError("Batch size and accumulation steps must be positive")
    if args.output.exists() and any(args.output.iterdir()) and not args.resume:
        raise ValueError("Output must be empty; do not overwrite an experiment")
    args.output.mkdir(parents=True, exist_ok=True)
    torch.set_num_threads(4)
    random.seed(args.seed)
    np.random.seed(args.seed)
    torch.manual_seed(args.seed)
    manifest = json.loads(args.manifest.read_text())
    validate_manifest(manifest["rows"])
    train = [row for row in manifest["rows"] if row["split"] == "train"]
    validation = [row for row in manifest["rows"] if row["split"] == "validation"]
    generator = torch.Generator().manual_seed(args.seed)
    train_loader = DataLoader(TrainingImages(train, args.size, True), batch_size=args.batch_size, shuffle=True, generator=generator, num_workers=0)
    val_loader = DataLoader(TrainingImages(validation, args.size), batch_size=args.batch_size, num_workers=0)
    device = torch.device("mps" if torch.backends.mps.is_available() else "cpu")
    model = build_model(len(GENERA), architecture=args.architecture, pretrained=not args.resume).to(device)
    head = list(model.network.classifier[-1].parameters())
    head_ids = {id(parameter) for parameter in head}
    backbone = [parameter for parameter in model.parameters() if id(parameter) not in head_ids]
    for parameter in backbone:
        parameter.requires_grad_(False)
    optimizer = torch.optim.AdamW([{"params": backbone, "lr": args.learning_rate}, {"params": head, "lr": args.learning_rate * 10}], weight_decay=0.02)
    scheduler = torch.optim.lr_scheduler.CosineAnnealingLR(optimizer, args.epochs, eta_min=args.learning_rate * 0.05)
    counts = Counter(row["label"] for row in train)
    weights = torch.tensor([(max(counts.values()) / counts[label]) ** 0.5 for label in range(len(GENERA))], device=device)
    loss_fn = nn.CrossEntropyLoss(weight=weights, label_smoothing=0.05)
    history, best, best_epoch = [], -1, 0
    contract = {"architecture": args.architecture, "pipeline_version": 4, "input_size": args.size, "preprocess": "center_crop", "crop_fraction": 0.902,
                "classes": GENERA, "seed": args.seed, "manifest_sha256": hashlib.sha256(args.manifest.read_bytes()).hexdigest(),
                "selection": "maximum validation macro-F1; no calibration or test data loaded", "epochs_requested": args.epochs,
                "batch_size": args.batch_size, "accumulation_steps": args.accumulation_steps,
                "learning_rate": args.learning_rate,
                "training_count": len(train), "validation_count": len(validation), "device": str(device)}
    first_epoch = 1
    if args.resume:
        saved = torch.load(args.output / "resume.pt", map_location="cpu", weights_only=True)
        verify_contract(saved["contract"], contract)
        model.load_state_dict(saved["model"])
        optimizer.load_state_dict(saved["optimizer"])
        scheduler.load_state_dict(saved["scheduler"])
        history, best, best_epoch = saved["history"], saved["best"], saved["best_epoch"]
        first_epoch = saved["epoch"] + 1
        restore_random_state(saved["random"], generator, device)
        del saved
    (args.output / "contract.json").write_text(json.dumps(contract, indent=2) + "\n")
    print(json.dumps(contract), flush=True)
    for epoch in range(first_epoch, args.epochs + 1):
        if epoch >= 3:
            for parameter in backbone:
                parameter.requires_grad_(True)
        model.train()
        if epoch <= 2:
            model.network.features.eval()
        started, losses = time.monotonic(), []
        optimizer.zero_grad(set_to_none=True)
        for step, (images, labels) in enumerate(train_loader):
            logits = model(images.to(device))
            loss = loss_fn(logits, labels.to(device))
            group_start = (step // args.accumulation_steps) * args.accumulation_steps
            group_size = min(args.accumulation_steps, len(train_loader) - group_start)
            (loss / group_size).backward()
            if (step + 1) % args.accumulation_steps == 0 or step + 1 == len(train_loader):
                nn.utils.clip_grad_norm_(model.parameters(), 1.0)
                optimizer.step()
                optimizer.zero_grad(set_to_none=True)
            losses.append(float(loss.detach().cpu()))
        scheduler.step()
        result = validate(model, val_loader, device)
        row = {"epoch": epoch, "seconds": round(time.monotonic() - started, 1), "training_loss": float(np.mean(losses)), "validation": result}
        history.append(row)
        print(json.dumps(row), flush=True)
        (args.output / "history.json").write_text(json.dumps(history, indent=2) + "\n")
        if result["macro_f1"] > best:
            best, best_epoch = result["macro_f1"], epoch
            state = {key: value.detach().cpu() for key, value in model.state_dict().items()}
            atomic_save({**contract, "state_dict": state, "epoch": epoch, "validation": result}, args.output / "cloud-genus-net.pt")
            del state
        row["best_epoch"] = best_epoch
        atomic_save({"contract": contract, "model": cpu_tree(model.state_dict()),
                     "optimizer": cpu_tree(optimizer.state_dict()), "scheduler": scheduler.state_dict(),
                     "random": random_state(generator, device), "history": history,
                     "best": best, "best_epoch": best_epoch, "epoch": epoch}, args.output / "resume.pt")
        (args.output / "history.json").write_text(json.dumps(history, indent=2) + "\n")
        if epoch >= 12 and epoch - best_epoch >= 8:
            break
    print(json.dumps({"completed": True, "best_epoch": best_epoch, "validation_macro_f1": best}), flush=True)


if __name__ == "__main__":
    main()
