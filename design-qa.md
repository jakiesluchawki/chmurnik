# CHMURNIK Field Companion QA

## 2026-08-26: App Store Release Candidate

- Candidate: `1.0 (20260826214336)`, task 0033. Approved felt artwork,
  authentic cloud photography, Romie/Roobert and pink/olive/violet identity
  are preserved; this is release hardening, not a visual redesign.
- Added readable in-app and standalone help/privacy information. Public
  routes passed at 320, 390 and 1440 px, including production CSP.
- Fixed native date-filter overflow, scrolled content beneath the clock and
  a legacy `field-method` class collision. New workshop disclosures use
  `field-disclosure`; the existing observer panel is unchanged.
- Reviewed five actual Release screenshots at 1320 x 2868 from an isolated
  iPhone 17 Pro Max / iOS 26.5 simulator. Evidence and SHA-256 hashes:
  `design/app-store/screenshots/`. Screens are unretouched, opaque sRGB PNGs.
- The screenshots show Today, a real saved photo/hypothesis, the Cirrus
  monograph, apparent-wind controls and the KLVM TAF timeline. Model results
  are genuine and uncertain; no fictitious weather or marketing UI is added.
- Full XCTest run `build/app-store-ui-13.xcresult` passed all four cases.
  Native library selection, the real model, two saves and relaunch persistence
  passed. A real library-to-vault file-boundary bug was fixed without loosening
  the native path guard. Nine stored test JPEGs have no source GPS/capture EXIF.
- 162 Node tests, nine lesson audits and 58 source links passed. The complete
  root-production browser flow has no page errors or CSP violations; this
  includes collection backup/edit/share/delete, reader and training flows.
- Archive signature and all 80 embedded web files were verified. Upload to
  Apple succeeded. No physical-camera, low-storage or VoiceOver pass is
  inferred from the simulator. Device acceptance remains open in 0032/0033.

## 2026-08-26: METAR / TAF Reader

- User-approved extension: recognize copied TAF without a heading, explain
  observation versus forecast, and make forecast periods interactive.
- Visual identity remains the approved pink/olive/violet, Romie/Roobert and
  restrained outlined controls. No cloud photographs or artwork changed.
- Inspected production captures in `design/qa/2026-08-26-taf/`: mobile
  probability detail and desktop timeline. Selected periods use both a visible
  outline and `aria-pressed`; temporary/probability periods have dashed markers.
- The user's exact KLVM input selects TAF, preserves four separate groups,
  shows 25 kt / gusts 40 kt only within PROB30, and has no fake observed
  temperature, pressure, or current crosswind. FM and PROB groups can be selected.
- Eight METAR/TAF scenarios now teach type, probability, FM and BECMG alongside
  the existing four cases. Incorrect answers can be replayed independently.
- Full browser flow passed in development, native-layout mode, and production
  at `/` and `/chmurnik/`, with production CSP and no page errors. Existing
  collection, backup, map, wind, atlas, all nine lessons and source routes pass.
- 320, 390 and 1440 px layouts passed overflow/control checks. Native-layout
  QA is a browser rendering, not a physical-device or new TestFlight test.
- 154 unit tests, nine lesson checks and 58 primary/provenance link checks pass.
- Scope: common TAF groups up to 30 hours; no live retrieval or operational
  clearance. Unsupported groups remain visible or stop an ambiguous timeline.
- iOS follow-up: signed archive `1.0 (20260826193304)`, SDK iOS 26.5,
  passed system signature validation and all 78 embedded web files matched
  the tested root build. Apple reports `VALID` and internal `IN_BETA_TESTING`;
  owner access verified. This does not close physical-device acceptance.
- Public App Store readiness was assessed read-only; missing metadata and
  owner/device checks are recorded in `design/app-store-readiness-2026-08-26.md`.

## 2026-08-26: iOS-First Field Companion

- Selected identity: `design/approved/chmurnik-mobile-density-v1.png`.
- Approved interaction direction: `design/ios-next-2026-08-26.md`, task 0032.
- Current captures: `design/qa/2026-08-26-field-companion/`.
- Evidence: isolated headless Brave, iOS-layout mode at 390 x 844 and
  320 x 740; web desktop at 1440 x 1000. These are not hardware-camera tests.
- Production web checks used both `/` and `/chmurnik/` with the actual
  `public/.htaccess` response headers. No page errors or CSP violations.

### Visual Findings

- The three-destination native navigation is an approved departure from
  the original five-destination concept, not a fidelity defect. The website
  keeps all five destinations and all existing lessons.
- The original Romie/Roobert, pink/olive/violet palette, outlined controls,
  licensed cloud photographs, and felt observer object remain in use.
- Home now privileges capture and a private collection. Tool/training tabs
  put controls ahead of lengthy explanation. Sources remain one tap away.
