# Wind Workshop: Independent Review and Fixes

Date: 2026-09-09. Scope: the four wind implementation/test files and this report only. No shared entry, catalog, router, core physics, TransferTrial implementation, artwork, build output, native target or release configuration was edited. No commit or shared-preview build was made. The parent's browser tab and global viewport were not touched.

## Findings Addressed

1. **Premature interpretation.** The former wave question described the outline as stationary before observation; its SVG label named a wave cloud, and its initial path showed the entire future trajectory. Introductory wording now identifies objects without explaining the outcome. Questions/options mount only after the start and end have been observed. The wave path ends at the current frame. Feedback is not present in hidden DOM before commitment.
2. **Refresh could expose guidance during independent practice.** The active mode, station, frame, observed frames, drafts and attempt identity now persist. Restoring assessment mounts only the existing `TransferTrial` for `wiatr`. Entering guidance marks a pending transfer attempt as assisted, including on mount; links away from an active assessment also mark assistance. These marks use the unchanged shared API.
3. **First answers were fragile.** Submission now uses a stable attempt ID and a synchronous ref-backed action path. Repeated submission cannot append another answer for that attempt. Restore validates options and recomputes correctness/repetition. Storage merges records by identity, preserving existing primary/evidence answers rather than choosing whichever array is longer.
4. **Observation clicks were not enough evidence of understanding.** Each case now requires a committed conclusion followed by a separately committed reading of the observed evidence. Only then does explanatory feedback appear. Correct inference with incorrect evidence remains visibly partial. Help before the conclusion and help only before evidence have separate immutable snapshots. Repeating a case retains the original answer and marks the new attempt as a repeat.
5. **Accessible evidence and compact controls.** SVG accessible names now describe only current-frame positions, the reference orientation and uncalibrated drawing coordinates. The visible legend is HTML rather than tiny text inside a scaled SVG. Compass/marker labels are larger; frames and answers have 48 px minimum targets, other controls/links 44 px. Undefined `--pink`/`--olive` variables were replaced by scoped existing-theme tokens with fallbacks. Next/restart focus the introductory heading, not the question below the new diagram. Reduced-motion CSS suppresses inherited animation/transitions; the observation itself has no autoplay or timed movement.

## Preserved Design and Science

- The parent's three cases remain: one drifting cloud fragment, differently moving lower/upper layers, and an outline/air-parcel counterexample. Original directions and trajectory coordinates are unchanged. Existing `cloud.webp` is reused; no new art is introduced.
- Each frame can be revisited freely before and after answering. Completed cases can be repeated; after later cases an explicit return to the first observation avoids trapping a restored session at the final case.
- This is an **observation/inference exercise**, not a prediction measured before viewing evidence. The primary inference is locked before explanatory evidence choices. Neither clicking frames nor completing the guide awards independent mastery; independent practice remains in `TransferTrial` with its existing different cases.
- All cases are visibly synthetic and not a forecast. There is no calibrated length, interval, layer separation or speed. Screen coordinates are described as drawing coordinates, not metres. Cloud-level motion is not asserted to measure surface wind or flight safety.
- The white cloud image in the counterexample is explicitly a symbolic outline, not a lenticularis identification specimen. The moving dot is an air parcel, not a droplet conserved through condensation/evaporation. The arc is illustrative, not a numerical mountain-wave solution.

## Primary Sources

Checked on 2026-09-09 and linked beside the relevant feedback or deliberately opened help:

- [WMO International Cloud Atlas, direction and speed of movement](https://cloudatlas.wmo.int/en/direction-and-speed-of-movement.html): the from-direction convention; cloud elements as a conditional approximation of wind at cloud level; differences between whole-cloud and element movement.
- [NWS glossary, wind direction](https://marine.weather.gov/glossary.php?word=wind+direction): wind is named for its source direction. The UI uses named compass directions, not operational calm codes. The existing mathematical modulo-360 helper is retained.
- [WMO International Cloud Atlas, orographic influence on the leeward side](https://cloudatlas.wmo.int/en/orographic-influence-on-the-leeward-side.html): standing mountain waves can remain stationary while air passes through; cloud outlines may barely move despite airflow.
- [NWS Albuquerque, Altocumulus Standing Lenticular Clouds](https://www.weather.gov/abq/features_acsl): cloud development and dissipation around a wave crest explain persistence of an outline despite through-flow. This supports the condensation/evaporation explanation, not a quantitative speed or turbulence claim for our drawing.

## Persistence Contract

- New session key: `chmurnik-wind-observation-session-v2`.
- Original `chmurnik-wind-observations-v1` history is read for migration and is never overwritten. Older entries retain their first answers and are explicitly labelled as lacking help/evidence provenance.
- Evidence can fill an empty evidence slot once; it cannot replace a recorded answer. Opening later help does not rewrite an earlier clean primary decision.
- Sequential stale-view writes retain existing records and help already recorded for the same attempt. This is local educational history, not tamper-proof grading or an atomic transaction across simultaneously writing browser tabs.
- Storage denial/quota failure keeps the current in-page record and displays a non-durability warning. Closing/reloading with unavailable storage can lose that in-memory work; the UI does not promise otherwise.

## Verification

- Wind tests: **34/34 passed**, including nine real React/Vite SSR subcases. Checks cover geometry, frame-prefix disclosure, current-frame alt text, staged answer/evidence rendering, wrong-first/wrong-evidence retention, retry/restart, help timing, session restoration, migration, stale saves, storage denial and assessment isolation.
- Targeted regression command: **368/368 passed**:

```sh
node --test tests/wind-workshop.test.mjs tests/learning-transfer-state.test.mjs tests/learning-transfer-cases.test.mjs tests/weather-legacy-transfer.test.mjs tests/weather-preview.test.mjs tests/weather-motion.test.mjs tests/weather-tutorial.test.mjs
```

- `npm run check:lessons`: **9 modules passed**. This audit is not evidence of learner outcomes or a browser-layout pass.
- Isolated in-memory esbuild transforms of the owned JSX, CSS and MJS: **0 warnings**. No shared preview bundle was built.

## Handoff and Limitations

**No new browser/mobile QA is claimed.** The parent's earlier three-case and wrong-first browser checks predate the added evidence step. Recheck all three cases with conclusion then evidence, a wrong conclusion plus wrong evidence, help opened only after conclusion, reload during pending evidence, reload in independent mode, and return from independent practice to guidance. Check keyboard focus after commit/next/restart, phone action reachability at 390 x 700 and narrow width/text enlargement, and reduced-motion mode. Static CSS/SSR checks do not establish actual viewport landing, VoiceOver behavior or touch usability.

The former compass-trivia problem is addressed within this narrow brief: learners must follow displacement, separate source from destination, compare layers and confront an exception to whole-cloud tracking. **A complete explanation of why the atmospheric wind field forms remains a broader content/design task**, not something typography or a further control can fix. Pressure-gradient forces, rotation and authentic-sky observation are not simulated here; the existing breeze/lesson link provides continuation. Do not present this workshop alone as a complete wind course or claim measured learning gains. No further broad redesign is required to ship it specifically as a synthetic observation-and-limits exercise, subject to the parent's integrated browser QA.
