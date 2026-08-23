---
id: "0027"
title: "Add private local feedback for photo hypotheses"
type: FEATURE
status: completed
related_adr: []
related_tasks: ["0002", "0030"]
tags: ["phase-future", "priority-low", "effort-small", "ios"]
links: []
history:
  - date: "2026-06-21"
    status: backlog
    who: codex
    note: "Spawned from 0002 future work."
  - date: "2026-08-23"
    status: completed
    who: codex
    note: >
      Shipped bounded private helpful/uncertain photo feedback, transparent
      non-training disclosure, explicit deletion, and persistence tests
      together with the 0030 product audit.
---

# Add private local feedback for photo hypotheses

## Summary

Let a user mark a photo result as helpful, ambiguous, or wrong without sending
the image or feedback off-device.

## Acceptance Criteria

- [x] Store feedback only on-device by default.
- [x] Keep the action subordinate to evidence and comparison.
- [x] Explain that local feedback does not retrain the model.
- [x] Add tests for persistence and deletion.

## Implementation Notes

- Store at most 50 compact result records without images, network calls, or
  identifying user data.
- Place helpful/uncertain controls after the evidence and uncertainty cards.
- Explain that feedback is local and does not train the model.
- Offer immediate removal of every stored feedback record.

## Design Decisions

### From Plan

1. Keep feedback private, optional, and subordinate to evidence.

### Emerged

1. Cap feedback at 50 records so repeated use cannot accumulate unbounded
   local storage.
2. Offer one explicit clear action instead of exposing a separate settings
   screen or collecting analytics.

## Issues Encountered

- Browser storage can reject writes or deletes. The camera keeps the result
  visible and reports the specific local persistence failure.

## Broken/Modified Tests

- Added executable coverage for feedback persistence, the 50-record bound,
  complete deletion, and failed storage removal.

## Future Work

None identified.
