import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

function relativeLuminance(hex) {
  const channels = hex
    .slice(1)
    .match(/.{2}/g)
    .map((channel) => Number.parseInt(channel, 16) / 255)
    .map((channel) => channel <= 0.03928
      ? channel / 12.92
      : ((channel + 0.055) / 1.055) ** 2.4);

  return (0.2126 * channels[0]) + (0.7152 * channels[1]) + (0.0722 * channels[2]);
}

function contrastRatio(first, second) {
  const luminances = [relativeLuminance(first), relativeLuminance(second)].sort((a, b) => b - a);
  return (luminances[0] + 0.05) / (luminances[1] + 0.05);
}

test("version 1 boundaries remain explicit", async () => {
  const product = await read("PRODUCT.md");

  assert.match(product, /No automatic cloud recognition/);
  assert.match(product, /No Windy integration/);
  assert.match(product, /No recorded or synthesized voice/);
});

test("the project records its visual source of truth", async () => {
  const design = await read("DESIGN.md");

  assert.match(design, /Atlas Swiatla/);
  assert.match(design, /design\/reference\/atlas-swiatla-mobile\.png/);
});

test("hero copy and actions remain separate from the artwork", async () => {
  const app = await read("src/App.jsx");
  const redesign = await read("src/zgrywa.css");

  assert.ok(app.indexOf('className="hero-content"') < app.indexOf('className="hero-visual"'));
  assert.doesNotMatch(app, /Ilustracja dekoracyjna wygenerowana dla projektu/);
  assert.match(app, /\{validRoute !== "home" && \(\s*<button className="quick-test-button"/s);
  assert.match(redesign, /\.hero-visual\s*\{[^}]*margin: 34px auto 0/s);
  assert.match(redesign, /\.hero-image\s*\{[^}]*position: relative/s);
});

test("scientific cloud names stay intact in display text", async () => {
  const app = await read("src/App.jsx");
  const styles = await read("src/styles.css");

  assert.match(app, /function CloudName\(\{ children \}\)/);
  assert.match(app, /hipotezę „<CloudName>\{cloud\.name\}<\/CloudName>”/);
  assert.match(styles, /\.scientific-name\s*\{[^}]*white-space: nowrap/s);
  assert.match(styles, /\.scientific-name\s*\{[^}]*hyphens: none/s);
  assert.match(styles, /\.diagnostic-gallery__analysis h4\s*\{[^}]*text-wrap: pretty/s);
  assert.doesNotMatch(styles, /\.diagnostic-gallery__analysis h4\s*\{[^}]*overflow-wrap: anywhere/s);
});

test("the home atlas workshop uses a licensed noctilucent-cloud photograph", async () => {
  const app = await read("src/App.jsx");
  const sources = await read("src/data/sources.js");

  assert.match(app, /assets\/upper-atmosphere\/noctilucent-clouds-laboe\.jpg/);
  assert.match(app, /alt="Obłoki srebrzyste nad wodą w Laboe"/);
  assert.match(sources, /Noctilucent-clouds-msu-6817\.jpg/);
  assert.match(sources, /Matthias Süßen/);
  assert.match(sources, /CC BY-SA 4\.0/);
});

test("upper-atmosphere terms show licensed photographic evidence", async () => {
  const app = await read("src/App.jsx");
  const encyclopedia = await read("src/data/encyclopedia.js");

  assert.match(app, /className="term-detail-visual"/);
  assert.match(app, /Fot\. \{term\.image\.author\} · \{term\.image\.license\}/);
  assert.match(app, />Plik i licencja</);
  assert.match(encyclopedia, /assets\/upper-atmosphere\/nacreous-clouds-antarctica\.jpg/);
  assert.match(encyclopedia, /assets\/upper-atmosphere\/polar-stratospheric-cloud-type-i\.jpg/);
  assert.match(encyclopedia, /assets\/upper-atmosphere\/noctilucent-clouds-laboe\.jpg/);
});

test("responsive navigation and long scientific names stay bounded", async () => {
  const styles = await read("src/styles.css");
  const redesign = await read("src/zgrywa.css");

  assert.match(redesign, /\.mobile-menu\s*\{[^}]*max-height: calc\(100svh - 95px\)/s);
  assert.match(redesign, /\.mobile-menu\s*\{[^}]*overflow-y: auto/s);
  assert.match(
    redesign,
    /@media \(max-width: 640px\)\s*\{[^}]*\.menu-button,\s*\.mobile-menu\s*\{\s*display: none/s,
  );
  assert.match(
    redesign,
    /@media \(max-width: 900px\)\s*\{[^}]*\.atlas-search\s*\{\s*grid-template-columns: 1fr/s,
  );
  assert.match(styles, /\.diagnostic-gallery__analysis h4\s*\{[^}]*overflow-wrap: break-word/s);
  assert.match(styles, /\.detail-body h2\s*\{[^}]*overflow-wrap: break-word/s);
  assert.match(styles, /\.term-detail-heading h2\s*\{[^}]*overflow-wrap: break-word/s);
});

test("the public base path supports both the custom domain and GitHub Pages", async () => {
  const config = await read("vite.config.mjs");
  const packageJson = JSON.parse(await read("package.json"));
  const styles = await read("src/zgrywa.css");

  assert.match(config, /process\.env\.CHMURNIK_BASE_PATH \|\| "\/"/);
  assert.match(config, /base,/);
  assert.equal(packageJson.scripts["build:pages"], "CHMURNIK_BASE_PATH=/chmurnik/ vite build");
  assert.doesNotMatch(styles, /\/chmurnik\//);
  assert.match(styles, /url\("\/fonts\/Romie-Regular\.woff2"\) format\("woff2"\)/);
  assert.match(styles, /url\("\/fonts\/Roobert-Regular\.woff2"\) format\("woff2"\)/);
  assert.match(styles, /url\("\/fonts\/Romie-Regular\.otf"\)/);
  assert.match(styles, /url\("\/fonts\/Roobert-Regular\.otf"\)/);
});

test("the installable app and offline shell use the custom domain root", async () => {
  const index = await read("index.html");
  const manifest = JSON.parse(await read("public/manifest.webmanifest"));
  const worker = await read("public/service-worker.js");

  assert.match(index, /href="\.\/manifest\.webmanifest"/);
  assert.match(index, /rel="icon" type="image\/png" href="\.\/icons\/icon-192\.png"/);
  assert.match(index, /href="\.\/icons\/apple-touch-icon\.png"/);
  assert.equal(manifest.start_url, "./");
  assert.equal(manifest.scope, "./");
  assert.match(worker, /const BASE = new URL\("\.\/", self\.location\.href\)\.pathname/);
  assert.match(worker, /const CACHE_PREFIX = "chmurnik-"/);
  assert.match(worker, /chmurnik-\$\{CACHE_PREFIX\}v7|`\$\{CACHE_PREFIX\}v7`/);
  assert.match(worker, /assets\/upper-atmosphere\/nacreous-clouds-antarctica\.jpg/);
  assert.match(worker, /assets\/upper-atmosphere\/noctilucent-clouds-laboe\.jpg/);
  assert.match(worker, /assets\/upper-atmosphere\/polar-stratospheric-cloud-type-i\.jpg/);
  assert.match(worker, /key\.startsWith\(CACHE_PREFIX\)/);
});

test("GitHub Pages deployment runs tests before publishing", async () => {
  const workflow = await read(".github/workflows/deploy-pages.yml");

  assert.match(workflow, /npm test/);
  assert.match(workflow, /npm run check:lessons/);
  assert.match(workflow, /npm run build:pages/);
  assert.match(workflow, /actions\/deploy-pages@v4/);
  assert.match(workflow, /FORCE_JAVASCRIPT_ACTIONS_TO_NODE24/);
});

test("Netlify serves production security headers", async () => {
  const config = await read("netlify.toml");

  assert.match(config, /Content-Security-Policy = "default-src 'self';/);
  assert.match(config, /frame-ancestors 'none'/);
  assert.match(config, /object-src 'none'/);
  assert.match(config, /Strict-Transport-Security = "max-age=63072000; includeSubDomains; preload"/);
  assert.match(config, /X-Content-Type-Options = "nosniff"/);
  assert.match(config, /X-Frame-Options = "DENY"/);
  assert.match(config, /Referrer-Policy = "strict-origin-when-cross-origin"/);
  assert.match(config, /Permissions-Policy = "/);
  assert.match(config, /Cross-Origin-Opener-Policy = "same-origin"/);
  assert.match(config, /Cross-Origin-Resource-Policy = "same-origin"/);
});

test("npm configuration remains portable across local and CI machines", async () => {
  const npmrc = await read(".npmrc");

  assert.doesNotMatch(npmrc, /\/Users\//);
  assert.match(npmrc, /cache=\.npm-cache/);
});

test("small annotation colors meet WCAG AA against their surfaces", async () => {
  const styles = await read("src/zgrywa.css");
  const token = (name) => styles.match(new RegExp(`--${name}: (#[0-9a-f]{6})`))[1];
  const paper = token("paper");
  const white = token("white");

  assert.ok(contrastRatio(token("coral"), paper) >= 4.5);
  assert.ok(contrastRatio(token("coral"), white) >= 4.5);
  assert.ok(contrastRatio(token("ink"), paper) >= 4.5);
  assert.ok(contrastRatio(token("moss"), paper) >= 4.5);
  assert.ok(contrastRatio(token("muted"), paper) >= 4.5);
});

test("home media and licensed fonts use compact production formats", async () => {
  const app = await read("src/App.jsx");
  const styles = await read("src/zgrywa.css");
  const compactAssets = [
    "public/assets/atmosphere-still-life-1536.avif",
    "public/assets/convection-still-life-1280.avif",
    "public/assets/wind-profile-still-life-1280.avif",
    "public/assets/upper-atmosphere/noctilucent-clouds-laboe-1280.avif",
  ];

  assert.match(app, /<picture>/);
  assert.match(app, /type="image\/avif"/);
  assert.match(app, /type="image\/webp"/);
  assert.match(app, /loading="lazy"/);
  assert.match(styles, /Roobert-Regular\.woff2/);
  assert.match(styles, /Romie-Regular\.woff2/);

  for (const asset of compactAssets) {
    assert.ok((await stat(new URL(`../${asset}`, import.meta.url))).size < 150_000, `${asset} should stay below 150 KB`);
  }

  assert.ok(
    (await stat(new URL("../public/fonts/Roobert-Regular.woff2", import.meta.url))).size
      < (await stat(new URL("../public/fonts/Roobert-Regular.otf", import.meta.url))).size,
  );
});

test("polished controls expose selection and scroll affordances", async () => {
  const app = await read("src/App.jsx");
  const styles = await read("src/zgrywa.css");
  const tabletStyles = styles.slice(styles.indexOf("@media (max-width: 900px)"));

  assert.match(app, /aria-pressed=\{level === item\}/);
  assert.match(styles, /\.segmented-control,\s*\.filter-scroll\s*\{[^}]*scroll-snap-type: x proximity/s);
  assert.match(tabletStyles, /\.app-header,\s*\.app-shell:has\(\.page\) \.app-header\s*\{[^}]*height: 104px/s);
});

test("the recognition test is globally available and explains its methodology", async () => {
  const app = await read("src/App.jsx");

  assert.match(app, /className="quick-test-button"/);
  assert.match(app, /function RecognitionTest/);
  assert.match(app, /cztery prawdopodobne odpowiedzi/i);
  assert.match(app, /Dystraktory pochodzą z grup rzeczywiście mylonych wizualnie/);
  assert.match(app, /Każdy rodzaj jest ćwiczony na kilku niezależnych fotografiach/);
  assert.match(app, /Dowód w tym kadrze/);
  assert.match(app, /formatResultCount/);
});

test("cloud monographs teach visual variation through active recall", async () => {
  const app = await read("src/App.jsx");
  const styles = await read("src/styles.css");

  assert.match(app, /function DiagnosticPhotoGallery/);
  assert.match(app, /Ten sam rodzaj nie zawsze wygląda tak samo/);
  assert.match(app, /Najpierw obserwacja/);
  assert.match(app, /Pokaż analizę/);
  assert.match(app, /Co rozstrzyga/);
  assert.match(app, /cloud\.images\.map/);
  assert.match(app, /setRevealed\(false\)/);
  assert.match(app, /aria-label="Poprzedni kadr"/);
  assert.match(app, /aria-label="Następny kadr"/);
  assert.match(app, /aria-pressed=\{index === activeIndex\}/);
  assert.match(app, /aria-expanded=\{revealed\}/);
  assert.match(app, /aria-controls=\{`\$\{galleryTitleId\}-analysis`\}/);
  assert.match(styles, /\.diagnostic-gallery__stage/);
  assert.match(styles, /\.diagnostic-gallery__thumbs/);
});

test("lessons expose honest time plans, adaptive practice and keyboard-safe dialogs", async () => {
  const app = await read("src/App.jsx");
  const lessons = await read("src/data/lessons.js");

  assert.match(app, /navigate\(`learn\/\$\{id\}`\)/);
  assert.match(app, /learningModules\.find\(\(module\) => module\.id === routeDetail\)/);
  assert.match(app, /Skąd bierze się/);
  assert.match(app, /Zatrzymaj się na 20 sekund/);
  assert.match(app, /lesson-mobile-progress/);
  assert.match(app, /saveLessonPosition/);
  assert.match(app, /Czas obejmuje czytanie, krótkie przypomnienia, analizę przykładów/);
  assert.match(app, /Pamięć rozpoznawania/);
  assert.match(app, /Dlaczego nie/);
  assert.match(app, /function useDialogFocus/);
  assert.match(app, /event\.key === "Escape"/);
  assert.match(app, /event\.key !== "Tab"/);
  assert.match(lessons, /METAR opisuje warunki obserwowane/);
  assert.match(lessons, /Pułap nie jest najniższą dowolną chmurą/);
});

test("the METAR and TAF workshop preserves active recall and keyboard context", async () => {
  const app = await read("src/App.jsx");
  const storage = await read("src/lib/storage.js");

  assert.match(app, /Anatomia całej depeszy/);
  assert.match(app, /METAR jest zdaniem czytanym od lewej do prawej/);
  assert.match(app, /Słownik sekcji METAR/);
  assert.match(app, /Co jeszcze możesz tu spotkać/);
  assert.match(app, /Wyjaśnij dokładnie/);
  assert.match(app, /aria-pressed=\{mode === "taf"\}/);
  assert.match(app, /aria-pressed=\{mode === "briefing"\}/);
  assert.match(app, /aria-pressed=\{mode === "review"\}/);
  assert.match(app, /Odprawa 3 stacji/);
  assert.match(app, /Pamięć lokalna · bez konta/);
  assert.match(app, /Co zapisano na tym urządzeniu/);
  assert.match(app, /Potwierdź usunięcie/);
  assert.match(app, /recordAviationAnswer\(metarReviewItem/);
  assert.match(app, /recordAviationAnswer\(\s*tafReviewItem/);
  assert.match(storage, /cloud-recognition:aviation-review/);
  assert.match(storage, /clearAviationReview/);
  assert.match(app, /role="timer"/);
  assert.match(app, /feedbackDetail=\{tafAnswerIndex !== null/);
  assert.match(app, /Pełny rozbiór osi czasu/);
  assert.match(app, /trainingHeadingRef/);
  assert.match(app, /feedbackRef\.current\?\.focus/);
  assert.doesNotMatch(app, /className=\{`metar-timer[^`]+aria-live="polite"/s);
});

test("the encyclopedia exposes formation, differential diagnosis and aviation context", async () => {
  const app = await read("src/App.jsx");

  assert.match(app, /Najczęstsze mechanizmy powstawania/);
  assert.match(app, /Diagnostyka różnicowa/);
  assert.match(app, /Znaczenie lotnicze/);
  assert.match(app, /Wiatr z nieba/);
});

test("the encyclopedia teaches complete WMO names with an evidence-aware validator", async () => {
  const app = await read("src/App.jsx");
  const rules = await read("src/lib/nomenclature.js");
  const styles = await read("src/styles.css");

  assert.match(app, /function NomenclatureWorkshop/);
  assert.match(app, /Zbuduj nazwę\. Sprawdź jej granice\./);
  assert.match(app, /Przypadki do rozebrania/);
  assert.match(app, /Potrzebny dowód historii/);
  assert.match(app, /Mam podstawę do opisania pochodzenia/);
  assert.match(app, /aria-live="polite"/);
  assert.match(app, /aria-pressed=\{isSelected\}/);
  assert.match(rules, /translucidus/);
  assert.match(rules, /opacus/);
  assert.match(rules, /Cirrus homogenitus/);
  assert.match(rules, /mother:genitus:cumulonimbogenitus/);
  assert.match(styles, /\.nomenclature-workshop\s*\{/);
  assert.match(styles, /\.nomenclature-result\.is-conflict/);
});

test("the Layers page exposes a practical, assessed Windy decoder", async () => {
  const app = await read("src/App.jsx");
  const data = await read("src/data/weather-layers.js");
  const styles = await read("src/styles.css");

  assert.match(app, /Czytnik Windy/);
  assert.match(app, /Nie patrz na kolor bez pytania/);
  assert.match(app, /Ta mapa odpowiada na pytanie/);
  assert.match(app, /Poprawne zdanie interpretacyjne/);
  assert.match(app, /Porównaj obok/);
  assert.match(app, /Jedno pole, cztery interpretacje/);
  assert.match(app, /weatherLayerReading/);
  assert.match(data, /cloud-base/);
  assert.match(data, /cloud-tops/);
  assert.match(data, /rain-thunder/);
  assert.match(data, /CAPE jest wynikiem obliczenia/);
  assert.match(styles, /\.windy-decoder\s*\{/);
  assert.match(styles, /\.decoder-feedback\.is-correct/);
});

test("the Layers page includes a source-aware interactive sounding laboratory", async () => {
  const app = await read("src/App.jsx");
  const data = await read("src/data/soundings.js");
  const projection = await read("src/lib/sounding.js");
  const styles = await read("src/styles.css");

  assert.match(app, /Skew‑T czytaj jak argument, nie kolorowankę/);
  assert.match(app, /Radiosonda obserwowana/);
  assert.match(app, /Profil prognozowany/);
  assert.match(app, /Profile w tej pracowni/);
  assert.match(app, /Pięć przejść przez ten sam diagram/);
  assert.match(app, /Temperatura i Td/);
  assert.match(app, /Tor parceli/);
  assert.match(app, /Czego ten profil nie dowodzi/);
  assert.match(app, /Nie nazywaj jednej linii\. Zinterpretuj kolumnę\./);
  assert.match(app, /aria-pressed=\{visible\[id\]\}/);
  assert.match(app, /aria-live="polite"/);
  assert.match(data, /Stratus uwięziony pod inwersją/);
  assert.match(data, /Wilgotny dół pod ciepłą pokrywą/);
  assert.match(data, /Głęboka chwiejność powierzchniowa/);
  assert.match(data, /Chwiejność wyniesiona ponad stabilnym dołem/);
  assert.match(projection, /Math\.log/);
  assert.match(projection, /temperatureFraction/);
  assert.match(styles, /\.sounding-workbench\s*\{/);
  assert.match(styles, /\.sounding-profile--temperature/);
  assert.match(styles, /\.sounding-feedback\.wrong/);
});

test("the cloud atlas exposes a prominent evidence-aware search", async () => {
  const app = await read("src/App.jsx");
  const styles = await read("src/styles.css");

  assert.match(app, /Wyszukiwarka chmur/);
  assert.match(app, /Szukaj po nazwie albo po tym, co widzisz/);
  assert.match(app, /type="search"/);
  assert.match(app, /Wyczyść wyszukiwanie/);
  assert.match(app, /Wyniki w całej klasyfikacji/);
  assert.match(app, /Hasła WMO/);
  assert.match(app, /Rodzaje chmur/);
  assert.match(app, /Cała klasyfikacja · filtry poziomu są pomijane/);
  assert.match(app, /if \(nextQuery\.trim\(\)\) setLevel\("wszystkie"\)/);
  assert.match(app, /searchCloudAtlas/);
  assert.match(app, /searchTaxonomyTerms/);
  assert.match(styles, /\.atlas-search\s*\{/);
  assert.match(styles, /\.atlas-search__field:focus-within/);
  assert.match(styles, /\.atlas-term-results\s*\{/);
});

test("the field observer replaces the shallow binary key with transparent hypotheses", async () => {
  const app = await read("src/App.jsx");

  assert.match(app, /function FieldObserver/);
  assert.match(app, /Trzy hipotezy, nie jeden werdykt/);
  assert.match(app, /Co pasuje/);
  assert.match(app, /Co osłabia/);
  assert.match(app, /Najbardziej wartościowy kolejny dowód/);
  assert.match(app, /Porównanie prowadzącej pary/);
  assert.doesNotMatch(app, /function DecisionKey/);
});

test("the atlas includes a full differential comparison laboratory", async () => {
  const app = await read("src/App.jsx");
  const comparison = await read("src/data/comparison.js");

  assert.match(app, /function CloudComparison/);
  assert.match(app, /Laboratorium różnic/);
  assert.match(app, /Te same pytania\. Różne chmury\./);
  assert.match(app, /Mikrofizyka, geneza, ewolucja, pogoda i lotnictwo/);
  assert.match(app, /routeDetail === "compare"/);
  assert.match(comparison, /Znaczenie operacyjne i ograniczenia/);
  assert.match(comparison, /Najważniejsza pułapka/);
});

test("authoritative source links use verified current destinations", async () => {
  const sources = await read("src/data/sources.js");

  assert.match(
    sources,
    /faa\.gov\/regulationspolicies\/handbooksmanuals\/aviation\/faa-h-8083-28b-aviation-weather-handbook/,
  );
  assert.doesNotMatch(sources, /regulations_policies|handbooks_manuals/);
  assert.match(sources, /cloudatlas\.wmo\.int\/en\/upper-atmospheric-clouds\.html/);
  assert.match(sources, /cloudatlas\.wmo\.int\/en\/identifying-clouds\.html/);
  assert.match(sources, /aviationweather\.gov\/help\/data\//);
  assert.match(sources, /community\.windy\.com\/topic\/43145\/cloud-tops-lower-than-cloud-base/);
  assert.match(sources, /community\.windy\.com\/topic\/7102\/is-the-cloud-base-layer-in-agl-or-msl/);
});

test("external sources and image provenance have a scheduled link monitor", async () => {
  const packageJson = JSON.parse(await read("package.json"));
  const workflow = await read(".github/workflows/check-links.yml");
  const monitor = await read("scripts/check-links.mjs");

  assert.equal(packageJson.scripts["check:links"], "node scripts/check-links.mjs");
  assert.match(workflow, /schedule:/);
  assert.match(workflow, /npm run check:links/);
  assert.match(monitor, /sourceList/);
  assert.match(monitor, /cloud\.images\.map/);
  assert.match(monitor, /url: image\.page/);
  assert.match(monitor, /page or file you requested cannot be found/i);
  assert.match(monitor, /expected content marker/);
});

test("the iOS package embeds the complete production app", async () => {
  const packageJson = JSON.parse(await read("package.json"));
  const capacitor = await read("capacitor.config.ts");
  const entry = await read("src/main.jsx");

  assert.equal(packageJson.version, "1.0.0");
  assert.equal(packageJson.scripts["ios:sync"], "npm run build && cap sync ios");
  assert.equal(packageJson.scripts["release:ios:testflight"], "sh scripts/upload-ios-testflight.sh");
  assert.ok(packageJson.dependencies["@capacitor/core"]);
  assert.ok(packageJson.dependencies["@capacitor/ios"]);
  assert.match(capacitor, /appId: "cloud\.chmurnik\.app"/);
  assert.match(capacitor, /webDir: "dist"/);
  assert.match(capacitor, /launchAutoHide: false/);
  assert.match(entry, /Capacitor\.isNativePlatform\(\)/);
  assert.match(entry, /document\.documentElement\.classList\.add\("native-ios"\)/);
  assert.match(entry, /else if \("serviceWorker" in navigator/);
});

test("the iOS shell respects safe areas and release metadata", async () => {
  const styles = await read("src/zgrywa.css");
  const project = await read("ios/App/App.xcodeproj/project.pbxproj");
  const info = await read("ios/App/App/Info.plist");

  assert.match(styles, /html\.native-ios \.app-header/);
  assert.match(styles, /env\(safe-area-inset-top\)/);
  assert.match(styles, /env\(safe-area-inset-bottom\)/);
  assert.match(styles, /html\.native-ios \.bottom-nav button\s*\{[^}]*min-height: 56px/s);
  assert.match(project, /DEVELOPMENT_TEAM = 78N6WG8P57/g);
  assert.match(project, /PRODUCT_BUNDLE_IDENTIFIER = cloud\.chmurnik\.app/g);
  assert.match(project, /TARGETED_DEVICE_FAMILY = 1/g);
  assert.match(info, /<key>ITSAppUsesNonExemptEncryption<\/key>\s*<false\/>/s);
  assert.match(info, /UIStatusBarStyleDarkContent/);
  assert.doesNotMatch(info, /UIInterfaceOrientationLandscape/);
});

test("the iOS artwork follows the current pink and olive CHMURNIK design", async () => {
  const appIcon = await stat(new URL(
    "../ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png",
    import.meta.url,
  ));
  const launchImage = await stat(new URL(
    "../ios/App/App/Assets.xcassets/Splash.imageset/Default@3x~universal~anyany.jpg",
    import.meta.url,
  ));
  const sourceIcon = await stat(new URL("../resources/icon.png", import.meta.url));
  const assetScript = await read("scripts/generate-ios-assets.mjs");

  assert.ok(appIcon.size > 100_000);
  assert.ok(launchImage.size > 100_000);
  assert.ok(sourceIcon.size > 100_000);
  assert.match(assetScript, /jpeg\(\{/);
  assert.match(assetScript, /for \(const scale of \[1, 2, 3\]\)/);
});
