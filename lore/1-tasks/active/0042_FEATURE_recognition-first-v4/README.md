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

### September 6 Owner-Authorized Release Split

The owner explicitly directed that classifier research must no longer hold up
the copy, frontend and other verified improvements. Prepare Apple version1.2
as the user-facing V4 release with the existing on-device genus ensemble;
preserve the experimental selected-region limitation and separate cloud-area
proposal model. Do not describe this as improved genus accuracy. Original
classifier-quality and fresh-evidence gates remain open for a later model
replacement and do not block this specifically authorized UI/content release.
Native regression, privacy, preservation and distribution-signing requirements
are unchanged. Keep this overall task open while those research/delivery
requirements remain unfinished. Complete release copy is in
`design/release-v4-ui-20260906.md`.

September 6 delivery: iOS/iPadOS 1.2 build20260906092043 and macOS 1.2
build20260906093223 both processed as VALID and were submitted successfully;
both version states are WAITING_FOR_REVIEW, not approved/live. Updated Pages
7a1d618 passed public regression; the private root ZIP was replaced under the
same owner-only Drive link. After the owner's upload, the root domain was
verified at 11:30 UTC: all 81 public package files match, security headers and
canonical redirects pass, and the complete public browser harness passes. See
`apple-web-release-20260906.md` for archive provenance, the fixed Mac category,
verified SDK signatures, inherited screenshots and the remaining ML/hosting
and wallpaper work. The existing daily monitor now includes both review states.

Later September6 verification at16:37 UTC: Mac1.2 is READY_FOR_SALE /
READY_FOR_DISTRIBUTION, downloadable=true and linked to the submitted build.
The public Polish Mac storefront independently shows Version1.2 and the
approved V4 notes. iOS/iPadOS1.2 remains WAITING_FOR_REVIEW. The older submission
snapshot above is historical; no classifier upgrade or new Apple write occurred.

The isolated native Mac photo/persistence XCTest passed on September6 at11:07
CEST: one passed, zero failures/skips, including actual import, local inference,
whole-photo save, keyboard-edited note and exact persistence after relaunch.
The earlier initialization timeout was traced to an OS Enable UI Automation
authentication request; no system security settings were changed. Evidence and
the remaining release boundaries are in `native-and-copy-qa.md`. This removes
that specific UI-release blocker, not the separate classifier research gates.

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
- [x] Automatic region proposals and tap selection replace compulsory sliders;
  no fabricated detection masks or claims of a labeled segmentation benchmark.
- [x] Results show a short explanation and retain optional technical detail.
- [x] Comparison clearly shows own selected photo and real licensed atlas photo.
- [x] Full learning and layers module are discoverable without completing teasers.
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
6. Preserve contradictory source labels as review exclusions, never silently
   relabel them. Current CCAiM overlaps the old exposed source; byte-distinct
   candidates still require near-duplicate and independent annotation review.
7. Use development-signed, separately sandboxed Mac QA artifacts. Fail before
   launch on an incorrect test-plan identifier; never weaken library validation
   or grant UI-automation permission merely to make the test appear green.

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
as f674f55 with five passing tests. No V4 distribution build or upload has occurred.
On September 5 fresh App Store Connect GETs confirmed READY_FOR_SALE for the
previously submitted iOS and macOS 1.1 releases, with VALID September 3 builds.
That earlier approval does not establish recognition-first V4 acceptance.

## Additional Deliverable Requested September 5

- [ ] Create 20 more distinct wallpaper motifs in the approved CHMURNIK
  felt/cloud/pink/olive/violet style. Each motif has separately composed
  desktop 3840x2160 and phone 2160x3840 PNGs: 20 motifs, 40 files, not
  recolors/crops counted as additional designs. No text or scientific-photo
  claims. Preserve existing packs and expose individual/ZIP downloads through
  the existing SM asset hub. This is supplementary; recognition remains first.

## Worklog

