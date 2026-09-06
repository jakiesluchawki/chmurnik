# Apple 1.2 Submission And Web Delivery

## Verified Outcome

The owner-authorized UI/content release is submitted, not approved or publicly
released. Both App Store versions were read back as WAITING_FOR_REVIEW on
September 6 at 11:39 CEST. Existing AFTER_APPROVAL publication behavior remains.

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
Public chmurnik.cloud still serves index-BpdEVwM6.js; no domain deployment is
claimed. Updated the owner's private existing Drive ZIP in place, retaining
its link, parent and owner-only permission. Readback confirms 22,777,833 bytes
and the September 6 file name. Local ZIP structure/CRC passes; SHA-256 is
361ffea54e3fa3a4075cb0612b5231b469c17a9b92287ec65b6f471b908881b5.
Connector metadata exposes size, not a remote checksum. Delivery receipt is
.local/v4/web-delivery-20260906.json; hosting instructions remain in
design/web-v4-handoff.md. The owner performs the Cyber_Folks deployment.

The existing 24-hour heartbeat was updated through the app tool to check both
1.2 review states independently, remaining silent without a meaningful change.
It preserves the existing DSA/statistics monitoring and does not perform builds,
UI tests or automatic submission. No duplicate automation was created.

## Remaining Work

- Await actual Apple review outcomes; do not label WAITING_FOR_REVIEW as live.
- Confirm the root-domain deployment only after the owner uploads the ZIP.
- Continue classifier work from independent evidence, not further tuning to
  the exposed test set or lowering the quality gate.
- Deliver the separate twenty-distinct-motif wallpaper request.
