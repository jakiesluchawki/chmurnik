# Source-Balanced Training Probe

## Predeclared Protocol, 2026-09-06

The preceding goal turn completed a distinct multi-layer trial and rejected it:
277/452 rather than290/452, independently verified. That is research progress,
not a model improvement or a blocked/waiting state. This experiment tests a
different cause of error, not another feature/encoder or hyperparameter sweep.

### Evidence and Hypothesis

Current training contains2,325 photos. Frozen class/OOF-quality weighting gives
CCSN1,505.635 units of total effective influence, IMGW661.879 and the separate
clear-sky source157.487. Within individual cloud classes, CCSN's influence is
60.52% (Ci) to80.28% (Sc), despite every genus retaining equal class totals.

Hypothesis: overrepresentation of one collection encourages source-specific
features and limits transfer. Equalizing source influence **inside each class**
may improve recognition using the same vetted images. This does not assume
IMGW is expert truth, relabel CCSN, establish causality from counts, or claim
the two sources represent field prevalence.

### Fixed Single Arm and Paired Control

- Use the existing last-layer768-feature frozen DINO Small input, never the
  rejected multi-layer features. Train2325 photos x2 views, validation452 x1.
- Pin manifest, original train/validation feature cache and reference head to
  the existing V2 hashes. Verify all ordered IDs, split sizes and labels.
  Read no original photos, calibration caches, holdouts or private feedback.
- Reuse the reference's training-only OOF factors: .25 for the frozen287
  flagged CCSN photos and1 otherwise. Recompute/check these factors against
  its saved OOF scores; do not recompute folds, thresholds or flags.
- For a training photo i with class c and source s, define raw factor
  `q_i / (number_of_sources_in_c * sum(q_j for j in c,s))`.
  Repeat that factor for its original and mirrored feature views.
  Existing class normalization then gives every class equal total influence
  and every represented source within that class an equal share. Relative
  OOF-quality weights inside each source/class cell remain unchanged.
- Fit exactly one source-balanced RBF head and the old control. Keep
  alpha .1, gamma .25/768, one-hot targets x10, training-only StandardScaler,
  CPU float64 fit and two BLAS/Torch threads. No tuning source fractions,
  normalizing on validation, source-specific prediction heads or label changes.
- Require control logits within1e-6 of the retained reference, zero changed
  labels. Stop on identity/control failure rather than comparing candidates.
- Require candidate float32 head parity at batches1/4/32/452: absolute logit
  difference <=.001 and zero prediction changes.
- Eligibility remains raw-all macro-F1 >= .6545474034701404, greater than the
  control, no decline in raw-all/cloud-only top-1 count or unique-photo macro-F1.
  Additionally neither source with cloud labels (CCSN, IMGW) may lose top-1
  count. This prevents declaring a source-transfer improvement through a
  tradeoff that merely harms one collection. Clear-sky results stay visible.
- Report raw/unique/cloud-only/source results, full confusion, paired gains
  and regressions, and both original and rebalanced source/class influence.
- If rejected, do not try new source ratios, retune the kernel or inspect
  holdouts/calibration. Even a development pass still needs unchanged native
  parity, calibration/reliability, fresh-evidence and release requirements.

Preserve the recipe before fitting, both heads/scores and an aggregate report
under `.local/v4/dinov2-source-balance-20260906/`. Do not overwrite completed
or interrupted fits. Independently replay head math, training-only weights and
population metrics before reporting the result. The production model and
already-delivered UI/content updates remain unchanged.
