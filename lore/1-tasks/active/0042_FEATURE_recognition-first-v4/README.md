---
id: "0042"
title: "Improve cloud recognition first and deliver the next Apple and web release"
type: FEATURE
status: active
related_adr: ["0001", "0002"]
related_tasks: ["0029", "0026", "0034", "0035"]
tags: ["priority-high", "machine-learning", "ios", "macos", "web", "field-feedback"]
history:
  - date: "2026-09-04"
    status: active
    who: codex
    note: >
      Owner authorized implementation and a new iOS/macOS version, appropriate
      web improvements, and explicitly prioritized improving the model over UI.
      Work isolated in codex/chmurnik-v4, preserving other worktrees. Integrated
      the existing iPad/Mac implementation as 385443f without changing its source.
---

# Recognition-First V4

## Priority and Scope

First measure and improve recognition itself. Do not relabel improved copy,
abstention, or more attractive results as improved classification accuracy.
Then add automatic region proposals with tap selection, a comprehensible result,
own-photo versus atlas comparison, and a discoverable full learning path.
Deliver iPhone/iPad and Mac Catalyst builds plus appropriate web improvements.

## Feedback

- Current recognition is unreliable in field use; a dark-sky example remains
  unlabeled and must not be assigned invented ground truth.
- Too much technical information precedes the usable answer.
- Comparison must retain the user's photograph and clearly distinguish the
  selected region from licensed atlas examples.
- Manual cropping sliders are unacceptable as the primary workflow. Propose
  cloud regions automatically; let users tap them or point at a missed region.
- Multiple and overlapping clouds and continuous layers need explicit handling.
- The three visible learning modules hide the full layers learning module.
- Private messages/videos are research evidence only: no public uploads, no
  training use, and no identifiable feedback committed.

## Acceptance Criteria

- [ ] Audit actual shipped Core ML models, preprocessing and baseline results.
- [x] Freeze duplicate-aware train/validation/calibration/test manifests and
  provenance before candidate selection; retain an external evaluation set.
- [ ] Train and evaluate stronger models, with per-class results, top-1/top-3,
  macro-F1, uncertainty calibration, rejection/coverage and robustness checks.
- [ ] Replace the model only on demonstrated improvement, not cherry-picked
  photos; document any limitations or failed candidates honestly.
- [ ] Verify exported Core ML predictions against the selected training model
  and the native image preprocessing on representative inputs.
- [ ] Automatic region proposals and tap selection replace compulsory sliders;
  no fabricated detection masks or claims of a labeled segmentation benchmark.
- [ ] Results show a short explanation and retain optional technical detail.
- [ ] Comparison clearly shows own selected photo and real licensed atlas photo.
- [ ] Full learning and layers module are discoverable without completing teasers.
- [ ] Native and web regression, layout, accessibility and lesson checks pass.
- [ ] Prepare and verify iOS/macOS release artifacts, preserve SDK-signature fix,
  and deliver web package/deployment without changing unrelated services.
- [ ] Report actual Apple upload/review state, not assume App Store publication.

## Plan

1. Recover data, measure the shipped ensemble directly, and lock evaluation.
2. Train stronger candidates and calibrate with held-out data; validate Core ML.
3. Implement region analysis, comparison and progressive results.
4. Repair course navigation and appropriate web behavior.
5. Complete Apple and web verification and release delivery.

## Design Decisions

### From Plan

1. Model quality takes priority over UX work, as explicitly requested.
2. Keep photo processing local and preserve the original photograph/context.
3. Preserve existing lessons, scientific sources, Apple support and social assets.

### Emerged

4. Use a new worktree combining published social assets and the existing native
   Apple platform commit. Leave dirty release/Android worktrees untouched.
5. Evaluate bundled Core ML models directly when the matching training checkpoints
   are unavailable; older checkpoints must not masquerade as the shipped baseline.

## Initial Evidence

Shipped recognition uses calibrated MobileNetV3 Small and Large at 40/60 weight,
an explicit 90.2% center square crop and an 11-label softmax. The historical
40-photo Commons benchmark recorded 52.5% top-1, not general 95% accuracy.
The historical 95.7% precision concerned only accepted calibration predictions
at 33.6% coverage. New baseline reproduction remains pending.

The original CCSN, clear-sky and old CCAiM datasets are locally available.
The v2/v3 training checkpoints and curated Commons subset are not yet located.
The current public CCAiM card reports 916 images, unlike the old 247-photo stress
subset; treat dataset versions separately and audit label/provenance quality.

## Release Integration Note

The previous Mac SDK signature repair is uncommitted in chmurnik-finish. Read and
port only those reviewed release fixes before packaging; do not lose them or
claim iPad/Mac review approval based on September 3 history alone.

## Worklog

Ongoing details and benchmark contracts belong in this task, not the wiki.

- Created the frozen manifest and measured both actual bundled Core ML packages.
  Native renderer parity is still pending; see `experiment-contract.md`.
- Confirmed contradictory source labels on visually identical photographs.
  Conservative grouping excludes conflicts and prevents split leakage.
- Added a ConvNeXt-Tiny candidate, held-out evaluation, confidence intervals,
  paired comparisons and atomic training recovery. Thirteen focused tests pass.
- The owner's computer restart interrupted the first reduced-memory run. A
  repeat is running; no candidate model has been accepted or shipped yet.
