import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { atlasDestination } from "../src/lib/atlas-navigation.js";
import { clouds } from "../src/data/clouds.js";
import { loadJsx } from "./helpers/load-jsx.mjs";

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
  const { AtlasPage } = await loadJsx(new URL("../src/App.jsx", import.meta.url), ["AtlasPage"]);
  const target = atlasDestination("compare", "nimbostratus", clouds.map((cloud) => cloud.id));
  const markup = renderToStaticMarkup(createElement(AtlasPage, {
    initialTab: target.tab, initialCloudId: target.cloudId, initialComparisonIds: target.comparisonIds,
    onSources() {}, onSaveObservation() {},
  }));
  assert.match(markup, /role="dialog"/);
  assert.match(markup, /diagnostic-gallery-nimbostratus/);
  assert.doesNotMatch(markup, /diagnostic-gallery-(cirrus|cumulus|altostratus)"/);
});
