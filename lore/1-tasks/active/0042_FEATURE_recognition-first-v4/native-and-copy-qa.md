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
build-for-testing succeed with that same bundle. Mac UI tests were compiled,
not run against the user's existing application or photo collection. XCTest
emits a Mac test-target deployment warning (test framework requires 17.0 while
the target declares 15.0); this is not an app deployment compatibility result.

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

Remaining: independent labeled evidence, classifier release gates, current Mac
runtime/file-picker verification in an isolated data container, physical camera
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

See `design/web-v4-handoff.md` for the complete Polish handoff. Neither package
was uploaded/deployed. Live-host and existing-service-worker update checks
remain outstanding. This web deliverable does not close classifier, native
runtime, Apple submission or wallpaper requirements. Do not rebuild the same
unchanged candidates on each continuation; preserve the verified artifacts.
