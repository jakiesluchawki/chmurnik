"""Compact, local cloud-versus-clear-sky segmentation research candidate."""

import torch
from torch import nn
from torch.nn import functional as F
from torchvision.models import mobilenet_v3_small


class Fusion(nn.Module):
    def __init__(self, incoming, skip, outgoing):
        super().__init__()
        self.block = nn.Sequential(
            nn.Conv2d(incoming + skip, outgoing, 3, padding=1, bias=False),
            nn.BatchNorm2d(outgoing), nn.ReLU(inplace=True),
            nn.Conv2d(outgoing, outgoing, 3, padding=1, groups=outgoing, bias=False),
            nn.BatchNorm2d(outgoing), nn.ReLU(inplace=True))

    def forward(self, value, skip):
        value = F.interpolate(value, size=skip.shape[-2:], mode="bilinear", align_corners=False)
        return self.block(torch.cat((value, skip), dim=1))


class CloudSegmenter(nn.Module):
    def __init__(self, encoder_state=None):
        super().__init__()
        encoder = mobilenet_v3_small(weights=None)
        if encoder_state is not None:
            encoder.load_state_dict(encoder_state, strict=True)
        self.encoder = encoder.features
        self.bridge = nn.Sequential(nn.Conv2d(576, 64, 1, bias=False), nn.BatchNorm2d(64), nn.ReLU())
        self.up16 = Fusion(64, 48, 64)
        self.up8 = Fusion(64, 24, 48)
        self.up4 = Fusion(48, 16, 32)
        self.up2 = Fusion(32, 16, 16)
        self.up1 = Fusion(16, 3, 16)
        self.output = nn.Conv2d(16, 1, 1)
        self.register_buffer("mean", torch.tensor([.485, .456, .406]).view(1, 3, 1, 1))
        self.register_buffer("std", torch.tensor([.229, .224, .225]).view(1, 3, 1, 1))

    def forward(self, image):
        value, skips = (image - self.mean) / self.std, []
        for index, layer in enumerate(self.encoder):
            value = layer(value)
            if index in (0, 1, 3, 8):
                skips.append(value)
        value = self.bridge(value)
        for block, skip in zip((self.up16, self.up8, self.up4, self.up2), reversed(skips)):
            value = block(value, skip)
        return self.output(self.up1(value, image))


def masked_loss(logits, target, valid):
    if logits.shape != target.shape or target.shape != valid.shape:
        raise ValueError("Mask/logit geometry mismatch")
    count = valid.sum()
    if count.item() == 0:
        raise ValueError("Batch contains no valid sky pixels")
    bce = (F.binary_cross_entropy_with_logits(logits, target, reduction="none") * valid).sum() / count
    probability = logits.sigmoid() * valid
    target = target * valid
    dice = 1 - (2 * (probability * target).sum() + 1) / (probability.sum() + target.sum() + 1)
    return bce + dice
