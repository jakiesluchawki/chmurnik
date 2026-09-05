# Cloud Region Segmentation Study

The previous goal turn made progress: the selected kernel head was measured,
numerically repaired and rejected for release on calibrated-precision gates.
The production classifier remains unchanged. This study addresses a different
required component: actual cloud pixels for automatic tap-selectable regions.
It does not redefine segmentation accuracy as genus-recognition accuracy.

## Source and Scope

DLR/CIEMAT Almeria all-sky segmentation data, version 1.0.1:
<https://zenodo.org/records/16647156>, DOI 10.5281/zenodo.16647156,
CC BY 4.0. Authors: Yann Fabel, David Magiera, Bijan Nouri, Niklas Blum,
Luis F. Zarzalejo. The public record provides 770 training/validation images
from 2017 and 48 test images from four different cameras in 2021. Masks were
manually refined with auxiliary instruments; these are not genus annotations.

Published files and checksums:

| File | Bytes | MD5 |
|---|---:|---|
| kontas_2017.zip | 15626097 | c3f4d1731cbd6da4832b92908b864c5a |
| test_set.zip | 1198235 | ded931e66433e73f92e2992a08ef7394 |
| classes.yaml | 86 | bbc359ebd76c8a6ec06f064e4a15f425 |
| meta_data.yaml | 502 | d3e0ed3304b91bee1e8224e80cd308d6 |

Keep the public record, metadata, archive hashes and image/mask manifest.
Read archives without extracting paths. Verify matching dimensions, allowed
labels and pair completeness. Class 0 is ignored (camera/static foreground);
class 1 is clear sky; classes 2/3/4 are cloud. Do not use layer labels as cloud
genera, or claim that inferred cloud height is established from a photograph.

Before any model predictions, freeze train/validation assignment using seed
7042, capture-day groups and cross-image exact/near-duplicate groups (dHash256,
distance <=8). Reserve approximately 20% of development groups for validation;
keep the published split as provenance, not as protection against day leakage.
The 48 published test images are never selected or fitted on. Any development
group duplicating a test image is excluded. Use nearest-neighbor resizing of
labels and ignore class 0 in every training loss and reported metric.

## Bounded Candidate

One MobileNetV3-Small ImageNet-initialized encoder, lightweight multiscale
decoder with stride 2/4/8/16/32 skips and a single binary logit output. Input
256x256 RGB, ImageNet normalization. No remote image inference. Train up to
30 epochs, batch 16, AdamW learning rate .0003, weight decay .0001, cosine
schedule, seed 7042. Use masked binary cross entropy plus masked soft Dice
loss; no class/loss/grid search. Geometric flips and 90-degree rotations apply
identically to images and masks; mild brightness/contrast/color augmentation
applies only to training images. No synthetic cloud labels.

Select the epoch with highest validation cloud IoU at the fixed .5 threshold.
Save the exact recipe, manifest hash, initialization hash, software versions,
history, selected epoch and checkpoint hash. Report pixel confusion counts,
cloud IoU, Dice, precision, recall, clear-sky specificity, per-image IoU and
capture-day bootstrap intervals. Do not count empty ground-truth/prediction
pairs as perfect cloud IoU; report them separately.

Evaluate the selected checkpoint once on the published 48-image test, keeping
camera/day grouping visible. Compare against fixed RGB red/blue cloud mask
heuristics on exactly the same valid pixels; record the heuristic before
evaluation. No threshold tuning or model selection on test results.

## Decision and Transfer Gates

Research success requires validation and test cloud IoU >=.70, cloud precision
>=.80, and higher test IoU than the fixed heuristic. These are segmentation
research gates only, not new or weakened genus-release gates. Failures remain
reported. Even a passing all-sky result requires ordinary phone-photo visual
QA, separate labeled mobile-region evaluation, Core ML parity/performance and
integration tests before claiming general automatic preselection works.

The existing 30-photo licensed atlas is visual transfer QA only, not a labeled
segmentation benchmark. Include difficult warm, thin, continuous and mixed
clouds and clear sky. Private user feedback remains untrained and unpublished.

SkyCloudNet was considered because it targets ordinary photographs. Its linked
public OSF node reports CC BY 4.0, but the file listing is empty; no unavailable
weights or data are assumed. Research-only/noncommercial alternatives are not
used for product development. The existing sky-versus-ground model and RGB
heuristic do not by themselves identify individual clouds.

