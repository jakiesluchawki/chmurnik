# Native Navigation And Daily Answer Hotfix

## Cause And Scope

The owner installed App Store 1.2 and supplied screenshots of three compact
tabs and the visible daily genus. The September 6 web patch did not repair
the separate native `FieldHome` component or `nativeNavigation`. Passing the
public WWW harness was not evidence of native parity. Both Apple 1.2 releases
were confirmed READY_FOR_SALE by fresh GET receipts on September 8.

This patch follows the owner's resumed instruction after the application
restart. It does not resume classifier research or alter model weights,
stored-photo schemas, permissions, prices, privacy declarations or DSA status.

## Repair

- Add Warstwy to compact native navigation. On phones it is the fourth bottom
  tab; tablet header navigation also exposes it. Preserve seven wide-workspace
  sidebar items and their established keyboard-shortcut order.
- Keep the complete six-tab atmosphere workshop first, then provide direct
  METAR/TAF, wind, map-practice and full-lesson entry points. Remove the old
  native Atlas-only shortcuts. Nested lessons/practice select Warstwy.
- Conceal the daily genus, diagnostic, source URL, accessible answer text and
  answer-specific follow-up until explicit reveal. Hide again on request and
  on a new local day. Keep author/license attribution present.
- Native route transitions reset scroll immediately. Smooth scrolling while
  switching sections caused unstable native tap targets in the device test.
- Adapt the Windy workspace to its actual container width, remove native
  segmented-control overflow and keep the Sources button in normal flow,
  avoiding overlap with the heading at tablet widths.
- Fail package verification if any of the 82 production files differ or if
  obsolete hashed assets survive staging. Mac QA now cleans its generated
  public directory and build products. Keep dependency resolution locked;
  Capacitor 8.4.1 and camera library 1.0.4 remain unchanged.

## Evidence And Release Gates

- All 290 application tests and all nine lesson audits pass. The dedicated
  native-home test covers every daily photograph, not just today's example.
- Chromium/WebKit native harnesses cover eight widths and eight routes each,
  daily reveal/hide/date change, tools, sidebar shortcuts and clipped controls.
  A new text-rectangle assertion reproduces the Sources overlap before its
  fix and passes afterward in both WebKit and Chromium (64 combinations each).
- The production WWW harness passes its complete route, journal/backup,
  forecast, wind and map checks. No public website upload is part of this fix.
- Native simulator tests passed on iPhone 17 Pro Max and iPad Pro 13-inch M5,
  including tablet rotation and route continuity. Visual inspection exposed
  the additional Sources overlap after those passes. Final package runs after
  that CSS correction use `iphone-distribution.xcresult` and
  `ipad-distribution-isolated.xcresult`: respectively 1 and 2 passed, zero
  failures or skips. Final screenshots confirm concealed/revealed answers,
  the separate workshop entry, non-overlapping Sources, and landscape TAF.
- The first final iPad run failed after an Atlas tap immediately following
  rotation, then left the next test in landscape. Reset orientation per test
  and wait for stable window/WebKit bounds before proceeding. No product
  assertion was removed; the successful rerun exercises real taps and rotation.
- Expected final web entry assets: `index-B1dYcROs.js`, `index-DgmmlosU.css`.
  `check-native-bundle.mjs` binds all 82 files, not just those two names.
- Mac development and isolated QA builds compile and match production web
  files. Actual Mac UI testing has NOT passed: the runner failed to initialize
  with `Timed out while enabling automation mode`. No system permission was
  bypassed, host restarted, other task stopped or production Mac data changed.
  The Mac distribution gate remains closed pending a successful native run.

Private test evidence is in `build/native-hotfix-20260908/`; signed-release
scripts, account metadata, receipts and logs stay in
`.local/releases/apple-0042-hotfix-20260908/`. Those helpers target 1.2.1,
preserve existing store metadata and contacts, require passing native tests,
compare the actual archive's entire public bundle, verify distribution signing
and avoid duplicate uploads or interference with unrelated review submissions.
The iOS/iPadOS 1.2.1 store draft has been created with existing metadata and
screenshots preserved. At this writing no 1.2.1 archive has been uploaded or
submitted to Apple. No Mac draft has been created.

This finite hotfix does not complete task 0042's historical ML objectives.
