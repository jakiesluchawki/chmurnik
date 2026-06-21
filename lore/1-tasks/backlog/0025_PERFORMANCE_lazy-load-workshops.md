---
id: "0025"
title: "Lazy-load specialist workshops"
type: PERFORMANCE
status: backlog
related_adr: []
related_tasks: ["0024"]
tags: ["phase-future", "effort-medium", "priority-low", "performance"]
links: []
history:
  - date: "2026-06-21"
    status: backlog
    who: codex
    note: "Spawned from 0024 future work after the production build reported a large JavaScript chunk."
---

# Lazy-load specialist workshops

## Summary

Reduce the initial JavaScript payload without changing the compact guided
experience or delaying its release.

## Context

Task 0024 made the main paths substantially denser, but the production build
still reports a roughly 639 KB JavaScript chunk because specialist workshops
ship in the initial bundle.

## Implementation

- Measure the current route and component contribution to the initial chunk.
- Lazy-load specialist workshops and infrequently opened reference panels.
- Preserve offline availability through the service worker.

## Acceptance Criteria

- [ ] Initial JavaScript no longer triggers the configured chunk-size warning.
- [ ] Primary navigation remains responsive on first load.
- [ ] Lazy-loaded workshops continue to work offline after their first visit.
- [ ] Web, lesson, link, and iOS tests remain green.
