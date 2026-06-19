---
id: "0020"
title: "Launch chmurnik.cloud"
type: FEATURE
status: completed
related_adr: []
related_tasks: ["0017"]
tags: ["priority-high", "deployment", "github-pages", "dns", "pwa"]
links:
  - "https://chmurnik.cloud"
  - "https://github.com/jakiesluchawki/chmurnik"
history:
  - date: "2026-06-18"
    status: active
    who: codex
    note: >
      Started after the product owner registered chmurnik.cloud at OVH and
      authorized the production-domain launch.
  - date: "2026-06-19"
    status: completed
    who: codex
    note: >
      Launched the apex and www domains with enforced HTTPS. Verification:
      66 tests, lesson audit, production build, live DNS and redirect checks,
      PWA asset checks, licensed-font checks, and a clean browser console.
---

# Launch chmurnik.cloud

## Summary

Move the public Chmurnik installation from the GitHub project subpath to the
new first-party domain, preserving the PWA, offline shell, and legacy Pages URL.

## Acceptance Criteria

- [x] The application build targets the domain root rather than `/chmurnik/`.
- [x] The PWA manifest and offline shell use root-relative scope and assets.
- [x] GitHub Pages is configured for `chmurnik.cloud`.
- [x] OVH DNS resolves the apex and `www` hostname to GitHub Pages.
- [x] HTTPS is issued and enforced for the custom domain.
- [x] The legacy GitHub Pages URL redirects to the custom domain.
- [x] Tests, audits, production build, and live smoke checks pass.

## Implementation Notes

- Keep GitHub Actions as the deployment source.
- Add the custom domain through both the Pages configuration and the deployed
  `CNAME` file so subsequent builds preserve it.
- The apex uses the four documented GitHub Pages A and AAAA records; `www`
  aliases `jakiesluchawki.github.io` and redirects to the apex.
- The OVH Zimbra MX and SPF records were preserved unchanged.
- The live PWA uses root scope, cache version `chmurnik-v5`, and the purchased
  Romie and Roobert font files over HTTPS.

## Design Decisions

### From Plan

1. **Use the apex as canonical:** `chmurnik.cloud` is the public product name;
   `www.chmurnik.cloud` should resolve as an alias rather than a separate site.

### Emerged

2. **Edit web records individually:** OVH's text importer did not make its
   replacement semantics sufficiently clear. Individual record operations
   avoided any risk to the newly provisioned Zimbra configuration.

3. **Restart stalled certificate provisioning:** GitHub's certificate field
   remained empty for several hours despite a valid health check. Removing and
   immediately re-adding the custom domain, as documented by GitHub, restarted
   the job and produced an approved Let's Encrypt certificate.

## Issues Encountered

- OVH was still provisioning the domain and DNS zone when implementation began.
- OVH's default parking A record remained visible until its original one-hour
  TTL expired, even after the control panel showed the replacement records.
- The first GitHub certificate job stalled with `https_certificate: null`.
  A controlled domain remove/re-add changed the state to `new`, then `approved`.

## Broken/Modified Tests

- Updated the foundation contracts for the root Vite base, root PWA scope,
  `CNAME`, service-worker cache version, and domain-root font paths.
- Final verification passed all 66 tests, the nine-module lesson audit,
  production build, live asset checks, redirects, and browser smoke tests.

## Future Work

None identified.
