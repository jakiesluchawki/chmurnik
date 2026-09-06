# Daily Answer Concealment: September 6

Published as2ed1e58 on GitHub Pages. Workflow34051522326 succeeded:
https://github.com/jakiesluchawki/chmurnik/actions/runs/34051522326
Public readback matches all81 application files; all five gallery entry files
remain identical and18 social ZIPs remain available. The full browser harness
passes again against the public Pages URL, including conceal/reveal/hide and
follow-up training. Receipts: `build/v4-daily-answer-pages-live.json` and
`build/v4-daily-answer-pages-live-ui/`. Cyber_Folks still needs the owner's
new exercise ZIP upload; the previous offline ZIP upload was verified below.

The owner reported that the daily exercise concealed the answer but disclosed
the genus in its adjacent training button. The real HomePage rendering test
reproduced the exact Stratocumulus leak before the fix. Render that targeted
action only after explicit reveal and remove it again when hiding the answer.
The photo alt text and caption remain neutral; no cloud content, model,
service-worker logic, privacy behavior or social assets changed.

All280 JS tests and nine lesson audits pass;61 source links respond successfully.
Both root and Pages production builds pass the full browser harness:42 route/
viewport visits each, observation/photo/backup flows, lessons, atlas, METAR/TAF,
wind and maps. The added daily test checks learner-facing and accessible labels,
conceal/reveal/hide, aria-expanded and opening the follow-up recognition test.
Inspected the concealed daily card and desktop home screenshots. No JS/CSP
errors or horizontal overflow. Evidence: `build/v4-daily-answer-root-ui/` and
`build/v4-daily-answer-pages-ui/`. This is browser coverage, not a new Apple
binary, physical-device VoiceOver certification or a classifier upgrade.

Root entry: `index-DGckzKHS.js`; Pages entry: `index-BwGsoViE.js`.
Root ZIP: `build/CHMURNIK-WWW-V4-CYBERFOLKS-CWICZENIE-20260906.zip`,22,779,759
bytes, SHA256 `de4980fbfe9a81dc765d17c1d502d648065547bb57272dab92351454f9fe876e`.
CRC validation passes. At18:20:49UTC it replaced the existing private Drive ZIP;
metadata readback confirms name, size, same parent and owner-only permission.
No remote checksum is exposed by the connector. Root upload is the owner's
separate action; this newer exercise patch is not yet verified on Cyber_Folks.

## Owner's Previous Upload Verified

At18:02:47UTC all81 public files on chmurnik.cloud matched the delivered offline
patch byte-for-byte, with correct security/cache headers and canonical
redirects. `.htaccess` is inaccessible publicly. The complete public browser
harness passes. See `build/v4-cyberfolks-offline-live-20260906-files.json` and
`build/v4-cyberfolks-offline-live-ui-20260906/`.

In a fresh isolated Chromium profile, explicit atlas download followed by an
offline reload succeeds. The HTML navigation comes from the service worker
with the expected bytes; all30 atlas images, the logo and italic font match
the release SHA256s offline. No page errors. This does not test an existing
owner profile or physical Safari. `offline-smoke.json` preserves the result.

An earlier probe tried fetch('/') rather than navigation and failed, although
the cached HTML existed. LiteSpeed supplies Vary headers; a diagnostic retained
that failure while verifying all32 actual asset fetches. The application does
not use fetch('/') for its HTML. The final smoke test checks the real offline
navigation response and its hash; no production cache rule was weakened to
make this diagnostic pass. The negative diagnostic remains recorded separately.
