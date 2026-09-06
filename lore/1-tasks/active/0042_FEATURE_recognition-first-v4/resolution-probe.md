# Fixed 336px RBF Probe

Declared before extracting or fitting this variant. Previous goal work rejected
source-within-class balancing after independent replay; that was progress, not
a wait. The owner's subsequent root upload check passed without a code change.
The original model-reliability requirement remains unfinished.

## Rationale And Boundaries

A read-only audit of all 2,777 development images found that most CCSN short
sides are 400px and IMGW medians are 480px. Only 15/2,325 training images and
10/452 validation images can provide the existing .902 crop at 518px without
upsampling. Do not launch a 518px trial as a claim of recovered image detail.
Interpolation may affect a representation, but it does not create new evidence.

There is enough native resolution for 336px in 1,858/2,325 training images and
374/452 validation images. Previous Small 336px linear/MLP trials used the old
V1 dataset, not the current V2 reliability-weighted RBF. Their slightly worse
MLP result (.62028 vs .62053) makes a large gain unlikely; it does not measure
the current controlled comparison. The previous Base 336px trial changed both
capacity and size. This one final size-only trial keeps the current Small
encoder, all feature dimensions, weights, data and kernel recipe unchanged.
No resolution grid or follow-up 448/518 interpolation search on these data.

## Frozen Recipe

- V2 manifest SHA256
  `d5b0ca33e0867bbb0d0fd25dbd08fc20cfeea316a89299e53f63a6bee5d0ea1c`;
  2,325 train, 452 validation; no calibration/test/atlas/stress/confirmation.
- Backbone and reference hashes are checked against the existing constants.
  Load the unchanged local Small checkpoint strictly; no pretrained downloads.
- Official DINO revision `7764ea0f912e53c92e82eb78a2a1631e92725fc8`,
  final normalized CLS384 + mean patch384, CPU float32, two threads, batch4.
- Existing EXIF/RGB/Resize(round(size/.902))/CenterCrop pipeline, only size336
  instead of224. Same original+mirror training views, one validation view.
  All development photo hashes are checked before extraction. Record oriented
  dimensions and the actual rounded resize thresholds, not a rough percentage.
- Fit one 224 control from the exact historical caches and one 336 candidate.
  Frozen train-only OOF factors, class-normalized weights, training-only scaler,
  KRR alpha .1, gamma .25/768, one-hot targets times10. No fine-tuning,
  label changes, new source weights, threshold tuning or validation augmentation.
- Refitted control must agree with stored logits within1e-6 with no top1 change.
  Float32 head parity at batches1/4/32/452: maximum .001, zero label changes.
- Preserve the existing gate: raw validation macro-F1 >=.6545474034701404,
  improve over control, no raw all/cloud top1 or unique macro-F1 regression.
  Report raw, unique, cloud, source populations and full confusion matrices.
  Class-conditioned rows are recall-style diagnostics, not class precision.

Persist recipe, code/input hashes, geometry, features and both heads locally.
Recovery must match the recipe and exact feature identity; refuse overwriting
completed results. Independently replay the heads and all metrics before a
decision. Passing validation only permits further research, not a model release:
the reliability, fresh-evidence and actual native-import gates still apply.

## Current State

Not executed at declaration. App classifiers, web packages, Apple releases,
host settings and the owner's deferral of meteorologist involvement are unchanged.
