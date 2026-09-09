# Workshop Production Integration

Date: 2026-09-09. Scoped integration is ready for the parent's coordinated build.

## Implemented

- All nine lessons reach their existing 14 shared workshops on root-domain,
  Pages and native builds. No copied workshop implementation inside App.
- Lesson and Warstwy links use the local `pogoda-preview/index.html` with
  `?from=<lesson>#<workshop>`; the catalog uses `#pracownia`.
- Explicit `index.html` is required by the installed Capacitor iOS Router:
  extensionless paths otherwise resolve to the main app's index. Same-local-URL
  navigation is permitted by its WebView delegation handler.
- The parent's `new URL('../', location.href)` mainSite already returns to the
  correct root for explicit-index web/Pages/Capacitor URLs. No router edit needed.
- Wind entry reads "Odczytaj ruch chmur i kierunek wiatru", without promising
  a speed comparison. METAR entry no longer promises an editable cloud layer.
- Existing lesson chapter persistence, progress, photo storage, native Warstwy
  tab and daily-answer concealment logic are unchanged.

## Build Contract

- `npm run weather:bundle` builds the shared weather app into the separate
  staging directory `build/weather-bundle`, not the parent's preview directory.
- `prebuild` and `prebuild:pages` stage it before their respective main builds.
  Existing `ios:sync` reaches the same sequence via `npm run build` before sync.
  There is no recursive build or build launched by a Vite hook.
- `bundledWorkshops()` emits every staged file at `dist/pogoda-preview/`, plus
  a deterministic SHA-256 manifest. Missing/incomplete bundles and symlinks fail;
  staging inside the main output directory is rejected before output cleanup.
- Main development middleware serves this same staged bundle locally. It does
  not rebuild it automatically; a missing staged resource returns an explicit 503.
- Main offline manifest includes every workshop resource, including lazy chunks,
  photos and fonts. Workshop byte changes invalidate its cache version, even
  when filenames are unchanged. Atlas hashing/consent/migration stays intact.
- Generated service-worker navigation falls back to the workshop's own cached
  HTML for query-bearing workshop URLs; main navigation retains its own fallback.
  The source worker template was not edited.
- Web release script checks nested entry and manifest before root ZIP creation
  and after the Pages build. No release script was executed in this task.

## Verified Evidence

- Focused integration, tutorial, expansion, offline, discovery and native-home
  regressions: **56/56 passed**.
- Complete `npm test`: **817 passed, 0 failed, 3 TODO, exit 0** (820 total).
  TODOs are existing legacy Scenes interpretation leaks for height, front and
  METAR in `tests/guide-probes-review.test.mjs`; they are not verified fixes.
- The three obsolete Pages-only assertions were replaced in the two explicitly
  authorized existing test files. Each platform must independently reach all14,
  stay on its own scheme/host, use explicit HTML and return to its source lesson.
  Invalid lessons/external bases remain rejected; other regressions are unchanged.
- New tests cover actual lesson/Warstwy SSR, storage non-mutation, native router
  behavior, byte-identical emission, stable manifests, offline navigation,
  photo-driven cache invalidation, fail-closed staging and build orchestration.
- Fresh shared workshop, root and Pages Vite builds all passed after final edits.
  Outputs are isolated under `/tmp/chmurnik-workshop-integration.vqtEE9/`:
  `workshops-final`, `root-final`, `pages-final`. No shared `dist` or
  `build/weather-preview` was overwritten by these verification builds.
- In both final main builds all **49 payload files (8,126,896 bytes)** match their
  manifest hashes; the generated manifest is one additional file. All **67**
  offline shell entries and the entry HTML's local asset references exist.
- Standard npm prehook wiring was regression-tested; isolated builds exercised
  the real subbuild/main-build sequence using `CHMURNIK_WORKSHOP_BUNDLE` to select
  the temporary staging directory. Capacitor sync was not executed.

## Parent-Owned Remainder

- Remove the obsolete `weather:build` and subsequent
  `cp -R build/weather-preview dist/pogoda-preview` steps in
  `.github/workflows/deploy-pages.yml`. `build:pages` now includes that directory;
  the old copy can introduce a redundant nested `weather-preview` directory.
- Parent owns packaged iPhone/iPad/macOS UI and offline roundtrip verification,
  including safe areas, touches, same-chapter return and stored photo workflows.
  SSR/URL/native-source checks do not establish those physical UI results.
- This adds approximately 8.13 MB of workshop resources to the local/offline
  payload. No claim of native test, signing, store submission or publication.
- No cap sync, native build, archive production, signing, upload or git action
  was performed. No known integration-code blocker remains from these checks.

## Changed Files

- `src/App.jsx`
- `src/lib/weather-lesson-links.js`
- `vite.config.mjs`
- `package.json`
- `scripts/build-web-release.sh`
- `tests/workshop-production-integration.test.mjs` (new)
- `tests/weather-tutorial.test.mjs` (three obsolete-contract boundaries in total
  across this file and the next; all other test cases retained)
- `tests/learning-expansion.test.mjs`
- `design/workshop-expansion-20260909/integration.md` (new)
