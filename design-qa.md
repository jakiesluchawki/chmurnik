# CHMURNIK Compact Guided Experience QA

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
