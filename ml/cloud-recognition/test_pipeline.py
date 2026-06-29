"""Focused tests for the reproducible cloud-recognition pipeline."""

from __future__ import annotations

import unittest

import numpy as np
import torch

from labels import GENERA, to_genus_labels
from model import build_model
from train import choose_abstention_policy


class PipelineTests(unittest.TestCase):
    def test_ambiguous_synop_code_keeps_both_genera(self) -> None:
        synop = np.zeros((1, 30), dtype=np.float32)
        synop[0, 12] = 1
        labels = to_genus_labels(synop)
        self.assertEqual(labels[0, GENERA.index("altostratus")], 1)
        self.assertEqual(labels[0, GENERA.index("nimbostratus")], 1)

    def test_models_return_one_score_per_supported_class(self) -> None:
        image = torch.zeros(2, 3, 64, 100)
        for architecture in ("tiny", "mobilenet_v3_small"):
            model = build_model(architecture, len(GENERA))
            self.assertEqual(tuple(model(image).shape), (2, len(GENERA)))

    def test_abstention_uses_the_top_two_margin(self) -> None:
        probabilities = np.zeros((200, len(GENERA)), dtype=np.float32)
        labels = np.zeros_like(probabilities)
        labels[:, 0] = 1
        probabilities[:150, 0] = 0.9
        probabilities[:150, 1] = 0.2
        probabilities[150:, 0] = 0.55
        probabilities[150:, 1] = 0.52
        labels[175:, 0] = 0
        labels[175:, 1] = 1
        policy = choose_abstention_policy(probabilities, labels, 0.95)
        self.assertGreater(policy["margin_threshold"], 0.03)
        self.assertTrue(policy["target_met"])


if __name__ == "__main__":
    unittest.main()
