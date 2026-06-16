---
id: "0019"
title: "Add upper-atmosphere photography"
type: FEATURE
status: completed
related_adr: []
related_tasks: ["0015", "0018"]
tags: ["priority-high", "home", "atlas", "photography", "licensing"]
links:
  - "https://commons.wikimedia.org/wiki/File:Noctilucent-clouds-msu-6817.jpg"
  - "https://commons.wikimedia.org/wiki/File:Nacreous_clouds_Antarctica.jpg"
  - "https://commons.wikimedia.org/wiki/File:Polar_Stratospheric_Cloud_type_I_above_Cirrus.jpg"
history:
  - date: "2026-06-16"
    status: active
    who: codex
    note: >
      Created after the product owner requested replacing the visually heavy
      Cumulonimbus workshop image with a more beautiful noctilucent-cloud scene.
  - date: "2026-06-16"
    status: completed
    who: codex
    note: >
      Replaced the home workshop image and completed the broader audit by
      adding distinct licensed photographs to all three upper-atmosphere
      entries. Verification: 66 tests, lesson audit, 55-link audit, production
      build, and desktop and phone browser checks in both installations.
---

# Add upper-atmosphere photography

## Summary

Replace the right-hand home workshop photograph with a licensed noctilucent
cloud scene and add photographic evidence to every upper-atmosphere atlas term.

## Acceptance Criteria

- [x] The right-hand workshop card shows noctilucent clouds.
- [x] Every upper-atmosphere term includes a distinct, licensed photograph.
- [x] Photo attribution and a direct source link appear below each atlas image.
- [x] Creator, license, source page, and crop treatment are recorded.
- [x] The photograph remains legible at desktop and phone card sizes.
- [x] Both GitHub Pages installations receive the new asset.
- [x] Tests, link audit, and production builds pass.

## Implementation Notes

- The home workshop uses the Laboe noctilucent-cloud photograph at 1920x1280.
- Nacreous, polar stratospheric, and noctilucent term dialogs now show
  photographic evidence before the definition.
- Credits and direct Commons links are rendered below the image rather than
  over it.
- All three local assets are included in the offline application shell.

## Design Decisions

### From Plan

1. **Use a real licensed photograph:** The card represents evidence from the
   atmosphere, so a Wikimedia Commons photograph is preferred over generated
   artwork.

### Emerged

2. **Complete the whole upper-atmosphere set:** The audit found that all three
   standalone upper-atmosphere entries were text-only. Adding a photograph to
   only Noctilucent clouds would have left the same content gap in the adjacent
   Nacreous and Polar stratospheric cloud entries.

3. **Use a type I PSC image for the general entry:** This avoids presenting
   every polar stratospheric cloud as a strongly iridescent nacreous cloud.

## Issues Encountered

- Full-page screenshots do not trigger every lazy image immediately; the
  workshop was therefore checked after scrolling it into the live viewport.

## Broken/Modified Tests

- Added data contracts requiring image, alternative text, author, license,
  Commons page, and paired classification/photo sources for every
  upper-atmosphere entry.
- Added UI and service-worker contracts for the new photographic evidence.

## Future Work

None.
