# Learning Expansion: Preview Review

Owner: mieszko. Task: lore-0043. Target: GitHub Pages only.

## Audit Findings

The nine full lessons contain substantial explanations and chapter checks.
Their main gap is experiential: the reader often cannot manipulate or inspect
the mechanism described. The right response is not nine decorative sliders.

| Finding | Evidence | Response |
| --- | --- | --- |
| Lessons lack a consistent experiential entry | `01-learning-before.png`, `02-metar-before.png` | Companion activity for every lesson, catalog in Nauka and Warstwy, reciprocal links |
| Sounding introduces too many specialist concepts together | `03-sounding-before.png` | Read one pressure level first; add dew point, parcel and skew projection in sequence; wind last |
| Hazards remain descriptive cards | `04-hazards-before.png` | Separate icing, turbulence and storm mechanisms, each with explicit limits |
| Wind lacks visible cloud displacement | `05-wind-before.png` | Moving cloud markers on a compass; independent directions on two levels |

## Coverage Decisions

| Full lesson | Companion | Why this interaction fits |
| --- | --- | --- |
| Observation | Full, authentic photograph; describe features before revealing its name | Observation is evidence gathering, not a synthetic cloud generator |
| Cloud families | Ten authentic, credited photo comparisons | Morphology and approximate level are different questions |
| Formation | Existing parcel/condensation and radiation-fog experiments | Preserve approved causal demonstrations and gradual visibility |
| Fronts | Forced lifting at a cold front or over a slope | Separate lifting, initial moisture and environmental stability |
| Wind | Cloud displacement at two levels; existing breeze experiment | Make “toward” and meteorological “from” visible without inventing measured speed |
| Aviation | Cloud-layer METAR builder and a distinct TAF timeline | Distinguish base, ceiling, observation and forecast windows |
| Heights/layers | Terrain versus MSL/AGL; progressive sounding reader | Teach the reference frame before a technical chart |
| Hazards | Icing, mechanical/thermal/shear turbulence, storm ingredients and stages | Different mechanisms need separate experiments, not one risk score |
| Expert naming | Assemble a justified name from a written training observation | Avoid invented provenance and invalid genus/species combinations |

Total: 11 new activities with 38 guided steps, plus the 3 retained experiments.
The existing nine lessons, their content, duration and completion state remain.
An activity does not silently mark a full lesson complete.

## Interaction Contract

- A default guide gives an action, expected observation and explanation.
- Advancing requires the specified input, not merely pressing Next.
- Every slider has keyboard support and step buttons; every guided change also
  has a direct action button. No essential outcome requires precise dragging.
- The shared slider preserves the previously approved centered icon/focus ring.
- Exploration exposes meaningful independent variables and conditional controls.
- End checks use four distinct choices. Feedback appears after an attempt.
- Observation does not expose the name, diagnostic alt text or original-source
  link before the explicit reveal. Photo credit and license remain visible.
- Motion can be paused and respects reduced-motion preferences and hidden pages.
- Original photo assets retain their full frame in activities; catalog tiles
  are navigation thumbnails, not classification evidence.

## Science and Limits

- METAR reuses the existing decoder; lower-layer BKN/OVC determines ceiling.
  The upper layer stays above the allowed lower-base range; OVC ends reporting.
- TAF is a fixed, dated teaching example. TEMPO is an intermittent possibility
  within a window, not continuous observed weather. FM changes the baseline.
  At 18:00 the example expires rather than extending its final state.
- Lifting reuses the existing approximate parcel cooling model. Its trajectory
  is prescribed; it is not a solved front or terrain-flow model.
- Icing depicts one accretion mechanism: supercooled liquid droplets on a cold
  surface. Exposure is qualitative, not minutes, millimetres or aircraft risk.
  Changing conditions starts another trial; it does not model ice melting.
- Turbulence tracers illustrate causes, not a CFD result, EDR or severity.
- Storm ingredients allow a possible illustrative cell, not a predicted storm.
  The simple three-stage cycle is not a model of every organized storm type.
- Sounding values come from the existing idealized profile. Projection changes
  coordinates, never measurements. No new CAPE integration is claimed.
- Below-ground levels are identified explicitly, not shown as available air.

Primary sources are linked in each activity: WMO International Cloud Atlas,
AWC data help, NWS educational material, and FAA Aviation Weather Handbook.
The content has not received an independent meteorologist's review.

## Illustration Provenance

New generated teaching backgrounds (not cloud-identification evidence):

- `weather-preview/public/mountain.webp`, 1536px source: felt terrain ridge,
  empty pale-pink sky, olive slopes, visible earth strata, no labels or clouds.
  Source generation: `exec-42d17cbf-c083-4194-8e44-28261ed580a5.png`.
- `weather-preview/public/wing.webp`, resized to 1200px from generated original:
  ivory leading edge on left, tapered trailing edge on right, lavender underside,
  transparent background, no ice or text. Source generation:
  `exec-7bc2e4ce-496a-4e0c-9c8f-1ada50c13489.png`.

The original coast, valley and cloud illustrations are reused. Real photographs
come from existing `src/data/clouds.js`; author, license, diagnostic text and
original-source URL travel together. Only the required files are copied into
the standalone preview build.

## Verification

- Local suite: 349 tests passed; lesson-content audit passed for all nine modules.
  Both Pages and ordinary-domain builds succeeded. Preview entry copy was absent
  from the ordinary-domain JavaScript bundle.
- All 38 new guided steps completed through browser controls at 390px width.
  Every Next gate was initially closed and opened after the requested action.
  Evidence: `guided-flows-mobile.json`.
- All 11 new exploration views checked at 320, 390, 844 and 1365px widths;
  no horizontal overflow or failed image loads in 44 cases.
  Evidence: `responsive-explore.json`.
- At 390px, the METAR slider responded to End with 4500 ft AGL. Its cloud center,
  handle center and native-track endpoint matched (0px measured displacement).
  Input and increment/decrement hit areas remain at least 44px high.
- The METAR lesson returned to chapter 3 after a full page round trip.
  Main mobile navigation retained Start, Nauka, Atlas, Warstwy and Dziennik.
- All six wind markers paused using the visible pause control. The first action
  and Next transition still worked in each of the three original experiments.
- Screenshots `06` through `12` record mobile/desktop checks. During QA the
  mountain parcel was moved above the terrain and the sounding level readout
  was enlarged before the chart.
- Focused contracts cover every guide, all lesson links, ceiling changes, TAF
  boundaries, moisture/stability separation, icing prerequisites, below-ground
  handling, projection invariance, storm ingredients and concealed photo names.

Responsive desktop-browser testing is not a physical Samsung/iPhone test or a
screen-reader audit. Native Apple builds are deliberately not part of this release.

## Publication Gate

Publish only this scoped change through the existing Pages worktree. Do not push
the whole development branch, which contains separate native/reviewer work.
Do not upload a CyberFolks package, alter the recognition model, submit Apple
builds or describe the feature as production-released before owner acceptance.
