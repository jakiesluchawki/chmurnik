---
id: "0010"
title: "Build a practical Windy layer decoder"
type: FEATURE
status: active
related_adr: []
related_tasks: ["0005", "0007"]
tags: ["priority-high", "weather", "windy", "vertical-profile", "assessment", "mobile"]
links:
  - "https://community.windy.com/topic/3361/description-of-weather-overlays"
  - "https://www.windy.com/articles/38548"
  - "https://confluence.ecmwf.int/plugins/viewsource/viewpagesrc.action?pageId=158636068"
history:
  - date: "2026-06-16"
    status: active
    who: codex
    note: >
      Created after an audit found that the vertical-atmosphere lesson was
      substantive, but the practical Layers tool only demonstrated one
      pressure surface and did not teach how to read common Windy overlays.
---

# Build a practical Windy layer decoder

## Summary

Turn the Layers page into a practical, source-backed interpreter for common
Windy overlays. A beginner should be able to select a field and understand
what question it answers, what its units and reference frame mean, what other
fields must be compared, and which tempting conclusion is not justified.

## Context

The existing lesson already explains AGL, MSL, geopotential height, model
terrain, cloud-base and cloud-top distinctions, and comparison across pressure
levels. The practical interface exposes only a terrain slider and six pressure
levels. This leaves a gap between knowing the terminology and reading a real
weather application.

## Implementation Plan

1. Create one structured corpus for eight commonly confused overlays.
2. Add a four-question reading protocol before any layer-specific detail.
3. Reuse the terrain and pressure experiment inside the relevant overlays.
4. Add explicit handling for low, medium, and high cloud bands.
5. Generate a plain-language interpretation sentence from the current state.
6. Add comparison guidance, a common trap, sources, and one four-choice check
   per overlay.
7. Verify mobile layout, keyboard focus, source links, offline cache, and the
   public GitHub Pages build.

## Acceptance Criteria

- [x] The Layers page opens with a practical Windy decoder.
- [x] At least eight common overlays have substantive, source-backed guidance.
- [x] Pressure-level fields explain that hPa is not a fixed AGL altitude.
- [x] High terrain can trigger an explicit model-terrain warning.
- [x] Cloud bands explain percentage cover and their approximate vertical
      ranges without presenting them as exact cloud bases.
- [x] Cloud base and cloud tops state their different reference and product
      meanings.
- [x] CAPE is taught as conditional potential rather than storm probability.
- [x] Every overlay names useful comparison fields and one common trap.
- [x] Every overlay has four unique, plausible answer choices and explanatory
      feedback.
- [ ] Automated tests, lesson audit, link audit, production build, mobile QA,
      desktop QA, and public Pages verification pass.

## Design Decisions

### From Plan

1. **A decoder, not a Windy clone:** The app teaches transferable reading
   habits and does not embed the Windy map or use its API.
2. **One question before one color:** Every layer starts with the meteorological
   question it can answer, then gives units and reference frame.
3. **Interpretation is a sentence:** Controls generate a complete statement
   rather than leaving learners to infer meaning from isolated numbers.
4. **Comparison is mandatory:** Every record includes adjacent fields or
   observations needed to avoid a single-layer conclusion.
5. **Assessment lives beside the explanation:** Each layer includes a
   four-choice reasoning check with immediate feedback.

### Emerged

6. **The decoder is the default Layers tab:** The previous height experiment
   remains available, but opening with the decoder makes the page fulfill its
   promise before asking a beginner to discover a specialist subtool.
7. **One data corpus drives content and tests:** Layer definitions, source IDs,
   comparison prompts, traps, and answer choices live outside the component so
   coverage can be validated without scraping rendered prose.
8. **Approximate pressure heights remain visibly approximate:** The interface
   generates an AGL teaching value but switches to an explicit terrain-
   intersection warning instead of clamping the value to zero.
9. **Cloud products remain separate learning objects:** Bands, base, and tops
   were not collapsed into one cloud record because they answer different
   questions and invite different operational mistakes.

## Broken/Modified Tests

- Add corpus validation for source IDs, substantive guidance, and four unique
  choices.
- Add pure interpretation tests for pressure surfaces, high terrain, cloud
  bands, cloud base, and CAPE.
- Extend foundation checks for the new decoder and service-worker cache.

## Implementation Notes

- Added eight records: wind, temperature, humidity, low/medium/high cloud
  bands, cloud base, cloud tops, rain and thunderstorms, and CAPE.
- Added pure pressure-surface and interpretation helpers shared by the UI and
  automated tests.
- Added a four-step reading protocol, responsive layer picker, pressure and
  terrain controls, cloud-band controls, complete interpretation sentences,
  comparison guidance, traps, sources, and assessed feedback.
- Registered four additional source records and extended the automatic link
  monitor from 22 to 26 verified destinations.
- Bumped the offline cache to `cloud-recognition-v12`.
- Added six mobile and desktop visual QA captures under `design/qa/current/`.

## Issues Encountered

- **In-app browser unavailable:** The product-design browser surface returned
  no browser instance. QA continued in a clean local Brave session through the
  Chrome DevTools protocol.
- **Programmatic range input bypassed React:** Directly assigning `input.value`
  did not exercise the controlled component. QA used the native value setter
  and dispatched an input event, confirming the 1800 m terrain state.
- **SI unit inherited uppercase styling:** The first visual pass rendered
  metres as `M MSL`. Numeric values now opt out of the uppercase annotation
  style and render `m MSL`.
- **Browser requested a root favicon:** The first public pass was functionally
  clean but logged `/favicon.ico` as a 404. The document now declares the
  existing 192 px project icon with a Pages-relative path.

## Verification

- 50 automated tests pass, including two new decoder suites.
- All nine lessons pass the quality audit.
- All 26 external destinations pass HTTP and semantic-marker checks.
- Production build succeeds.
- Mobile QA passed at 390 x 844 with exact document width of 390 px.
- Desktop QA passed at 1440 x 1000 with the intended three-column workbench.
- Keyboard focus moves to answer feedback after a committed choice.
- Public GitHub Pages verification remains before completion.

## Future Work

No follow-up is required within this scope. Live map integration and automatic
cloud recognition remain outside the free, privacy-preserving version-one
boundary and automatic recognition is already tracked in backlog task 0002.
