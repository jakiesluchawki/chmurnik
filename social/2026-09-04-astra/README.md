# Astra Static Stories

Ten owner-approved Polish Instagram Stories, exported as static RGB PNGs,
1080 x 1920. No videos, soundtrack, or automatic social posting.

## Delivery

- Gallery: https://jakiesluchawki.github.io/chmurnik/premiera/astra/
- `site/png/`: ten originals, numbered 01-10.
- `site/CHMURNIK-ASTRA-10-STORIES-PNG.zip`: ten PNGs, full text and sticker
  links, instructions and photo attribution. No font files in the ZIP.
- `site/previews/`: lightweight gallery previews, not the delivery originals.
- `site/manifest.json`: dimensions, exact copy, links, byte sizes and SHA-256.

## Copy And Identity

`copy.mjs` preserves all ten approved headlines and paragraphs verbatim.
Romie, Roobert and the original CHMURNIK wordmark are rendered deterministically.
Body text is 38 px; headline text is 76-102 px. Main content stays within
the 60 px horizontal and 210/216 px vertical safe boundaries. A blank area
above the footer is reserved for an Instagram link sticker.

The creative mentions only approved public claims about Astra. It neither
names nonpublic tools nor implies OpenAI endorsement. In particular, Story
05 distinguishes assistance in building the app from on-device photo analysis.

## Asset Provenance

The six atmospheric illustrations are decorative, not reference photographs
or evidence for cloud identification. Original 1536 x 1024 artwork is retained
locally in git-ignored `art/`, not uploaded with the repository or public pack.
Production prompts, raw tool receipts and original artwork metadata are excluded
from the public package. Final browser-rendered PNGs contain the composition.

The six original screenshots in `captures/` were copied byte-for-byte from
existing CHMURNIK QA and campaign captures made on September 3, 2026:

- `mobile-home.png`: working mobile-layout interface from domain QA.
- `mobile-atlas.png`, `mobile-metar.png`, `mobile-wind.png`: working interface
  captured in an isolated browser during the previous campaign. These are
  not photographs of a physical iPhone.
- `ipad-atlas.png`: genuine iPad simulator screenshot used for the App Store.
- `mac-atlas.png`: genuine native Mac Catalyst capture used for the App Store.

Screenshots are scaled and rotated inside decorative frames, without
replacing data or retouching photographs. Cirrus photo attribution remains
on the relevant Stories and in `site/ZRODLA-ZDJEC.txt`. Examples are educational.
Apple review status in the approved text was confirmed on September 4, 2026.

## Reproduction And QA

From the working repository, with the retained local artwork and the existing
local Playwright installation:

```sh
node social/2026-09-04-astra/render.mjs
node social/2026-09-04-astra/verify.mjs
```

Rendering uses a loopback-only server and an isolated headless browser, never
the user's open browser profile. Verification uses Apple Vision OCR on macOS,
exact DOM equality, font and bounding-box assertions, PNG metadata and hashes,
ZIP integrity, clipboard copying and actual browser downloads. Gallery widths
checked: 390, 768 and 1440 px. No existing application tests were changed.
Local QA reports and review screenshots are under `build/astra-stories-qa/`.

The public Pages workflow copies only `site/`, not production source files,
into `/premiera/astra/`. Previous galleries and application code are unchanged.