- September6: verified the owner's offline root ZIP upload (81 byte-identical
  public files, complete browser regression and30/30 downloaded atlas photos
  offline). Then reproduced and fixed the daily exercise's answer-name leak
  in its adjacent training button. All280 JS tests, nine lessons and61 links
  pass; both production variants and public Pages pass the full UI harness.
  Pages2ed1e58 is live with all galleries preserved; the same private Drive
  link now carries the exercise ZIP for a separate owner upload. No classifier
  or Apple release changed. See `daily-answer-qa.md`. Goal remains active.

- September 6: completed the frozen local Qwen3-VL4B 4-bit trial on all 452
  validation images. It achieved 138/452 (30.53%, macro-F1 0.311565) versus
  DINO control 290/452 (64.16%, 0.644547), with 91 refusals and 17 paired gains
  versus 169 regressions. Duplicate grouping and independent recalculation
  confirm the loss. Reject this recipe, preserve the current app classifier
  and all release gates; no holdout, prompt search or expert outreach.
  The isolated runtime required MLX0.32.0 instead of a failing0.32.2 smoke test;
  no vendor code or host security setting changed. All246 ML tests passed.
  See `local-vlm-probe.md` and `local-vlm-evaluation.json` for full evidence.
  Independently confirmed Mac1.2 publicly available in Poland; iOS1.2 remains
  WAITING_FOR_REVIEW. This makes the prior goal work progress, not a blocked
  or completed goal; the original model-improvement requirement remains open.

Ongoing details and benchmark contracts belong in this task, not the wiki.

- Reproduced loss of all30 downloaded atlas photos across the actual old-to-new
  root upgrade, while private observations remain intact. Fixed activation to
  retain byte-verified photographs before removing old own-scope caches, and
  restored offline logo/italic assets. Three isolated Chromium/WebKit upgrade
  cases pass, including acceptance while offline;279 app tests, nine lessons
  and the full production browser harness pass. See
  `offline-upgrade-preservation.md` for exact artifacts, retained negative
  results and browser-fixture limitations. No classifier or Apple submission
  changed; this is concrete preservation progress, not goal completion.
  Published13dd8f4 to Pages and verified81 application files, five unchanged
  galleries,18 downloadable ZIPs and the complete live browser harness. The
  private Cyber_Folks ZIP was updated under the same owner-only link and
  awaits owner upload; the root domain is not claimed to contain this patch.

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
- Published the independently tested web changes through the existing Pages
  workflow at `40c2e71` (run 33944547635, successful). All 42 public browser
  checks pass, including a repeat that waits for visible illustrations before
  screenshots. Seventeen live files match the candidate byte-for-byte;
  five existing social archives pass availability/length checks. The isolated
  old-to-new profile retains progress, lesson position, note, favorite and
  exact photo bytes, including offline use; the old cache is removed. The
  transition was profile reopen, not a proven in-page refresh-button test.
  Privately delivered the 22,777,757-byte root-hosting ZIP to the owner's Google
  Drive and verified owner-only permissions. `chmurnik.cloud` still serves the
  older `index-BpdEVwM6.js`; its hosting deployment belongs to the owner.
  Confirmed previous iOS/macOS 1.1 READY_FOR_SALE via read-only Apple API calls.
  No new classifier weights, native distribution build or Apple submission
  occurred. Evidence and precise release boundaries are in `native-and-copy-qa.md`.
- Completed manual Mac runtime verification in the isolated QA app: native
  public-photo import, three local proposals, selected-region inference,
  whole-photo save and persistence after quit/relaunch. Unconfirmed status
  and automatic crop notes survived; an extra manually typed note was not
  verified. Full learning and layers entry points are reachable. This is not
  a passed XCTest or an independent genus benchmark. The production app and
  all unrelated tasks remained untouched. Recording the evidence was delayed
  by disk exhaustion and approval-initialization failures; after the owner
  freed space, the host reported 13 GiB available and commands worked again.
  Exact boundaries and first-launch limitations are in `native-and-copy-qa.md`.
- Completed a pinned current-CCAiM metadata audit: 917 JPEG records, 916 labels,
  834 unique LFS hashes, 83 duplicate pairs including 28 conflicting-label pairs.
  Verified all 251 old source rows against frozen pixel fingerprints and raw
  hashes; all match current inventory. A deterministic exclusion screen leaves
  560 metadata-only review candidates, with only two St and three Ns. No new
  photos, labels, training or classifier replacement occurred. Provenance,
  class counts and hashes are in `data-expansion-audit.md`; expert feedback on
  the existing 33-photo blinded pilot remains outstanding.
