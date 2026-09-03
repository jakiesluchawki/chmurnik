# CHMURNIK Field Companion QA

## 2026-09-03: iPad And Mac Implementation

- Universal iPhone/iPad target, scene lifecycle, iPad orientations and indirect
  input. Catalyst uses a 760 x 600 minimum window. Native views gain a two-column
  home and a sidebar from 1100 CSS pixels. Command-1 through Command-7 preserve
  text editing and modal focus. The approved identity and lessons remain.
- Official Capacitor 8.4.1 binary frameworks lack Catalyst. Its pinned official
  source builds arm64/x86_64 frameworks in an isolated generated Mac project,
  leaving the iPhone dependency graph and installed npm packages untouched.
- Five iPad simulator tests pass: report distinction, tools, privacy, real photo
  picker/local model/persistent observations, and orientation/route continuity.
  Two iPhone simulator regression tests pass. Physical iPad camera acceptance
  and hardware-specific release checks remain in task 0035.
- 184 Node tests and nine lesson audits pass. Browser checks pass 42 viewport/
  route combinations and keyboard behavior. The full native-layout browser
  flow passes against an isolated production build: backup round trip, report
  timelines, wind vectors, map controls and all lessons.
- Two development-server runs timed out at different routes with no JS errors;
  failures remain recorded. The successful production run avoids development
  transforms. Later the exec/apply_patch service hit EMFILE; an independent
  Node runtime completed work without changing SSH or Remote. This does not
  prove the earlier timeout cause.
- Initial iPad tests exposed translated/overlapping header hit targets and a
  tablet mastery-grid overflow; fixed. The rotation test also needed to close
  the atlas dialog before navigating. Assertions were not weakened.
- Real arm64 Mac testing verifies launch, image import, Core ML, observation
  save/edit/relaunch, lesson answers, keyboard navigation, TAF classification
  and the postcard sharing panel. No photo or message was sent externally.
  One clearly labeled atlas-fixture observation remains in the local test app.
- Mac backup export uses a Save panel. The resulting 233955-byte JSON passes
  the normal parser; native import displays successful restoration and keeps
  exactly one entry, without overwriting it. The selected original still exists.
  Native JSON import follows the image-picker pattern; it replaced a stalled
  WebKit input during QA, not a proven WebKit-wide defect.
- Evidence: ignored `build/apple-workspace-qa/`,
  `build/apple-field-production-qa/`, `build/ipad-final-tests.xcresult`,
  `build/ipad-final-attachments/`, `build/iphone-regression-tests.xcresult`
  and `build/chmurnik-macos-qa-backup.json`.
- Ad-hoc Mac builds and unsigned iOS archives are not App Store releases.
  No Apple account, DNS, hosting or social account changed in this task.
- Final Release device archive rebuilt successfully after the last native
  import changes. UIDeviceFamily is 1,2; iPad icons/orientations and final
  index-Bl612cgV.js are present. All three handoff ZIPs pass CRC; paths and
  SHA-256 values are recorded in completed task 0034. A fresh 184-test run
  and nine-module lesson audit pass. A redundant Node-REPL test run timed
  out and is not counted as successful. Mac runtime tested the final import
  handler; the broad browser/simulator suites precede that narrow change.

## 2026-09-03: Browser Launch And Social V3

- Owner requested complete LinkedIn and Facebook posts centered on
  `https://chmurnik.cloud/`, while keeping the accepted fast iPhone Stories.
  Both posts retain the family origin, exact METAR/TAF explanation, atlas,
  lessons, independent Windy workshop and apparent-wind simulation. Browser
  access is primary; App Store remains an additional option. No live Windy
  integration, measured wind or native photo recognition on WWW is claimed.
- All ten MP4s, twenty Story/carousel JPGs, approved Story copy, Instagram
  caption and ten-page LinkedIn PDF are byte-for-byte unchanged. Only the
  Facebook artwork was rerendered, with the domain and browser/iPhone footer.
  Exact-copy OCR passes for all 49 decoded film shots and 21 final JPGs.
