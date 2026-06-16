---
id: "0018"
title: "Fix hero overlap and scientific-name wrapping"
type: BUG
status: completed
related_adr: []
related_tasks: ["0015", "0017"]
tags: ["priority-high", "responsive", "hero", "visual-regression"]
links:
  - "https://jakiesluchawki.github.io/cloud-recognition/"
  - "https://jakiesluchawki.github.io/chmurnik/"
history:
  - date: "2026-06-16"
    status: active
    who: codex
    note: >
      Created after the product owner reported hero buttons and annotation
      text overlapping the atmospheric artwork on the public desktop layout.
  - date: "2026-06-16"
    status: active
    who: codex
    note: >
      Moved the hero artwork into document flow, removed its redundant label,
      and deployed the first correction. The task remains active after the
      product owner requested a typography audit that keeps scientific cloud
      names intact inside display sentences.
  - date: "2026-06-16"
    status: completed
    who: codex
    note: >
      Completed hero and typography corrections across both installations.
      Scientific genus names now remain intact in display text. Verification:
      63 tests, production builds, and browser checks for Cirrocumulus and
      Cumulonimbus at desktop and phone widths with zero modal overflow.
---

# Separate hero copy from artwork

## Summary

Move the hero illustration into normal document flow so headings, actions,
and artwork occupy distinct layout regions at every breakpoint.

## Acceptance Criteria

- [x] Hero headings and actions do not overlap the illustration.
- [x] No explanatory label is rendered over or beneath the clearly decorative illustration.
- [x] Desktop and phone layouts preserve the intended visual hierarchy.
- [x] Both public GitHub Pages installations receive the correction.
- [x] Automated tests and production builds pass.
- [x] Scientific genus names remain unbroken where surrounding text wraps.
- [x] Diagnostic headings avoid automatic hyphenation and arbitrary breaks.

## Implementation Notes

- The illustration now follows hero content in a dedicated `figure` element.
- Desktop and phone spacing is structural: 34 px and 28 px respectively.
- The home route suppresses the fixed test shortcut because its placement CTA
  already opens the knowledge check.
- Offline cache version `chmurnik-v2` forces existing installations to receive
  the new markup and stylesheet without affecting the legacy site's cache.
- Missing responsive guards from the legacy repository were synchronized.
- Reusable `CloudName` markup adds a Latin language hint and a non-breaking
  scientific-name token in diagnostic, comparison, detail, and test surfaces.
- Display headings now prefer natural word wrapping without automatic
  hyphenation; emergency breaking remains available for genuinely long terms.

## Design Decisions

### From Plan

1. **Use document flow instead of coordinate tuning:** The visual block follows
   the copy and actions structurally, preventing collisions at intermediate
   viewport sizes.

### Emerged

2. **Remove the decorative artwork label:** The product owner confirmed that
   the generated visual is already clearly distinct from photographic cloud
   evidence, so the extra annotation added noise without improving trust.

3. **Hide the floating test shortcut on home:** The placement CTA already
   starts a knowledge check, while the fixed shortcut could cover the hero
   artwork. It remains available on every learning and reference route.

4. **Protect the scientific token, not the whole sentence:** Only genus names
   use `white-space: nowrap`. Surrounding Polish copy remains free to wrap
   naturally, preserving readable line lengths in narrow analysis panels.

## Issues Encountered

- The fixed global “Sprawdź się” shortcut still covered the lower edge of the
  artwork after the initial layout correction. It is now omitted only on home.
- This repository lacked the previous responsive navigation and long-name
  safeguards, which were included to keep both public versions aligned.

## Broken/Modified Tests

- Added contracts for hero separation and synchronized responsive safeguards.
- Updated service-worker assertions for the namespaced cache revision.
- Added a contract for non-breaking scientific names and natural diagnostic
  heading wrapping.

## Future Work

None.
