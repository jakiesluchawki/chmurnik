---
id: "0004"
title: "Add an evidence-based field observation assistant"
type: FEATURE
status: completed
related_adr: []
related_tasks: ["0001", "0003"]
tags: ["priority-high", "effort-medium", "learning", "field-use", "release-v2"]
links:
  - "https://cloudatlas.wmo.int/en/identifying-clouds.html"
history:
  - date: "2026-06-16"
    status: active
    who: codex
    note: >
      Created after a product audit identified the gap between the deep
      encyclopedia and the learner's real-time reasoning in the field.
  - date: "2026-06-16"
    status: completed
    who: codex
    note: >
      Completed the evidence assistant, differential comparison laboratory,
      390 px and keyboard QA, five visual artifacts, 36 passing tests, and
      successful GitHub Pages deployment in run 27603323357.
---

# Add an evidence-based field observation assistant

## Summary

Replace the shallow binary identification key with a transparent observation
assistant. The tool must help a beginner collect evidence, narrow the ten WMO
genera, understand ambiguity, and decide what to observe next.

## Context

The encyclopedia is extensive, but its main identification key asks only a few
binary questions and returns broad groups without explaining how evidence was
weighted. WMO guidance emphasizes cloud dimensions, shape, structure, texture,
luminance, continuous evolution, and observing the whole sky.

## Implementation Plan

1. Add a structured field-observation model and transparent scoring engine.
2. Build a five-step mobile-first observation flow.
3. Return three ranked hypotheses with supporting and conflicting evidence.
4. Recommend the next discriminating observation when results are close.
5. Add a side-by-side comparison of the two leading hypotheses.
6. Connect the assistant to the home page, atlas, monographs, and journal.
7. Add authoritative source coverage and automated methodology tests.
8. Verify mobile and desktop layouts and publish the Pages release.

## Acceptance Criteria

- [x] The assistant records shape, element scale, light, precipitation, and
      change over time.
- [x] Every answer can be revised before or after results.
- [x] Results show three hypotheses instead of claiming certainty.
- [x] Every hypothesis explains matching and conflicting evidence.
- [x] Close results produce a useful next observation.
- [x] The two strongest hypotheses can be compared side by side.
- [x] The method is explicitly educational and cites WMO observation guidance.
- [x] The tool works comfortably at 390 px and with keyboard navigation.
- [x] The former binary key is removed rather than left as a competing method.
- [x] Automated tests cover scoring, ambiguity, and deterministic ordering.
- [x] Tests, production build, link audit, and Pages deployment pass.
- [x] Users can compare two or three genera across the same seven evidence and
      interpretation dimensions.
- [x] Every genus appears in a recommended disputed pair with a dedicated
      discriminating observation.
- [x] Monographs, field results, and hard cases link directly into comparison.

## Design Decisions

### From Plan

1. **Evidence before labels:** The tool asks about visible properties and
   temporal change before displaying cloud names.
2. **No automatic recognition:** The user remains the observer; no camera,
   upload, or model inference is introduced.
3. **Progressive disclosure:** The first pass stays approachable, while result
   explanations expose expert reasoning and uncertainty.

### Emerged

1. **Three hypotheses are journal evidence:** A result can be transferred to
   the private journal with the selected features, confidence tier, and three
   leading genera. The user still supplies place and can revise the draft.
2. **Pair-specific discriminators:** Commonly confused pairs have dedicated
   next-observation guidance; other pairs fall back to a whole-sky,
   time-series check.
3. **Release cache boundary:** The service worker cache is bumped to v2 so the
   former binary key does not remain in returning users' offline shell.
4. **Relative install metadata:** Manifest and Apple touch icon links remain
   relative in the HTML so both Vite development and GitHub Pages resolve the
   repository base exactly once.
5. **Comparison without duplicate science:** The comparison laboratory reads
   existing genus profiles through seven shared dimensions instead of creating
   a second, diverging encyclopedia.
6. **Two-to-three hypothesis limit:** Two columns support direct differential
   diagnosis; a third supports uncertain field cases without turning the tool
   into an unreadable ten-column matrix.
