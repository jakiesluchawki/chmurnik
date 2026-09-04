"""Adapt the final visual blocks, selecting only on the frozen validation set."""

import argparse
from collections import Counter
import hashlib
import json
from pathlib import Path
import random
import time

import numpy as np
import torch
from torch import nn
from torch.utils.data import DataLoader

from labels import GENERA
from model import build_model
from train_v4 import TrainingImages, validate
from v4_checkpoint import atomic_save, cpu_tree, random_state, restore_random_state
from v4_data import validate_manifest


def trainable_names(model, block_count):
    if not 1 <= block_count <= len(model.backbone.blocks):
        raise ValueError("Invalid number of trainable visual blocks")
    for parameter in model.parameters():
        parameter.requires_grad_(False)
    for module in [model.classifier, model.backbone.norm, *model.backbone.blocks[-block_count:]]:
        for parameter in module.parameters():
            parameter.requires_grad_(True)
    return {name for name, parameter in model.named_parameters() if parameter.requires_grad}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--manifest", type=Path, required=True)
    parser.add_argument("--initial", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--blocks", type=int, choices=[2, 4], default=2)
    parser.add_argument("--epochs", type=int, default=20)
    parser.add_argument("--batch-size", type=int, default=4)
    parser.add_argument("--accumulation-steps", type=int, default=4)
    parser.add_argument("--resume", action="store_true")
    args = parser.parse_args()
    if min(args.epochs, args.batch_size, args.accumulation_steps) < 1:
        raise ValueError("Training dimensions must be positive")
    if args.output.exists() and any(args.output.iterdir()) and not args.resume:
        raise ValueError("Preserve the existing experiment; use --resume")
    args.output.mkdir(parents=True, exist_ok=True)
    torch.set_num_threads(4)
    seed = 7042
    random.seed(seed)
    np.random.seed(seed)
    torch.manual_seed(seed)
    manifest = json.loads(args.manifest.read_text())
    validate_manifest(manifest["rows"])
    digest = hashlib.sha256(args.manifest.read_bytes()).hexdigest()
    initial_digest = hashlib.sha256(args.initial.read_bytes()).hexdigest()
    initial = torch.load(args.initial, map_location="cpu", weights_only=True)
    if initial["manifest_sha256"] != digest or initial["classes"] != GENERA:
        raise ValueError("Initial checkpoint does not match frozen data")
    if initial["architecture"] != "dinov2_vits14_mlp":
        raise ValueError("This experiment requires the declared DINO MLP initialization")
    device = torch.device("mps" if torch.backends.mps.is_available() else "cpu")
    model = build_model(len(GENERA), architecture=initial["architecture"])
    model.load_state_dict(initial["state_dict"])
    del initial["state_dict"]
    model.to(device)
    names = trainable_names(model, args.blocks)
    visual = [parameter for name, parameter in model.named_parameters() if name in names and name.startswith("backbone.")]
    head = list(model.classifier.parameters())
    optimizer = torch.optim.AdamW([{"params": visual, "lr": .00002}, {"params": head, "lr": .0001}], weight_decay=.02)
    scheduler = torch.optim.lr_scheduler.CosineAnnealingLR(optimizer, args.epochs, eta_min=.000001)
    rows = manifest["rows"]
    train = [row for row in rows if row["split"] == "train"]
    validation = [row for row in rows if row["split"] == "validation"]
    generator = torch.Generator().manual_seed(seed)
    size = initial["input_size"]
    train_loader = DataLoader(TrainingImages(train, size, True), batch_size=args.batch_size, shuffle=True, generator=generator, num_workers=0)
    validation_loader = DataLoader(TrainingImages(validation, size), batch_size=args.batch_size, num_workers=0)
    counts = Counter(row["label"] for row in train)
    weights = torch.tensor([(max(counts.values()) / counts[label]) ** .5 for label in range(len(GENERA))], device=device)
    loss_fn = nn.CrossEntropyLoss(weight=weights, label_smoothing=.05)
    contract = {"architecture": "dinov2_vits14_mlp", "pipeline_version": 4,
                "classes": GENERA, "input_size": size, "preprocess": "center_crop", "crop_fraction": .902,
                "manifest_sha256": digest, "initial_sha256": initial_digest, "seed": seed,
                "trainable_blocks": args.blocks, "visual_learning_rate": .00002, "head_learning_rate": .0001,
                "epochs_requested": args.epochs, "batch_size": args.batch_size, "accumulation_steps": args.accumulation_steps,
                "selection": "validation macro-F1 only; previous holdout exposure remains recorded",
                "early_stop": {"minimum_epochs": 10, "patience": 6}, "device": str(device)}
    history, best, best_epoch, first_epoch = [], -1, 0, 1
    if args.resume:
        saved = torch.load(args.output / "resume.pt", map_location="cpu", weights_only=True)
        if saved["contract"] != contract or set(saved["trainable"]) != names:
            raise ValueError("Resume configuration or trainable parameters changed")
        current = model.state_dict()
        current.update(saved["trainable"])
        model.load_state_dict(current)
        optimizer.load_state_dict(saved["optimizer"])
        scheduler.load_state_dict(saved["scheduler"])
        history, best, best_epoch = saved["history"], saved["best"], saved["best_epoch"]
        first_epoch = saved["epoch"] + 1
        restore_random_state(saved["random"], generator, device)
        del current, saved
    (args.output / "contract.json").write_text(json.dumps(contract, indent=2) + "\n")
    print(json.dumps(contract), flush=True)
    for epoch in range(first_epoch, args.epochs + 1):
        model.eval()
        model.classifier.train()
        for block in model.backbone.blocks[-args.blocks:]:
            block.train()
        started, losses = time.monotonic(), []
        optimizer.zero_grad(set_to_none=True)
        for step, (images, labels) in enumerate(train_loader):
            loss = loss_fn(model(images.to(device)), labels.to(device))
            group_start = (step // args.accumulation_steps) * args.accumulation_steps
            group_size = min(args.accumulation_steps, len(train_loader) - group_start)
            (loss / group_size).backward()
            if (step + 1) % args.accumulation_steps == 0 or step + 1 == len(train_loader):
                nn.utils.clip_grad_norm_([parameter for parameter in model.parameters() if parameter.requires_grad], 1.)
                optimizer.step()
                optimizer.zero_grad(set_to_none=True)
            losses.append(float(loss.detach().cpu()))
        scheduler.step()
        result = validate(model, validation_loader, device)
        if result["macro_f1"] > best:
            best, best_epoch = result["macro_f1"], epoch
            atomic_save({**contract, "state_dict": cpu_tree(model.state_dict()), "epoch": epoch, "validation": result}, args.output / "cloud-genus-net.pt")
        row = {"epoch": epoch, "seconds": round(time.monotonic() - started, 1),
               "training_loss": float(np.mean(losses)), "validation": result, "best_epoch": best_epoch}
        history.append(row)
        print(json.dumps(row), flush=True)
        # Frozen weights are restored from the hash-checked initialization.
        atomic_save({"contract": contract, "trainable": {name: value.detach().cpu() for name, value in model.state_dict().items() if name in names},
                     "optimizer": cpu_tree(optimizer.state_dict()), "scheduler": scheduler.state_dict(),
                     "random": random_state(generator, device), "history": history, "best": best,
                     "best_epoch": best_epoch, "epoch": epoch}, args.output / "resume.pt")
        (args.output / "history.json").write_text(json.dumps(history, indent=2) + "\n")
        if epoch >= 10 and epoch - best_epoch >= 6:
            break
    print(json.dumps({"completed": True, "best_epoch": best_epoch, "validation_macro_f1": best}), flush=True)


if __name__ == "__main__":
    main()