## Data Freeze Before Training

All four published files match their declared size and MD5. Pair validation
found 818 matching 512x512 image/mask pairs, with only class indices 0 through
4. The archive contradicts the record's simplified test-year description:
12 test photographs are from 2021 and 36 from 2023; use actual capture dates.
The metadata YAML also has inconsistent indentation; retain it verbatim as
source evidence, not as executable configuration or a parse-dependent input.

Manifest SHA256:
`6e12bc96e3eabded292836d6a8aadefa331e3cf0947939dc4e27ee21139bd4be`.
555 training images (136 days), 215 validation images (58 days), 48 test
images (25 days, four cameras). Combined day/near-duplicate grouping produces
186 groups; no development image overlaps a test group. The validation image
fraction differs from 20% because whole connected groups are kept together.

Decoder details: encoder skip indices 0/1/3/8 (16/16/24/48 channels), final
576-channel map projected to 64; fused channels 64/48/32/16 at progressively
higher resolutions, plus a final 16-channel raw-RGB detail block. One logit
per 256x256 pixel. Float32 training, no extra model family or tuning grid.
The fixed RGB baseline uses R/max(B,16), 10th-percentile background ratio,
threshold min(.86,max(.62,background+.16)); background >=.78 selects all
valid sky. This intentionally has the same valid-pixel mask as evaluation,
not ground-truth cloud boundaries. No morphology or threshold search.

Cross-checking all 818 segmentation photographs against the 4,358 existing
genus-manifest rows found zero exact-pixel or dHash-distance<=8 overlaps.
Training/validation masks use nearest-neighbor 256x256 label resizing. Before
test exposure, also declare a secondary full-resolution test: resize predicted
probabilities bilinearly to 512x512 before the fixed .5 threshold and compare
with the untouched original masks. Report both grids without substituting
whichever gives the higher score. The 256x256 grid remains the research gate.
The model has 1,096,913 trainable parameters and is not a new 11-genus model.

## Completed Trial and Transfer Review

Thirty epochs completed. Validation selected epoch 22: cloud IoU .84959,
precision .93159, recall .90612. The selected checkpoint SHA256 is
`33363342726c34dae0c0ea0f05e3c7ff1f9ed08b1710413db7e14d84b33cffb2`.
The frozen test gives cloud IoU .90080 (capture/duplicate-group 95% interval
.86122 to .93539), Dice .94781, precision .96768 and recall .92874. The fixed
RGB rule gives IoU .81778 and precision .83115. On four clear test images,
false cloud pixels occupy .128% versus 28.91% for RGB; four images are not a
representative clear-sky benchmark. All declared segmentation research gates
pass. This is not evidence that cloud-genus recognition is 90% accurate.

All 30 atlas photographs were visually inspected in five contact sheets.
Many cumulus and continuous layers are plausibly located. Important failures
remain: thin cirrus is missed; one cirrocumulus field is mostly missed; warm
lenticular-cloud background is overselected; dark cloud bases can be omitted;
the separate sky/ground mask removes fog/stratus below an elevated viewpoint.
Do not claim this is production-ready automatic preselection. Preserve all
results under `.local/v4/dlr-cloud-mask-v1-test`, including failure examples.

Next bounded engineering check: research-only float32 Core ML conversion of
this exact checkpoint, probability error <=.01 and binary agreement >=.995 on
all 48 DLR test and 30 atlas images, using identical resized RGB pixels. Record
native load/warm prediction timing and package hashes. Native original-photo
preprocessing and actual Apple application integration are separate checks;
do not silently copy a research package over the shipped classifier.

Core ML float32 conversion passes all 78 identical-pixel comparisons:
maximum probability error .00005466, minimum binary-mask agreement .99998474.
Package size 4,484,994 bytes; warm median Mac Studio prediction .00401 seconds,
model load .300 seconds. This does not measure iPhone latency.

Before the original-photo check, declare use of the existing shared ImageIO
orientation helper (maximum side 1800) and CoreGraphics sRGB whole-frame
256x256 resize. Save the actual input pixels and compare Torch against the
native Core ML output; retain <=.01 probability error and >=.995 agreement.
Re-score the same 48 test masks and require at most one percentage point IoU
loss versus the recorded PIL preprocessing. Add eight lossless EXIF-orientation
fixtures; they must yield the same oriented RGB within 2/255, and do not count
as additional independent test photographs. Do not relax thresholds on failure.

