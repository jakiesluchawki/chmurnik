---
id: "0022"
title: "Ship the CHMURNIK iOS app to TestFlight"
type: FEATURE
status: active
related_adr: []
related_tasks: ["0015", "0017", "0021"]
tags: ["priority-high", "ios", "testflight", "design", "release"]
links:
  - "https://chmurnik.cloud"
history:
  - date: "2026-06-19"
    status: active
    who: codex
    note: >
      Started a focused iOS release that preserves the complete existing
      CHMURNIK feature set and applies the approved editorial design to a
      native application shell without adding product scope.
---

# Ship the CHMURNIK iOS app to TestFlight

## Summary

Package the current CHMURNIK application for iPhone, make the existing
interface feel deliberate on iOS, verify its complete feature set, and upload
the first build to TestFlight.

## Acceptance Criteria

- [x] The iOS app contains the current production feature set without new modules.
- [x] The app uses the approved Romie/Roobert CHMURNIK design language.
- [x] Safe areas, status bar, navigation, dialogs, scrolling, and keyboard use are correct.
- [x] The app works from its bundled assets without depending on the public website.
- [x] App icon, launch experience, display name, version, and bundle identifier are release-ready.
- [x] Automated web tests, lesson audit, production build, and iOS build pass.
- [x] Representative iPhone sizes pass visual and interaction QA.
- [ ] A signed build is uploaded to App Store Connect and reaches TestFlight processing.

## Implementation Notes

- Added a Capacitor 8 iOS application that bundles the production Vite output.
- Added native status-bar, safe-area, splash, modal, and bottom-navigation
  handling without changing the product's routes or modules.
- Added deterministic icon and launch-asset generation from the current
  CHMURNIK visual system.
- Added a reproducible signed archive and TestFlight upload command with Apple
  Account and App Store Connect API-key authentication paths.
- Verified the current production design on iPhone 17 Pro Max and iPhone 17e
  simulators. The obsolete first-pass screenshot was removed from release QA.

## Design Decisions

### From Plan

1. **Preserve product scope:** The release packages and refines the existing
   application. It does not add recognition, accounts, audio, or new lessons.
2. **Use the current editorial identity:** Romie, Roobert, the pink/olive
   palette, atmospheric photography, and existing information architecture
   remain the visual source of truth.

### Emerged

1. **Bundle the web application instead of loading `chmurnik.cloud`:** This
   preserves offline behavior, makes the release independent of hosting, and
   keeps native review deterministic.
2. **Generate one modern 1024 px icon:** Xcode produces all required masks and
   sizes from the unmasked source; rounded corners are left to iOS.
3. **Keep one source of product truth:** iOS-specific code is limited to shell
   behavior and release metadata. Content and interactions remain shared with
   production.

## Issues Encountered

- The first icon exploration referenced a superseded QA screenshot. It was
  rejected and replaced with an asset grounded only in the current pink/olive
  production design.
- The first simulator pass exposed a white status-bar band and excessive bottom
  navigation height. Native overlays and safe-area rules corrected both.
- The signed `1.0` archive for build `202606191636` succeeded. Upload stopped at
  `IDEDistributionUploadAccountStep` because Xcode has no Apple Account with App
  Store Connect access for team `78N6WG8P57`. The archive remains available
  locally and the release script also supports an App Store Connect API key.

## Broken/Modified Tests

- Added foundation assertions for native configuration, safe-area rules,
  release metadata, and current-brand asset generation.
- No existing test was disabled or weakened.

## Future Work

- Upload the signed build after authenticating Xcode for team `78N6WG8P57` or
  supplying an App Store Connect API key, then archive this task.
