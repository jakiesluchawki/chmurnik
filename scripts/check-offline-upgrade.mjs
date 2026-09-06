import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile, mkdir, writeFile, mkdtemp, rm } from "node:fs/promises";
import { createServer } from "node:http";
import { createServer as createSecureServer } from "node:https";
import path from "node:path";
import { parseArgs } from "node:util";
import { pathToFileURL } from "node:url";
import { clouds } from "../src/data/clouds.js";

const { values } = parseArgs({ options: {
  "before-dir": { type: "string" }, "after-dir": { type: "string" },
  "playwright-path": { type: "string" }, "browser-path": { type: "string" },
  engine: { type: "string", default: "chromium" },
  persistent: { type: "boolean", default: false },
  "tls-key": { type: "string" }, "tls-cert": { type: "string" },
  "offline-method": { type: "string", default: "browser" },
  output: { type: "string", default: "build/offline-upgrade-qa" },
} });
assert(values["before-dir"] && values["after-dir"], "Two immutable root-build directories are required");
assert(["chromium", "webkit"].includes(values.engine));
assert(["browser", "server-disconnect"].includes(values["offline-method"]));
assert.equal(Boolean(values["tls-key"]), Boolean(values["tls-cert"]), "Both local TLS files are required");
const engines = await import(values["playwright-path"] ? pathToFileURL(values["playwright-path"]).href : "playwright");
const before = path.resolve(values["before-dir"]), after = path.resolve(values["after-dir"]);
const output = path.resolve(values.output);
await mkdir(output, { recursive: true });
const hash = (value) => createHash("sha256").update(value).digest("hex");
const receipt = async (dir) => ({
  html: hash(await readFile(path.join(dir, "index.html"))),
  worker: hash(await readFile(path.join(dir, "service-worker.js"))),
});
const report = { before: await receipt(before), after: await receipt(after), engine: values.engine,
  profile: values.persistent ? "fresh temporary persistent" : "fresh private", checks: {} };