- Fixed QA signing and stale-plan isolation, then manually verified the exact
  development-signed Mac app through import/proposals/inference/save/relaunch,
  including an additional edited note. Initially automated XCTest reached an
  OS authentication requirement for Enable UI Automation and timed out before
  its test body. The owner subsequently confirmed availability and subsequent
  runs passed that gate, reaching import, proposals, inference and save.
  Corrected Mac picker identifiers, window geometry, mouse/wheel events and
  label/value queries. The latest automatic attempt still fails in native
  keyboard-event synthesis; no passed XCTest is claimed. A separate direct
  CUA check of that exact build verifies the same saved record, full photo,
  model metadata and complete additional Polish note after quit/relaunch.
  Slow first launch remains a recorded limitation, not a claimed system fix.
  Production user data, host/Remote services and Apple releases are untouched.
- Resumed from the physical Kingston worktree after the migration owner released
  the project hold. Downloaded and hash-verified a fixed53-photo development
  CCAiM sample; preserved an earlier CDN-redirect failure without replacing any
  selected photo. Added a crop-aware photograph-reuse audit and checked14,469
  pairs against the sample and247 unique older CCAiM photos. Three visually
  confirmed reuse pairs include one contradictory Ac/Sc source-label pair.
  No automatic relabelling, training admission or new accuracy claim follows.
  All155 ML/tooling tests pass. Photo evidence stays local; the full audit and
  unresolved provenance/annotation requirements are in `data-expansion-audit.md`.
- Completed a predeclared paired partial-label trial with362 independently
  crowd-labelled GLOBE photos, after bounded downloads, full-frame technical
  review and conservative overlap screening. Preserved unresolved source
  category unions instead of inventing exact genera. Fixed an independent
  review's feature-cache identity finding before fitting; replay of120 feature
  vectors from72 original photos is exact. The additional-data arm worsens
  validation288->278/452 and macro-F1 .631637->.619802, so it is rejected without
  opening calibration/test splits, retuning, exporting or replacing production
  weights. All177 ML/tooling tests pass, zero skips. The recipe, limitations,
  class/source breakdown and artifact hashes are in `globe-partial-supervision.md`.
  Apple1.2 remains a separately delivered UX/content release, not an ML upgrade.
- Verified the Vienna source's CC-BY-4.0 license and actual training files:
  13,912 joint four-view observations,100x64 pixels per view, with no retained
  timestamp/observation-coordinate datasets. Added strict30-column decoding
  that preserves unobserved layers as unknown, and a complete exact-image
  reuse scan (88 repeated individual views, no repeated four-view sets).
  Nine focused tests and the full186-test ML/tooling suite pass, zero skips.
  No individual-photo genus labels, chronological
  groups, fresh test evidence or model improvement are inferred. No training
  admission occurred; limits and hashes are in `data-expansion-audit.md`.
- Completed a predeclared Vienna multi-instance trial with 155 technically
  reviewed four-view bags / 620 photos from the verified training source.
  Joint positive SYNOP constraints remain weak supervision; no individual
  genus labels or temporal independence were invented. Fixed two independent
  pre-fit review findings by enforcing selection agreement and recomputing
  overlaps from verified pixels against the current manifest. All 207 tests
  pass, zero skips; original 72-photo feature replay remains exact. The paired
  auxiliary arm worsens validation 288->280/452 and macro-F1 .631637->.621106,
  with declines in all three sources and 26 gains versus 34 regressions. This
  fixed pilot is rejected without opening calibration/test data, retuning,
  exporting or replacing the app model. The protocol, code, source/class
  breakdown and artifact hashes are in `vienna-bag-trial.md`. No new host
  permissions, system changes or owner presence were needed; the goal remains
  active, with the UI/content release separate from ML qualification.
