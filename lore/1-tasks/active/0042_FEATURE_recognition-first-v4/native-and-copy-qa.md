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

## Resource Cleanup

Own iPhone simulator `D0FB0555-660E-46E9-A33F-CC07B4E1D068` and own iPad
`2B68D7C2-64CD-4536-8436-602CAD4FCE7D` were shut down and deleted after exporting
results. The earlier own iPad and generated Mac module cache were removed after
disk exhaustion. No user simulator, research model, source photo, release file,
other task or host/Remote process was deleted or restarted. The failed/incomplete
test evidence remains distinguishable from successful runs.
