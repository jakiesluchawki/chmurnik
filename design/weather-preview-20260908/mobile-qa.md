# Phone Interaction Fix - 2026-09-08

Scope: `/pogoda-preview/` on GitHub Pages only. No CyberFolks or Apple release.

## Reproduced

At 360x640, after entering the old cloud workbench, the illustration showed an
upward arrow that could not be dragged. The actual height slider started below
the viewport at y=683, and the guided action at y=767. A sticky scene covered
part of the controls when scrolling. Previous zero-overflow checks did not
validate this beginner journey. See `mobile-before-360.png`.

## Changes

- The parcel is a vertical accessible slider directly on the drawing. Dragging
  uses the rendered scene height, captures the active pointer, clamps 0-3000 m,
  ignores secondary contacts, and restores the starting height on cancellation.
- Tap alternatives sit immediately below the drawing: raise/lower by 100 m,
  plus the exact walkthrough target. The labelled native range retains its
  cloud handle and fine control; plus/minus hit areas are 44x44 CSS pixels.
- The instruction precedes the scene. The target action precedes the detailed
  controls. All mobile scenes scroll normally, without a sticky layer covering
  focus. Short desktop/landscape windows also disable sticky positioning.
- Only the parcel handle claims the vertical drag gesture. The rest of the scene
  retains normal scrolling; page zoom is not disabled. Native horizontal ranges
  retain vertical page panning and keyboard input.
- Scene positioning no longer depends on CSS `:has()`. The `svh` height limit
  has a pixel fallback. Existing illustrated assets, models and saved schema
  are unchanged.
- New controls respect walkthrough and assessment locks. Saved miniatures are
  not interactive. No audio, recognition changes or navigation changes.

## Verification

- 326 Node tests pass, including five new interaction regression tests; the
  event-wiring test is a source contract, not a substitute for device testing.
- All nine lesson audits pass. Preview, Pages and production-regression builds pass.
- In-app browser: all 11 walkthrough steps reach the intended exact values and
  show their explanation; completion, next step and scene switching work.
- Pointer drag on the drawing changes height from 0 to 2200 m and updates the
  cloud/temperature. Home, arrows and tap buttons act on the same height value.
- Before an assessment prediction, all inputs are disabled and direct parcel
  controls absent. After the cloud prediction, only humidity unlocks, not height.
- Layout checks: 320x568, 360x640, 390x844, 640x360, 820x1180, 1440x900.
  No horizontal overflow. At 360x640 all eleven target actions fit after entering
  their step. At shorter/landscape sizes normal vertical scrolling remains needed.
- Focused height inputs at 320x568, 390x844 and 640x360 are fully in the viewport;
  DOM hit tests confirm no illustration intercepts their centre. At 320x568 the
  input spans y=262-306 after focus, with a visible outline.
- At 1440x900 the scene is capped at 480px and its target action ends at y=792.
  At tablet width 820px the action ends at y=712. Artwork loads successfully.

Screenshots: `mobile-cloud-after-390.png`, `mobile-controls-after-320.png`,
`mobile-fog-after-360.png`, `mobile-fix-desktop.png`.

## Limits

These are local/in-app browser pointer, keyboard and responsive-layout checks.
No physical Samsung/Android, Samsung Internet, TalkBack or VoiceOver session was
available. Do not describe resized desktop pointer input as Android touch QA or
claim full WCAG conformance. The fix addresses a reproduced interaction failure;
the reporter's exact device/browser-specific behavior is not independently known.

Accessibility references: [W3C dragging alternatives](https://www.w3.org/WAI/WCAG22/Understanding/dragging-movements.html)
and [focus not obscured](https://www.w3.org/WAI/WCAG22/Understanding/focus-not-obscured-minimum.html).

## Publication

Published as f15d578 (local a567c36); Pages run 34274954913 succeeded.
Public browser loaded index-C5HGKZNO.js and index-D9tfQMk6.css. The target action
set both the native range and direct parcel control to 500 m, displayed 19.1 C,
and enabled the next step. Artwork loaded successfully.

Public preview HTML matches the locally verified build, SHA256:
bf3f3baaa2241ef608ae05714f6e91e6dfeda4ebdf34faeda6531f4a04955862.
Production chmurnik.cloud HTML before/after remains:
4c44955a6c159492fb67de3bbaeef204242000aecd8dcd430877c0d3511bfd57.
No CyberFolks package or native bundle was changed.
