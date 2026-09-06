# Frozen Multi-Layer DINO Probe

## Predeclared Protocol (2026-09-06)

Recorded before extraction, fitting or scoring the new representation. Research
only; the shipped classifier and Apple/web releases are unchanged.

The retained DINO Small RBF has development recall 17/35 for Stratus, 20/37 for
Altostratus and 22/43 for Altocumulus. Common confusions include St/As/Sc and
Ac/Cc. These source-labelled validation counts motivate a texture/structure
hypothesis, not a claim that any individual source label is expert truth.

The earlier last-two/four-block trials **fine-tuned** the encoder but still
classified its final representation. This probe instead freezes all weights
and uses the official DINO evaluation representation: concatenate the final
four normalized CLS tokens in block order and the mean normalized patch token
from the last block. See the [official implementation](https://github.com/facebookresearch/dinov2/blob/7764ea0f912e53c92e82eb78a2a1631e92725fc8/dinov2/eval/linear.py)
(`create_linear_input`, `n_last_blocks_list = [1, 4]`). Using that representation
with our RBF head is our hypothesis; it is not an official cloud benchmark.

Exactly one new arm, 1,920 features instead of 768. No new encoder weights,
data, masks, image geometry, hyperparameter grid, seed sweep or class relabeling.
Backbone is the retained frozen Small from `dinov2-imgw-mlp` (SHA256
`d34d1f2d871ebaaed612c6132ee10575016e939f5072a289ff837520fc1cea87`).
The official repository revision remains
`7764ea0f912e53c92e82eb78a2a1631e92725fc8`.

- Use pinned V2 manifest
  `d5b0ca33e0867bbb0d0fd25dbd08fc20cfeea316a89299e53f63a6bee5d0ea1c`:
  2,325 train photos (original/mirror), 452 validation photos (original only).
- Read only train/validation images, verify original pixel hashes or retained
  IMGW artifact hashes. Do not use private feedback, calibration or holdouts.
- Preserve 224px center crop, fraction .902, ImageNet normalization and the
  existing EXIF/resize implementation. Use float32 MPS, four-image batches.
- Fit training-only StandardScaler and class-balanced weighted kernel ridge,
  alpha .1, gamma .25 / feature dimension, one-hot targets times 10.
- Reuse the frozen training-only OOF quality weights from the reference head,
  with exact training ID checks and recomputation from its retained OOF scores.
  Both views of a photo retain the same weight. No new quality estimate.
- The last 768 dimensions must reproduce every retained train/validation
  feature within absolute 1e-4; reject a cache/order/preprocessing mismatch.
- Refit the last-layer control once and require validation logits within .001
  of the retained reference and zero top-1 changes. Report feature error too.
- Verify the new float32 RBF head against float64 sklearn at batches 1/4/32/452:
  maximum absolute logit difference .001 and zero top-1 differences.
- Eligibility requires macro-F1 >= .6545474034701404 (at least .01 over the
  reference .6445474034701404), greater than paired control, no lower raw-all
  or cloud-only top-1 count, and no lower unique-photo macro-F1.
- Report raw/unique, cloud-only, by-class and by-source metrics, paired gains
  and regressions. The 452 rows contain 449 unique labelled photos; report both.
- If ineligible, stop this hypothesis without holdout runs, calibration,
  retraining, changing the gate or altering the representation.
- Even a passing development result needs native/import parity, unchanged
  precision/coverage criteria and fresh evidence before release. Repeatedly
  used validation is selection data, not an independent accuracy estimate.

Retain immutable recipe, code/input hashes, resumable feature caches, paired
heads and results under `.local/v4/dinov2-multilayer-20260906/`. Only the protocol,
tools, tests and non-image aggregate evidence may enter Git.

## Backend Correction Before Fitting or Validation (2026-09-06)

The first attempt stopped on the training-feature provenance check, before any
head fit or validation extraction. Metal float32 differs from the historical
CPU features by up to .00017176568508148193; 23/4,650 training views exceed
the predeclared .0001 tolerance. Keep that gate unchanged.

A diagnostic compares the worst training batch from each of CCSN, clear-sky and
IMGW. For all three batches, both extraction methods on CPU reproduce historical
features **exactly**. On Metal, ordinary final-only and multi-layer extraction
also agree exactly with each other, but both differ from historical CPU values.
Repeated calls are identical. This isolates the execution backend, not pooling,
image preprocessing or a candidate-accuracy effect. The original Metal recipe,
training cache, script snapshot and numeric diagnostic remain preserved.

Correct the experimental backend to **CPU float32, two threads, batch size4**
to match historical extraction. Save under
`.local/v4/dinov2-multilayer-cpu-20260906/`, not over the stopped Metal attempt.
All representation, fit, quality and parity thresholds remain unchanged.
This is a pre-outcome reproducibility correction, not a second hypothesis or
selection among candidate scores. No candidate/validation logits were obtained
before this correction. `numeric-diagnostic.json` contains the six comparisons.
