---
id: "0030"
title: "Build the focused daily sky experience"
type: FEATURE
status: active
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
- [ ] `chmurnik.cloud` serves the current build (package ready; host upload pending).

## Implementation Plan

1. Capture and document the current iOS experience against today's Daily Brief hierarchy.
2. Build a daily observation loop from existing licensed atlas photography.
3. Tighten Home, native chrome, and first-run onboarding.
4. Benchmark a conservative recognition improvement on independent real photographs.
5. Run automated and visual QA at representative iPhone and desktop sizes.
6. Publish both web targets and TestFlight, then verify each release.

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

## Implementation Notes

- Added deterministic local-calendar selection across all 30 licensed atlas
  photographs, an observation-first reveal, and a targeted practice action.
- Reordered Home so the felt explainer leads directly into a real cloud frame.
- Reduced onboarding from four steps to three and tightened native chrome.
- Added horizontal-flip TTA as a benchmark-only switch for future research.
- Native QA evidence and the Daily Brief hierarchy comparison live under
  `design/audit-2026-06-26/`.

## Broken/Modified Tests

- Added three tests for calendar stability, valid photographic selection, and
  empty input handling. No existing test was removed or weakened.

## Future Work
