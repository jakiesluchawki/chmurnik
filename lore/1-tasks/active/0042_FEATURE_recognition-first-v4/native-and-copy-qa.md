# Native And Copy QA: September 5, 2026

Status: local development verification, not a release approval. Recognition
accuracy and calibrated precision remain separate, unmet requirements.

## Native Evidence

| Result bundle under `build/` | Build | Outcome |
| --- | --- | --- |
| `v4-native-phone-regression.xcresult` | `index-G_NsviLf.js` | Five passed, zero failed/skipped |
| `v4-native-ipad-rotation-fullscreen.xcresult` | `index-Da02l6Kr.js` | One passed, zero failed/skipped |

Phone: iPhone 17 Pro Max, iOS 26.5 (23F77), isolated simulator. Tests 01, 02,
03, 04 and 06 exercise report distinction, tools, privacy, photo processing,
persistence and lesson navigation. The photo test imports the existing licensed
Cumulus/Cirrus atlas examples through the real picker. Both local mask models
generate proposals; selection precedes the actual native genus inference.
The second case exercises manual pointing and a larger context frame. Saves
retain the full photo, reopen after process termination, and do not turn an
uncertain machine result into a user-confirmed name. These photos are already
known development fixtures, not field accuracy evidence.

The lesson test advances to chapter seven of METAR/TAF, opens the six-chapter
layers lesson, and verifies chapter two survives process relaunch. The earlier
long-to-short route failure is covered in both native and browser tests.

iPad: A16, same OS/runtime, isolated simulator. Test 05 checks portrait home,
landscape atlas, portrait on the same cloud card, and landscape TAF. Rotation
waits for the WebView geometry. `app.screenshot()` produced a shifted/cropped
landscape attachment even though interaction passed. Full-screen capture and
a rerun produced inspectable, complete portrait/landscape evidence; no app
layout change was made in response to that capture artifact.

Screenshots and manifests:

- `build/v4-native-phone-regression-screens/`
- `build/v4-native-ipad-fullscreen-screens/`
- Earlier `v4-native-ipad-rotation.xcresult` is superseded for visual evidence.
- The disk-exhausted `v4-native-photo-lessons-qa.xcresult` is not a passing run.

The phone suite predates only the subsequent atlas/nomenclature copy changes.
The final iPad test uses the final copy bundle. Mac Catalyst development and
build-for-testing succeed with that same bundle. Later isolated Mac runs are
recorded below; none use the production application or photo collection. The
early Mac test-target deployment warning (framework requires 17.0 while the
target declared 15.0) was addressed for QA only, not by changing application
deployment compatibility.

## Browser And Content Evidence

- 270 JavaScript tests pass after updating the gallery copy assertions.
- All nine lesson quality contracts pass; 52 chapters are retained.
- `check-lessons-ui.mjs`: 156 native-layout checks and 156 WWW checks,
  including complete text, concealed recall, feedback, sources and resume.
- `check-atlas-ui.mjs`: 177 native-layout and 177 WWW checks at 320, 390 and
  1100 CSS pixels. Opens every monograph and all 49 terms, cycles/reveals all
  30 photo comments, checks image decoding, overflow, source drawers, canonical
  origin options, evidence confirmation and an incompatible-name example.
- `check-field-ui.mjs --preview`: final production web flows pass with actual
  deployment headers, including storage/backup round trip, METAR/TAF, wind,
  maps and 42 route/viewport combinations. No page errors or CSP violations.
- Screenshots: `build/v4-atlas-native-layout-qa/`, `build/v4-atlas-web-qa/`,
  `build/v4-final-web-field-qa/`; selected small/wide views inspected directly.

`design/copy-v4-review.md` contains the complete revised journeys and unchanged
answer alternatives, including all monographs, photos and terms. New terminology
corrections use WMO's common-origin table, not invented suffix concatenation;
the UI labels the list as common examples, not an exhaustive classification of
all transformations. Existing photo files, attribution and term IDs remain.
The gallery retains active recall but replaces abstract proof/analysis wording
with concrete photo-observation instructions. See the review document for
source links and the exact full text. Editorial review does not establish an
independent expert review of the entire atlas.

