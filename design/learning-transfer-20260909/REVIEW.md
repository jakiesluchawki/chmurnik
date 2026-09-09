# Transfer And Focused Mobile Learning

Task lore-0043, 2026-09-09. Pages preview only; production domain, native
navigation, recognition models and Apple releases are outside this change.

## Decisions From Three Research Reports

- Worked examples teach the mechanism; the new studio adds a committed recap
  before independent cases. Free exploration is explicitly ungraded.
- Two different cases per activity, 28 across all 14 activities. Learners
  commit decisions and a selected explanatory principle before feedback.
  Cases include changed cloud-cover groups, TAF time boundaries, unfamiliar
  photographs, different initial conditions and honest insufficient-data answers.
- No result scene or diagnostic metadata is mounted before submission.
  Photographic evidence remains authentic, full-frame and attributed.
- Preview-only storage distinguishes help, first submission and repeated
  cases. It retains the last 40 attempts per activity and a case-exposure set.
  Unavailable storage is reported as session-only. This is not a secure exam.
- The three research reports inform design; they do not establish measured
  learning improvement. Delayed retention assessment remains future work.

## Mobile Changes And Browser Evidence

The working view no longer repeats a large introduction above every scene.
It presents the current step, scene and one active control. Explanation
replaces the control area after an explicit request instead of extending a
stack of cards. Long option sets use a labeled selector. Source material and
full readouts remain available in disclosures, with ordinary page scrolling.
Guide and exploration settings remain separate and survive mode changes.

Measured METAR at 390 x 700 CSS pixels, scroll position zero:

| Measurement | Before | After |
| --- | --- | --- |
| First control top | about 972px | about 493px |
| Primary action bottom | below first viewport | about 696px |

Before/after captures are in this directory. CUA checks covered:

- All fourteen activity routes at 320 x 568: no horizontal page overflow.
- METAR walkthrough, explicit explanation, incorrect ceiling with correct
  principle, committed feedback, reload and clean transition to the next case.
- Wind: two side-by-side compasses, changed directions, returning to guide
  step 2 without reset, and assistance preserved on returning to the trial.
- Sounding: chosen-level readings precede the optional full graph; the graph
  opens when teaching Skew-T. No interpretation is copied into its assessment.
- Legacy cloud control/action on 390px and 320px, including pointer alternatives.
  A separate implementation check covered all eleven legacy guide steps, A/B,
  keyboard interaction and centered slider focus.
- Eight new covers checked in 390px and desktop layouts; all 14 covers unique.

These are Chromium browser viewport checks, not physical iPhone/Samsung tests
or a full assistive-technology/WCAG audit. Full photographs and plots may need
normal vertical scrolling; they are not cropped or clipped to force a fit.

## Verification

- 657 repository tests pass, including 266 transfer state/render tests.
- React SSR checks all 28 cases before/after submission, help and new-case reset.
- Case-bank tests recompute numeric relationships with existing science helpers.
- Nine complete lesson modules pass the existing content audit.
- Weather preview and Pages builds pass; no dependencies added.
- Independent code review found and verified fixes for quota fallback, stale
  submissions, stale photo help and a removed/corrupt open storage record.

See `implementation-review.md` for detailed coverage and remaining limits.
Public deployment verification is recorded in Lore0043 after CI completes.
