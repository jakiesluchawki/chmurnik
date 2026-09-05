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
- Trained a compact binary cloud-mask model on newly audited CC-BY-4.0 DLR
  data, with capture-day/duplicate split protection. Its 48-image test IoU is
  .90080 versus .81778 for RGB rules; this is cloud-pixel segmentation, not
  genus accuracy. A 4.5 MB float32 Core ML export passes 78-photo parity and
  original-photo native tests, including all eight EXIF orientations. Added
  tested Swift mask-to-region proposals and inspected 30 atlas examples;
  thin/warm/dark clouds, elevated fog and overly broad rectangles remain
  limitations. Sixty-four ML tests and native assertions pass. Full evidence
  and unreleased status are in `segmentation-contract.md`. Neither this work
  nor its segmentation score closes the genus-model or release requirements.
- Completed a pinned DINOv2 Base/336px comparison on unchanged development
  data. Four linear heads and one fixed MLP did not beat the small kernel;
  best macro-F1 was .62172 versus .64303. No holdouts or production model were
  touched. Preserved all heads/features and losslessly archived the selected
  checkpoint against the official source. All 80 ML tests pass. Audited NASA
  GLOBE metadata and implemented a tested parser for 810 broken CSV records;
  excluded incomplete classification metadata and preserved union categories.
  The corrected source has 3,099 observations and 15,333 photo URLs, but the
  screened subset is imbalanced and covers only 11 dates. A fixed visual audit
  and proper grouping must precede training. See `data-expansion-audit.md`.
  No new Apple build or upload occurred; the full release remains open.
- Completed the predeclared 42-photo NASA visual audit: 41 downloads and one
  preserved failure, with all selected observations marked development-only.
  Mixed categories, framing and ambiguous Cb examples prevent treating this as
  ordinary eleven-genus ground truth. Recorded findings without relabeling;
  added hash-preserving resume and full JPEG decode checks. All 84 ML tests
  pass. No GLOBE data entered training and no release model changed.
- Completed the fixed cross-backbone kernel and SVC comparisons. The larger
  pair does not improve the number of correct validation photos; SVC is worse.
  Completed grouped training-only reliability weighting: 290/452 correct and
  .64455 macro-F1, a marginal F1 gain, not a release claim. Preserved all trials
  and froze the assembled candidate before calibration/regression evaluation.
  All 93 ML tests pass; no production model or Apple release changed.
- Command execution repeatedly failed with `Too many open files`, including
  the approval reviewer's initialization. Read-only diagnostics found a low
  inherited soft descriptor limit and a Codex process near it; this suggests
  per-process exhaustion but is not a proven permanent root cause. Execution
  recovered intermittently without restarting the host/Remote or stopping
  other tasks. A failed elevated read was not executed. Later bounded tests,
  patch and model-assembly requests passed approval and finished. The existing
  candidate was reverified and its CPU evaluation finally started. This is
  operational recovery, not a durable system repair. Restart remains unapproved.
- Tried the independent wallpaper deliverable during the execution outage;
  the first built-in ImageGen request failed to connect and created no image.
  No CLI/API fallback was used and no wallpaper was counted as completed.
- The reliability candidate's CPU evaluation finished: 77/123 original-test
  correct versus 68/123 shipped, atlas 19/30, stress 87/243, exposed IMGW
  175/299. No calibration policy meets the unchanged confidence requirement;
  accepted-answer and coverage gates fail. Preserve the candidate as research,
  not a release. The owner acknowledged this outcome and continued integration
  scope. Restart is not currently needed and no restart was performed.
- Integrated both local masks into the shared Apple plugin and selection-first
  photo flow. Numbered targets are anchored on eligible cloud-mask pixels, not
  arbitrary rectangle centers. The displayed square is passed without a second
  hidden center crop; original-photo save and manual fallback remain available.
  Uncalibrated selected-region scores cannot become accepted names. All 220
  JavaScript tests, nine lesson audits, native geometry assertions and the
  combined 86-input native probe pass. The iPhone/iPad simulator target builds.
  Catalyst needs the project's existing isolated source-built SDK workflow,
  not the official iOS-only binary packages. UI/screenshot service is unavailable,
  so real interaction and visual QA are explicitly outstanding. Genus model
  replacement, full copy review, Apple release and wallpapers remain incomplete.
