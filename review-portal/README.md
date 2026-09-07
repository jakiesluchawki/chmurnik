# Consultation Portal

Authorized 2026-09-06: three independent reviewers on CyberFolks, with a public
GitHub Pages introduction. This is a handoff of 33 existing IMGW development
photos, not new model research or an independent accuracy benchmark.

## Distribution

- `entry/`: public introduction only, copied by Pages to `/chmurnik/ocena/`.
- `site/`: PHP 8.1+ application installed separately at `chmurnik.cloud/ocena/`.
- `build.py`: builds the private installation ZIP under `.local/review-portal/`.
  Requires the previously prepared `.local/v4/consultation-20260907` materials.
  Generates passwords once, then reuses them. Never commit or publicly release
  the credentials, compiled materials, private ZIP, or response storage.

Run `python3 review-portal/build.py` for production or add `--qa` for the isolated
localhost install. The QA configuration must never be installed in production.
The public Pages workflow cannot build or publish the private portal.

For an existing installation, use `python3 review-portal/build.py --update-only`.
The six-file ZIP in `build/review-portal-update/` contains application code and
instructions only: no credentials, photos, private configuration or storage.
Back up the deployed folder privately, then overlay the ZIP without deleting
the existing `ocena` directory. This mode does not regenerate password hashes.

## Context Update, September 7

Optional `level` and `contextLimits` fields distinguish genus identification
from level assessment. No level is inferred from a genus. An omitted legacy
field remains absent in existing records and is preserved on old-client saves;
an explicit empty value clears only that optional field. Counts still describe
genus assessments, not completed level assessments. Submitted snapshots stay
immutable, including responses created before these fields existed.

R001-R033 photo bytes and IDs remain unchanged. A future wide-frame/detail
series must get new identifiers and provenance; do not replace images beneath
existing annotations. Use authentic matching views from the same observation,
preserving full frames, source resolution, licensing, and any known capture
metadata. Never synthesize missing terrain. Higher resolution alone does not
restore an absent horizon. New photographs are not included in this update.

## Data And Access

Three reviewer accounts plus an owner-only coordinator. Passwords are salted
PBKDF2-SHA256 hashes (600,000 iterations), with IP/account login throttling.
Sessions use hashed random tokens and HttpOnly/Secure/SameSite cookies. All
private reads and writes use same-origin POST, custom request header and CSRF
protection. This is intentional: the parent application's existing service
worker caches successful GETs, even with `no-store` headers.

Each account saves only its own answers. Revisions reject stale-tab writes;
atomic file replacement under a separate lock protects concurrent updates.
The first submission is frozen before source labels/report become available.
Missing answers remain missing. The coordinator can inspect/export all answers.

Private PHP files have executable guards plus a deny-all `.htaccess`. There are
no publicly served JSON/image files, credentials in client JS, third-party
analytics or automatic model training. The code assumes an HTTPS PHP-enabled
host; verify that private PHP URLs return 403/404 after upload.

Back up `_private/storage.php` privately. Never delete it during an update.
The ZIP uses an explicit allowlist and never includes existing response files.
To revoke/reset an account, change its entry in private credentials, rebuild,
replace config, and invalidate that user's sessions in a planned maintenance
operation. Password reset is not exposed publicly in this small closed pilot.

## QA

`check-api.mjs` and `check-browser.mjs` use only the disposable local QA install,
resetting its test responses. Do not point them at production.
Serve `.local/review-portal/qa-root` with PHP on `127.0.0.1:18973`, then run both.
The browser script uses the bundled Playwright runtime. API tests cover account
isolation, CSRF/origin, report locking, frozen responses, stale revisions,
image bytes, role checks and login throttling. Browser tests cover 33 images,
mobile/desktop sizing, autosave/reload, isolated accounts, PHP-file guards and
escaped notes. Results/screenshots remain in ignored `build/review-portal-qa/`.

Local QA is not a claim of successful CyberFolks installation. After upload,
check HTTPS, PHP execution, login/cookies, private-file denial and persistence.

For the legacy-record check, stop the disposable PHP server, run
`node review-portal/check-legacy.mjs --seed`, restart it and run
`node review-portal/check-legacy.mjs`. The WASM runtime snapshots mounted files,
so do not seed while it is running. This test preserves a v1 frozen response
exactly, without inventing optional context fields or allowing edits.
