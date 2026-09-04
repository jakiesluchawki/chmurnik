# V4 Experiment Contract

## Frozen Data

Manifest SHA-256:
`52c20ce358b8d2b7365003f64d7e9d00dc26ae480a4c4a83a2b706e7f1ba8f07`.
The local manifest includes absolute paths and stays outside Git. It contains
pixel hashes, perceptual hashes, source identifiers, duplicate groups and roles.

- Train: 1,751 images; validation: 308.
- Calibration: 124; test: 134 before group-level scoring.
- Diagnostic atlas: 30 photographs; project outliers: 9.
- Old CCAiM stress snapshot: 251 photographs before group deduplication.
- Contrail challenge: 189. Contrails can coexist with real clouds; this is a
  rejection stress test, not proof that every scene has no valid cloud genus.
- Excluded from training/evaluation pool: 247 conflicting-label images and
  17 training-source images overlapping external diagnostics.

The 247 conflicts belong to 120 groups. Visual inspection confirmed repeated
images with differing source labels (for example Ci-N059/Cs-N136 and
Ci-N003/As-N028). Near-uniform skies can also collide under dHash, so the entire
247-image count must not be described as 247 proven annotation errors. Exclude
these ambiguous groups conservatively, without inventing corrected labels.

All known train/validation/calibration/test roles are group-disjoint. The legacy
models may have seen near duplicates through their earlier, weaker grouping;
their baseline is the actual bundled runtime, not a retrained substitute.
The atlas was used during historical development, so it is diagnostic, not a
new untouched benchmark. The old curated 40-photo Commons set is unavailable;
the new run must not claim to reproduce it or compare unrelated sample sets.

## Selection and Acceptance

Select epochs/architectures on validation macro-F1 only. Holdouts are opened
explicitly after selecting a candidate, not at every epoch. Report each exposure.
Calibrate temperature and the acceptance policy on calibration only; initial
selective-precision target is 0.90, not a claim of 90% overall accuracy.

Before opening candidate holdouts, require:

1. Test top-1 improvement of at least 0.05 and macro-F1 improvement of at least
   0.03 against identical, duplicate-aware baseline rows. Report paired
   bootstrap intervals and counts, not only percentages.
2. Atlas top-1 may not fall by more than one image; stress top-1 may not fall
   by more than 0.02. Retain and report all classes, including weaknesses.
3. Accepted test predictions must reach at least 0.85 observed precision,
   with at least 20 accepted examples and coverage no more than 0.03 below
   baseline. Report confidence intervals; a point estimate is not a guarantee.
4. Review rejection of non-cloud and contrail challenges separately. Private
   dark-sky feedback is unlabeled and cannot count as a correct prediction.
   Low-quality-input safeguards are reported separately from model accuracy.
5. Core ML parity: maximum absolute probability error <= 0.01 over a
   representative validation sample, and matching top prediction except for
   explicitly recorded numerical ties. Verify actual native preprocessing too.
6. Measure file size, latency and memory before Apple integration. Preserve
   on-device inference and original photographs. No private upload/training.

These are release gates, not guarantees the first candidate will pass. A failed
candidate stays unpublished. Do not move thresholds to conceal a regression;
record failed runs and obtain fresh evidence if holdouts guide later changes.

## Baseline Reproduction

Actual bundled Core ML packages, 40/60 ensemble, native 90.2% crop reproduced
with PIL. Raw-row preliminary results: test 81/134 top-1 (60.45%), atlas 17/30
(56.67%), old stress 62/251 (24.70%). These are not yet native renderer parity
measurements or the final group-aware comparison. Package hashes and complete
predictions are retained locally in `.local/v4/baseline-v3.json`.

## Execution

The first 16-image batch run failed while writing its initial checkpoint because
the local disk was nearly full. Only this task's temporary speech-model cache
and temporary transcription environment were removed. A four-image batch with
four-step gradient accumulation retains an effective batch of 16.

The next run saved an epoch but was interrupted by the owner's computer restart.
The restart was confirmed in chat. `convnext-tiny-256-b4-run3` is the active
repeat, initialized from the same public ImageNet weights and fixed seed.
The runner now supports atomic epoch recovery including optimizer, scheduler,
sampler and random states for subsequent runs; the already-loaded process uses
the earlier best-weights-only runner and must not be called fully resumable.

## Second Candidate, Declared Before Holdout Evaluation

Compare frozen DINOv2 ViT-S/14 representations (class token plus mean patch
token, 224 px) against the fine-tuned ConvNeXt. Fit the scaler and balanced
logistic head on training images only, using center and horizontal-flip views.
Select C from 0.01, 0.1, 1, 10 on the same validation macro-F1. Cache feature
extraction in atomic batches so a restart need not repeat completed images.

