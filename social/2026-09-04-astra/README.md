# Astra Social Campaign

Ten owner-approved Polish Instagram Stories, exported as static RGB PNGs,
1080 x 1920, plus the complete feed/Facebook/LinkedIn package. No videos,
soundtrack, or automatic social posting.

## Delivery

- Gallery: https://jakiesluchawki.github.io/chmurnik/premiera/astra/
- `site/png/`: ten originals, numbered 01-10.
- `site/CHMURNIK-ASTRA-10-STORIES-PNG.zip`: ten PNGs, full text and sticker
  links, instructions and photo attribution. No font files in the ZIP.
- `site/previews/`: lightweight gallery previews, not the delivery originals.
- `site/manifest.json`: dimensions, exact copy, links, byte sizes and SHA-256.
- `site/karuzela/`: ten 1080 x 1350 PNGs with all approved copy, reflowed for feed.
- `site/facebook/`: a 1200 x 1500 PNG hero with the website address.
- `site/CHMURNIK-ASTRA-LINKEDIN.pdf`: ten pages, selectable Polish text,
  original typography and links to the website, App Store and photo sources.
- `site/teksty/`: complete Instagram, Facebook and LinkedIn posts, profile
  links and accessibility descriptions.
- `site/CHMURNIK-ASTRA-{INSTAGRAM,FACEBOOK,LINKEDIN}.zip`: platform bundles.
- `site/CHMURNIK-ASTRA-PELNY-PAKIET.zip`: all 27 PNGs, PDF, posts and guidance.
- `site/tapety/`: six text-free 4K wallpaper PNGs, three motifs in separate
  3840x2160 desktop and 2160x3840 phone compositions.
- `site/CHMURNIK-TAPETY-4K.zip`: six wallpapers and their own instructions.
- Direct bonus link: https://jakiesluchawki.github.io/chmurnik/premiera/astra/#tapety
- `site/platforms-manifest.json`: platform assets, full post copy and hashes.
- Permanent bookmark: https://jakiesluchawki.github.io/chmurnik/assetySM/

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
node social/2026-09-04-astra/platforms.mjs
node social/2026-09-04-astra/wallpapers.mjs
node social/2026-09-04-astra/verify-platforms.mjs
node social/library/build.mjs
```

Rendering uses a loopback-only server and an isolated headless browser, never
the user's open browser profile. Verification uses Apple Vision OCR on macOS,
exact DOM equality, font and bounding-box assertions, PNG metadata and hashes,
ZIP integrity, clipboard copying and actual browser downloads. Gallery widths
checked: 390, 768 and 1440 px. No existing application tests were changed.
Local QA reports and review screenshots are under `build/astra-stories-qa/`.

Platform QA lives in `build/astra-platforms-qa/`. The bundled PDF.js and
canvas modules render every PDF page when Poppler is unavailable. Set
`PDF_QA_MODULES` to a directory containing `pdfjs-dist` and `@napi-rs/canvas`
on another host. Full text, links, geometry, OCR, all archive contents,
clipboard operations and browser downloads are checked. The original Stories
manifest and asset hashes remain unchanged. The common `gallery.mjs` builder
preserves the full gallery when either format is rendered again.

## Wallpaper Bonus

The six wallpaper compositions reuse the approved tactile visual language:
cloud/star, open-sky arch and cloud orbits. Portrait scenes were composed
separately with clock/control space; they are not crops of the desktop views.
The supplied raw artworks are about 1672x941 or 941x1672, then scaled to the
specified 4K output dimensions. They are not described as native 4K detail.
No promotional text or logo is added. Local sources and production metadata
stay in git-ignored `art/wallpapers/`; clean exports contain only image data.

`wallpaper-bundle.mjs` refreshes the full pack without changing platform-only
ZIPs. Both export flows preserve the bonus and the same gallery address.
The gallery is noindex and link-shareable, but not access-controlled; this
limitation was disclosed to the owner before publication.

The public Pages workflow copies only `site/`, not production source files,
into `/premiera/astra/`. Previous galleries and application code are unchanged.
