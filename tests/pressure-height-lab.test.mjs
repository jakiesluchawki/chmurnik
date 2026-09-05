import assert from "node:assert/strict";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { pressureLevels } from "../src/data/weather-layers.js";
import { loadJsx } from "./helpers/load-jsx.mjs";

const { PressureHeightLab } = await loadJsx(new URL("../src/components/PressureHeightLab.jsx", import.meta.url));
const render = (pressure, terrain) => renderToStaticMarkup(createElement(PressureHeightLab, {
  pressure, terrain, setPressure() {}, setTerrain() {},
}));

test("pressure levels below terrain never become zero AGL or an above-ground bracket", () => {
  for (const [pressure, level] of Object.entries(pressureLevels)) {
    const markup = render(Number(pressure), level.altitude + 100);
    assert.match(markup, />Poniżej terenu</);
    assert.match(markup, /nie przedstawia warstwy swobodnego powietrza/);
    assert.doesNotMatch(markup, /class="agl-bracket"|>0 m AGL</);
  }
});

test("a level touching terrain is distinguished from one below it", () => {
  const markup = render(925, pressureLevels[925].altitude);
  assert.match(markup, />Na wysokości terenu</);
  assert.doesNotMatch(markup, /class="agl-bracket"|>Poniżej terenu</);
});

test("positive heights retain their actual difference and explain the schematic limits", () => {
  const markup = render(850, 300);
  assert.ok(markup.includes(`${(1460 - 300).toLocaleString("pl-PL")} m AGL`));
  assert.match(markup, /class="agl-bracket"/);
  assert.doesNotMatch(markup, /nie przedstawia warstwy swobodnego powietrza/);
  assert.match(markup, /Schemat szkoleniowy/);
  assert.match(markup, /nie aktualnym pomiarem/);
  assert.match(markup, /aria-pressed="true"[^>]*>850 hPa</);
});