Official source: <https://github.com/facebookresearch/dinov2>, pinned at
`7764ea0f912e53c92e82eb78a2a1631e92725fc8`. The official model card documents the
frozen-feature use case and Apache-2.0 weights; preserve attribution/license if
this candidate is shipped. This is an optional local research dependency, not
a new cloud inference service. No user photographs leave the device.

CPU extraction uses two threads while the ConvNeXt experiment uses MPS. Do not
infer superiority from the model family; select using validation evidence and
then apply the unchanged holdout gates.

The first frozen-feature run finished: validation 59.74% top-1, macro-F1 0.5915
at C=0.01. It has not seen calibration/test/atlas/stress data. A 336 px variant
is also declared before holdout evaluation, keeping the same feature model and
C grid to test whether finer visible texture helps. Compare both resolutions
with the completed ConvNeXt validation result before opening candidate holdouts.

A fixed nonlinear head (128 GELU units, dropout 0.2, train-only normalization,
AdamW, validation early stopping) is evaluated on the same cached features.
The 224 px head reached validation macro-F1 0.6205 at epoch 17; evaluate the
same head at 336 px without changing its hyperparameters. Candidate holdouts
still have not been opened.

## Baseline Loophole Closed Before Candidate Holdouts

The baseline test contains 92 cloud photographs and 42 clear-sky photographs.
Cloud-only top-1 is 39/92 (42.39%). Only seven cloud photographs are accepted,
and only three of those are correct. The much higher overall selective
precision is dominated by easy clear-sky cases and does not establish useful
cloud identification. Keep both counts and the small-sample uncertainty visible.

Tighten, do not relax, the gates: cloud-only top-1 must improve by 0.05, and
at least 20 cloud photographs must be accepted at observed precision >=0.85.
Fit temperature with equal class weight and select the confidence policy using
cloud photographs only. Clear sky remains an output and is still evaluated,
but cannot determine the cloud acceptance threshold. These changes are based on
the shipped baseline, before examining any candidate holdout predictions.

## Validation Trials and Native Test Harness

The fixed MLP at 336 px completed at epoch 6: validation top-1 63.31%, macro-F1
0.62028. The 224 px variant remains slightly ahead at 63.64% and 0.62053.
ConvNeXt has reached epoch 18, with its best validation macro-F1 0.59880 at
epoch 12; let the declared early-stopping rule finish before selection.
No candidate calibration/test/atlas/stress evaluation has been opened yet.

Native geometry tests now pass for landscape/portrait inputs, ties-to-even
rounding, channel order, EXIF orientation, and output dimensions. A separate
original-photo ImageIO/CoreGraphics/Vision harness is compiled, but no V4 Core
ML conversion or actual probability parity has been run. The raw-pixel gate
remains <=0.01 absolute error. Native renderer checks additionally require no
non-tie top-1 change (0.05 tie margin) and no changed acceptance decision.

Disk space fell below 600 MiB during training. Removed only the corrupt weights
from `convnext-tiny-256` and interrupted `convnext-tiny-256-b4`, preserving their
contracts/logs and every completed candidate. No user files or release artifacts
were removed. Avoid concurrent heavyweight conversion until training finishes.

## Candidate Selection, 2026-09-04 22:17 CEST

ConvNeXt finished at epoch 20 under the declared early-stop rule. Its best
macro-F1 was 0.59880 at epoch 12. Select DINOv2-S/14 with the 128-unit MLP,
224 px, epoch 17, validation macro-F1 0.62053. The 336 px MLP scored 0.62028;
both linear-head variants scored lower. Selection used validation only.

Selected checkpoint SHA-256:
`3abb9dd7a7b0ef51123385498b5d983d3b70c0b73fbc1f8e3e32432439a48cfb`.
The first explicit candidate calibration/test/diagnostic/stress exposure is now
authorized by this recorded selection. Preserve the output regardless of whether
the gates pass; no candidate is approved for integration at this point.

## First Holdout Exposure: Failed, Unpublished

The selected frozen-backbone MLP did not pass. Group-aware test top-1 is
75/123 (60.98%), only +4.07 percentage points versus the identical baseline
rows; the paired 95% bootstrap interval is -5.69 to +13.82 points. Atlas
accuracy fell from 17/30 to 15/30 and stress accuracy fell by 5.35 points.
Cloud-only accepted precision and accepted count also failed. The full report
and calibrated checkpoint remain in `.local/v4/dinov2-small-mlp-calibrated`.
Do not call this a successful recognition upgrade or ship its weights.

The raw 134-row counts earlier in this document are not interchangeable with
the duplicate-aware 123-group test. Report like-for-like counts throughout.

## Next Experiment: Visual Fine-Tuning