report.offlineMethod = values["offline-method"];
assert.notEqual(report.before.worker, report.after.worker, "Actual different service workers required");
const expectedPhotos = {};
for (const file of new Set(clouds.flatMap(cloud => cloud.images.map(image => image.src.replace(/^\//, ""))))) {
  const bytes = await readFile(path.join(after, file));
  assert.equal(hash(bytes), hash(await readFile(path.join(before, file))), "This case requires unchanged atlas photos");
  expectedPhotos[`/${file}`] = hash(bytes);
}
const mime = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json",
  ".webmanifest": "application/manifest+json", ".jpg": "image/jpeg", ".png": "image/png", ".avif": "image/avif",
  ".webp": "image/webp", ".svg": "image/svg+xml", ".woff2": "font/woff2" };
const headers = new Map();
for (const dir of [before, after]) {
  const apache = await readFile(path.join(dir, ".htaccess"), "utf8");
  headers.set(dir, Object.fromEntries([...apache.matchAll(/^\s*Header always set ([\w-]+) "([^"]+)"/gm)]
    .map(match => [match[1], match[2]])));
}
let active = before, browser, context, profile, page, reachable = true, phase = "baseline";
const errors = [];
const requestFailures = [];
const serve = async (req, res) => {
  if (!reachable) { req.socket.destroy(); return; }
  try {
    const directory = active;
    const url = new URL(req.url, "http://localhost");
    const requested = decodeURIComponent(url.pathname);
    const file = path.resolve(directory, `.${requested === "/" ? "/index.html" : requested}`);
    if (!file.startsWith(`${directory}${path.sep}`) || requested.includes("..")) { res.writeHead(403).end(); return; }
    const body = await readFile(file);
    res.writeHead(200, { ...headers.get(directory), "Content-Type": mime[path.extname(file)] || "application/octet-stream", "Cache-Control": "no-store" });
    res.end(body);
  } catch { res.writeHead(404).end(); }
};
const server = values["tls-key"] ? createSecureServer({
  key: await readFile(values["tls-key"]), cert: await readFile(values["tls-cert"]),
}, serve) : createServer(serve);
await new Promise((resolve, reject) => { server.once("error", reject); server.listen(0, "127.0.0.1", resolve); });
const base = `${values["tls-key"] ? "https" : "http"}://127.0.0.1:${server.address().port}/`;
report.transport = values["tls-key"] ? "loopback HTTPS with temporary self-signed test certificate" : "loopback HTTP";
try {
  // Only a fresh test profile and public atlas fixture; never the owner's browser.
  const options = { viewport: { width: 390, height: 844 }, locale: "pl-PL", reducedMotion: "reduce",
    ignoreHTTPSErrors: Boolean(values["tls-cert"]) };
  if (values.persistent) {
    profile = await mkdtemp(path.join(output, "profile-"));
    context = await engines[values.engine].launchPersistentContext(profile, { ...options, headless: true, executablePath: values["browser-path"] });
  } else {
    browser = await engines[values.engine].launch({ headless: true, executablePath: values["browser-path"] });
    context = await browser.newContext(options);
  }
  page = await context.newPage();
  const offline = async value => {
    if (values["offline-method"] === "browser") await context.setOffline(value);
    else reachable = !value;
  };
  page.setDefaultTimeout(20000);
  page.on("pageerror", e => errors.push({ phase, message: e.message }));
  page.on("requestfailed", request => requestFailures.push({ url: request.url(), error: request.failure()?.errorText }));
  await page.addInitScript(() => {
    window.__qaDatabaseErrors = [];
    for (const method of ["get", "getAll", "count", "put"]) {
      const original = IDBObjectStore.prototype[method];
      IDBObjectStore.prototype[method] = function (...args) {
        try {
          const request = original.apply(this, args);
          request.addEventListener("error", () => window.__qaDatabaseErrors.push({ method, name: request.error?.name, message: request.error?.message }));
          return request;
        } catch (error) {
          window.__qaDatabaseErrors.push({ method, name: error.name, message: error.message });
          throw error;
        }
      };
    }
  });
  const ready = async () => {
    await page.locator("h1").first().waitFor();
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    const skip = page.getByRole("button", { name: "Pomiń", exact: true });
    if (await skip.isVisible()) await skip.click();
  };
  const stored = () => page.evaluate(async () => {
    const db = await new Promise((resolve, reject) => {
      const request = indexedDB.open("chmurnik-observations", 1);
      request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error);
    });
    const digest = async bytes => [...new Uint8Array(await crypto.subtle.digest("SHA-256", bytes))]
      .map(v => v.toString(16).padStart(2, "0")).join("");
    const result = { localStorage: Object.fromEntries(Object.keys(localStorage).sort().map(k => [k, localStorage.getItem(k)])), stores: {} };
    for (const name of ["entries", "photos", "meta"]) {
      const items = await new Promise((resolve, reject) => {
        const tx = db.transaction(name), store = tx.objectStore(name), keys = store.getAllKeys(), values = store.getAll();
        tx.oncomplete = () => resolve({ keys: keys.result, values: values.result }); tx.onerror = () => reject(tx.error);
      });
      result.stores[name] = await Promise.all(items.values.map(async (value, i) => [items.keys[i], value instanceof Blob
        ? { size: value.size, type: value.type, sha256: await digest(await value.arrayBuffer()) } : value]));
    }
    db.close();
    return result;
  });
  await page.goto(`${base}#/journal`);
  await ready();
  await page.getByRole("button", { name: "Dodaj wpis", exact: true }).click();
  await page.getByLabel("Zdjęcie nieba (opcjonalnie)").setInputFiles(path.join(before, "assets/clouds/cumulus.jpg"));
  await page.getByLabel("Notatka", { exact: true }).fill("QA: zachowaj zdjęcie i notatkę przy aktualizacji offline.");
  await page.getByLabel("Własne rozpoznanie").selectOption("cumulus");
  await page.getByAltText("Zdjęcie do zapisania", { exact: true }).waitFor();
  await page.getByAltText("Zdjęcie do zapisania", { exact: true }).evaluate(image => image.decode());
  await page.getByRole("button", { name: "Zapisz obserwację", exact: true }).click();
  await page.getByRole("button", { name: "Zapisz zmiany", exact: true }).waitFor();
  await page.getByLabel("Ulubiona obserwacja").check();
  await page.getByRole("button", { name: "Zapisz zmiany", exact: true }).click();
  await page.waitForFunction(async () => {
    const db = await new Promise(resolve => { const r = indexedDB.open("chmurnik-observations", 1); r.onsuccess = () => resolve(r.result); });
    const entries = await new Promise(resolve => { const r = db.transaction("entries").objectStore("entries").getAll(); r.onsuccess = () => resolve(r.result); });
    db.close(); return entries.length === 1 && entries[0].favorite === true;
  });
  const observationRoute = new URL(page.url()).hash;
  const originalStorage = await stored();
  report.originalStorageSha256 = hash(JSON.stringify(originalStorage));
  assert.equal(originalStorage.stores.photos.length, 1);
  await page.waitForFunction(async () => {
    const registration = await navigator.serviceWorker.getRegistration();
    return registration?.active?.state === "activated" && navigator.serviceWorker.controller;
  }, undefined, { timeout: 45000 });
  await page.evaluate(async () => {
    const registration = await navigator.serviceWorker.getRegistration();
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error("Atlas cache timed out")), 45000);
      const receive = event => {
        if (!event.data?.type?.startsWith("CHMURNIK_ATLAS_CACHE")) return;
        clearTimeout(timeout); navigator.serviceWorker.removeEventListener("message", receive);
        if (event.data.type === "CHMURNIK_ATLAS_CACHED") resolve(); else reject(new Error("Atlas download failed"));
      };
      navigator.serviceWorker.addEventListener("message", receive);
      registration.active.postMessage({ type: "CACHE_ATLAS" });
    });
  });
  report.beforeCaches = await page.evaluate(() => caches.keys());
  await offline(true);
  await page.reload();
  await ready();
  await page.getByRole("button", { name: "Zapisz zmiany", exact: true }).waitFor();
  assert.equal(hash(JSON.stringify(await stored())), report.originalStorageSha256);
  report.checks.baselineOffline = true;
  await offline(false);
  const oldScripts = await page.evaluate(() => [...document.scripts].map(s => s.src).filter(Boolean));
  active = after;
  await page.evaluate(async () => (await navigator.serviceWorker.getRegistration()).update());
  await page.locator(".app-update-notice").waitFor();
  assert.deepEqual(await page.evaluate(() => [...document.scripts].map(s => s.src).filter(Boolean)), oldScripts,
    "Waiting update does not replace the running app without acceptance");
  report.checks.notice = true;
  await offline(true);
  phase = "upgrade";
  await Promise.all([page.waitForEvent("load"),
    page.locator(".app-update-notice").getByRole("button", { name: "Odśwież" }).click()]);
  await ready();
  assert.notDeepEqual(await page.evaluate(() => [...document.scripts].map(s => s.src).filter(Boolean)), oldScripts,
    "The accepted update loads the new app bundle");
  assert.equal(hash(await page.evaluate(async () => (await caches.match("/")).text())), report.after.html,
    "Offline navigation is backed by the exact new release HTML");
  await page.getByRole("button", { name: "Zapisz zmiany", exact: true }).waitFor();
  assert.equal(hash(JSON.stringify(await stored())), report.originalStorageSha256, "Storage survives update exactly");
  report.checks.storageAfterUpdate = true;
  report.checks.activationOffline = true;
  report.afterCaches = await page.evaluate(() => caches.keys());
  await offline(true);
  await page.goto(`${base}${observationRoute}`);
  await ready();
  await page.getByRole("button", { name: "Zapisz zmiany", exact: true }).waitFor();
  await page.waitForFunction(() => document.querySelector("img.sky-detail-photo")?.naturalWidth > 0);
  assert.equal(hash(JSON.stringify(await stored())), report.originalStorageSha256);
  report.checks.photoAndStorageOffline = true;
  report.atlas = await page.evaluate(async expected => {
    const results = [];
    for (const [url, sha256] of Object.entries(expected)) {
      try {
        const response = await fetch(url);
        const buffer = await response.arrayBuffer();
        const actual = [...new Uint8Array(await crypto.subtle.digest("SHA-256", buffer))].map(v => v.toString(16).padStart(2, "0")).join("");
        results.push({ url, ok: response.ok && actual === sha256 });
      } catch { results.push({ url, ok: false }); }
    }
    return results;
  }, expectedPhotos);
  await page.screenshot({ path: path.join(output, "offline-observation.png"), fullPage: true });
  assert.equal(report.atlas.filter(r => r.ok).length, 30, "All downloaded atlas photos survive offline upgrade");
  report.checks.atlasOffline = true;
  report.baselineErrors = errors.filter(error => error.phase === "baseline");
  report.candidateErrors = errors.filter(error => error.phase === "upgrade");
  assert.deepEqual(report.candidateErrors, [], "No errors from the candidate after activation");
  report.result = "PASS";
} catch (error) {
  report.result = "FAIL"; report.error = error.stack; process.exitCode = 1;
  report.pageErrors = errors;
  report.requestFailures = requestFailures;
  if (page) {
    report.workerState = await page.evaluate(async () => {
      const r = await navigator.serviceWorker.getRegistration();
      return { active: r?.active?.state, waiting: r?.waiting?.state, installing: r?.installing?.state,
        controller: navigator.serviceWorker.controller?.state, caches: await caches.keys() };
    }).catch(() => null);
    report.databaseErrors = await page.evaluate(() => window.__qaDatabaseErrors).catch(() => []);
    report.pageText = await page.locator("body").innerText().catch(() => "unavailable");
    await page.screenshot({ path: path.join(output, "failure.png"), fullPage: true }).catch(() => {});
  }
} finally {
  const cleanupErrors = [];
  for (const resource of [context, browser]) {
    try { await resource?.close(); } catch (error) { cleanupErrors.push(error.message); }
  }
  if (profile) await rm(profile, { recursive: true, force: true });
  await new Promise(resolve => server.close(resolve));
  if (cleanupErrors.length) {
    report.cleanupErrors = cleanupErrors;
    report.result = "FAIL";
    process.exitCode = 1;
  }
  await writeFile(path.join(output, "report.json"), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
}
