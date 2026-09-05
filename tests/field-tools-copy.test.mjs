import assert from "node:assert/strict";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { tafExamples, practiceCases } from "../src/data/field-practice.js";
import { decodeAviationReport } from "../src/lib/taf-reader.js";
import { loadJsx } from "./helpers/load-jsx.mjs";

const { AviationReader, MapWorkbench, WindWorkbench, PracticeChallenge } = await loadJsx(
  new URL("../src/components/FieldPractice.jsx", import.meta.url), ["AviationReader", "MapWorkbench"],
);
const { TafForecast } = await loadJsx(new URL("../src/components/TafForecast.jsx", import.meta.url));
const render = (Component, props = {}) => renderToStaticMarkup(createElement(Component, { onSources() {}, ...props }));

test("the report reader explains local decoding and labels examples without pretending to fetch weather", () => {
  const markup = render(AviationReader);
  for (const text of ["Czytnik depesz na urządzeniu", "nie pobiera aktualnej pogody", "Wyjaśnij depeszę", "Przykład szkoleniowy", "Temperatura / punkt rosy"])
    assert.ok(markup.includes(text), text);
  assert.doesNotMatch(markup, /nie live|Syntetyczny przykład|Temperatura \/ rosa/);
  assert.match(markup, /Wybierz fragment depeszy/);
});

test("wind instructions distinguish moving-boat wind and runway components with geographic units", () => {
  const sailing = render(WindWorkbench);
  assert.match(sailing, /wiatr odczuwany przez poruszającą się załogę/);
  assert.match(sailing, /nie pomiar telefonem/);
  const runway = render(WindWorkbench, { fixed: true, reportWind: { from: 90, speed: 12, gust: 20 } });
  assert.match(runway, /Wiatr pochodzi z wklejonej depeszy/);
  assert.match(runway, /Nie są to dopuszczalne limity dla samolotu/);
  assert.match(runway, /Kierunki °T odnoszą się do północy geograficznej/);
  assert.doesNotMatch(runway, /Prędkość jachtu/);
});

test("map examples stay fictional and practice progress does not claim mastery", () => {
  const map = render(MapWorkbench);
  assert.match(map, /Wszystkie liczby są wymyślone do ćwiczenia/);
  assert.match(map, /modele A i B nie są prawdziwymi modelami pogody/);
  assert.match(map, /Za ile godzin/);
  for (const track of new Set(practiceCases.map((item) => item.track))) {
    const markup = render(PracticeChallenge, { track });
    assert.match(markup, /ostatnio poprawnych/);
    assert.doesNotMatch(markup, /opanowane/);
    assert.equal((markup.match(/class="field-explanation"/g) || []).length, 0);
  }
});

test("all TAF examples retain separated time periods and cancelled or absent forecasts remain explicit", () => {
  for (const example of tafExamples) {
    const result = decodeAviationReport(example.report);
    const markup = render(TafForecast, { result });
    assert.match(markup, /Warunki w kolejnych godzinach/);
    assert.match(markup, /PROB opisuje możliwy wariant/);
    assert.equal((markup.match(/class="field-taf-kind"/g) || []).length, result.segments.length);
  }
  for (const status of ["NIL", "CNL"]) {
    const markup = render(TafForecast, { result: decodeAviationReport(`TAF EPWA 261130Z 2612/2712 ${status}`) });
    assert.ok(markup.includes(`${status}:`));
    assert.doesNotMatch(markup, /field-taf-timeline/);
  }
});
