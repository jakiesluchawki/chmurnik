---
id: "0016"
title: "Fix atlas card corner clipping"
type: BUG
status: completed
related_adr: []
related_tasks: ["0015"]
tags: ["priority-high", "visual-regression", "atlas", "responsive"]
links: []
history:
  - date: "2026-06-16"
    status: active
    who: codex
    note: >
      Created after the product owner reported visible background wedges around
      rounded atlas images on the deployed CHMURNIK interface.
  - date: "2026-06-16"
    status: completed
    who: codex
    note: >
      Moved clipping to the image wrapper, verified 14 px desktop and 12 px
      mobile corners, passed 60 tests, 9 lesson modules, 52 external links,
      and the production build.
---

# Fix atlas card corner clipping

## Summary

Remove the mismatched clipping between atlas image elements and their rectangular
wrappers. Preserve restrained rounded corners without exposing the loading
background behind each image.

## Acceptance Criteria

- [x] Atlas images have consistent corners without background wedges.
- [x] The correction works on desktop and mobile.
- [x] Automated tests and the production build pass.
- [x] The fix is deployed to GitHub Pages from `main`.

## Implementation Notes

- `src/zgrywa.css` now applies radius and clipping to `.cloud-image-wrap`.
- The nested image has no independent radius, so the loading background cannot
  appear around its corners.
- Browser checks confirmed no horizontal overflow at 390 px and 1440 px.
- Visual raster inspection confirmed consistent corners across the atlas grid.

## Design Decisions

### From Plan

1. **Clip the image wrapper:** The wrapper owns the visible card geometry and
   clips the zooming image as one surface.

### Emerged

2. **Use restrained radii:** Atlas cards use 14 px on desktop and 12 px on
   mobile to avoid the exaggerated scooped-corner effect.

## Issues Encountered

- The earlier selector targeted `div:first-child`, but the image wrapper is a
  `span`. Only the image received a radius, exposing the rectangular blue
  wrapper at all four corners.

## Broken/Modified Tests

None expected; this is a scoped CSS correction.

## Future Work

None.
