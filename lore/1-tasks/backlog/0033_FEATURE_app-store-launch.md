---
id: "0033"
title: "Prepare and submit the first public App Store release"
type: FEATURE
status: backlog
related_adr: ["0001"]
related_tasks: ["0032", "0026"]
tags: ["ios", "release", "priority-high", "effort-medium"]
links:
  - "../../../design/app-store-readiness-2026-08-26.md"
  - "../../../design/app-store-metadata-pl-draft.json"
history:
  - date: "2026-08-26"
    status: backlog
    who: codex
    note: >
      Spawned from 0032 after the user requested an App Store readiness
      assessment. Read-only API inspection found incomplete store metadata;
      current physical-device acceptance is still open. No public submission.
---

# First Public App Store Release

## Summary

Ship a focused 1.0 without expanding the feature scope. Product value is
present; close release quality and metadata gaps before App Review.

## Context

Version 1.0 is PREPARE_FOR_SUBMISSION. Its description, screenshots,
support URL, privacy URL, category, age questionnaire, rights declaration,
copyright, review contact and selected build are missing. Published privacy
answers, account agreements, availability and EU trader status are unverified.

## Implementation

- Complete physical-device acceptance in task 0032, including migration,
  repeated camera use, permissions, offline behavior, backup and accessibility.
- Finalize the drafted Polish metadata and capture real application screenshots.
- Publish a source-accurate privacy policy and support page; expose the
  policy in-app and review privacy manifests and data flows before declarations.
- Confirm photographic attribution and embedded font rights with the owner.
- Complete category, age rating, review details, price, territories and
  account/compliance checks without accepting legal terms on the owner's behalf.
- Select the accepted build, confirm manual or automatic release mode,
  submit for review and verify Apple's actual submission/release status.

## Acceptance Criteria

- [ ] Task 0032's physical-device acceptance is recorded with build/device details.
- [ ] Required metadata, authentic screenshots and working public URLs are complete.
- [ ] Privacy, content rights and age declarations reflect verified app behavior.
- [ ] Account requirements and free/public distribution settings are confirmed.
- [ ] Appropriate release mode and final submission are approved by the owner.
- [ ] App Review submission is verified; public availability is claimed only
      after Apple approves the version and the store listing is actually available.

## Boundary

Do not promote the internal candidate to external TestFlight or App Review
as a shortcut around task 0032's device acceptance. Do not claim model
accuracy from the atlas or replace genuine cloud photography with generated images.
