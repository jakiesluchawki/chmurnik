# CHMURNIK: Complete Origin-Story Package

Prepared on September 2 for September 3, 2026. The owner approved all ten
Polish Stories before production, then requested Instagram carousel,
LinkedIn and Facebook adaptations. This supersedes the five-part draft
without deleting it or the previously published launch pack.

Download gallery: https://jakiesluchawki.github.io/chmurnik/premiera/historia/

## Browser Launch Update V3

On September 3 the owner requested complete LinkedIn and Facebook posts
promoting https://chmurnik.cloud/ alongside the iPhone app. Both texts lead
with the browser address, retain the personal origin and practical features,
and distinguish the educational tools from measurements or an official
briefing. The Facebook image now includes the domain. Ten fast V2 films,
approved Story copy, Instagram caption/carousel and the LinkedIn PDF are
unchanged. The PDF continues to show the iPhone interface, as the post states.

`package.mjs` refreshes caption TXT files and manifest copy directly from
`captions.mjs` before rebuilding all six archives. The gallery/download
revision is `20260903-web-v3`; each film retains its own V2 revision. For a
copy-only update, run packaging rather than regenerating videos or JPGs.
The shared JPG renderer supports `--only facebook-z-kogos-bliskiego` while
retaining the other exports, documents and video metadata in the manifest.

## Fast Edit V2

The owner rejected the original reading-time pacing and disappearing text
excerpts. All ten films now last 6-8 seconds, with 4-6 action-led shots each.
The whole approved lead, body and CTA remain visible on every video frame.
Underlines change emphasis without replacing or hiding any words. Source
footage is cut, reframed and briefly accelerated, not used to fabricate UI.
Four static reading cards have become product montages. No soundtrack is
included: the owner chooses music inside Instagram.

`promo.mjs` declares the 49 source-time cuts. `video.mjs` validates and renders
persistent text overlays; `promo.swift` composites real captured pixels and
encodes silent H.264. Explicit sRGB input / Rec.709 output avoids a gamma
shift in the brand palette. `captures/promo-edit.json` records the edit,
complete copy, layout bounds and overlay hashes. Revisioned URLs prevent
the mobile gallery from serving a previously cached slow MP4 or ZIP.

## Deliverables

- Ten silent 1080 x 1920 H.264 MP4 Stories, numbered 01-10. Six are genuine
  app walkthrough edits; four are brisk product montages. Each lasts 6-8 s.
- Ten alternative 1080 x 1920 JPG Stories with the entire approved copy.
- Ten 1080 x 1350 JPG carousel slides and a complete Instagram caption.
- A ten-page LinkedIn PDF and a distinct, complete LinkedIn post.
- A 1080 x 1350 Facebook image and a complete Facebook post.
- Full approved copy, ten App Store sticker labels, alt text, photo credits,
  individual downloads and six ZIPs. The full archive is about 51 MB.

All App Store links point to Apple ID `6782159027`; LinkedIn and Facebook
also invite readers to the browser version at `chmurnik.cloud`. The JPG/MP4 files
do not contain an interactive Instagram sticker: the owner must add it in
Instagram. The clear sticker area is x=240, y=1510, w=600, h=120. Each MP4
and same-numbered JPG are alternatives, not consecutive parts of the series.
No social account has been posted to automatically.

## Content And Evidence

`copy.mjs` is the canonical, approved ten-part narrative. It preserves the
owner's latest correction that the pilot already flies with an engine. It
does not invent a relative's name, relationship, trip location or credential.
`captions.mjs` contains the platform adaptations and the complete transcript.

The original Romie/Roobert, pink/olive/violet/cream palette, wordmark and
felt observer asset are retained. Photographic evidence is real and comes
from the application's licensed atlas, not generated cloud imagery.

`capture.mjs` records an isolated browser running the genuine React app in
its mobile native-layout presentation. It records actual taps, swipes,
form input and range changes. The touch indicator and narrative are outside
the unmodified app frame. These are not recordings from a physical iPhone.

The six walkthroughs show:

