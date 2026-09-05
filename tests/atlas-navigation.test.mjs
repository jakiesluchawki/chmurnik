import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { buildSync } from "esbuild";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { atlasDestination } from "../src/lib/atlas-navigation.js";
import { clouds } from "../src/data/clouds.js";

const ids = ["cu", "sc", "as", "ns"];

test("a single photo hypothesis opens its description, not a default comparison", () => {
  assert.deepEqual(atlasDestination("compare", "ns", ids), {
    tab: "atlas", cloudId: "ns", comparisonIds: [],
  });
  assert.deepEqual(atlasDestination("compare", "ns,ns,clear_sky", ids), {
    tab: "atlas", cloudId: "ns", comparisonIds: [],
  });
});

test("multiple hypotheses retain their order, with three at most", () => {
  assert.deepEqual(atlasDestination("compare", "ns,as,ns,cu,sc", ids), {
    tab: "compare", cloudId: null, comparisonIds: ["ns", "as", "cu"],
  });
});

test("empty and unknown targets do not invent comparison candidates", () => {
  for (const payload of [undefined, "", "clear_sky,unknown"]) {
    assert.deepEqual(atlasDestination("compare", payload, ids), {
      tab: "atlas", cloudId: null, comparisonIds: [],
    });
  }
  assert.equal(atlasDestination("observer", "cu", ids).tab, "observer");
  assert.equal(atlasDestination(undefined, undefined, ids).tab, "atlas");
});

test("the atlas receives and opens the validated single-cloud destination", async () => {
  const source = await readFile(new URL("../src/App.jsx", import.meta.url), "utf8");
  assert.match(source, /initialCloudId=\{atlasTarget.cloudId\}/);
  assert.match(source, /const \[selected, setSelected\] = useState\(initialCloudId\)/);
  assert.match(source, /setSelected\(initialCloudId\)/);
  assert.match(source, /cloud=\{getCloud\(selected\)\}/);
  assert.match(source, /initialComparisonIds=\{atlasTarget.comparisonIds\}/);
});

test("the real atlas renders a single hypothesis description without a default pair or state type error", async () => {
  const appUrl = new URL("../src/App.jsx", import.meta.url);
  const source = await readFile(appUrl, "utf8");
  const bundle = buildSync({
    stdin: { contents: `${source}\nexport { AtlasPage };`, sourcefile: "App.jsx", loader: "jsx",
      resolveDir: fileURLToPath(new URL("../src", import.meta.url)) },
    bundle: true, write: false, format: "cjs", platform: "node", jsx: "automatic",
    external: ["react", "react-dom"], mainFields: ["module", "main"],
    define: { "import.meta.env": JSON.stringify({ BASE_URL: "/", VITE_QA_NATIVE_LAYOUT: "0" }) },
  });
  const module = { exports: {} };
  new Function("require", "module", "exports", bundle.outputFiles[0].text)(createRequire(appUrl), module, module.exports);
  const target = atlasDestination("compare", "nimbostratus", clouds.map((cloud) => cloud.id));
  const markup = renderToStaticMarkup(createElement(module.exports.AtlasPage, {
    initialTab: target.tab, initialCloudId: target.cloudId, initialComparisonIds: target.comparisonIds,
    onSources() {}, onSaveObservation() {},
  }));
  assert.match(markup, /role="dialog"/);
  assert.match(markup, /diagnostic-gallery-nimbostratus/);
  assert.doesNotMatch(markup, /diagnostic-gallery-(cirrus|cumulus|altostratus)"/);
});