- After the owner replaced Cyber_Folks files, verified all 81 public root
  package files byte-for-byte, matching security headers, canonical redirects
  and protected .htaccess. The full public browser harness passes, including
  photo collection/backup, lessons, atlas, METAR/TAF, wind, maps and 42
  route/viewport visits; inspected three actual live screenshots. Existing
  Pages asset-hub/Astra entry files remain unchanged. The root deployment is
  now confirmed; no additional upload is needed for this package. This does
  not validate an old-to-new root service-worker transition or improve the
  failed classifier gate. See `apple-web-release-20260906.md` for evidence.
- Reproduced and fixed a keyboard escape in the shared dialog focus handler:
  initial Shift+Tab and recovery after lost focus no longer enter the page
  behind onboarding/photo recognition. All 56 final Chromium/WebKit checks
  pass, including nested source dialogs and focus/scroll restoration. All 273
  app tests, nine lesson audits, the repeated photo fixture flow and the
  separate production browser harness pass. This is an unpublished source
  patch for the next release, not part of Apple 1.2 or the owner's newly
  updated root deployment. Model weights and quality gates remain unchanged.
  See `dialog-focus-qa.md` for the negative reproduction and exact QA scope.
- Completed a frozen ten-photo NOAA NESDIS source diagnostic, after checking
  credits and43,415 photo-reuse comparisons against4,358 manifest rows. No
  overlap was flagged; this is not proof of independent capture groups or
  expert ground truth. The actual packaged native baseline agrees with4/10
  source labels; the existing calibrated candidate agrees with8/10, four
  gains and zero regressions. Both accept zero answers under unchanged
  policies. All inputs/results and the complete table are retained, without
  fitting, re-labelling, recalibration, model replacement or new publication.
  See `noaa-diagnostic.md` for the source audit, numeric cross-check, two
  remaining low-cloud errors and access restrictions of other checked sources.
- Audited all23 full-size NWS Key West low-cloud examples and100,004 reuse
  pairs against the frozen manifest. No reuse flags, but image-level Jim W.
  Lee copyright notices prevent assuming unrestricted training permission;
  preserve mixed/alternative source categories and do not admit or publish
  the collection. No model predictions or training used these photographs.
- Fixed an ATEN/Core ML kernel conversion failure caused by an integer clamp
  bound; the focused test fails before and passes after the equivalent0.0
  correction. Added export/checkpoint binding and complete probability
  receipts to both verifiers. All217 ML/tooling tests pass. On all452 validation
  inputs, FLOAT16 fails numeric parity (maximum error.12690,23 non-tie changes),
  while FLOAT32 passes (maximum.00003469,zero changes), with a101.3MB research
  package. Original-photo native processing still fails with three non-tie
  changes; a seven-photo diagnostic separates small decoding/resampling
  differences from conversion. No production weights/helper, fit, gate,
  application release or Apple submission changed. See
  `coreml-reliability-parity.md`; classifier reliability remains unfinished.
- The owner explicitly deferred involving the meteorologist again on
  September6. Continue independent technical work; do not contact the reviewer
  or substitute model/self-assessments for independent human annotations.
- Isolated a Pillow-compatible native bilinear reference without changing any
  production source or model. All 327 raw RGB and 96 complete lossless/EXIF
  fixtures match exactly; nine invalid inputs are rejected. On the same 452
  original validation photographs, non-tie Torch/native disagreements fall
  from three to zero under the unchanged .05 margin. Seven near-tie switches
  and maximum probability error .070827 remain; this passes the existing
  native decision gate, not strict whole-pipeline numeric equality or cloud
  reliability. All 217 existing ML/tooling tests pass. The owner-deferred
  expert review, failed classifier coverage gate and physical format/device
  limits remain open. See `native-resampling-probe.md` for full receipts and
  the separately verified Apple-status readback. At 13:29 UTC both 1.2
  platforms remain WAITING_FOR_REVIEW with VALID builds; no new submission.
- Extended input checks through 12MP originals: all 48 direct/reference cases
  match at the 4096px cap, but a fresh-process comparison measured about 246MB
  versus 64MB at 1800px, before ML. Keep the production memory cap. Actual
  UIKit JPEG .86 import fails candidate parity on four non-tie validation
  cases; the earlier unencoded reference pass is not whole-app input parity.
  See `large-image-input-probe.md` for independent checks and preserved reports.
