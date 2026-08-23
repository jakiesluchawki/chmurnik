---
id: "0030"
title: "Build the focused daily sky experience"
type: FEATURE
status: completed
related_adr: []
related_tasks: ["0024", "0026", "0027", "0028"]
tags: ["priority-critical", "product-design", "ios", "web", "machine-learning", "deployment"]
links:
  - "../../../design/audit-2026-06-26/02-chmurnik-current-home.png"
history:
  - date: "2026-06-26"
    status: active
    who: codex
    note: >
      Started a time-boxed product sprint to make CHMURNIK cleaner and more
      useful on iOS, add a real-photo daily observation loop, benchmark a
      recognition improvement, and publish the result to web and TestFlight.
  - date: "2026-06-27"
    status: active
    who: codex
    note: >
      Shipped commit fd4b8bb to main, deployed GitHub Pages, and released
      TestFlight build 20260626215133 to both existing groups. All 87 tests,
      9 lesson audits, and 55 external links pass. Cyber_Folks package is
      ready locally; production still serves the June 20 build because no
      non-interactive host credential is available on this machine.
  - date: "2026-08-23"
    status: active
    who: codex
    note: >
      Reopened the active product sprint after an evidence-backed iPhone audit
      exposed broken offline startup, hidden field actions, unreadable camera
      copy, unreliable family aggregation, silent journal data loss, and
      insufficient end-to-end coverage. Both public hosts now match main.
  - date: "2026-08-23"
    status: active
    who: codex
    note: >
      Finished the compact mobile redesign, reliable offline runtime, portable
      private journal, removable local recognition feedback, and 281-photo
      Core ML evaluation. Uploaded TestFlight build 20260823005729 using the
      existing isolated team identity; 99 tests, 9 lesson audits, and 55
      source-link checks pass. Apple processing and Pages deployment pending.
  - date: "2026-08-23"
    status: completed
    who: codex
    note: >
      Published and verified the compact production release on GitHub Pages
      and TestFlight build 20260823005729 for both internal and external
      groups. All 99 tests, 9 lesson audits, and 55 verified sources pass.
      Benchmarked Core ML against 30 atlas and 251 independent photographs;
      packaged the isolated custom-domain release for manual Cyber_Folks upload.
---

# Build the focused daily sky experience

## Summary

Turn the compact CHMURNIK shell into a calmer daily-use product. Preserve the
Romie/Roobert editorial identity and felt studio objects, use real cloud
photography for every identification claim, and make the first useful action
obvious on iPhone.

## Acceptance Criteria

- [x] The first iPhone viewport presents one clear promise and one primary action.
- [x] Home includes a deterministic daily real-cloud observation with a reveal.
- [x] Onboarding is materially shorter, accessible, and does not dominate the screen.
- [x] Native navigation and spacing are denser without reducing tap targets.
- [x] Recognition changes are benchmarked before inclusion and keep uncertainty visible.
- [x] Existing learning, atlas, journal, camera, and offline behavior remains intact.
- [x] Automated tests, lesson audit, links, web builds, and iOS simulator QA pass.
- [x] GitHub Pages and TestFlight are published and verified.
- [x] `chmurnik.cloud` remains available and its isolated production package is
      prepared for the existing manual Cyber_Folks deployment flow.
- [x] Atlas, lessons, layers, journal, and camera reveal their primary action
      within a representative iPhone viewport.
- [x] Offline startup caches the hashed application runtime and upgrades safely.
- [x] Journal persistence failures surface honestly; drafts, local dates, photo
      evidence, and portable backups remain reliable.
- [x] Family probabilities match the trained probability semantics, model
      uncertainty remains honest, and native models avoid repeated reloads.
- [x] Regression tests exercise actual storage, worker, recognition, and route
      behavior rather than only matching implementation strings.
- [x] Fresh production web, GitHub Pages, simulator, and TestFlight artifacts
      pass the complete release gate.

## Implementation Plan

