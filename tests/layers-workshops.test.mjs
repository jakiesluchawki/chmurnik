import assert from "node:assert/strict";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { windCaveats, hazardCards, soundingReadingSteps } from "../src/data/layers-copy.js";
import { soundingScenarios, soundingGlossary } from "../src/data/soundings.js";
import { soundingSummary } from "../src/lib/sounding.js";
import { loadJsx } from "./helpers/load-jsx.mjs";

const { WindPanel, HazardsPanel, SoundingPanel, SoundingDiagram } = await loadJsx(
  new URL("../src/App.jsx", import.meta.url), ["WindPanel", "HazardsPanel", "SoundingPanel", "SoundingDiagram"],
);
const render = (Component, props = {}) => renderToStaticMarkup(createElement(Component, { onSources() {}, ...props }));

test("the wind workshop explains its input, opposite direction and non-sensor limits", () => {
  const markup = render(WindPanel);
  assert.match(markup, /nie korzysta z czujników telefonu/);
  assert.match(markup, /wiatr z południowego zachodu \(SW\)/);
  assert.match(markup, /przesuwa się na północny wschód/);
  assert.match(markup, /nie wyznacza jej wysokości ani prędkości wiatru/);
  assert.match(markup, /aria-label="Obserwowane piętro chmur"/);
  for (const [title, copy] of windCaveats) {
    assert.ok(markup.includes(title));
    assert.ok(markup.includes(copy));
  }
});

test("hazards retain all three cases and do not imply a live route-safety assessment", () => {
  const markup = render(HazardsPanel);
  for (const { title, text } of hazardCards) {
    assert.ok(markup.includes(title));
    assert.ok(markup.includes(text));
  }
  assert.match(markup, /nie ocena bezpieczeństwa Twojej trasy/);
  assert.match(markup, /nie pobiera ostrzeżeń ani bieżących danych/);
});

test("the sounding lesson retains its worked cases, plain-language controls and glossary", () => {
  const markup = render(SoundingPanel);
  for (const scenario of soundingScenarios) assert.ok(markup.includes(scenario.title));
  for (const step of soundingReadingSteps) assert.ok(markup.includes(step[2]));
  for (const item of soundingGlossary) assert.ok(markup.includes(item.explanation));
  assert.match(markup, /Nie są pomiarami ani prognozą bieżącej pogody/);
  assert.match(markup, /Unoszona porcja powietrza/);
  assert.match(markup, /nie pomiar jej granic/);
});

test("positive buoyancy at the top is unresolved EL, not an invented equilibrium marker", () => {
  for (const scenario of soundingScenarios.filter((item) => item.levels.elUnresolved)) {
    const upper = scenario.profile.at(-1);
    assert.ok(upper.parcel > upper.temperature, scenario.id);
    assert.ok(scenario.levels.lfc, scenario.id);
    assert.equal(scenario.levels.el, null, scenario.id);
    assert.equal(soundingSummary(scenario).elUnresolved, true);
    const markup = render(SoundingDiagram, { scenario, visible: { environment: true, parcel: true, layers: true, wind: true } });
    assert.doesNotMatch(markup, /sounding-level-(?:line|label) equilibrium|>EL</, scenario.id);
    for (const layer of scenario.cloudLayers) assert.ok(layer.top >= upper.pressure, scenario.id);
  }
  const stable = soundingSummary(soundingScenarios[0]);
  assert.equal(stable.lfc, null);
  assert.equal(stable.elUnresolved, false);
});
