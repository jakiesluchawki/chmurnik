---
id: "0027"
title: "Add private local feedback for photo hypotheses"
type: FEATURE
status: backlog
related_adr: []
related_tasks: ["0002"]
tags: ["phase-future", "priority-low", "effort-small", "ios"]
links: []
history:
  - date: "2026-06-21"
    status: backlog
    who: codex
    note: "Spawned from 0002 future work."
---

# Add private local feedback for photo hypotheses

## Summary

Let a user mark a photo result as helpful, ambiguous, or wrong without sending
the image or feedback off-device.

## Acceptance Criteria

- [ ] Store feedback only on-device by default.
- [ ] Keep the action subordinate to evidence and comparison.
- [ ] Explain that local feedback does not retrain the model.
- [ ] Add tests for persistence and deletion.
