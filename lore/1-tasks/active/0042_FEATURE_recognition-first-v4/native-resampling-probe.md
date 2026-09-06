# Native Resampling Probe

September 6, 2026. Follow-up to `coreml-reliability-parity.md`; research only.

## Protocol Before Measurement

The seven-photo diagnostic separates JPEG decoding from resizing differences.
Implement one fixed reference: the installed Pillow 12.2.0 RGB bilinear resize,
with its separable filtering, antialias support and per-pass integer rounding.
Use the same existing resize and center-crop geometry. Source:
https://github.com/python-pillow/Pillow/blob/12.2.0/src/libImaging/Resample.c
Retain its license next to the reference implementation. Do not alter the
production preprocessor, bundled models, checkpoint, labels or data splits.

First compare raw RGB synthetic fixtures against Pillow: constants, ramps,
checkerboards and seeded random pixels; square, portrait, landscape, one-pixel
axes, enlargement, reduction, unchanged axes and odd dimensions. Require
byte-for-byte equality, not an image-similarity tolerance. Also compare all
seven previously decoded audit photographs using identical source pixels.

If the pixel tests pass, compile a separate native runner with an explicit
`REFERENCE_BILINEAR` build flag. Reuse the existing FP32 calibrated kernel
export and all 452 ordered validation photographs, unchanged ImageIO decoding,
Vision inference and metadata-bound native verifier. Preserve every result.
Keep the predeclared native .05 near-tie criterion and zero non-tie/acceptance
changes requirement; also report maximum probability error and all switches.
No calibration, holdout inference, fitting or production deployment follows
from this conversion/input test. Passing does not establish cloud accuracy.

## Lossless Integration Follow-Up

The raw RGB check passed all 327 fixtures. The first full native run passes
the unchanged native decision gate, with seven near-tie switches and maximum
probability error .0708271265; this is not bit-exact original-JPEG parity.
Before accepting the adapter as a reusable research tool, test the complete
ImageIO -> RGB context -> reference resize -> CGImage crop path on 96 lossless
synthetic PNGs: 12 dimensions through 1800x1200, each with all eight EXIF
orientations. Require exact prepared RGB equality against Pillow; preserve
any failures. These fixtures isolate channel ordering, pixel orientation,
crop rounding and color-context integration from JPEG decoding and ML.

## Results

The reference implementation matches Pillow byte-for-byte on all 327 raw RGB
cases (320 synthetic cases and the seven previously decoded photographs).
All 96 complete lossless PNG/orientation cases pass too. Nine invalid shape,
allocation-size and RGB-byte-count inputs are rejected. The final fixture
runner repeats the complete positive checks after adding the negative cases.
Both default and explicitly flagged native recognition runners compile.
The default runner retains the existing CoreGraphics path; the reference
source lives under `tests/`, is not in an app target, and is not a deployment.

| 452 original validation photos | Previous native path | Reference bilinear |
|---|---:|---:|
| Any top1 differences from Torch | 15 | 7 |
| Differences outside the existing .05 near-tie margin | 3 | 0 |
| Acceptance changes | 0 | 0 |
| Maximum absolute probability difference | .216272414 | .070827127 |
| Warm median including preparation, seconds | .01798999 | .02048099 |
| Existing native decision gate | fail | pass |

This does **not** pass a .01 whole-pipeline probability bound, which is a
different, stricter measurement. No probability bound or tie tolerance was
changed. Seven top1 differences remain; they are not hidden as exact parity:

| Source ID | Torch | Reference native | Torch top-two margin |
|---|---|---|---:|
| ccsn/Ac/Ac-N137.jpg | Ac | Cc | .005386 |
| ccsn/As/As-N168.jpg | As | Cb | .005861 |
| imgw/a3cac13217fd46033c9a | St | As | .010723 |
| imgw/ab0b9e23251997313ca9 | Cb | St | .003709 |
| imgw/d036a7a878eac3297b37 | Ns | Cb | .032449 |
| imgw/16b6196354cd45bcda22 | St | Ns | .049807 |
| imgw/06f0850d2d1bf23507bd | Sc | Cb | .001977 |

Zero acceptance changes still means both runtimes accept no results under
the failed calibrated policy. It is not a reliability or usable-coverage pass.
The immutable checkpoint and all Core ML package files match the previous
FP32 probe. All 452 ordered IDs and Torch probability vectors are identical
across native arms. A separate Node recomputation checks identities, package
hashes, distributions, argmax labels, tie flags, errors and acceptance flags;
it also verifies all raw RGB comparisons and both fixture manifest/file hashes.
The existing ML/tooling suite remains 217 passed, zero skipped.

The tested lossless integration covers RGB PNGs, all EXIF orientations and
dimensions up to 1800x1200. It does not establish HEIC/HDR/wide-gamut/alpha or
physical iPhone performance, nor parity for the extra thumbnail downsampling
applied to originals larger than 1800 pixels. Remaining JPEG differences are
not solved by this reference. No fitting, labels, holdouts, production helper,
model bundles, calibration policy, app release or security setting changed.
The meteorologist remains uninvolved at the owner's request.

## Receipts

All local artifacts are under `.local/v4/dino-reliability-coreml-20260906/`.
Earlier probe outputs remain untouched.

| Artifact | SHA256 |
|---|---|
| resampling-probe-final/report.json | `8690dfaadc6dac6d476beadb47027eff36f3edd571a61a1be2ba7c5b41ec48bf` |
| resampling-image-probe-final/report.json | `0c83cfe7704547af5dcb7f0e8dc238d701bd7cf80684008507b13c473704b6e8` |
| float32-native-bilinear/report.json | `a3b4ab2d58e88299f2484d2f48e34109f435bc9dc2455e37006c49c4b4366092` |
| float32-native-bilinear/native.json | `6305c335e413d1a2495beab648509456130b0899a1fbd83c75bf88b74cd8dba6` |
| native-bilinear-parity | `474967bb2aa09810c8ba55cf437ed739211ea47be2ede4b3465178cda56a7dab` |
| reference-resampling-final | `f4a01ab9861bd8725597c63fef8d0e8e2feceaf19f12b33f3f5e77490f1b98ad` |

Reference source SHA256:
`d579aa684e1eecb69a5070128f76f729fe971d6578536d7c11e884c53b579af2`.

An initial read-status attempt using the existing shared Apple submission
helper was rejected by automatic permission review because the helper also
contains mutation branches. Re-inspected the exact source and imported API:
`check` exits at line 38 after GET-only calls, before the first PATCH at line 70.
After presenting that evidence, permission review approved the unchanged
command. Both iOS/iPadOS and macOS 1.2 remain WAITING_FOR_REVIEW with VALID
builds, freshly read at 13:29 UTC. No submission operation ran or workaround
was used; see `apple-web-release-20260906.md` for the readback timestamps.
