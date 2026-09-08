import test from "node:test";
import assert from "node:assert/strict";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { clouds } from "../src/data/clouds.js";
import { selectDailyCloud } from "../src/lib/daily-cloud.js";
import { loadJsx } from "./helpers/load-jsx.mjs";

const { FieldHome } = await loadJsx(new URL("../src/components/FieldHome.jsx", import.meta.url));
const { nativeNavigation, workspaceItems } = await loadJsx(
  new URL("../src/App.jsx", import.meta.url), ["nativeNavigation", "workspaceItems"],
);
test("native navigation exposes Warstwy without duplicating Mac workspaces", () => {
  assert.deepEqual(nativeNavigation.map(x => x.id), ["home", "journal", "atlas", "layers"]);
  assert.equal(nativeNavigation.find(x => x.id === "layers").label, "Warstwy");
  assert.equal(new Set(workspaceItems.map(x => x.id)).size, workspaceItems.length);
  assert.deepEqual(workspaceItems.map(x => x.id), ["home","journal","atlas","learn","practice/metar","practice/wind","layers"]);
});
test("the actual native home conceals genus, diagnosis and answer actions for every daily photograph", () => {
  const start = new Date(2026, 8, 8);
  const total = selectDailyCloud(clouds, start).total;
  for (let i = 0; i < total; i++) {
    const day = new Date(2026, 8, 8 + i);
    const daily = selectDailyCloud(clouds, day);
    const html = renderToStaticMarkup(createElement(FieldHome, { day, navigate() {}, onSources() {}, onRecognition() {}, onCapture() {} }));
    const exercise = html.slice(html.indexOf('<section class="field-daily"'), html.indexOf('<nav class="field-deep-links"'));
    assert.match(exercise, /Odsłoń odpowiedź/);
    assert.match(exercise, /aria-expanded="false"/);
    assert.doesNotMatch(exercise, /Ćwicz rozpoznawanie|<h3>|class="field-source"/);
    assert(!exercise.includes(daily.image.page), "source URL may contain the answer");
    assert(!exercise.includes(daily.image.diagnostic), "diagnosis must remain concealed");
    const alt = exercise.match(/alt="([^"]*)"/)?.[1];
    assert.equal(alt, "Zdjęcie z atlasu wybrane do dzisiejszego ćwiczenia");
  }
});