- The web learning home keeps its shortcuts and receives a compact App Store
  note below them, not a new blog or a replacement landing page. The note is
  excluded from the native layout. Static canonical/Open Graph metadata and
  a 1200 x 630 JPEG use the existing fonts, palette and felt artwork. Both new
  images and desktop/mobile home captures were inspected.
- All 182 Node tests, nine lesson audits, 58 provenance links, root and Pages
  builds and the complete root-production browser flow pass. The V3 gallery
  passes 320/390/1440 layouts, 38 media/archive hashes, ten video decoding,
  seeking and playback checks, complete text, ZIP/PDF downloads and simulated
  file sharing. The original launch gallery also passes regression checks.
- Caption TXT downloads now use the same revision as the manifest and media.
  Six ZIPs are rebuilt from canonical full captions; archive contents and
  hashes are tested. Gallery revision is `20260903-web-v3`; film edit stays V2.
- The initial live domain inspection found an older August 23 build. A
  separate root-hosting release is prepared under ignored
  `build/domain-20260903/site/` and
  `release/chmurnik-cyberfolks-20260903-web-v3.zip`. It must not be confused
  with the `/chmurnik/` Pages build. Hosting authentication and actual public
  deployment are verified separately; local build success is not publication.
- Evidence: ignored `build/domain-20260903/qa/`,
  `build/social-full/qa/` and `build/social-full/promo/copy-audit.json`.
  No social account posting, physical-device acceptance or DSA change made.

### Publication Verification

- Commit `a1f824e` is live on Pages; workflow `33692193674` completed
  successfully. The public V3 gallery passes the entire media, archive,
  complete-copy and browser-interaction suite. The full public application
  flow also passes, including the pasted METAR/TAF reader and new launch note.
- Both older galleries pass regression checks. The separate native-layout
  browser run passes all application flows and verifies the launch note is
  absent there; this is not a new iOS binary or physical-device acceptance.
- The live apex domain still returns `index-DeD26LFn.js`, Last-Modified
  August 23, with no Open Graph image. Opening `/#/practice/metar` returns
  the old home rather than the new report reader. Publication of the WWW-first
  feed posts should wait for the actual root-hosting upload, not just Pages.
- The root ZIP passed every CRC test. Its SHA-256 is
  `cd3858fd4922eb48d72d43f4d9ed1473f4d1f87cc03940826a982214419ee375`.
  Hosting SSH responds but rejects the existing key. The legitimate panel
  login remains behind the owner's iCloud verification. No password reset,
  access-key creation, DNS change or hosting-file modification was performed.
- Public evidence is in ignored `build/social-full/qa-live/` and
  `build/domain-20260903/pages-live-qa/`; native-layout evidence is in
  `build/domain-20260903/native-layout-qa/`.

## 2026-09-02: Fast Social Edit V2

- The owner rejected the first ten-film edit as too slow and found approved
  text missing from visible frames. Earlier checks of caption events were
  insufficient to establish the final viewing experience. The reading-time
  pacing below is superseded by this correction, not treated as accepted.
- All ten films are now 6-8 seconds, with 49 shots overall and 4-6 shots per
  film. Genuine captured app pixels are edited into action-led cuts and
  close-ups. Four reading cards become product montages; no soundtrack is
  added. Original typography, colors, licensed photos and training limits stay.
- Every approved lead, body sentence and final CTA is composited on every
  frame. Changing underlines emphasize words without replacing them. Exact
  DOM-copy and line-bound checks pass; all body copy fits at 38 px. The full
  METAR-observation / TAF-forecast paragraph is present throughout Story 05.
- Every shot midpoint was decoded from the final H.264 and visually reviewed.
  Vision OCR checks 49 decoded shots plus all 21 JPGs against canonical copy.
  Joined words and Cyrillic look-alike OCR output were inspected and handled
  without relaxing missing-word thresholds or changing approved text.
