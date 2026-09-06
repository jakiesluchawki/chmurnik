"""Research-only official last-four CLS plus last-layer patch-mean features."""

import torch
from torch import nn


FEATURE_COUNT = 1920
LAST_FEATURE_COUNT = 768


class MultiLayerDino(nn.Module):
    def __init__(self, dino):
        super().__init__()
        if dino.backbone.embed_dim != 384 or len(dino.backbone.blocks) != 12:
            raise ValueError("This fixed probe requires the unchunked DINO Small backbone")
        self.backbone = dino.backbone
        self.register_buffer("image_mean", dino.image_mean.detach().clone())
        self.register_buffer("image_std", dino.image_std.detach().clone())

    def features(self, image):
        blocks = self.backbone.get_intermediate_layers(
            (image - self.image_mean) / self.image_std,
            n=4, reshape=False, return_class_token=True, norm=True,
        )
        if len(blocks) != 4:
            raise ValueError("Expected exactly four intermediate blocks")
        # Preserve official block order; the final 768 values are the old input.
        return torch.cat([cls for _, cls in blocks] + [blocks[-1][0].mean(1)], dim=1)


def feature_parity(multilayer, retained):
    if (multilayer.ndim != 2 or retained.ndim != 2 or not len(retained)
            or multilayer.shape != (len(retained), FEATURE_COUNT)
            or retained.shape[1] != LAST_FEATURE_COUNT
            or not torch.isfinite(multilayer).all() or not torch.isfinite(retained).all()):
        raise ValueError("Invalid aligned feature tensors")
    error = float((multilayer[:, -LAST_FEATURE_COUNT:] - retained).abs().max())
    if error > 1e-4:
        raise ValueError(f"Last-layer features no longer reproduce the retained input: {error}")
    return {"max_feature_error": error, "feature_rows": len(retained)}
