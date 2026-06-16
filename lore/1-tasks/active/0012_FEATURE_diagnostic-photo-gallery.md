---
id: "0012"
title: "Teach within-genus variation with a diagnostic photo gallery"
type: FEATURE
status: active
related_adr: []
related_tasks: ["0003", "0005", "0011"]
tags: ["priority-high", "atlas", "photography", "active-recall", "mobile"]
links:
  - "https://cloudatlas.wmo.int/en/identifying-clouds.html"
history:
  - date: "2026-06-16"
    status: active
    who: codex
    note: >
      Created after the product audit found that the 30-photo corpus improves
      randomized assessment but remains hidden from deliberate study: every
      monograph still presents only one lead photograph.
  - date: "2026-06-16"
    status: active
    who: codex
    note: >
      Implemented and locally verified the gallery: 52 tests, nine lesson
      audits, 46 link checks, production build, and Brave QA at 1440 x 1000
      and 390 x 844 pass. Public Pages verification remains.
---

# Teach within-genus variation with a diagnostic photo gallery

## Summary

Turn each genus monograph into a small visual study set. Learners should be
able to move through three materially different frames, pause before reading
the answer, and then reveal the exact visual evidence and photograph
provenance.

## Context

The application now tests each genus on three photographs, which prevents
memorizing one JPEG. However, the atlas itself still teaches from one lead
image. A beginner cannot deliberately compare how the same genus changes with
species, viewpoint, illumination, mixed layers, and development stage.

## Implementation Plan

1. Add a reusable diagnostic gallery to every cloud monograph.
2. Preserve the current lead image and editorial hero.
3. Show one large study frame with a three-image selector.
4. Reset the analysis when the learner changes frames.
5. Ask for a short observation before revealing the frame-specific clue.
6. Show note, author, license, and direct Commons page after the reveal.
7. Support previous/next controls, keyboard focus, narrow phones, and reduced
   motion without adding new remote dependencies.
8. Validate the interaction, image coverage, responsive layout, and public
   deployment.

## Acceptance Criteria

- [x] Every genus monograph exposes all three curated photographs.
- [x] The stable lead photograph remains the first hero and first gallery item.
- [x] Changing a frame hides its diagnostic explanation until requested.
- [x] Revealed analysis includes the frame-specific clue, context note, author,
      license, and Commons page.
- [x] Previous, next, and thumbnail controls are keyboard-accessible and have
      meaningful accessible names.
- [x] The gallery has no horizontal overflow at 390 px and remains visually
      legible on desktop.
- [x] Existing recognition, atlas, comparison, and source behavior remains
      intact.
- [ ] Automated tests, lesson audit, link audit, production build, Brave QA,
      and public GitHub Pages verification pass.

## Design Decisions

### From Plan

1. **Study variation inside the monograph:** The gallery belongs beside the
   genus explanation, not in a detached image library, so every frame stays
   connected to morphology, physics, and differential diagnosis.
2. **Observation before explanation:** Each frame opens with a short active
   recall prompt. The diagnostic clue is revealed only after the learner has
   had a chance to inspect the image.
3. **Reuse the licensed corpus:** The feature uses the real photographs and
   metadata already verified in task 0011; no synthetic assessment imagery or
   remote hotlinking is introduced.

### Emerged

4. **Keep one persistent reveal control:** The show/hide button remains the
   same DOM control across states. This preserves keyboard focus after
   revealing the answer instead of dropping focus when a button is replaced.
5. **Reset analysis on every frame change:** Thumbnail and arrow navigation
   both return to the observation prompt, preventing the previous photograph's
   explanation from being mistaken for the new frame.
6. **Use a split study desk on large screens and a vertical field card on
   phones:** The same content becomes image-plus-analysis columns at desktop
   width and a single scrolling column at 390 px.

## Broken/Modified Tests

- Add foundation checks for the gallery, reveal interaction, and accessible
  controls.
- Keep the existing corpus validation as the source of truth for image count
  and provenance completeness.

## Implementation Notes

- Added a reusable `DiagnosticPhotoGallery` to every genus monograph.
- The gallery uses the 30 local, licensed photographs from task 0011 without
  adding network dependencies or duplicate metadata.
- Every frame begins with a 15-second observation prompt and only then reveals
  the image-specific diagnostic cue, context note, author, license, and source.
- Added previous, next, and three thumbnail controls with accessible labels,
  pressed state, expanded state, and a persistent keyboard focus target.
- Bumped the offline cache to `cloud-recognition-v14`.
- Updated the product README to expose the gallery as a core learning feature.

## Issues Encountered

- **DevTools object serialization limit:** The first Brave QA script attempted
  to return too much page state in one protocol object and hit an object-chain
  limit. The retry measured small primitive values independently; no
  application error was involved.
- **Author credit spacing:** Rendering the credit as a flex text container
  visually removed the space after `Fot.`. The text now uses normal inline
  flow while the external link remains inline-flex.
- **Reveal focus loss risk:** The first implementation replaced the reveal
  button with a new hide button. It was refactored to one persistent control,
  and Brave confirms focus remains on it before and after the state change.

## Verification

- 52 automated tests pass.
- All nine learning modules pass the lesson quality audit.
- All 46 source and photograph pages pass the link monitor.
- Production build succeeds.
- Brave reports no console errors, failed responses, or horizontal overflow at
  1440 x 1000 and 390 x 844.
- The reveal control retains keyboard focus, source credit spacing is correct,
  and selecting a new thumbnail restores the hidden observation state.

## Future Work

No follow-up has emerged yet.
