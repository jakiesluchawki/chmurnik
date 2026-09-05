"""Frozen segmentation-guided features, without interpreting masks as genera."""

import torch
from torch import nn
from torch.nn import functional as F


CONTEXT_FLOOR = .1


def weighted_patch_mean(tokens, weights):
    if (tokens.ndim != 3 or weights.shape != (*tokens.shape[:2], 1)
            or tokens.shape[1] == 0):
        raise ValueError("Patch scores must align with row-major image tokens")
    if (not torch.isfinite(tokens).all() or not torch.isfinite(weights).all()
            or (weights < 0).any() or (weights > 1).any()):
        raise ValueError("Non-finite features or invalid mask scores")
    # Retain context and make an empty mask reduce to ordinary mean pooling.
    influence = CONTEXT_FLOOR + (1 - CONTEXT_FLOOR) * weights
    return (tokens * influence).sum(1) / influence.sum(1)


class SegmentationPooledDino(nn.Module):
    def __init__(self, dino, cloud, sky):
        super().__init__()
        self.dino, self.cloud, self.sky = dino, cloud, sky

    def features(self, image):
        if image.ndim != 4 or tuple(image.shape[1:]) != (3, 224, 224):
            raise ValueError("The frozen masked-pooling trial requires 224px RGB")
        result = self.dino.backbone.forward_features((image - self.dino.image_mean) / self.dino.image_std)
        cloud = self.cloud(F.interpolate(image, (256, 256), mode="bilinear", align_corners=False)).sigmoid()
        sky = self.sky(F.interpolate(image, (384, 384), mode="bilinear", align_corners=False))
        if cloud.shape != (len(image), 1, 256, 256) or sky.shape != (len(image), 1, 384, 384):
            raise ValueError("Unexpected segmentation geometry")
        joint = cloud * F.interpolate(sky, (256, 256), mode="bilinear", align_corners=False)
        weights = F.avg_pool2d(joint, 16).flatten(2).transpose(1, 2)
        return torch.cat((result["x_norm_clstoken"], weighted_patch_mean(result["x_norm_patchtokens"], weights)), dim=1)