- Explicit sRGB input and Rec.709 video metadata correct a gamma shift found
  during QA. Decoded background samples are within five RGB levels of the
  source palette. Video dimensions, 30 fps, duration and absent audio pass.
- All 179 Node tests, nine lesson audits, Pages production build, full app
  flow and both older galleries pass. The corrected gallery passes at
  320/390/1440 px, including 38 media/archive hashes, ten decode/seek/end
  checks, seven ZIP/PDF downloads, complete captions and ten sticker links.
- The unchanged ten-page LinkedIn PDF was rechecked for every approved
  visible character, embedded fonts, source and App Store links and rendered
  again. Existing carousel and Facebook exports retain their full copy.
- Six archives were rebuilt. The full pack is about 51 MB. Gallery, manifest,
  MP4, share and archive URLs use revision `20260903-fast-v2` to avoid cached
  slow media. Physical iPhone sharing and Instagram uploads remain untested.
- Evidence: `social/2026-09-03-full/captures/promo-edit.json`, its manifest,
  and ignored `build/social-full/promo/copy-audit.json`, `sheets/`, `qa/`.

Result: V2 technical and content checks pass; creative acceptance stays with
the owner. No app behavior or social account was changed.

## 2026-09-02: Complete Ten-Part Social Package

- The owner approved the entire ten-part copy before production and requested
  an Instagram carousel, LinkedIn and Facebook package from that narrative.
  The latest pilot wording, all approved sentences and practical romantic
  tone are preserved. Canonical copy: `social/2026-09-03-full/copy.mjs`.
- Original Romie/Roobert, wordmark, pink/olive/violet/cream and felt identity
  remain intact. Atlas photographs are genuine and retain visible credit,
  license/source links and a complete downloadable attribution inventory.
- Twenty-one JPGs were inspected at 1080 x 1920 or 1080 x 1350. Font,
  geometry and safe-area assertions pass. The ten Story sticker rectangles
  remain blank at x=240, y=1510, w=600, h=120.
- Ten silent H.264 Stories run at 30 fps: six real interactive walkthroughs
  and four reading-time cards. Genuine taps, swipes, form input, feedback
  and slider changes are recorded continuously; narrative is outside the app.
  Atlas, a lesson excerpt, METAR parsing, cloud-base interpretation, terrain
  height and apparent wind are demonstrated. No course completion is claimed.
- Visual QA found and corrected two framing issues and a recording gesture:
  lesson feedback and both pressure/ground lines now remain visible; vertical
  wind-demo swipes use the gutter instead of changing a range control. Final
  sailing values are verified after the return swipe, with true wind unchanged.
- All ten PDF pages were structurally checked, rendered by Poppler and
  inspected. Full approved text, self-contained font glyphs, clickable photo
  source and final App Store link are present. PDF is static, not a video.
- The new gallery passes 320/390/1440 px checks. All 38 media/archive hashes,
  ten video decode/seek/end-playback checks, complete copy, ten sticker links,
  clipboard fallback and seven ZIP/PDF downloads pass. Browser File Sharing
  is simulated; physical iPhone sharing and platform uploads are not claimed.
- All 178 Node tests, nine lesson audits, Pages build, both older galleries
  and the complete production app flow pass. Only a QA onboarding timing
  race was adjusted; no app behavior, lesson or embedded iOS asset changed.
- The complete gallery lives at `/premiera/historia/`. Older pack links remain
  available. Captures/provenance and the hashed manifest are committed;
  private analytics and working frames remain excluded from publication.
- Local evidence: `build/social-full/qa/`, `build/social-full/pdf/`,
  `build/social-full/sheets/`, `build/social-full/app-qa/`.

Historical result: initial technical checks passed, but owner review rejected
the video pacing and text presentation. The V2 correction above supersedes it.

