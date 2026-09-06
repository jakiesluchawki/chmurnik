# Multi-Layer Probe: Rejected

Completed on 2026-09-06 using the [predeclared protocol](multilayer-probe.md),
including its documented pre-outcome CPU correction. No replacement model,
Core ML export, calibration or holdout evaluation follows this result.

## Outcome

| Validation population | Final-only control | Last-four candidate |
|---|---:|---:|
| All 452 rows: top-1 correct | 290 (64.16%) | 277 (61.28%) |
| All rows: macro-F1 | .644547 | .616455 |
| 449 unique photos: correct | 287 (63.92%) | 275 (61.25%) |
| Unique-photo macro-F1 | .642974 | .617144 |
| 422 cloud rows: correct | 260 (61.61%) | 247 (58.53%) |
| 420 unique cloud photos: correct | 258 (61.43%) | 246 (58.57%) |
| CCSN: correct / 288 | 182 | 173 |
| IMGW: correct / 144 | 88 | 84 |
| Separate clear-sky source: correct / 20 | 20 | 20 |

There are 17 corrected and 30 regressed validation rows. The required
macro-F1 >= .6545474034701404 and no-regression checks are not met. Reject this
fixed representation with this head; do not infer that every multi-layer
architecture is ineffective. No validation-driven block selection or new
parameter sweep was performed.

The texture/structure hypothesis did not improve the motivating weaknesses:
Stratus declines17->13/35, Altocumulus22->20/43, Altostratus stays20/37,
Nimbostratus27->23/44 and Stratocumulus stays37/57. Cirrus improves18->22/30,
but this does not offset the regressions. The full confusion matrices and
54 population reports are preserved in `multilayer-result.json`.
Its `class_*` entries are true-label-conditioned subsets, not full-population
class precision estimates; use the `raw_all` matrix for that purpose.

These are agreements with retained source labels on repeatedly used
**development data**, not estimates of independent field accuracy. The control
is the best experimental DINO candidate, not the shipped MobileNet ensemble.

## Reproducibility

- Original Metal attempt stopped before fitting or validation: maximum
  historical-feature discrepancy .000171766. No threshold was loosened.
- The three worst training batches reproduce historical features exactly on
  CPU. Both extraction methods agree exactly within each backend. See
  `multilayer-numeric-diagnostic.json`; no candidate scores guided the correction.
- Full corrected CPU extraction reproduces all4,650 training-view and452
  validation-view historical final-only vectors **exactly**, maximum error0.
- Paired control refit reproduces all retained validation logits exactly,
  maximum error0 and zero label changes.
- Float32 head checks pass at batches1/4/32/452. Worst absolute logit errors:
  control .000174265; candidate .000318029. Zero prediction changes.
- Independent NumPy/SciPy distance and matrix replay, without importing the
  experiment/head/metric helpers, gives maximum error .000030693 for control
  and .000044310 for candidate, zero prediction changes. It rechecks training
  statistics, frozen OOF quality, IDs, all54 population reports and rejection.
- Eight focused tests and all284 ML/tooling tests pass, zero skips. The full
  suite emits existing coremltools/version/deprecation warnings. No Core ML
  conversion of this candidate is claimed.
- CPU extraction/fits/reporting took179.5seconds, excluding initial source
  verification, unit tests and the stopped Metal attempt. All processes ended.

Artifacts remain local under `.local/v4/dinov2-multilayer-cpu-20260906/`;
the first stopped attempt remains under `.local/v4/dinov2-multilayer-20260906/`.
Independent replay is `.local/v4/verify_multilayer_result.py`; its checksum is
retained in `multilayer-replay.json`. No private photos were uploaded or used.

| Artifact | SHA256 |
|---|---|
| CPU recipe | `ec4e25e325c03795aadea56f22e7821787782a4e29fe52390d39880876aa87f9` |
| Evaluation | `dfba0b13fdf54618d34fb22f3de4d1a997ab922005b5e65a0c354fbdd5412a5e` |
| Training features | `f0fc01fa737759e24e424f643dd60ebb7565c9d20b6cd10dc4c5958946d25070` |
| Validation features | `13cb1fba98b45f5e9d27dccc94db09a8d42c3f6e782daf3578d8b93cd073c872` |
| Control head | `f377c1f6627a6ac020eed41fd0d4792cc45f56205992973e01c5ae262e8ded0c` |
| Candidate head | `d28394599a75fd03266b704569544375332d31f7b2eeb0d424ede9cd42e6920c` |

## Scope

The hypothesis has a completed negative result, not an accuracy improvement.
Production weights, web package, Apple release and privacy settings are
unchanged. The owner-deferred expert review remains deferred. The overall
goal stays active with its model reliability and fresh-evidence gates open.
