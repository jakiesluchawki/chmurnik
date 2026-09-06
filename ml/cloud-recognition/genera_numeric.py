"""Fixed numeric Genera research graph; no Keras objects or downloaded code.

Implements the published RepVGG/NECA equations, attributed in the Lore audit.
Only the checksum-pinned archive's numeric arrays are accepted by the runner.
"""
import numpy as np
import torch
from torch import nn
from torch.nn import functional as F


BLOCKS = ((3, 64, 1), (64, 128, 2), (128, 128, 1), (128, 256, 2),
          (256, 256, 1), (256, 256, 1), (256, 256, 1), (256, 512, 2))
BLOCK_NAMES = ("stage1_block1", "stage2_block1", "stage2_block2", "stage3_block1",
               "stage3_block2", "stage3_block3", "stage3_block4", "stage4_block1")


def same_conv2d(value, weight, stride):
    height, width = value.shape[-2:]
    kernel = weight.shape[-1]
    ph = max(((height + stride - 1) // stride - 1) * stride + kernel - height, 0)
    pw = max(((width + stride - 1) // stride - 1) * stride + kernel - width, 0)
    return F.conv2d(F.pad(value, (pw // 2, pw - pw // 2, ph // 2, ph - ph // 2)),
                    weight, stride=stride)


def normalize(value, state):
    gamma, beta, mean, variance = state
    return (value - mean[None, :, None, None]) * (gamma / torch.sqrt(variance + .001))[None, :, None, None] + beta[None, :, None, None]


def attention(value, kernel):
    pooled = value.mean((2, 3))[:, None, :]
    factors = F.conv1d(pooled, kernel, padding=kernel.shape[-1] // 2).sigmoid()
    return value * factors[:, 0, :, None, None]


def validate_graph(config):
    layers = config["config"]["layers"]
    expected = [("model_input", "InputLayer")]
    for name in BLOCK_NAMES:
        expected += [(name, "RepVGGBlock"), (name + "_neca", "NECALayer"), (name + "_relu", "ReLU")]
    expected += [("avg_pool", "GlobalAveragePooling2D"), ("fc", "Dense")]
    if [(layer["name"], layer["class_name"]) for layer in layers] != expected:
        raise ValueError("Unexpected fixed Genera topology")
    if layers[0]["config"]["batch_shape"] != [None, 299, 299, 3]:
        raise ValueError("Unexpected input shape")
    for previous, layer in zip(layers, layers[1:]):
        inbound = layer["inbound_nodes"]
        if (len(inbound) != 1 or len(inbound[0]["args"]) != 1 or inbound[0]["kwargs"]
                or inbound[0]["args"][0]["config"]["keras_history"] != [previous["name"], 0, 0]):
            raise ValueError("Unexpected graph edge")
    for index, (incoming, outgoing, stride) in enumerate(BLOCKS):
        block, neca, relu = [layer["config"] for layer in layers[1 + index * 3:4 + index * 3]]
        values = {"in_channels": incoming, "out_channels": outgoing, "stride": stride,
                  "kernel_size": 3, "groups": 1, "deploy": False, "use_se": False}
        if any(block[key] != value for key, value in values.items()):
            raise ValueError("Unexpected RepVGG parameters")
        if any(neca[key] != value for key, value in {"channels": outgoing, "gamma": 2, "b": 1}.items()):
            raise ValueError("Unexpected attention parameters")
        if relu["max_value"] is not None or relu["negative_slope"] != 0 or relu["threshold"] != 0:
            raise ValueError("Unexpected rectifier")
    pool, dense = layers[-2]["config"], layers[-1]["config"]
    if pool["data_format"] != "channels_last" or pool["keepdims"] or dense["units"] != 12 or dense["activation"] != "softmax" or not dense["use_bias"]:
        raise ValueError("Unexpected classifier output")


class NumericGenera(nn.Module):
    def __init__(self, config, arrays):
        super().__init__()
        validate_graph(config)
        used = set()
        def take(path, shape, name, permutation=None):
            array = arrays[path]
            if array.shape != shape or array.dtype != np.dtype("float32") or not np.isfinite(array).all():
                raise ValueError(f"Unexpected numeric weight: {path}")
            used.add(path)
            value = torch.from_numpy(array.copy())
            if permutation:
                value = value.permute(*permutation).contiguous()
            self.register_buffer(name, value)
        for index, (incoming, outgoing, _) in enumerate(BLOCKS):
            suffix = "" if index == 0 else f"_{index}"
            base = "layers/rep_vgg_block" + suffix
            for branch, kernel in (("dense", 3), ("1x1", 1)):
                take(f"{base}/rbr_{branch}_conv/vars/0", (kernel, kernel, incoming, outgoing),
                     f"b{index}_{branch}_weight", (3, 2, 0, 1))
                for number in range(4):
                    take(f"{base}/rbr_{branch}_bn/vars/{number}", (outgoing,), f"b{index}_{branch}_bn{number}")
            if incoming == outgoing:
                for number in range(4):
                    take(f"{base}/rbr_identity_bn/vars/{number}", (outgoing,), f"b{index}_id_bn{number}")
            take(f"layers/neca_layer{suffix}/conv1d/vars/0", (5, 1, 1), f"b{index}_attention", (2, 1, 0))
            # The archive explicitly has deploy=False. Do not run its dormant
            # reparameterized branch; validate its shapes, then account for it.
            for number, shape in ((0, (3, 3, incoming, outgoing)), (1, (outgoing,))):
                path = f"{base}/rbr_reparam/vars/{number}"
                if arrays[path].shape != shape:
                    raise ValueError("Unexpected dormant weight shape")
                used.add(path)
        take("layers/dense/vars/0", (512, 12), "fc_weight", (1, 0))
        take("layers/dense/vars/1", (12,), "fc_bias")
        if used != {name for name in arrays if name.startswith("layers/")}:
            raise ValueError("Unaccounted model weight")
        for name, value in self.named_buffers():
            if name.endswith("bn3") and (value < 0).any():
                raise ValueError("Negative batch-normalization variance")

    def forward(self, value):
        if value.ndim != 4 or tuple(value.shape[1:]) != (3, 299, 299):
            raise ValueError("Expected NCHW RGB 299px input")
        for index, (incoming, outgoing, stride) in enumerate(BLOCKS):
            def bn(branch):
                return tuple(getattr(self, f"b{index}_{branch}_bn{n}") for n in range(4))
            dense = same_conv2d(value, getattr(self, f"b{index}_dense_weight"), stride)
            point = F.conv2d(value, getattr(self, f"b{index}_1x1_weight"), stride=stride)
            result = normalize(dense, bn("dense")) + normalize(point, bn("1x1"))
            if incoming == outgoing:
                result = result + normalize(value, bn("id"))
            value = attention(result, getattr(self, f"b{index}_attention")).relu()
        return F.linear(value.mean((2, 3)), self.fc_weight, self.fc_bias)
