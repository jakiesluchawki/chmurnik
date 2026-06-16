import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
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

test("the public base path matches the repository", async () => {
  const config = await read("vite.config.mjs");

  assert.match(config, /base: "\/cloud-recognition\/"/);
});

test("the installable app and offline shell use the Pages base path", async () => {
  const index = await read("index.html");
  const manifest = JSON.parse(await read("public/manifest.webmanifest"));
  const worker = await read("public/service-worker.js");

  assert.match(index, /href="\.\/manifest\.webmanifest"/);
  assert.match(index, /href="\.\/icons\/apple-touch-icon\.png"/);
  assert.equal(manifest.start_url, "/cloud-recognition/");
  assert.equal(manifest.scope, "/cloud-recognition/");
  assert.match(worker, /const BASE = "\/cloud-recognition\/"/);
  assert.match(worker, /cloud-recognition-v5/);
});

test("GitHub Pages deployment runs tests before publishing", async () => {
  const workflow = await read(".github/workflows/deploy-pages.yml");

  assert.match(workflow, /npm test/);
  assert.match(workflow, /npm run check:lessons/);
  assert.match(workflow, /npm run build/);
  assert.match(workflow, /actions\/deploy-pages@v4/);
  assert.match(workflow, /FORCE_JAVASCRIPT_ACTIONS_TO_NODE24/);
});

test("npm configuration remains portable across local and CI machines", async () => {
  const npmrc = await read(".npmrc");

  assert.doesNotMatch(npmrc, /\/Users\//);
  assert.match(npmrc, /cache=\.npm-cache/);
});

test("small annotation colors meet WCAG AA against their surfaces", async () => {
  const styles = await read("src/styles.css");
  const token = (name) => styles.match(new RegExp(`--${name}: (#[0-9a-f]{6})`))[1];
  const paper = token("paper");
  const white = token("white");

  assert.ok(contrastRatio(token("coral"), paper) >= 4.5);
  assert.ok(contrastRatio(token("coral"), white) >= 4.5);
  assert.ok(contrastRatio(token("moss"), paper) >= 4.5);
});

test("the recognition test is globally available and explains its methodology", async () => {
  const app = await read("src/App.jsx");

  assert.match(app, /className="quick-test-button"/);
  assert.match(app, /function RecognitionTest/);
  assert.match(app, /cztery prawdopodobne odpowiedzi/i);
  assert.match(app, /Dystraktory pochodzą z grup rzeczywiście mylonych wizualnie/);
  assert.match(app, /formatResultCount/);
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

test("the encyclopedia exposes formation, differential diagnosis and aviation context", async () => {
  const app = await read("src/App.jsx");

  assert.match(app, /Najczęstsze mechanizmy powstawania/);
  assert.match(app, /Diagnostyka różnicowa/);
  assert.match(app, /Znaczenie lotnicze/);
  assert.match(app, /Wiatr z nieba/);
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
  assert.match(monitor, /cloud\.image\.page/);
  assert.match(monitor, /page or file you requested cannot be found/i);
  assert.match(monitor, /expected content marker/);
});
