"""Atomic local training checkpoints, including optimizer and random state."""

import os
import random
from pathlib import Path

import numpy as np
import torch


def cpu_tree(value):
    if isinstance(value, torch.Tensor):
        return value.detach().cpu()
    if isinstance(value, dict):
        return {key: cpu_tree(item) for key, item in value.items()}
    if isinstance(value, (list, tuple)):
        return type(value)(cpu_tree(item) for item in value)
    return value


def atomic_save(payload, destination):
    destination = Path(destination)
    temporary = destination.with_suffix(".pending.pt")
    with temporary.open("wb") as stream:
        torch.save(payload, stream)
        stream.flush()
        os.fsync(stream.fileno())
    temporary.replace(destination)


def random_state(generator, device):
    numpy_state = np.random.get_state()
    return {"python": random.getstate(), "torch": torch.get_rng_state(),
            "loader": generator.get_state(),
            "numpy": [numpy_state[0], numpy_state[1].tolist(), *numpy_state[2:]],
            "mps": torch.mps.get_rng_state() if device.type == "mps" else None}


def restore_random_state(state, generator, device):
    random.setstate(state["python"])
    torch.set_rng_state(state["torch"])
    generator.set_state(state["loader"])
    numpy_state = state["numpy"]
    np.random.set_state((numpy_state[0], np.asarray(numpy_state[1], dtype=np.uint32), *numpy_state[2:]))
    if device.type == "mps" and state["mps"] is not None:
        torch.mps.set_rng_state(state["mps"])


def verify_contract(saved, expected):
    for key in ("manifest_sha256", "architecture", "input_size", "classes", "seed",
                "batch_size", "accumulation_steps", "epochs_requested", "learning_rate"):
        if saved.get(key) != expected.get(key):
            raise ValueError(f"Resume contract mismatch: {key}")
