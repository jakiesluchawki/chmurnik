---
id: "0042"
title: "Improve cloud recognition first and deliver the next Apple and web release"
type: FEATURE
status: active
related_adr: ["0001", "0002"]
related_tasks: ["0029", "0026", "0034", "0035"]
tags: ["priority-high", "machine-learning", "ios", "macos", "web", "field-feedback", "copy-editing"]
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
The owner explicitly added comprehensive interface copy-editing on September 4:
replace vague, staccato slogans with natural Polish explaining functions,
actions and results, informed by the better approved social copy. This is a
separate release requirement, not a substitute for model improvement.

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
- Interface slogans and strings of short fragments obscure practical meaning.
  Audit the home screen, recognition, atlas, learning navigation, METAR/TAF,
  wind, empty/error states and relevant web entry points as complete journeys.
- Private messages/videos are research evidence only: no public uploads, no
  training use, and no identifiable feedback committed.

## Acceptance Criteria

- [x] Audit actual shipped Core ML models, preprocessing and baseline results.
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
- [ ] Edit the complete Apple interface and applicable web copy: users can tell
  what each feature does, how to proceed, and what the result means. Remove
  empty slogans and unnecessary sentence fragments; retain technical accuracy,
  uncertainty and restrained warmth. Preserve approved published social assets.
- [ ] Review revised copy as complete sets, verify it in context and at phone,
  tablet and desktop sizes; do not replace useful technical content with slogans.
- [ ] Native and web regression, layout, accessibility and lesson checks pass.
- [ ] Prepare and verify iOS/macOS release artifacts, preserve SDK-signature fix,
  and deliver web package/deployment without changing unrelated services.
- [ ] Report actual Apple upload/review state, not assume App Store publication.

## Plan

1. Recover data, measure the shipped ensemble directly, and lock evaluation.
2. Train stronger candidates and calibrate with held-out data; validate Core ML.
3. Implement region analysis, comparison and progressive results.
4. Repair course navigation and appropriate web behavior; edit interface copy
   throughout complete user journeys and verify meaning and fit in context.
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
at 33.6% coverage. Exact native reproduction is now complete on 737 photos;
the group-aware test top-1 is 68/123 (55.28%), cloud-only 37/92 (40.22%).
See `experiment-contract.md` for provenance and all comparison gates.

The original CCSN, clear-sky and old CCAiM datasets are locally available.
The v2/v3 training checkpoints and curated Commons subset are not yet located.
The current public CCAiM card reports 916 images, unlike the old 247-photo stress
subset; treat dataset versions separately and audit label/provenance quality.

## Release Integration Note

The previous Mac SDK signature repair was reviewed in chmurnik-finish and ported
as f674f55 with five passing tests. No distribution build or upload has occurred;
do not claim iPad/Mac review approval based on September 3 history alone.

## Additional Deliverable Requested September 5

- [ ] Create 20 more distinct wallpaper motifs in the approved CHMURNIK
  felt/cloud/pink/olive/violet style. Each motif has separately composed
  desktop 3840x2160 and phone 2160x3840 PNGs: 20 motifs, 40 files, not
  recolors/crops counted as additional designs. No text or scientific-photo
  claims. Preserve existing packs and expose individual/ZIP downloads through
  the existing SM asset hub. This is supplementary; recognition remains first.

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
- Added plain-language result states and own-photo/atlas comparison in the
  same view, keeping uncertainty and technical scores separate. Removed manual
  framing sliders in favor of tap/keyboard selection with context-size buttons.
  Automatic proposal input is supported by the component, but the model-driven
  proposal engine is not integrated yet; do not claim automatic detection works.
- Added prominent full-course and layers-workspace links beside the three
  short practice entries on native and web homes. The full layers page no
  longer promotes the short modules above its own six workspace tabs.
- Production web build and 201 JavaScript tests pass. Mobile browser QA with
  synthetic classifier output verifies tap framing and retained photo comparison;
  this is UI evidence only, not model-accuracy evidence. Native release remains
  unmodified and unpublished.
- Added the owner's full copy-editing requirement to this active goal's scope
  and acceptance criteria, and recorded reusable writing rules in AGENTS.md.
  Recognition remains the first priority. Current regression count is 206
  JavaScript and 31 focused Python tests, with all nine lesson audits passing.
- Completed the declared V2 model trials and the fresh IMGW confirmation.
  The selected MLP improves several accuracy measurements but fails atlas and
  calibrated-precision release gates. Full results remain in the experiment
  contract; no production model replacement is authorized by these results.
- Serialized capture, crop preparation, inference and saves within the photo
  dialog, ignoring results from unmounted screens and preventing rapid duplicate
  operations. Added five tests including StrictMode remount and late completion.
  Corrected a photo-loading layout shift that scrolled the answer behind its
  header. Browser QA at 1280x720 and 390x844 confirms retained comparison,
  keyboard selection and original-photo save; its classifier is a QA fixture.
  All 211 JavaScript tests and the production web build pass. Native release
  regression and the full copy edit remain outstanding.
- Rewrote native/web home introductions, both onboarding sequences, workshop
  introductions and photo-entry/save copy with explicit actions and meanings.
  The review set is `design/copy-v4-entry-review.md`; it clearly lists what
  still needs editing. Fixed a pre-existing mobile `nowrap` constraint exposed
  by the longer headline. Browser QA covered 390x844 native-layout/workshop/web
  views, web onboarding, 1024x1366 native home and 1280x900 web home. Full-course
  access works without completing short practice. All 213 JavaScript tests,
  production build and nine lesson audits pass. This is not a native release.
- Completed the validation-only input-geometry comparison and the predeclared
  frozen SigLIP 2 comparison. Neither provides an improvement over the selected
  DINO candidate. Preserved negative results and added ten focused tests, for
  44 passing ML tests total. No new held-out evaluation or production model
  replacement occurred. Full recognition/copy/native acceptance remains open.
- Completed a fixed two-head ensemble (negative) and a nine-setting kernel
  study (selected .64303 validation macro-F1). Corrected float32 cancellation
  without changing the selected fit; all 452 validation cases match sklearn's
  labels within the declared logit tolerance across four batch sizes. The
  full-image kernel candidate improves old/fresh-exposed/stress raw accuracy
  and restores atlas performance, but fails calibrated-precision and coverage
  release gates. Keep it experimental. Fifty-two ML tests pass; no native
  model replacement, new Apple build, or upload occurred. Additional details
  and immutable result hashes are recorded in the experiment contract.
