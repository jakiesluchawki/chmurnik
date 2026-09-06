# Offline Upgrade Preservation

## Reproduced Defect

The actual September3 root package upgraded to the published September6
7a1d618 root package loses all30 explicitly downloaded atlas photographs.
The original observation, photograph Blob, note, favorite flag, IndexedDB
metadata and localStorage survive exactly. This is a cache-activation bug,
not loss of the user's private photograph or evidence of a classifier defect.
The negative receipt is `build/v4-offline-upgrade-before/report.json`.

## Patch

Activation carries forward only already-cached atlas photographs whose SHA256
matches the new build's actual photograph bytes. It downloads nothing and
does not copy old application code or arbitrary/private cached files. It only
removes previous CHMURNIK caches containing this worker's own URL-scope entry.
All copies finish before deletion; a failed copy retains the previous caches.
No IndexedDB format, privacy policy, classifier or API is changed.

The build generates the30-photo hash map, fails closed on missing markers,
and includes worker source and photograph hashes in its cache-version identity.
Source-only worker changes now invalidate the cache even with unchanged JS/CSS.
The wordmark and italic WOFF2 join the offline shell after WebKit exposed their
absence during an offline reload. Atlas pre-download remains explicit.

## Verification

The reusable `scripts/check-offline-upgrade.mjs` uses isolated temporary
profiles, real release folders and their actual Apache security headers.
It creates an observation through the UI, downloads the atlas explicitly,
checks the old release offline, installs the waiting update, disconnects
before accepting it, then checks the new offline UI and exact stored data.
All30 atlas responses must match the actual new release SHA256s.

| Baseline | Browser / Offline Method | Result |
| --- | --- | --- |
| September3 root | Chromium private, browser offline | PASS |
| September6 root 7a1d618 | Chromium private, browser offline | PASS |
| September3 root | WebKit persistent QA profile, server disconnect | PASS |

Reports are respectively under
`build/v4-offline-preservation-chromium-http/`,
`build/v4-offline-preservation-current-chromium/`, and
`build/v4-offline-preservation-webkit/`. All preserve exact storage and30/30
photographs, including acceptance while disconnected. Candidate page errors
are empty. The WebKit baseline errors describe missing old logo/font assets;
these are retained separately, not erased from the evidence.

The final root directory is `build/v4-offline-preservation-final/`:

- HTML SHA256: `265a00d215a24a841005fffa9f301817d2689ef3e1d231ae4de35d0dc00c7936`
- Worker SHA256: `8496605d82a0ce6c6147bfb78c741d5d63de3785fea70a755cf6c1fc00f0c1ad`
- Cache: `chmurnik-c5f554064841`
- Entry: `index-De1I22Bw.js`; CSS: `index-CNpHOjaI.css`

All279 project JS tests pass, zero skips; nine lessons pass their quality
contract. Six added regression tests cover verified migration, changed or
unmanifested photographs, other scopes, copy failure, deterministic build
identity and broken templates. The full production browser harness passes
42 route/viewport visits plus observation/photo/backup, lessons, atlas,
METAR/TAF, wind and maps. It now accepts an immutable preview build directory.
Screenshots: `build/v4-offline-preservation-field-ui/`. Inspected mobile and
desktop home and the complete WebKit offline observation image.

An accidentally unscoped `node --test` also discovered eight unrelated
upstream Capacitor CLI test files inside ignored build sources; they failed
their missing-import setup. The declared project command
`node --test tests/*.test.mjs` was then run and passed279/279. No upstream
source or test expectation was changed to hide those invocation errors.

## Environment Limits And Negative Trials

The bundled WebKit private context cannot save an IndexedDB Blob, including
in an independent blank-page probe with no CHMURNIK code. A fresh persistent
QA profile passes Blob storage. The browser-offline API also fails an unchanged
old-release reload in WebKit; physically disconnecting the local test server
passes. These are recorded fixture limitations, not proof that current Safari
users have either defect. This is not a physical iPhone/Safari upgrade test.

WebKit used loopback HTTPS with a temporary self-signed certificate accepted
only in its isolated QA context. Chromium's equivalent TLS trial stalled on
certificate rejection before worker readiness; only that identified test
process was terminated. The harness now bounds initial worker readiness.
Chromium passed on secure-context loopback HTTP with the same package headers.
No host restart, system trust change, permissions change, real browser-profile
access or owner presence was required.

## Delivery Boundary

This patch cannot recover cached atlas files already deleted by an earlier
update without a new download. It protects future updates when cached copies
still exist. Browser storage eviction and disk exhaustion remain external
limits; user photo exports remain useful backups.

Both root and /chmurnik/ Pages builds pass the full production browser harness
with their actual output directory and security headers. The root ZIP contains
82 files at its root, including .htaccess; ZIP CRC checks pass. Its22,779,755
bytes have SHA256
`601efc438bb48883604264e1b0487bd1468e0eb7e7d4191cc91f74955208d1b2`.
At16:09:41 UTC the existing owner-only Drive ZIP was replaced in place, keeping
the same link, parent and permissions; connector readback verifies its name,
size and unshared state, but exposes no remote content checksum. The private
receipt is `.local/v4/web-delivery-offline-20260906.json`. Cyber_Folks upload
remains the owner's action; this new ZIP has not been verified on that domain.

Pages publication will be recorded after readback. Existing
Apple1.2 submissions are unchanged and do not contain this later web patch.
The previous verified dialog-focus source patch is included in the new web
bundle. All existing social assets remain outside this change. The overall
goal stays active: classifier qualification and other recorded deliverables
are not satisfied by this cache fix.
