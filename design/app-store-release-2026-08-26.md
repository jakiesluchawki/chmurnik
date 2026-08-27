# CHMURNIK 1.0 Release Evidence

Task 0033 follows the owner's explicit authorization to prepare and publish
the first public release. This document records verified App Review submission,
not an Apple approval or a public release. The earlier readiness audit is historical.

Metadata/build/screenshots reverified: 2026-08-27 05:31 UTC. Submission read-back:
2026-08-27 05:34:51 UTC (07:34 in Warsaw). Release code:
`6497e51d22451f11ef16b9b130349f1d130e9103`; no production changes in this follow-up.

## Final Candidate

- Version/build: `1.0 (20260826214336)`.
- App: `6782159027`, bundle `cloud.chmurnik.app`, iPhone only.
- SDK: iOS 26.5; declared minimum iOS 15.0.
- App Store Connect build: `69a2c1f6-0803-4222-b9ab-b34e5dec5760`, `VALID`.
- Archive and upload succeeded. All 80 embedded web files match the final
  tested root build byte-for-byte. Both compiled Core ML models and the app,
  Capacitor and Cordova privacy manifests are present. No UI-test bundle or
  injected recognition fixture is embedded. Signature verification passed.
- The isolated signing keychain was re-locked after upload. The login
  keychain and desktop lock were not changed.
- The earlier uploaded candidate `20260826210814` lacks the final layout
  fixes and is superseded for this release. Do not select it for publication.

## Changes

- One reviewed source supplies the in-app help/privacy views and standalone
  `support.html` / `privacy.html`. Both hosting prefixes and offline content
  are supported. Public support uses the existing repository issue tracker,
  not an unconfirmed private email address.
- The policy reflects local model processing, optional camera/library use,
  source metadata removal, explicit sharing/export, recovery copies and OS
  backups. No accounts, analytics or photo upload to a developer/AI service.
- Fixed a real native library-to-vault failure: the library bridge can return
  a photo outside the app container. Only the local Capacitor preview is
  read and compacted into a metadata-free copy; native path checks remain.
- Fixed iOS date-field overflow, content showing under the scrolled status
  bar, and a legacy CSS class collision that obscured workshop disclosures.
- No model retraining, scientific-content expansion or accuracy claim.

## Verification

| Check | Result / Evidence |
| --- | --- |
| Node tests | 162/162, eight new; `build/app-store-tests-release-final.log` |
| Lesson quality | 9/9 modules |
| Source/provenance links | 58/58 HTTP 200; `build/app-store-links-release.log` |
| Native storage | Real Swift store tests passed migration, rollback, bounds and recovery |
| Production web | Full root/CSP flow passed; `build/app-store-web-qa-release-final.log` |
| Live GitHub Pages | Full public production flow passed; `build/app-store-pages-live-qa.log` |
| Responsive views | 320, 390 and 1440 px; public help/privacy routes and standalone HTML |
| Native Release UI | 4/4 passed, zero failures; `build/app-store-ui-13.xcresult` |
| Native gallery | Two actual library selections, real Core ML, save, terminate and reopen |
| Stored metadata | Nine test JPEGs have no source GPS/TIFF/capture EXIF; technical encoder dimensions/color allowed |
| Screenshot integrity | Five genuine, opaque sRGB PNGs, 1320 x 2868; hashes in screenshot manifest |
| Archive | SDK 26.5, valid signature, 80 exact embedded files, no test fixtures |

Simulator: isolated iPhone 17 Pro Max on iOS 26.5. Permission denial was
tested there; no physical camera, oldest-supported-iOS, VoiceOver or real
low-storage acceptance is claimed. The store photographs use a licensed
Cirrus reference, not private user photos. See `app-store/screenshots/README.md`.

## Store And Submission Status

- Owner confirmed app-embedding licenses for both Romie and Roobert.
- Free distribution configured and verified: one zero-price Polish base
  price and 174 automatic zero prices; 175 territories enabled, no preorders.
- The owner's latest Business screenshot shows Free Apps Agreement `Active`
  and DSA `In Review`. Apple still reports `TRADER_STATUS_NOT_PROVIDED` for
  27 EU territories. Final EU eligibility is not confirmed; no legal status
  or agreement was chosen or accepted by the agent.
- Polish description, subtitle, keywords, promo text, support/privacy/marketing
  URLs, copyright, Education/Weather categories, age questionnaire, content
  rights and private reviewer contact/notes are uploaded and read-back verified.
- All five screenshots are `COMPLETE`, in the intended order, 1320 x 2868.
  Apple's stored source checksums and byte counts match the committed PNGs.
- The final candidate is selected on version 1.0 and was reverified both
  before submission and in the post-submit read-back.
- Final build is `IN_BETA_TESTING` in the existing internal group. Owner
  membership is verified; Polish and English release notes are attached.
  External state is still `READY_FOR_BETA_SUBMISSION`; no external promotion.
- The initial draft-item request failed with `APP_DATA_USAGES_REQUIRED`:
  saved privacy answers had not been published. The owner then confirmed
  completing Publish. Apple's retry accepted the item without changing
  declarations through the API. A policy URL alone was insufficient.
- Final submission: `48f55907-6f36-4ea6-9874-7f169a1f9382`, submitted at
  `2026-08-27T05:34:49.427Z`. Exactly one item references version 1.0 and
  build `20260826214336`. Both submission and version are `WAITING_FOR_REVIEW`.
- The submitted request changed only `submitted: true` on that existing
  draft. App/bundle/build, item scope, fresh metadata/screenshot verification,
  private reviewer details and free pricing were checked before the write.
- Existing `AFTER_APPROVAL` release mode remains. Apple approval and an
  actual public store listing are not yet verified. Submission evidence:
  `build/app-store-review-submission.json`; no external beta changes.

## Web Delivery

- Live support: https://jakiesluchawki.github.io/chmurnik/support.html
- Live privacy: https://jakiesluchawki.github.io/chmurnik/privacy.html
- Both standalone pages return HTTP 200 with the correct content. The full
  public-browser flow passes on GitHub Pages, including responsive routes,
  saved observations/backups, METAR/TAF, wind, training, lessons and sources.
- Code deployment succeeded: https://github.com/jakiesluchawki/chmurnik/actions/runs/33017613184
- Cyber_Folks ZIP: `release/chmurnik-cyberfolks-20260826214336-app-store.zip`.
- SHA-256: `545a5299746bba27a32f9297b0270dd1054cd6366fe44bef5f06ed58a1745ea2`.
- `unzip -tq` passes. The archive contains the final root build, including
  `.htaccess`, support and privacy. No hosting settings, DNS or other domains
  were changed. Cyber_Folks remains the owner's manual domain-scoped upload.

## Owner Handoff

See `app-store-owner-steps-pl.md` for phone-friendly instructions. The requested
submission is now sent. Apple review and final EU eligibility remain pending;
do not present either as approved or the app as publicly available.

The owner was given the exact TestFlight build and phone-only instructions.
On 2026-08-27 the owner replied "3 - done" to the requested iPhone checklist.
Record the short camera/library/save/reopen acceptance as owner-reported;
device/iOS details and the broader matrix are not supplied by that response.
The owner subsequently handled the account formalities and confirmed privacy
publication. Their latest screenshot shows the free agreement active and DSA
under review; the API now accepts the app submission. The broader physical
matrix remains open in task 0032; the short owner reply does not prove every
hardware/OS combination or accessibility case. No legal terms or trader
declarations were selected for the owner, and no private contact details are
included in this evidence.
