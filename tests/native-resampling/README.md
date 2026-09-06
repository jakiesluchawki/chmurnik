# Research-Only Resampling Checks

This isolated adapter matches the installed Pillow 12.2.0 RGB bilinear
semantics. It is not compiled into the application. See the active task's
`native-resampling-probe.md` for the frozen protocol, measurements and limits.
The Pillow license is retained alongside `ReferenceBilinear.swift`.

From the repository root, choose new output paths to preserve prior evidence:

```sh
xcrun swiftc -O -module-cache-path build/v4-coreml-parity-module-cache \
  ios/App/App/CloudImagePreprocessor.swift \
  tests/native-recognition-parity/ReferenceBilinear.swift \
  tests/native-resampling/main.swift -o build/reference-resampling

build/reference-resampling --invalid-inputs

python tests/native-resampling/verify.py \
  --binary build/reference-resampling --output build/resampling-rgb-check

python tests/native-resampling/verify_images.py \
  --binary build/reference-resampling --output build/resampling-image-check
```

The optional `--photo-audit` path for `verify.py` must contain the seven
retained `*-native-decoded.png` diagnostic files. Without it the script
tests 320 synthetic raw RGB cases, not 327. Image integration separately
tests 96 lossless PNGs covering all EXIF orientations. These commands require
macOS/Swift and Python with NumPy/Pillow; they perform no model inference.

For original-photo model parity, compile the existing native runner with
`-D REFERENCE_BILINEAR` and the additional reference source, then pass that
binary to `ml/cloud-recognition/verify_v4_native.py --all-validation` using
the frozen research checkpoint/export. Without that explicit flag, the
runner retains its original behavior and needs no reference source.
Do not use this numerical check to waive classifier reliability gates.