Declare two bounded variants before training: fine-tune the last two or four
DINO blocks plus final normalization and the existing 224 px MLP. Initialize
from the selected, uncalibrated checkpoint above. Visual/head learning rates
are 0.00002/0.0001; AdamW decay 0.02; the existing training-only augmentations,
square-root class weighting and smoothing 0.05 are retained. Seed 7042,
20 epochs maximum, minimum 10, patience 6, validation macro-F1 selects epochs
and the variant. No test prediction is used for gradients or epoch selection.

The first test exposure is now known. Later repeats on this same test are
regression evidence, not a fresh independent confirmation. Preserve all
reports and seek a separately sourced, duplicate-screened confirmatory set
before making a stronger generalization claim. Existing gates are unchanged.
Training recovery stores trainable parameters and optimizer/RNG state; frozen
parameters come from the hash-checked initialization, reducing disk use.

## Independent IMGW Source, Before Any Predictions

Official public source (CC BY 4.0):
<https://danepubliczne.imgw.pl/en/repository/Artificial-neural-networks-in-automatic-image-classifications-of-cloud-from-ground-based-observations-using-deep-learning-models>.
Kopec, Duniec, Bochenek and Figurski, DOI `10.1002/qj.4865`. The released ZIP
contains 1,298 examples in 11 classes, not all 200,000 images from the study.
Its byte length is 2,163,944,712; ETag `"80fb2d08-622c81f0dad50"`;
publisher MD5 `55372b6a0edc7ac1eb5798ff293324d6`. HTTP Range requests preserve
that snapshot, ZIP CRC verifies each member, and original/artifact SHA256 plus
original decoded-pixel and dHash fingerprints are retained. The complete ZIP
is not stored; its publisher MD5 has therefore not been independently checked.

Freeze before model predictions: remove overlap with every original V4 role,
exclude ambiguous cross-label near-duplicates, then assign 25% to a new
confirmatory set, 10% calibration, 15% validation and 50% training using fixed
SHA256 seed7042 buckets. Capture dates parsed from filenames stay within one
role, including transitive duplicate links. Require >=15 test cases per class.
Preserve original V4 roles; its opened test remains regression evidence. No
user/private photos enter these sets. Stored copies are oriented RGB, maximum
640 px, JPEG quality92/no subsampling; report this transformation explicitly.

The initial hash-bucket allocation failed the predeclared support check: only
seven Nimbostratus examples reached the confirmatory set. No manifest was
written and no IMGW model predictions were made. Replace that allocation with
the first fold of StratifiedGroupKFold, shuffle seed7042: four folds for the
confirmatory set; five folds for calibration from the remainder, then five
for validation from what remains (approximately 25/15/12/48 percent). Keep
the >=15 examples/class requirement and day/duplicate isolation unchanged.

The two-block fine-tuning run completed at epoch18, selected epoch12 with
validation macro-F1 0.63312, top-1 64.94%. The four-block trial is running.
Only the completed two-block optimizer-recovery file was removed to recover
41 MiB; selected weights, full history and contract remain. Disk constraints
must not justify deleting user assets or weakening release checks.

Visual-region prototype QA on ten already-used atlas photos failed product
acceptance: generic DINO clustering also proposes ground and fragments broad
cloud layers. Keep it outside the Xcode target. It needs sky-specific filtering
and region-quality evidence, not merely passing synthetic geometry tests.

## IMGW V2 Development Plan, Before Predictions

Frozen V2 manifest SHA256:
`d5b0ca33e0867bbb0d0fd25dbd08fc20cfeea316a89299e53f63a6bee5d0ea1c`.
IMGW adds 574 training, 144 validation and 179 calibration photos. Reserve
299 confirmatory photos (21-30 per class); exclude 102 overlapping images.
Original roles are unchanged and checked as an exact parent-manifest prefix.

Declare bounded candidates before using the new development data: the existing
four-C linear probe, the fixed 128-unit MLP, then two-/four-block fine-tuning
initialized from that V2 MLP using the unchanged settings above. Select the
candidate and epoch by V2 validation macro-F1 only. Frozen DINO development
features may be reused only with matching parent digest, image order, size,
view count and backbone revision. Never extract confirmatory features in training.
The new test must improve top-1 by >=5 percentage points and macro-F1 by >=.03
against the shipped ensemble, with >=.85 accepted cloud precision on >=20
accepted clouds; report paired intervals and group-aware metrics. Old regression
gates remain unchanged. Record the selected checkpoint hash before opening it.

The four-block V1 run stopped on disk exhaustion during an atomic recovery save.
It resumed from the previous complete epoch after lossless deduplication of
frozen 224/336 probe weights. Archives retain original hashes, metadata and
changed tensors, reference a hash-checked shared backbone, and verify exact
tensor reconstruction before removing duplicate originals. Selected V1 MLP is
the retained shared source. Atomic-save failures now remove partial temporary
files and keep the previous checkpoint; no user/release files are deleted.

