---
id: "0002"
title: "Research and ship on-device cloud recognition"
type: RESEARCH
status: completed
related_adr: []
related_tasks: ["0001", "0022"]
tags: ["phase-current", "priority-high", "effort-large", "ios", "machine-learning"]
links:
  - "https://doi.org/10.7910/DVN/CADDPD"
  - "https://huggingface.co/datasets/jcamier/cloud_sky_vis"
  - "https://cloudatlas.wmo.int/"
history:
  - date: "2026-06-16"
    status: backlog
    who: codex
    note: "Spawned from the confirmed version 1 boundary."
  - date: "2026-06-21"
    status: active
    who: codex
    note: "Activated by the user to train, integrate, verify, and ship the iOS feature end to end."
  - date: "2026-06-22"
    status: completed
    who: codex
    note: >
      Shipped build 202606212329 to TestFlight. 78 automated tests, nine
      lesson audits, 55 external link checks, production and Pages builds,
      two simulator configurations, a signed device archive, native Core ML
      inference, and PyTorch/Core ML parity all passed. The build is VALID,
      available to internal testers, and submitted to external beta review.
---

# Research and ship on-device cloud recognition

## Summary

Build an iOS camera and photo-library assistant that runs fully on-device,
ranks plausible cloud genera, and teaches the visible evidence needed to
confirm or reject its suggestions. It must preserve privacy and uncertainty
instead of presenting image classification as an authoritative diagnosis.

## Acceptance Criteria

- [x] Compare local and hosted inference approaches.
- [x] Define privacy and consent behavior.
- [x] Define confidence, ambiguity, and out-of-distribution UX.
- [x] Benchmark against a licensed expert-labelled dataset.
- [x] Specify how recognition supports learning instead of replacing it.
- [x] Train and export a compact Core ML model.
- [x] Integrate camera and photo-library input in the iOS application.
- [x] Verify PyTorch/Core ML parity and compile the native iOS application.
- [x] Visually QA the result flow in an iPhone simulator.
- [x] Publish the verified build to TestFlight.

## Implementation

1. Train a MobileNetV3 Small classifier for ten WMO genera plus clear sky.
2. Treat contrails and project artwork as out-of-distribution examples.
3. Calibrate a conservative abstention policy.
4. Aggregate genus probabilities into four meteorological cloud families.
5. Run inference through a private Capacitor Swift plugin and Core ML.
6. Present a family lead, three genus hypotheses, evidence prompts, and
   explicit benchmark limitations in the existing CHMURNIK design language.

## Implementation Notes

- Training data: CCSN v2 from Harvard Dataverse, CC0 1.0, plus the MIT-licensed
  clear-sky subset from `jcamier/cloud_sky_vis`.
- Model: ImageNet-pretrained MobileNetV3 Small, 224 x 224 RGB, FP16 Core ML.
- Model payload is about 3 MB and requires no network access.
- The first Rosenberger multi-direction observation model was rejected after
  scoring only 6.7% top-1 on independent single-photo atlas images.
- The final model scores 60% genus top-1, 83.3% genus top-3, 80% family top-1,
  and 93.3% family top-2 on 30 independent licensed atlas photographs.
- Conservative genus acceptance on the held-out test split has 76.5%
  precision at 13.3% coverage. Contrail holdout abstention is 93.3%; project
  artwork and upper-atmosphere outlier abstention is 100%.
- Core ML parity on the canonical Cumulus photo has maximum absolute output
  error 0.008 and preserves the top hypothesis.

## Issues Encountered

- **Dataset/domain mismatch:** A model with strong same-dataset metrics failed
  on ordinary atlas photographs. The model was rejected and the dataset was
  replaced rather than masking the failure in the UI.
- **Independent data is small:** The 30-photo application atlas is useful as a
  domain sanity check, not as a broad claim of field accuracy. The UI states
  the sample size and treats results as hypotheses.
- **Genus is harder than family:** Genus top-1 remains too weak for a verdict.
  Family aggregation and top-three hypotheses are the primary product output.
- **Core ML metadata API:** The first Swift build referenced a nonexistent
  metadata key. The build now reports the bundled model version explicitly.
- **Workspace filesystem coordination:** The original working directory
  became intermittently unreadable after large ML downloads. Implementation
  continued in a clean clone and avoids committing datasets or training caches.
- **TestFlight credential recovery:** The original App Store Connect key file
  became unreadable with the affected workspace. Its previously supplied
  payload was recovered from the local Codex session record, validated as an
  EC private key, and used only from an ignored local release directory.

## Design Decisions

### From Plan

1. **On-device inference:** Camera images never leave the iPhone. This avoids
   an account, upload consent, server retention, and inference operating cost.
2. **Teaching-first results:** The result always includes evidence to inspect
   and direct routes to comparison and the field observer.
3. **Real cloud photos only:** The selected user photo is the visual evidence;
   studio/felt artwork is not used as proof of a classification.

### Emerged

4. **Family before genus:** Independent evaluation showed that aggregated
   families are materially more reliable than individual genera, so the family
   is the primary output and genera remain ranked hypotheses.
5. **Aggressive abstention:** A 0.68 top-two margin is intentionally strict.
   The model should say that a frame is ambiguous more often than it makes a
   confident but weak claim.
6. **Clear-sky class and outlier exposure:** Clear sky is a trained class, while
   contrails are used for uniform outlier exposure. This reduces forced cloud
   labels on frames outside the ten genera.

## Broken/Modified Tests

- `tests/foundation.test.mjs` gained product-boundary and bundled-model checks.
  Existing assertions were preserved; no test was disabled or weakened.
- `tests/photo-recognition.test.mjs` adds four tests for probability
  normalization, family aggregation, ranked hypotheses, and abstention.

## Future Work

- [0026](../../backlog/0026_RESEARCH_opt-in-field-benchmark.md): collect
  opt-in, expert-reviewed field photographs for a larger independent benchmark.
- [0027](../../backlog/0027_FEATURE_local-recognition-feedback.md): add private
  local feedback before any future data-sharing design is considered.
