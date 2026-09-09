import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdir, mkdtemp, readFile, writeFile, rm, symlink } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import vm from "node:vm";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { weatherLessonLinks, weatherWorkshopEntry, weatherWorkshopCatalog } from "../src/lib/weather-lesson-links.js";
import { returnLesson } from "../weather-preview/tutorial.mjs";
import { lessons } from "../src/data/lessons.js";
import { clouds } from "../src/data/clouds.js";
import { loadLessonPosition, saveLessonPosition, saveProgress, loadProgress } from "../src/lib/storage.js";
import { bundledWorkshops, workshopBundleFiles, completeOfflineManifest } from "../vite.config.mjs";
import { loadJsx } from "./helpers/load-jsx.mjs";

const read = file => readFile(new URL(`../${file}`, import.meta.url), "utf8");
const hash = bytes => createHash("sha256").update(bytes).digest("hex");
const ids = ["bryza", "burza", "chmura", "front", "metar", "mgla", "nazwy", "oblodzenie", "obserwacja", "rodziny", "sondaz", "turbulencja", "wiatr", "wysokosc"];

test("workshop scroll targets respect native safe areas after switching modes", async () => {
  const style = await read("weather-preview/style.css");
  assert.match(style, /html\s*\{[^}]*scroll-padding-top: calc\(env\(safe-area-inset-top, 0px\) \+ 76px\)/);
  assert.match(style, /body::before\s*\{[^}]*position: fixed;[^}]*height: env\(safe-area-inset-top, 0px\)/);
  assert.match(style, /body::before\s*\{[^}]*pointer-events: none/);
  assert.match(style, /\.foundation-workshop > \.foundation-topbar,[^{]*\{[^}]*position: sticky;[^}]*top: env\(safe-area-inset-top, 0px\)/);
});

test("all 14 workshops link from nine lessons to local explicit HTML on root, Pages and native origins", () => {
  for (const [base, root] of [["/", "https://chmurnik.cloud/"], ["/chmurnik/", "https://jakiesluchawki.github.io/chmurnik/"],
    ["/", "capacitor://localhost/"], ["./", "capacitor://localhost/index.html"], ["/app/", "https://example.test/app/"]]) {
    const linked = [];
    for (const lesson of Object.keys(lessons)) for (const link of weatherLessonLinks(lesson, base)) {
      const url = new URL(link.href, root);
      assert.equal(url.protocol, new URL(root).protocol);
      assert.equal(url.host, new URL(root).host);
      assert.match(url.pathname, /\/pogoda-preview\/index\.html$/);
      assert.equal(url.searchParams.get("from"), lesson);
      assert.equal(returnLesson(url.search, "other"), lesson);
      linked.push(url.hash.slice(1));
      // The shared preview's mainSite resolves the same app document and lesson.
      const back = new URL(`${new URL("../", url).href}#/learn/${returnLesson(url.search, "other")}`);
      assert.equal(back.protocol, new URL(root).protocol);
      assert.equal(back.host, new URL(root).host);
      assert.equal(back.pathname, new URL("./", root).pathname);
      assert.equal(back.hash, `#/learn/${lesson}`);
    }
    assert.deepEqual(linked.sort(), ids);
    assert.equal(new URL(weatherWorkshopCatalog(base), root).hash, "#pracownia");
  }
});

test("link helpers reject external/path-injection bases and unknown lessons without accepting arbitrary return URLs", () => {
  assert.equal(weatherLessonLinks("wiatr", "/")[0].title, "Odczytaj ruch chmur i kierunek wiatru");
  for (const base of [undefined, null, "", "https://evil.test/", "//evil.test/", "/../", "/a/../../", "/a?next=evil/", "/a#hash/", "/a\\b/", "javascript:alert(1)"]) {
    assert.equal(weatherWorkshopEntry(base), null);
    assert.equal(weatherWorkshopCatalog(base), null);
    assert.deepEqual(weatherLessonLinks("wiatr", base), []);
  }
  for (const lesson of ["constructor", "__proto__", "unknown", "zagrozenia&from=evil"]) assert.deepEqual(weatherLessonLinks(lesson, "/"), []);
  assert.equal(returnLesson("?from=https://evil.test", "zagrozenia"), "zagrozenia");
});

function memoryWindow(t) {
  const previous = Object.getOwnPropertyDescriptor(globalThis, "window"), values = new Map();
  const storage = { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, String(value)) };
  Object.defineProperty(globalThis, "window", { configurable: true, value: { localStorage: storage, matchMedia: () => ({ matches: false }) } });
  t.after(() => previous ? Object.defineProperty(globalThis, "window", previous) : delete globalThis.window);
  return values;
}

