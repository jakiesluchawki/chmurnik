# Resolution Trial: Rejected

The fixed 336px Small/RBF trial completed on all frozen development images.
It does not improve the 224px research reference. This is source-label agreement
on repeatedly used development data, not field accuracy or independent labels.
The currently shipped classifier has not changed.

| Population | 224px control | 336px candidate |
| --- | ---: | ---: |
| All validation | 290/452 (64.16%) | 285/452 (63.05%) |
| Raw macro-F1 | .644547 | .633350 |
| Unique images | 287/449 | 283/449 |
| Unique macro-F1 | .642974 | .634141 |
| Cloud images | 260/422 | 255/422 |
| Unique cloud images | 258/420 | 254/420 |
| CCSN source | 182/288 | 179/288 |
| IMGW source | 88/144 | 86/144 |
| Clear-sky source | 20/20 | 20/20 |

There are 18 paired gains and 23 regressions. Both sources decrease. The
minimum .654547 macro-F1 and non-regression conditions fail. Do not open
calibration/holdouts, export this variant or replace app weights. No source,
label, quality factor, input view or kernel hyperparameter was retuned.

## Verification

Every development image passed its frozen source-aware checksum. The geometry
audit independently confirms all 2,777 oriented image dimensions. At336px,
1,858/2,325 training images and374/452 validation images need no upsampling;
at518px only15 and10 respectively. This is native pixel support for the
actual rounded Resize/CenterCrop recipe, not proof of semantic detail quality.

CPU float32 feature extraction took331.0seconds; the complete extraction and
two head fits took333.3seconds. This is a research-host measurement, not an
iPhone latency claim. The exact224px refit matches historical logits with
zero numerical error. Both float32 heads pass batches1/4/32/452; worst error
is .000181533 with zero top1 changes.

Independent NumPy/SciPy refitting uses squared Euclidean distances and the
weighted normal equation `(K + diag(alpha/w)) * coefficients = targets`,
without importing the probe, model, project metrics or sklearn estimators.
Maximum disagreement is2.59e-11; all predictions, all36 population reports,
the grouped denominators, geometry and rejection decision agree. The replay
does not claim to independently reimplement DINO feature extraction.

Five new tests cover exact resize boundaries, EXIF dimensions, excluded
holdouts, duplicate IDs, actual336px input, incompatible/incomplete caches
and view identity. All296 ML/tooling tests pass, zero skips. Existing
Core ML dependency-version and sklearn deprecation warnings remain; no
dependency upgrade was needed.

## Decision

Close the size-only hypothesis for this frozen data/model family. Earlier
linear/MLP trials and this current-head paired test provide no evidence for
a size increase. Do not continue with448/518, crop/augmentation or another
nearby kernel/weight grid on the same validation data. These repeated
development results cannot validate themselves as fresh field evidence.

The next model-admission decision needs materially new evidence or a distinct,
demonstrated failure mechanism, not another parameter variant. Independently
verified labels and actual imported-photo parity remain open requirements.
The owner still defers meteorologist involvement; do not contact that reviewer,
send private photos to a service, or infer permission for online recognition.
The full goal stays active. This completed experiment is progress by excluding
a specific hypothesis, not evidence that the requested recognition improvement
is delivered or that all remaining work is blocked.

## Receipts

Local directory: `.local/v4/dinov2-resolution-336-20260907/`.
Aggregate results and replay are copied beside this note; photo IDs/dimensions
remain local. SHA256 values:

- Recipe: `175ba67a068d4895531292a165aa0b2903e9cb82dfec711223cc597bef6a1f4f`
- Evaluation: `7fb497969ea3ca15482320e3b16d5e0f8864bf1303a0ed06f7a0d98198dac74c`
- Geometry: `aeec8e01b71f172415b647a772f971760f93cecf2dba513bdfc90716199d7bee`
- Train features: `0c1c5444676499328a58a553e5814ef81eb6003605113025cddba6d389da03d6`
- Validation features: `0f1bdd7e0b7904ca0ac6b67160dff2efcf52b87560f408b61f62e6bf63f990b0`
- Control head: `66d1de31049ed56f2d0215add16cbdd998267fce0a3c4460873edadee534dcde`
- Candidate head: `e4d847b091330c5e268e13c30991e9038615d7f79a3b24ec8f76a4a987c51123`
- Replay: `14c8d6a623e9ce50345a1bba00451728a7de2264b66273c16eb57f2fb5dc9ad5`

No app code, model asset, Apple submission, production web package or host
setting changed. The owner's latest Cyber_Folks recheck independently matched
all81 current app files and passed the complete public browser harness,
including answer conceal/reveal/hide; no repeat upload is required.