The original-photo native check passes on 78 photographs plus eight geometry
fixtures. Test IoU .89928, down .001519 (0.152 percentage points) from PIL;
maximum same-native-pixel probability error .00003827. All eight EXIF variants
produce exactly identical oriented RGB. Full-resolution Python test IoU is
.90059, not materially different from the declared 256x256 measurement.

Added a Swift cloud-mask proposal overload: connected 8-neighbor areas within
sky>=.7/cloud>=.5, noise floor max(16 pixels, .15% of sky area), bounded .1
context padding, at most five area-ranked proposals. Continuous layers remain
one region. Pure Swift tests cover separated areas, noise, continuous layers,
clear sky, foreground exclusion, bounds, invalid input and proposal limits.
The prior unsuccessful feature-clustering prototype is retained for comparison.

Visual inspection of actual native masks converted to Swift proposals covers
all 30 atlas photographs (29 yield proposals). That count is not a success
rate: large connected fields can produce overly broad/nested rectangles,
warm backgrounds can be falsely selected, the thin cirrus example yields
none, and elevated fog remains incorrectly filtered by the sky model. Do not
wire this output into a release as if the user's preselection requirement were
finished. Next work must improve these selection failures and the still-failing
genus classifier; native/Web UI integration and full release QA remain open.

## Reproducibility

From the V4 repository, use `../chmurnik/.local/ml-venv/bin/python` for Python
commands. All data, weights and report paths below are local, ignored artifacts.
The downloaded archive members are read directly; the native probe additionally
materializes only the 48 original test JPEGs in its own output directory.

1. `ml/cloud-recognition/dlr_segmentation_data.py --root .local/v4/dlr-segmentation`
2. `ml/cloud-recognition/train_cloud_segmenter.py --manifest .local/v4/dlr-segmentation/manifest.json --output .local/v4/dlr-cloud-mask-v1 --device mps`
3. `ml/cloud-recognition/evaluate_cloud_segmenter.py --manifest .local/v4/dlr-segmentation/manifest.json --checkpoint .local/v4/dlr-cloud-mask-v1/cloud-mask.pt --output .local/v4/dlr-cloud-mask-v1-test --atlas-manifest .local/v4/data-v2/manifest.json --sky-model .local/v4/vendor/skyseg --device mps`
4. `ml/cloud-recognition/export_cloud_segmenter.py --manifest .local/v4/dlr-segmentation/manifest.json --checkpoint .local/v4/dlr-cloud-mask-v1/cloud-mask.pt --evaluation .local/v4/dlr-cloud-mask-v1-test/evaluation.json --atlas-manifest .local/v4/data-v2/manifest.json --output .local/v4/dlr-cloud-mask-v1-coreml`
5. Compile `ios/App/App/CloudImagePreprocessor.swift` with `tests/native-cloud-mask/main.swift` using `xcrun swiftc -O` to `.local/v4/native-cloud-mask-probe`.
6. `ml/cloud-recognition/verify_cloud_segmenter_native.py --manifest .local/v4/dlr-segmentation/manifest.json --atlas-manifest .local/v4/data-v2/manifest.json --checkpoint .local/v4/dlr-cloud-mask-v1/cloud-mask.pt --export .local/v4/dlr-cloud-mask-v1-coreml --evaluation .local/v4/dlr-cloud-mask-v1-test/evaluation.json --native .local/v4/native-cloud-mask-probe --output .local/v4/dlr-cloud-mask-v1-native`
7. Compile `ios/App/App/CloudRegionProposer.swift` with `tests/native-regions/main.swift` to `.local/v4/native-mask-regions`; run without arguments for unit assertions.
8. `ml/cloud-recognition/probe_cloud_mask_regions.py --native-evaluation .local/v4/dlr-cloud-mask-v1-native/evaluation.json --atlas-manifest .local/v4/data-v2/manifest.json --sky-model .local/v4/vendor/skyseg --native-regions .local/v4/native-mask-regions --output .local/v4/dlr-cloud-mask-v1-regions`

