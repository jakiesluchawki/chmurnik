---
id: "0032"
title: "Connect iOS capture to a private observation collection"
type: FEATURE
status: active
related_adr: ["0001"]
related_tasks: ["0031", "0026", "0030"]
tags: ["ios", "product-design", "priority-high", "effort-large", "aviation", "sailing"]
links:
  - "../../../design/ios-next-2026-08-26.md"
history:
  - date: "2026-08-26"
    status: backlog
    who: codex
    note: >
      Proposed first implementation slice from research 0031. The user
      requested exploration; implementation and publication are not selected.
  - date: "2026-08-26"
    status: active
    who: codex
    note: >
      The user approved the proposed iOS direction and requested useful,
      playable METAR, Windy, and wind learning for sailors and pilots.
      Activate implementation, preserve established source-backed lessons,
      and explicitly separate training from operational guidance.
  - date: "2026-08-26"
    status: active
    who: codex
    note: >
      Implemented the field companion and three practical workshops.
      All 131 tests pass, plus native storage tests and headless web flows
      at 320, 390, and 1440 px. Signed iOS candidate 20260826154430 prepared
      without unlocking the user's desktop. Physical-device acceptance and
      external TestFlight promotion remain open; do not archive this task yet.
---

# Connect iOS capture to a private observation collection

## Summary

Create one complete iPhone journey from authentic photo capture through
uncertain recognition to a durable personal observation. Preserve shared
reference content while allowing a distinct iOS navigation and field UI.

## Scope

- Validate a prototype with Today, My Sky, and Atlas destinations and one
  prominent capture action.
- Save the captured image, time, model version, hypothesis, and optional
  user confirmation together without reselecting the image.
- Store photos as native files and metadata in a native persistent store;
  migrate the existing journal with a recoverable backup.
- Offer real-photo comparisons, explicit uncertainty, and a useful refusal
  state for unsupported images.
- Present a photo collection and user-controlled share card with private
  location metadata excluded by default.
- Keep system extensions, weather, missions, and iCloud as separately chosen
  candidates rather than mandatory scope for the first release.
- Add a functional pasted-METAR reader, wind-vector workshops, and replayable
  map-reading scenarios with feedback and clear synthetic-data labeling.

## Acceptance Criteria

- [x] Product owner selects the scope and preserves the approved visual identity.
- [ ] Capture-to-save works without duplicate input and preserves original evidence.
- [x] Model hypotheses cannot silently become user-confirmed identifications.
- [x] Migration, failed writes, retries and backups pass automated persistence tests.
- [x] Large photo collections do not depend on Base64 in localStorage.
- [x] Shared postcards exclude place, private notes and source EXIF. Explicit
      full backups preserve user-entered metadata as documented in the UI.
- [ ] Existing supported iOS versions retain a working capture and journal flow.
- [ ] Repeated capture, cancellation, permissions, backgrounding, low storage,
      offline use, accessibility, and actual-camera behavior pass on real devices.
- [ ] Tests, release review, and distribution approval precede publication.
- [x] Aviation and sailing exercises are source-backed, playable, keyboard
      operable and do not imply a flight or sailing authorization. VoiceOver
      acceptance remains in the physical-device criterion above.

## Implementation Notes

- `FieldHome`, `SkyCollection`, `PhotoFrame`, and `FieldPractice` create a
  native-first shell while retaining web navigation and old educational routes.
- Native `ObservationVaultStore` uses photo files and an atomic JSON index;
  `ObservationVaultPlugin` handles image preparation and system sharing.
  The browser adapter uses transactional IndexedDB photo blobs and metadata.
- Capture-to-save has one action, a stable retry ID, model version, separate
  user confirmation, optional crop analysis, and a useful clear-sky refusal.
- Collection supports favorites, date/genus filters, two-photo comparison,
  paged rendering, ten explicitly confirmed genera, postcards and split backups.
- The bounded METAR reader handles one pasted report, unknown/unsupported
  groups, CAVOK, VRB, gusts, pressure and visibility variants. It does not
  fetch weather, infer report freshness, or decode a TAF as an observation.
- Wind tools calculate signed components and apparent wind in one stated
  reference frame. Map training uses explicitly fictional model A/B data.
- Twelve four-choice cases include feedback, first-attempt tracking and
  replay of only the missed cases. Existing nine lessons remain intact.
