---
title: "How should photo recognition work?"
type: Q
status: developing
created: "2026-06-21"
updated: "2026-06-21"
spawned_from: null
spawns: []
tags: ["computer-vision", "core-ml", "uncertainty"]
---

# How should photo recognition work?

## Question

Which licensed data, model architecture, label boundary, calibration method,
and iOS integration can provide useful cloud hypotheses while abstaining on
ambiguous or out-of-domain photographs?

## Constraints

- Ten WMO genera are desirable but must not be claimed without adequate data.
- Mixed skies, perspective, lighting, horizon objects, and multiple cloud
  layers make single-label image classification intrinsically uncertain.
- The model must be small enough for local iOS inference and offline use.
- The interface must preserve CHMURNIK's existing visual language and
  evidence-first pedagogy.
