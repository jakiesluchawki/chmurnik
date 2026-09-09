# Workshop Crosslink Integration Audit

Date: 2026-09-09. Read-only application audit; additions are this report and `tests/workshop-crosslinks.test.mjs`. No application href needed correction. No entry/router edits, build, browser, native execution, deployment or commit.

## Findings

**No broken reachable crosslink was found in the inspected sources and existing packages.** All 14 catalog links retain the explicit workshop document, select the expected component and return to a valid lesson under root web, Pages, Capacitor and a web subdirectory.

**Keep the query-only Wind continuation unchanged.** The completed Wind case uses `?from=wiatr#bryza` in `weather-preview/learning/WindWorkshop.jsx:146`. Starting at the packaged document, its resolved native URL is:

```text
capacitor://localhost/pogoda-preview/index.html?from=wiatr#bryza
```

The current file path is retained; only query and fragment change. The preview router selects `FoundationWorkshop` with `id="bryza"`. The lesson return resolves to:

```text
capacitor://localhost/#/learn/wiatr
```

This also holds for the equivalent root-web and `/chmurnik/` Pages document. The continuation intentionally chooses the wind lesson even if Wind was entered with another valid `from` value.

**Regression boundary, not a current defect:** replacing that href with `./?from=wiatr#bryza` would drop `index.html`. Capacitor's extensionless-path fallback then serves the root application, not the workshop document. The existing app entry helper already avoids this by generating `pogoda-preview/index.html` explicitly. Do not normalize query-only catalog/cross-workshop links into directory links.

## Route Matrix

Each row was checked across five deployment contexts: root HTTPS, Pages `/chmurnik/`, `capacitor://localhost/`, Capacitor entered through root `index.html` with `./` base, and an HTTPS `/app/` deployment.

| Fragment | Selected component | Default return lesson |
| --- | --- | --- |
| `#bryza` | FoundationWorkshop | wiatr |
| `#chmura` | FoundationWorkshop | procesy |
| `#mgla` | FoundationWorkshop | procesy |
| `#obserwacja` | LearningStudio | obserwacja |
| `#rodziny` | LearningStudio | rodziny |
| `#front` | LearningStudio | fronty |
| `#wiatr` | WindWorkshop | wiatr |
| `#metar` | LearningStudio | lotnictwo |
| `#wysokosc` | LearningStudio | warstwy |
| `#sondaz` | SoundingWorkshop | warstwy |
| `#oblodzenie` | LearningStudio | zagrozenia |
| `#turbulencja` | TurbulenceWorkshop | zagrozenia |
| `#burza` | StormWorkshop | zagrozenia |
| `#nazwy` | LearningStudio | ekspert |

- `#pracownia` retains the current explicit document and selects the catalog.
- Actual catalog markup provides exactly these 14 targets. The nine main-lesson entry mappings reach them all.
- Component href expressions retain the deployment's protocol, host and app directory. Lesson/tool fragments use the root app's `#/learn/...` and `#/layers/...` convention, not preview fragments.
- Every recognized `from` lesson is accepted; external URLs, protocol-relative hosts, JavaScript schemes, path traversal and prototype-like values fall back to the workshop's default lesson. `from` is not an arbitrary return URL.
- `mainSite` derives `../` from bundled `/pogoda-preview/` URLs, so native returns remain local. A standalone development preview outside that path intentionally returns to the fixed external Pages app. External scientific references remain external; no remote availability check was performed.

## Capacitor Evidence

The installed primary implementation was read, not executed or modified:

- `node_modules/@capacitor/ios/Capacitor/Capacitor/WebViewAssetHandler.swift`: reads `url.path` and passes that path to the router. Query and hash are not part of the asset filename.
- `node_modules/@capacitor/ios/Capacitor/Capacitor/Router.swift`: an extensionless path maps to the root `index.html`; a path with an extension is appended to the asset base. This distinguishes valid `/pogoda-preview/index.html` from a directory-only request.
- `node_modules/@capacitor/ios/Capacitor/Capacitor/WebViewDelegationHandler.swift`: recognizes the configured local application URL and allows its navigation. External top-level URLs are handed to the system. Current `capacitor.config.ts` does not override navigation hosts or configure a remote server.

Custom-scheme URL tests compare protocol and host separately: WHATWG `URL.origin` is `"null"` for Capacitor and would be an inadequate origin comparison by itself.

## Asset Audit

The preview has `base: "./"` and no HTML `<base>` override. Generated assets remain relative. Existing compiled CSS points to packaged hashed fonts, not the source `../public/fonts/` locations. Lazy module/CSS references are resolved from their module; diagram/photo paths are resolved from the workshop document.

Read-only inspection of the current packages found:

| Existing directory | Files | Copied artwork/photo files checked | HTML/module/CSS/image references checked |
| --- | ---: | ---: | ---: |
| `build/weather-bundle` | 49 | 32 | 72 |
| `dist/pogoda-preview` | 50 | 32 | 72 |
| `ios/App/App/public/pogoda-preview` | 50 | 32 | 72 |

All checked references resolve to local files under the workshop directory in all five URL contexts. All 32 illustration/photo copies match their original source bytes, including transfer-photo aliases. Packaged manifest file hashes also match. Both images and fonts are checked; a successful entry-document lookup alone is not treated as an asset pass.

At the final test snapshot, all three entry documents had SHA256:

```text
d8b6b2de0b65510ba8f63beca9e11d5b1a6aa7f9434c1acc1efe6c6ec194b273
```

Their script was `./assets/index-Baqho_ke.js`. The parent was actively updating packages; this is a point-in-time filesystem observation, not a claim that these filenames remain current or were deployed.

## Tests and Limits

```sh
node --test tests/workshop-crosslinks.test.mjs tests/weather-tutorial.test.mjs
```

Result: **35/35 passed**, including **25/25 new crosslink tests**; no skips. The new file parses actual JSX/JS using TypeScript, renders the actual catalog functions with React SSR, evaluates the existing route and href expressions, parses existing CSS, and reads already generated packages. It does not invoke Vite/esbuild builds, write packaged assets, start a server, run a browser, or load the application entry into a browser. On a clean checkout without generated packages, the three package-inspection tests explicitly skip instead of creating artifacts.

This verifies URL resolution, route selection and available resource paths, not real WKWebView navigation, plugin lifecycle after navigation, browser history, offline service-worker behavior, iOS touch operation or remote HTTP status. Those runtime/release checks remain with the parent. No integration blocker or href fix was identified by this bounded audit.
