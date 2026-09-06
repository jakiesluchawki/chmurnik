"""Numeric and evidence-boundary checks for the single paired robust-loss trial."""

import copy
import unittest

import numpy as np
import torch
from torch.nn import functional as F

from probe_v4_robust_loss import (BAR, control_parity, eligible, generalized_loss,
                                  summarize, validation_populations)


class RobustLossTests(unittest.TestCase):
    def setUp(self):
        self.logits = torch.tensor([[1.2, -.6, .3], [-.2, .4, 1.8]], dtype=torch.float64)
        self.labels = torch.tensor([0, 1])
        self.weights = torch.tensor([1., 2.5, 1.7], dtype=torch.float64)

    def test_zero_is_exact_existing_weighted_smoothed_ce_and_gradient(self):
        a = self.logits.clone().requires_grad_()
        b = self.logits.clone().requires_grad_()
        loss = generalized_loss(a, self.labels, self.weights, q=0)
        expected = F.cross_entropy(b, self.labels, weight=self.weights, label_smoothing=.05)
        self.assertTrue(torch.equal(loss, expected))
        loss.backward()
        expected.backward()
        self.assertTrue(torch.equal(a.grad, b.grad))

    def test_numpy_weighted_soft_target_formula(self):
        values = self.logits.numpy()
        p = np.exp(values - values.max(axis=1, keepdims=True))
        p /= p.sum(axis=1, keepdims=True)
        desired = np.eye(3)[self.labels.numpy()] * .95 + .05 / 3
        weights = self.weights.numpy()
        expected = (desired * weights * (1 - p ** .7) / .7).sum() / weights[self.labels.numpy()].sum()
        self.assertAlmostEqual(float(generalized_loss(self.logits, self.labels, self.weights)), expected, places=14)

    def test_small_q_converges_to_ce_and_one_to_half_mae(self):
        zero = generalized_loss(self.logits, self.labels, self.weights, q=0)
        near = generalized_loss(self.logits, self.labels, self.weights, q=1e-8)
        self.assertLess(abs(float(zero - near)), 1e-7)
        actual = generalized_loss(self.logits, self.labels, torch.ones(3), q=1, smoothing=0)
        expected = (1 - self.logits.softmax(1)[torch.arange(2), self.labels]).mean()
        self.assertAlmostEqual(float(actual), float(expected), places=14)

    def test_hard_target_gradient_is_probability_weighted_ce(self):
        for label in range(3):
            a = self.logits[:1].clone().requires_grad_()
            b = a.detach().clone().requires_grad_()
            y = torch.tensor([label])
            generalized_loss(a, y, torch.ones(3), smoothing=0).backward()
            F.cross_entropy(b, y).backward()
            multiplier = b.detach().softmax(1)[0, label] ** .7
            torch.testing.assert_close(a.grad, b.grad * multiplier, rtol=1e-12, atol=1e-12)

    def test_extreme_logits_and_gradcheck(self):
        x = torch.tensor([[10000., -10000., 0.]], dtype=torch.float64, requires_grad=True)
        loss = generalized_loss(x, torch.tensor([1]), self.weights)
        loss.backward()
        self.assertTrue(torch.isfinite(loss))
        self.assertTrue(torch.isfinite(x.grad).all())
        x = self.logits.clone().requires_grad_()
        self.assertTrue(torch.autograd.gradcheck(lambda z: generalized_loss(z, self.labels, self.weights), (x,)))

    def test_invalid_loss_inputs_fail(self):
        for q in (-.1, 1.1, float("nan")):
            with self.assertRaises(ValueError):
                generalized_loss(self.logits, self.labels, self.weights, q=q)
        for logits, labels, weights in (
            (self.logits * float("nan"), self.labels, self.weights),
            (self.logits, torch.tensor([-1, 0]), self.weights),
            (self.logits, torch.tensor([3, 0]), self.weights),
            (self.logits, self.labels.float(), self.weights),
            (self.logits, self.labels, torch.tensor([1., 0., 1.])),
            (self.logits[:0], self.labels[:0], self.weights),
        ):
            with self.assertRaises(ValueError):
                generalized_loss(logits, labels, weights)

    def test_control_reproduction_rejects_drift_or_changed_predictions(self):
        self.assertEqual(control_parity(self.logits, self.logits), {"max_logit_error": 0., "top1_changes": 0})
        with self.assertRaises(ValueError):
            control_parity(self.logits + .00001, self.logits)
        with self.assertRaises(ValueError):
            control_parity(torch.tensor([[0., 1e-8]]), torch.tensor([[1e-8, 0.]]))
        with self.assertRaises(ValueError):
            control_parity(self.logits * float("nan"), self.logits)

    def test_population_grouping_and_holdout_rejection(self):
        rows = [{"id": str(i), "group": g, "source": "s", "split": "validation", "label": y}
                for i, (g, y) in enumerate([("a", 0), ("a", 0), ("b", 1), ("b", 2), ("c", 10)])]
        populations, excluded = validation_populations(rows)
        self.assertEqual(excluded, ["b"])
        self.assertEqual(populations["unique_all"].tolist(), [0, 4])
        self.assertEqual(populations["unique_clouds"].tolist(), [0])
        self.assertEqual(populations["raw_clouds"].tolist(), [0, 1, 2, 3])
        for split in ("test", "calibration", "train", "confirmation"):
            with self.assertRaises(ValueError):
                validation_populations([{**row, "split": split} for row in rows])
        with self.assertRaises(ValueError):
            validation_populations(rows + [rows[0]])

    def test_confusion_and_present_class_f1(self):
        result = summarize(np.array([0, 0, 1, 1]), np.array([0, 1, 1, 10]))
        self.assertEqual(result["correct"], 2)
        self.assertEqual(result["accuracy"], .5)
        self.assertAlmostEqual(result["macro_f1"], (2 / 3 + .5) / 2)
        self.assertEqual(result["confusion"][1][10], 1)
        with self.assertRaises(ValueError):
            summarize(np.array([0]), np.array([11]))

    def test_eligibility_requires_every_frozen_screen(self):
        reference = {"raw_all": {"macro_f1": BAR - .01, "correct": 290},
                     "raw_clouds": {"correct": 259}, "unique_all": {"macro_f1": .64}}
        control = copy.deepcopy(reference)
        candidate = copy.deepcopy(reference)
        candidate["raw_all"]["macro_f1"] = BAR
        self.assertTrue(eligible(candidate, control, reference))
        for population, metric in (("raw_all", "macro_f1"), ("raw_all", "correct"),
                                   ("raw_clouds", "correct"), ("unique_all", "macro_f1")):
            changed = copy.deepcopy(candidate)
            changed[population][metric] -= .001
            self.assertFalse(eligible(changed, control, reference))
        self.assertFalse(eligible(candidate, candidate, reference))


if __name__ == "__main__":
    unittest.main()