- Completed one predeclared imported-training trial on 2325 training and
  452 validation photos, with frozen labels, groups, quality weights and
  hyperparameters. Exact Mac-import receipt checks passed for all photos;
  452 validation encodings match the previous native runner byte-for-byte.
  The head improves imported-input Torch top-1 from 286 to 289/452, but raw
  macro-F1 regresses from .644547 to .642533. Admission fails; no calibration,
  holdout evaluation or model replacement follows. All 225 ML/tooling tests
  pass, along with 327 RGB, 96 smaller PNG/EXIF and nine invalid-input cases.
  Research scripts and receipts preserve both negative findings. No shipped
  code, app weights, Apple submission, domain or privacy settings changed.
  See `mac-import-training-probe.md`. This goal remains active; the current
  classifier's reliability and fresh-evidence requirements are not satisfied.
- Audited the published Genera cloud-specialist archive and tested a fixed
  numeric-only reconstruction without Keras loading or downloaded-code execution.
  Bounded archive/HDF5 checks pass; the remote suspicious scanner finding is
  retained, not declared resolved. Three independent float64 NumPy graph replays
  agree with PyTorch within .0000002494 probability error. On the same452
  validation rows, source-label agreement falls290->267 and macro-F1
  .644547->.572943; CCSN gains do not offset IMGW and clear-sky regressions.
  All26 contrail outputs remain unsupported, not renormalized away. Ten focused
  and all235 ML/tooling tests pass. Reject this fixed direct-replacement trial;
  no training, calibration, holdout access, model release or expert outreach.
  The unknown source-training overlap prevents an independent accuracy claim.
  See `genera-source-probe.md` for the protocol, complete source breakdown,
  numeric replay limits and retained artifact hashes. This goal remains active.
- Completed the predeclared small-context/mirror study of the current kernel
  candidate on452 validation photos. Center control reproduces with no top-1
  differences. The fixed six-view mean regresses290->285 correct and
  macro-F1 .644547->.633034; reject without retuning or holdout access.
  All-six-stable predictions include96 wrong answers out of336; consistency
  is not a correctness certificate. Independent receipt/metric replay verifies
  all452 source files,2712 input tensors and both raw/grouped source results.
  Five focused and all240 ML/tooling tests pass. No production classifier,
  application release, privacy setting or expert-outreach change occurred.
  See `context-stability-probe.md` for the fixed protocol, complete results,
  timing and immutable hashes. Goal remains active; reliability gates are open.
- Completed a fixed, training-only density-support trust-score probe without
  changing the DINO candidate's genus predictions. On 420 unique cloud
  validation photos, correctness AUC regresses .711886 -> .603240 and the
  highest-ranked 42 cases fall 39 -> 32 correct. Independent SciPy tree replay
  matches every score within 2.11e-15. Reject without tuning or holdout access;
  see `trust-score-probe.md` and the retained aggregate report.
- Audited the historical confidence-grid cap with exact boundary enumeration
  on existing calibration predictions only. Of 54747 supported threshold pairs,
  none reaches 90%; maximum is 35/41 = 85.37%. This closes the grid-limitation
  explanation for the current failed candidate, without relaxing requirements
  or changing production code. See `policy-grid-audit.md`. The overall goal
  remains active; no app weights, Apple release, web package, privacy setting
  or owner-deferred expert review changed in these two investigations.
- Completed the fixed paired generalized-cross-entropy training trial. The
  ordinary CE control reproduces its retained logits exactly; GCE q=0.7 drops
  validation288->280/452 and macro-F1 .631637->.623513, below the best RBF290
  and.644547. Independent NumPy/SciPy replay verifies both heads with zero
  prediction changes and recomputes all54 population reports. All267 ML/tooling
  tests pass, zero skips. Reject the fixed recipe without a q/seed sweep,
  holdout access, model export or replacement; `robust-loss-probe.md` retains
  protocol, full negative results and hashes. Read-only Apple checks at17:56UTC
  still show Mac1.2 READY_FOR_SALE and iOS1.2 WAITING_FOR_REVIEW, both VALID.
  This goal turn makes research progress; model reliability/fresh-evidence
  requirements remain open and no expert contact or host changes occurred.
