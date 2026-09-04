"""Pinned, local-only SigLIP 2 image tower for the bounded V4 feature trial."""

import hashlib
from pathlib import Path

import torch


MODEL_ID = "timm/vit_base_patch16_siglip_224.v2_webli"
REVISION = "4c3661e5ac879a276ddc5ddc6d3f0ecc78fd5d82"
WEIGHT_SHA256 = "9106b0d8d9d02ea90fc3571fffd1557cf444736f695ee40b1e57c856bc3d9494"
TIMM_VERSION = "1.0.24"
DATA_CONFIG = {"input_size": (3, 224, 224), "interpolation": "bicubic",
               "mean": (.5, .5, .5), "std": (.5, .5, .5),
               "crop_pct": .9, "crop_mode": "center"}


def file_digest(path):
    with Path(path).open("rb") as stream:
        return hashlib.file_digest(stream, "sha256").hexdigest()


def load_backbone(path):
    import timm
    from safetensors.torch import load_file
    from timm.data import create_transform, resolve_data_config

    if timm.__version__ != TIMM_VERSION:
        raise ValueError("Use the declared timm version for this trial")
    if file_digest(path) != WEIGHT_SHA256:
        raise ValueError("SigLIP 2 weights do not match pinned Hub LFS metadata")
    model = timm.create_model(MODEL_ID.split("/")[1], pretrained=False, num_classes=0)
    config = resolve_data_config(model.pretrained_cfg, model=model)
    if config != DATA_CONFIG or model.num_features != 768 or model.global_pool != "map":
        raise ValueError("Unexpected SigLIP 2 input or feature contract")
    model.load_state_dict(load_file(str(path)), strict=True)
    model.requires_grad_(False).eval()
    return model, create_transform(**config, is_training=False)


def validate_feature_cache(saved, contract, row_count, views):
    if saved.get("contract") != contract:
        raise ValueError("SigLIP feature cache provenance mismatch")
    completed = saved.get("completed")
    if not isinstance(completed, int) or not 0 < completed <= row_count:
        raise ValueError("Invalid completed feature count")
    values = saved.get("features")
    if (not isinstance(values, torch.Tensor) or values.dtype != torch.float32
            or values.shape != (completed * views, 768) or not torch.isfinite(values).all()):
        raise ValueError("Invalid cached feature geometry or values")
    return completed
