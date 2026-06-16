---
id: "0013"
title: "Build a validated WMO nomenclature workshop"
type: FEATURE
status: active
related_adr: []
related_tasks: ["0003", "0005", "0012"]
tags: ["priority-high", "atlas", "taxonomy", "active-learning", "mobile"]
links:
  - "https://cloudatlas.wmo.int/en/cloud-classification-summary.html"
  - "https://cloudatlas.wmo.int/en/principles-of-cloud-classification-mother-clouds.html"
  - "https://cloudatlas.wmo.int/en/flammagenitus.html"
  - "https://cloudatlas.wmo.int/en/homogenitus.html"
  - "https://cloudatlas.wmo.int/en/homomutatus.html"
  - "https://cloudatlas.wmo.int/en/cataractagenitus.html"
  - "https://cloudatlas.wmo.int/en/silvagenitus.html"
history:
  - date: "2026-06-16"
    status: active
    who: codex
    note: >
      Created after the expert-depth audit found that the encyclopedia lists
      formal taxonomy layers but does not teach learners to assemble, test,
      and justify a complete WMO cloud name.
  - date: "2026-06-16"
    status: active
    who: codex
    note: >
      Implemented and locally verified the workshop. All 57 automated tests,
      nine lesson audits, 49 external links, the production build, and
      headless Brave QA at 1440 x 1000 and 390 x 844 pass. Public Pages
      verification remains.
---

# Build a validated WMO nomenclature workshop

## Summary

Add an interactive workbench to the encyclopedia that constructs a complete
WMO cloud name, validates genus compatibility and contradictions, and clearly
separates visible morphology from names that require observed history or a
known source process.

## Context

The encyclopedia already contains 49 taxonomy concepts and genus-level
compatibility. Its current formula remains passive, however: it does not
explain that one species may be used, multiple varieties and supplementary
features may coexist, `translucidus` conflicts with `opacus`, or that
`genitus`, `mutatus`, and special-cloud suffixes cannot usually be justified
from one still image.

## Implementation Plan

1. Encode nomenclature sequence, genus compatibility, variety conflicts,
   mother-cloud origins, and special-cloud rules as pure data.
2. Implement a pure builder and validator with explicit valid, conflict, and
   history-required results.
3. Add a five-step interactive workbench above the encyclopedia index.
4. Include source-backed presets that demonstrate a normal valid name, a
   contradiction, a mother-cloud name, and special-cloud exceptions.
5. Explain every result in plain Polish and preserve expert precision.
6. Add responsive styling without introducing a new visual language.
7. Add automated content and behavior tests, then run full local and public
   verification.

## Acceptance Criteria

- [x] A learner can choose one genus, an optional species, multiple varieties,
      supplementary features, accessory clouds, and an origin suffix.
- [x] Only terms compatible with the chosen genus are offered.
- [x] `translucidus` plus `opacus` produces a visible contradiction while
      `perlucidus` remains compatible with either.
- [x] Mother-cloud and special-cloud suffixes are marked as requiring
      observation history or known causal context.
- [x] The fresh-contrail exception allows only `Cirrus homogenitus` without
      species, varieties, or supplementary features.
- [x] Genitus and mutatus choices use the genus-specific names already stored
      in the encyclopedia profiles.
- [x] Presets teach at least four materially different nomenclature cases.
- [x] The workbench is keyboard-accessible and has no horizontal overflow at
      390 px.
- [x] Existing atlas search, term index, comparison, and monographs remain
      intact.
- [ ] Automated tests, lesson audit, link audit, production build, Brave QA,
      and public GitHub Pages verification pass.

## Design Decisions

### From Plan

1. **Teach validation, not concatenation:** The result must explain why a name
   is accepted, contradictory, or dependent on unseen history.
2. **Keep conflicts selectable:** Invalid combinations remain interactive so
   the learner can discover and understand the rule.
3. **Treat origin as evidence:** Names ending in `genitus`, `mutatus`, or a
   special-cloud term receive a distinct epistemic status because a single
   frame rarely establishes their formation history.
4. **Keep the workbench inside the encyclopedia:** It should bridge the full
   index and genus monographs without adding another crowded atlas tab.

### Emerged

5. **Represent the fresh contrail as a separate origin case:** It still
   formats as `homogenitus`, but its WMO rule prohibits species, varieties,
   and supplementary features. Keeping it distinct from other human-made
   clouds makes that exception testable and explainable.
6. **Use a native origin selector:** A genus can expose many `genitus`,
   `mutatus`, and special-cloud choices. A select remains readable and
   efficient on a narrow phone while the visual morphology terms stay as
   direct manipulation buttons.
7. **Expose special-cloud genus scope in the term index:** The original five
   records had empty compatibility lists. The same source-backed scope now
   drives both the validator and the encyclopedia cards.
8. **Add direct source records for origins:** Mother-clouds, special clouds,
   and aircraft contrails now open their exact WMO pages instead of relying
   only on the general principles page.

## Broken/Modified Tests

- Added nomenclature unit tests for formatting, compatibility, conflicts,
  historical evidence, selection normalization, special-cloud scope, and the
  contrail exception.
- Added foundation checks for the interactive workshop, accessible controls,
  result states, and offline cache version.

## Implementation Notes

- Added a pure nomenclature model with genus-filtered options, complete-name
  formatting, conflict detection, origin evidence state, and four teaching
  presets.
- Added the five-step workshop directly above the formal term index.
- The live result separates formal validity from epistemic support and
  explains every selected layer.
- Added exact WMO source records for mother-clouds, special clouds, and
  aircraft condensation trails.
- Updated all five special-cloud taxonomy records with their compatible
  genera and direct sources.
- Bumped the offline cache to `cloud-recognition-v15`.
- Updated the product README.

## Issues Encountered

- **In-app browser unavailable:** The configured browser surface was not
  available in this thread. Visual and interaction QA used local headless
  Brave through an existing Playwright runtime instead.
- **Atlas tab is local UI state:** Direct navigation to
  `#/atlas/encyclopedia` opens the atlas default tab. QA therefore navigated
  to the atlas and selected the `Indeks · 49` tab explicitly.
- **Evidence typography inherited uppercase styling:** A broad selector also
  affected the checkbox explanation on mobile. It was narrowed to the origin
  select label only.

## Verification

- 57 automated tests pass.
- All nine learning modules pass the lesson quality audit.
- All 49 source and photograph pages pass the link monitor.
- Production build succeeds.
- Headless Brave reports no console errors, failed requests, or horizontal
  overflow at 1440 x 1000 and 390 x 844.
- Interactive QA confirms the contradiction, evidence-required, confirmed,
  fresh-contrail, genus-reset, and multi-feature Cumulonimbus paths.

## Future Work

No follow-up was required to complete this feature.
