"""Float32 RBF inference with centered, explicit accumulation."""

import math

import torch
from torch import nn


class StableFeatureRBF(nn.Module):
    def __init__(self, mean, scale, support, coefficients, gamma):
        super().__init__()
        parameters = {name: torch.as_tensor(value, dtype=torch.float32)
                      for name, value in (("mean", mean), ("scale", scale),
                                          ("support", support), ("coefficients", coefficients))}
        feature_count = parameters["mean"].numel()
        if (not 1 <= feature_count <= 4096 or parameters["mean"].shape != (feature_count,)
                or parameters["scale"].shape != (feature_count,)
                or parameters["support"].ndim != 2 or parameters["support"].shape[1] != feature_count
                or not 1 <= len(parameters["support"]) <= 20000
                or parameters["coefficients"].shape != (len(parameters["support"]), 11)):
            raise ValueError("Invalid RBF support or class geometry")
        if (not math.isfinite(gamma) or gamma <= 0 or not (parameters["scale"] > 0).all()
                or any(not torch.isfinite(value).all() for value in parameters.values())):
            raise ValueError("Invalid RBF normalization or parameters")
        for name, value in parameters.items():
            self.register_buffer(name, value)
        self.register_buffer("support_norm", self.support.square().sum(1))
        self.register_buffer("coefficient_sum", self.coefficients.double().sum(0).float())
        self.gamma = float(gamma)

    def forward(self, features):
        values = (features - self.mean) / self.scale
        distance = (values.square().sum(1, keepdim=True) + self.support_norm
                    - 2 * values @ self.support.T).clamp_min(0)
        kernel = (-self.gamma * distance).exp()
        center = kernel.mean(1, keepdim=True)
        # Remove the large common term before summing opposing coefficients.
        products = (kernel - center).unsqueeze(2) * self.coefficients.unsqueeze(0)
        return products.sum(1) + center * self.coefficient_sum

    @classmethod
    def empty(cls, support_count, gamma, feature_count=768):
        if type(support_count) is not int or not 1 <= support_count <= 20000:
            raise ValueError("Invalid RBF support count")
        if type(feature_count) is not int or not 1 <= feature_count <= 4096:
            raise ValueError("Invalid RBF feature count")
        return cls(torch.zeros(feature_count), torch.ones(feature_count), torch.zeros(support_count, feature_count),
                   torch.zeros(support_count, 11), gamma)
