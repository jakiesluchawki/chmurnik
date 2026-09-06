"""Independent float64 NHWC NumPy replay of the inspected graph on synthetic RGB."""
import argparse
import hashlib
import json
from pathlib import Path

import numpy as np
from threadpoolctl import threadpool_limits
import torch

from audit_genera_archive import inspect_archive
from genera_numeric import NumericGenera


def convolution(value, kernel, stride=1, same=True):
    height, width = value.shape[:2]
    size = kernel.shape[0]
    if same:
        target_h, target_w = int(np.ceil(height / stride)), int(np.ceil(width / stride))
        hp = max((target_h - 1) * stride + size - height, 0)
        wp = max((target_w - 1) * stride + size - width, 0)
        value = np.pad(value, ((hp // 2, hp - hp // 2), (wp // 2, wp - wp // 2), (0, 0)))
    windows = np.lib.stride_tricks.sliding_window_view(value, (size, size), axis=(0, 1))[::stride, ::stride]
    return np.einsum("hwcij,ijco->hwo", windows, kernel, optimize=True)


def numpy_logits(value, config, arrays):
    value = value.astype(np.float64)
    block_index = attention_index = 0
    def weight(path):
        return arrays["layers/" + path].astype(np.float64)
    def bn(values, path):
        gamma, beta, mean, variance = [weight(f"{path}/vars/{i}") for i in range(4)]
        return gamma * ((values - mean) / np.sqrt(variance + .001)) + beta
    for layer in config["config"]["layers"]:
        kind, settings = layer["class_name"], layer["config"]
        if kind == "InputLayer":
            continue
        if kind == "RepVGGBlock":
            suffix = "" if block_index == 0 else f"_{block_index}"
            root = "rep_vgg_block" + suffix
            stride = settings["stride"]
            branch = convolution(value, weight(f"{root}/rbr_dense_conv/vars/0"), stride)
            point = convolution(value, weight(f"{root}/rbr_1x1_conv/vars/0"), stride, same=False)
            result = bn(branch, root + "/rbr_dense_bn") + bn(point, root + "/rbr_1x1_bn")
            if settings["in_channels"] == settings["out_channels"] and stride == 1:
                result += bn(value, root + "/rbr_identity_bn")
            value = result
            block_index += 1
        elif kind == "NECALayer":
            suffix = "" if attention_index == 0 else f"_{attention_index}"
            kernel = weight(f"neca_layer{suffix}/conv1d/vars/0")[:, 0, 0]
            pooled = value.mean((0, 1))
            scores = np.correlate(np.pad(pooled, len(kernel) // 2), kernel, mode="valid")
            value = value / (1 + np.exp(-scores))
            attention_index += 1
        elif kind == "ReLU":
            value = np.maximum(value, 0)
        elif kind == "GlobalAveragePooling2D":
            value = value.mean((0, 1))
        elif kind == "Dense":
            value = value @ weight("dense/vars/0") + weight("dense/vars/1")
        else:
            raise ValueError("Unsupported inspected layer")
    return value


def softmax(values):
    values = np.exp(values - np.max(values))
    return values / values.sum()


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--archive", required=True, type=Path)
    parser.add_argument("--report", required=True, type=Path)
    args = parser.parse_args()
    if args.report.exists():
        raise ValueError("Preserve earlier numeric replay")
    config, arrays, audit = inspect_archive(args.archive)
    torch.set_num_threads(2)
    model = NumericGenera(config, arrays).eval().requires_grad_(False)
    yy, xx = np.indices((299, 299))
    fixtures = {"constant_rgb": np.broadcast_to(np.array([.2, .5, .9], dtype="f4"), (299, 299, 3)).copy(),
                "asymmetric_grid": np.stack([xx % 17 / 16, yy % 23 / 22, (xx + 3 * yy) % 31 / 30], axis=-1).astype("f4"),
                "seeded_rgb": np.random.default_rng(7042).random((299, 299, 3), dtype=np.float32)}
    results = []
    with torch.inference_mode(), threadpool_limits(limits=2):
        for name, value in fixtures.items():
            reference = numpy_logits(value, config, arrays)
            actual = model(torch.from_numpy(value).permute(2, 0, 1)[None].contiguous())[0].numpy()
            logit_error = float(np.max(np.abs(actual - reference)))
            probability_error = float(np.max(np.abs(softmax(actual) - softmax(reference))))
            passed = (np.isfinite(reference).all() and np.isfinite(actual).all()
                      and logit_error <= .001 and probability_error <= .0001
                      and int(reference.argmax()) == int(actual.argmax()))
            result = {"name": name, "input_sha256": hashlib.sha256(value.tobytes()).hexdigest(),
                      "reference_logits": reference.tolist(), "torch_logits": actual.tolist(),
                      "max_logit_error": logit_error, "max_probability_error": probability_error,
                      "passed": bool(passed)}
            results.append(result)
            print(json.dumps({key: item for key, item in result.items() if not key.endswith("logits")}), flush=True)
    report = {"archive_sha256": audit["archive_sha256"],
              "code_sha256": {name: hashlib.sha256(Path(__file__).with_name(name).read_bytes()).hexdigest() for name in
                              ("verify_genera_numeric.py", "genera_numeric.py", "audit_genera_archive.py")},
              "cases": results, "passed": all(result["passed"] for result in results),
              "keras_backend_parity_verified": False, "cloud_accuracy_verified": False,
              "release_approved": False}
    args.report.write_text(json.dumps(report, indent=2) + "\n")
    if not report["passed"]:
        raise SystemExit("Numeric replay failed")


if __name__ == "__main__":
    main()
