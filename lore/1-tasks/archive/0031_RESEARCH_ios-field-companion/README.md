---
id: "0031"
title: "Explore an iOS-first field companion"
type: RESEARCH
status: completed
related_adr: []
related_tasks: ["0026", "0030", "0032"]
tags: ["ios", "product-design", "research", "priority-high"]
links:
  - "../../../../design/ios-next-2026-08-26.md"
history:
  - date: "2026-08-26"
    status: active
    who: codex
    note: >
      The user explicitly removed the web/iOS feature-parity constraint and
      requested a fresh exploration of valuable iPhone-specific directions.
      Scope is research and proposal, not implementation or publication.
  - date: "2026-08-26"
    status: completed
    who: codex
    note: >
      Documented five current code-level constraints, a focused first iOS
      release, six optional extensions, Apple API availability and privacy
      requirements. Recorded the user's non-parity direction in AGENTS.md
      and proposed backlog task 0032. All 99 baseline tests pass unchanged.
      No app code, distribution settings, model weights, or hosted release changed.
---

# Explore an iOS-first field companion

## Summary

Review the implemented capture, recognition, learning, and journal flows,
then recommend a focused native iPhone direction grounded in current Apple
capabilities and the existing CHMURNIK identity.

## Acceptance Criteria

- [x] Read the current code and verify the deployed repository revision.
- [x] Identify concrete breaks in the capture-to-observation journey.
- [x] Verify relevant iOS capabilities against primary Apple documentation.
- [x] Record the user's new platform direction and a prioritized proposal.
- [x] Separate proposed features from implemented or empirically validated work.
- [x] Document capture limitations, privacy constraints, and compatibility.

## Design Decisions

### From Plan

1. iOS may have its own navigation, workflows, and features; web parity is
   no longer a product requirement.
2. Preserve real cloud photography, the felt-object teaching language,
   scientific uncertainty, offline use, and the existing no-audio guardrail.

### Emerged

3. Prioritize a complete capture-to-collection workflow before additional
   standalone tools. The current result dialog cannot save its photo and
   analysis directly into the journal.
4. Treat native field tools and shared reference content as separate
   architectural responsibilities; do not assume a full SwiftUI rewrite.

## Evidence And Limits

- Repository and remote main: `311218d168fbae126ba3e3bc2c046df9a652830e`.
- All 99 existing automated tests pass; no production behavior was changed.
- The browser runtime reported no available browser. `simctl` listed no
   available devices, including outside the sandbox. No fresh screenshots
   were captured; this is a code-backed product study, not a visual audit.
- No real-device usability test, sensor experiment, new ML evaluation,
   cost commitment, account change, or deployment is part of this task.

## Broken/Modified Tests

None. Existing tests were run unchanged as a baseline.

## Implementation Notes

- Saved the user-facing Polish study in `design/ios-next-2026-08-26.md`.
- Changed only the obsolete parity constraint in project instructions.
- Checked current Apple Controls, LockedCameraCapture, WeatherKit, and
  SwiftData documentation; distinguished iOS 15 baseline from newer APIs.
- Kept future image collection local by default and documented consent
  boundaries for cloud sync, weather location, and sharing.

## Issues Encountered

- Browser and simulator capture were unavailable, so no fresh visual audit
  was claimed or fabricated. Product conclusions use code evidence.
- The session pointed to an already archived task through a dangling
  symlink. Replaced only the generated session pointer and cleared it
  before archival to avoid leaving another dangling reference.

## Future Work

- Proposed backlog task 0032 contains the recommended first implementation
  slice and explicitly awaits product-owner selection.
- Recognition-data research remains in task 0026.
- Remaining feature candidates are alternatives for later selection, not
  approved or independently scheduled implementations.
