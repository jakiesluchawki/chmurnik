---
id: "0020"
title: "Launch chmurnik.cloud"
type: FEATURE
status: active
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
---

# Launch chmurnik.cloud

## Summary

Move the public Chmurnik installation from the GitHub project subpath to the
new first-party domain, preserving the PWA, offline shell, and legacy Pages URL.

## Acceptance Criteria

- [ ] The application build targets the domain root rather than `/chmurnik/`.
- [ ] The PWA manifest and offline shell use root-relative scope and assets.
- [ ] GitHub Pages is configured for `chmurnik.cloud`.
- [ ] OVH DNS resolves the apex and `www` hostname to GitHub Pages.
- [ ] HTTPS is issued and enforced for the custom domain.
- [ ] The legacy GitHub Pages URL redirects to the custom domain.
- [ ] Tests, audits, production build, and live smoke checks pass.

## Implementation Notes

- Keep GitHub Actions as the deployment source.
- Add the custom domain through both the Pages configuration and the deployed
  `CNAME` file so subsequent builds preserve it.

## Design Decisions

### From Plan

1. **Use the apex as canonical:** `chmurnik.cloud` is the public product name;
   `www.chmurnik.cloud` should resolve as an alias rather than a separate site.

## Issues Encountered

- OVH was still provisioning the domain and DNS zone when implementation began.

## Broken/Modified Tests

- Pending implementation.

## Future Work

None identified.
