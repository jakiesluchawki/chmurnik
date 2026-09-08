# Weather Preview QA - 2026-09-08

## Scope

Separate `/chmurnik/pogoda-preview/` only. Two experiments, not a native release,
not a forecast and not a newly completed full course. Existing CHMURNIK fonts,
pink/olive/violet palette and felt imagery are retained. Generated coast and
transparent cloud artwork live in `weather-preview/public/`.

## Automated Checks

- 305 Node tests pass, including 13 model/persistence/preview checks and two
  social-copy/library checks.
- Existing lesson audit: all nine modules pass.
- Standalone preview builds independently.
- Production regression builds in `build/weather-production-regression`,
  without importing the preview or changing native bundled web assets.

## Browser Checks

- 320, 390, 820 and 1440 CSS px: no horizontal overflow; artwork and fonts load.
- Both experiment tabs and hash links work; local storage survives a reload.
- Free exploration: keyboard Home/End and step buttons update conditions.
- Day/night change reverses the near-surface and return circulation together.
- Zero contrast yields calm rather than an invented wind speed.
- Cloud at 35 C / 20% / 3000 m stays unsaturated; LCL above 3000 is not clamped.
- Play advances time or altitude; pause works; altitude stops at 3000 m.
- Guided breeze: initial controls locked, answer attempt unlocks conditions,
  setting 02:00 enables explanation and preserves other inputs.
- Guided cloud: 40% vs 70% humidity at the same temperature/height changes
  saturation; wrong prediction receives an explanation, not just a score.
- Existing saved comparisons and further reading are absent from the DOM
  before the first prediction attempt.
- A/B snapshots retain all input values and restore those exact values.
- Mobile scene stays visible while adjusting lower sliders. Maximum cloud
  height has headroom below the scene caption.

## Limits

Browser viewport emulation full-page screenshots showed stitching/scaling
artifacts, so evidence retained here is ordinary viewport captures instead.
Responsive geometry was additionally checked from rendered DOM bounds.
No VoiceOver session, physical iPad test or native app test was performed:
the prototype has not yet been accepted for native integration.

Social copy is explicitly awaiting owner approval. No final social PNG/PDF
or automatic publication is claimed.