Read-only Apple Sales and Trends check at 2026-09-04 20:39 UTC: 75 first-time
units through September 3, including 70 PL; August monthly report confirms one
unit, September 2 has 34 and September 3 has 40. September 1 reports no sales;
September 4 is explicitly not available yet. Three redownloads and nine updates
are excluded. This does not measure active users.

## Exact Native Baseline and Latest Development Results

The compiled UIKit/Mac Catalyst harness now reproduces the shipped
UIImage/UIGraphicsImageRenderer/Vision path on 737 original photos. Its report
is `.local/v4/baseline-v3-native.json`. Forty-five top-1 predictions differ from
the earlier PIL geometry approximation; retain the old report but use the
native result for all subsequent comparisons. Group-aware test top-1 is
68/123 (55.28%), macro-F1 .44379; cloud-only top-1 is 37/92 (40.22%).
Only nine clouds are accepted, five correctly. Atlas is 19/30; stress is
57/243. This corrects the baseline, not the predeclared improvement gates.

V1 four-block fine-tuning completed 20 epochs, selected epoch15, validation
macro-F1 .62714. Its interrupted/resumed MPS trajectory is not claimed to be
bit-identical to an uninterrupted run. Selected tensors are losslessly archived.

V2 linear probe selected C=.01, validation macro-F1 .60527. V2 MLP completed
30 epochs, selected epoch5, macro-F1 .63164, top-1 63.72%. Its checkpoint SHA256
is `d34d1f2d871ebaaed612c6132ee10575016e939f5072a289ff837520fc1cea87`.
The declared V2 two-/four-block trials must finish before candidate selection.
No V2 calibration/test/confirmatory predictions have been opened.

The older Rosenberger/SYNOP dataset is not silently added: its labels describe
four simultaneous camera directions and ambiguously map SYNOP codes to genera.
It is already documented in the original training pipeline. These weak labels
are not independent, single-photo truth for the new recognition benchmark.

## Sky Mask Feasibility, Not Cloud Identification

Pinned MIT sky-segmentation source:
<https://github.com/xiongzhu666/Sky-Segmentation-and-Post-processing>, revision
`1f7811b32b64ddc957269defff84bc87a3f0b74f`. This released small U2Net separates
sky from foreground, not cloud instances or genera. Source weights are verified
by hash; preserve the author's MIT notice if integrated.

NCNN-to-PyTorch parity passed on ten previously seen atlas images. Core ML
FP16 narrowly failed the fixed .01 probability-error gate on one of 30 images
(maximum .010282). FP32 passed all 30 with maximum error approximately .000005
and identical binary masks; warm inference is about .034-.057 seconds on this
host, not measured on a user's iPhone. Results and both exports are retained.

Visual region prototypes remain outside the app target. Adding sky masks
removes much ground but DINO clustering still fragments layers; the alternative
color/connected-component heuristic misses some cloud layers. Neither is an
accepted automatic cloud selector. No fabricated localization score is reported.

Ported the reviewed Mac SDK-signature build helper and its five passing tests
from the existing dirty release worktree without changing that worktree. No
distribution build, upload, App Store approval or model replacement occurred.

## Conversion and Disk Recovery

The declared V2 two-block trial completed at epoch11, best epoch5, validation
macro-F1 .61597. Its best weights are losslessly archived; only its completed
optimizer recovery was discarded. The four-block trial was interrupted at
epoch4 by disk exhaustion while another conversion was running. Recovery from
the complete epoch3 is retained; do not claim uninterrupted bitwise replay.

DINO conversion first failed on bicubic positional interpolation, then on the
TorchScript frontend's scalar cast. Fixed-resolution positions are now
precomputed with a three-input eager equality check; the supported `torch.export`
ATEN path converts successfully. The FP16 research export failed the unchanged
.01 probability-error gate (max .02145 across 33 validation photos), with no
non-tie top-1 mismatch. Its report remains; the reproducible 42 MiB package was
removed after recording SHA256: weights
`aa87d85ff5911b2f87d894d9630bbc8010a49d053451802a5d0500ac93442e78`,
model specification
`1923a17cf044ae249055060075cd1035b12c630c8b558770300c976863231782`.
This is the previously failed V1 classifier used only to test deployability,
not another classification candidate or exposure of the new confirmation set.

FP32 conversion was also interrupted by insufficient disk space. Removed its
three identified orphaned Core ML temporary directories, old CHMURNIK compiler
module/index/intermediate caches, and no source, archive, dSYM, built application,
test result, photograph, or social asset. Checked no compiler was running first.
About 1.1 GiB became available. Export now skips eager model compilation; execute
remaining heavyweight training/conversion stages sequentially.

