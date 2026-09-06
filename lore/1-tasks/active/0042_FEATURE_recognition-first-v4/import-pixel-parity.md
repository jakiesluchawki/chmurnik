# Imported JPEG: Pixel-Bound Parity

September 6, 2026. Fixed diagnostic before execution; not a training trial,
classifier approval or application change. Follow `large-image-input-probe.md`
and `coreml-reliability-parity.md` without changing their original gates.

## Question

The prior native import comparison intentionally includes raw-photo to UIKit
JPEG .86 recompression. Its four non-tie differences remain a valid end-to-end
robustness failure. A read-only comparison against previously cached Torch
predictions for the same encoded JPEGs leaves nine switches, one non-tie and
maximum probability error .09404886. That cache used Metal features, so this
alone does not attribute the remaining difference to decoding or inference.

## Frozen Procedure

- Use all452 development validation rows, unchanged labels and order. No
  calibration, holdout, private-feedback photos, training or expert outreach.
- Keep calibrated checkpoint SHA256
  `1b8c30b1c319abf259e99ed1a27387c451863a6cd158533ea5431bdbaf2c2195`,
  its temperature and failed abstention policy. Keep the existing FLOAT32
  research Core ML package, verified against its saved parity receipt.
- Validate the frozen V2 manifest and every source/import receipt. Native
  inference reads the previously encoded JPEG directly, with NO second JPEG
  encoding, using the unchanged reference bilinear adapter and1800px cap.
- Extend only the test runner with an optional new output directory. Record
  the actual prepared CGImage RGB bytes, excluding row padding, and save that
  same CGImage as PNG before Vision receives it. Bind the prediction to source
  JPEG hash/size, PNG hash and RGB hash. Reject existing output directories.
- Require Python-decoded PNG pixels to match the native RGB receipt exactly.
  Evaluate raw-photo, imported-JPEG and prepared-RGB arms in Torch on CPU.
  The last arm uses ToTensor only, with no additional crop/resize. All arms
  share the same unchanged checkpoint and CPU backend.
- Report the full input chain: raw->imported, imported->prepared,
  prepared->Vision, imported->Vision and raw->Vision. Preserve every top1
  switch, maximum probability error and both .01/.05 non-tie classifications.
  Strict inference parity keeps the existing .01 probability bound and .01
  near-tie criterion. Native decision comparisons keep the existing .05
  criterion; neither proves cloud correctness or useful accepted coverage.
- Compare fresh Vision output to the old imported-native receipt and raw CPU
  output to its historical reference. Report deviations rather than silently
  replacing evidence. Record binaries, sources, package and input hashes.
- This test may isolate the unresolved input issue, not certify the complete
  model. Even exact prepared-pixel inference parity cannot waive raw-photo
  robustness, the failed classifier reliability gate or device/format QA.

## Result

All452 native CGImage RGB receipts match their Python-decoded PNG pixels
exactly. Fresh CPU raw-photo probabilities and fresh Vision imported-photo
probabilities reproduce their historical counterparts exactly, including
the original four non-tie end-to-end failures. No historical test was waived.

| Comparison, all452 | Max probability error | Top1 changes | Non-tie changes, .05 |
|---|---:|---:|---:|
| Raw photo -> imported JPEG, both CPU/Pillow | .1538454294 | 14 | 5 |
| Imported JPEG/Pillow -> native-prepared RGB, both CPU | .0940536559 | 9 | 1 |
| Identical native RGB, CPU -> Vision/Core ML | .00002741814 | 0 | 0 |
| Imported JPEG, CPU/Pillow -> Vision | .0940458179 | 9 | 1 |
| Raw photo/CPU -> imported photo/Vision | .1691061258 | 11 | 4 |

The strict identical-pixel inference gate passes. The complete imported-photo
pipeline still fails its unchanged native decision gate. The one same-JPEG
non-tie case remains `imgw/c2b6416c7103d8d00266`. The preparation difference is
measured before ML, with both prediction arms on CPU; it is not merely an
inference-backend rounding discrepancy. This bounds the fault to import/image
preparation for this pipeline and checkpoint, not to a particular JPEG decoder
operation or a general claim about all device/format combinations.

This removes another conversion hypothesis. The next input work must address
actual prepared-pixel compatibility and JPEG robustness, not another FP32
export or a relaxed tie threshold. The failed classification reliability gate
remains a separate issue; none of these comparisons establishes correct cloud
labels or authorizes replacement of the shipped classifier.

The full run took51.10seconds on this host, including native preparation,
PNG recording and1,356 CPU inferences; not a device latency benchmark.
Independent NumPy/Pillow replay rechecked all452 source/encoded/PNG/pixel
identities, package and source hashes, historical vectors and all seven
comparison reports. Seven focused and all303 ML/tooling tests pass, zero skips.
Both the default native runner and explicitly flagged reference runner compile.

The first sandboxed attempt ended before predictions because Core ML could
not create its compilation working directory. It is preserved in
`.local/v4/import-pixel-parity-20260906/`. After reviewed elevation the same
test completed in `.local/v4/import-pixel-parity-20260906-reviewed/`; no host
security setting, network call, user photo or screen automation was involved.

| Artifact | SHA256 |
|---|---|
| report.json | `2f8e752b85577b79f71209f677fce639e790ffaa9d1f0ad6906b53f887cd55ba` |
| native.json | `a1711ef3ab3f855e740f2ea4192f7c50ce3d98cc09483b5846e9fc522451311f` |
| recipe.json | `045ea76e9fb3b20476894f21e42883e9021fa53969097998674a9b009d3fd441` |
| native-pixel-receipts runner | `83a399524b40bf67a1d2df057ea8570f6aff9aaa9186593d16318e5f75a3d15f` |
| independent verifier .local/v4/verify_import_pixels.py | `12640f7650ac6b04d76368fcbab4de246c464d5d502a739fb0a7d43112d90013` |

The runner is compiled with `xcrun swiftc -O -D REFERENCE_BILINEAR`, the
production `CloudImagePreprocessor.swift`, the research `ReferenceBilinear.swift`
and `tests/native-recognition-parity/main.swift`. Its optional fifth argument
is a fresh prepared-PNG directory; the historical four-argument form retains
its original inference path and does not emit prepared images.
