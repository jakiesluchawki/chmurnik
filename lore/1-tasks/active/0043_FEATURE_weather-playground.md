---
id: "0043"
title: "Build an isolated weather playground for owner review"
type: FEATURE
status: active
related_adr: []
related_tasks: ["0042", "0005", "0014"]
tags: ["education", "preview", "github-pages"]
history:
  - date: "2026-09-08"
    status: active
    who: codex
    note: Owner approved the weather-learning plan and authorized the two-experiment Pages prototype.
---

# Weather Playground Preview

## Scope

Implement the first two approved experiments: coastal differential heating /
breeze, and lifted-parcel cloud formation. Provide free exploration, guided
prediction / observation / explanation, and saved A/B comparisons. Existing
lessons are linked rather than duplicated. This is an experimental workshop,
not a completed new multi-chapter course or an operational weather forecast.

## Acceptance Criteria

- [x] Two functional, source-backed simulations with visible assumptions.
- [x] Responsive, accessible Polish controls and existing CHMURNIK identity.
- [x] No concealed answers leak before an explicit attempt / reveal.
- [x] A/B comparison preserves the actual inputs and supports replay.
- [x] Deterministic model / persistence tests and browser checks pass.
- [ ] Isolated GitHub Pages URL works publicly on phone and desktop layouts.
- [x] No change to chmurnik.cloud, Apple assets/releases, photo ML or production navigation.

## Design Decisions

### From Plan

1. Preserve four compact native tabs, direct tools and full lessons.
2. Keep the preview separate until owner acceptance; no fifth production tab.
3. Use physical conditions as inputs, not a decorative cloud / rain switch.
4. No audio, paid API, camera access or photo-review dependency.

### Emerged

5. Separate Vite entry/config and output directory; production build never
   imports the preview. A Pages-only workflow step copies its output.
6. Use a pedagogical periodic temperature cycle for the breeze, not a numerical
   forecast. Only show qualitative circulation strength; no invented m/s.
7. Forced parcel lifting and approximate condensation height do not diagnose
   natural buoyancy, cloud genus, rainfall or storm risk.

## Verification / Worklog

Started from clean e5ec93e on isolated branch codex/weather-preview. Existing
native hotfix release remains separate; no Apple action belongs to this task.

Two new felt illustrations accompany live model overlays. No decorative art
is presented as a real cloud photograph. Mobile keeps the experiment visible
while editing conditions. Saved trials and follow-up explanations are hidden
during prediction so prior results cannot reveal the answer.

Local checks: 305 tests pass; all nine existing lessons pass their audit;
separate preview and isolated production-regression builds succeed. Browser
checks cover both guided paths, wrong and correct predictions, night reversal,
zero contrast, dry high LCL, keyboard controls, play/pause, persisted A/B
restore, 320/390/820/1440 px layouts. See design/weather-preview-20260908/QA.md.

The permanent social library contains a new weather campaign with complete
five-story/carousel copy and Instagram, Facebook, LinkedIn posts. Owner copy
approval was requested; final social PNG/PDF rendering remains pending.
Nothing was posted to social accounts. No secrets or reviewer photos included.

## Future Work

Owner acceptance precedes mountain / front / stability scenes and production
lesson/native integration. These remain outside this first prototype.