1. Capture and document the current iOS experience against today's Daily Brief hierarchy.
2. Build a daily observation loop from existing licensed atlas photography.
3. Tighten Home, native chrome, and first-run onboarding.
4. Benchmark a conservative recognition improvement on independent real photographs.
5. Run automated and visual QA at representative iPhone and desktop sizes.
6. Publish and verify GitHub Pages and TestFlight; prepare the isolated
   Cyber_Folks package for the existing manual custom-domain upload.
7. Repair mobile density, accessibility, local persistence, and offline updates.
8. Validate recognition semantics and real-image runtime behavior before release.

## Design Decisions

### From Plan

1. **Felt explains; photography proves:** Studio-object imagery guides concepts,
   while cloud recognition and diagnostic claims always use real photographs.
2. **Daily Brief hierarchy, CHMURNIK identity:** Adopt the focused promise/action
   rhythm without importing Daily Brief's palette or component styling.

### Emerged

3. **Put the daily frame before navigation shortcuts:** Simulator comparison
   showed that keeping all five entrances above the activity repeated the old
   hierarchy. Destination and help shortcuts now follow the daily practice.
4. **Reject both quick inference candidates:** Horizontal-flip TTA and the
   Commons-augmented candidate regressed independent photo sets. The shipped
   ensemble remains unchanged rather than trading reliability for novelty.
5. **Keep the daily answer local and reversible:** The reveal is component
   state only. It creates a repeatable observation ritual without adding an
   account, streak, notification, or new persistence contract.
6. **Precache runtime, download photography only on request:** The worker now
   receives the actual hashed Vite assets during each build. All 30 atlas
   photographs remain an explicit offline download rather than an invisible
   multi-megabyte install cost.
7. **Separate family posterior mass from ranked evidence:** Preserve the exact
   summed genus posterior, but rank visible family signals using root-sum-square
   pooling. Native Core ML evaluation improved atlas family accuracy from
   80.0% to 83.3% and independent noisy-field accuracy from 41.4% to 43.0%
   versus the former maximum-only policy.
8. **Protect local field notes without inventing an account:** Attach small
   compressed photographs, preserve drafts until a confirmed save, expose
   storage failures, and offer validated private JSON import/export.
9. **Split the existing runtime before introducing lazy routes:** Vendor,
   icon, platform, and cloud-knowledge chunks remove the production-size
   warning while keeping every current screen available offline.
10. **Keep recognition feedback honest and on-device:** A subordinate helpful
    or uncertain response is stored privately and never claims to retrain the
    model or improve a later prediction.
11. **Reuse one native model per session:** The Swift bridge caches loaded
    Vision models and crops the captured image once rather than repeating
    expensive work on every inference path.
12. **Reuse the isolated team distribution identity:** Headless iOS releases
    can optionally select an existing dedicated signing keychain and an
    app-specific provisioning profile without unlocking the user's login
    keychain or creating another distribution certificate.

## Issues Encountered

- The in-app browser runtime was unavailable, so fresh visual QA used the
  native iPhone 17e Simulator and both production Vite builds.
- Programmatic dialog focus produced a large WebKit focus ring around the
  onboarding surface. The dialog container now suppresses only its own
  outline; interactive controls retain normal focus styles.
- Link verification initially ran inside the network-restricted sandbox and
  reported transport failures. The unrestricted release run verified all 55
  links successfully.
- Two independently benchmarked recognition variants failed the release gate;
  details and metrics are recorded in the product audit.
- The system cleared the temporary working clone after midnight. The pushed
  commit and release artifacts were unaffected; final documentation moved to
  a durable workspace worktree.
- Cyber_Folks has no FTP, SSH, or DirectAdmin credential available to a
  non-interactive process. The isolated 22 MB release package is ready for the
  existing `domains/chmurnik.cloud/public_html` upload flow.
- Mobile Safari sizes date controls from their intrinsic content, which pushed
  the second journal column beyond the viewport. Explicit minimum-width and
  two-column mobile form constraints preserve the full date and place inputs.
