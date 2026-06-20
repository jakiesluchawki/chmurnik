---
id: "0023"
title: "Harden production response headers"
type: FEATURE
status: completed
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
  - date: "2026-06-20"
    status: completed
    who: codex
    note: >
      Moved chmurnik.cloud to an isolated Cyber_Folks document root, issued a
      trusted Let's Encrypt certificate, and preserved GitHub Pages at its
      project URL. Verification covered 72 automated tests, two deployment
      bases, 10 changed files, public DNS and TLS, application assets, and an
      MDN HTTP Observatory A+ score of 120/120.
---

# Harden production response headers

## Summary

Serve `chmurnik.cloud` from a host that supports controlled HTTP response
headers, while keeping `jakiesluchawki.github.io/chmurnik/` operational.

## Acceptance Criteria

- [x] The custom domain returns CSP, HSTS, MIME-sniffing, framing, referrer,
      permissions, and cross-origin isolation headers.
- [x] The production application remains visually and functionally intact.
- [x] `https://jakiesluchawki.github.io/chmurnik/` remains independently usable.
- [x] Both root and subpath builds are covered by automated tests.
- [x] The custom-domain DNS, TLS, redirects, and public response headers are verified.

## Implementation Notes

- Added an Apache `.htaccess` production configuration with CSP, HSTS,
  MIME-sniffing, framing, referrer, permissions, opener, and resource-policy
  headers for the existing Cyber_Folks shared hosting.
- Added separate root and `/chmurnik/` build targets. Font, JavaScript, CSS,
  manifest, and service-worker requests return `200` in the subpath preview.
- Changed the PWA manifest and service worker to derive their scope from the
  deployment URL instead of assuming the domain root.
- Removed the repository CNAME artifact so GitHub Pages can become an
  independent fallback after the custom domain moved to Cyber_Folks.
- Added short-lived caching for the application shell, manifest, and service
  worker while preserving immutable caching for versioned JavaScript and CSS.
- Deployed the root build to the isolated
  `domains/chmurnik.cloud/public_html` directory, issued a Let's Encrypt
  certificate for the apex and `www`, and redirected HTTP and `www` to the
  canonical HTTPS apex.
- Updated OVH DNS to `A 195.78.67.50`, removed the obsolete GitHub Pages AAAA
  records, and changed `www` to a CNAME of `chmurnik.cloud` without altering
  NS, MX, SPF, or FTP records.
- Published the subpath build through GitHub Actions and removed the Pages
  custom-domain setting after the new host was live.

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
4. **Preserve the existing DNS authority and mail:** Only web-facing A, AAAA,
   and `www` records changed at OVH. Moving nameservers would have needlessly
   increased the blast radius for mail and unrelated DNS records.
5. **Deploy to an isolated document root:** Domain separation and the dedicated
   `domains/chmurnik.cloud/public_html` directory prevent changes from touching
   `zgrywastudio.com` or its files.

## Issues Encountered

- GitHub Pages does not support repository-defined custom response headers;
  a `_headers` file would be served as inert content rather than configuration.
- The Netlify connector timed out while listing and creating projects. A
  validated anonymous deploy was created for technical testing, but the owner
  chose the already-paid Cyber_Folks hosting to avoid Netlify transfer limits.
- OVH's text-mode zone import updated the management view before all
  authoritative nodes served the new A record. Re-saving the apex A record
  with a 60-second TTL forced consistent publication without changing mail or
  nameserver records.
- The first hosting check revealed that the generic JavaScript cache rule also
  covered the service worker. A more specific no-cache rule now overrides it
  for `index.html`, the manifest, and `service-worker.js`.

## Broken/Modified Tests

- Updated foundation tests for dual-host base paths, relative PWA scope, the
  GitHub Pages build command, the complete Apache header policy, and fresh
  application-shell caching.

## Future Work

None identified.
