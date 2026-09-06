# Dialog Keyboard Regression, September 6

After verifying the owner's root-domain deployment, continued the outstanding
accessibility checks without host GUI control. The source at 1becc44 only
wrapped Tab from the first/last interactive descendant. Onboarding and photo
recognition deliberately focus the dialog container initially, so Shift+Tab
escaped to an obscured background control. A later lost focus also stayed
outside the modal on Tab.

## Reproduction And Fix

The new `scripts/check-dialog-focus.mjs` runs the actual React application in
fresh browser contexts with existing isolated native/photo QA flags. No user
profile, private photograph or host permission is used. Before the fix, eight
of 24 named checks failed: initial reverse navigation and outside recovery in
both entry flows at 390 and 1440 pixels. Browser errors were empty. Inspected
the wide photo screenshot: focus was visibly behind the modal.

The shared `useDialogFocus` now treats its container or an element outside the
active dialog as an entry point: Tab goes to the first control; Shift+Tab to
the last. Existing wrapping, Escape handling, top-dialog stack protection,
focus restoration and body-scroll restoration are retained. No strings,
styles, image resources, model behavior or native security settings changed.

## Verification

- Final Chromium: 28 named checks passed, zero browser errors.
- Final WebKit: the same 28 checks passed, zero browser errors.
- Each engine checks initial forward/reverse entry, forward/reverse wrap,
  outside recovery in both directions, Escape, trigger restoration and nested
  atlas sources at both widths. The nested test confirms Escape closes only
  sources, returns focus to the cloud card and restores body scrolling only
  after the last dialog closes.
- Inspected the final WebKit wide photo capture: reverse entry focuses
  "Wybierz z biblioteki" inside the modal, not the page beneath it.
- All 273 application unit/integration tests passed, zero skips/failures.
- All nine lessons still pass the content quality contract.
- The full native-layout fixture photo harness passed two repeated selection,
  local analysis, save/persistence and delete journeys. This does not measure
  model accuracy or camera hardware.
- Production build succeeded with `index-De1I22Bw.js`. CSS remains
  `index-CNpHOjaI.css`; shared scientific content remains
  `cloud-knowledge-D6Z4Kt1b.js`.
- The full field UI harness passed against that separate production directory
  with the delivered Apache security headers: storage/backup, METAR/TAF,
  wind/maps, atlas, lesson routes and 42 route/viewport visits. No uncaught
  JavaScript errors or CSP violations occurred.

Artifacts are local and ignored:

- `build/v4-dialog-focus-before/results.json` and failure screenshots.
- `build/v4-dialog-focus-final-chromium/results.json` and captures.
- `build/v4-dialog-focus-final-webkit/results.json` and captures.
- `build/v4-dialog-focus-photo-regression/`.
- `build/v4-dialog-focus-production/` and its `-qa/` captures.

Reproduce with the installed Playwright module and browser executable via
`--playwright-path` / `--browser-path`; omit the latter and use `--engine webkit`
for installed WebKit. The harness uses temporary browser contexts and always
closes its browser and Vite servers.

## Release Boundary

This source patch is prepared for the next release; it is not included in the
already submitted Apple 1.2 archives or live root/Pages build 7a1d618. No
submission was withdrawn and no website or owner ZIP was silently replaced.
Browser WebKit is not a native-device/VoiceOver acceptance test. The remaining
physical-device, larger-text and independent classifier-quality gates remain
open; this focused correction does not complete the overall goal.