- Returning from camera/photo selection can cancel a second capture after a
  successful one. The dialog now retains its last valid result instead of
  replacing useful evidence with an error.
- The previous app worker cached decorative images but not the hashed
  JavaScript runtime; offline startup could therefore return HTML that could
  never execute. A build-generated manifest and behavioral worker tests now
  exercise installation, offline navigation, and explicit photo downloads.
- The observation assistant previously navigated to an empty journal after a
  failed localStorage write. It now remains in place and explains the failure.
- Summing family posteriors alone mislabeled the atlas Cumulus photograph as a
  high cloud because three weak high-cloud hypotheses outweighed one stronger
  convective class. Comparison on all 30 atlas photographs and 251 independent
  CCAiM photographs selected root-sum-square evidence while preserving the
  exact posterior separately.
- The first evidence-pooling prototype accidentally shadowed the family's
  existing educational `evidence` text with a numeric score. Native screenshot
  QA exposed the collision; a separate `signalStrength` field and regression
  assertion preserve the visible meteorological explanation.
- The Mac was locked during distribution, so automatic signing could list the
  development certificate but failed with `errSecInternalComponent`. The
  release script now supports the user's existing isolated Apple Distribution
  identity and a CHMURNIK-specific App Store provisioning profile.
- Passing a provisioning profile directly to `xcodebuild` also configured the
  Camera plugin's Swift packages, which correctly reject application profiles.
  Three custom release settings now scope manual signing to the App target
  while all dependencies keep their original signing behavior.
- The signing validation test originally depended on Xcode being installed,
  so the Linux GitHub Pages runner failed despite passing on macOS. A temporary
  executable fixture now makes the behavioral test platform-independent.

## Implementation Notes

- Added deterministic local-calendar selection across all 30 licensed atlas
  photographs, an observation-first reveal, and a targeted practice action.
- Reordered Home so the felt explainer leads directly into a real cloud frame.
- Reduced onboarding from four steps to three and tightened native chrome.
- Added horizontal-flip TTA as a benchmark-only switch for future research.
- Native QA evidence and the Daily Brief hierarchy comparison live under
  `design/audit-2026-06-26/`.
- Reordered atlas cards so multiple real cloud photographs precede inventory
  statistics, condensed filters, and kept source attribution accessible.
- Reordered weather layers so horizontally scrollable fields and the live
  interpretation appear before long educational controls.
- Added photo evidence, validated portable backups, safe import merging,
  local-calendar defaults, draft retention, and storage-error reporting.
- Updated project design instructions to the actual pink/olive felt-object
  visual system and private experimental iOS recognition capability.
- Increased the accessible violet control contrast and retained minimum
  mobile touch targets while reducing oversized vertical spacing.
- Reduced the largest production JavaScript chunk from approximately 687 KB
  to 222 KB without sacrificing offline availability.
- Added a visible safe-update prompt, deterministic build cache versions,
  and optional full-atlas offline storage.
- Improved family ranking on two real-photo evaluation sets, preserved exact
  family posterior mass, cached native Vision models, preserved
  canceled-capture results, and added private usefulness feedback.

## Broken/Modified Tests

- Expanded the suite from 87 to 99 tests. New behavioral coverage exercises
  worker installation and offline routing, optional atlas downloads, private
  journal backup round-trips and safe imports, quota failures, local calendar
  rollover, removable local recognition feedback, mutually exclusive family
  posteriors, taxonomy-size bias, the actual Cumulus ensemble output, and
  invalid isolated iOS signing configurations.
- Existing photo-recognition and visual-foundation assertions were updated to
  preserve honest camera semantics, stronger control contrast, and the current
  approved CHMURNIK palette. No prior coverage was removed or weakened.

## Future Work

- The consented expert-reviewed field benchmark remains tracked by task 0026.
- Route-level specialist workshop loading remains tracked by task 0025; the
  current runtime chunk split already removes the production-size warning.
