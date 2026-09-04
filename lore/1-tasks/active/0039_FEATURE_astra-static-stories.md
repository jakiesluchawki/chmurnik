---
id: "0039"
title: "Produce the approved Astra static Stories"
type: FEATURE
status: active
related_adr: []
related_tasks: ["0033", "0035"]
tags: ["social", "astra", "png"]
history:
  - date: "2026-09-04"
    status: active
    who: codex
    note: "Owner approved all ten texts and requested beautiful static PNG Stories, explicitly not video."
  - date: "2026-09-04"
    status: active
    who: codex
    note: "Owner added a permanent parent page for every social-media asset pack, grouped by campaign and format."
---

# Astra Static Stories

## Scope

Create ten 1080x1920 PNG Stories with the exact owner-approved Polish copy,
original Romie/Roobert identity, new tactile atmospheric illustrations, and
authentic application screenshots. Preserve previous launch galleries.
The public campaign must not name nonpublic image tools, internal model
aliases, access dates or testing-program details. It must not imply an
OpenAI endorsement or that Astra analyzes users' photographs.

## Acceptance Criteria

- [x] All ten complete approved texts appear in final static PNGs.
- [x] Original fonts, readable contrast and Instagram-safe margins verified.
- [x] App screens are authentic; generated art is not scientific evidence.
- [ ] Ten PNGs, previews, ZIP and mobile download gallery available.
- [ ] Text, dimensions, hashes and download links verified.
- [x] Existing releases, private analytics and Android work remain untouched.
- [ ] Stable `/assetySM/` parent library links every campaign and its formats.

## Design Decisions

### From Plan

1. **Exact copy:** deterministic typography over generated artwork; no
   image-model rewriting or omissions.
2. **Static only:** no MOV, MP4, soundtrack or animation in this pack.
3. **Product evidence:** existing genuine iPad simulator and native Mac
   captures; no invented device UI.

### Emerged

4. **Separate dated gallery:** keep the source and final delivery under
   `social/2026-09-04-astra/`, without replacing the origin-story pack.
5. **Private production metadata:** generator prompts and raw tool receipts
   are not included in public ZIPs or the public gallery.
6. **Isolated publication branch:** branch from current `chmurnik/main`
   instead of publishing the unrelated iPad/Mac commit and dirty release
   files in the working project. Publish only the new campaign and a Pages
   copy step. Never push the unrelated `origin` remote.
7. **Preserved source captures:** copy six original app captures into this
   campaign so later re-renders do not depend on ignored build artifacts.
8. **Permanent catalogue:** `/assetySM/` groups four campaigns and their
   formats, with superseded and pre-launch variants in a clearly marked
   archive. The build rejects unregistered dated galleries or missing assets.
   The new campaign links back to this stable parent page.
9. **Original artwork stays local:** git-ignore source art, including its
   production metadata; publish only final browser-rendered compositions.

## Verification Context

At 2026-09-04T12:31:06Z, a read-only Apple API query confirmed iOS/iPad 1.1
READY_FOR_DISTRIBUTION and macOS 1.1 IN_REVIEW. This supports the approved
copy; it is not a promise of Mac publication.

## Implementation Notes

Built ten PNGs, ten small gallery previews, a 13-entry ZIP, exact copy and
sticker links, provenance/attribution files, and a responsive download gallery.
The typography is deterministic; illustrations are decorative. Native and
simulator UI remains authentic, with no data or photo substitutions.

Local checks passed on 2026-09-04 at 12:49Z: all ten exact DOM texts, fonts,
safe margins, 1080x1920 RGB PNGs, ZIP integrity and image SHA-256. Apple Vision
OCR retained 99.4-100% of normalized characters; differences were recognizable
OCR substitutions, verified visually against the exact source. Gallery passed
390/768/1440 px overflow checks, link copying, PNG and ZIP download hashes.
No existing test or release file has been modified.

## Issues Encountered

- Local loopback binding was blocked by the shell sandbox. The approved
  isolated rendering/test command ran with the required permission; no
  public listener or user's browser profile was used.
- The mounted creative board requires a direct tool surface unavailable in
  this thread. Delivery uses the owner's established download-gallery format.
- Preliminary Mac frame label crossed a rounded crop. Removed the redundant
  label; review status remains in the complete approved paragraph.

## Future Work

None required for this delivery.
