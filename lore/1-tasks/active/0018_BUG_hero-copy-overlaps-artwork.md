---
id: "0018"
title: "Separate hero copy from artwork"
type: BUG
status: active
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
---

# Separate hero copy from artwork

## Summary

Move the hero illustration into normal document flow so headings, actions,
and artwork occupy distinct layout regions at every breakpoint.

## Acceptance Criteria

- [ ] Hero headings and actions do not overlap the illustration.
- [ ] No explanatory label is rendered over or beneath the clearly decorative illustration.
- [ ] Desktop and phone layouts preserve the intended visual hierarchy.
- [ ] Both public GitHub Pages installations receive the correction.
- [ ] Automated tests and production builds pass.

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

## Issues Encountered

None yet.

## Broken/Modified Tests

None yet.

## Future Work

None.