Current regression checks: 206 JavaScript tests pass; all nine learning modules
pass the existing content-quality audit; 31 focused Python tests pass.

## Private Video Feedback Review

A local Whisper-base/int8 transcript of all three supplied videos is retained
only under ignored `.local/v4/feedback-transcript.json`. It is automatic and
not reliable as a verbatim quotation. No private audio, video or transcript was
uploaded or added to training/Git. The consistent product points are:

- Too much information precedes the useful answer.
- Compare means retaining the owner's original photo beside atlas examples;
  unexplained crops and replacement imagery break that expectation.
- Improve the complete input/analysis pipeline and test realistic scenarios,
  rather than assuming a larger/fine-tuned classifier solves the whole problem.
- Analyze candidate regions automatically, show progress, then let the user
  understand and select different parts of a potentially mixed sky.

These support the existing task requirements. Do not treat an automatically
transcribed suggestion as permission to weaken the held-out model checks.

## V2 Selection Locked Before Confirmation

All declared V2 trials are complete. Validation macro-F1 selects the frozen
MLP at epoch5 (.6316373631) over the linear probe (.6052704), two-block
fine-tuning (.6159683276) and four-block fine-tuning (.6305121777 at epoch19,
20 epochs completed). There is no selection based on calibration, test,
diagnostic, stress or confirmatory predictions.

Selected uncalibrated checkpoint SHA256:
`d34d1f2d871ebaaed612c6132ee10575016e939f5072a289ff837520fc1cea87`.
Manifest SHA256 remains
`d5b0ca33e0867bbb0d0fd25dbd08fc20cfeea316a89299e53f63a6bee5d0ea1c`.
The unselected four-block checkpoint
`395316179518630a7fc3cd61e55285842e6d7df4b07ea9ae1fc554c6eda61419`
is losslessly archived against the hash-checked V2 MLP; its completed optimizer
recovery was removed. Now unlock calibration and the declared paired native
baseline/regression/299-photo confirmation evaluation. No gate has changed.

## V2 Held-Out Result: Do Not Ship

The frozen MLP was evaluated once against the exact native baseline, preserving
`.local/v4/dinov2-imgw-mlp-calibrated/evaluation.json`. Group-aware old test:
75/123 (60.98%) vs 68/123 (55.28%), paired difference +5.69pp, 95% bootstrap
interval -2.44 to +13.82pp. Stress: 77/243 (31.69%) vs 57/243 (23.46%).
Atlas: 16/30 vs 19/30, exceeding the allowed one-image regression.

Fresh IMGW confirmation: 167/299 (55.85%) vs 89/299 (29.77%), macro-F1 .55979
vs .27959. Paired improvement +26.09pp, capture-day-cluster bootstrap 95%
interval +14.94 to +37.02pp. This is real evidence of improvement on that
population, not proof of adequate field performance or release readiness.

Calibration failed its .90 precision target. The inherited legacy selector
returned a permissive best-effort policy despite target_met=false; the release
gates correctly rejected the candidate. Preserve that original failed report.
V4 calibration now fails closed when no supported threshold meets the target,
with a regression test for confident-but-wrong outputs as well as flat outputs.
This policy correction changes no classification accuracy and cannot turn the
failed candidate into a passing one. No production model was replaced.

The 299-image confirmation set is now exposed. Further development may use it
only as regression evidence, never silently reclassify it as a fresh test or
move its images into training. A future stronger generalization claim requires
another independently reserved, duplicate-screened confirmation set.

Normal V4 Core ML export now requires a passing paired evaluation, bound to
the exact calibrated checkpoint and frozen manifest, and successful calibration.
It recomputes classification gates instead of trusting a saved `passed` flag.
Failed or incomplete candidates require explicit `--research-only`, recorded
in package version/metadata; conversion alone never authorizes release.
All 34 focused Python tests pass. Earlier failed research exports/reports are
preserved, not backfilled with a fabricated approval or a revised outcome.

## Bounded Input-Geometry Diagnostic

Before predictions, fix three input policies on V2 validation only: the exact
existing torchvision center crop, full-frame bilinear scaleFill, and the mean
of three probabilities from 90.2%-of-short-side squares at the beginning,
center and end of the long axis. No new fit, calibrated threshold, or holdout
evaluation. Use the selected, uncalibrated V2 MLP checkpoint recorded above.
Keep predictions, source-stratified/per-class reports and paired intervals.
This diagnoses discarded context and crop sensitivity; it does not establish
that a detected box contains a particular cloud or authorize publication.

