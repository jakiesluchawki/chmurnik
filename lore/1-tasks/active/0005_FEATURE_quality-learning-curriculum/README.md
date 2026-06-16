---
id: "0005"
title: "Replace lesson summaries with an honest learning curriculum"
type: FEATURE
status: active
related_adr: []
related_tasks: ["0003", "0004"]
tags: ["priority-high", "learning", "content-depth", "accessibility", "release-v3"]
links:
  - "https://aviationweather.gov/help/data/"
  - "https://www.faa.gov/regulationspolicies/handbooksmanuals/aviation/faa-h-8083-28b-aviation-weather-handbook"
history:
  - date: "2026-06-16"
    status: active
    who: codex
    note: >
      Created after user review showed that lesson durations promised 12-35
      minutes while the visible modules contained only short summaries.
---

# Replace lesson summaries with an honest learning curriculum

## Summary

Turn all nine advertised learning modules into complete, source-backed lessons
whose duration is earned by real reading, examples, practice, and assessment.
Add an adaptive review loop and a reusable lesson-building skill so future
content cannot regress to decorative duration labels.

## Context

The learning path looked polished, but a 26-minute METAR/TAF module consisted
of three short paragraphs and a generic exercise. The mismatch damaged trust
and made the course materially shallower than the encyclopedia.

## Implementation Plan

1. Define a reusable lesson schema with outcomes, time plan, chapters, recap,
   module-specific practice, and assessment.
2. Write full lessons for all nine modules using authoritative sources.
3. Make recognition practice expose genus-level mastery and pair-specific
   differential feedback.
4. Add focus trapping, Escape handling, and focus restoration for dialogs.
5. Create and validate a project-local lesson-building skill.
6. Verify content, timing, links, build, mobile reading rhythm, and Pages.

## Acceptance Criteria

- [x] Every module has at least four substantive, sourced chapters.
- [x] Advertised duration equals named learning activities.
- [x] Reading allocations pass a credible words-per-minute audit.
- [x] Every module has a unique structured practice and completion condition.
- [x] Every module has a four-choice check with reasoning feedback.
- [x] The learning page exposes mastery for all ten cloud genera.
- [x] Wrong recognition answers explain the confused pair and link to compare.
- [x] Dialogs trap focus, close with Escape, and restore prior focus.
- [x] A versioned `build-quality-lesson` skill enforces the content contract.
- [ ] The expanded lessons read comfortably at 390 px and on desktop.
- [x] Automated tests, skill audit, link audit, build, and Pages deployment pass.

## Design Decisions

### From Plan

1. **Duration is a contract:** Minutes describe learner activity actually
   present in the product, not the perceived importance of the topic.
2. **Mechanisms over summaries:** Lessons explain causality, distinctions, and
   limitations before asking for recall.
3. **Practice completes the lesson:** Reading alone does not consume the full
   duration; observation, decoding, calculation, or comparison earns the rest.

### Emerged

4. **Words-per-minute gate:** A first content audit showed that named reading
   time was still inflated after prose expansion. The skill now enforces a
   bounded rate for technical Polish prose with note-taking.
5. **Feedback updates the skill selectively:** General lesson-quality feedback
   changes the reusable skill automatically; one-off content defects remain in
   the project task and lesson.
6. **Project-local skill:** The skill lives in `.codex/skills/` so it is
   versioned and available from another computer with the repository.

## Implementation Notes

- Added a full curriculum data model for nine modules.
- Added module-specific practices and knowledge checks.
- Added adaptive genus mastery, weakest-genus practice, and pair feedback.
- Added reusable dialog focus management.
- Added a skill contract and deterministic lesson audit script.
- Published commit `4170fa7` through GitHub Pages workflow `27601306176`
  and verified the live bundle contains the expanded curriculum.

## Issues Encountered

- The Product Design browser surface remained unavailable, so current rendered
  screenshots must be captured through an available browser before release.
- The skill validator required PyYAML; validation ran with an isolated
  temporary dependency rather than changing project dependencies.

## Broken/Modified Tests

- Extended content tests to enforce chapter depth, source validity, honest
  timing, practices, assessments, and adaptive mastery.
- Extended foundation tests to guard the full lesson UI and keyboard-safe
  dialog behavior.

## Future Work

Automatic photograph recognition remains backlog task 0002.