test("actual lesson and Warstwy markup exposes bundled links; the same lesson position/progress and photo records survive", async t => {
  const values = memoryWindow(t);
  values.set("chmurnik:photos:v1", "private photo fixture");
  values.set("cloud-recognition:journal", "private journal fixture");
  const { LearnPage, LayersPage } = await loadJsx(new URL("../src/App.jsx", import.meta.url), ["LearnPage", "LayersPage"]);
  for (const id of Object.keys(lessons)) {
    saveLessonPosition(id, 2); saveProgress([id]);
    const before = [...values];
    const html = renderToStaticMarkup(createElement(LearnPage, { initialModule: id, completed: [id], recognitionStats: {}, onConsumeInitial() {}, onSources() {}, onBack() {} }));
    for (const link of weatherLessonLinks(id, "/")) assert.ok(html.includes(`href="${link.href}"`), id);
    assert.equal(loadLessonPosition(id), 2);
    assert.deepEqual(loadProgress(), [id]);
    assert.deepEqual([...values], before, "rendering and generating a roundtrip link do not write learner/photo data");
  }
  const layers = renderToStaticMarkup(createElement(LayersPage, { initialTab: "wind", navigate() {}, onSources() {} }));
  assert.ok(layers.includes(weatherWorkshopCatalog("/")));
  assert.ok(layers.includes(weatherLessonLinks("wiatr", "/")[0].href));
  const app = await read("src/App.jsx");
  assert.match(app, /setActiveChapter\(Math\.min\(loadLessonPosition\(selected\), chapterCount - 1\)\)/);
  assert.doesNotMatch(app, /VITE_WEATHER_PREVIEW/);
  assert.doesNotMatch(app, /from ["'][^"']*weather-preview\//, "the shared workbench remains a separate bundle, not copied into App");
});

test("installed Capacitor router requires the explicit index and permits the same local application URL", async () => {
  const router = await read("node_modules/@capacitor/ios/Capacitor/Capacitor/Router.swift");
  assert.match(router, /if pathUrl\.pathExtension\.isEmpty\s*\{\s*return basePath \+ "\/index.html"/);
  assert.match(router, /return basePath \+ path/);
  const delegation = await read("node_modules/@capacitor/ios/Capacitor/Capacitor/WebViewDelegationHandler.swift");
  assert.match(delegation, /navURL\.absoluteString\.starts\(with: bridge\.config\.localURL\.absoluteString\)/);
  assert.equal(weatherWorkshopEntry("/"), "/pogoda-preview/index.html");
});

async function fixture(t) {
  const directory = await mkdtemp(join(tmpdir(), "chmurnik-production-workshops-"));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const staging = join(directory, "staging"), output = join(directory, "output");
  const bytes = {
    "index.html": '<script type="module" src="./assets/app-1.js"></script><link rel="stylesheet" href="./assets/app-1.css">',
    "assets/app-1.js": "export const workshop = 'fixture';",
    "assets/app-1.css": "body { color: #7442d9 }",
    "assets/font.woff2": "font fixture", "photos/transfer-01.jpg": "exact photo bytes", "covers/storm.webp": "felt cover bytes",
  };
  for (const [file, source] of Object.entries(bytes)) {
    await mkdir(dirname(join(staging, file)), { recursive: true }); await writeFile(join(staging, file), source);
  }
  const collect = async () => {
    const emitted = new Map(), plugin = bundledWorkshops({ directory: staging });
    plugin.configResolved({ root: directory, build: { outDir: output } });
    await plugin.generateBundle.call({ emitFile: asset => { assert.equal(asset.type, "asset"); emitted.set(asset.fileName, asset.source); } });
    return emitted;
  };
  return { directory, staging, output, bytes, collect };
}

test("bundle plugin emits every staged byte with relative paths and a deterministic hash manifest", async t => {
  const { bytes, collect } = await fixture(t);
  const emitted = await collect(), manifest = JSON.parse(emitted.get("pogoda-preview/bundle-manifest.json"));
  assert.equal(manifest.entry, "index.html");
  assert.equal(emitted.size, Object.keys(bytes).length + 1);
  for (const [file, expected] of Object.entries(bytes)) {
    assert.equal(emitted.get(`pogoda-preview/${file}`).toString(), expected);
    assert.equal(manifest.files[file], hash(expected));
  }
  assert.deepEqual(await collect(), emitted);
  assert.ok([...emitted.keys()].every(file => file.startsWith("pogoda-preview/") && !file.includes("weather-preview/")));
});

test("missing/incomplete bundles, symlinks and destructive staging/output overlap fail closed", async t => {
  const { directory, staging } = await fixture(t);
  await assert.rejects(workshopBundleFiles(join(directory, "missing")), /npm run weather:bundle/);
  await symlink(join(directory, "private"), join(staging, "external"));
  await assert.rejects(workshopBundleFiles(staging), /Cannot read workshop bundle/);
  await rm(join(staging, "external")); await rm(join(staging, "index.html"));
  await assert.rejects(workshopBundleFiles(staging), /Incomplete workshop bundle/);
  assert.throws(() => bundledWorkshops({ directory: staging }).configResolved({ root: directory, build: { outDir: directory } }), /outside/);
});

async function writeOutput(output, emitted) {
  for (const [file, source] of emitted) { await mkdir(dirname(join(output, file)), { recursive: true }); await writeFile(join(output, file), source); }
  for (const photo of clouds.flatMap(cloud => cloud.images)) {
    const file = join(output, photo.src.replace(/^\//, "")); await mkdir(dirname(file), { recursive: true }); await writeFile(file, `atlas:${photo.src}`);
  }
  await writeFile(join(output, "service-worker.js"), await read("public/service-worker.js"));
  await completeOfflineManifest().writeBundle({ dir: output }, Object.fromEntries([
    ["assets/root.js", {}], ...[...emitted].map(([file, source]) => [file, { source }]),
  ]));
  return readFile(join(output, "service-worker.js"), "utf8");
}

function worker(source, base = "/") {
  const events = {}, context = {
    URL, self: { location: { href: `https://example.test${base}service-worker.js`, origin: "https://example.test" }, addEventListener: (type, callback) => { events[type] = callback; } },
    fetch: async () => { throw new Error("offline"); }, caches: { match: async path => path },
  };
  vm.runInNewContext(`${source}\nthis.result = { assets: RUNTIME_ASSETS, shell: APP_SHELL, version: VERSION, atlas: ATLAS_HASHES };`, context);
  return { events, result: JSON.parse(JSON.stringify(context.result)) };
}

test("generated offline shell includes all workshop assets; query-bearing workshop navigation falls back to its own HTML", async t => {
  const { output, collect } = await fixture(t), emitted = await collect();
  const source = await writeOutput(output, emitted);
  for (const base of ["/", "/chmurnik/"]) {
    const { result, events } = worker(source, base);
    for (const file of emitted.keys()) {
      assert.ok(result.assets.includes(file)); assert.ok(result.shell.includes(`${base}${file}`));
    }
    assert.equal(Object.keys(result.atlas).length, 30, "atlas integrity migration remains intact");
    for (const target of [`${base}pogoda-preview/index.html?from=zagrozenia#burza`, `${base}pogoda-preview/?from=wiatr`, `${base}#/learn/wiatr`]) {
      let response;
      events.fetch({ request: { method: "GET", mode: "navigate", url: `https://example.test${target}` }, respondWith: promise => { response = promise; } });
      assert.equal(await response, target.includes("pogoda-preview/") ? `${base}pogoda-preview/index.html` : base);
    }
  }
});

test("changing only an unhashed workshop photograph changes the offline cache version", async t => {
  const { staging, output, collect } = await fixture(t);
  const first = worker(await writeOutput(output, await collect())).result;
  assert.equal(worker(await writeOutput(output, await collect())).result.version, first.version);
  await writeFile(join(staging, "photos/transfer-01.jpg"), "replacement photo bytes");
  const next = worker(await writeOutput(output, await collect())).result;
  assert.notEqual(next.version, first.version);
  assert.deepEqual(next.atlas, first.atlas);
});

test("development middleware serves the same staged entry/photos locally without launching another build", async t => {
  const { staging } = await fixture(t);
  let serve;
  bundledWorkshops({ directory: staging }).configureServer({ config: { base: "/" }, middlewares: { use: callback => { serve = callback; } } });
  const request = async url => {
    const headers = {}; let body, passed = false;
    const response = { setHeader: (key, value) => { headers[key] = value; }, end: value => { body = value; } };
    await serve({ url }, response, () => { passed = true; });
    return { headers, body, passed, status: response.statusCode };
  };
  const html = await request("/pogoda-preview/index.html?from=wiatr");
  assert.equal(html.headers["Content-Type"], "text/html; charset=utf-8");
  assert.ok(html.body.toString().includes("./assets/app-1.js"));
  assert.equal((await request("/pogoda-preview/photos/transfer-01.jpg")).headers["Content-Type"], "image/jpeg");
  assert.equal((await request("/elsewhere")).passed, true);
  assert.equal((await request("/pogoda-preview/missing.js")).status, 503);
});

test("npm build orchestration stages workshops once without recursion and reaches ios sync and both web archives", async () => {
  const pkg = JSON.parse(await read("package.json"));
  assert.equal(pkg.scripts.prebuild, "npm run weather:bundle");
  assert.equal(pkg.scripts["prebuild:pages"], "npm run weather:bundle");
  assert.equal(pkg.scripts["weather:bundle"], "vite build --config weather-preview/vite.config.mjs --outDir ../build/weather-bundle");
  assert.doesNotMatch(pkg.scripts["weather:bundle"], /npm run build/);
  assert.equal(pkg.scripts["ios:sync"], "npm run build && cap sync ios");
  const release = await read("scripts/build-web-release.sh");
  assert.ok(release.indexOf("npm run build\n") < release.indexOf("zip -q -r"));
  assert.ok(release.indexOf("test -s dist/pogoda-preview/index.html") < release.indexOf("zip -q -r"));
  assert.match(release, /npm run build:pages\ntest -s dist\/pogoda-preview\/index.html/);
});
