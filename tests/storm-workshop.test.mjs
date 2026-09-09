import test from "node:test";
import assert from "node:assert/strict";
import { stormTrials, environmentAt, stormParcel, initialResponse, inTrialWindow, appendStormAttempt, recordStormEvidence, illustrativeProgress } from "../weather-preview/learning/storm-model.mjs";

test("storm profile interpolation and height limits are explicit", () => {
  assert.equal(environmentAt("cap", 1000), 20);
  assert.equal(environmentAt("cap", -100), 26);
  assert.equal(environmentAt("cap", 6000), -14);
});
test("condensation is not evidence of continued thermal ascent", () => {
  const a = stormParcel("cap", 70, 1500), b = stormParcel("cap", 70, 3000);
  assert.ok(a.opacity > 0.9);
  assert.equal(a.tendency, "down");
  assert.equal(b.tendency, "up");
  assert.equal(a.base, b.base);
  assert.equal(stormParcel("open", 70, 1500).tendency, "up");
});
test("assessment cases use new conditions with opposite outcomes throughout their windows", () => {
  for (const [id, expected] of [["d", "down"], ["e", "up"]]) {
    const trial = stormTrials.find(t => t.id === id);
    assert.equal(trial.guide, false);
    for (let h = trial.target - 100; h <= trial.target + 100; h += 10) {
      assert.equal(stormParcel(trial.profile, trial.humidity, h).tendency, expected);
      assert.ok(inTrialWindow(trial, h));
    }
    assert.equal(inTrialWindow(trial, trial.target + 110), false);
  }
});
test("cloud appears continuously only above condensation and response is a bounded illustration", () => {
  const { base } = stormParcel("cap", 70, 0);
  assert.equal(stormParcel("cap", 70, base).opacity, 0);
  assert.ok(stormParcel("cap", 70, base + 10).opacity < 0.03);
  for (const trial of stormTrials) {
    const result = initialResponse(trial.profile, trial.humidity, trial.target);
    assert.ok(Math.abs(result.end - result.height) <= 200);
    assert.equal(Math.sign(result.end - result.height), result.tendency === "up" ? 1 : -1);
  }
  assert.equal(initialResponse("cap", 70, 0).end, 0);
});
test("repeating a trial preserves the original prediction and evidence", () => {
  const first = appendStormAttempt([], { trial: "d", prediction: "up", correct: false, helped: false });
  const second = appendStormAttempt(first, { trial: "d", prediction: "down", correct: true, helped: true });
  assert.deepEqual(second[0], first[0]);
  assert.equal(second[1].attempt, 2);
  assert.equal(first.length, 1);
});
test("explanation help cannot rewrite independent prediction or the first explanation", () => {
  const prediction = [{ id: "first", trial: "d", prediction: "up", correct: false, helped: false }];
  const explained = recordStormEvidence(prediction, "first", "down", true, true);
  assert.equal(explained[0].helped, false);
  assert.equal(explained[0].evidenceHelped, true);
  assert.equal(explained[0].correct, false);
  assert.equal(prediction[0].evidence, undefined);
  assert.deepEqual(recordStormEvidence(explained, "first", "up", false, false), explained);
});
test("illustrative motion starts from rest and has exact bounded endpoints", () => {
  assert.equal(illustrativeProgress(0), 0);
  assert.equal(illustrativeProgress(1), 1);
  assert.equal(illustrativeProgress(-1), 0);
  assert.equal(illustrativeProgress(2), 1);
  assert.ok(illustrativeProgress(0.001) / 0.001 < 0.003);
  let last = 0;
  for (let i = 0; i <= 100; i++) { const value = illustrativeProgress(i / 100); assert.ok(value >= last); last = value; }
});
