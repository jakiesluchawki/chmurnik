import torch
from torch import nn
from torchvision.models import MobileNet_V3_Small_Weights, mobilenet_v3_small


class MobileCloudGenusNet(nn.Module):
    def __init__(self, output_count: int, pretrained: bool = False) -> None:
        super().__init__()
        self.register_buffer(
            "image_mean", torch.tensor([0.485, 0.456, 0.406]).view(1, 3, 1, 1)
        )
        self.register_buffer(
            "image_std", torch.tensor([0.229, 0.224, 0.225]).view(1, 3, 1, 1)
        )
        weights = MobileNet_V3_Small_Weights.DEFAULT if pretrained else None
        self.network = mobilenet_v3_small(weights=weights, dropout=0.2)
        inputs = self.network.classifier[-1].in_features
        self.network.classifier[-1] = nn.Linear(inputs, output_count)

    def forward(self, image: torch.Tensor) -> torch.Tensor:
        return self.network((image - self.image_mean) / self.image_std)


def build_model(output_count: int, pretrained: bool = False) -> nn.Module:
    return MobileCloudGenusNet(output_count, pretrained)
