# CHMURNIK 1.2.1: Release Handoff

## Confirmed Apple Submission

On 9 September 2026 both platform versions were submitted to App Review:

| Platform | Version / build | Apple state |
| --- | --- | --- |
| iPhone / iPad | 1.2.1 / 20260909165644 | WAITING_FOR_REVIEW |
| Mac Catalyst, arm64 and x86_64 | 1.2.1 / 20260909165644 | WAITING_FOR_REVIEW |

Both uploaded builds were processed as VALID. Each upload and review submission
was performed once. This is a confirmed submission, not App Store approval or
public availability. Do not repeat upload/submission when resuming this task.
Private API receipts and transport logs are retained outside Git.

The original Mac export failed Apple 90255 because one CodeResources entry had
mode 0600. A separate archive copy changed only that mode to 0644; no file bytes
changed. The new export passed signature, profile, SDK-origin, package-permission
and frozen-payload verification, followed by Apple's real validation and upload.
The original archive and unsuccessful export remain preserved for diagnosis.

Five real native Mac screenshots were captured from the isolated QA application
at 2880 x 1800. Their opaque pixels were preserved; only transparent rounded
corners were flattened. Apple confirmed all five COMPLETE. Only obsolete images
in the unreleased Mac draft were replaced; published screenshots were untouched.

## What This Release Contains

- Fourteen weather workshops connected to the nine existing full lessons.
- Prediction, observation and explanation, with different independent cases.
- Progressive sounding/Skew-T reading, METAR/TAF and three wind observations.
- Mechanisms of condensation, fog, breeze, fronts and weather hazards.
- Separate native Warstwy navigation and concealed daily cloud answers.
- Improved compact-screen interaction and working lesson/catalogue returns.

The existing on-device cloud classifier is unchanged. This is not an accuracy
upgrade. Educational diagrams and synthetic cases are not operational weather
forecasts, flight clearance or sailing-safety assessments.

## Verification And Limits

- Node: 925 passed, no failures or skipped tests.
- Nine lesson-structure audits passed; 61 external source links checked.
- iPhone locked-r10: 5/5, including photo context, local inference, two saved
  observations across relaunch, navigation and all fourteen workshop returns.
- iPad locked-r2: 4/4.
- Native Mac Computer Use: photo/save/persistence and all fourteen workshop
  entries/returns verified. Mac XCTest initialization did not pass; the native
  Computer Use verification is not described as an XCTest run.
- Signed Apple exports matched the frozen web payload, SDK provenance and QA
  receipt. The distribution package is not merely an ad-hoc QA build.

The later social-gallery-only update passes 927 Node tests. One old campaign
test assumed the 8 September announcement would always be newest; it now checks
that the prior pack is retained as an archive and the new pack is first. Two
additional tests verify all ten texts, all three complete posts and truthful
availability. This post-submission test change does not alter the signed app
payload or rewrite its frozen QA receipt.

Four agents participated in the implementation/QA phase: the coordinator handled
integration, mobile/native fixes, verification and release; Bernoulli handled
soundings and prediction/evidence records; Kierkegaard handled turbulence,
offline packaging and release review; Maxwell handled foundation workshops,
wind and cross-links. Detailed reports remain in the workshop verification
directory. Software checks do not establish measured learning effectiveness.

## WWW And Delivery

The owner-uploaded CyberFolks site matched all 131 publicly readable package
files. The protected .htaccess was not downloaded. No duplicate production
upload is needed; social-library updates are separate GitHub Pages content.

The unchanged CyberFolks package is available at:
https://github.com/jakiesluchawki/chmurnik/releases/download/www-pracownie-20260909/CHMURNIK-WWW-2026-09-09.zip

SHA256: f31ae19cda6d6455d5f4910bb624c2390142e8c39f17ecb4034658b783c92a11

## Social Copy And Preservation

The new complete copy set is in social/2026-09-09-pracownie/: ten Stories/carousel
slides plus Instagram, Facebook and LinkedIn posts. The old two-experiment
announcement is archived in the permanent /assetySM/ catalogue. Final static
PNG/PDF assets await owner copy approval, as previously requested. Nothing has
been posted to the owner's social accounts.

Public gallery: https://jakiesluchawki.github.io/chmurnik/premiera/pracownie/
Permanent library: https://jakiesluchawki.github.io/chmurnik/assetySM/

The initial social-only Pages deployment 4321fa3 passed GitHub Actions run
34394647646. Browser checks verified all ten texts, loaded artwork, no horizontal
overflow at 320/390 CSS px, complete LinkedIn text, working copy action and the
mother-page return. Temporary viewport overrides were cleared. A small follow-up
adjusts the desktop cover crop without modifying any app or workshop code.

Following the owner's feedback, the complete second copy version emphasizes
learner value and the completed development phase while preserving the warm
brand voice and honest Apple availability. It replaces the full set in the
same gallery; no fragment assembly or new bookmark is needed. Final PNG/PDF
production remains pending revised-copy acceptance.

The Kingston worktree and its uncommitted QA material are preserved. Reviewed
commits are pushed to codex/weather-preview; only scoped social-gallery changes
belong on Pages main. PROME is the owner's Synology archive share, not a laptop.
An independent Git bundle and worktree/private-release archives were restored
and checksum-verified there. A later checkpoint supplements the Mac submission
and screenshot evidence without overwriting existing migration archives.
