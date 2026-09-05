import assert from "node:assert/strict";
import test from "node:test";
import { recognitionMessage } from "../src/lib/recognition-message.js";
import { cloudComparisonCandidates, interpretCloudProbabilities } from "../src/lib/photo-recognition.js";

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

test("uncalibrated clear-leading scores neither claim clear sky nor promote tiny cloud alternatives", () => {
  const result = interpretCloudProbabilities([.001, .001, .001, .001, .001, .001, .001, .001, .008, .004, .98],
    { minimumConfidence: 1.01, marginThreshold: .51 });
  assert.equal(result.state, "ambiguous");
  assert.deepEqual(cloudComparisonCandidates(result), []);
  const message = recognitionMessage(result, candidate);
  assert.equal(message.kind, "ambiguous");
  assert.equal(message.showComparison, false);
  assert.match(message.text, /nie wystarcza/);
  assert.match(message.text, /po cechach/);
  assert.doesNotMatch(message.title, /Bez wyraźnych chmur/);
  assert.equal(result.ranked[0].id, "clear_sky");
});

test("comparison retains real cloud alternatives without changing uncertain scores", () => {
  const result = { state: "ambiguous", ranked: [{ id: "cumulus", probability: .5 },
    { id: "clear_sky", probability: .3 }, { id: "stratocumulus", probability: .2 }] };
  assert.deepEqual(cloudComparisonCandidates(result), [result.ranked[0], result.ranked[2]]);
  assert.equal(recognitionMessage(result, candidate).showComparison, true);
  assert.deepEqual(cloudComparisonCandidates({ ...result, quality: { status: "low_light" } }), []);
  assert.deepEqual(cloudComparisonCandidates(), []);
  const message = recognitionMessage({ state: "ambiguous" });
  assert.equal(message.showComparison, false);
  assert.doesNotMatch(message.text, /Poniżej/);
});