- The final marker-aware iPhone/iPad simulator and ad-hoc Mac Catalyst builds
  both completed. The Mac staging copy matches the current detector, proposer
  and plugin sources; its app is local development only, not a signed store
  archive or a publication. The inference/UI feature still needs real-device
  interaction, visual QA and its unchanged accuracy/calibration release gates.
- Audited the new Montenegro multi-observer labels with pinned source hashes.
  Under a conservative exact-genus screen, only Cu, Ci, one Ac and clear sky
  have support. No photos entered training or a new confirmation benchmark.
  A fixed five-member group-bagged kernel trial fails validation selection:
  290/452 correct, macro-F1 .63730. Preserve this negative result without
  opening holdouts. All 106 ML tests pass. Asked the owner about access to an
  independent expert for a blinded image review; no answer or review is assumed.
- Fixed uncertain clear-leading results so tiny remaining scores do not become
  displayed or saved cloud candidates. Uncertain saved observations no longer
  inherit a misleading clear-sky/family title. Raw scores and model weights
  are unchanged. Keyboard movement now retains a proposed frame's size and
  position instead of jumping to a default center selection. Added a complete
  recognition-journey copy review in `design/copy-v4-recognition-review.md`.
  All 224 JavaScript tests, production web build and nine lesson audits pass.
  Refreshed the native web bundle with `cap copy`, not dependency-changing sync.
  iPhone/iPad simulator build passes using only the existing Package.resolved
  versions; the source lockfile is unchanged. Local ad-hoc Catalyst build also
  passes. No UI interaction or screenshots were available from CUA, no app
  was installed/published, and model/release/full-copy acceptance stays open.
- Completed the fixed segmentation-guided genus-feature trial. It is worse:
  281/452 validation correct, macro-F1 .62329 versus .64455 for the previous
  candidate. Four-batch numerical parity passes, but selection fails; no
  calibration/holdouts/export followed. Preserved recipe and artifact hashes
  in the experiment contract. Five focused tests raise the then-total to 111.
- Added honest unknown answers to all manual observation questions. A lack of
  supported evidence no longer selects the first array entry or saves a made-up
  genus. Existing weights are unchanged. Rewrote atlas/search/comparison and
  learning-navigation copy, with one complete generated review book at
  `design/copy-v4-review.md`, including unchanged choices, lesson cards and quiz
  answers. Detailed lessons, journal and remaining tool screens still need
  copy review; this is not a completed full-app language audit.
- Fixed photo-result navigation for one candidate: open its own atlas card,
  not the default unrelated comparison. Added a real React static-render test
  to cover the selected-ID state contract, alongside destination tests. The
  static render does not verify browser layout or interactive behavior.
- Prepared a blinded, training-only expert-review pilot: 33 IMGW photos from
  33 capture days, neutral IDs, blank CSV, offline index and instructions.
  The original labels/key remain outside the reviewer ZIP. Source licensing,
  image hashes, ZIP integrity, exact contents and blank-response handling are
  verified. Five tests cover reproducibility, leakage, blinding and invalid
  labels; no reviewer has responded and nothing was shared or applied to
  training. See `expert-review-protocol.md` for immutable selection and hashes.
- Final checkpoint regression: 235 JavaScript tests, 116 ML tests, nine lesson
  audits and the production web build pass. The iPhone/iPad simulator and local
  ad-hoc Mac Catalyst builds both succeed; both contain `index-Dx__Azdf.js`.
  Root dependency pins remain unchanged. CUA still fails at service startup,
  so no current visual/native interaction QA, app installation, distribution
  archive, upload or publication occurred. Genus-model/release gates stay open.
