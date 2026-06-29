"""Compact single-photo network suitable for local Core ML inference."""

from __future__ import annotations

import torch
from torch import nn
from torchvision.models import MobileNet_V3_Small_Weights, mobilenet_v3_small


class ConvNormAct(nn.Sequential):
    def __init__(
        self,
        in_channels: int,
        out_channels: int,
        kernel_size: int = 3,
        stride: int = 1,
        groups: int = 1,
    ) -> None:
        padding = kernel_size // 2
        super().__init__(
            nn.Conv2d(
                in_channels,
                out_channels,
                kernel_size,
                stride=stride,
                padding=padding,
                groups=groups,
                bias=False,
            ),
            nn.BatchNorm2d(out_channels),
            nn.SiLU(inplace=True),
        )


class DepthwiseResidual(nn.Module):
    def __init__(self, in_channels: int, out_channels: int, stride: int) -> None:
        super().__init__()
        self.use_skip = stride == 1 and in_channels == out_channels
        self.block = nn.Sequential(
            ConvNormAct(
                in_channels,
                in_channels,
                kernel_size=3,
                stride=stride,
                groups=in_channels,
            ),
            ConvNormAct(in_channels, out_channels, kernel_size=1),
        )

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        output = self.block(x)
        return output + x if self.use_skip else output


class TinyCloudGenusNet(nn.Module):
    def __init__(self, output_count: int = 11, include_sigmoid: bool = False) -> None:
        super().__init__()
        self.include_sigmoid = include_sigmoid
        self.features = nn.Sequential(
            ConvNormAct(3, 16, stride=2),
            DepthwiseResidual(16, 24, stride=2),
            DepthwiseResidual(24, 24, stride=1),
            DepthwiseResidual(24, 40, stride=2),
            DepthwiseResidual(40, 40, stride=1),
            DepthwiseResidual(40, 64, stride=2),
            DepthwiseResidual(64, 64, stride=1),
            DepthwiseResidual(64, 96, stride=2),
            DepthwiseResidual(96, 96, stride=1),
            ConvNormAct(96, 128, kernel_size=1),
        )
        self.pool = nn.AdaptiveAvgPool2d(1)
        self.dropout = nn.Dropout(0.15)
        self.classifier = nn.Linear(128, output_count)

    def forward(self, image: torch.Tensor) -> torch.Tensor:
        features = self.features(image)
        features = self.pool(features).flatten(1)
        logits = self.classifier(self.dropout(features))
        return torch.sigmoid(logits) if self.include_sigmoid else logits


class MobileCloudGenusNet(nn.Module):
    def __init__(
        self,
        output_count: int = 11,
        include_sigmoid: bool = False,
        pretrained: bool = False,
    ) -> None:
        super().__init__()
        self.include_sigmoid = include_sigmoid
        weights = MobileNet_V3_Small_Weights.DEFAULT if pretrained else None
        self.register_buffer(
            "image_mean",
            torch.tensor([0.485, 0.456, 0.406]).view(1, 3, 1, 1),
        )
        self.register_buffer(
            "image_std",
            torch.tensor([0.229, 0.224, 0.225]).view(1, 3, 1, 1),
        )
        self.network = mobilenet_v3_small(weights=weights, dropout=0.2)
        input_count = self.network.classifier[-1].in_features
        self.network.classifier[-1] = nn.Linear(input_count, output_count)

    def forward(self, image: torch.Tensor) -> torch.Tensor:
        normalized = (image - self.image_mean) / self.image_std
        logits = self.network(normalized)
        return torch.sigmoid(logits) if self.include_sigmoid else logits


def build_model(
    architecture: str,
    output_count: int = 11,
    include_sigmoid: bool = False,
    pretrained: bool = False,
) -> nn.Module:
    if architecture == "tiny":
        return TinyCloudGenusNet(output_count, include_sigmoid)
    if architecture == "mobilenet_v3_small":
        return MobileCloudGenusNet(
            output_count,
            include_sigmoid,
            pretrained=pretrained,
        )
    raise ValueError(f"Unknown architecture: {architecture}")


CloudGenusNet = TinyCloudGenusNet