## Current Artifacts And Limits

`dist/`, native `public/`, the simulator app, and
`build/macos/Build/Products/Debug-maccatalyst/App.app` contain
`index-Da02l6Kr.js` and `cloud-knowledge-D6Z4Kt1b.js`.
`cap copy ios` was used, not dependency-changing sync. The Mac build is ad-hoc,
with unsigned local SDK bundles; distribution signing must use the existing
`--store-sdk` workflow. Nothing was archived for distribution, uploaded, or
published in this continuation.

Reverified the stored reliability candidate's calibrated checkpoint SHA-256:
`1b8c30b1c319abf259e99ed1a27387c451863a6cd158533ea5431bdbaf2c2195`.
Its old test is still 77/123 versus 68/123 shipped; its calibration precision
target is not met. The saved policy rejects all predictions and the evaluation
explicitly labels confirmation as previously exposed regression. No new model
trial, weights or threshold change occurred during UI/copy verification.

Remaining: independent labeled evidence, classifier release gates, a complete
automated Mac persistence run, physical camera
and device/background/large-text/VoiceOver acceptance, plus distribution signing
and submission. Earlier native logs include a startup JavaScript-evaluation
warning before the WebView loads; successful interaction does not prove its
root cause or justify claiming zero native JavaScript warnings.

## Isolated Mac Runtime Attempt

Added `scripts/prepare-macos-qa.mjs` and native test 07. The preparation script
uses generated Mac sources, changes both app/test bundle IDs to
`cloud.chmurnik.qa.v4`/`.uitests`, preserves App Sandbox without app groups,
checks the built bundle ID, and injects only the public atlas Cumulus fixture
into an isolated test plan. Original app/build data is not replaced. The
runner's test deployment minimum is 17.0 without changing the application's
deployment target. Build-for-testing passes; signed entitlements confirm
App Sandbox and no shared app group. Test 07 explicitly selects the QA bundle,
then is intended to import, propose, classify, save and reopen the fixture.

The bounded execution attempt in `build/v4-isolated-mac-photo.xcresult` failed
before test execution. Xcode could not look up `com.apple.testmanagerd.control`
(connection error 3, no such process). Read-only `launchctl print` for the GUI
service returned domain error 125. The system LaunchAgent is limited to
LoginWindow/Aqua sessions. No existing application was launched, no QA process
remained, and no daemon, privacy setting or user session was modified. CUA also
failed at service startup. This is unavailable runtime-test infrastructure,
not proof that the app's Mac file picker works or fails. Do not count test 07
as passed. Retry the prepared plan only from a working graphical test session.

## Resource Cleanup

Own iPhone simulator `D0FB0555-660E-46E9-A33F-CC07B4E1D068` and own iPad
`2B68D7C2-64CD-4536-8436-602CAD4FCE7D` were shut down and deleted after exporting
results. The earlier own iPad and generated Mac module cache were removed after
disk exhaustion. No user simulator, research model, source photo, release file,
other task or host/Remote process was deleted or restarted. The failed/incomplete
test evidence remains distinguishable from successful runs.

## Separate Web Handoff, September 5

Prepared immutable local web candidates from commit `face674`, outside `dist`
and the native app bundles. Root build contains `index-Da02l6Kr.js`; Pages
under `/chmurnik/` contains `index-CP55UqG5.js`. Both use
`cloud-knowledge-D6Z4Kt1b.js`. No new recognition model is included.

Both exact candidates pass the existing production browser harness with
deployment CSP headers: 42 route/viewport combinations each, storage/backup,
METAR/TAF, wind, maps and public information. Compared 13 static responses to
their local bytes. Inspected the desktop home and mobile learning screenshots;
evidence is in `build/v4-www-{root,pages}-candidate-qa`. The temporary servers
and browsers exited normally. All 270 JS tests, nine lesson audits and 61
external source/attribution links pass.

The Pages candidate includes all five existing social galleries/library,
255 files verified byte-for-byte. No published assets were regenerated. The
root-hosting archive is an application update, not a replacement for an entire
document root; preserve any existing media galleries and unrelated host files.