## 2026-09-02: Origin-Story Social Pack

- Owner requested five Stories for September 3 and explicitly approved the
  existing `/premiera/` download-gallery format. The dated addition preserves
  the original pack, app UI, selected mobile design and embedded iOS assets.
- Source of truth: the approved Romie/Roobert, pink/olive/violet/cream and felt
  identity, authentic store screenshots, and the owner's first-person origin.
  No relative's name, exact relationship, trip location or PPL completion added.
- All five 1080 x 1920 JPGs inspected; deterministic font/bounds checks pass.
  Each reserves x=240, y=1510, w=600, h=120 for an actual Instagram Link sticker.
  All headlines, credits and training caveats remain outside that area.
- The TAF screenshot is explicitly labeled as TAF alongside METAR training.
  Windy remains an independent educational exercise; no live data or physical
  wind measurement is claimed. The Cirrus photo retains its visible license.
- Both H.264 MP4s use genuine workshop controls, 30 fps, no audio, 12/10.6 s.
  AVFoundation decodes the final frames; Chromium plays, seeks and verifies
  distinct start/middle/end states. These are not physical iPhone recordings.
- Gallery QA at 320/390/1440 px passes with no overflow/page errors. All JPG,
  MP4 and ZIP hashes match. Caption/clipboard fallback and all sticker links
  pass; JPEG/MP4 File Sharing is simulated, not native-device certification.
- Existing launch-gallery regression passes. Complete production app routes,
  collection, backup, METAR/TAF, training, wind and maps still pass. All 169 Node
  tests and nine lesson audits pass. No app feature or lesson was changed.
- Local evidence: `build/social-2026-09-03/qa/`, `build/field-ui-qa/`.
  Export sources/hashes: `social/2026-09-03/`. No private analytics published.

Result: media/gallery checks passed; Instagram posting stays with the owner.

## 2026-08-26: App Store Release Candidate

- Candidate: `1.0 (20260826214336)`, task 0033. Approved felt artwork,
  authentic cloud photography, Romie/Roobert and pink/olive/violet identity
  are preserved; this is release hardening, not a visual redesign.
- Added readable in-app and standalone help/privacy information. Public
  routes passed at 320, 390 and 1440 px, including production CSP.
- Fixed native date-filter overflow, scrolled content beneath the clock and
  a legacy `field-method` class collision. New workshop disclosures use
  `field-disclosure`; the existing observer panel is unchanged.
- Reviewed five actual Release screenshots at 1320 x 2868 from an isolated
  iPhone 17 Pro Max / iOS 26.5 simulator. Evidence and SHA-256 hashes:
  `design/app-store/screenshots/`. Screens are unretouched, opaque sRGB PNGs.
- The screenshots show Today, a real saved photo/hypothesis, the Cirrus
  monograph, apparent-wind controls and the KLVM TAF timeline. Model results
  are genuine and uncertain; no fictitious weather or marketing UI is added.
- Full XCTest run `build/app-store-ui-13.xcresult` passed all four cases.
  Native library selection, the real model, two saves and relaunch persistence
  passed. A real library-to-vault file-boundary bug was fixed without loosening
  the native path guard. Nine stored test JPEGs have no source GPS/capture EXIF.
- 162 Node tests, nine lesson audits and 58 source links passed. The complete
  root-production browser flow has no page errors or CSP violations; this
  includes collection backup/edit/share/delete, reader and training flows.
- Archive signature and all 80 embedded web files were verified. Upload to
  Apple succeeded. No physical-camera, low-storage or VoiceOver pass is
  inferred from the simulator. Device acceptance remains open in 0032/0033.
- Live GitHub Pages passed the complete public-browser flow after deployment
  of 6497e51. Apple subsequently reports all five screenshots COMPLETE with
  matching source checksums, dimensions and order. No public App Store release
  or external TestFlight promotion was performed.

