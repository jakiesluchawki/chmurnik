---
id: "0029"
title: "Improve on-device cloud recognition accuracy"
type: FEATURE
status: completed
related_adr: []
related_tasks: ["0002", "0026", "0027"]
tags: ["phase-current", "priority-high", "effort-large", "ios", "machine-learning"]
links:
  - "https://doi.org/10.7910/DVN/CADDPD"
  - "https://huggingface.co/datasets/serbekun/CCAiM-CloudsDataset"
history:
  - date: "2026-06-22"
    status: active
    who: codex
    note: "Activated after field and atlas testing showed inconsistent genus predictions in the shipped v2 model."
  - date: "2026-06-22"
    status: completed
    who: codex
    note: >
      Shipped an on-device v2/v3 ensemble after independent benchmarking,
      Core ML parity checks, simulator QA, physical-iPhone inference, and a
      complete TestFlight release. Build 20260622095204 entered internal and
      external beta testing after automatic Apple approval.
---

# Improve on-device cloud recognition accuracy

## Summary

Train and ship a more reliable on-device cloud recognizer without weakening
privacy, uncertainty, or the teaching-first product boundary. Compare model
variants on held-out CCSN data, the application atlas, and a separate licensed
ten-genus photo set before replacing the bundled Core ML model.

## Acceptance Criteria

- [x] Reproduce the v2 benchmark and document its weakest classes.
- [x] Add a repeatable independent ten-genus benchmark with license metadata.
- [x] Prevent exact and near-duplicate leakage across CCSN splits.
- [x] Compare full-frame, higher-resolution, and hierarchical model variants.
- [x] Replace v2 only if v3 materially improves independent macro-F1 and does
      not regress top-three accuracy or outlier abstention.
- [x] Verify PyTorch and Core ML parity for the selected model.
- [x] Integrate matching image preprocessing in the iOS application.
- [x] Run automated, simulator, archive, and physical-device checks.
- [x] Publish the verified build to internal and external TestFlight testers.

## Implementation Notes

- Added duplicate-safe perceptual-hash splits, a license-tracked Wikimedia
  Commons benchmark, and CCAiM as a deliberately noisy stress set.
- Compared full-frame and center-crop MobileNetV3 Large candidates at 320 px,
  auxiliary family loss, outlier exposure, and a Commons training supplement.
- Rejected both the full-frame candidate and a candidate trained with Commons
  supplements because their application-atlas regressions were too large.
- Shipped a probability ensemble: 40% v2 MobileNetV3 Small and 60% v3
  MobileNetV3 Large. The selected policy requires 0.20 confidence and a 0.51
  top-two margin before naming a decisive genus hypothesis.
- Changed family aggregation from a sum to a normalized maximum so a family
  containing more genera does not win merely because it has more labels.
- Reproduced the training crop explicitly in UIKit before Vision inference.
  Vision's generic center-crop path did not match the torchvision transforms.

## Benchmark Outcome

- Curated Commons, unseen by training: macro-F1 rose from 36.5% to 49.6%,
  top-1 from 37.5% to 52.5%, and top-3 from 70.0% to 80.0%.
- Application atlas: top-1 rose from 60.0% to 63.3%, macro-F1 from 52.2% to
  58.4%, while top-3 remained 83.3% and family top-1 reached 83.3%.
- Common duplicate-safe CCSN test: top-1 was 54.9% versus v2's 55.6%, while
  top-3 improved from 76.8% to 80.3%. The ensemble therefore improves breadth,
  not every individual benchmark.
- The calibration holdout reached 95.7% selective precision at 33.6% coverage.
  The expanded outlier set abstained on 93.1% of samples, effectively matching
  the prior 93.3% contrail result while covering additional project outliers.
- PyTorch/Core ML ensemble probability parity had 0.0033 maximum absolute
  error, below the 0.01 release tolerance.

Detailed machine-readable results are in `benchmark/summary.json`.

## Validation

- 84 Node tests passed.
- All 9 lesson modules and 55 external links passed their audits.
- Production web build and unsigned iOS simulator build passed.
- A separate QA bundle ran on a paired physical iPhone and returned all 11
  probabilities through the native Core ML bridge.
- Native visual QA of the canonical Cumulus photograph returned Cumulus and
  the convective family after the preprocessing correction.
- TestFlight build `20260622095204` is `IN_BETA_TESTING` for both internal and
  external groups; Apple's beta review state is `APPROVED`.

## Design Decisions

### From Plan

1. **Independent evidence is the release gate:** Same-dataset gains alone do
   not justify replacing the shipped model.
2. **Keep inference on-device:** No uploaded photographs, remote inference, or
   analytics are introduced.
3. **Real cloud photographs only:** Generated studio artwork remains visual
   guidance and is never used as classification evidence.

### Emerged

1. **Ensemble instead of replacement:** No single candidate improved every
   independent surface. Combining complementary v2 and v3 errors produced the
   strongest independent top-three and Commons results within the size budget.
2. **Exact native preprocessing is a release gate:** Simulator compilation is
   insufficient. A canonical photograph must produce matching PyTorch and
   native rankings before release.
3. **Use normalized maximum family evidence:** Summation rewards taxonomic
   group size rather than photographic evidence.

## Broken/Modified Tests

- Added family-count-bias coverage and assertions for the bundled v3 Core ML
  package and ensemble plugin contract.
- Full release checks are listed under Validation.

## Future Work

- Task 0026 remains the path to an opt-in, expert-reviewed field benchmark.
- Task 0027 remains the path to private local correction capture for future
  hard-example mining.