- Release walkthrough and screenshots: `design/field-release-2026-08-26.md`.

## Design Decisions

### From Plan

1. **Separate native navigation:** Today, My Sky and Atlas emphasize field
   observations; scientific content and visual identity stay shared with web.
2. **Preserve photographic evidence:** Save the entire frame, not the selected
   inference crop. Stored JPEGs are resized and stripped of source metadata,
   not byte-identical originals. Cloud references remain authentic photos.
3. **Separate hypothesis from confirmation:** A model score cannot silently
   complete a genus collection or be advertised as calibrated accuracy.
4. **Useful, honest practice:** Tools and synthetic exercises are separate;
   sources and operational limitations remain visible.

### Emerged

5. **Bounded atomic native index:** Prefer a serial store with atomic file
   commits over a new database framework for at most 500 entries and iOS 15.
   Record the storage/recovery contract in ADR 0001.
6. **Do not infer missing sky:** A missing group and unknown VV are not an
   absent ceiling. Reject malformed wind/visibility/pressure magnitudes.
7. **Protected migration:** Corrupt legacy storage fails visibly, rather than
   being marked migrated as an empty collection. Keep its recovery copy.
8. **Headless validation on a locked Mac:** Use a fresh browser profile, real
   native Foundation tests and SDK compilation. Do not claim hardware results.
9. **Internal beta first:** Existing signing credentials can sign while the
   desktop remains locked. Physical acceptance precedes external promotion.

## Issues Encountered

- Initial simulator runtime was unavailable. Restored it through Xcode's
  supported runtime download. Full simulator compilation then passed.
- A Swift bridge returned `[String: Any]` directly instead of a `JSObject`.
  Compiling the complete app exposed the mismatch; the plugin now constructs
  the typed bridge result explicitly.
- Concurrent image preparation and form edits could overwrite each other.
  Functional state updates preserve both the selected photo and typed note.
- The capture QA fixture was a 1 MB atlas JPEG, beyond the browser backup
  photo limit. The fixture now uses the real photo-compaction helper;
  production native captures continue through the native image pipeline.
- Code signing initially failed with `errSecInternalComponent`; unlocking
  only the existing isolated release keychain resolved it. No login-keychain,
  certificate, account, or desktop changes were made.
- Sandboxed signature verification could not reach system trust services;
  authorized verification outside the sandbox passed.

## Verification

- `npm test`: 131/131 (32 more than the 99-test baseline).
- `npm run check:lessons`: 9/9 modules. `npm run check:links`: 57/57 links.
- `tests/native-vault/main.swift` compiled with the real store and passed
  migration, rollback, duplicates, limits, export/delete and corruption tests.
- `scripts/check-field-ui.mjs` passed native-layout, production-root,
  production-Pages-prefix and repeated capture-fixture modes. Root and Pages
  tests enforce production CSP; both report no page errors or violations.
- Simulator build and signed device archive passed. No physical camera,
  low-storage, permissions, VoiceOver or backgrounding test is claimed.

## Broken/Modified Tests

- `foundation.test.mjs`: replace the old globally floating recognition button
  assertion with the intentionally different native entry point. Web keeps
  contextual recognition and the original navigation contract.
- New tests exercise real IndexedDB transactions via `fake-indexeddb`,
  rather than relying exclusively on source-text assertions.

## Remaining Work

- Complete the unchecked physical-device criteria in this task, then decide
  external beta promotion. Keep the previous working build available.
- Expert-reviewed recognition benchmarks remain in task 0026; no new model
  accuracy claim or training data was introduced by this implementation.
- Workshop code splitting remains in task 0025, outside this feature release.

## Distribution Evidence

- Uploaded `1.0 (20260826154430)`, build
  `c4cca37d-ff1b-43bb-bf75-1b0c4472c4c3`, for `cloud.chmurnik.app` only.
- Apple reports `VALID` and internal `IN_BETA_TESTING`; internal group
  membership and the existing owner's accepted tester access were verified.
- Added Polish beta notes in `pl` and `en-US`. External state remains
  `READY_FOR_BETA_SUBMISSION`; no external group was changed.
- Cyber_Folks ZIP is ready and passes archive integrity verification. Upload
  still uses the existing manual, domain-scoped workflow.
