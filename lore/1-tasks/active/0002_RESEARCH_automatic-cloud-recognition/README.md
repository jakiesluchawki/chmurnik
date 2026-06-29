---
id: "0002"
title: "Research and ship automatic cloud recognition"
type: RESEARCH
status: active
related_adr: []
related_tasks: ["0001", "0022", "0024"]
tags: ["priority-high", "machine-learning", "ios", "privacy", "computer-vision"]
links: []
history:
  - date: "2026-06-16"
    status: backlog
    who: codex
    note: "Spawned from the confirmed version 1 boundary."
  - date: "2026-06-21"
    status: active
    who: codex
    note: >
      Activated by the owner as an end-to-end goal: licensed data, calibrated
      model, private iOS integration, product QA, and TestFlight delivery.
---

# Research and ship automatic cloud recognition

## Summary

Add photo-based cloud recognition to the iOS application without weakening
CHMURNIK's teaching-first purpose, scientific uncertainty, or privacy.

## Product Contract

- Accept a new camera photo or an image selected from the photo library.
- Keep inference on device unless the user explicitly opts into a future
  hosted fallback.
- Return ranked hypotheses, visible evidence, and a meaningful abstention
  state instead of a single overconfident answer.
- Distinguish only classes supported by the licensed benchmark data.
- Use recognition to route into the existing observer, comparison, and atlas
  workflows rather than replacing observation.

## Acceptance Criteria

- [ ] Local and hosted inference approaches are compared with a documented decision.
- [ ] Training and evaluation use a redistributable, source-traceable dataset.
- [ ] The benchmark reports class-level quality, calibration, and abstention behavior.
- [ ] A compact model runs locally through Core ML on a representative iPhone simulator/device path.
- [ ] Camera and photo-library permissions are purpose-specific and optional.
- [ ] Results expose multiple hypotheses and evidence-aware next steps.
- [ ] Out-of-domain and low-confidence images produce an honest abstention state.
- [ ] Existing web, lesson, link, and iOS tests pass.
- [ ] The feature is released to the existing TestFlight groups.

## Design Decisions

### From Plan

1. **Teaching before automation:** Recognition must lead users back to visible
   features and differential diagnosis.
2. **Real photos only:** Training, evaluation, and user input use photographs,
   never generated cloud evidence.
3. **Private by default:** The first production path performs inference locally.

### Emerged

1. **Ranked, not automatic:** The single-photo product exposes a top three and
   uses the first-versus-second probability margin for abstention.
2. **MobileNet over scratch CNN:** ImageNet initialization improves both the
   standard and shifted-period benchmark while remaining compact for Core ML.
3. **Unknown means all outputs low:** Limited outlier exposure includes project
   artwork and licensed upper-atmosphere photographs outside the ten genera.
4. **Native bridge, shared interface:** Capacitor owns image acquisition while
   a small Swift plugin owns all inference; React receives only scores.

## Issues Encountered

- The first long scratch-model run was interrupted by the command-session
  lifetime. Epoch state, optimizer state, and resume support were added.
- Maximum sigmoid confidence became anti-calibrated under period shift. The
  abstention score was changed to the top-one versus top-two margin.
- The source dataset labels four simultaneous directions, so a one-photo app
  necessarily loses context and must not promise deterministic recognition.

## Future Work

Pending research and implementation.
