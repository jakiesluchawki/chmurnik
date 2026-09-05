import assert from "node:assert/strict";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { metarDecodeSections, metarTrainingScenarios, tafTrainingScenarios, aviationBriefingSets } from "../src/data/metar-training.js";
import { loadJsx } from "./helpers/load-jsx.mjs";

const { MetarPanel, TrainingQuestion, formatReviewDue } = await loadJsx(
  new URL("../src/App.jsx", import.meta.url), ["MetarPanel", "TrainingQuestion", "formatReviewDue"],
);

test("METAR modes describe actual exercises and identify synthetic reports at entry", () => {
  const markup = renderToStaticMarkup(createElement(MetarPanel, { onSources() {} }));
  for (const label of ["Odczytaj METAR", "Trening METAR", "Trening 30 s", "Oś czasu TAF", "Porównaj 3 stacje", "Powtórki"])
    assert.ok(markup.includes(label), label);
  assert.match(markup, /Wszystkie depesze tutaj są przykładami szkoleniowymi/);
  assert.match(markup, /Nie są aktualnymi raportami/);
  assert.doesNotMatch(markup, /Rozbiór aktywny|Odprawa 30 s/);
});

test("all training questions keep explanatory feedback concealed until an answer or timeout", () => {
  for (const scenario of [...metarTrainingScenarios, ...tafTrainingScenarios, ...aviationBriefingSets]) {
    for (const question of scenario.questions) {
      const render = (extra) => renderToStaticMarkup(createElement(TrainingQuestion, {
        question, answerIndex: null, onAnswer() {}, onNext() {}, nextLabel: "Następne pytanie", ...extra,
      }));
      assert.doesNotMatch(render({}), /class="metar-feedback/);
      for (const extra of [{ answerIndex: question.correct }, { answerIndex: (question.correct + 1) % 4 }, { timedOut: true }]) {
        const markup = render(extra);
        const plain = renderToStaticMarkup(createElement("p", null, question.explanation));
        assert.ok(markup.includes(plain), question.id);
        assert.match(markup, /aria-live="polite"/);
        assert.match(markup, /class="is-correct " disabled=""/);
      }
    }
  }
});

test("the plus in thunderstorm rain describes precipitation, not thunderstorm severity", () => {
  const weather = metarDecodeSections.find((item) => item.id === "weather");
  assert.equal(weather.examples.find((item) => item.code === "+TSRA").meaning, "burza z silnym deszczem");
  assert.match(weather.syntax, /plus dotyczy deszczu, nie siły burzy/);
});

test("review time labels distinguish one day from several days", () => {
  const now = Date.UTC(2026, 8, 5, 10);
  assert.equal(formatReviewDue(now, now), "teraz");
  assert.equal(formatReviewDue(now + 86400000, now), "za 1 dzień");
  assert.equal(formatReviewDue(now + 2 * 86400000, now), "za 2 dni");
});
