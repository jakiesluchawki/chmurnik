---
id: "0033"
title: "Prepare and submit the first public App Store release"
type: FEATURE
status: blocked
by: ["0032"]
related_adr: ["0001"]
related_tasks: ["0032", "0026"]
tags: ["ios", "release", "priority-high", "effort-medium"]
links:
  - "../../../design/app-store-readiness-2026-08-26.md"
  - "../../../design/app-store-metadata-pl-draft.json"
  - "../../../design/app-store-release-2026-08-26.md"
  - "../../../design/app-store-owner-steps-pl.md"
  - "../../../social/2026-08-30/README.md"
  - "../../../social/2026-09-03/README.md"
  - "../../../social/2026-09-03-full/README.md"
history:
  - date: "2026-09-03"
    status: blocked
    who: codex
    note: >
      Owner took over Cyber_Folks upload and received the verified root ZIP.
      No hosting login or upload should block the requested iPad/Mac work
      in task 0034. The original release retains the outstanding broader
      physical-device acceptance dependency in 0032; no Codex task archived.
  - date: "2026-09-03"
    status: active
    who: codex
    note: >
      Owner requested WWW-first LinkedIn/Facebook posts and deployment to
      chmurnik.cloud as well as Pages. Prepared complete captions, domain
      artwork and six V3 packages without changing fast films, approved
      Stories, Instagram carousel or LinkedIn PDF. Added a compact web-only
      App Store note and static social preview. All 182 tests, nine lesson
      audits, source links, builds and full root app flow pass. Live domain
      was an older August 23 build; root-hosting release is kept separate
      from Pages and is not claimed deployed before authentication succeeds.
      Pages commit a1f824e and workflow 33692193674 are now successful;
      public gallery and full application tests pass. Root hosting still
      requires owner iCloud/panel authentication; the old domain lacks the
      new pasted-report reader, so WWW-first posting must wait for upload.
  - date: "2026-09-02"
    status: active
    who: codex
    note: >
      Owner rejected the initial social videos as slow and incompletely
      captioned. Replaced all ten with silent 6-8 second promo edits, 49
      source-backed shots and the entire approved copy visible on every
      frame. All shot midpoints visually reviewed; OCR checks 49 decoded
      shots and 21 JPGs. Six ZIPs rebuilt with V2 cache-busted downloads.
      179 tests, nine lesson audits, Pages build, full app flow, all three
      galleries and the unchanged PDF checks pass. No social posting or
      physical-device acceptance claimed; the broader task remains active.
  - date: "2026-09-02"
    status: active
    who: codex
    note: >
      Owner approved ten complete Stories and requested full Instagram,
      LinkedIn and Facebook adaptations. Produced ten silent MP4 Stories
      (six genuine app walkthroughs), ten alternative JPGs, ten carousel
      slides, a ten-page LinkedIn PDF, Facebook art, full platform copy,
      ten sticker links and six download ZIPs. All 178 tests, nine lesson
      audits, production build, full app flow and all three galleries pass.
      PDF pages and final media were rendered/inspected. No social account
      posting, physical iPhone share test or account-level DSA change claimed.
      Task remains active for the separate hardware acceptance boundary.
  - date: "2026-09-02"
    status: active
    who: codex
    note: >
      Prepared five origin-story Stories for September 3 from the owner's
      account: glider pilot in the family, PPL study, clouds, METAR, Windy,
      then sailing. Included two real-workshop silent MP4 demos and five
      JPGs. Owner approved the existing mobile download-gallery format and
      authorized a dated public pack; the original launch assets remain.
      169 tests, lesson audit, complete browser flow and both gallery
      download/copy contracts pass. Physical iPhone sharing is not inferred
      from simulated JPEG/MP4 share tests. Private analytics stay excluded.
  - date: "2026-09-02"
    status: active
    who: codex
    note: >
      Polish public availability and free pricing are confirmed; Apple reports
      READY_FOR_SALE and 175 AVAILABLE territories after the owner's app-level
      non-trader declaration. Replaced the waiting announcement with five
      ready-to-post Stories, two feed images, iPhone downloads and verified
      App Store sticker links. Account trader review and the broader task
      0032 hardware matrix remain separate and are not claimed complete.
  - date: "2026-08-27"
    status: active
    who: codex
    note: >
      Owner confirmed the short iPhone check and privacy publication; free
      agreement is active and DSA is in review. Submitted the exact final
      candidate at 05:34:49 UTC; version and submission read back as
      WAITING_FOR_REVIEW. Apple approval, EU eligibility and the broader
      task 0032 hardware matrix remain unverified.
  - date: "2026-08-27"
    status: active
    who: codex
    note: >
      Store preparation is complete and read-back verified: Polish metadata,
      five COMPLETE screenshots with matching checksums, category/age/rights,
      private review details, free pricing and selected final build. Internal
      beta and live GitHub Pages are verified. No review submission exists;
      owner App Privacy/compliance and physical-device gates remain open.
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

