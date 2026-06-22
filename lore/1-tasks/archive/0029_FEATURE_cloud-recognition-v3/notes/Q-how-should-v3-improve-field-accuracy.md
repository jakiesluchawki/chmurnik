---
type: Q
status: mature
task: "0029"
---

# How should v3 improve field accuracy?

## Current evidence

- V2 uses MobileNetV3 Small with a 224 px center crop.
- Held-out CCSN genus top-1 is 53.4%, top-3 is 80.5%, and macro-F1 is 50.6%.
- The 30-photo application atlas reaches 60.0% top-1 and 52.2% macro-F1.
- Altostratus, Stratocumulus, and Stratus are the clearest atlas failures.
- Center cropping can remove scale, horizon, and cloud-extent evidence that is
  meteorologically useful.

## Candidate changes

1. Preserve the full frame with aspect-ratio padding instead of center crop.
2. Increase input resolution to retain small cloud elements.
3. Compare MobileNetV3 Large and EfficientNet-B0 backbones.
4. Add an auxiliary cloud-family objective during training.
5. Group near-duplicate images before splitting.
6. Calibrate abstention against independent data, not only validation data.

## Dataset constraint

The TJNU Ground-based Cloud Dataset is not suitable for this product because
its agreement prohibits modification and commercial use without permission.
CCAiM is MIT-licensed and matches the ten genus labels, so it is reserved as an
independent benchmark rather than folded into training.

## Answer

No single larger model was reliable enough to replace v2. The selected release
uses a 40/60 ensemble of the existing 224 px MobileNetV3 Small and a new 320 px
MobileNetV3 Large. Its weights and abstention policy were selected on a common
holdout unseen by both models.

The full-frame hypothesis did not survive application-atlas testing. Training
and native inference therefore retain a center crop, but the iOS bridge now
reproduces its exact scale before invoking Vision. This fixed the native
ranking error exposed by the canonical Cumulus simulator check.

The independent curated Commons benchmark supplied the release decision:
macro-F1 improved by 13.1 percentage points and top-three accuracy by 10
points. CCAiM exposed substantial label noise and remains a stress set rather
than a headline accuracy measure.

The result is still a hypothesis generator. The release deliberately abstains
often, shows three genera, and presents family evidence before a genus claim.
