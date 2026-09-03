---
id: "0034"
title: "Adapt CHMURNIK for iPad and Mac Catalyst"
type: FEATURE
status: completed
related_adr: ["0001", "0002"]
related_tasks: ["0032", "0033", "0035"]
tags: ["ipad", "macos", "priority-high"]
links:
  - "https://developer.apple.com/documentation/uikit/creating-a-mac-version-of-your-ipad-app"
history:
  - date: "2026-09-03"
    status: active
    who: codex
    note: >
      Owner explicitly requested implementation for iPad and macOS and took
      over WWW deployment. Preserve the existing iPhone app, offline learning,
      photo privacy and collection. No App Store submission is authorized by
      this implementation task alone.
  - date: "2026-09-03"
    status: completed
    who: codex
    note: >
      Implemented universal iPad and Mac Catalyst support. 184 Node tests,
      nine lesson audits, five iPad and two iPhone simulator tests pass.
      Real Mac import/model/persistence/export/restore verified. Final iOS
      archive refreshed successfully; WWW, local Mac and unsigned device
      ZIPs verified. ADR 0002 records the shared implementation; 0035 owns
      physical-device acceptance and signed distribution.
---

# iPad And Mac

## Summary

Extend the existing Capacitor/UIKit application to iPad and Mac Catalyst,
with usable wide layouts and keyboard navigation. Reuse the scientific
content and native collection rather than creating another web-only wrapper.

## Implementation

- Check the current Capacitor and native-camera dependencies for Catalyst.
- Enable iPad orientation/resizing and a separate Mac build destination.
- Preserve phone navigation; use wide-screen space for learning and tools.
- Verify photo selection, on-device recognition and sharing per platform.
- Produce local builds and exercise real simulator/Mac flows where available.

## Acceptance Criteria

- [x] Universal iPhone/iPad build succeeds with the current native plugins.
- [x] Mac Catalyst app builds and launches; dependencies support its platform.
- [x] iPad portrait/landscape and resizable Mac layouts remain usable.
- [x] Native navigation supports keyboard input without stealing text editing.
- [x] Atlas, lessons, report reader, wind and collection pass regression checks.
- [x] Photo/backup/sharing behavior and untested hardware limits are recorded.
- [x] Owner receives builds or precise build/distribution boundaries.

## Design Decisions

### From Plan

1. Preserve the approved identity and content. Keep WWW upload independent;
   the owner has `chmurnik-cyberfolks-20260903-web-v3.zip`.

### Emerged

2. Try Mac Catalyst first: the current app already uses UIKit, WKWebView and
   Core ML, so a shared target avoids duplicating collection and photo logic.
   Compatibility is a build/test question, not an assumption of readiness.

3. Capacitor 8.4.1's distributed XCFrameworks contain device/simulator iOS
   slices only. Its official source Xcode projects support Catalyst and built
   successfully. `scripts/build-macos.mjs` pins commit
   `7217b5215a175eededf607a216e0cab2a8450a34`, builds local frameworks and
   generates an isolated app project. It never patches node_modules or the
   original iPhone package graph. SwiftPM accepts the local root override.
4. Mac defaults to a system document picker for a user-selected image, not
   a camera or mandatory Photos library. Import is size-limited, downsampled,
   orientation-corrected and re-encoded before local recognition.

## Verification

- 184 Node tests pass; all nine modules pass the lesson audit.
- Official Capacitor/Cordova Catalyst frameworks compile (arm64/x86_64).
- Initial Mac app build found a generated debug.xcconfig path issue; fixed
  without changing the iOS project. Mac build launches and passes real native
  image import/model/save/relaunch, lesson, report, backup export/import and
  sharing-panel checks. One labeled atlas fixture remains in the test app.
- Five iPad simulator tests and two iPhone regression tests pass. Browser QA
  covers 42 viewport/route combinations, keyboard protection and the full
  functional suite against a production build. See design-qa.md for evidence.
- Dedicated iPad simulator: C0F90697-AB42-4E15-9C8C-4A0F4084C048.
- No App Store upload, account change or physical-device acceptance is
  inferred from building or simulator tests.

## Issues And Emerged Decisions

- iPad-only foundation assertions changed deliberately to universal family
  1,2, iPad landscape and scene lifecycle; iPhone portrait remains unchanged.
- Native header transforms caused overlapping hit targets; removed. The old
  five-column mastery grid overflowed intermediate widths; made adaptive.
- Mac backup export now saves to a user-selected location, while postcards
  keep system sharing. JSON import uses a native size-limited copy, followed
  by the unchanged parser and non-overwriting merge. No broad disk permission.
- Dev-server QA timed out; the production-build functional run passed.
- Exec/apply_patch later hit an open-file limit. Continued with the available
  independent Node runtime and the same apply_patch CLI; no Remote restart.
- The normal executor later recovered long enough to refresh the final
  Release iPhone/iPad archive successfully (exit 0). The archive contains
  device families 1,2, iPad icons and final web asset index-Bl612cgV.js.
  A redundant Node-REPL test attempt timed out; a subsequent normal runner
  completed all 184 tests with zero failures. The lesson audit also passed.

## Handoff Artifacts

All paths below are relative to the repository, ignored, and CRC-verified.

- WWW: release/chmurnik-cyberfolks-20260903-web-v3.zip (22765014 bytes).
  SHA-256: cd3858fd4922eb48d72d43f4d9ed1473f4d1f87cc03940826a982214419ee375.
  Owner uploads contents to domains/chmurnik.cloud/public_html, including
  .htaccess, after backing up the existing site. No DNS change needed.
- Mac: release/chmurnik-macos-local-test-20260903.zip (38480716 bytes).
  SHA-256: 7ced5b698f03f8d57d6f32fde7556ca8414000d5a070673f448e754c6f13675a.
  Contains CHMURNIK.app and Polish instructions. Universal arm64/x86_64,
  tested on arm64, ad-hoc signature verified. Not notarized or store-ready.
- Device archive: release/chmurnik-iphone-ipad-unsigned-20260903.zip
  (43272862 bytes). SHA-256:
  2d3f821120039048ab680454b7b23fdb388c1425a095fb80f041a3a4739070e0.
  Contains the final unsigned xcarchive and Polish distribution boundaries.
  It is not an installable IPA. Version/build remain 1.0/1 pending release.

## Future Work

- Physical-device and distribution acceptance is tracked in 0035, including
  Intel runtime, multi-part backup stress, signing, screenshots and Apple upload.
