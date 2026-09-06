# Apple 1.2 Submission And Web Delivery

## Verified Outcome

The owner-authorized UI/content release is publicly available on Mac; iPhone/
iPad1.2 remains in review waiting. Readback on September6 at16:37 UTC reports
MAC_OS READY_FOR_SALE and IOS WAITING_FOR_REVIEW. The Mac version also reports
READY_FOR_DISTRIBUTION and downloadable=true, with the exact submitted build
relationship below. Existing AFTER_APPROVAL publication behavior remains.

The public Polish [Mac App Store page](https://apps.apple.com/pl/app/chmurnik/id6782159027?platform=mac)
was independently opened in the in-app browser. It shows "for Mac", "View in
Mac App Store", "Version1.2", the complete approved V4 release notes and Poland.
This is actual storefront confirmation, not merely successful processing.
The iTunes lookup returned the iOS1.1 record despite entity=macSoftware, so that
lookup must not override platform-specific App Store Connect and storefront
evidence. No new submission, build, store metadata or distribution change was
made during verification. The original submission history below is retained.
After the full ML run, a final iOS GET at17:09:41 UTC still confirms
WAITING_FOR_REVIEW and the same VALID build20260906092043.

| Platform | Version | Build | Source | Apple Processing |
| --- | --- | --- | --- | --- |
| iPhone/iPad | 1.2 | 20260906092043 | 3a6372a | VALID |
| Mac Catalyst | 1.2 | 20260906093223 | 7a1d618 | VALID |

Both archives contain identical current web assets, checked byte-for-byte
against the tested app: index-DRnTagjr.js and index-CNpHOjaI.css. The additional
Mac source commit adds the education category to the shared source plist and
a regression test; it does not change application logic. All 273 JS tests and
the nine-module lesson audit pass. Functional native QA and remaining device,
camera, accessibility and older-system boundaries remain in native-and-copy-qa.md.

Private build, export, processing and submission receipts are preserved under
.local/releases/apple-0042-20260906. The submit helper verifies exact app,
platform/version/build relationships, metadata and complete screenshots before
submission and reads back the resulting state. It has a GET-only check mode.
Do not repeat upload or submission from a missing GUI indication.

## Signing And Recovery

Restored only the original release-signing keychain and its technical password
file from the existing owner backup after locating the missing historical
path. The backup was not modified; copies used exclusive creation, private
file permissions and the existing user keychain search-list entry. No login
password was accessed or stored. No Developer Mode, TCC, authentication policy,
host or Remote service was changed.

Both actual archives use the previously valid matching Apple Distribution
certificate and app-specific provisioning profiles. Two alternative profiles
created before the backup was found were not used; neither they nor existing
certificates were revoked. The release keychain was explicitly locked again
after both exports succeeded. The owner's separate three-hour idle-sleep
assertion expires automatically around 13:46 CEST; it does not defeat a manual
screen lock or establish permanent UI-test authorization.

The first Mac archive built but failed the local category assertion before any
upload. Preserved it separately as macos-category-rejected. Fixed the source
plist, added a passing test, regenerated the staged plist and created a new
archive. Never patched or resigned the failed archive in place.

Regenerated Capacitor/Cordova Catalyst SDKs from the pinned upstream source
and signed their XCFrameworks with the existing release identity. Verified
real signatures, team, secure timestamps, matching Xcode archive origin
records and the full app signature. Matched both architectures' dSYM UUIDs
to the actual embedded binaries before export. Apple processing subsequently
reported VALID. The archive contains arm64 and x86_64, education category,
App Sandbox, no development entitlement and no unintended application groups.

## Store Scope

Complete Polish What's New is in design/release-v4-ui-20260906.md. Readback
verified metadata, current-flow reviewer instructions and the correct builds.
Description, keywords, promotional text, URLs, review contact and licensing
remain unchanged. Explicitly copied promotional text because Apple did not
inherit that field into the new draft. No DSA, tax, banking, price, privacy,
age-rating, account or TestFlight audience changes were made.

Retained existing complete 1.1 store screenshots: five iPhone, four iPad,
four Mac. These are inherited store assets, not new promotional captures of
the V4 workflow. Native QA screenshots are independent test evidence.

No genus-model weights were replaced. Region proposals and selected-region
inference remain experimental; this release is not an accuracy-upgrade claim.
The failed research precision/coverage gate remains binding. The overall goal
and independent-evidence work remain active.

## Web

Root and Pages candidates each pass the production browser harness at 42
route/viewport combinations, including storage/edit/backup, METAR/TAF, wind,
maps, full learning and layout. Inspected phone lesson and desktop home
captures. Published 7a1d618 through the existing GitHub Pages workflow:
https://github.com/jakiesluchawki/chmurnik/actions/runs/34025437817

Repeated the full browser harness on the public deployment successfully.
Seventeen public files match the candidate byte-for-byte; five social ZIPs
respond with matching sizes. All 255 existing gallery source files were
preserved byte-for-byte in the candidate. Previous published Stories, videos,
PDFs and wallpapers are untouched. No new twenty-motif wallpaper pack exists.

Current Pages entry bundle: index-BIk7iW0S.js. Root candidate: index-DRnTagjr.js.
Before the owner's upload, chmurnik.cloud served index-BpdEVwM6.js. Updated
the owner's private existing Drive ZIP in place, retaining
its link, parent and owner-only permission. Readback confirms 22,777,833 bytes
and the September 6 file name. Local ZIP structure/CRC passes; SHA-256 is
361ffea54e3fa3a4075cb0612b5231b469c17a9b92287ec65b6f471b908881b5.
Connector metadata exposes size, not a remote checksum. Delivery receipt is
.local/v4/web-delivery-20260906.json; hosting instructions remain in
design/web-v4-handoff.md. The owner performs the Cyber_Folks deployment.

### Root Deployment Verified After Owner Upload

On September 6 at 11:30:16 UTC, all 81 public files from the delivered root
candidate match the live domain byte-for-byte (24,452,581 decoded bytes).
This includes index-DRnTagjr.js, index-CNpHOjaI.css, the knowledge bundle,
all packaged cloud photographs, fonts, icons, service worker and information
pages. This is a verified root deployment, not a Pages-only update.

The response headers exactly match every `Header always set` value in the
delivered .htaccess. Entry HTML, manifest and service worker have no-store /
no-cache; .htaccess itself returns 403. HTTP and www entry points redirect to
https://chmurnik.cloud/ and return the same tested entry HTML. The existing
Pages asset hub and Astra gallery remain available and byte-identical; these
gallery checks refer to their established Pages URLs, not root-hosted copies.

The complete `scripts/check-field-ui.mjs --base https://chmurnik.cloud/`
browser harness passes on the public deployment: observation/photo storage,
editing, postcard, deletion, backup round trip, METAR/TAF parsing and timelines,
error recovery, wind/map controls, atlas, all nine lesson entry points,
42 route/viewport visits and public help/privacy pages. No uncaught JavaScript
errors or CSP violations occurred. Inspected actual mobile home, layers lesson
and desktop METAR screenshots. This is not physical-device accessibility QA,
an old-to-new service-worker transition test, or an improved-model claim.

Evidence: `build/v4-cyberfolks-live-20260906-files.json`, SHA256
`ebefe3dc2ccc1ce2f916ea91b11819f53c9e6f20135e9ec24fef00d986275586`,
and `build/v4-cyberfolks-live-20260906-qa/` screenshots. The verifier is local
under `.local/v4/check-cyberfolks-live.mjs`. No server file, user browser
profile, model or Apple submission was modified by these checks.

The existing 24-hour heartbeat was updated through the app tool to check both
1.2 review states independently, remaining silent without a meaningful change.
It preserves the existing DSA/statistics monitoring and does not perform builds,
UI tests or automatic submission. No duplicate automation was created.

## Remaining Work

Later September6 web-only patch13dd8f4 is published and verified on Pages.
It fixes downloaded-atlas preservation during updates, offline logo/italic
availability and includes the earlier keyboard-focus repair. Apple1.2 is
unchanged. A new private root ZIP under the same link requires a separate
owner upload; do not confuse the earlier verified7a1d618 root deployment
with this later package. See `offline-upgrade-preservation.md` for the real
old-to-new tests, exact live/ZIP receipts and browser-fixture limitations.

Read-only recheck on September 6: iOS at 13:29:18.904 UTC and macOS at
13:29:44.824 UTC both remain WAITING_FOR_REVIEW, with the same VALID build IDs
and build numbers recorded above. Receipts are the respective
`.local/releases/apple-0042-20260906/{ios,macos}/processing-check.json` files.
The shared helper's `check` early exit was inspected before approved execution;
no new build selection or submission occurred.

- Await the iOS/iPadOS1.2 review outcome; do not label WAITING_FOR_REVIEW as live.
  Mac1.2 is now verified publicly available in Poland; this is the UI/content
  release with the original genus classifier, not a recognition-accuracy claim.
- The root deployment is verified; existing-user service-worker migration on
  this domain was not captured before upload and is not newly certified here.
- Continue classifier work from independent evidence, not further tuning to
  the exposed test set or lowering the quality gate.
- Deliver the separate twenty-distinct-motif wallpaper request.
