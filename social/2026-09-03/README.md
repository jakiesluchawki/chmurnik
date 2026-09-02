# CHMURNIK: Origin-Story Instagram Pack

Prepared on 2026-09-02 for publication by the owner on 2026-09-03.
This is a media handoff, not an Instagram scheduling or posting integration.

## Brief And Story

The owner requested five Stories explaining the app's origin and features,
including demos and Windy. The owner then supplied the specific origin:
a glider pilot in the family is studying for a PPL; CHMURNIK began as help
recognizing clouds. METAR training followed, then the Windy-reading workshop.
The wind module proved useful during a sailing trip with friends. No relative's
name, exact relationship, completed PPL, trip location or operational clearance
has been inferred. The story is written in the owner's first person.

On 2026-09-02 the owner explicitly approved the existing `/premiera/` download
gallery and authorized updating it or publishing a new dated link. This pack
uses `/premiera/2026-09-03/`, linked from the unchanged launch assets.

## Deliverables

All five JPGs are opaque 1080 x 1920, 9:16. Stories 03 and 04 also have
H.264 MP4 alternatives at 1080 x 1920, 30 fps, with no audio track.

| Order | Story | Recommended file |
| --- | --- | --- |
| 01 | Pilot in the family; helping identify clouds | `images/jutro-01-geneza.jpg` |
| 02 | METAR training; authentic TAF-reader screen | `images/jutro-02-metar.jpg` |
| 03 | Learning levels, models and time for reading Windy | `videos/jutro-03-windy.mp4`, 12 s |
| 04 | Sailing; true and apparent wind | `videos/jutro-04-zagle.mp4`, 10.6 s |
| 05 | Made for someone close, shared with everyone | `images/jutro-05-dla-was.jpg` |

The alternate JPGs for 03/04 are substitutes, not two extra Stories.
`site/chmurnik-historia-2026-09-03.zip` contains all five JPGs, both MP4s,
the Polish guide and two text files. The second ZIP contains only JPGs/texts.
Font files, capture frames and private analytics are excluded from downloads.

Every Story reserves x=240, y=1510, w=600, h=120 for an actual Instagram Link
sticker. No fake clickable sticker is baked in. The app destination is
`https://apps.apple.com/pl/app/chmurnik/id6782159027`. Copyable links and
individual sticker labels are in the gallery and `captions.mjs`.

## Visual System And Evidence

- Reuse the approved Romie/Roobert, pink/olive/violet/cream and felt identity.
  No new generated imagery, fabricated app UI or generic stock decoration.
- Story 01 uses the complete original `03-atlas.png` from
  `design/app-store/screenshots/`, scaled without editing its contents.
  The Cirrus photo is PiccoloNamek's **CC BY-SA 3.0** image:
  <https://commons.wikimedia.org/wiki/File:CirrusField-color.jpg>.
  Keep the visible credit. The guide and gallery link the license.
- Story 02 uses the complete original `05-taf.png`. The copy explicitly says
  this screen is the adjacent TAF reader, not a fabricated METAR screenshot.
  Native screenshots came from the real Release iOS simulator, not a phone.
- Demos are captured from genuine React workshop components in an isolated
  browser with native-layout styling. Actual controls change actual readouts;
  no injected weather, model fixture, edited values or private data. Source
  routes, poster hashes and method are recorded in `captures/provenance.json`.
- The Windy exercise is independent, not an integration, live map or data feed.
  Synthetic training data and operational limits remain visible in the exports.
  The phone is not represented as measuring wind.
- No photo/model accuracy, flying qualification or safety outcome is claimed.

## Reproduction

Use a locally available Playwright module and clean Chromium-compatible browser.
The following commands run from the repository root. Provide local values for
`$PLAYWRIGHT_PATH` and `$BROWSER_PATH`; no personal browser profile is needed.

```sh
node social/2026-09-03/capture.mjs --playwright-path "$PLAYWRIGHT_PATH" --browser-path "$BROWSER_PATH"
node social/2026-08-30/render.mjs --campaign social/2026-09-03 --playwright-path "$PLAYWRIGHT_PATH" --browser-path "$BROWSER_PATH"
node social/2026-09-03/video.mjs
node social/2026-09-03/package.mjs
npm test
npm run check:lessons
npm run build:pages
node social/2026-09-03/verify.mjs --playwright-path "$PLAYWRIGHT_PATH" --browser-path "$BROWSER_PATH"
node social/2026-08-30/verify.mjs --engine chromium --playwright-path "$PLAYWRIGHT_PATH" --browser-path "$BROWSER_PATH"
```

The MP4 encoder uses macOS AVFoundation via `xcrun swift`. It requires access
to the system H.264 encoder. Intermediate frames, jobs and decoded QA samples
live in ignored `build/social-2026-09-03/`, never in the public gallery.
Run `video.mjs` after rendering because rendering rebuilds the manifest.

## Verification

- Deterministic renderer: all fonts ready, 1080 x 1920 output, safe-area bounds
  and sticker exclusion checks pass for all five JPGs.
- Five poster/preview exports and two decoded MP4 frames inspected visually.
- AVFoundation verifies a single 1080 x 1920 video track, no audio and the
  planned duration. Chromium decodes, seeks to three distinct states and plays
  both films to completion. Their hashes match the manifest.
- Gallery checks: 320/390/1440 px, both ZIP downloads, all individual image/video
  hashes, captions, clipboard fallback, five App Store links and simulated
  File Sharing for both JPEG and MP4. Previous launch-gallery checks also pass.
- The new browser run uses isolated Brave/Chromium. A physical iPhone share
  sheet and Instagram upload are not automated or claimed tested. Direct
  file/download fallbacks remain available.
- CI runs the focused export/provenance tests with the full application suite.
  Pages copies both galleries after building; media is not bundled in iOS.

See `site/manifest.json` for exact sizes and hashes and
`site/CZYTAJ-MNIE.txt` for Polish publishing instructions.