The Montenegro multi-annotator dataset (Zenodo DOI 10.5281/zenodo.21787669,
CC BY 4.0) was inspected through its public API and README, not downloaded for
training. It contains SYNOP codes, ambiguous/mixed genera and substantial rater
disagreement, not 2,522 independent single-genus truths. Its README also retains
unfilled acquisition/provenance fields. Do not silently use it as a replacement
11-class confirmation set. SWIMSEG's linked license is CC BY-NC 4.0; the
CloudSegNet/UCloudNet released implementations restrict use to research. None
is approved for product integration. Existing release gates remain unchanged.

Input study complete: 452 validation rows, 449 unique labeled groups. Center
crop gives 63.70% top-1 / .63243 macro-F1; full-frame scaleFill 61.02% / .60521;
three windows 63.25% / .62895. Three windows correct 11 and regress 13 cases;
paired difference -0.45pp, 95% interval -2.41 to +1.62pp. Full-frame input
corrects 22 and regresses 34. Neither policy improves this candidate overall.
Do not deploy a slower multi-crop replacement on this evidence. All outputs
remain in `.local/v4/input-views-v2`; five input-study tests join the 34 passing
ML tests. No additional held-out images were evaluated.

## Bounded SigLIP 2 Feature Trial

Declare before any predictions: compare one frozen SigLIP 2 Base image encoder
with a linear head (C .01, .1, 1, 10) and the existing fixed 128-unit MLP recipe.
Use only V2 train and validation, original plus horizontal-flip training views,
train-only normalization, seed 7042, and maximum validation macro-F1 selection.
No backbone fine-tuning, prompt search, test-based head selection or new input
geometry search. Report both heads even if neither improves the DINO candidate.
The previously exposed test/atlas/stress/IMGW confirmation remain regression
sets, not fresh confirmation and never training input. Release gates stay fixed.

Use timm 1.0.24 and safetensors 0.7.0. The Apache-2.0 image-only port is
`timm/vit_base_patch16_siglip_224.v2_webli`, revision
`4c3661e5ac879a276ddc5ddc6d3f0ecc78fd5d82`; published weight SHA256
`9106b0d8d9d02ea90fc3571fffd1557cf444736f695ee40b1e57c856bc3d9494`,
371,551,936 bytes. Its published config specifies 224 pixels, bicubic resizing,
center crop .9, RGB mean/std .5, and learned attention pooling (768 features).
Follow this exact port's config rather than assume DINO preprocessing or copy
the full Google text-and-image package. Save small heads referencing the hashed
immutable backbone, not repeated 372 MB weight copies. Export/parity/native
latency and package size are still untested. No remote photo inference.