- Fixed default browser button borders in the photo grid, oversized native
  workshop headings, overly small compass labels, and wrapping source actions.
- Interactive controls remain within the viewport at 320 px. Disclosure
  sections preserve detailed scientific explanations without flattening lessons.
- Reference and current viewport images were inspected directly. A combined
  pixel-match board is not applicable to the explicitly approved navigation change.

### Functional Evidence

- Persistent photo, edit, favorite, postcard preview, export, delete and
  backup restoration passed through visible controls.
- METAR variable wind never creates a precise crosswind; missing sky data
  never becomes an absent ceiling. Wind from-direction and north references
  stay explicit. Calm air has no fabricated wind arrow.
- Twelve synthetic cases have unique answers, feedback, and retry paths.
  A wrong-answer round followed by retrying only the missed case passed.
- Two repeated photo-fixture cycles preserve the whole frame and model
  hypothesis while leaving user confirmation empty after reload.

### Remaining Acceptance

Physical iPhone camera, permission changes, backgrounding, real low storage,
VoiceOver, large text, and sunlight checks remain unverified. Internal beta
preparation is allowed; external promotion awaits that acceptance.

Current result: automated layout/function gates passed; physical acceptance open.

## Historical QA: Compact Guided Experience (2026-06-21)

- Source visual truth path: `design/approved/chmurnik-mobile-density-v1.png`
- Implementation screenshot path: `design/qa/2026-06-21-compact-guided/08-home-ios.png`
- Viewport: iPhone 17 simulator, 402 x 874 CSS px at 3x density
- State: native iOS home, first-run onboarding completed
- Full-view comparison evidence: `design/qa/2026-06-21-compact-guided/14-home-comparison.png`
- Focused region comparison evidence: not needed; the 2420 x 2622 combined comparison keeps the wordmark, typography, hero crop, action grid, guide object, and bottom navigation legible at inspection scale.

**Findings**
- No actionable P0, P1, or P2 mismatches remain.
- [P3] The production CTA is intentionally narrower than the concept CTA.
  Location: Home / `.hero-actions`.
  Evidence: the source uses a nearly full-width button; the implementation uses a compact intrinsic-width button.
  Impact: none to task completion; it gives the still life and title more air and matches the user's request for less oversized UI.
  Fix: none planned; classified as an intentional density improvement.
- [P3] The production guide area includes a second contextual recognition card.
  Location: Home / `.home-guidance-row`.
  Evidence: the source shows only the onboarding guide; the implementation adds “Sprawdź się” beside it.
  Impact: preserves access to recognition after removing Test from the primary five-item navigation.
  Fix: none planned; required by the navigation decision.

**Required Fidelity Surfaces**
- Fonts and typography: Romie is used for display text and Roobert for UI/body text. Weight, line height, wrapping, and scientific-name no-break behavior remain intact. The rendered title is slightly smaller than the concept by design and fits without collision.
- Spacing and layout rhythm: the home hierarchy, still-life crop, three-column action grid, guidance row, and five-item navigation fit inside the first iPhone viewport. Subpage headers are shorter; Layers and lessons expose their first action without ceremonial scrolling.
- Colors and visual tokens: production uses the approved pink `#ffe1eb`, olive `#6d6435`, violet action color, ivory surfaces, and restrained blue only for functional educational panels.
- Image quality and asset fidelity: the existing felt atmosphere still life remains sharp and correctly cropped. The new observer guide is a project-bound generated raster asset with AVIF/WebP delivery. Real cloud photography remains exclusive to atlas, comparison, recognition, and evidence contexts.
- Copy and content: home promise and labels match the approved direction. Onboarding copy explicitly distinguishes explanatory felt models from photographic cloud evidence.

**Patches Made Since Previous QA Pass**
- Replaced the six-item mobile navigation with five primary destinations and contextual recognition access.
- Rebuilt Home around one CTA, a compact felt still life, three destinations, and the observer guide object.
- Added optional, skippable, replayable four-step onboarding with local persistence.
- Fixed a native-only `onSources` render error found during simulator QA.
- Deferred first-run onboarding until after the first application paint.
- Moved the Windy workbench ahead of its reading protocol on mobile.
- Collapsed lesson timing and objectives behind a compact disclosure on mobile.
- Shortened native subpage headers while preserving the CHMURNIK wordmark.
- Updated PWA colors, offline cache contents, and cache version.

**Implementation Checklist**
- [x] Source and implementation compared in one combined image.
- [x] Home, onboarding, Layers, Observer, and lesson entry checked on iOS.
- [x] Fonts, spacing, colors, image quality, copy, navigation, and responsive hierarchy checked.
- [x] P0/P1/P2 findings fixed and recaptured.

**Follow-up Polish**
- Consider code splitting the largest educational workshops in a later performance-only task; it is not a visual or functional release blocker.

final result: passed
