"""Losslessly archive repeated frozen tensors; keep a hash-checked shared source."""

import argparse
import hashlib
import os
from pathlib import Path

import torch

from v4_checkpoint import atomic_save


def digest(path):
    with path.open("rb") as stream:
        return hashlib.file_digest(stream, "sha256").hexdigest()


def shared_state(path, source_format="checkpoint"):
    saved = torch.load(path, map_location="cpu", weights_only=True, mmap=True)
    if source_format == "checkpoint":
        return saved["state_dict"]
    if source_format != "dinov2-backbone" or not saved or not all(isinstance(value, torch.Tensor) for value in saved.values()):
        raise ValueError("Unsupported shared tensor source")
    return {f"backbone.{key}": value for key, value in saved.items()}


def restore(path):
    saved = torch.load(path, map_location="cpu", weights_only=True)
    reference = saved["shared_source"]
    base_path = path.parent / reference["path"]
    if digest(base_path) != reference["sha256"]:
        raise ValueError("Shared checkpoint changed")
    base = shared_state(base_path, reference.get("format", "checkpoint"))
    state = {key: saved["delta"][key] if key in saved["delta"] else base[key] for key in saved["state_keys"]}
    return {**saved["metadata"], "state_dict": state}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--checkpoint", type=Path, required=True)
    parser.add_argument("--shared", type=Path)
    parser.add_argument("--shared-format", choices=["checkpoint", "dinov2-backbone"], default="checkpoint")
    parser.add_argument("--restore", type=Path)
    parser.add_argument("--remove-duplicate", action="store_true")
    parser.add_argument("--max-changed-fraction", type=float, default=.05)
    args = parser.parse_args()
    if args.restore:
        if args.restore.exists():
            raise ValueError("Refusing to overwrite a restored checkpoint")
        atomic_save(restore(args.checkpoint), args.restore)
        return
    if not args.shared or args.shared.resolve() == args.checkpoint.resolve():
        raise ValueError("A different shared checkpoint is required")
    destination = args.checkpoint.with_name("archived-checkpoint.pt")
    if destination.exists():
        raise ValueError("Preserve the existing checkpoint archive")
    original = torch.load(args.checkpoint, map_location="cpu", weights_only=True, mmap=True)
    shared = shared_state(args.shared, args.shared_format)
    state = original["state_dict"]
    delta = {key: value for key, value in state.items()
             if key not in shared or not torch.equal(value, shared[key])}
    if not 0 < args.max_changed_fraction <= .5:
        raise ValueError("At least half the tensors must remain shared")
    changed = sum(value.numel() for value in delta.values())
    if changed > args.max_changed_fraction * sum(value.numel() for value in state.values()):
        raise ValueError("Too many changed tensors; retain the full checkpoint")
    atomic_save({"original_sha256": digest(args.checkpoint),
                 "shared_source": {"path": os.path.relpath(args.shared.resolve(), destination.parent.resolve()), "sha256": digest(args.shared), "format": args.shared_format},
                 "metadata": {key: value for key, value in original.items() if key != "state_dict"},
                 "state_keys": list(state), "delta": delta}, destination)
    restored = restore(destination)
    if list(restored["state_dict"]) != list(state) or any(not torch.equal(value, restored["state_dict"][key]) for key, value in state.items()):
        raise ValueError("Lossless reconstruction failed; original retained")
    if args.remove_duplicate:
        args.checkpoint.unlink()
    print(f"Verified lossless archive: {destination}; changed tensor values: {sum(value.numel() for value in delta.values())}")


if __name__ == "__main__":
    main()
