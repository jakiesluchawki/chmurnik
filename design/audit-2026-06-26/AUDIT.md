# CHMURNIK iOS focus audit

Date: 2026-06-26

## Evidence

- `02-chmurnik-current-home.png`: fresh first-run capture from the existing iOS build.
- `05-chmurnik-final-home.png`: fresh capture from the revised iOS simulator build.
- `06-comparison-sheet.jpg`: current CHMURNIK, today's Daily Brief hierarchy reference, and the revised CHMURNIK in one review surface.
- Daily Brief reference source: `docs/audits/quiet-ops-ios-2026-06-26/05-first-screen-final.png` in the local Daily Brief project. Its visual system was not copied; only its promise-first information hierarchy informed this revision.

The in-app browser runtime was unavailable during the audit. Native evidence was therefore captured from a freshly built iPhone 17e Simulator app. Web behavior was verified through both production builds and automated checks.

## Findings

1. **The first screen had too many equal-priority entrances.** Hero, three destinations, onboarding, and testing all appeared before the first repeatable activity.
2. **The first-run guide behaved like a second landing page.** Four tall slides and automatic focus on the close control made the experience feel heavier than the product itself.
3. **The strongest visual rule was already present.** Felt studio objects explain invisible atmospheric mechanisms beautifully; real photography remains the right evidence for identifying clouds.
4. **The app lacked a reason to return today.** Atlas, lessons, and recognition were useful but presented as a library rather than a small daily practice.
5. **A quick model change would have been unsafe.** Independent accuracy varies substantially by source, so any inference change needs release-gate benchmarks rather than anecdotal atlas checks.

## Implemented

1. Reframed Home around one promise and one native primary action.
2. Added a deterministic daily real-cloud frame with observation-first reveal and targeted practice.
3. Moved destination and help shortcuts after the daily experience.
4. Reduced onboarding from four steps to three, lowered its mobile height, and removed the programmatic dialog focus outline while preserving keyboard focus on controls.
5. Reduced native header height and kept the existing Romie/Roobert, pink/olive, felt-object design language.
6. Added reproducible horizontal-flip inference benchmarking without enabling it in production.

## Recognition release gate

The shipped v3 ensemble remains the release model.

| Candidate | Common test top-1 | Atlas top-1 | Commons top-1 | Decision |
| --- | ---: | ---: | ---: | --- |
| Current v3 ensemble | 54.9% | 63.3% | 52.5% | Keep |
| Horizontal-flip TTA | 55.6% | 60.0% | 47.5% | Reject |
| Commons-augmented candidate ensemble | 53.5% | 53.3% | 50.0% | Reject |

The rejected variants also weakened outlier abstention. Neither is suitable for TestFlight despite isolated metric gains.

## Residual risks

- The main JavaScript bundle still emits the existing code-splitting warning; task 0025 owns that work.
- The model needs a larger expert-reviewed field benchmark before changing its weights or confidence policy; task 0026 remains the correct next step.
- `chmurnik.cloud` still requires host credentials or a manual package upload; the release command produces an isolated Cyber_Folks ZIP without touching other hosted domains.
