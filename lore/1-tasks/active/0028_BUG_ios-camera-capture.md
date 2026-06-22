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

- [x] Camera and photo-library permissions are handled explicitly on iOS.
- [x] Captured photos use the native URI path instead of a large Base64 bridge response.
- [x] URI and Base64 fallback payloads are covered by automated tests.
- [x] The native Core ML classifier still receives valid image bytes.
- [x] Web, lesson, link, production, and iOS build checks pass.
- [ ] A fixed build reaches TestFlight beta testing.

## Implementation Notes

- Replaced deprecated `Camera.getPhoto` with Capacitor Camera 8.2's
  `takePhoto` and `chooseFromGallery` APIs.
- Native camera and gallery results now pass their file URI to the Core ML
  plugin. Base64 remains only as a web and injected-QA fallback.
- Structured `OS-PLUG-CAMR-*` errors are translated into actionable Polish
  messages; cancellation returns silently to the modal.
- Built and installed a separate development bundle (`cloud.chmurnik.cameraqa`)
  so the physical-device test did not overwrite the TestFlight app.

## Issues Encountered

- The first two TestFlight builds exercised the model with an injected image
  and compiled the iOS shell, but did not verify the complete camera flow on a
  physical device. The deprecated API failed before a preview was rendered.
- A first QA build used a command-line bundle-ID override that also changed an
  embedded framework identifier; iOS correctly rejected it as a duplicate.
  A target-scoped temporary project setting produced the isolated QA app.

## Broken/Modified Tests

- Updated the native handoff assertion to require a camera URI.
- Added coverage for Camera 8 result normalization, web fallback, cancellation,
  and structured native errors.
- Full suite: 83 passing tests; lesson audit: 9 modules; link audit: 55 URLs.
- Physical iPhone QA: two consecutive captures each returned a unique URI and
  a complete Core ML probability vector.

## Design Decisions

### From Plan

1. **Keep inference on-device:** The repair must not introduce uploads,
   analytics, or remote diagnostics.

### Emerged

1. **Physical-device proof is a release gate:** A camera release is not ready
   until native capture returns a file URI and Core ML returns probabilities on
   a paired iPhone.
2. **Use structured Camera 8 errors:** The new API provides stable error codes,
   removing the generic failure message that concealed the actual stage.

## Future Work

None identified.
