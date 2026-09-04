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
---

# Astra Social Platforms

## Scope

Extend the existing Astra gallery and permanent media library with ten static
Instagram carousel PNGs, a Facebook graphic, a ten-page LinkedIn PDF, complete
platform-specific post copy, and downloadable platform/full bundles.
Preserve every approved headline and paragraph in the carousel and PDF.
Do not publish to social accounts or disclose private production details.

## Acceptance Criteria

- [x] Ten 1080x1350 PNGs contain the complete approved copy and authentic UI.
- [x] Facebook PNG and three complete, platform-specific post texts are ready.
- [x] LinkedIn PDF has ten pages, selectable text, working links and verified renders.
- [x] Platform ZIPs and full ZIP include the right assets, copy and attribution.
- [x] Existing Stories and old campaigns remain available and unchanged.
- [ ] Gallery and permanent catalogue are published with working downloads.

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

## Implementation Notes

Built 11 new PNGs, 11 previews, one ten-page PDF, three complete captions,
four ZIPs, publishing instructions, accessibility descriptions and two exact
wordmark color variants. The full ZIP has 31 entries, including 21 PNGs.
The campaign page exposes Instagram, Facebook, LinkedIn and Stories sections,
copy-post buttons, individual downloads and platform bundles. The parent
catalogue retains four campaigns and now exposes 22 direct downloads.

Local QA passed on 2026-09-04: exact text/layout checks, all PNG hashes and
dimensions, all archive entries and contents, ten PDF page renders with
selectable approved text and working links, 99.4-100% OCR coverage, responsive
390/768/1440 px layouts, three clipboard copies and seven browser downloads.
The rendered PDF pages and contact sheets were visually inspected after the
wordmark correction. Original Stories PNGs, ZIP and manifest are unchanged.

Added five CI regression tests for copy, image geometry/metadata, captions,
bundles and permanent gallery links. The complete suite passes 187 tests;
the nine-module lesson audit and production Pages build pass. Existing
application tests are unchanged. Stories verification selectors were scoped
to the Stories section after adding the other platform cards.

Unrelated app release and Android worktrees remain untouched.

## Issues Encountered

- PDF extraction maps the visible nonbreaking hyphen to ASCII. QA normalizes
  only those equivalent hyphens and whitespace; source/PNG copy stays exact.
- Chromium rounds the PDF page height by 0.54 points. Geometry assertions
  allow less than one point, consistent with the previous campaign validator.
- Visual review caught unsupported CSS mask and shadow output in PDF.js;
  fixed with direct alpha PNG wordmarks and print-only shadow removal.

## Future Work

None required.