Sources: [Google model card](https://huggingface.co/google/siglip2-base-patch16-224),
[maintainer port](https://huggingface.co/timm/vit_base_patch16_siglip_224.v2_webli),
and pinned config/Hub LFS metadata retrieved on September 4. Apple MobileCLIP 2
was excluded because its model license restricts use to research and expressly
excludes product development; an MIT code license does not remove that limit.

To bound disk use, both calibrated DINO checkpoint copies were losslessly
archived against hash-checked existing backbones. Every tensor and metadata
field of the previously restored V1 copy was verified before removing that
duplicate. Original evaluation reports and immutable training sources remain.

The SigLIP trial completed on September 5 in 132 seconds: linear C .01 yields
53.32% validation top-1 / .53840 macro-F1; MLP epoch 21 yields 59.29% / .59292
(41 epochs before the declared early stop). Both lose to the selected DINO V2
MLP's .63164 macro-F1 on the same validation population. Do not calibrate,
export or ship this candidate, and do not expand its hyperparameter search
after seeing this result. Selected head SHA256:
`48a311e8bd42e1184066d838a0265d3d11f1b392be2db9f6b4c69e673860f941`.
Full cache/head/config/software-version/history evidence remains under
`.local/v4/siglip2-v2`. No additional holdout was opened. Forty-four focused
ML tests pass. The large public backbone can be re-fetched from its immutable
URL/hash if needed; preserving a failed trial does not require keeping a
re-downloadable 372 MB copy on the nearly full system disk.

## Shared-Backbone Pair Trial

Previous goal turn made progress: entry-copy implementation/QA and completed
negative geometry/SigLIP evidence changed the next action; it was not a wait.

Before predictions on September 5, declare one fixed equal-probability mixture
of the selected uncalibrated V1 and V2 DINO MLP heads. Verify every non-head
tensor is identical, parent-manifest prefix/order is unchanged, and neither
head trained on any V2 validation group. Reuse only the provenance-checked V2
validation feature cache. No new head fit, weight search, temperature or
calibration/test/atlas/stress/fresh-confirmation selection. Report both members,
the pair, corrected/regressed cases and per-class metrics. Only continue to
calibration/regression if paired validation macro-F1 exceeds both members.
The feature extractor would run once with two small heads, not two backbones.
This potential efficiency does not establish accuracy or Core ML compatibility.

Pair result: 58.41% raw validation top-1 / .58619 macro-F1, versus V2 alone
63.72% / .63164. On 449 unique groups it corrects 19 and regresses 43 cases;
paired difference -5.35pp (95% interval -8.87 to -1.80pp). The pair is rejected
before calibration/holdouts. No alternative mixing weights will be searched.

## Bounded Nonlinear Kernel Head

Before fitting, declare one RBF kernel-ridge family on the frozen V2 DINO
features. This tests nonlinear local class boundaries without another encoder
download or full-backbone training. Use original/flip training views, train-only
standardization, inverse-frequency class-balanced sample weights, and one-hot
targets scaled by 10 (a fixed output scale, not calibration). Fixed grid:
gamma = {.25, 1, 4}/768; alpha = {.01, .1, 1}. Select maximum raw validation
macro-F1; require improvement over V2 MLP before further evaluation. No input,
label, data-role, policy, or release-gate changes. Keep all nine results.
Check the selected float32 Torch kernel head against sklearn before treating
its score as representative of a possible deployable candidate. A kernel head
adds support-feature buffers, not a second DINO image tower. This is still an
experiment; it does not promise Core ML performance or accepted release quality.

All nine kernel trials completed. Gamma .25/768, alpha .1 was selected on
validation only: 64.38% top-1 and .64303165 macro-F1 versus the MLP's .63163736.
The first float32 conversion gave identical labels but .012636 maximum logit
error, failing the declared .001 tolerance. Isolated numerical probes traced
the error to accumulation of 4,650 opposing kernel coefficients, not feature
normalization. Centering each kernel row, explicitly summing products, then
restoring the constant term is algebraically equivalent and reduces maximum
error to .00016184. All 452 validation outputs pass in batches 1, 4, 32 and 452,
with no argmax mismatch. The selected fit, parameters and data roles did not
change; the original failed report remains intact. The completed recovery
duplicate was removed only after every tensor and the nine-trial history were
verified against the preserved final head/report, following a host disk-full
error. Unrelated projects, user files and shared archival bases were untouched.

Freeze assembled checkpoint before calibration/regression:
`b0f8062eb560f5b5471117ee190594d7485cd98e4e958997d992b3cef29115df`.
Head SHA256: `abf3cb9050bdaf15c34b5fdd772a98175cd53c8962fd7c14bed9ea504e19f9f2`.
This candidate uses the unchanged V2 backbone and frozen manifest. Evaluate
the existing calibration/old test/atlas/stress and previously exposed 299 IMGW
images against the native baseline, labeling the latter regression evidence.
No fresh-confirmation claim or normal release export is allowed for this
exposed set. All original accuracy, precision and coverage gates still apply.
Do not ship merely because feature-level numerical parity passed; full-image
inference, calibration, Core ML parity and native product QA remain separate.

Full-image evaluation completed using MPS. Old test: 76/123 (61.79%) versus
68/123 (55.28%) shipped, macro-F1 .49969 versus .44379; paired difference
+6.50pp, 95% interval -2.44 to +15.45pp. Atlas matches the shipped 19/30;
stress improves to 86/243 (35.39%) versus 57/243 (23.46%). Previously exposed
IMGW regression: 175/299 (58.53%) versus 89/299 (29.77%), macro-F1 .57969;
paired difference +28.76pp with capture-day-cluster interval +18.69 to +38.76pp.
These are improvements on the recorded populations, not adequate overall
reliability or a new independent confirmation.

Temperature 1.61815642 does not produce a supported calibration threshold
meeting the .90 precision target. The fail-closed policy accepts zero; it is
not a usable replacement and does not count as better accuracy. Raw accuracy
and atlas/stress regression gates pass, but precision/coverage gates fail.
Preserve `.local/v4/dinov2-kernel-calibrated/evaluation.json`; calibrated
checkpoint SHA256 `f506eabd847eded51ff8db827761aad8c4b294548e9b9751cf4c330a09529af9`.
The calibrated checkpoint is losslessly archived against the hash-checked V2
MLP to conserve host disk space. Fifty-two focused ML tests pass, including
large opposing-coefficient sums, single/batched predictions, state restoration,
exact evidence binding, and rejection of exposed data as fresh confirmation.
No further fit or policy search will use these regression results. Normal
export remains blocked by measured release gates; no production model changed.

## Larger Encoder Study

The previous goal turn made progress: a separately licensed binary cloud-mask
model was trained, evaluated, converted and tested through native original-photo
preprocessing. Segmentation success does not close genus recognition. Return
to genus classification rather than spending another turn polishing failed
proposal rectangles. The current kernel's validation errors remain concentrated
in similar mid/low-layer genera; no evidence supports changing acceptance
thresholds to make these errors disappear.

Before fitting, declare one larger representation: official Apache-2.0 DINOv2
ViT-B/14 without registers, pinned existing source revision
`7764ea0f912e53c92e82eb78a2a1631e92725fc8`, 336x336 input. Use final normalized
class token plus mean patch token, 1,536 features. Keep the same .902 center
geometry and original/flip training views; no mask-selected training crops,
input-view search or new labels. This changes capacity and resolution together;
do not claim to isolate which caused any improvement.

Official weight URL:
<https://dl.fbaipublicfiles.com/dinov2/dinov2_vitb14/dinov2_vitb14_pretrain.pth>,
346,378,731 bytes, S3 version `UgXoSvH_JJMe1OVbpL.ucwhEuZ6APOrb`. Record the
complete downloaded SHA256 before fitting and bind feature caches to it.
The pinned model card explicitly covers S/B/L/g under Apache-2.0; unrelated
XRay/Cell model licenses do not apply. Larger parameters do not guarantee
cloud accuracy, acceptable iPhone memory, Core ML parity or latency.

Use unchanged V2 data and roles. Compare logistic heads at C {.01,.1,1,10}
with balanced sample classes and train-only standardization, and one 128-unit
GELU/dropout .2 MLP with the existing fixed recipe: train-only feature mean/std,
sqrt inverse-frequency class weights, label smoothing .05, AdamW .001/weight
decay .01, cosine 200 epochs/.00001 minimum, batch64, seed7042; stop after
epoch30 once validation macro-F1 has not improved for20epochs. Choose maximum
raw validation macro-F1 across those two families. Preserve all results.

Only continue to calibration/regression if this exceeds the selected small
kernel's raw .64303165 validation macro-F1. Calibration, old test, atlas,
stress and exposed IMGW confirmation stay untouched during selection. Exposed
sets remain regression evidence, never fresh confirmation or training data.
All original accuracy, calibrated precision and coverage release gates remain
unchanged. No production model replacement is authorized by a larger backbone
or a validation-only win.

Downloaded weight identity verified before feature extraction or fitting:
SHA256 `0b8b82f85de91b424aded121c7e1dcc2b7bc6d0adeea651bf73a13307fad8c73`,
346,378,731 bytes. Cache identities include this hash, the pinned source revision,
architecture, 1,536-feature pooling, geometry, full manifest, view count, exact
ordered image IDs and extraction-code hashes. A resume must reject any mismatch.

All five Base trials completed in 648.1 seconds of the bounded runner. Linear
validation macro-F1 for C {.01,.1,1,10} was {.59736010,.56525231,.56212280,
.53094779}. Float32 folded-head parity passed for every fit; maximum logit
errors ranged from .00001717 to .00007248, without changed validation labels.
The fixed MLP selected epoch 6: 282/452 (62.39%) top-1, .62172039 macro-F1.
It does not exceed the small kernel's .64303165. Per the contract, no calibration,
old test, atlas, stress, exposed confirmation, native conversion or release
evaluation was opened for this model. Do not report a larger encoder as an
improvement. Capacity and resolution changed together; this negative trial
does not isolate their individual effects.

Results and every small fitted head are in `.local/v4/dinov2-base-336/`.
The selected full checkpoint is losslessly archived against the hash-checked
official raw backbone at `../dinov2-base-source/dinov2_vitb14_pretrain.pth`.
The archive contains 201,233 changed tensor values (head/normalization), all
metadata and the original checkpoint hash. Exact key order and every restored
tensor were checked before removing the repeated full checkpoint. Keep the
official raw source: the archive now depends on it. The archiver supports both
the existing full-checkpoint format and explicit `dinov2-backbone` format;
streamed hashing and mapped tensor reads avoid large duplicate allocations.

The archive is 817,741 bytes, SHA256
`5216e10caedc2da2adedc51deb721728fa04dc0144c5e92770c9f72001f740fe`;
the original full checkpoint SHA256 was
`bd51ac2377c35aac71b603d30d85fcb948d68279293f1a91ab2d125340965d78`.
All 80 ML tests now pass, including exact interrupted/resumed MLP history and
tensor parity, raw-backbone reconstruction, changed-source rejection and the
new GLOBE CSV schema audit. The bounded training and archive processes both
exited 0; no V4 MPS process remains running from this trial.

During the trial host disk availability temporarily fell below400MiB while
another same-owner CHMURNIK task needed an Android emulator. After ML ended,
availability recovered above 8GiB; only this trial's verified duplicate was
removed. Do not stop the Android emulator or alter another worktree. A resource
coordination reply initially failed automatic review; a read then verified the
same-owner CHMURNIK Android task and shared workspace. The minimal follow-up
could not be delivered because the app tool became unavailable. Do not assume
that another task received that message. Later command creation intermittently
failed with `Too many open files`; this is an execution-service issue, not an
unfinished training job or evidence that the model needs restarting.