7. **Task-first mobile method:** The method and sources remain visible, but
   mobile spacing is compressed so the first evidence question appears in the
   opening viewport.
8. **Focus follows the reasoning step:** Advancing with keyboard or pointer
   focuses the next question heading, and the final action focuses the result
   heading. This prevents a removed button from dropping focus to the body.
9. **Contradictory morphology affects ranking:** Strong vertical development
   and glaciation now penalize layered cellular genera, keeping Cumulus as the
   meaningful alternative to Cumulonimbus.

## Implementation Notes

- Added five structured evidence questions and a deterministic weighted scoring
  engine with positive and negative signals for all ten WMO genera.
- Results expose the top three genera, supporting and conflicting evidence,
  uncertainty tier, next discriminating observation, and a visual comparison
  of the leading pair.
- Integrated the observer with the home feature strip, atlas tabs, cloud
  monographs, and private journal draft flow.
- Added the WMO `Identifying clouds` methodology source and included it in the
  automated external-link monitor.
- Added content, foundation, scoring, ambiguity, deterministic-ordering, and
  journal-draft tests.
- Published commit `c478cd1` through GitHub Pages and verified the public HTML,
  JavaScript bundle, CSS bundle, manifest, and service worker cache v2.
- Added a full differential comparison laboratory covering all ten genera,
  eight disputed-pair presets, and seven shared dimensions: appearance,
  composition, formation, evolution, weather, aviation, and diagnostic trap.
- Expanded hard cases from three to eight and connected them, monographs, and
  observer results to the comparison laboratory.
- Published commit `9c8ff81`; the GitHub Actions build and Pages deployment
  completed successfully.
- Verified the public JavaScript and CSS bundles, direct comparison route, and
  service worker cache `cloud-recognition-v3`.
- Audited the complete five-step flow at 390 px through Brave DevTools
  Protocol, including keyboard activation, focus transitions, result layout,
  and all three hypothesis cards.
- Fixed a mobile grid interaction that expanded result cards to about 972 px;
  verified each card at 350 px with a 390 px document width.
- Added lettered evidence choices, grouped question semantics, focused
  transition headings, and a test that protects the Cumulonimbus/Cumulus
  differential.
- Added mobile and desktop visual evidence under `design/qa/current/`.
- Published commit `c4bbc2d`; GitHub Pages run `27603323357` completed
  successfully and the public 390 px flow was verified against bundles
  `index-O0PoVMrJ.js` and `index-B9PWUHV5.css`.

## Issues Encountered

- The Codex in-app browser had no available browser surface. Visual QA was
  recovered through an installed Brave headless DevTools target, allowing
  actual 390 px and desktop rendering, keyboard input, DOM measurement, and
  screenshots.
- A local HTML check exposed doubled repository prefixes for install metadata.
  Relative manifest and touch-icon paths now resolve correctly in development
  and production builds.
- Comparison tests exposed a reversed `cirrus|cirrostratus` discriminator key.
  The engine previously returned generic guidance for that pair; the key now
  follows the same sorted convention as every lookup.
- Mobile result cards looked superficially clipped while the document itself
  reported no overflow. The grid track had expanded to the image's aspect-ratio
  minimum inside an overflow-hidden ancestor; explicit zero-minimum tracks and
  a mobile `min-height` reset fixed the root cause.

## Broken/Modified Tests

- Extended `content.test.mjs` to validate the five evidence classes and every
  cloud identifier referenced by scoring weights.
- Extended `foundation.test.mjs` to enforce the observer method, remove the
  binary key, verify the WMO source, and guard install metadata paths.
- Added `field-guide.test.mjs` for canonical convection, scale discrimination,
  close-pair guidance, deterministic ties, and journal drafts.
- Extended content and foundation tests to require all-ten-genus comparison
  coverage, dedicated pair discriminators, seven substantive dimensions, eight
  hard cases, and the direct `atlas/compare` route.
- Extended `field-guide.test.mjs` to require Cumulus as the second hypothesis
  for deep, glaciating convection and to protect the pair-specific next
  observation.

## Future Work

Automatic photograph recognition remains backlog task 0002.
