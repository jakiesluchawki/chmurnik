import assert from "node:assert/strict";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { loadJsx } from "./helpers/load-jsx.mjs";

const { ObservationDetail, ObservationForm } = await loadJsx(
  new URL("../src/components/SkyCollection.jsx", import.meta.url), ["ObservationDetail", "ObservationForm"],
);

test("saved analysis keeps percentages inside closed details, not in the main answer", () => {
  const entry = { id: "saved-1", date: "2026-09-05", location: "", evidence: "", hasPhoto: true,
    confirmedCloudId: null, favorite: false, hypothesis: { state: "uncertain", family: "Piętro średnie",
      modelVersion: "old-model", candidates: [{ id: "altostratus", probability: .28 }] } };
  const markup = renderToStaticMarkup(createElement(ObservationDetail, { entry, onBack() {}, onChange() {}, navigate() {} }));
  const detailsStart = markup.indexOf('<details class="photo-technical">');
  const detailsEnd = markup.indexOf("</details>", detailsStart);
  assert.ok(detailsStart >= 0);
  assert.match(markup.slice(detailsStart, detailsEnd), /28%/);
  assert.match(markup.slice(detailsStart, detailsEnd), /nie prawdopodobieństwo poprawnego rozpoznania/);
  assert.doesNotMatch(markup.slice(0, detailsStart), /28%/);
  assert.match(markup, /Obserwacja bez rozpoznania/);
  assert.match(markup, /Otwórz opis w atlasie/);
  assert.match(markup, /Zapisz zmiany w formularzu/);
});

test("the manual observation form explains that attaching a photo does not run recognition", () => {
  const markup = renderToStaticMarkup(createElement(ObservationForm, { onSaved() {}, onCancel() {} }));
  assert.match(markup, /nie jest automatycznie analizowane/);
  assert.match(markup, /Nazwa chmury nie jest wymagana/);
  assert.match(markup, /Nie wiem, jaki to rodzaj/);
});

test("a legacy clear-sky entry keeps tiny cloud scores only in the raw technical record", () => {
  const entry = { id: "old-clear", date: "2026-09-05", location: "", evidence: "", hasPhoto: false,
    confirmedCloudId: null, favorite: false, hypothesis: { state: "clear", family: "Bezchmurne",
      modelVersion: "old-model", candidates: [{ id: "cumulus", probability: .01 }] } };
  const markup = renderToStaticMarkup(createElement(ObservationDetail, { entry, onBack() {}, onChange() {}, navigate() {} }));
  const mainAnswer = markup.slice(0, markup.indexOf('<details class="photo-technical">'));
  assert.match(mainAnswer, /Bez wyraźnych chmur/);
  assert.doesNotMatch(mainAnswer, /Cumulus|Otwórz opis w atlasie|Porównaj opisy/);
  assert.match(markup, /1%/);
});
