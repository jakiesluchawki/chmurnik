# Training-Support Reliability Probe

## Frozen Question

The previous goal experiment completed the local Qwen trial and rejected it:
138/452 source-label matches versus the DINO candidate's 290. That was progress,
not a live process or blocker. The intervening narration report concerned
another application and did not advance this goal.

The DINO reliability candidate has demonstrated raw accuracy improvement but
failed the cloud-only acceptance gates. Test whether training-support geometry
ranks its errors better than its own softmax. This does not alter its predicted
genus, increase top-1 accuracy, certify source labels, or replace the app model.

Method reference: Jiang et al., [To Trust Or Not To Trust A Classifier](https://arxiv.org/abs/1805.11783),
NeurIPS 2018. This is an adaptation to the existing frozen DINO representation,
not a reproduction of that paper's datasets or reported improvements.

## One Recipe, Before Evaluation

- V2 manifest SHA256: `d5b0ca33e0867bbb0d0fd25dbd08fc20cfeea316a89299e53f63a6bee5d0ea1c`.
- Fixed classifier head SHA256: `671382d070d721e4e31d699516264ceffc60bf8231129b24d73b96a8b25a4dbe`.
- Reuse checked DINO Small 224 CLS-plus-mean-patch feature caches. Training
  has two views per photo; use only the original view for this support index.
  Validation has one original view. Never extract or score calibration/test.
- Deduplicate training supports by existing image group; exclude contradictory
  groups. Keep the lexicographically first ID, as in existing evaluation.
  Check both duplicate and capture-group separation from validation.
- Standardize using these training representatives only. For each class,
  calculate distance to its tenth other training representative. Retain the
  90% high-density core, including boundary ties. No search over k or percentile.
- Query each class core for its nearest Euclidean support. Trust is
  `other_distance / (predicted_class_distance + other_distance)`, a bounded
  monotonic form of the paper's distance ratio. Coincident conflicting supports
  yield neutral 0.5, never an infinite or guaranteed score. This score is not a
  probability and must not be displayed as one.
- Comparator: unchanged head softmax at temperature 1. No temperature fitted
  from calibration enters this development experiment. Record margin too.
- Primary population: group-deduplicated validation photos with a cloud label,
  excluding clear sky. Also report all images and each source separately.
- Advance only if trust improves correct/incorrect ROC AUC by at least 0.03,
  lowers area under the risk/coverage curve, and reaches at least 90% precision
  in the top 10% of cloud cases (all score ties included). These are development
  screening criteria, not replacement release gates or a deployable threshold.
- Diagnostic maximum coverage at 90% precision requires at least
  `max(25, round(0.08 * cloud_count))` cases. A threshold discovered on validation
  is explicitly not held-out evidence. No rejection may erase raw errors.
- Freeze source/input hashes in a receipt before fitting. Preserve the completed
  output, including negative results. No photo transmission, expert involvement,
  dependency installation, app changes or publication in this experiment.

If it fails, reject this fixed density-support strategy without tuning it on
the same validation set. If it passes, a separate calibration/confirmation and
native-parity plan is still required. The validation set has been reused in
earlier development; it is not fresh independent field evidence.

## Completed Result

The frozen probe is rejected. Training contributes 2304 unique representatives;
the density filter retains 2071. No conflicting training or validation groups
needed exclusion. Validation has 452 raw photos, 449 unique groups, including
420 cloud photographs. Raw genus predictions remain exactly 290/452 correct;
grouped results remain 287/449. Nothing was relabeled or discarded as an error.

| Cloud-only error-ranking measure | Head softmax | Support trust |
| --- | ---: | ---: |
| Correct/incorrect ROC AUC | 0.711886 | 0.603240 |
| Risk/coverage area, lower is better | 0.226030 | 0.306298 |
| Correct in highest-ranked 42 cases | 39/42 | 32/42 |
| Maximum validation-only coverage at 90% precision | 70/420 | None |

Trust also loses within CCSN (AUC 0.738050 -> 0.662002) and IMGW
(0.681240 -> 0.540435), so the overall result is not explained only by source
composition. The true-clear source has no errors and therefore no defined AUC.
All three predeclared screening conditions fail. Do not advance to calibration
or retune density parameters on this reused validation set.

Independent reconstruction with SciPy cKDTree, NumPy mean/standard deviation
and direct neighbor queries matches all core counts and every score within
2.109424e-15. Metric replay matches the stored cloud AUC. Seven focused tests
verify isolation, duplicate/conflict handling, neutral coincident supports,
immutable predictions, score ties, counts and screening thresholds. The full
ML/tooling suite passed 253 tests before the subsequent policy-grid audit.

Artifacts: `.local/v4/dinov2-trust-20260906/`.

- Recipe SHA256: `2fd51b09dd2c66ddb876a2a0cf607e3cd86288e5f7d8c94e13a3c06ceea3cdde`.
- Predictions SHA256: `d4c7337d4742d6241516d5eb4a28c56858a55ff4d9f18a1edd758c5e94d5ab22`.
- Evaluation SHA256: `5f0674a6fb1c43dd5107614c6734d3ca20fbd6e08b41b9ed1dd32c9350cdd9cc`.
- Exact aggregate copy: `trust-score-evaluation.json` alongside this note.

No app, native package, model weight, Apple state, web publication, privacy
setting or expert-outreach action changed. The goal remains active. A separate
inspection of the historical threshold search prompted `policy-grid-audit.md`;
that is not a tuned variation of this rejected trust method.