## 2026-08-26: METAR / TAF Reader

- User-approved extension: recognize copied TAF without a heading, explain
  observation versus forecast, and make forecast periods interactive.
- Visual identity remains the approved pink/olive/violet, Romie/Roobert and
  restrained outlined controls. No cloud photographs or artwork changed.
- Inspected production captures in `design/qa/2026-08-26-taf/`: mobile
  probability detail and desktop timeline. Selected periods use both a visible
  outline and `aria-pressed`; temporary/probability periods have dashed markers.
- The user's exact KLVM input selects TAF, preserves four separate groups,
  shows 25 kt / gusts 40 kt only within PROB30, and has no fake observed
  temperature, pressure, or current crosswind. FM and PROB groups can be selected.
- Eight METAR/TAF scenarios now teach type, probability, FM and BECMG alongside
  the existing four cases. Incorrect answers can be replayed independently.
- Full browser flow passed in development, native-layout mode, and production
  at `/` and `/chmurnik/`, with production CSP and no page errors. Existing
  collection, backup, map, wind, atlas, all nine lessons and source routes pass.
- 320, 390 and 1440 px layouts passed overflow/control checks. Native-layout
  QA is a browser rendering, not a physical-device or new TestFlight test.
- 154 unit tests, nine lesson checks and 58 primary/provenance link checks pass.
- Scope: common TAF groups up to 30 hours; no live retrieval or operational
  clearance. Unsupported groups remain visible or stop an ambiguous timeline.
- iOS follow-up: signed archive `1.0 (20260826193304)`, SDK iOS 26.5,
  passed system signature validation and all 78 embedded web files matched
  the tested root build. Apple reports `VALID` and internal `IN_BETA_TESTING`;
  owner access verified. This does not close physical-device acceptance.
- Public App Store readiness was assessed read-only; missing metadata and
  owner/device checks are recorded in `design/app-store-readiness-2026-08-26.md`.

## 2026-08-26: iOS-First Field Companion

- Selected identity: `design/approved/chmurnik-mobile-density-v1.png`.
- Approved interaction direction: `design/ios-next-2026-08-26.md`, task 0032.
- Current captures: `design/qa/2026-08-26-field-companion/`.
- Evidence: isolated headless Brave, iOS-layout mode at 390 x 844 and
  320 x 740; web desktop at 1440 x 1000. These are not hardware-camera tests.
- Production web checks used both `/` and `/chmurnik/` with the actual
  `public/.htaccess` response headers. No page errors or CSP violations.

### Visual Findings

- The three-destination native navigation is an approved departure from
  the original five-destination concept, not a fidelity defect. The website
  keeps all five destinations and all existing lessons.
- The original Romie/Roobert, pink/olive/violet palette, outlined controls,
  licensed cloud photographs, and felt observer object remain in use.
- Home now privileges capture and a private collection. Tool/training tabs
  put controls ahead of lengthy explanation. Sources remain one tap away.
- Fixed default browser button borders in the photo grid, oversized native
  workshop headings, overly small compass labels, and wrapping source actions.
- Interactive controls remain within the viewport at 320 px. Disclosure
  sections preserve detailed scientific explanations without flattening lessons.
- Reference and current viewport images were inspected directly. A combined
  pixel-match board is not applicable to the explicitly approved navigation change.

### Functional Evidence

- Persistent photo, edit, favorite, postcard preview, export, delete and
  backup restoration passed through visible controls.
- METAR variable wind never creates a precise crosswind; missing sky data
  never becomes an absent ceiling. Wind from-direction and north references
  stay explicit. Calm air has no fabricated wind arrow.
- Twelve synthetic cases have unique answers, feedback, and retry paths.
  A wrong-answer round followed by retrying only the missed case passed.
- Two repeated photo-fixture cycles preserve the whole frame and model
  hypothesis while leaving user confirmation empty after reload.

### Remaining Acceptance

