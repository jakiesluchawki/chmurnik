---
id: "0023"
title: "Harden production response headers"
type: FEATURE
status: active
related_adr: []
related_tasks: ["0020"]
tags: ["priority-high", "security", "hosting", "cyberfolks", "github-pages"]
links:
  - "https://chmurnik.cloud"
  - "https://securityheaders.com/?q=https%3A%2F%2Fchmurnik.cloud%2F&hide=on&followRedirects=on"
history:
  - date: "2026-06-20"
    status: active
    who: codex
    note: >
      Started production header hardening while preserving the existing
      GitHub Pages deployment as an independently working fallback URL.
---

# Harden production response headers

## Summary

Serve `chmurnik.cloud` from a host that supports controlled HTTP response
headers, while keeping `jakiesluchawki.github.io/chmurnik/` operational.

## Acceptance Criteria

- [ ] The custom domain returns CSP, HSTS, MIME-sniffing, framing, referrer,
      permissions, and cross-origin isolation headers.
- [ ] The production application remains visually and functionally intact.
- [ ] `https://jakiesluchawki.github.io/chmurnik/` remains independently usable.
- [ ] Both root and subpath builds are covered by automated tests.
- [ ] The custom-domain DNS, TLS, redirects, and public response headers are verified.

## Implementation Notes

- Added an Apache `.htaccess` production configuration with CSP, HSTS,
  MIME-sniffing, framing, referrer, permissions, opener, and resource-policy
  headers for the existing Cyber_Folks shared hosting.
- Added separate root and `/chmurnik/` build targets. Font, JavaScript, CSS,
  manifest, and service-worker requests return `200` in the subpath preview.
- Changed the PWA manifest and service worker to derive their scope from the
  deployment URL instead of assuming the domain root.
- Removed the repository CNAME artifact so GitHub Pages can become an
  independent fallback after the custom domain moves to Netlify.

## Design Decisions

### From Plan

1. **Keep both public addresses:** The custom domain is the primary address,
   while GitHub Pages remains a working fallback and deployment channel.

### Emerged

2. **Use environment-specific Vite bases:** Cyber_Folks builds at `/`; GitHub
   Actions builds with `CHMURNIK_BASE_PATH=/chmurnik/`. This preserves one
   source tree without runtime host detection.
3. **Keep the PWA scope relative:** Relative manifest and service-worker paths
   allow installation and offline caching from either public address.

## Issues Encountered

- GitHub Pages does not support repository-defined custom response headers;
  a `_headers` file would be served as inert content rather than configuration.
- The Netlify connector timed out while listing and creating projects. A
  validated anonymous deploy was created for technical testing, but the owner
  chose the already-paid Cyber_Folks hosting to avoid Netlify transfer limits.

## Broken/Modified Tests

- Updated foundation tests for dual-host base paths, relative PWA scope, the
  GitHub Pages build command, and the complete Netlify header policy.

## Future Work

None identified.
