# Workshop Expansion Verification

Date: 2026-09-09. Task: lore-0043. Release status: not yet submitted.

## Contributors

Four agents participated: the coordinating implementation/QA agent and three
delegates. Bernoulli handled sounding and general prediction/evidence records;
Kierkegaard handled turbulence, packaged/offline integration and release review;
Maxwell handled the three foundation workshops, wind and cross-link review.
The coordinator integrated their work, corrected mobile/native issues and
performed browser and native verification. Reports are in this directory.

## Verified So Far

- Complete final Node test run: 925 passed, zero failed/skipped/todo.
- CLI resume repeated Node validation: 925 passed, zero failed/skipped;
  `/tmp/chmurnik-native-harness-after-resume-tests.log`. Swift frontend parse
  passed for the updated XCTest source; this is syntax validation, not a
  compiled or passed native UI test. Private release-gate fixtures: 14 passed.
- Network link verification: 61 external links passed.
- All nine lesson audits passed. This audits structure, not learning outcomes.
- Production bundle includes all fourteen workshops and their offline assets.
- Browser: completed all three new wind observations, including wrong-first
  answers, separate evidence, help timing, pending-step reload and a new
  assessment case. General METAR final flow retained a wrong prediction and
  correctly accepted its separate evidence without converting the prediction
  to a pass. The return to the catalogue worked.
- Mobile initial-view checks cover all fourteen routes at 320 and 390 px.
  No horizontal overflow or failed loaded images observed. Small radio input
  glyphs have larger clickable labels; measure the label, not only the glyph.
  A long mode caption at 320 px was shortened to Swobodnie.
- The earlier locked iPhone run passed photo selection, region proposals, local
  inference, observation persistence, direct tools, lesson persistence,
  Warstwy/daily concealment and the bundled lesson/workshop round trip.
  Its remaining three failures are detailed below; the full run is not a pass.
- The earlier locked iPad run passed seven of eight tests, including portrait/landscape
  rotation, privacy, Warstwy/daily concealment, wide lesson round trip and all
  fourteen workshop loads/returns. The photo fixture-selection error is below.
- Final Mac development-signed isolated bundle: all 132 public files match
  the root production dist byte-for-byte. Computer Use opened and returned
  from all fourteen workshops. Completed a cloud prediction/action/evidence/
  feedback cycle (500 m, 19.1 C, below the 1200 m condensation level), then
  returned to the correct lesson. Daily reveal and conceal also passed.
- Mac CUA additionally exercised the actual file picker, five region proposals,
  local inference, saving a whole photo with a unique note, confirmed process
  exit and restored that same journal ID/photo/note after relaunch.
- GitHub Pages commit 86f752f is published; Actions run 34335971558 succeeded.
  The public workshop manifest matches the final root production bundle.
- CyberFolks ZIP contains exactly the 132 root dist files, all byte-identical.
  Archive integrity and the publicly downloaded ZIP both passed. SHA-256:
  f31ae19cda6d6455d5f4910bb624c2390142e8c39f17ecb4034658b783c92a11.
  Download: https://github.com/jakiesluchawki/chmurnik/releases/download/www-pracownie-20260909/CHMURNIK-WWW-2026-09-09.zip
  It contains no reviewer accounts, private photos or signing material.
  chmurnik.cloud was not changed; the owner performs that upload.

## CLI Resume Checkpoint

### Later App-Session Verification

- After the explicit CLI-to-app handoff, simctl could read device state again.
  The CHMURNIK phone was Shutdown; the unrelated ZabHop simulator was left
  untouched. No parallel copy of this task was started.
- Locked iPhone r5 compiled the corrected photo harness with camera 1.0.4 and
  finished at 15:46:36: **4/5**, exit 65. Tests 03/08/10/11 passed, including
  manual context selection, local inference, save/relaunch persistence and
  all fourteen workshop catalogue round trips. Test06 failed: after six
  Previous taps, chapter 2/7 remained instead of 1/7.
- Exported all 53 attachments for test06 to
  `build/workshop-native-20260909/iphone-r5-lesson-failure/`. The manifest is
  complete. Frame 46 and frame 48 both show chapter 7/7 around the first
  Previous tap; frame 72 shows chapter 3/7 before the last tap. The synthesized
  first tap is (109, 361.5). This demonstrates one unconsumed transition;
  it does not yet prove whether WebKit automation or app interaction caused it.
- Candidate harness changes use a settled application-relative screen point
  instead of re-resolving a WebKit element coordinate at tap time, print the
  measured target, and assert every backward/forward chapter transition.
  No repeat-until-success action or removed assertion was introduced.
- Targeted locked r6 tried test06 with this candidate but exited 74 before
  tests: denied Clang/SwiftPM cache writes again. Log:
  `/tmp/chmurnik-native-iphone-locked-r6.log`. Do not relabel this as a native
  pass, infer that host passwords are wrong, or bypass the denial. A fresh
  permitted full r7 must still pass 03/06/08/10/11.
- The release gate now explicitly requires passed photo test03 on both
  families and lesson-state test06 on iPhone, in addition to 08/10/11.
  All 14 fixture tests pass; Swift source syntax parses. Neither substitutes
  for the pending corrected native run. No production app/model bytes changed.
