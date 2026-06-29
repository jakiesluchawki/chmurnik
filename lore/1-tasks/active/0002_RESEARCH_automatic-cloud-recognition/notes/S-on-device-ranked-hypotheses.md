---
title: "On-device ranked hypotheses with honest abstention"
type: S
status: stable
created: "2026-06-21"
updated: "2026-06-21"
spawned_from: "R-licensed-data-and-local-inference.md"
spawns: []
tags: ["product-decision", "uncertainty", "ios", "core-ml"]
---

# On-device ranked hypotheses with honest abstention

## Decision

Ship photo recognition as a private, experimental iOS assistant that returns
three hypotheses and routes the user back to observable evidence.

The leading hypothesis is named only when the calibrated margin between the
first and second model outputs reaches the validation-derived threshold. A
high isolated sigmoid value is not treated as certainty. Low-margin, clear,
and out-of-scope frames receive an explicit abstention state.

## Product behavior

1. The user deliberately chooses the camera or one library image.
2. iOS displays the system permission prompt only after that action.
3. The native Capacitor plugin runs the bundled Core ML model locally.
4. The result shows a real input photo, up to three WMO genera, and atlas
   features the user should verify in the frame.
5. The user may compare hypotheses, continue with the evidence-first observer,
   or save the result as an unverified hypothesis.

The interface never calls the output a diagnosis or certainty. Generated
felt/studio artwork may introduce and explain the tool, but every cloud used as
evidence remains a licensed photograph.

## Release gate

- Core ML parity error below 0.01 with an unchanged top result.
- Validation target precision at least 0.85 for accepted leading hypotheses.
- Test top-three hit rate reported alongside top-one and calibration metrics.
- Known project outliers exercise the abstention path.
- Camera and library purpose strings name local recognition explicitly.
- Simulator build, shared web tests, and TestFlight processing all succeed.
