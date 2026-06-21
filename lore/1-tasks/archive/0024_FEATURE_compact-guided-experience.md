---
id: "0024"
title: "Build the compact guided CHMURNIK experience"
type: FEATURE
status: completed
related_adr: []
related_tasks: ["0021", "0022", "0023", "0025"]
tags: ["priority-high", "product-design", "onboarding", "ios", "web", "deployment"]
links:
  - "../../../design/approved/chmurnik-mobile-density-v1.png"
  - "../../../design/audits/2026-06-21-density-onboarding/AUDIT.md"
history:
  - date: "2026-06-21"
    status: active
    who: codex
    note: >
      Started implementation after the owner approved the clean compact mobile
      direction with restrained felt-object guidance and no sky photography on
      the home surface.
  - date: "2026-06-21"
    status: completed
    who: codex
    note: >
      Shipped the compact guided experience to web main and TestFlight build
      202606211426. Verification covered 73 automated tests, 9 lesson audits,
      55 external links, root and Pages builds, native simulator QA, and an
      approved external TestFlight release.
---

# Build the compact guided CHMURNIK experience

## Summary

Condense the existing CHMURNIK web and iOS experience without removing its
editorial identity or educational depth. Add optional first-run guidance,
promote felt studio objects as explanatory wayfinding, and keep real cloud
photography exclusive to evidence and recognition contexts.

## Acceptance Criteria

- [x] The mobile home matches the approved compact visual target.
- [x] Primary home actions fit in the first typical iPhone viewport.
- [x] Bottom navigation contains five primary destinations; testing remains accessible contextually.
- [x] First-run onboarding is optional, skippable, replayable, and stored locally.
- [x] Layers, Field Observer, and lessons expose their first meaningful action without a ceremonial full-screen preamble.
- [x] Cloud evidence, comparison, and recognition continue using only real photographs.
- [x] New felt assets explain concepts and navigation without impersonating photographic evidence.
- [x] Web, lesson, link, and iOS verification passes at representative sizes.
- [x] GitHub Pages and Cyber_Folks deployment can run from one tested release workflow.
- [x] The approved iOS build is uploaded to TestFlight after production QA.

## Implementation Plan

1. Establish compact page-header and spacing tokens.
2. Rebuild Home and bottom navigation from the approved visual target.
3. Add first-run onboarding and contextual help replay.
4. Compact the Layers, Field Observer, and lesson entry states.
5. Add project-bound felt guidance assets and asset-policy tests.
6. Run responsive and native visual QA.
7. Automate and verify both public deployments, then release TestFlight.

## Design Decisions

### From Plan

1. **Direction 1 is the structural source:** Preserve its calm hierarchy and
   single primary action.
2. **Object guidance comes from direction 3:** Use isolated felt objects as
   wayfinding details, not as a layered onboarding overlay.
3. **Photography is evidence:** Real cloud imagery remains mandatory in the
   atlas, recognition, comparison, and diagnostic galleries.

### Emerged

4. **Keep recognition contextual:** Removing Test from the primary navigation
   required a small home action and the existing contextual test triggers.
5. **Lead with the tool on mobile:** The Windy workbench precedes its reading
   protocol, while lesson logistics collapse into an optional disclosure.
6. **Package Cyber_Folks locally:** The host has no non-interactive deployment
   credential on this machine, so `npm run release:web` creates a verified ZIP
   in the owner-preferred local folder without touching other hosted domains.

## Issues Encountered

- Native simulator QA exposed a missing `onSources` prop after the Home
  signature was simplified. A temporary visible error probe isolated the
  reference error; the prop was restored and the probe removed before release.
- The first external TestFlight submission was approved immediately because
  the app and external group already had approved beta-review metadata.

## Broken/Modified Tests

- Added foundation coverage for five-item navigation, persistent onboarding,
  mobile tool ordering, lesson disclosure, release packaging, and the new
  compact observer asset.
- No existing test was disabled or weakened.

## Future Work

- Split the largest specialist workshops into lazy-loaded chunks in task 0025;
  the current warning does not block use.