- Built-in wallpaper generation recovered and produced one new sailing-motif
  landscape draft. Copied it into `social/2026-09-05-wallpapers/art/`; actual
  size is 1672x941, despite requested native 4K. Asked whether to accept clearly
  disclosed upscaling as in the previous pack; no response or upscaling is
  assumed. No portrait/final exports/new gallery exist. The requested 20 new
  motifs and 40 final files remain incomplete; previous packs are unchanged.
- Clarified all six layers-workshop introductions and the Windy walkthrough.
  The complete copy book retains every weather-layer definition, question,
  answer, explanation and source. Fixed the height diagram's below-terrain
  case: it no longer clamps negative AGL to zero or draws a false above-ground
  bracket. Uses the existing signed pressure-surface context and adds real
  React static-render tests for below/equal/above terrain. Existing approximate
  ISA heights and scientific references are unchanged. All 239 JavaScript tests,
  nine lesson audits and the web build pass; the unchanged ML suite last passed
  all 116 tests. iPhone/iPad simulator and ad-hoc Catalyst builds both contain
  `index-DrDCQsbb.js`. These are local development builds, not store artifacts;
  current visual/native interaction QA and release acceptance remain open.
- Reworked wind, hazards, sounding, saved-observation and METAR/TAF workshop
  copy as complete journeys. Corrected unsupported EL labels in three synthetic
  profiles instead of inventing equilibrium heights. Preserved profile arrays,
  questions and answers; corrected +TSRA to thunderstorm with heavy rain, not
  a severity classification of the thunderstorm. Saved model percentages are
  now closed technical details, with own identifications kept distinct; legacy
  records and backups remain unchanged. The full copy book includes all of
  these screens and their source-driven dictionaries, scenarios and answers.
  Added actual React static-render coverage. All 255 JavaScript tests, nine
  lesson audits and the web build pass. iPhone/iPad simulator and local ad-hoc
  Catalyst builds contain `index-B7o19ddB.js`. Current CUA still fails at startup;
  static rendering/build success is not visual or physical-device acceptance.
  No model replacement, installation, store archive or publication occurred.
- Clarified the field report reader, TAF timeline, wind inputs and fictional
  map exercise. Practice progress now describes recent correct answers rather
  than mastery. The full copy book includes every report, decoded group,
  practice question, choice and explanation. Parsers, formulas and scheduling
  are unchanged. All 260 JavaScript tests, 116 ML tests, nine lesson audits
  and the web build pass. iPhone/iPad simulator and local ad-hoc Catalyst
  builds both contain `index-BvJ5toNW.js`; these are not store releases.
- Recovered browser QA with the already installed Playwright/Chromium in an
  isolated temporary profile, without restarting services or touching user
  tabs. Forty-two route/viewport combinations pass. Current production web
  interactions pass with deployment CSP headers and no JavaScript errors.
  The capture fixture verifies proposed-region selection, keyboard movement,
  full-photo/crop/atlas comparison, aspect-preserving save and restoration.
  Its probabilities and proposals are controlled test data, not an accuracy
  benchmark or native-camera test. Inspected phone and wide screenshots;
  physical-device interaction and recognition/release gates remain open.
- Browser-checked the blinded 33-photo review pilot and fixed a 320px overflow
  in its instruction block. A separate layout-only ZIP preserves original
  photos, order, manifest and blank CSV. All gallery links, offline behavior,
  image decoding and ZIP integrity pass. See `expert-review-protocol.md` for
  the new hash. No independent ratings or changes to training data exist yet.
- Edited all nine full lessons without removing their 52 chapters, examples,
  recall answers, assessments or practices. Explain technical terms at use,
  distinguish official WMO cloud-motion-from direction from this exercise's
  movement-toward input, mark the METAR exercise as synthetic, and distinguish
  observed pilot reports from observed/forecast warnings. The four-observation
  front exercise explicitly needs at least 90 elapsed minutes; lesson duration
  still measures active work. The complete copy book includes the full lessons.
  The term index and cloud monographs remain outside the completed copy audit.
