# Foundations Workshop Report

Date: 2026-09-09. Scope: the three foundations only. No commit or deployment.
The later owner expansion does not change this work item's ownership; the
parent owns integration, native verification and all release operations.

## Owned Files

- `weather-preview/learning/FoundationWorkshop.jsx`
- `weather-preview/learning/foundation-workshop.css`
- `weather-preview/learning/foundation-workshop.mjs`
- `tests/foundation-workshop.test.mjs`
- `design/workshop-expansion-20260909/foundations.md`

Export: `FoundationWorkshop({ id, mainSite })`, with `id` equal to `bryza`,
`chmura` or `mgla`. An internal keyed session handles changes of topic. Use the
existing preview base stylesheet, fonts and approved local assets: coast,
valley, cloud and fog WebP files. The existing `Slider` supplies illustrated
handles, labelled native ranges, keyboard input and tap +/- alternatives.
`returnLesson` retains the existing lesson-origin link contract. Routes and
catalog integration belong to the parent; neither was edited here.

## Learning Design

These are supplementary workshops, not replacements for four-chapter lessons.
No duration or mastery claim is made. Four observable outcomes per topic:

| Topic | Observable outcomes |
| --- | --- |
| Breeze | Compare land/water temperatures; identify surface flow; distinguish the return branch; explain why time alone cannot determine the wind. |
| Cloud | Read parcel height/temperature; compare height with condensation level; compare different initial humidities; distinguish condensation from cloud top/rain. |
| Fog | Compare cooled temperature with initial dew point; identify increasing RH without added vapor; compare two initial humidities; distinguish model saturation from a visibility forecast. |

Each topic has three one-variable trials. The sequence is prediction commit,
continuous causal action, observation capture, evidence answer, explanation
and A/B comparison. A slider target only prepares the observation: it neither
completes the trial nor grades learning. Incorrect predictions/evidence remain
visible. The next-trial action follows the A/B table, not precedes it.

Before prediction commitment, the scene shows only starting conditions;
outcome arrows, condensation/dew markers, evidence choices, explanations,
source/help content and comparison results are not mounted. The observed
result is frozen at the exact target before the evidence question. Required
numbers also appear beside that question so phone users need not recall data
from a scene scrolled offscreen. The final recap can show all first answers.

Free exploration offers every existing model input plus exact A/B snapshots
and replay. A/B snapshots are explicitly temporary until leaving exploration;
they neither alter nor migrate the old saved-trial store. Independent practice
uses the existing two `TransferTrial` cases per topic, unmodified. Its scene is
exclusive: no guide, free controls or worked answers are mounted alongside it.

## Integrity and Physics

- New local storage key: `chmurnik:foundation-workshop:v1:<id>`.
- Prediction is synchronously saved before mounting actions. First predictions
  and evidence answers are separate; retries retain earlier records. Help after
  prediction does not change that prediction's help status.
- Mode and current trial survive reload. Reloading independent practice does
  not open the guide. Leaving an unfinished transfer case marks help through
  the existing transfer API; pre-existing unfinished cases are marked if a guide
  is exposed on entry. Denied writes show an in-page-only storage warning.
- The actual physics file is `weather-preview/model.mjs`, not `physics.mjs`.
  It and `presentation.mjs`, `motion.jsx`, `Slider.jsx`, `tutorial.mjs`, and
  the checked original physics/motion/interaction/tutorial tests have no diff.
- Both condensate layers reuse `sceneAppearance`: zero opacity at and below
  saturation, continuous positive opacity only beyond it. No threshold shift.
- Cloud height and condensation line share an explicit coordinate function;
  labels cannot move the line. Off-scale condensation is reported, not clamped.
- Fog distinguishes the initial dew point from the later saturated state;
  unsaturated RH just below 100% displays `<100%`, not rounded false saturation.
- Reduced-motion media changes are observed live; a separate motion-off control
  gives immediate updates. No required dragging, sticky artwork or autoplay.

## Sources

