---
id: "0017"
title: "Publish CHMURNIK under its own Pages address"
type: FEATURE
status: active
related_adr: []
related_tasks: ["0015", "0016"]
tags: ["priority-high", "deployment", "github-pages", "pwa"]
links:
  - "https://github.com/jakiesluchawki/chmurnik"
  - "https://jakiesluchawki.github.io/chmurnik/"
history:
  - date: "2026-06-16"
    status: active
    who: codex
    note: >
      Started after the product owner requested a public CHMURNIK address
      before registering a custom domain.
---

# Publish CHMURNIK under its own Pages address

## Summary

Create a separate public repository and GitHub Pages deployment at
`/chmurnik/` while preserving the existing `/cloud-recognition/` installation.

## Acceptance Criteria

- [x] The application builds with `/chmurnik/` as its public base path.
- [x] The PWA manifest and service worker use the new Pages scope.
- [x] Romie, Roobert, the wordmark, and visual assets load from the new path.
- [x] The repository link and current project documentation point to CHMURNIK.
- [x] Existing browser learning data remains compatible.
- [x] Automated tests, lesson audit, link audit, and production build pass.
- [ ] The public repository and GitHub Pages deployment are available.

## Implementation Notes

- Vite, PWA manifest, service worker, CSS asset URLs, tests, package metadata,
  footer repository link, README, and project wiki now target `chmurnik`.
- The distribution contains all four licensed Romie/Roobert files, the
  CHMURNIK wordmark, and the three atmospheric still-life assets.
- Validation passed: 60 unit/contract tests, 9 lesson modules, 52 external
  links, and the Vite production build.

## Design Decisions

### From Plan

1. **Create a copy instead of renaming:** Keep the established URL operational
   while introducing the product-facing CHMURNIK address.

### Emerged

2. **Preserve storage keys:** Both project sites share the
   `jakiesluchawki.github.io` origin, so retaining the existing local storage
   keys carries learning progress into the new path.

3. **Namespace PWA cache cleanup:** The CHMURNIK service worker removes only
   caches beginning with `chmurnik-`, preventing it from deleting the legacy
   installation's offline cache.

## Issues Encountered

- `npm ci` encountered an npm CLI failure: `Exit handler never called`.
  Dependencies are identical to the verified source worktree, so its
  `node_modules` directory was synchronized and all project checks then passed.

## Broken/Modified Tests

- `tests/foundation.test.mjs` now asserts the `/chmurnik/` base and PWA scope.
- Added a cache namespace assertion so the new worker cannot remove the legacy
  installation's cache.

## Future Work

None.
