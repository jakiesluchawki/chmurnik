---
id: "0040"
title: "Complete the Astra campaign for Instagram, Facebook and LinkedIn"
type: FEATURE
status: active
related_adr: []
related_tasks: ["0039"]
tags: ["social", "astra", "png", "pdf"]
history:
  - date: "2026-09-04"
    status: active
    who: codex
    note: "Owner requested the missing feed carousel, Facebook and LinkedIn materials for immediate manual publication."
  - date: "2026-09-04"
    status: active
    who: codex
    note: "Owner added downloadable 4K wallpapers as a bonus in the same campaign page and package."
---

# Astra Social Platforms

## Scope

Extend the existing Astra gallery and permanent media library with ten static
Instagram carousel PNGs, a Facebook graphic, a ten-page LinkedIn PDF, complete
platform-specific post copy, and downloadable platform/full bundles.
Preserve every approved headline and paragraph in the carousel and PDF.
Do not publish to social accounts or disclose private production details.
Added scope: six text-free 4K wallpaper exports, three motifs in desktop
and phone orientations, an independent wallpaper ZIP and a direct section
link for private sharing. The page is unlisted, not access-controlled.

## Acceptance Criteria

- [x] Ten 1080x1350 PNGs contain the complete approved copy and authentic UI.
- [x] Facebook PNG and three complete, platform-specific post texts are ready.
- [x] LinkedIn PDF has ten pages, selectable text, working links and verified renders.
- [x] Platform ZIPs and full ZIP include the right assets, copy and attribution.
- [x] Existing Stories and old campaigns remain available and unchanged.
- [ ] Gallery and permanent catalogue are published with working downloads.
- [ ] Six 4K wallpapers, bonus ZIP and section are visually checked and published.

## Design Decisions

### From Plan

1. **Preserve the story:** reflow approved texts into 4:5 layouts, never crop
   or abbreviate the existing 9:16 images.
2. **Reuse approved imagery:** use the six existing decorative illustrations
   and authentic app captures without generating new content.
3. **One destination:** add platform sections to `/premiera/astra/` and update
   its entry under `/assetySM/`, preserving all old URLs.

### Emerged

4. **Platform packaging:** 1080x1350 carousel, 1200x1500 Facebook hero and
   a ten-page PDF, with one complete post per platform. The full bundle also
   includes the unchanged Stories, but individual platform ZIPs stay focused.
5. **Shared gallery builder:** separate gallery generation from image rendering
   so a later Stories render cannot erase the new platform sections.
6. **PDF compatibility:** embed exact alpha-preserved wordmark PNGs instead
   of CSS masks, and remove device shadows only in print. This avoids solid
   logo rectangles and shadow artifacts in PDF renderers.
7. **Existing tools:** use bundled PDF.js/canvas for text, links and page
   rendering because Poppler is absent; no new runtime installation required.
8. **Wallpaper bonus:** choose three motifs in the approved tactile palette,
   each composed separately for desktop and phone. Preserve space for icons,
   the clock and controls, with no promotional text or branding.
9. **4K output, not native detail:** scale the six generated compositions to
   3840x2160 and 2160x3840. Disclose the upscale to the owner; keep originals
   and raw production metadata in ignored storage, outside public assets.
10. **Preserve platform bundles:** a shared bonus helper refreshes only the
    full ZIP and gallery. Instagram, Facebook and LinkedIn ZIPs stay unchanged.
11. **Link sharing:** expose `#tapety` and a copy-link button, with an explicit
    warning that the gallery is link-shareable, not access-controlled.

## Implementation Notes

Built 11 new PNGs, 11 previews, one ten-page PDF, three complete captions,
four ZIPs, publishing instructions, accessibility descriptions and two exact
wordmark color variants. Added six 4K wallpapers, six previews, their own
instructions and a separate bonus ZIP. The full ZIP has 38 entries, including
27 PNGs. The campaign page exposes Instagram, Facebook, LinkedIn, Wallpapers
and Stories sections,
copy-post buttons, individual downloads and platform bundles. The parent
catalogue retains four campaigns and now exposes 23 direct downloads.

Local QA passed on 2026-09-04: exact text/layout checks, all PNG hashes and
dimensions, all archive entries and contents, ten PDF page renders with
selectable approved text and working links, 99.4-100% OCR coverage, responsive
390/768/1440 px layouts, three post clipboard copies, one wallpaper-link copy
and ten browser downloads. All six clean RGB wallpaper exports were checked
for geometry, hashes, metadata and full/bonus ZIP inclusion. All wallpaper
compositions and mobile/desktop gallery screenshots were visually inspected.
The rendered PDF pages and contact sheets were visually inspected after the
wordmark correction. Original Stories PNGs, ZIP and manifest are unchanged.

Added six CI regression tests for copy, image geometry/metadata, captions,
bundles, wallpapers and permanent gallery links. The complete suite passes 188 tests;
the nine-module lesson audit and production Pages build pass. Existing
application tests are unchanged. Stories verification selectors were scoped
to the Stories section after adding the other platform cards.

Unrelated app release and Android worktrees remain untouched.

The core social pack was published in `c1bb78f82405f0b261949b1f81d941fe995da2c4`
with successful Pages workflow 33878739060 before the bonus was ready, so the
owner could start manual social publication immediately. Wallpaper deployment
and final public hash checks remain pending.

## Issues Encountered

- PDF extraction maps the visible nonbreaking hyphen to ASCII. QA normalizes
  only those equivalent hyphens and whitespace; source/PNG copy stays exact.
- Chromium rounds the PDF page height by 0.54 points. Geometry assertions
  allow less than one point, consistent with the previous campaign validator.
- Visual review caught unsupported CSS mask and shadow output in PDF.js;
  fixed with direct alpha PNG wordmarks and print-only shadow removal.

## Future Work

None required.
