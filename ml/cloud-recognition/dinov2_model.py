"""Optional local DINOv2 backbone for a frozen-feature classification trial."""

import os
from pathlib import Path
import subprocess
import sys

import torch
from torch import nn


DINOV2_REVISION = "7764ea0f912e53c92e82eb78a2a1631e92725fc8"


class FeatureMLP(nn.Module):
    def __init__(self, output_count, feature_count=768):
        super().__init__()
        self.register_buffer("mean", torch.zeros(feature_count))
        self.register_buffer("scale", torch.ones(feature_count))
        self.layers = nn.Sequential(nn.Linear(feature_count, 128), nn.GELU(), nn.Dropout(.2), nn.Linear(128, output_count))

    def forward(self, features):
        return self.layers((features - self.mean) / self.scale)


class DinoCloudNet(nn.Module):
    def __init__(self, output_count, pretrained=False, head="linear", kernel_config=None, backbone="vits14"):
        super().__init__()
        if backbone not in {"vits14", "vitb14"} or head not in {"linear", "mlp", "kernel"}:
            raise ValueError("Unsupported DINOv2 backbone or head")
        if head == "kernel" and backbone != "vits14":
            raise ValueError("The frozen RBF head supports only the small backbone")
        repository = Path(os.environ.get("CHMURNIK_DINOV2_REPO", Path(__file__).resolve().parents[2] / ".local/v4/vendor/dinov2"))
        if not repository.is_dir():
            raise ValueError("Fetch the pinned official DINOv2 repository before this optional trial")
        revision = subprocess.check_output(["git", "-C", str(repository), "rev-parse", "HEAD"], text=True).strip()
        if revision != DINOV2_REVISION:
            raise ValueError("DINOv2 source revision does not match the experiment contract")
        sys.path.insert(0, str(repository))
        from dinov2.hub.backbones import dinov2_vits14, dinov2_vitb14
        factory = {"vits14": dinov2_vits14, "vitb14": dinov2_vitb14}[backbone]
        self.backbone = factory(pretrained=pretrained)
        self.feature_count = self.backbone.embed_dim * 2
        if head == "kernel":
            from kernel_model import StableFeatureRBF
            if output_count != 11 or kernel_config is None:
                raise ValueError("The RBF head requires its frozen support geometry")
            self.classifier = StableFeatureRBF.empty(**kernel_config)
        else:
            self.classifier = FeatureMLP(output_count, self.feature_count) if head == "mlp" else nn.Linear(self.feature_count, output_count)
        self.register_buffer("image_mean", torch.tensor([.485, .456, .406]).view(1, 3, 1, 1))
        self.register_buffer("image_std", torch.tensor([.229, .224, .225]).view(1, 3, 1, 1))

    def features(self, image):
        result = self.backbone.forward_features((image - self.image_mean) / self.image_std)
        return torch.cat([result["x_norm_clstoken"], result["x_norm_patchtokens"].mean(dim=1)], dim=1)

    def forward(self, image):
        return self.classifier(self.features(image))
