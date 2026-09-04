"""Pinned MIT U2NetP sky mask, translated from its published NCNN graph.

Source: xiongzhu666/Sky-Segmentation-and-Post-processing, revision below.
NCNN layout: Tencent/ncnn/wiki/param-and-model-file-structure.
This separates sky from foreground, not cloud genera or individual clouds.
"""

from collections import Counter
import hashlib
import io
from pathlib import Path
import struct

import numpy as np
import torch
from torch import nn
from torch.nn import functional as F


REVISION = "1f7811b32b64ddc957269defff84bc87a3f0b74f"
PARAM_SHA = "7af3523130445db42d94503558c08ce991932f843b92e4e921c99d732768895e"
WEIGHTS_SHA = "ff1e18f71dc0a0cf8a56b634c59f68d296deffd015cbed27a6d5e302f991faf2"
STEM = "skysegsmall_sim-opt-fp16"


def read_weights(stream, count, tagged):
    flag = struct.unpack("<I", stream.read(4))[0] if tagged else 0
    dtype = {0: "<f4", 0x01306B47: "<f2"}.get(flag)
    if dtype is None:
        raise ValueError("Unsupported NCNN weight encoding")
    size = count * np.dtype(dtype).itemsize
    values = np.frombuffer(stream.read(size), dtype=dtype).astype(np.float32)
    if len(values) != count or not np.isfinite(values).all():
        raise ValueError("Truncated or non-finite weights")
    stream.read((-size) % 4)
    return torch.from_numpy(values.copy())


class SkySegmentation(nn.Module):
    def __init__(self, directory):
        super().__init__()
        directory = Path(directory)
        param = (directory / (STEM + ".param")).read_bytes()
        binary = (directory / (STEM + ".bin")).read_bytes()
        if hashlib.sha256(param).hexdigest() != PARAM_SHA or hashlib.sha256(binary).hexdigest() != WEIGHTS_SHA:
            raise ValueError("Sky model snapshot differs from the reviewed source")
        self.layers = nn.ModuleDict()
        self.graph = []
        stream = io.BytesIO(binary)
        lines = param.decode().splitlines()
        if lines[:2] != ["7767517", "331 403"]:
            raise ValueError("Unexpected model graph")
        for line in lines[2:]:
            parts = line.split()
            kind, name, ins, outs = parts[0], parts[1], int(parts[2]), int(parts[3])
            inputs, outputs = parts[4:4 + ins], parts[4 + ins:4 + ins + outs]
            parameters = {int(key): int(value) for pair in parts[4 + ins + outs:] for key, value in [pair.split("=")]}
            if kind not in {"Input", "Convolution", "Split", "Pooling", "Concat", "Interp", "BinaryOp", "Sigmoid"}:
                raise ValueError(f"Unsupported layer: {kind}")
            if kind == "Convolution":
                p = parameters
                channels, kernel, count = p[0], p[1], p[6]
                layer = nn.Conv2d(count // (channels * kernel * kernel), channels, kernel,
                                  padding=p.get(4, 0), dilation=p.get(2, 1), bias=bool(p.get(5, 0)))
                with torch.no_grad():
                    layer.weight.copy_(read_weights(stream, count, True).reshape_as(layer.weight))
                    if layer.bias is not None:
                        layer.bias.copy_(read_weights(stream, channels, False))
                self.layers[name] = layer
            self.graph.append((kind, name, inputs, outputs, parameters))
        if stream.tell() != len(binary):
            raise ValueError("Unread model weights")
        self.references = Counter(item for node in self.graph for item in node[2])
        self.register_buffer("mean", torch.tensor([.485, .456, .406]).reshape(1, 3, 1, 1))
        self.register_buffer("std", torch.tensor([.229, .224, .225]).reshape(1, 3, 1, 1))

    def forward(self, image):
        blobs = {"input.1": (image - self.mean) / self.std}
        references = self.references.copy()
        for kind, name, inputs, outputs, p in self.graph:
            if kind == "Input":
                continue
            values = [blobs[key] for key in inputs]
            x = values[0]
            if kind == "Convolution":
                value = self.layers[name](x)
                if p.get(9) == 1:
                    value = F.relu(value)
                elif p.get(9) == 4:
                    value = torch.sigmoid(value)
            elif kind == "Pooling":
                value = F.max_pool2d(x, p[1], p[2], ceil_mode=True)
            elif kind == "Concat":
                value = torch.cat(values, dim=1)
            elif kind == "Interp":
                value = F.interpolate(x, size=(p[3], p[4]), mode="bilinear", align_corners=False)
            elif kind == "BinaryOp":
                value = values[0] + values[1]
            elif kind == "Sigmoid":
                value = torch.sigmoid(x)
            else:
                value = x
            for output in outputs:
                blobs[output] = value
            for key in inputs:
                references[key] -= 1
                if references[key] == 0:
                    del blobs[key]
            if outputs == ["1959"]:
                return value
        raise ValueError("Missing fused sky-mask output")
