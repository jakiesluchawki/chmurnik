---
id: "0033"
title: "Prepare and submit the first public App Store release"
type: FEATURE
status: active
related_adr: ["0001"]
related_tasks: ["0032", "0026"]
tags: ["ios", "release", "priority-high", "effort-medium"]
links:
  - "../../../design/app-store-readiness-2026-08-26.md"
  - "../../../design/app-store-metadata-pl-draft.json"
  - "../../../design/app-store-release-2026-08-26.md"
  - "../../../design/app-store-owner-steps-pl.md"
history:
  - date: "2026-08-26"
    status: active
    who: codex
    note: >
      Prepared privacy/help, five authentic store screenshots and final
      candidate 20260826214336. Fixed native gallery-to-vault saving and
      three layout issues found in real Release simulator flows. 162 Node
      tests and four native UI cases pass. Archive uploaded and VALID;
      store metadata upload and physical/account acceptance remain open.
  - date: "2026-08-26"
    status: active
    who: codex
    note: >
      The user explicitly authorized completing metadata and publishing.
      Activate release preparation and submission; do not invent device
      acceptance, font rights or account/legal declarations. Coordinate
      the open physical-device checks from 0032 as part of this release.
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
- [x] Final candidate archive, privacy manifest and authentic screenshots are verified.
- [x] Owner confirmed app-embedding rights for both fonts; photograph credits retained.
- [ ] Privacy, content rights and age declarations reflect verified app behavior.
- [ ] Account requirements and free/public distribution settings are confirmed.
- [ ] Appropriate release mode and final submission are approved by the owner.
- [ ] App Review submission is verified; public availability is claimed only
      after Apple approves the version and the store listing is actually available.

## Boundary

Do not promote the internal candidate to external TestFlight or App Review
as a shortcut around task 0032's device acceptance. Do not claim model
accuracy from the atlas or replace genuine cloud photography with generated images.

## Owner Confirmations

- 2026-08-26: the owner confirmed purchasing licenses for both Romie and
  Roobert in response to the app-embedding rights question. Receipts are
  available in their email; no mailbox inspection was needed or performed.
- Public support email and current physical-device acceptance remain
  unconfirmed. The public repository issue tracker is an existing contact
  channel; do not publish a private mailbox without the requested answer.
- Owner requested step-by-step instructions for remaining actions. The
  Polish handoff explains App Privacy, EU status and exact-build device checks.

## Implementation And Verification

- Shared privacy/help data drives offline in-app routes and standalone HTML
  pages at either hosting prefix. No account, analytics or upload was added.
- Native library images are copied from a strictly local Capacitor preview
  through the existing complete-frame compaction helper. Camera file handling
  and the native container path guard remain unchanged.
- Added four information-page tests and four native-photo boundary tests.
  All 162 Node tests, nine lesson audits and 58 provenance links pass.
- Full production-root browser QA passes collection, backup, reader, training,
  all public routes and 320/390/1440 layouts with no CSP/page errors.
- Four real Release XCTest cases pass together: reader/navigation, help,
  denied camera plus two gallery/model/save/relaunch cycles, and store screens.
- Candidate `20260826214336` is uploaded and `VALID`; all 80 embedded web
  files match the tested root build. Signature/privacy/model checks pass.
- Five unretouched 1320 x 2868 screenshots retain honest model uncertainty
  and licensed real cloud photography. Source/hash manifest is committed.
- Free price verified for 175 territories. EU trader status is missing for
  27; App Privacy publication and owner account declarations remain open.
- Internal TestFlight assignment and owner access are verified for the exact
  final candidate, `IN_BETA_TESTING`, with Polish/English notes. External beta
  was not changed. Live Pages and store metadata/screenshots upload remain.

## Issues Encountered

- The native photo-library bridge returns an outside-container file. The
  classifier could read it but the vault correctly rejected it. A bounded
  local preview copy fixes saving without weakening the security boundary.
- Native date inputs exceeded their grid column. Explicit minimum grid
  sizing and the existing date appearance pattern keep controls in bounds.
- Scrolled native content reached beneath the clock; a safe-area backdrop
  fixes it below modal layers. New disclosure class names avoid an old
  observer-panel background/text style collision.
- A zero-test filtered XCTest run was not counted. The corrected filter and
  bounded scroll gesture were followed by a complete four-case passing run.
- No signed-in browser session was available. App Store Connect API handles
  supported fields; private UI declarations remain with the owner.

## Broken/Modified Tests

- Foundation assertions now exclude help/privacy from the floating quiz and
  include their HTML in no-cache headers. These are intentional new routes.
- The browser QA now checks standalone policy/help and disclosure contrast.
- UI screenshots use real application output, not the earlier browser-only
  capture fixture. Native camera hardware is still not claimed as tested.

## Design Decisions

### From Plan

1. Keep the existing typography and product identity. Add source-accurate
   support and privacy information, not new product features.

### Emerged

2. Generate standalone public HTML pages and in-app content from one data
   file. Use relative links so the same package works at both hosting paths.
3. Disclose migration/recovery copies and OS backups explicitly. Deleting a
   current observation is not represented as deleting every historical copy.
4. Use the existing public GitHub issue tracker for support instead of
   publishing an unconfirmed private mailbox. Reviewer contact stays private.
5. Keep the vault's file boundary strict and copy only local library previews.
   Fix the integration point instead of accepting arbitrary native paths.
6. Preserve automatic release after approval under the explicit publication
   request, but do not submit before device/privacy/account gates are closed.
