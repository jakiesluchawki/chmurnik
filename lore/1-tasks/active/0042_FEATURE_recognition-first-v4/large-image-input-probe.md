# Large Original Input Probe

September 6, 2026. Research protocol fixed before generating or testing inputs.

The reference resampler passes exact RGB/PNG checks only through 1800 pixels.
Actual app import requests 1800x1800 and quality 86 from the Capacitor camera
API. Mac `pickPhoto` explicitly uses an ImageIO 1800px thumbnail followed by
UIKit JPEG quality .86. These are upstream of classification; no raw-original
parity result may be represented as end-to-end app capture accuracy.

Run a bounded lossless diagnostic to isolate the 1800px thumbnail limit:
three original sizes (2048x1536, 3072x2048, 4032x3024), eight EXIF orientations,
and two fixed synthetic patterns (smooth color gradients and high-frequency
stripes), totaling 48 originals. Compare the unchanged default 1800px decode
limit with the existing helper's supported 4096px maximum. The reference
bilinear adapter and center-crop geometry stay fixed. Both use ImageIO PNG
decoding and the same source files. Reference output is Pillow's direct RGB
resize/crop of the oriented original. Require exact equality for the 4096px
arm; report all pixel differences in both arms and preserve failures.

This is neither a cloud dataset nor classifier accuracy evidence. No model
inference, training, thresholds, source labels, real camera sessions, metadata
upload, production source, camera limit or user photos change. It cannot
verify the actual Capacitor/UIImage JPEG encoder, HEIC, HDR, wide-gamut images
or physical phone RAM. Record source dimensions, file hashes, binary/script
hashes and host process peak memory. Do not remove the production size cap
based on this test; it serves memory/privacy/latency requirements too.

## Single-Image Memory Follow-Up Protocol

The 96-case combined run passed the 4096px exact-pixel criterion but the
native batch peak was 1,192,050,688 bytes. This cannot be attributed to one
photo or one arm. Before drawing a memory conclusion, measure the fixed
4032x3024 smooth/orientation1 source in six fresh native processes, three
per limit in alternating 1800/4096 order. Capture each child's `wait4` resource
usage independently, dimensions, output hash and return code. No model or app
is loaded. Report host-only process peaks, not phone/application memory.

## Mac Import Inference Protocol

The single-image probe completed. Both the production limit and reference
resampler stay unchanged. Next reproduce the exact ImageIO thumbnail / UIKit
JPEG .86 encoding block from `CloudRecognizerPlugin.documentPicker` in an
explicitly flagged `MAC_IMPORT_JPEG` research runner. Use Mac Catalyst/UIKit,
not an assumed equivalent third-party JPEG encoder. Retain this generated
input's byte length and SHA256 per prediction. Do not instantiate an app,
open a picker or access user photos; use all 452 frozen validation images.

Follow that import with the existing `REFERENCE_BILINEAR` adapter and the
unchanged FP32 calibrated kernel. Run the existing metadata-bound native
verifier without changing the .05 tie margin or acceptance criteria. Compare
against the same frozen Torch results and the earlier no-reencode reference
run. This isolates a real shipped Mac import operation, but is not a shipped
classifier, real iPhone capture or physical-device test. Preserve failures;
do not tune JPEG quality, weights, calibration or a holdout based on this run.

## Completed Measurements

The large-image probe completed on macOS. The 4096px arm matched all 48
reference images exactly; the production-limit 1800px arm matched none
exactly, with maximum channel difference 4 and mean .280747 on the 0-255
scale. These synthetic differences do not measure cloud classification.

The fresh-process 12MP memory follow-up measured peak resident bytes:

| Limit | Run1 | Run2 | Run3 |
|---|---:|---:|---:|
| 1800 | 64,471,040 | 64,454,656 | 64,421,888 |
| 4096 | 246,562,816 | 245,497,856 | 246,562,816 |

Each arm reproduced its own output hash in all three runs. The combined
96-case batch peak was 1,192,050,688 bytes, not a single-photo measurement.
These exclude Core ML and the application. Keep the production 1800 limit.

The actual Mac-import JPEG arm failed the unchanged native decision gate:

| Candidate input | Total top-1 changes vs Torch | Non-tie changes | Max probability error |
|---|---:|---:|---:|
| Original/reference bilinear | 7 | 0 | .0708271265 |
| Mac import/reference bilinear | 11 | 4 | .1691061258 |

The four non-tie differences (Torch top1 -> Mac top1) were:

| Validation ID | Classes | Original top-two margin |
|---|---|---:|
| imgw/f953ed10feb0f6280163 | Cs -> Cc | .141797 |
| imgw/7cd8792cb5134adfb6de | Ac -> Cc | .077798 |
| imgw/c592cc9ff4ad7259f14d | As -> Ns | .102673 |
| imgw/5c8eb44a891511abf9ee | As -> Ns | .071572 |

Warm median is .025015s including import/preparation on this host. No output
was accepted by either calibrated policy (minimum confidence 1.01); therefore
zero acceptance changes do not establish reliability. Against existing source
labels, raw Torch has 290/452 correct, original/native 288, Mac/native 288.
Equal aggregate accuracy hides changed individual answers and is not parity.

An independent Node check recomputed argmax, tie margins, errors, acceptance
flags and counts from all saved probability vectors. All 452 Torch vectors,
package metadata/weights and pixel-rounded crop bounds match the prior run.
All 452 encoded byte hashes differ from their original files. The failed
report is retained unchanged; its generic scope string must be read together
with the MAC_IMPORT_JPEG binary flag and this protocol.

The current resampling runner also passed 327 raw RGB fixtures, 96 smaller
PNG/EXIF fixtures and 9 invalid-input rejections. Default and Catalyst/native
runner compilation passed. The existing 217 ML/tooling tests passed before
the separately declared imported-training experiment. No production source,
model, threshold, Apple build or web deployment changed in this diagnostic.

## Receipts

Artifacts are under `.local/v4/dino-reliability-coreml-20260906/` and are not
public downloads. SHA256:

| Artifact | SHA256 |
|---|---|
| large-image-probe/report.json | `39fd12e54480d76e8729add42f7d2fc091468bfcc2be70e433721200fb9ecea3` |
| large-image-memory/report.json | `31bf0bfc3936ac0b58e91ba37cd4068b3be03e829a637ef70f847e0fe05404ba` |
| resampling-rgb-large-regression/report.json | `bf7a53e8fb9e2b7868dbae4e78731abb8c8ff9662207cc14dfd7500a88276c09` |
| resampling-images-large-regression/report.json | `885e608c3f05cddf947a1d3df5baad935e2ee8eaa0653783c34802641ad3a722` |
| reference-resampling-large | `15984e5147d8c41cb43d59c13dea63c24c7767eff2470a1ca7398c1c7dfff138` |
| native-mac-import-parity | `0b487466eca77195f151c02f8a7a2211c33263928d378be58482848672ddab29` |
| float32-mac-import/report.json | `bf99ff215093a80b0525a7526bff49abc42a9c1e429b05117d15108922e18e2d` |
| float32-mac-import/native.json | `24a98cf314c4df79f319f474c869fd8248213d901eb672a367f18384a7dc96c0` |

Next action is the separately predeclared `mac-import-training-probe.md`, not
loosening the failed parity gate or certifying iPhone capture from this test.