Reviewed on 2026-09-09. Learner explanations link to topic sources and FAA.

- [NWS: Weather in Action, Lake Shadow/Breeze](https://www.weather.gov/bgm/WeatherInActionLakeShadowBreeze): differential heating/cooling and reversed circulation; larger-scale flow can alter the local breeze.
- [NWS: Marine Layer Information](https://www.weather.gov/source/zhu/ZHU_Training_Page/clouds/stratus_form_dissipate/Marine_Layer.html): expansion/cooling of lifted air and the lifting condensation level. This source supports the mechanism, not a claim that this parcel model simulates an entire marine layer.
- [NWS: Radiation Fog](https://www.weather.gov/safety/fog-radiation): near-ground cooling, saturation and environmental influences on fog. Illustrated opacity is not calibrated visibility.
- [FAA-H-8083-28B, Aviation Weather Handbook](https://www.faa.gov/regulationspolicies/handbooksmanuals/aviation/faa-h-8083-28b-aviation-weather-handbook): sections 6.4-6.6, printed page 6-4 (PDF page 83); sections 12.2-12.3, printed pages 12-2/12-3 (PDF pages 146/147). Official PDF downloaded and text inspected. The 125 m/K estimate follows the existing 9.8/1.8 K/km convergence; constant moist cooling of 6 K/km remains an explicit teaching approximation, not a universal lapse rate.

## Verification Results

- **27/27** new tests pass: all nine model outcomes, one-variable isolation,
  real rendered conceal/reveal states, evidence data placement, comparison order,
  exact thresholds, off-scale geometry, first-result/help locks, reload/mode,
  invalid storage, denied writes, A/B input labels and shared control semantics.
- **367/367** tests pass across foundations plus original weather model,
  motion, interaction, tutorial, legacy transfer, transfer cases and transfer
  state suites. This is the focused command below, not a claim about the entire
  concurrently edited repository.
- Bundled the component and actual CSS in memory with esbuild successfully.
  No generated output or shared build directory was written.
- `npm run check:lessons`: all **9** existing lesson modules pass their contract.
- Isolated localhost IAB at **390x700**: completed all nine guide trials,
  checked wrong prediction plus correct evidence, wrong evidence after help,
  exact night/no-contrast results, dry off-scale cloud case, all fog cases,
  cloud keyboard ArrowUp, target tap alternatives, first-record reload and recap.
- Checked transfer-only entry, persisted transfer mode after reload, and help
  marking when leaving and returning. Checked motion-off fog updates and exact
  free A/B replay. At **320x640**, fog free exploration has no horizontal
  overflow; at **1365x900**, inspected fog controls, live diagram and A/B table.
  Coast, valley, cloud and fog artwork loaded during these checks; no console
  errors were recorded for the final inspected tab.
- Browser checks used a temporary in-memory Vite entry, not changes to main.
  Temporary server stopped, tab closed and viewport override reset.

```sh
node --test tests/foundation-workshop.test.mjs tests/weather-preview.test.mjs tests/weather-motion.test.mjs tests/weather-interaction.test.mjs tests/weather-tutorial.test.mjs tests/weather-legacy-transfer.test.mjs tests/learning-transfer-cases.test.mjs tests/learning-transfer-state.test.mjs
npm run check:lessons
```

## Limits and Parent Handoff

Integrated route, lesson roundtrip and release-build QA remain with the parent.
The browser checks above are resized desktop pointer/keyboard checks, not
physical Android/iOS touch, VoiceOver, iOS, macOS or App Store verification.
OS reduced-motion behavior is covered structurally and by the reused motion
code; browser interaction directly exercised the manual motion-off path.
Concurrent edits in multiple tabs are not coordinated; first-result persistence
was verified for one-tab reload, re-entry and retry, not cross-tab races.
No measured learning-effectiveness or external meteorologist review is claimed.
All conditions remain synthetic, with no forecast, safety or qualification
claim. No native, domain, ML, signing, submission or release operation was run.
