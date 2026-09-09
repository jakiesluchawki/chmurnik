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
- iPhone r3 test10 passed: bundled cloud interaction, independent case and
  return to lesson chapter 2, retained after application relaunch.
- Final Mac development-signed isolated bundle: all 132 public files match
  the root production dist byte-for-byte. Computer Use opened and returned
  from all fourteen workshops. Completed a cloud prediction/action/evidence/
  feedback cycle (500 m, 19.1 C, below the 1200 m condensation level), then
  returned to the correct lesson. Daily reveal and conceal also passed.

## Unresolved / Not Claimed

- iPhone r3 test11 stopped on return from METAR. Its screenshot shows the
  link outside the status bar; the cause is not yet established. In r4 the
  same return worked, and twelve workshops loaded. The test then exhausted
  its eight-scroll limit before the thirteenth catalogue card. Only that
  long-list test now permits 24 scrolls; no assertion was removed. Final
  run is in progress. The earlier failures remain recorded, not relabeled.
- Mac XCTest runner failed before tests while enabling automation mode.
  Final isolated-app Computer Use checks are listed above and are distinct
  from XCTest. The wide Mac lesson layout displays all chapters rather than
  the iPhone's paginated chapter UI; its return check uses the correct lesson.
- No physical Samsung/Android-device or VoiceOver certification is claimed.
- No new classifier, accuracy improvement, meteorologist validation or
  measured educational effectiveness is claimed by this UI release.
- Apple upload, final signed archive receipts and CyberFolks ZIP checks are
  still required. The user uploads CyberFolks; we do not alter that server.

## Evidence Handling

Earlier delegate responsive-integration report records a failed browser-tool
attempt. Parent browser measurements supersede that attempt, not its history.
Viewport screenshots are initial views, not proof of every interaction.
Native xcresult bundles and signing materials stay outside public Pages.