- Fresh ASC API read still failed ENOTFOUND. Browser Computer Use worked and
  opened the app URL, but Apple redirected to login with authResult=FAILED.
  No account, password, autofill permission or security setting was changed.
  No dedicated ASC connector is available in the current tool inventory.
- Local CyberFolks ZIP SHA-256 was rechecked and is unchanged. Existing Apple
  upload receipts and the stale source snapshot are preserved. No new binary
  upload, screenshot upload, archive/export or review submission was performed.

### Earlier CLI Evidence

- Locked iPhone r3 completed at 13:04:41: 4/5 passed. Tests 06, 08, 10 and 11
  passed, including all fourteen workshop routes and catalogue returns.
  Test03 failed on the manual photo-context control, not on inference.
- Its failure AX tree gives the selection surface as x33/y265/w374/h281.
  The default center tap (220, 405.5) lies inside proposal 1 at
  x197/y368/w45/h45. The selected proposal value remained 1. PhotoFrame
  deliberately displays the context-size controls only in manual mode.
  This establishes a test-coordinate error, not a missing app control.
- Test03 now measures all proposal frames, chooses a visible point outside
  them with an 8 px margin, verifies the proposal is deselected and checks
  that increasing context actually selects size 1. No inference, save,
  relaunch or persistence assertions were removed. No app/model bytes changed.
- Locked iPad r2 completed 4/4, including corrected cloud fixtures, navigation,
  the wide lesson round trip and all fourteen workshop loads/returns.
- Locked iPhone r4 attempted the corrected harness but exited 74 before tests:
  the current CLI sandbox denied Xcode cache/log writes and its connection to
  CoreSimulator was invalidated. Preserve its log and xcresult; this is neither
  an assertion failure nor a pass. Do not bypass these denials or change host
  security. The later app-session r5 result is recorded above.
- Preserved iPhone QA bundle was checked again: all 132 files match root dist
  (`build/workshop-native-20260909/iphone-resume-bundle.json`). Its version is
  1.2 (1); it is not a newly archived 1.2.1 distribution build.
- A fresh ASC read in this CLI session failed with ENOTFOUND for
  api.appstoreconnect.apple.com. Last owner-reported state at 14:54 remains
  1.2.1 PREPARE_FOR_SUBMISSION with build null, not a fresh API confirmation.
  Local screenshots-progress.json records five iPhone assets COMPLETE, no
  verified final sets and submitted=false. Do not reupload those five assets;
  first GET current Apple state when network access is available.
- The existing private snapshot predates the XCTest changes and is stale.
  No passed QA receipt, release archive, new binary upload or submission was
  produced during this resume. Existing WWW download remains unchanged.

## Unresolved / Not Claimed

- Historical iPhone r3 test11 stopped on return from METAR. Its screenshot shows the
  link outside the status bar; the cause is not yet established. In r4 the
  same return worked, and twelve workshops loaded. The test then exhausted
  its eight-scroll limit before the thirteenth catalogue card. Only that
  long-list test now permits 24 scrolls; no assertion was removed.
- An intervening passing iPhone 10/11 run resolved ion-ios-camera 1.0.5 and
  is excluded from the release gate. Subsequent runs pin both automatic package
  resolution flags and verify the actual DerivedData dependency at 1.0.4.
- Locked iPhone full run: 5 passed, 3 failed. Test01 showed a blank WebView
  and splash instead of rendered home content. Test02 stayed on Help after
  tapping Privacy. Test11 stayed in Wind after tapping the catalogue link.
  Its synthesized tap was x44/y92, near the edge of the x40/y83/w67/h18 link.
  The harness now waits for stable actionable bounds and taps the center;
  no app assertion was removed. Later reruns supersede the catalogue failure;
  the remaining photo-harness verification is described in the checkpoint.
- Locked iPad full run: test03 selected a stock photograph of leaves, not a
  cloud fixture. The saved gallery screenshot shows six simulator stock photos
  before the two imported cloud images. The absence of cloud regions on that
  selected image is not evidence of a detector failure. The test now selects
  the final two imported fixtures. Locked r2 subsequently passed 4/4.
- The iPad test10 launch also logged inability to monitor the event loop and
  animations and took several minutes; it eventually passed. Resource load
  was high, but this alone does not establish the cause of the iPhone startup.
- Mac XCTest runner failed before tests while enabling automation mode.
  Final isolated-app Computer Use checks are listed above and are distinct
  from XCTest. The wide Mac lesson layout displays all chapters rather than
  the iPhone's paginated chapter UI; its return check uses the correct lesson.
- No physical Samsung/Android-device or VoiceOver certification is claimed.
- No new classifier, accuracy improvement, meteorologist validation or
  measured educational effectiveness is claimed by this UI release.
- Apple upload and final signed archive verification are still required.
  A ready WWW archive is not a claim of an App Store release.

## Evidence Handling

Earlier delegate responsive-integration report records a failed browser-tool
attempt. Parent browser measurements supersede that attempt, not its history.
Viewport screenshots are initial views, not proof of every interaction.
Native xcresult bundles and signing materials stay outside public Pages.