At activation, version 1.0 was PREPARE_FOR_SUBMISSION. Its description, screenshots,
support URL, privacy URL, category, age questionnaire, rights declaration,
copyright, review contact and selected build were missing. Preparation
is complete. On 2026-09-02 the exact candidate is READY_FOR_SALE in 175
territories. Public Polish lookup returns CHMURNIK, Apple ID 6782159027,
bundle cloud.chmurnik.app and 0 PLN; the Polish listing is accessible.
The owner selected non-trader for the app. This resolves app availability,
not the separate account-level trader verification. See the launch media log.

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

- [x] Owner reports completion of the short iPhone check requested for
      candidate 20260826214336 (2026-08-27: "3 - done").
- [ ] Device/iOS details and the broader task 0032 acceptance matrix are recorded;
      do not infer VoiceOver, oldest-OS or low-storage results from that reply.
- [x] Required metadata, authentic screenshots and working public URLs are complete.
- [x] Final candidate archive, privacy manifest and authentic screenshots are verified.
- [x] Owner confirmed app-embedding rights for both fonts; photograph credits retained.
- [x] Owner confirmed App Privacy publication; Apple's submission eligibility
      check accepts it. Age and content-rights answers are API-verified.
- [x] 2026-09-02: final EU distribution eligibility is confirmed, with 175
      AVAILABLE territories and a public Polish listing. The owner made the
      app-level non-trader declaration; no agent legal selection was made.
- [x] Owner authorized publication; existing automatic release after Apple
      approval is retained. This does not establish public availability.
- [x] Exact candidate submitted and WAITING_FOR_REVIEW read back from Apple.
- [x] 2026-08-30: Apple approval and US listing verified; EU remains blocked.
- [x] 2026-09-02: Polish launch kit includes five Stories, two posts, iPhone
      downloads and direct App Store sticker links; all seven exports and
      local Chromium/WebKit download/copy/share contracts pass verification.
- [x] 2026-09-02: the September 3 origin series includes five JPGs, two
      silent H.264 demo alternatives, direct download ZIPs and five sticker
      links. Genuine UI, owner-sourced copy, photograph credits and training
      limits are preserved; responsive Chromium and video decoding pass.
- [x] 2026-09-02: approved expansion to ten Stories and a complete cross-platform
      kit includes genuine mobile walkthroughs, ten carousel slides, LinkedIn
      PDF/post, Facebook image/post, full copy and six verified archives.
      The `/premiera/historia/` gallery preserves both previous packages.
- [x] 2026-09-02: owner-requested V2 replaces slow reading-time films with
      6-8 second action-led edits and persistent complete approved copy.
      Final decoded frames, all platform text, six rebuilt archives and
      cache-busted gallery downloads pass technical verification.
- [x] 2026-09-03: complete LinkedIn/Facebook captions and Facebook artwork
      promote the browser domain; all six V3 ZIPs preserve the approved
      iPhone Stories/carousel and fast edit. Web-only launch note and static
      social preview pass root-build and responsive application checks.
- [x] 2026-09-03: Pages V3 publication is verified through the complete
      public gallery and application browser tests.
- [ ] Deploy the prepared root-hosting build to chmurnik.cloud and verify
      the actual domain before promoting the new browser-reader features.

## Boundary

The owner accepted the requested short iPhone checklist before submission.
Do not infer the broader task 0032 matrix from that reply or promote another
candidate without acceptance. Do not claim model accuracy from atlas examples
or replace genuine cloud photography with generated images.

## Owner Confirmations

- 2026-08-26: the owner confirmed purchasing licenses for both Romie and
  Roobert in response to the app-embedding rights question. Receipts are
  available in their email; no mailbox inspection was needed or performed.
- Public support email remains unconfirmed. The public repository issue tracker is an existing contact
  channel; do not publish a private mailbox without the requested answer.
- Owner requested step-by-step instructions for remaining actions. The
  Polish handoff explains App Privacy, EU status and exact-build device checks.
- 2026-08-27: owner reported step 3 done in response to the exact candidate's
  camera/library/save/reopen checklist. Device model/iOS were not supplied;
  this is owner-reported acceptance, not an agent-run physical hardware test.
- Latest screenshot shows Free Apps Agreement Active and DSA In Review.
  Owner then confirmed Publish. Apple's former APP_DATA_USAGES_REQUIRED
  blocker cleared; no legal status or terms were selected by the agent.

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
- Free price verified for 175 territories; final EU trader verification
  remains pending for 27. App Privacy eligibility is now accepted by Apple.
- Internal TestFlight assignment and owner access are verified for the exact
  final candidate, `IN_BETA_TESTING`, with Polish/English notes. External beta
  was not changed. Store metadata, categories, age, rights and private review
  contact are complete. All five screenshots are COMPLETE; dimensions/order
  and stored checksums match. The final build is selected in the submitted version.
- Code commit 6497e51 is deployed to GitHub Pages. The full public-browser
  flow passes, including standalone help/privacy HTTP 200 and responsive routes.
- Submission 48f55907-6f36-4ea6-9874-7f169a1f9382 has exactly one version
  item. At 2026-08-27 05:34:51 UTC both it and version 1.0 read back as
  WAITING_FOR_REVIEW, retaining build 20260826214336 and AFTER_APPROVAL.

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
6. Preserve automatic release under the owner's publication request. Submit
   after the requested owner checklist/privacy steps; keep pending DSA,
   broader hardware coverage and actual public availability explicitly open.
