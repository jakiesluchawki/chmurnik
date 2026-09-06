# Research Mac JPEG Import

This command-line Catalyst utility reproduces the ImageIO/UIKit preparation
used by `CloudRecognizerPlugin.documentPicker`: transformed thumbnail capped
at 1800px, then JPEG quality .86. It does not open a picker or user library,
start an app, perform recognition, fit a model or change production code.

Compile from the repository root using the installed macOS SDK:

```sh
xcrun --sdk macosx swiftc -target arm64-apple-ios15.0-macabi \
  -F /Applications/Xcode.app/Contents/Developer/Platforms/MacOSX.platform/Developer/SDKs/MacOSX26.5.sdk/System/iOSSupport/System/Library/Frameworks \
  -I /Applications/Xcode.app/Contents/Developer/Platforms/MacOSX.platform/Developer/SDKs/MacOSX26.5.sdk/System/iOSSupport/usr/include \
  -O -module-cache-path build/v4-native-import-module-cache \
  tests/native-mac-import/main.swift -o build/native-mac-import-export
```

The two arguments are an input JSON array of `{ "id": "...", "path": "..." }`
and a new output directory under an existing parent. Existing output is
rejected. Sequential JPEG filenames are bound to original IDs and source/file
SHA256 in `receipts.json`; never infer labels from filenames. A partial failed
export is not a complete dataset. The training harness validates receipts
and original frozen-source identities before using the images.

The bounded experiment has a fixed, task-local protocol, not a general training
CLI. Run with the retained artifacts and a new output directory:

```sh
PYTHONPATH=ml/cloud-recognition python ml/cloud-recognition/probe_v4_mac_import.py \
  --manifest .local/v4/data-v2/manifest.json \
  --checkpoint .local/v4/dinov2-reliability-calibrated/cloud-genus-net.pt \
  --control .local/v4/dinov2-reliability-v2 \
  --raw-features .local/v4/dinov2-imgw-linear \
  --importer build/native-mac-import-export \
  --output build/mac-import-training --device mps
```

Only frozen train/validation data are used. A completed output cannot be
overwritten; interrupted feature extraction resumes only with the identical
recipe, import receipts, IDs and feature identity. Choose CPU in a fresh
experiment directory if Metal is unavailable, and record that hardware change.
The script never creates a deployable checkpoint or marks release approved.
See `mac-import-training-probe.md` in active task0042 for the scientific gates,
results and source limitations. Photographs and feature caches stay local.