Do not overwrite frozen manifests, selections or reports. Training recovery is
available only with `--resume` against the same complete recipe/source hashes.
The 48 DLR images are now exposed segmentation regression data, not a new
untouched confirmation set for a future tuned model. They remain excluded from
training. Sixty-four Python ML tests and the native region assertions pass.
No application model was replaced, no V4 package was uploaded to Apple, and
no wallpaper was generated during this recognition-first step.

## Development Integration, September 5

Added `CloudRegionDetector` to the shared Apple target, using the verified
float32 SkySegmentation 384px and CloudMaskV4Research 256px packages. Their
graphs, weights and manifests are byte-identical to the research exports.
`tests/cloud-regions.test.mjs` pins both graph and weight hashes. The two
compiled model resources add approximately 9 MB. Full source notices are
bundled in `public/cloud-region-notices.txt` and linked from Sources.

The bridge now exposes `proposeRegions` on a serial inference queue shared
with classification. The full oriented image passes through both masks;
bilinear pixel-center resampling aligns the sky grid with the cloud grid.
Only connected cloud-mask members eligible as sky can anchor numbered tap
targets. A hole in the center of a connected region must not receive its
marker; synthetic ring and foreground tests enforce this. Neither a marker
nor a rectangle establishes an individual cloud identity or a genus.

Capture/import now precedes proposal selection rather than immediate genus
classification. Selecting a number reveals the actual square analysis frame;
the user confirms it or points elsewhere. An accessible numbered button list
also reaches overlapping markers. Empty proposals and failed detection are
distinct states, both retaining manual selection and original-photo save.
All operations remain local, bounded and protected against late completion
after the dialog closes. Native input is limited to 30 MB.

Found and repaired a geometry mismatch: previously the classifier center-cropped
an already selected region again. `selectedRegion: true` now requires square
pixels and passes the entire displayed crop to Vision. Full-photo callers keep
the original 0.902 preprocessing. The two shipped genus weight files are
unchanged. **Selected-region scores have no validated calibration yet**, so
this path sets minimumConfidence=1.01 and reports an experimental pipeline
version; it must not produce accepted/confident names. This is explicitly not
a calibration success or a deployable improvement in genus accuracy.

Completed checks:

- Native grid-resampling, input rejection, square preservation, connected-mask
  geometry, marker placement and no-sky/no-cloud assertions pass.
- Both masks and proposals ran together on all 86 original control inputs
  (48 DLR, 30 atlas, eight EXIF fixtures). There were 51 nonempty outputs;
  this is not an accuracy metric. Median warm combined inference on the host
  was 0.219 seconds, excluding model construction, not a phone latency claim.
- Final probe: `.local/v4/native-region-detector-anchors-results.json`, SHA256
  `be5a679a538c5db7af5cff6390fbe9385b7fe619afc2be902ff9b29e158db570`.
  The orientation fixtures yield empty proposals; this alone does not verify
  positive-region alignment. Earlier pixel-level EXIF tests remain separate.
- All 220 JavaScript tests, production web build and nine lesson audits pass.
- The shared iPhone/iPad simulator target compiles with both mask resources.

The first direct Catalyst build failed because the official Capacitor binary
distribution lacks Catalyst slices. The existing `scripts/build-macos.mjs`
isolated source-build workflow supplies those slices and produced an ad-hoc
development app. No SDK signing bypass, host restart, installed app replacement,
Apple submission or website deployment was performed. A final rebuild after
the marker change is tracked in the task worklog.

Visual and interactive QA is still open. The browser tool returned no available
browser and then a computer-use startup failure; the temporary local preview
server was stopped. Do not claim screenshots or successful phone/Mac interaction
from a compile. Still needed: positive EXIF/portrait-region alignment, clutter,
thin/dark clouds, overlapping taps, keyboard/VoiceOver, failed detection, close
during processing, repeat selection and original-versus-crop save on real UI.
Mobile segmentation/region labeling and genus-release gates remain unchanged.

Reproduce the combined probe by compiling `CloudImagePreprocessor.swift`,
`CloudRegionProposer.swift`, `CloudRegionDetector.swift` and
`tests/native-region-detector/main.swift`; pass the two mlpackage paths,
`.local/v4/dlr-cloud-mask-v1-native/request.json` and a new output JSON path.
Do not overwrite previously recorded results.