- New real-browser lesson tests reproduced a blank-screen bug when switching
  from the last chapter of a longer lesson to a shorter lesson. Key lesson
  state by route and reject malformed saved positions without rewriting user
  data. All 266 JavaScript tests, nine lesson audits and 156 chapter/viewport
  checks pass, including full text, recall concealment, source drawers, resume,
  completion and correct/incorrect feedback. Inspected phone and wide screenshots.
  Web build and the iOS simulator build-for-testing contain `index-G_NsviLf.js`.
  Native interaction QA is next; no classifier replacement or release occurred.
- Completed five native phone flows on an isolated iPhone 17 Pro Max simulator:
  tools, privacy, real photo picker/local region proposals/classification,
  whole-photo save/relaunch, and long-to-short lesson navigation/resume.
  Public atlas fixtures are functional evidence, not an independent accuracy
  test. Fixed off-screen XCTest hit testing and waited for asynchronous storage.
  Full web lessons also pass all 156 chapter/viewport checks.
- Finished the atlas copy review, retaining ten monographs, thirty attributed
  photographs and all 49 terms in the complete copy book. Corrected Latin
  mother-cloud names and common origin combinations against WMO; clarified
  visual limits, Stratus precipitation, contrails and funnel/vortex distinction.
  An independent meteorological review is still outstanding. All 270 JS tests,
  nine lesson audits and 354 atlas browser checks pass across native-layout
  and web variants; photo recall concealment and source navigation are tested.
- Final native iPad rotation/route test passes with the current web bundle.
  Full-screen captures resolve the earlier application's cropped landscape
  screenshot; inspected portrait/landscape and phone evidence. Current
  production web checks pass with deployment CSP headers. iPhone/iPad simulator,
  Catalyst development and Catalyst build-for-testing all contain
  `index-Da02l6Kr.js`; the full phone suite predates the atlas-only copy changes.
  Evidence and remaining physical-device/Mac interaction gaps are listed in
  `native-and-copy-qa.md`. Removed only our own isolated simulators after export
  to recover disk space. No host/Remote restart or other user task was affected.
- Reverified the calibrated candidate hash and failed release policy: 77/123
  versus 68/123, zero accepted predictions under the unchanged precision rule.
  No weights, calibration thresholds, source dependency pins, public deployment,
  distribution archive or Apple submission changed. The active goal, independent
  expert review and twenty-wallpaper deliverable remain unfinished.
- Prepared a separate sandboxed `cloud.chmurnik.qa.v4` Catalyst app and a
  public-photo import/inference/save/relaunch UI test; build-for-testing passes.
  Execution fails before entering the test because the graphical-session
  `testmanagerd.control` service is unavailable. CUA also fails at startup.
  No user application/data, system service or privacy setting was changed;
  no QA process remained. The prepared test is not a passed runtime check.
  See `native-and-copy-qa.md` for exact evidence and isolation boundaries.
- Added strict returned-review comparison for the predeclared training-only
  33-photo pilot. It verifies frozen provenance and images, rejects duplicated
  or malformed responses, preserves uncertainty/mixed frames and requires
  adjudication rather than majority-vote relabeling. Original labels cannot
  be written into the blinded reviewer folder; no training data is modified.
  Checked the actual blank template: all 33 unreviewed, zero labels applied.
  All 128 ML tests pass; no new accuracy measurement or release occurred.
  No genuine annotations have arrived. More same-data classifier variants are
  not justified by the completed negative experiments; the next training step
  needs new independently reviewed supervision, with unchanged release gates.
- Prepared separate, not-deployed root-hosting and complete GitHub Pages web
  ZIPs, preserving all 255 existing social files byte-for-byte. Both exact
  builds pass 42 production browser route/viewport checks with deployment CSP;
  270 JS tests, nine lesson audits, 61 external links and both ZIP integrity
  checks pass. Hashes, screenshots and deployment boundaries are recorded in
  `native-and-copy-qa.md`; the complete handoff is `design/web-v4-handoff.md`.
  No host, public deployment, Apple submission or classifier state changed.