Physical iPhone camera, permission changes, backgrounding, real low storage,
VoiceOver, large text, and sunlight checks remain unverified. Internal beta
preparation is allowed; external promotion awaits that acceptance.

Current result: automated layout/function gates passed; physical acceptance open.

## Historical QA: Compact Guided Experience (2026-06-21)

- Source visual truth path: `design/approved/chmurnik-mobile-density-v1.png`
- Implementation screenshot path: `design/qa/2026-06-21-compact-guided/08-home-ios.png`
- Viewport: iPhone 17 simulator, 402 x 874 CSS px at 3x density
- State: native iOS home, first-run onboarding completed
- Full-view comparison evidence: `design/qa/2026-06-21-compact-guided/14-home-comparison.png`
- Focused region comparison evidence: not needed; the 2420 x 2622 combined comparison keeps the wordmark, typography, hero crop, action grid, guide object, and bottom navigation legible at inspection scale.

**Findings**
- No actionable P0, P1, or P2 mismatches remain.
- [P3] The production CTA is intentionally narrower than the concept CTA.
  Location: Home / `.hero-actions`.
  Evidence: the source uses a nearly full-width button; the implementation uses a compact intrinsic-width button.
  Impact: none to task completion; it gives the still life and title more air and matches the user's request for less oversized UI.
  Fix: none planned; classified as an intentional density improvement.
- [P3] The production guide area includes a second contextual recognition card.
  Location: Home / `.home-guidance-row`.
  Evidence: the source shows only the onboarding guide; the implementation adds “Sprawdź się” beside it.
  Impact: preserves access to recognition after removing Test from the primary five-item navigation.
  Fix: none planned; required by the navigation decision.

**Required Fidelity Surfaces**
- Fonts and typography: Romie is used for display text and Roobert for UI/body text. Weight, line height, wrapping, and scientific-name no-break behavior remain intact. The rendered title is slightly smaller than the concept by design and fits without collision.
- Spacing and layout rhythm: the home hierarchy, still-life crop, three-column action grid, guidance row, and five-item navigation fit inside the first iPhone viewport. Subpage headers are shorter; Layers and lessons expose their first action without ceremonial scrolling.
- Colors and visual tokens: production uses the approved pink `#ffe1eb`, olive `#6d6435`, violet action color, ivory surfaces, and restrained blue only for functional educational panels.
- Image quality and asset fidelity: the existing felt atmosphere still life remains sharp and correctly cropped. The new observer guide is a project-bound generated raster asset with AVIF/WebP delivery. Real cloud photography remains exclusive to atlas, comparison, recognition, and evidence contexts.
- Copy and content: home promise and labels match the approved direction. Onboarding copy explicitly distinguishes explanatory felt models from photographic cloud evidence.

**Patches Made Since Previous QA Pass**
- Replaced the six-item mobile navigation with five primary destinations and contextual recognition access.
- Rebuilt Home around one CTA, a compact felt still life, three destinations, and the observer guide object.
- Added optional, skippable, replayable four-step onboarding with local persistence.
- Fixed a native-only `onSources` render error found during simulator QA.
- Deferred first-run onboarding until after the first application paint.
- Moved the Windy workbench ahead of its reading protocol on mobile.
- Collapsed lesson timing and objectives behind a compact disclosure on mobile.
- Shortened native subpage headers while preserving the CHMURNIK wordmark.
- Updated PWA colors, offline cache contents, and cache version.

**Implementation Checklist**
- [x] Source and implementation compared in one combined image.
- [x] Home, onboarding, Layers, Observer, and lesson entry checked on iOS.
- [x] Fonts, spacing, colors, image quality, copy, navigation, and responsive hierarchy checked.
- [x] P0/P1/P2 findings fixed and recaptured.

**Follow-up Polish**
- Consider code splitting the largest educational workshops in a later performance-only task; it is not a visual or functional release blocker.

final result: passed
