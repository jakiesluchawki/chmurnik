# CHMURNIK Launch Media Kit

## Current Release: Poland, 2026-09-02

Five 1080 x 1920 Instagram Stories and two bonus 1080 x 1350 feed posts.
Polish App Store availability and the 0 PLN price were confirmed through
Apple's public software lookup on 2026-09-02. App Store Connect also
reported READY_FOR_SALE and 175 AVAILABLE territories earlier that morning.
The owner selected non-trader for this app; account-level trader verification
is separate and is not represented as complete.

Download gallery: https://jakiesluchawki.github.io/chmurnik/premiera/
Sticker destination: https://apps.apple.com/pl/app/chmurnik/id6782159027

The source directory retains the initial launch date. Its current renderer
and gallery now produce the Polish launch package, not the old DSA-waiting
announcement. New exports have pl-story / pl-post prefixes and dated ZIP
names to keep them distinct from previously shared files.

## Deliverables

- Five separate Stories: announcement, atlas, private collection, wind,
  and a typography-led invitation to download.
- Two bonus feed posts and Polish Instagram/Facebook, LinkedIn and Threads copy.
- chmurnik-storki-pl-2026-09-02.zip: five full-resolution JPGs, sticker guide,
  and read-me. No preview images.
- chmurnik-polska-2026-09-02.zip: all seven JPGs and all text files.
- Each Story has an empty 600 x 120 px sticker area at x=240, y=1510.
  The sticker must be added in Instagram; a JPG cannot contain a clickable link.
- The gallery provides the correct URL and suggested sticker text beside
  every Story, plus a one-tap link copy action with a selection fallback.
- Individual image download, preloaded File Share and direct-image fallback
  remain available for iPhone Safari.

No Instagram or other social-account post was submitted.

## Design And Provenance

Original CHMURNIK wordmark, Romie/Roobert typography, pink/olive/violet palette,
existing felt illustrations, real Cirrus photography and an unretouched
Release iOS screenshot. No new AI imagery, invented phone UI, altered model
results or simulated scientific photos. HTML/CSS composition is deterministic.

The per-export manifest records exact dimensions, SHA-256, byte size, original
source paths, alt text, link labels and sticker geometry. Original font files
are not included in the ZIPs. Photograph attribution remains visible below
the sticker area; full source/license details are in the gallery and read-me.

The approved source photograph is PiccoloNamek's CirrusField-color.jpg under
CC BY-SA 3.0. The full screenshot is scaled and framed, not edited internally.
Photo-derived parts retain their license; this does not grant rights to the
fonts, trademarks or other application elements.

## Regeneration

Run from the repository root with Playwright's installed browser runtimes:

```sh
node social/2026-08-30/render.mjs --playwright-path /path/to/playwright-core/index.mjs
node social/2026-08-30/package.mjs
npm test
npm run check:lessons
npm run build:pages
node social/2026-08-30/verify.mjs --playwright-path /path/to/playwright-core/index.mjs
```

For a deployed check add --base https://jakiesluchawki.github.io/chmurnik/premiera/
to the verifier command. The gallery stays outside public/ and is copied to
the Pages artifact by the existing workflow; it is not bundled into iOS.

## Verification On 2026-09-02

- All seven exports visually inspected, with loaded original fonts, exact
  pixel sizes, bounded text, safe zones and collision-free sticker areas.
- Both ZIPs pass integrity and exact-entry-list checks.
- All 165 Node tests and nine lesson audits pass; the Pages production build passes.
- Local Chromium and WebKit checks pass at 320, 390 and 1440 px: no horizontal
  overflow or page errors; all seven image hashes and both ZIP downloads match.
- All five sticker URLs and copy actions pass, including denied-clipboard
  fallback. The File Share contract passes for a preloaded JPEG.
- Native Save Image on a physical iPhone was not automated. The gallery retains
  direct JPG and ZIP fallbacks; this is not a claim of physical-device testing.

## Initial Package History

The 2026-08-30 package announced Apple's approval while Poland/EU were still
blocked. Its four Stories, two posts and two gated download variants were
valid for that date only. Those historical files remain for old links, but
are not offered by the current gallery. Do not publish their DSA-waiting copy.
