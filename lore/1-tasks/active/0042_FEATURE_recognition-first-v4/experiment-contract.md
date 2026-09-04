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
