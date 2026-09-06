import unittest

import numpy as np
import torch

from genera_numeric import attention, normalize, same_conv2d


class GeneraNumericTests(unittest.TestCase):
    def test_same_padding_even_and_odd_numpy_reference(self):
        rng = np.random.default_rng(42)
        for size in (5, 6):
            for stride in (1, 2):
                values = rng.normal(size=(1, 2, size, size + 1)).astype("f4")
                weights = rng.normal(size=(3, 2, 3, 3)).astype("f4")
                expected = np.zeros((1, 3, (size + stride - 1) // stride, (size + stride) // stride), dtype="f4")
                top = max((expected.shape[2] - 1) * stride + 3 - size, 0) // 2
                left = max((expected.shape[3] - 1) * stride + 3 - size - 1, 0) // 2
                for out in range(3):
                    for y in range(expected.shape[2]):
                        for x in range(expected.shape[3]):
                            for channel in range(2):
                                for ky in range(3):
                                    for kx in range(3):
                                        iy, ix = y * stride + ky - top, x * stride + kx - left
                                        if 0 <= iy < size and 0 <= ix < size + 1:
                                            expected[0, out, y, x] += values[0, channel, iy, ix] * weights[out, channel, ky, kx]
                actual = same_conv2d(torch.from_numpy(values), torch.from_numpy(weights), stride).numpy()
                np.testing.assert_allclose(actual, expected, atol=2e-6, rtol=2e-6)

    def test_batch_normalization_uses_inference_and_keras_epsilon(self):
        values = torch.tensor([[[[2., 4.]], [[5., 7.]]]])
        state = tuple(torch.tensor(v) for v in ([2., 3.], [1., -1.], [1., 2.], [4., 9.]))
        expected = np.empty(values.shape, dtype="f4")
        for channel in range(2):
            g, b, mean, var = (float(v[channel]) for v in state)
            expected[:, channel] = (values.numpy()[:, channel] - mean) * g / np.sqrt(var + .001) + b
        np.testing.assert_allclose(normalize(values, state).numpy(), expected, atol=1e-6)

    def test_attention_is_across_channels_not_spatial_or_batch_axis(self):
        values = np.arange(2 * 7 * 2 * 3, dtype="f4").reshape(2, 7, 2, 3) / 30
        weights = np.array([.5, -.2, .3, .1, -.4], dtype="f4")
        expected = values.copy()
        for batch in range(2):
            means = values[batch].mean((1, 2))
            for channel in range(7):
                score = sum(float(means[c]) * weights[k] for k in range(5)
                            if 0 <= (c := channel + k - 2) < 7)
                expected[batch, channel] *= 1 / (1 + np.exp(-score))
        actual = attention(torch.from_numpy(values), torch.from_numpy(weights.reshape(1, 1, 5))).numpy()
        np.testing.assert_allclose(actual, expected, atol=3e-7, rtol=3e-7)


if __name__ == "__main__":
    unittest.main()