1. Atlas selection, Cirrus photography, description and recognition cues.
2. A fragment of the first lesson, its question and revealed explanation.
3. METAR/TAF guidance, pasted sample report, parsing and wind-token details.
4. Cloud-base layer selection, units/reference, question and feedback.
5. A real terrain-height slider and the unchanged 850 hPa pressure surface.
6. Yacht-speed and heading changes, apparent-wind readouts and wind rose.

Vertical gestures use the frame gutter to avoid touching range controls.
The final sailing state is asserted after scrolling: true wind unchanged,
boat speed about 15 kt and heading about 135 degrees. No app values are
replaced for filming. The first lesson is only an excerpt, not a claimed
completion. The METAR is explicitly synthetic; Windy is an independent
educational workshop without integration. The phone does not measure wind.

## Reproduction

From the repository root, with Node, Sharp, macOS Swift/AVFoundation and
Playwright available:

```sh
node social/2026-09-03-full/capture.mjs --playwright-path /path/to/playwright/index.mjs --browser-path /path/to/browser
node social/2026-08-30/render.mjs --campaign social/2026-09-03-full --playwright-path /path/to/playwright/index.mjs --browser-path /path/to/browser
node social/2026-09-03-full/document.mjs --playwright-path /path/to/playwright/index.mjs --browser-path /path/to/browser
node social/2026-09-03-full/video.mjs --playwright-path /path/to/playwright/index.mjs --browser-path /path/to/browser
node social/2026-09-03-full/verify-copy.mjs
node social/2026-09-03-full/package.mjs
npm test
npm run check:lessons
npm run build:pages
node social/2026-09-03-full/verify.mjs --playwright-path /path/to/playwright/index.mjs --browser-path /path/to/browser
python3 social/2026-09-03-full/qa-pdf.py --pdftoppm /path/to/pdftoppm
node social/2026-09-03-full/contact-sheets.mjs
```

Run document, video and packaging after the shared JPG renderer: it creates
a fresh manifest. `--only wind` on the capture script re-records one demo;
retained frame plans remain under ignored `build/social-full/`.
The V2 time windows refer to the retained source captures. If recording again
on a different machine changes event timing, align `promo.mjs` cut windows
with that capture's event log and inspect the resulting actions.

## Verification

- The Node suite, nine lesson audits and the Pages production build are
  required before publishing an edit.
- All 21 JPGs have the specified geometry, loaded original fonts, complete
  approved text and clear safe/sticker areas; visual inspection is complete.
- AVFoundation verifies ten silent MP4s, their dimensions and duration.
  Chromium decodes and seeks all ten, checks genuine changing frames for
  all ten edits, and plays each through to its end.
- `verify-copy.mjs` reads 49 actual decoded shot frames and all 21 JPGs using
  Vision OCR, comparing against the complete canonical copy. Exact DOM
  text/bounds checks and visual review remain authoritative; OCR is an
  additional missing-sentence guard, not proof of every accent or space.
  Decoded palette samples are also compared with the source colors.
- PDF inspection confirms ten uniform pages, complete approved visible
  characters, self-contained font glyphs, original photo-source links and
  the final App Store link. All pages were rendered with Poppler and viewed.
- Gallery checks pass at 320/390/1440 px without horizontal overflow or
  script errors. All 38 media/archive hashes and seven ZIP/PDF download
  actions pass; complete captions, clipboard fallback and ten stickers pass.
- JPG/MP4 File Sharing was tested with a simulated browser API, not a
  physical iPhone or an actual Instagram upload.
- Both older galleries and the full production app flow pass regression.
  A pre-existing QA race was corrected by waiting for the two animation
  frames around production onboarding before testing its skip control.

Evidence: `captures/provenance.json`, `captures/promo-edit.json`, `site/manifest.json`,
`tests/social-full-pack.test.mjs` and ignored `build/social-full/`.
The Pages workflow copies this gallery to `dist/premiera/historia`; social
assets are not included in the embedded iOS app. Private analytics, raw
recording frames, account data, tokens and font files are excluded from ZIPs.
