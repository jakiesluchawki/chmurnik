# Niebo: Static Campaign And Wallpaper Delivery

Owner scope: finish 20 additional motifs, separately composed desktop/phone
images, both original-resolution and explicitly enlarged 4K PNGs. Preserve
the permanent `/assetySM/` library and every previous campaign.

The first ten stories preserve the complete previously approved copy. The owner
subsequently authorized three progress updates and new captions about the
unreleased research model and Android. Those are separate from an accuracy or
Google Play launch announcement. Previous platform captions are also retained
as `teksty/*-historia.txt`. No social account was posted to automatically.

## Outputs

- 13 Stories PNG (1080x1920) and 13 carousel PNG (1080x1350).
- One Facebook PNG (1200x1500), a 13-page LinkedIn PDF, current and older captions.
- 20 motifs x two generated compositions x original/enlarged = 80 wallpaper PNG.
- Sources are 1672x941 or 941x1672; original RGB pixels remain identical.
- Enlarged outputs are 3840x2160 and 2160x3840, Lanczos3, explicitly disclosed.
- Seven ZIPs are built outside Pages in `build/niebo-social-downloads/`.

Originals and exports are downloadable individually from release
`sm-niebo-20260907`. Pages contains previews and social PNG/PDF, but not duplicate
full-resolution wallpaper directories or ZIPs. This keeps the combined existing
galleries below the site's delivery size budget. All original sources/receipts
remain locally preserved; no private consultation files enter this campaign.

## Rebuild And Check

Run `node social/2026-09-07-niebo/build.mjs`, then the library builder and
`node social/2026-09-07-niebo/check.mjs`. Set `PLAYWRIGHT_MODULE` to an installed
Playwright module if the bundled desktop runtime is elsewhere. The builder
requires the local source art and existing approved screen captures; CI deploys
the final tracked outputs without regenerating images. Tests validate dimensions,
hashes, preserved copy, truthful status and privacy separation.

Visual QA covers all 40 source compositions, all 13 Story layouts, PDF previews,
original RGB equality, and gallery widths 320/390/768/1440. The 4K label denotes
output dimensions, not native generation detail. Illustrations are decorative,
not cloud-identification photographs. Screen captures retain the original source
credits and are historical genuine app-interface captures, not new device QA.
