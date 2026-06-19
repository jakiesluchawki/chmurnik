---
id: "0021"
title: "Polish the production GUI"
type: FEATURE
status: completed
related_adr: []
related_tasks: ["0015", "0018", "0020"]
tags: ["priority-high", "accessibility", "responsive", "performance", "design"]
links:
  - "https://chmurnik.cloud"
history:
  - date: "2026-06-19"
    status: active
    who: codex
    note: >
      Started after a production GUI audit identified a small set of
      high-impact accessibility, responsive, and loading improvements.
  - date: "2026-06-19"
    status: completed
    who: codex
    note: >
      Shipped the accessibility, responsive, and asset-delivery polish pass.
      All 68 foundation tests, 9 lesson checks, 55 link checks, the production
      build, and local desktop/mobile smoke checks passed.
---

# Polish the production GUI

## Summary

Apply a restrained production polish pass without changing Chmurnik's visual
identity or information architecture.

## Acceptance Criteria

- [x] Small text, controls, and focus indicators meet practical AA contrast.
- [x] Interactive microcopy remains legible across responsive layouts.
- [x] Header behavior is consistent between tablet and mobile breakpoints.
- [x] Horizontally scrollable tabs and filters expose their affordance.
- [x] Toggle-like atlas filters expose their selected state semantically.
- [x] Home imagery and licensed fonts load substantially fewer bytes.
- [x] Desktop and mobile layouts retain the approved Romie/Roobert design.
- [x] Tests, production build, and live smoke checks pass.

## Implementation Notes

- Split functional purple from the brighter decorative purple and strengthened
  body, label, border, and focus colors without changing the approved palette.
- Added compact tablet header behavior, mobile-safe navigation dimensions, and
  visible edge affordances for horizontally scrollable tabs and filters.
- Added semantic `aria-pressed` states to atlas and wind-height selectors.
- Added responsive AVIF/WebP picture sources for the home hero and workshop
  cards, with original images retained as fallbacks.
- Added WOFF2 versions of the licensed Romie and Roobert fonts, with their OTF
  files retained as fallbacks.
- Removed an obsolete hero image from the service-worker shell and bumped the
  application cache to `chmurnik-v6`.
- Recorded the audit and its evidence in `audit/gui-2026-06-19/README.md`.

## Design Decisions

### From Plan

1. **Preserve the approved design language:** Corrections should be visually
   subtle and must not turn into another redesign.
2. **Separate functional and decorative accents:** Controls use a darker
   accessible purple while large display accents may retain the brighter
   signature purple.
3. **Prefer progressive media enhancement:** AVIF and WebP are delivered through
   `picture`, while existing PNG/JPEG files remain compatible fallbacks.
4. **Keep licensed typography resilient:** WOFF2 is the primary web format and
   the original OTF files remain local fallbacks.

### Emerged

1. **Limit scroll-edge shadows to compact layouts:** Browser QA showed the
   affordance was unnecessary on wide layouts, so it is enabled at 900 px and
   below only.
2. **Prune the service-worker shell while changing media delivery:** The old
   decorative hero was no longer used, so retaining it in the shell would have
   wasted cache storage.

## Issues Encountered

- The first tablet-range assertion was too dependent on CSS declaration order;
  it was replaced with a scoped media-block assertion.
- In-app screenshot capture timed out during one QA pass. Layout, overflow,
  computed styles, loaded resource formats, and console state were verified
  directly in the browser instead.
- Vite still reports the existing warning for a JavaScript chunk above 500 kB;
  this pass did not change the application architecture.

## Broken/Modified Tests

- Extended `tests/foundation.test.mjs` from 66 to 68 tests.
- Added assertions for WOFF2 font delivery, optimized home media, accessible
  theme contrast, responsive scroll affordances, and semantic selected states.
- Updated the service-worker cache-version assertion from v5 to v6.

## Future Work

No follow-up is required for this scoped polish pass. JavaScript route splitting
remains a possible architectural optimization if bundle size becomes a measured
loading bottleneck.