Both ZIPs pass CRC and relative-path/privacy-boundary checks (88 root entries,
366 Pages entries). Artifacts:

- `build/CHMURNIK-WWW-V4-CYBERFOLKS-face674.zip`: 22,777,757 bytes,
  SHA256 `17ddcea2267e98f41f5d716ed502e1d08f8a29709a84b3d98e8550ba15bd6baf`.
- `build/CHMURNIK-WWW-V4-GITHUB-PAGES-face674.zip`: 678,135,934 bytes,
  SHA256 `a4334a11c94fe689847d60fe4da76688ef578b43950c54888763566e0bf8aece`.

See `design/web-v4-handoff.md` for the complete Polish handoff. At preparation,
neither package was uploaded/deployed; subsequent delivery is recorded below.
This web deliverable does not close classifier, native runtime, Apple submission
or wallpaper requirements. Do not rebuild unchanged candidates on each
continuation; preserve the verified artifacts.

## Verified Web Publication And Private Delivery

On September 5 pushed `40c2e7165701d37b3b4996afed5f00ba2b474f5a` as an ordinary
fast-forward to `chmurnik/main`, after confirming the remote still matched
`57bda4c2c930769015d8c5cba538bd061be395ed`. No unrelated remote was used.
Existing Pages workflow [33944547635](https://github.com/jakiesluchawki/chmurnik/actions/runs/33944547635)
completed successfully (build 1m7s, deploy 25s), including 270 JS tests and
nine lesson audits. No Apple workflow runs from this push.

- Public main bundle remains `index-CP55UqG5.js`, service-worker cache
  `chmurnik-68d49a8d27f4`. Seventeen response bodies match the tested candidate,
  including five gallery/library entry points, all three Astra manifests and
  the LinkedIn PDF. Five existing social ZIPs return HTTP 200 and the exact
  manifest content length; this HEAD check is not an independent ZIP rehash.
  Receipt: `build/v4-pages-live-files.json`.
- All 42 public route/viewport checks pass with journal CRUD/backup, METAR/TAF,
  wind/maps and information pages. Initial screenshots could precede visible
  image loading, so the harness now explicitly waits for loaded in-viewport
  images. The complete repeated run also passes. Evidence:
  `build/v4-pages-live-images-qa/`; inspected mobile learning and desktop home.
- Before deployment, a new isolated persistent browser profile stored a
  synthetic observation, public atlas photo, favorite, note, completed lesson
  and reading position under the old `chmurnik-8edd806ab016` worker. After the
  live update, records/progress and photo SHA256 match exactly; the photo and
  note reopen offline and the old cache is gone. Evidence:
  `build/v4-pages-live-upgrade/{before,after}.json` and screenshots.
  Two initial probe assertions ran too early: the cache is created during
  install, and this installed Playwright implementation does not poll async
  predicate results as intended. Fixed the local harness with awaited Node
  polling, not application/cache manipulation. The final transition was
  persistent-profile reopen (`updateButtonClicked: false`); do not report the
  in-page refresh button as tested. No user browser profile or data was used.
- Root ZIP delivered through the existing owner-authorized Google Drive
  route. Read-back metadata confirms its exact 22,777,757-byte size and only
  the owner's user permission (`shared: false`). The connector does not expose
  a remote checksum; the local SHA256 remains the one above. Private receipt
  and download URL: `.local/v4/web-delivery-20260905.json`. No expert-review ZIP,
  private feedback, photos or credentials were uploaded.
- `https://chmurnik.cloud/` responds HTTP 200 but still references
  `index-BpdEVwM6.js`, not the new root candidate. Do not claim Cyber_Folks
  deployment from Drive delivery. The owner retains hosting installation.

The workflow emitted deprecation notices for Node-20-targeting actions forced
to Node 24 by the existing configuration; both jobs succeeded. No workflow or
application change was needed for publication.

## Fresh Apple Status, September 5

Read-only App Store Connect requests confirm the earlier releases, not V4:

| Platform/version | State | Attached build | Processing |
| --- | --- | --- | --- |
| iOS/iPadOS 1.1 | READY_FOR_SALE | 20260903104330 | VALID, not expired |
| macOS 1.1 | READY_FOR_SALE | 20260903133712 | VALID, not expired |

Version and build receipts are `.local/v4/apple-status-20260905.json` and
`.local/v4/apple-version-builds-20260905.json`. Existing release credentials
were used in memory only; no new keys, agreement changes, submissions or
publication settings were created. Previously submitted 1.1 approval does not
clear V4's classifier quality gates, isolated Mac runtime test or physical
device acceptance. The public storefront was not separately verified here.

## Manual Isolated Mac Runtime Check

After the owner unlocked the graphical session on September 5, completed a
manual smoke test through CUA using the already built
`build/macos-qa/Build/Products/Debug-maccatalyst/App.app`. The bundle identifier
is `cloud.chmurnik.qa.v4`, with its own sandbox container. The production app
and its observations were not opened or changed.

- Completed the three onboarding panels and imported the existing public
  `public/assets/clouds/cumulus.jpg` through the native file picker. The actual
  successful picker action was double-clicking the selected JPEG; this does
  not establish the automated Open-button sequence as passing.
- Local processing produced three numbered region proposals. Selected the
  first and ran analysis on that frame. The frame and the explanation that
  it is an analysis rectangle, not an exact cloud outline, were visible.
- The result explicitly said it could not identify the cloud genus. Cumulus
  and Stratus were offered for comparison, with the selected crop and an
  attributed atlas photo displayed together. This is the current fail-closed
  selected-region behavior, not a verified classifier improvement.
- Saved the observation, quit only the QA app, relaunched it, and reopened
  the saved record. The whole original photo, unconfirmed identification and
  automatically generated crop note survived. An attempted extra manually
  typed note failed because of a clipboard timeout; edited-note persistence
  is not claimed from this check.
- Opened all nine lesson modules and the complete maps/layers workspace,
  including its Windy, height, wind, METAR/TAF, hazards and sounding entries.
  This checks entry-point availability, not every exercise or accessibility
  configuration.
- Quit the QA app again and verified that it no longer appeared among
  running applications. No host, Remote, Codex or unrelated process was
  restarted or stopped.

The first launch was unusually slow and outlasted the CUA launch request.
The app subsequently opened without a forced stop; the next launch was fast.
A native Activity Monitor sample was saved as
`build/v4-mac-qa-startup-20260905-0916.txt`. The short sample is insufficient
to establish the cause or a permanent resource fix. Later command execution
briefly recovered, then again failed with `Too many open files`. Free disk
space subsequently fell to about 100 MiB; approval initialization failed with
`No space left on device` even for recording these results and removing our
own generated caches. Neither refused action was performed. On the owner's
next continuation, 13 GiB was available and normal command execution returned.
These observations do not establish a permanent descriptor-limit repair.

This is manual runtime evidence, not a passed XCTest run. It uses a known
atlas fixture, not independent recognition ground truth. No model weights,
thresholds, private-photo permissions, traffic captures, store archives or
Apple submissions changed. Physical camera, background behavior, large text,
VoiceOver and independent classifier acceptance remain open.

## Development-Signed Mac QA And Automation Boundary

After disk recovery, the existing ad-hoc XCTest attempt failed before its test
body with different/missing Team IDs during test-bundle loading. Evidence:
`build/v4-isolated-mac-photo-resume-20260905.xcresult`. Switched only QA builds
to the owner's existing Apple Development identity. Verify app, runner and
test-bundle signatures and the common team after building; do not disable
library validation or weaken system security. Release signing is unchanged.

The first signed runner, in the old QA container, stalled before main in
`_libsecinit_appsandbox`. Its two-second sample is
`build/v4-mac-qa-signed-startup-sample.txt`. That is a sampled wait location,
not a proven root cause. Interrupted only that test; after its runner exited,
terminated its own remaining xcodebuild process. No host/Remote restart.

The new isolated bundle ID is `cloud.chmurnik.qa.v4.development`; the derived
directory is `build/macos-qa-development`. Reusing the old derived directory
initially produced a stale `.xctestrun` bundle ID, which the preparation
assertion rejected. A fresh derived directory builds successfully, with
matching app/runner/test Team IDs. Source setup now skips every Catalyst UI
test before application launch unless the explicit QA identifier is supplied.

The fresh runner reached XCTest initialization but not the test body:
`build/v4-isolated-mac-fresh-container-20260905.xcresult`, exit65. Narrow system
logs at 11:16:04 show `Writer daemon requires authentication to enable
automation mode` followed by a local-authentication request for `Enable UI
Automation`. At 11:17:04 it timed out. The owner was asked to be available to
confirm that system request on a retry; no confirmation or new permission is
assumed. This remains an unexecuted automatic test, not an app assertion
failure or a passed XCTest.

Completed an additional manual CUA test of the exact development-signed app:

- Opened the fresh QA container, completed all three onboarding panels,
  imported the public atlas `cumulus.jpg`, received three numbered proposals,
  selected the first and ran the actual bundled local model.
- Observed explicit unconfirmed status and the retained own crop/atlas
  comparison. Saved the whole photo without inventing a genus.
- Added `Notatka testowa QA 2026-09-05: zapis i ponowne uruchomienie.` to the
  automatic crop note. Verified the exact text in the interface and the
  successful-save message. Quit the QA process, verified it absent, reopened
  the app and the same observation, and verified the full photo, uncertain
  status, exact crop note and additional note remained. No production app or
  real user observation was opened or changed.
- CUA accessibility clicks on an off-screen WebKit textarea did not reliably
  focus it. Scrolling, a screenshot-grounded direct click and clipboard paste
  produced a verified exact edit; simulated typing alone altered the multiply
  sign and was corrected before saving. Do not count failed attempts as saves.
- The native picker again highlighted the requested file while Open remained
  disabled; double-clicking that file imported it. The prepared XCTest now
  waits for/focuses the Go To field, replaces the old path explicitly, then
  waits for and double-taps the exact filename. This mirrors the manually
  successful sequence but still requires a real XCTest run.
- The first signed-app launch was slow. A 2s sample, 90s after launch, found
  the main thread in dyld `__open`, before app initialization. Evidence:
  `build/v4-mac-qa-development-startup-sample.txt`. It subsequently loaded
  without forced termination; the post-save relaunch request finished in
  about2s. Neither is a controlled startup benchmark or a permanent fix.

Quit the manual QA app and verified no app, runner or xcodebuild process
remained before the final test-source build. Postcard export, physical camera,
VoiceOver and large text are not verified by this run. No model weights,
distribution archives or Apple submissions changed.

## Owner-Approved Automation Retry And Direct Persistence Check

The owner confirmed availability for Enable UI Automation. Subsequent XCTest
runs entered the test body; the original permission request is no longer the
only blocker. Permission can recur between runs: the intermediate
`v4-isolated-mac-unique-note-20260905.xcresult` timed out before its test body.
Do not infer a permanent system permission or a repaired host service.

The test now uses the actual Catalyst window rather than the application-wide
frame, mouse clicks and wheel events rather than phone taps/Page Down, and
checks static-text values as well as labels. It verifies the full Go To path
and waits for both native picker sheets to close. Every Catalyst test refuses
to launch without the exact isolated QA identifier. App, runner and test
bundle retain the same existing Apple Development team and App Sandbox;
library validation and release signing are unchanged.

Selected failed runs under `build/`, retained as failures:

| Result bundle | Observed boundary |
| --- | --- |
| `v4-isolated-mac-owner-approval-20260905.xcresult` | Entered test body; original WebKit action/geometry failed |
| `v4-isolated-mac-window-geometry-20260905.xcresult` | Opened picker; original button-label query failed |
| `v4-isolated-mac-picker-id-20260905.xcresult` | Imported fixture, proposed regions and ran inference; model-version label query failed |
| `v4-isolated-mac-unique-note-retry-20260905.xcresult` | Saved whole photo; immediate note assertion saw only part of the typed marker |
| `v4-isolated-mac-note-wait-20260905.xcresult` | No proposals after the picker sequence; this does not establish a model failure |
| `v4-isolated-mac-mouse-waits-20260905.xcresult` | Import and inference passed; Page Down did not move the result panel |
| `v4-isolated-mac-wheel-persistence-20260905.xcresult` | Import, wheel scrolling, inference and initial save passed; exact note wait failed before saving the edit |
| `v4-isolated-mac-focused-note-20260905.xcresult` | Native Go To typing failed with `Timed out while synthesizing event`; exit 65, 164.505-second test body |

The wheel run's final AX snapshot contains the original crop note, without the
new marker. Its log also records other applications interrupting the textarea
click/keyboard sequence. This is not proof that focus contention is the sole
cause, nor evidence of a failed persistence write: the edit never reached the
Save action. The later attempt reactivates QA before controls and targets the
active application for typing, but failed earlier in the native file picker.
The full automatic persistence test remains unpassed; its assertions were not
removed or relaxed.

After all XCTest processes finished, used CUA on the exact current
`build/macos-qa-development/Build/Products/Debug-maccatalyst/App.app`:

1. Reopened the latest QA record, ID
   `37557e50-2832-4774-89c5-f53f2f98007a`, containing the public atlas fixture
   saved during the wheel run. Production CHMURNIK remained closed.
2. Kept the complete automatic crop note and added a unique Polish note with
   `żółć, źdźbło`. The initial paste duplicated the original note because the
   select-all shortcut did not take effect. Corrected the visible editable
   field through the supported AX setter and verified its exact full text
   before pressing Save; the duplicate was not saved.
3. Observed the successful-save message, quit QA through its own application
   menu, and verified it absent from the running-app inventory before relaunch.
4. Reopened the same record ID and visually verified the full original photo,
   unchanged unconfirmed genus, complete crop note and exact added Polish
   note. Expanded saved details and verified
   `3.0-ensemble-selected-region-experimental` remained attached.
5. Quit QA again and verified it absent; no host, Remote, unrelated application,
   real user observation or production database was modified.

The exact additional note was:
`Kontrola zapisu 2026-09-05 12:14: żółć, źdźbło. Notatka ma przetrwać ponowne uruchomienie.`
The timestamp is an identifying test string, not a measured benchmark time.
Screenshots and AX evidence are retained in this task's tool history. This
checks UI editing via the supported accessibility setter and persistence,
not uninterrupted physical typing or a passing XCTest.

XCTest attachments stay private under `build/`. Explicit captures now target
the QA window only; Xcode's automatic recordings can include other windows
and must not be published. A prior result capture showed scrolled proposal
controls peeking above the sticky modal header; do not call visual QA perfect.
Keyboard-only operation, large text, VoiceOver, physical camera, postcard
export and full device/background acceptance remain unverified here.

No new classifier weights, calibration thresholds, release archives or Apple
submissions were produced. Direct persistence success does not satisfy the
independent genus-quality gate.

Final regression checks after these source changes: 272 JavaScript tests,
139 ML/tooling unit tests and all nine lesson contracts pass. The latest
development-signed Mac build-for-testing also passes signature/team checks.
Core ML tooling still warns about installed scikit-learn/Torch versions, and
the SVC tests emit the existing probability-parameter deprecation warning;
no new model conversion or dependency update was performed. Unit-test fixture
training is not an additional classifier experiment or accuracy benchmark.

### Later September 5 Launch Failures, Recorded After Migration

The subsequent owner-idle and unlocked attempts are retained as
`build/v4-isolated-mac-owner-idle-20260905.xcresult` and
`build/v4-isolated-mac-unlocked-20260905.xcresult`. Both terminated with exit134
and Xcode's `childPID > 0` assertion in `IDELaunchServicesLauncher.m`, before
the test body. Only the identified orphaned runners of those attempts were
stopped. The command context reported launchd manager `Background`; this is
a diagnostic clue, not a proven cause. No full XCTest pass resulted.

A proposed GUI Terminal launch could not be used: the computer-use tool
explicitly disallowed controlling Terminal. That restriction was not bypassed.
No host or Remote restart was performed by this task. Later migration and a
working filesystem do not themselves prove this UI-test failure fixed. On
September6 only data-audit/unit work resumed; no native launch is being claimed.

### September 6: Aqua Retry

Later on September6 the shell reported launchd manager `Aqua`, unlike the
previous `Background` context. This justified one new test-without-building,
not another identical compile. First checked the existing app and runner
signatures, the exact isolated QA bundle/environment in the xctestrun, and
byte equality of the staged/current Swift test source. No signing changes,
new security permissions or production-app data changes were made.

`build/v4-isolated-mac-aqua-20260906.xcresult` records the run at08:58 CEST:
Mac mini, arm64, macOS26.6.2 (25G83), the single isolated persistence test,
parallel testing disabled and a300-second maximum test allowance. The runner
started, without the earlier `childPID` assertion, but initialization failed
with `Timed out while enabling automation mode.` before the test body.
The command exited65 after approximately70seconds. `xcresulttool` confirms
zero passed tests and one runner-initialization failure, not a photo-workflow
assertion failure. The runner was absent from the running-app inventory after
completion; no orphan cleanup or service restart was necessary.

Elevated **read-only** `DevToolsSecurity -status` reports developer mode
disabled. This is a relevant observation, not proof that toggling that global
setting alone would fix XCTest. Asked the owner whether they can approve the
system Enable UI Automation prompt on a subsequent attempt. Did not enable
developer mode, edit TCC, grant Accessibility or bypass authorization. Await
the concrete permission/UI condition instead of repeating timed-out launches.
Manual QA evidence above remains valid within its stated scope; it is not a
passing unattended XCTest. Genus-quality and release gates remain open.

### September 6: Owner Approval and Interrupted Interaction

The owner confirmed approving Enable UI Automation. The next run,
`build/v4-isolated-mac-approved-20260906.xcresult`, entered the test body,
launched the isolated app and initialized the accessibility/automation session.
After the conversation interruption its execution handle and runner were gone;
the bundle lacks Info.plist and is not a valid completed result. Direct AX
inspection found the imported fixture and five proposals in QA. This proves
progress beyond initialization, not a passing test. Closed only the remaining
isolated QA app through its menu and verified its process absent.

One complete retry is retained at
`build/v4-isolated-mac-uninterrupted-20260906.xcresult`. It finished with exit65
and one assertion failure after131.632seconds in the test body, approximately
203seconds including initialization. Import, proposal selection, inference and
the experimental model-version check completed. After the Save click the
expected observation-editing text did not appear within15seconds (Swift378).
The runner and QA app terminated. No permission toggle or host/service restart
was performed. Developer Mode being disabled did not prevent this test body.

The interaction was obstructed by an external foreground window. This is not
proof of a persistence bug. Do not change save behavior or relax assertions to
make this contaminated run green. No automatic persistence pass is claimed.
Detailed diagnostic notes and recordings remain local under build/, outside
version control; unrelated application details must not enter public reports.

The host coordinator requested an exclusive native-QA window for another task.
Confirmed only that CHMURNIK's heavy work has ended and deferred new native
builds, UI tests and simulators until the window is released. A proposed
cross-task detailed diagnostic message was rejected by the approval reviewer;
it was not sent. A separate minimal scheduling-only confirmation was accepted.
Do not share the rejected recording-derived diagnostics without owner approval.

The QA result screenshot independently reproduces content showing above the
sticky photo header. Corrected the header background/position to cover the
modal's top padding, preserving separate responsive top/side gutters and the
bottom safe area. Headless Chromium checks pass at 320x640, 390x844, 844x390,
1024x768 and 1280x800: after opening/closing details and scrolling, the header
covers the top edge, Close/Save remain actionable and there is no horizontal
overflow. Inspected narrow, landscape and desktop captures. The complete
two-photo fixture flow still passes selection, keyboard movement, original
photo save, reload, unconfirmed status and delete. Evidence is under
`build/v4-photo-header-qa-wide-check-20260906/`; the earlier failed responsive
check is retained separately, not overwritten.

All 272 JavaScript tests pass; the production web build succeeds with
`index-DRnTagjr.js` and `index-CNpHOjaI.css`. No native bundle was refreshed or
published during the exclusive QA hold. Browser fixtures do not prove native
WebKit/physical-camera acceptance or classifier quality.
