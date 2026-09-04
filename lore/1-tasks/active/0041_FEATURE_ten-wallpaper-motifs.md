---
id: "0041"
title: "Expand the wallpaper bonus to ten distinct motifs"
type: FEATURE
status: active
related_adr: []
related_tasks: ["0040"]
tags: ["social", "wallpapers", "4k"]
history:
  - date: "2026-09-04"
    status: active
    who: codex
    note: "Owner clarified that ten wallpapers means ten distinct motifs, not three motifs exported in two orientations."
---

# Ten Wallpaper Motifs

## Scope

Preserve the three published motifs and add seven distinct designs in the
same tactile pink/olive/lavender identity. Each design has a separately
composed desktop and phone version, for twenty 4K PNG exports in total.
Update the same gallery, permanent library and downloadable ZIPs. Keep all
existing social assets, approved copy and public download URLs intact.

## Acceptance Criteria

- [x] Ten distinct motifs have desktop and phone compositions (twenty PNGs).
- [x] 3840x2160 and 2160x3840 exports are visually verified without text.
- [x] Gallery clearly distinguishes ten motifs from twenty image files.
- [x] Bonus and full packages contain all twenty exports and instructions.
- [ ] Public URLs and downloads are checked after deployment.
- [x] Record the motif-count rule in project instructions.

## Design Decisions

### From Plan

1. Preserve the original three motifs and the existing public addresses.
2. Create seven new motifs, with separate portrait and landscape scenes.
3. Keep generated originals and production metadata local and ignored.

### Emerged

4. Use four bounded image workers for fourteen new compositions while the
   coordinator updates exports, gallery, packaging and verification.
5. Rebuild the two large ZIP downloads deterministically from tracked final
   assets during Pages CI, instead of committing oversized duplicate binaries.
   This preserves existing download URLs and avoids reducing image quality.

## Implementation Notes

Generated fourteen new original compositions with four bounded workers;
every returned file was visually inspected and all workers closed. The
original six wallpaper files remain byte-identical. Exported twenty RGB PNGs,
ten unique motifs with separate desktop/phone framing, plus twenty previews.
Source artwork remains local; public exports contain no raw production metadata.

The wallpaper ZIP has 21 entries (124,092,413 bytes). The full social ZIP has
52 entries (157,180,651 bytes), including all 41 PNGs and the existing PDF,
posts, instructions and attribution. Platform-only ZIPs and approved social
content remain unchanged. The gallery and catalogue label motif/file counts.

Large ZIPs are rebuilt with fixed ZIP headers and stored payloads before Pages
deployment. A fresh-checkout test rebuilds and hash-checks both downloads.
Added two focused tests for cross-host reproducibility, archive integrity,
path safety and duplicate rejection. Existing social tests now require ten
motifs and both orientations, not merely a total image count. All 190 tests,
the nine-module lesson audit and production Pages build pass.

Browser QA at 14:00:42 UTC verified all twenty wallpaper exports, five ZIPs,
unchanged original Stories, complete PDF text/links/renders, responsive
390/768/1440 layouts, the share-link clipboard and twelve browser downloads.
The complete twenty-image grid was loaded for screenshots and reviewed.
Public deployment and live verification remain pending.

No application code or unrelated worktree changes were made.

## Issues Encountered

The previous delivery counted three motifs in six files. That was an
incorrect scope assumption, not ten distinct wallpapers.

Both new ZIPs exceed Git's 100 MiB file limit. They are now generated from
tracked assets instead of committed; the public URLs remain unchanged.

The Lore CLI left a broken symlink to archived task 0040, so `set-task` failed
with EEXIST. Removed only that verified stale symlink and selected task 0041.

## Related User Support

During production the owner's desktop LinkedIn composer did not expose a
document option. The mobile app did; the owner reported successful posting.
Preferred document title: "Przez chmury przebija się Astra."
Provided a short Polish lead about practical meteorology and Astra's role
in building the app, ending with https://chmurnik.cloud. No social posting
was performed by the agent, and the existing approved assets were not edited.

## Future Work

None required.
