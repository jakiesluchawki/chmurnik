# Launch Media, 2026-08-30

Owner-requested Instagram Stories and social posts, connected to release
task [0033](../../lore/1-tasks/active/0033_FEATURE_app-store-launch.md).
The exported gallery is deployed at `/chmurnik/premiera/` on GitHub Pages.
No posts were sent to social accounts. No app feature or iOS binary changed.

## Availability Evidence

Read-only App Store Connect verification at `2026-08-30T21:43:27.097Z`:

- App `6782159027`, version `1.0`, build `20260826214336`: `READY_FOR_SALE`.
- Submission `48f55907-6f36-4ea6-9874-7f169a1f9382`: `COMPLETE`.
- 148 territories `AVAILABLE`; 27 EU territories `TRADER_STATUS_NOT_PROVIDED`.
- Public iTunes lookup earlier in this session: US returned the free 1.0
  listing, Poland returned zero results. This does not establish a DSA ETA.
- The owner's last Business screenshot showed DSA `In Review`. No connected
  signed-in browser was available in this session; the API does not reveal
  whether Business is waiting for more documents. No legal declaration changed.
- Apple's [DSA guide](https://developer.apple.com/help/app-store-connect/manage-compliance-information/manage-european-union-digital-services-act-trader-requirements/)
  provides no guaranteed processing deadline. Do not promise a date.

## Deliverables

- Four 1080 x 1920 Stories and two 1080 x 1350 posts suitable for the current
  approval announcement, not a claim of immediate availability in Poland.
- Two clearly separated download-CTA variants for use only after confirming
  Polish availability. They are behind a warning disclosure and in another ZIP.
- Instagram/Facebook, LinkedIn and Threads captions; a later Polish-launch caption.
- Individual JPEGs, small gallery thumbnails, two validated ZIPs, copy buttons,
  progressive file sharing, direct image/download fallbacks, and Polish instructions.
- SHA-256, pixel size, provenance and public usage notes in `site/`.

## Design Decisions

### From Plan

1. Preserve pink/olive/violet, original Romie/Roobert typography, the exact
   wordmark and approved felt objects. Keep clouds photographic.
2. Deliver actual finished images and copy, not a proposal or contact sheet.

### Emerged

3. Split approval and download messaging after discovering the EU restriction.
4. Compose deterministically from approved assets instead of generating a new
   phone UI or fake cloud photograph. Capture the original fonts in raster files.
5. Deploy the gallery separately from `public/` so future iOS and CyberFolks
   bundles do not include marketing files. Pages copies only `site/` after build.
6. Prepare image Files before the share tap to retain iOS user activation;
   keep a direct JPEG and download link when native sharing is unavailable.

## Regeneration

The renderer needs Playwright (or a supplied `playwright-core/index.mjs`) and
Chromium, plus the repository's existing Sharp dependency. No new app dependency.

```sh
node social/2026-08-30/render.mjs --playwright-path /path/to/playwright-core/index.mjs
node social/2026-08-30/package.mjs
npm test
npm run check:lessons
npm run build:pages
node social/2026-08-30/verify.mjs --playwright-path /path/to/playwright-core/index.mjs
```

`verify.mjs` copies the already rendered gallery into the local Pages build.
Use `--base https://jakiesluchawki.github.io/chmurnik/premiera/` for live QA.
The runtime Browser plugin was tried and reported no available browser;
QA therefore used isolated headless Chromium and WebKit, not a user profile.

## Verification

- 165 Node tests pass, including 3 new export/availability tests.
- Nine lesson audits and the full Pages build pass.
- Both Chromium and WebKit pass at 320, 390 and 1440 CSS pixels: no horizontal
  overflow, exact image hashes, both ZIPs, actual browser download, caption
  fallback selection, and the warning boundary for the later CTA variants.
- File-share invocation was tested with a simulated API contract. This is
  not a claim that a physical iPhone's native Save Image sheet was exercised.
- Existing production-browser route/workshop/collection QA passes unchanged.
- All eight final graphics were visually inspected. The first render had an
  illustration overlap; spacing was corrected before export. Safe text regions
  are asserted and all original fonts are verified loaded during rendering.
- The initial share-contract test scrolled the whole tall grid rather than its
  first card, leaving that card outside the prefetch observer. Corrected the
  test target; both browser engines then pass. No pre-existing test was weakened.
- Source image and screenshot provenance: `site/CZYTAJ-MNIE.txt` and the
  existing `design/app-store/screenshots/manifest.json`.

EU eligibility and the broader physical-device matrix remain open in task
0033/0032. This media handoff does not close those release checks.
