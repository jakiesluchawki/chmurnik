# NOAA Source Examples: Frozen Diagnostic

September 6, 2026. This is an additional source-agreement diagnostic, not a
training run, an expert-adjudicated test, or qualification for release.

## Source and Selection

Selected all ten genus examples in the NOAA NESDIS
[Types of Clouds page](https://www.nesdis.noaa.gov/about/k-12-education/atmosphere/types-of-clouds)
before inspecting their pixels or running predictions. The page attributes
each example to NOAA. Its labels are editorial teaching examples, not a
published independent annotation protocol. The unrelated special-cloud images,
video and simplified weather predictions are not included.

The [NOAA Education reuse guidance](https://www.noaa.gov/office-education/outreach-communication/faq)
allows use of NOAA-sourced content subject to checking credits, attribution,
and no implied endorsement; third-party content needs separate permission.
The canonical policy page returned HTTP403 to the web reader, but its indexed
official NOAA page supplied the guidance. No account, agreement acceptance,
contact-information submission or bulk archive access occurred.

Downloaded ten original served WebP files, each 400x267 pixels, 104,386 bytes
in total. The bounded request allowed at most2MB per photo and20MB overall.
Retained the source HTML, exact URLs, credits, hashes, order and dimensions in
`.local/v4/noaa-examples-20260906/`. These are research artifacts, not new atlas
or social assets. Each decoded EXIF-oriented RGB image was also saved as PNG
without resizing for both prediction arms.
An additional pixel-by-pixel check confirms identical decoded RGB arrays and
dimensions for all ten WebP/PNG pairs.

## Overlap Audit

- Compared against all4,358 rows of the frozen V2 manifest, covering4,337
  distinct retained pixel arrays. Ran43,415 geometric/pixel comparisons,
  including45 within the ten-photo sample, using the existing SIFT/affine
  crop-reuse detector and its unchanged thresholds.
- No pairs were flagged. The nearest dHash256 distances ranged18-87; none
  met the existing <=8 screen. Visually inspected the full source contact
  sheet and the two closest reference cases (distances18 and22); the latter
  are low-detail grey-sky images, not established photo reuse.
- This does not prove that every scene is independent. Crops without enough
  features, related captures and unknown foundation-model pretraining exposure
  remain possible. Capture dates/group independence are unavailable.
- The first local audit stopped at the first IMGW row because it compared a
  retained resized JPEG with the original-image pixel hash. Corrected only
  the audit: verify IMGW's stored artifact SHA256, then compare actual retained
  pixels. The complete rerun passed every reference integrity check. No source
  file, manifest, group, label or split was changed.
- Reran all eight existing crop-audit tests successfully, covering crop/resize,
  JPEG recompression, brightness, unrelated scenes, shared overlays,
  low-information skies and receipt integrity.

## Frozen Comparison

The second protocol was saved before either arm ran. Include all ten examples;
do not discard, retrain, select variants, recalibrate or change policy based
on the answers.

**Baseline:** both actual packaged Core ML classifiers, hashes verified against
the earlier native baseline, weighted40/60. Recompiled the existing
`tests/native-shipped-baseline/main.swift` and ran its UIKit renderer,90.2%
central square and Vision scaleFill. This is the established default-photo
baseline, not a user-selected-region test. Policy remains confidence.2 and
margin.51.

**Candidate:** the already calibrated DINOv2 reliability candidate, SHA256
`1b8c30b1c319abf259e99ed1a27387c451863a6cd158533ea5431bdbaf2c2195`.
CPU inference with the existing `TrainingImages` evaluation transform,
checkpoint temperature and abstention policy. No weight download, fitting,
new calibration, Core ML export or production replacement.

| ID | NOAA source label | Packaged baseline top1 | Candidate top1 |
|---|---|---|---|
| N01 | Cirrus | Cirrostratus | Cirrus |
| N02 | Cirrostratus | Nimbostratus | Cirrostratus |
| N03 | Cirrocumulus | Cirrocumulus | Cirrocumulus |
| N04 | Altocumulus | Altocumulus | Altocumulus |
| N05 | Altostratus | Clear sky | Altostratus |
| N06 | Nimbostratus | Clear sky | Nimbostratus |
| N07 | Cumulus | Cumulus | Cumulus |
| N08 | Stratus | Nimbostratus | Nimbostratus |
| N09 | Stratocumulus | Nimbostratus | Nimbostratus |
| N10 | Cumulonimbus | Cumulonimbus | Cumulonimbus |

Source-label agreement is4/10 versus8/10: four gains, zero regressions.
Both policies accept zero predictions; the candidate's previously failed
calibration gate remains failed. Do not advertise80% general accuracy or a
successful replacement. This small, curated publisher set contains only one
example per genus and no clear-sky/outlier challenge.

An independent Node calculation rechecked all IDs, labels, argmax results,
40/60 component arithmetic, acceptance decisions, gains and regressions.
Native probability sums differ from1 by at most0.00064868927, within the
existing native harness's0.01 bound; PyTorch's maximum is8.94e-8. The first
cross-check incorrectly imposed a float32-scale1e-5 bound on native output;
the corrected check uses the existing native contract. No probabilities were
renormalized or changed. The first native attempt could not create a Core ML
temporary directory in the sandbox; the approved local retry completed all
ten photos without opening an app or changing system settings.

## Decision

This is encouraging cross-source evidence for the existing candidate, not a
reason to retry already completed backbone/head variants or relax release
criteria. The next useful expansion is professionally described, independently
screened examples of the unresolved low-layer distinctions and mixed skies,
with a larger predeclared evaluation. NOAA NWS Key West has a
[low-cloud teaching collection](https://www.weather.gov/key/low_clouds), but
its individual photographs, credits, reuse, category unions and overlap have
not yet been audited. Do not claim it is an admitted dataset.

The original frozen split, 77/123 candidate result, rejected GLOBE/Vienna
auxiliary trials and calibration/Core ML gates are preserved.
Apple1.2 and current WWW remain the separately authorized UI/content release.

## NWS Key West Follow-Up

Audited the linked low-cloud collection on September6. An HTML parser froze
all23 full-size photograph links in source order before downloads or model
predictions. Eighteen source entries name a single genus (Cu5, Cb6, Sc4, St3);
two are St/Cu alternatives and three explicitly describe mixed Cu/Sc. These
categories are preserved, not converted to invented single-image answers.
There are no Ns examples in this collection.

Downloaded11,027,315bytes:22 images2272x1704 and one1704x2272. The relevant
EXIF/comment fields are empty, but the actual contact sheets show visible
Jim W. Lee copyright notices; inspected original K03 also confirms this.
The [NWS reuse policy](https://www.weather.gov/disclaimer) excludes specifically
marked third-party material from its general public-domain permission.
Consequently this collection is **not admitted for training or redistribution**
without clarifying rights. No permission request, publication, classifier
prediction, label update or training followed. Local originals retain notices.

The unchanged overlap audit verified all4,358 frozen reference rows and
completed100,004 comparisons against4,337 distinct retained pixel arrays plus
within-collection pairs. Zero flags; nearest dHash256 distances46-92. As before,
this does not establish independent captures, unambiguous labels or permission.

Local evidence: `.local/v4/nws-key-20260906/`, generated by
`.local/v4/nws_key_audit.py`. SHA256 receipts:

| Artifact | SHA256 |
|---|---|
| low-clouds.html | `eeb051a9c6b07b34364b040d01bb9aee527a93b1af29697ccbf0776a0365881d` |
| selection.json | `66869dc307ff20c8e647acf3db662d64a05978ede6411c53d08579eb3738e306` |
| downloads.json | `71a2431892be6d6597f9b3b66c98b7d21483d6b0c1a1b9b1635e4e6ae36e6272` |
| reuse-audit.json | `52a25bf2a77ff6757141587ed3250b8028972ff81656dcdedf55550499a5b24c` |

## Other Access Checks

- [WMO Cloud Atlas copyright](https://cloudatlas.wmo.int/en/copyright.html)
  does not provide blanket permission to compile a reusable training set.
  Other uses require permission from the relevant rights holders. No WMO
  photographs were downloaded for this work.
- [HBMCD's repository](https://github.com/SadaharuZL/HuaYun-BJUT-MIP-Cloud-Dataset)
  describes25,119 images/11 categories and professional staff recognition.
  The inspected root, nested folder and download-link file show no explicit
  product-training/distribution license. The download points to Baidu; the
  nested folder holds a comparison illustration. No archive was downloaded
  and no license was inferred from public availability. Table2 also repeats
  the Cs label instead of providing a distinct Sc row, so preserve the
  source's ambiguity rather than inventing corrected counts.
- The official [DINOv3 small model card](https://huggingface.co/facebook/dinov3-vits16-pretrain-lvd1689m)
  requires login and agreement to share contact information for access. It is
  a general visual backbone, not a trained cloud classifier. No gate bypass,
  model download or user-information submission occurred. Newer architecture
  alone is not evidence of better CHMURNIK recognition.

## Evidence Hashes

All files below are local research artifacts under
`.local/v4/noaa-examples-20260906/` unless noted. The application tree is unchanged.

| Artifact | SHA256 |
|---|---|
| selection.json | `1f95e390e1f1f256cc4819626513164ea2b3990e98ac1cf20bfb963a28e44dac` |
| downloads.json | `b19ba3b4d331d5b54b86310d55839e2159d1d056210297008faa6bba13888533` |
| source.html | `43475a9d60513ea67a463585501a6ca88fa4c57391522f90fd100f32534e80a4` |
| reuse-audit.json | `f7eb8874f1591a1817cae749784d14b7c3ded4e00e2a7ea11c9ec62c6c3df0d9` |
| diagnostic-protocol.json | `22936d045551f95ebfe97fc03907dcbcaa342f68487e85e96e6e1fe5f6572a97` |
| diagnostic-manifest.json | `dce521fea732d14d57b5566395ed87bae6dda263956af476fce579046cb9d53e` |
| baseline-native.json | `ab73e983bd7137b8da57e0d7a10b4ba148636b9980cfa2f63fdeeeeb0abc8ff3` |
| candidate.json | `609617bcb2504559886f35ff874d348442ef1805708dc4e3187c3457cc3b4772` |
| comparison.json | `0db2cbb585dbb48f0fc722b302d273a1d5d81f0f955de681ddb4f3aab98f26c2` |
| native-baseline | `fe5835173ad8759e4afae02a09c1673e6cc8d2883c7e013a13331fce09ce8f69` |
| ../audit_noaa_examples.py | `bb0a5a9d92403f4ee2574511483fec0d0890e263fc7ed80cce3d3a87d80c8dd3` |
| ../probe_noaa_examples.py | `934258eebf8ebd8b4558c0ec98f0463aec03cc53743b580ddac4bbda21844479` |
