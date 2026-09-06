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

## Large Inputs and Memory

```sh
python tests/native-resampling/verify_large_images.py \
  --binary build/reference-resampling --output build/resampling-large-check

python tests/native-resampling/measure_memory.py \
  --binary build/reference-resampling \
  --source build/resampling-large-check/4032x3024-smooth-orientation1-source.png \
  --output build/resampling-memory-check
```

The large probe compares 48 synthetic originals (three sizes through 12MP,
eight orientations, two patterns) using 1800/4096px decode caps. Its pass
criterion is exact direct-reference pixels only for the 4096px arm, not
equivalence between the two caps or classification accuracy. The optional
`maximumSide` fixture field defaults to 1800. The memory script is macOS-only,
uses six fresh child processes and reports `wait4` peak resident bytes per
child, without a model or application. Do not interpret batch peaks as
single-photo peaks, or remove a production memory cap based on exact pixels.

## Actual Mac JPEG Import

The native parity runner can additionally use `-D MAC_IMPORT_JPEG` to run
the same ImageIO thumbnail/UIKit JPEG .86 block as Mac document import. It
must be built for Mac Catalyst to import UIKit. For the SDK path below,
adjust only the installed SDK version if needed:

```sh
xcrun --sdk macosx swiftc -target arm64-apple-ios15.0-macabi \
  -F /Applications/Xcode.app/Contents/Developer/Platforms/MacOSX.platform/Developer/SDKs/MacOSX26.5.sdk/System/iOSSupport/System/Library/Frameworks \
  -I /Applications/Xcode.app/Contents/Developer/Platforms/MacOSX.platform/Developer/SDKs/MacOSX26.5.sdk/System/iOSSupport/usr/include \
  -O -D REFERENCE_BILINEAR -D MAC_IMPORT_JPEG \
  -module-cache-path build/v4-native-import-module-cache \
  ios/App/App/CloudImagePreprocessor.swift \
  tests/native-recognition-parity/ReferenceBilinear.swift \
  tests/native-recognition-parity/main.swift -o build/native-mac-import-parity
```

The output includes actual encoded-input SHA256 and byte counts. Unlike
the unencoded reference arm, this arm failed the existing validation gate;
see `large-image-input-probe.md`. Neither runner changes the shipped app.
