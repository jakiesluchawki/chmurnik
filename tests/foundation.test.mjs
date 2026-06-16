import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

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
  const manifest = JSON.parse(await read("public/manifest.webmanifest"));
  const worker = await read("public/service-worker.js");

  assert.equal(manifest.start_url, "/cloud-recognition/");
  assert.equal(manifest.scope, "/cloud-recognition/");
  assert.match(worker, /const BASE = "\/cloud-recognition\/"/);
});

test("GitHub Pages deployment runs tests before publishing", async () => {
  const workflow = await read(".github/workflows/deploy-pages.yml");

  assert.match(workflow, /npm test/);
  assert.match(workflow, /npm run build/);
  assert.match(workflow, /actions\/deploy-pages@v4/);
  assert.match(workflow, /FORCE_JAVASCRIPT_ACTIONS_TO_NODE24/);
});

test("npm configuration remains portable across local and CI machines", async () => {
  const npmrc = await read(".npmrc");

  assert.doesNotMatch(npmrc, /\/Users\//);
  assert.match(npmrc, /cache=\.npm-cache/);
});
