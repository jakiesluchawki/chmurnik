import assert from "node:assert/strict";
import test from "node:test";
import { recognitionMessage } from "../src/lib/recognition-message.js";

const candidate = { name: "Cumulus", headline: "Chmury kłębiaste." };

test("an uncertain result does not turn a leading family into a diagnosis", () => {
  const message = recognitionMessage({ state: "ambiguous", leadingFamily: { id: "clear" } }, candidate);
  assert.equal(message.kind, "ambiguous");
  assert.equal(message.showComparison, true);
  assert.doesNotMatch(message.title, /Cumulus|bez chmur/i);
});

test("only an accepted genus gets the named hypothesis", () => {
  assert.match(recognitionMessage({ state: "hypothesis" }, candidate).title, /Cumulus/);
  assert.match(recognitionMessage({ state: "hypothesis" }, candidate).text, /hipoteza/);
  assert.equal(recognitionMessage({ state: "hypothesis" }).showComparison, false);
});

test("poor illumination is explained separately from classifier accuracy", () => {
  const message = recognitionMessage({ state: "hypothesis", quality: { status: "low_light" } }, candidate);
  assert.equal(message.kind, "limited");
  assert.equal(message.showComparison, false);
  assert.doesNotMatch(message.title, /Cumulus/);
});

test("clear-sky output does not display contradictory cloud hypotheses", () => {
  const message = recognitionMessage({ state: "clear" }, candidate);
  assert.equal(message.kind, "clear");
  assert.equal(message.showComparison, false);
});
