# CHMURNIK 1.0 Release Evidence

Task 0033 follows the owner's explicit authorization to prepare and publish
the first public release. This document records preparation, not an Apple
approval or a public release. The earlier readiness audit is historical.

## Final Candidate

- Version/build: `1.0 (20260826214336)`.
- App: `6782159027`, bundle `cloud.chmurnik.app`, iPhone only.
- SDK: iOS 26.5; declared minimum iOS 15.0.
- App Store Connect build: `69a2c1f6-0803-4222-b9ab-b34e5dec5760`, `VALID`.
- Archive and upload succeeded. All 80 embedded web files match the final
  tested root build byte-for-byte. Both compiled Core ML models and the app,
  Capacitor and Cordova privacy manifests are present. No UI-test bundle or
  injected recognition fixture is embedded. Signature verification passed.
- The isolated signing keychain was re-locked after upload. The login
  keychain and desktop lock were not changed.
- The earlier uploaded candidate `20260826210814` lacks the final layout
  fixes and is superseded for this release. Do not select it for publication.

## Changes

- One reviewed source supplies the in-app help/privacy views and standalone
  `support.html` / `privacy.html`. Both hosting prefixes and offline content
  are supported. Public support uses the existing repository issue tracker,
  not an unconfirmed private email address.
- The policy reflects local model processing, optional camera/library use,
  source metadata removal, explicit sharing/export, recovery copies and OS
  backups. No accounts, analytics or photo upload to a developer/AI service.
- Fixed a real native library-to-vault failure: the library bridge can return
  a photo outside the app container. Only the local Capacitor preview is
  read and compacted into a metadata-free copy; native path checks remain.
- Fixed iOS date-field overflow, content showing under the scrolled status
  bar, and a legacy CSS class collision that obscured workshop disclosures.
- No model retraining, scientific-content expansion or accuracy claim.

## Verification

| Check | Result / Evidence |
| --- | --- |
| Node tests | 162/162, eight new; `build/app-store-tests-release-final.log` |
| Lesson quality | 9/9 modules |
| Source/provenance links | 58/58 HTTP 200; `build/app-store-links-release.log` |
| Native storage | Real Swift store tests passed migration, rollback, bounds and recovery |
| Production web | Full root/CSP flow passed; `build/app-store-web-qa-release-final.log` |
| Responsive views | 320, 390 and 1440 px; public help/privacy routes and standalone HTML |
| Native Release UI | 4/4 passed, zero failures; `build/app-store-ui-13.xcresult` |
| Native gallery | Two actual library selections, real Core ML, save, terminate and reopen |
| Stored metadata | Nine test JPEGs have no source GPS/TIFF/capture EXIF; technical encoder dimensions/color allowed |
| Screenshot integrity | Five genuine, opaque sRGB PNGs, 1320 x 2868; hashes in screenshot manifest |
| Archive | SDK 26.5, valid signature, 80 exact embedded files, no test fixtures |

Simulator: isolated iPhone 17 Pro Max on iOS 26.5. Permission denial was
tested there; no physical camera, oldest-supported-iOS, VoiceOver or real
low-storage acceptance is claimed. The store photographs use a licensed
Cirrus reference, not private user photos. See `app-store/screenshots/README.md`.

## Store Preparation Status

- Owner confirmed app-embedding licenses for both Romie and Roobert.
- Free distribution configured and verified: one zero-price Polish base
  price and 174 automatic zero prices; 175 territories enabled, no preorders.
- Apple reports missing trader status in 27 EU territories. Owner declaration
  and any requested verification remain open; no legal agreement was accepted.
- Polish metadata, five screenshots, age questionnaire, education/weather
  categories and reviewer notes are prepared in repository files. API upload
  and live support/privacy URL verification are still pending at this entry.
- Final build is `IN_BETA_TESTING` in the existing internal group. Owner
  membership is verified; Polish and English release notes are attached.
  External state is still `READY_FOR_BETA_SUBMISSION`; no external promotion.
- App Privacy answers require publication in App Store Connect's UI.
- Version 1.0 remains `PREPARE_FOR_SUBMISSION`; no App Review submission.
  Existing automatic release after approval is retained under the owner's
  request to publish. A draft build selection is not device acceptance.

## Web Delivery

- Intended support: https://jakiesluchawki.github.io/chmurnik/support.html
- Intended privacy: https://jakiesluchawki.github.io/chmurnik/privacy.html
- GitHub Pages deployment and live-route verification are pending this commit.
- Cyber_Folks ZIP: `release/chmurnik-cyberfolks-20260826214336-app-store.zip`.
- SHA-256: `545a5299746bba27a32f9297b0270dd1054cd6366fe44bef5f06ed58a1745ea2`.
- `unzip -tq` passes. The archive contains the final root build, including
  `.htaccess`, support and privacy. No hosting settings, DNS or other domains
  were changed. Cyber_Folks remains the owner's manual domain-scoped upload.

## Owner Handoff

See `app-store-owner-steps-pl.md` for phone-friendly instructions. Remaining
gates are published App Privacy answers, truthful account/EU compliance,
and exact-build physical iPhone acceptance from task 0032. Do not promote
to external TestFlight or App Review to bypass these checks.
