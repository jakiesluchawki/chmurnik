# Reliability Candidate: Core ML Numerical Probe

September 6, 2026. Research-only conversion, not classifier approval or an
application update. Freeze this recipe before either conversion or comparison.

## Fixed Protocol

- Use the existing calibrated `dinov2_vits14_kernel` checkpoint at
  `.local/v4/dinov2-reliability-calibrated/cloud-genus-net.pt`, SHA256
  `1b8c30b1c319abf259e99ed1a27387c451863a6cd158533ea5431bdbaf2c2195`.
  Its 4,650 support vectors, temperature1.689385474860335 and failed
  abstention policy remain unchanged. This is not the older V1 conversion
  candidate whose33-photo FP16 probe failed with maximum error.02145.
- Frozen V2 manifest SHA256, checked directly against the checkpoint and file:
  `d5b0ca33e0867bbb0d0fd25dbd08fc20cfeea316a89299e53f63a6bee5d0ea1c`.
- Two declared arms only: FLOAT16 and FLOAT32, using the existing ATEN
  converter, fixed positional encoding and explicit `--research-only`.
  Preserve both results; do not replace the bundled production models.
- Compare all452 validation rows, ordered by class and original manifest
  order. Use the existing224px evaluation transform and exactly the same
  RGB input pixels in Torch and Core ML. No calibration/test/confirmation
  images, new fitting, temperature changes or classification measurements.
- Preserve the existing maximum absolute probability error <=.01 and no
  non-tie top1 change criteria. A tie does not waive the probability bound.
  Reject malformed/non-finite distributions, and bind each report to the
  checkpoint, package files, manifest, input pixels and verifier hashes.
- Record package size, load/first/warm inference timing on this host.
  This is not an iPhone benchmark or original-camera preprocessing parity.
  Successful conversion cannot repair the failed classification/coverage
  gates or authorize an Apple upload.

## Identical-Pixel Result

The first conversion failed at ATEN `clamp_min`: an integer0 bound conflicted
with a floating-point input. A minimal kernel-only conversion test reproduced
the failure. Changing only the bound to0.0 fixes conversion and retains exact
eager outputs in three tested batch sizes. Both full exports then completed.

| All452 validation inputs | FLOAT16 | FLOAT32 |
|---|---:|---:|
| Maximum probability error | .1269027293 | .00003468990 |
| Any top1 changes | 27 | 0 |
| Non-tie top1 changes | 23 | 0 |
| Numerical gate | fail | pass |
| Package bytes | 50,816,637 | 101,319,433 |
| Warm median inference, seconds | .00525546 | .01380729 |
| Warm p95 inference, seconds | .00603360 | .01572342 |
| Model load, seconds | 7.31106 | .88266 |
| First inference, seconds | .05841 | 2.14002 |

Timings are sequential local macOS/Core ML ALL observations, not phone timings
or a controlled cache/cold-start benchmark. `/usr/bin/time -l` measured maximum
resident sizes614,219,776 and861,487,104bytes for the complete Python processes,
which include Torch, Core ML and verification data, not model-only app RAM.

An independent Node recomputation verifies all452 ordered IDs, identical input
pixel hashes and Torch probabilities across arms, all numeric differences,
argmax changes, pass/fail flags and actual package file hashes/sizes.
Reports: `.local/v4/dino-reliability-coreml-20260906/{float16,float32}/parity.json`.
SHA256: FP16 `4107c70ce0c9ac6c0ccfe153a63f639a3e93f8273ed818c1e75c2e1bc1e784d6`;
FP32 `1559d7d56865fed1cf8acd7ed5fb0ebfe511593468c1fc7403502c2a46c527a6`.

## Native Follow-Up Protocol

After the identical-pixel result and before native inference, select the only
passing export (FLOAT32) for the existing original-photo ImageIO/CoreGraphics/
Vision runner. Include all452 validation rows, with no new cases or fitting.
Use `CloudImagePreprocessor`224px/.902 geometry and retain the native verifier's
existing.05 near-tie margin, reporting every difference and decision change.
This geometric comparison is distinct from the strict.01 identical-RGB bound;
do not change either criterion after results. Record the binary/package/input
and report provenance. This runner is candidate-preprocessor research, not an
updated app/plugin or a physical iPhone camera test.

## Native Result and Input Diagnostic

The original-photo run completed all452 cases:15 total top1 changes, including
three outside the unchanged.05 near-tie tolerance. Maximum probability error
is.2162724137; the native gate **fails**. Zero acceptance changes is not a
positive reliability result because this candidate's failed policy accepts
nothing in either runtime. Warm median including native image preparation is
.01798999seconds on this host. The production image helper/plugin is unchanged.

Non-tie differences:

| Source ID | Torch | Native |
|---|---|---|
| imgw/470a8af925ffc2118adf | Cirrostratus | Cirrus |
| ccsn/Ns/Ns-N190.jpg | Stratus | Nimbostratus |
| imgw/b7dd4937b13ccf475440 | Stratus | Altostratus |

Selected a subsequent seven-photo pixel diagnostic: those three cases, the
three largest numeric differences and the first ordered control. This is
failure analysis, not another accuracy benchmark. Saved native-decoded and
native-prepared PNGs with the unchanged helper, plus PIL counterparts.
The same-decoded-image resize comparison isolates resampling differences from
JPEG decoding. Across these seven cases, mean RGB differences are.050-.191
levels for decoding,.063-.546 for resampling, and.093-.589 end-to-end on the
0-255 scale. Some pixels differ by up to26 levels. Geometry/dimensions match;
none of these originals exceeds640pixels, so the1800px thumbnail limit is not
the cause in this sample. This does not prove which individual pixel change
causes a classification switch. It exposes sensitivity to realistic input
pipeline differences; do not hide it by widening ties or changing labels.

An independent Node recomputation verifies the complete native report and its
agreement with the FP32 export identity/package hashes. Retained artifacts:

| Artifact under `.local/v4/dino-reliability-coreml-20260906/` | SHA256 |
|---|---|
| float32-native/report.json | `9c818a4a3418468d5e033123bf413ca69e5c6843a2f50b09de4c5cb2b2c99618` |
| float32-native/native.json | `859f77b3fa4df6cc8792d0c15e381c33d3e3d8726bf967bc9230410145944159` |
| native-parity | `1cc85b45ed4bee65c19d51132186ecd1014088f59aaaf663787e24e98951de26` |
| input-audit/comparison.json | `48a0fb7b0ce548c584e7c6b268281c0e3f7c57ecbd2b8da37bbbe1411c3af9ef` |

All217 ML/tooling tests pass, zero skips, including ten new checks covering
export identity, invalid probabilities and the kernel conversion regression.
No fitting, source-label changes, holdout inference, app build, deployment or
Apple submission occurred. The numerical FP32 conversion problem is resolved
for these identical validation inputs; native input robustness and classifier
reliability remain unsatisfied. Keep the candidate experimental and the full
goal open. The owner explicitly deferred involving the meteorologist again
on September6. Do not contact a reviewer or describe model/self-assessments
as independent expert labels. The33-photo pack remains prepared but unreviewed.
