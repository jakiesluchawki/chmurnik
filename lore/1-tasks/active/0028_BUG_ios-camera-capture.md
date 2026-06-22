---
id: "0028"
title: "Fix iOS camera and photo-library capture"
type: BUG
status: active
related_adr: []
related_tasks: ["0002", "0022"]
tags: ["phase-current", "priority-critical", "effort-small", "ios", "camera"]
links: []
history:
  - date: "2026-06-22"
    status: active
    who: codex
    note: "Opened from physical-device TestFlight feedback after the camera flow failed before a preview appeared."
---

# Fix iOS camera and photo-library capture

## Summary

Repair the physical-device capture path for the on-device cloud recognizer.
The first release verified the model and UI with an injected image in the
simulator but did not exercise the complete native camera handoff.

## Acceptance Criteria

- [ ] Camera and photo-library permissions are handled explicitly on iOS.
- [ ] Captured photos use the native URI path instead of a large Base64 bridge response.
- [ ] URI and Base64 fallback payloads are covered by automated tests.
- [ ] The native Core ML classifier still receives valid image bytes.
- [ ] Web, lesson, link, production, and iOS build checks pass.
- [ ] A fixed build reaches TestFlight beta testing.

## Implementation Notes

Pending.

## Issues Encountered

Pending.

## Broken/Modified Tests

Pending.

## Design Decisions

### From Plan

1. **Keep inference on-device:** The repair must not introduce uploads,
   analytics, or remote diagnostics.

### Emerged

Pending.

## Future Work

None identified.
