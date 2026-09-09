import test from "node:test";
import assert from "node:assert/strict";
import {
  guideProbes, investigationKey, probeState, readInvestigations,
  recordPrediction, recordObservation, recordEvidence, markInvestigationHelp,
} from "../weather-preview/learning/guide-probes.mjs";

const empty = () => readInvestigations(null);
const input = (patch = {}) => ({ id: "metar", index: 0, answer: 1, state: probeState("metar", 0), token: "first", ...patch });
const predict = (patch = {}) => recordPrediction(empty(), input(patch));
const first = store => store.attempts[0];
const roundtrip = store => readInvestigations(JSON.stringify(store));
function freeze(value) {
  if (value && typeof value === "object") {
    Object.values(value).forEach(freeze);
    Object.freeze(value);
  }
  return value;
}

test("v2 prediction snapshots exact prompts, options, selected text and both answer keys", () => {
  const p = guideProbes.metar[0], record = first(predict());
  assert.equal(investigationKey, "chmurnik-guide-investigations-v1");
  assert.equal(record.schemaVersion, 2);
  assert.equal(record.legacy, false);
  assert.equal(record.question, p.question);
  assert.deepEqual(record.options, p.options);
  assert.equal(record.answerText, p.options[1]);
  assert.equal(record.correctIndex, p.correct);
  assert.equal(record.correct, false);
  assert.equal(record.evidenceQuestion, p.evidence);
  assert.deepEqual(record.evidenceOptions, p.evidenceOptions);
  assert.equal(record.evidenceCorrectIndex, p.evidenceCorrect);
  assert.equal(record.evidence, null);
  assert.equal(record.evidenceText, null);
  assert.equal(record.evidenceCorrect, null);
  assert.equal(record.observedState, null);
  assert.equal(record.predictionHelped, false);
  assert.equal(record.evidenceHelped, false);
});

test("snapshots do not share mutable option arrays or nested input state", () => {
  const state = { terrain: 100, mark: { x: 22, tags: ["sky"] } };
  const store = predict({ id: "wysokosc", state });
  state.mark.x = 99;
  state.mark.tags.push("changed");
  assert.deepEqual(first(store).state, { terrain: 100, mark: { x: 22, tags: ["sky"] } });
  const p = guideProbes.wysokosc[0], beforeOption = p.options[0], beforeEvidence = p.evidenceOptions[0];
  try {
    p.options[0] = "New answer wording";
    p.evidenceOptions[0] = "New evidence wording";
    assert.equal(first(store).options[0], beforeOption);
    assert.equal(first(store).evidenceOptions[0], beforeEvidence);
  } finally {
    p.options[0] = beforeOption;
    p.evidenceOptions[0] = beforeEvidence;
  }
});

test("reading v2 history never regrades against the changed live question", () => {
  const store = recordEvidence(predict(), "first", 0);
  const prior = guideProbes.metar[0];
  try {
    guideProbes.metar[0] = { ...prior, question: "Changed?", options: ["x", "y"], correct: 1, evidence: "Changed reason?", evidenceOptions: ["a", "b"], evidenceCorrect: 0 };
    assert.deepEqual(roundtrip(store), store);
    assert.equal(first(roundtrip(store)).correct, false);
    assert.equal(first(roundtrip(store)).evidenceCorrect, false);
  } finally { guideProbes.metar[0] = prior; }
});

test("evidence uses the stored options and key even when the live rubric removes that answer", () => {
  const store = predict({ index: 2, answer: 1 });
  const old = guideProbes.metar[2];
  try {
    guideProbes.metar[2] = { ...old, evidence: "A different task?", evidenceOptions: ["new zero", "new one"], evidenceCorrect: 0 };
    const after = recordEvidence(roundtrip(store), "first", 2);
    assert.equal(first(after).evidenceCorrect, true);
    assert.equal(first(after).evidenceText, old.evidenceOptions[2]);
    assert.equal(first(after).evidenceQuestion, old.evidence);
    assert.equal(first(after).evidenceCorrectIndex, 2);
    assert.equal(first(after).answerText, first(store).answerText);
    assert.deepEqual(roundtrip(after), after);
  } finally { guideProbes.metar[2] = old; }
});

test("v2 history and pending evidence survive removal of the original guide", () => {
  const store = predict(), old = guideProbes.metar;
  try {
    delete guideProbes.metar;
    assert.deepEqual(roundtrip(store), store);
    const after = recordEvidence(roundtrip(store), "first", first(store).evidenceCorrectIndex);
    assert.equal(first(after).evidenceCorrect, true);
    assert.equal(first(after).correct, false);
  } finally { guideProbes.metar = old; }
});

test("prediction token is immutable; retries append without replacing the first attempt", () => {
  const store = freeze(predict());
  assert.strictEqual(recordPrediction(store, input({ answer: 0, helped: true })), store);
  const retry = recordPrediction(store, input({ answer: 0, helped: true, token: "retry" }));
  assert.equal(retry.attempts.length, 2);
  assert.deepEqual(first(retry), first(store));
  assert.equal(retry.attempts[1].correct, true);
  assert.equal(retry.attempts[1].predictionHelped, true);
});

test("actual observed state is recorded once, not reconstructed from the target", () => {
  const store = freeze(predict({ id: "wysokosc", index: 1, state: { terrain: 1300 } }));
  const actual = { terrain: 1600, marker: { x: 12, y: 18 } };
  const after = recordObservation(store, "first", actual);
  actual.terrain = 1800;
  actual.marker.x = 60;
  assert.deepEqual(first(after).observedState, { terrain: 1600, marker: { x: 12, y: 18 } });
  assert.deepEqual(first(after).state, { terrain: 1300 });
  assert.equal(first(after).observedState.terrain === probeState("wysokosc", 1, true).terrain, false);
  assert.strictEqual(recordObservation(after, "first", { terrain: 2000 }, { setupUsed: true }), after);
  assert.equal(first(after).setupUsed, false);
});

test("setup use is recorded separately and does not grant a score or mark cognitive help", () => {
  const store = freeze(predict());
  const after = recordObservation(store, "first", probeState("metar", 0, true), { setupUsed: true });
  assert.equal(first(after).setupUsed, true);
  assert.equal(first(after).correct, false);
  assert.equal(first(after).predictionHelped, false);
  assert.equal(first(after).evidenceHelped, false);
  assert.equal(first(after).evidence, null);
  assert.equal(first(store).observedState, null);
});

test("help used before prediction stays attached to the prediction and carries into evidence", () => {
  const store = predict({ helped: true });
  assert.equal(first(store).predictionHelped, true);
  const after = recordEvidence(store, "first", first(store).evidenceCorrectIndex);
  assert.equal(first(after).predictionHelped, true);
  assert.equal(first(after).evidenceHelped, true);
});

test("opening help after prediction changes evidence assistance, not the prediction", () => {
  const store = freeze(predict());
  const after = markInvestigationHelp(store, "first", "hint");
  assert.equal(first(after).predictionHelped, false);
  assert.equal(first(after).correct, false);
  assert.equal(first(after).answerText, first(store).answerText);
  assert.equal(first(after).evidenceHelped, true);
  assert.deepEqual(first(after).evidenceHelpKinds, ["hint"]);
  assert.strictEqual(markInvestigationHelp(after, "first", "hint"), after);
  const completed = recordEvidence(after, "first", first(after).evidenceCorrectIndex);
  assert.equal(first(completed).evidenceHelped, true);
  assert.equal(first(completed).predictionHelped, false);
});

test("descriptive alternative after prediction is separately identified as evidence help", () => {
  const store = predict();
  const after = markInvestigationHelp(store, "first", "description");
  assert.equal(first(after).descriptionUsed, true);
  assert.equal(first(after).evidenceHelped, true);
  assert.equal(first(after).predictionHelped, false);
  assert.deepEqual(first(after).evidenceHelpKinds, ["description"]);
  const completed = recordEvidence(after, "first", 1);
  assert.equal(first(completed).descriptionUsed, true);
  assert.equal(first(completed).predictionHelped, false);
});

test("recordEvidence fourth argument logs late help without changing prediction or scoring help as correctness", () => {
  const store = freeze(predict());
  const after = recordEvidence(store, "first", 0, { helped: true, descriptionUsed: true });
  assert.equal(first(after).evidence, 0);
  assert.equal(first(after).evidenceText, first(store).evidenceOptions[0]);
  assert.equal(first(after).evidenceCorrect, false);
  assert.equal(first(after).correct, false);
  assert.equal(first(after).predictionHelped, false);
  assert.equal(first(after).evidenceHelped, true);
  assert.equal(first(after).descriptionUsed, true);
  assert.deepEqual(first(after).evidenceHelpKinds, ["help", "description"]);
});

test("descriptionUsed alone counts as help while default old signatures still work", () => {
  const store = predict();
  const plain = recordEvidence(store, "first", 1);
  assert.equal(first(plain).evidenceCorrect, true);
  assert.equal(first(plain).evidenceHelped, false);
  const described = recordEvidence(store, "first", 1, { descriptionUsed: true });
  assert.equal(first(described).evidenceHelped, true);
  assert.equal(first(described).predictionHelped, false);
});

test("evidence answer and assistance status cannot be retroactively rewritten", () => {
  const store = freeze(recordEvidence(predict(), "first", 0));
  assert.strictEqual(recordEvidence(store, "first", 1, { helped: true, descriptionUsed: true }), store);
  assert.strictEqual(markInvestigationHelp(store, "first", "description"), store);
  assert.equal(first(store).evidence, 0);
  assert.equal(first(store).evidenceHelped, false);
});

test("help and observation cannot create a prediction record", () => {
  const store = empty();
  assert.strictEqual(markInvestigationHelp(store, "missing", "hint"), store);
  assert.strictEqual(recordObservation(store, "missing", { terrain: 100 }), store);
  assert.strictEqual(recordEvidence(store, "missing", 0), store);
  const uncommitted = { version: 1, attempts: [{ token: "draft", evidence: null }] };
  assert.strictEqual(markInvestigationHelp(uncommitted, "draft", "hint"), uncommitted);
  assert.strictEqual(recordObservation(uncommitted, "draft", { terrain: 100 }), uncommitted);
});

test("complete v2 records roundtrip including exact evidence text, help and observed state", () => {
  let store = predict({ helped: true });
  store = recordObservation(store, "first", { cover: "BKN", base: 20, marker: [20, 40] }, { setupUsed: true });
  store = markInvestigationHelp(store, "first", "description");
  store = recordEvidence(store, "first", 1, { helped: true });
  assert.deepEqual(roundtrip(store), store);
  assert.deepEqual(roundtrip(roundtrip(store)), store);
  assert.equal(store.version, 1);
});

test("legacy history remains explicitly legacy without invented snapshots or rescoring", () => {
  const legacy = { id: "metar", index: 0, token: "old", answer: 1, state: { cover: "SCT", base: 20 }, correct: true, evidence: 0, evidenceCorrect: true };
  const loaded = readInvestigations(JSON.stringify({ version: 1, attempts: [legacy] }));
  assert.deepEqual(first(loaded), { ...legacy, schemaVersion: 1, legacy: true });
  assert.equal("question" in first(loaded), false);
  assert.equal("answerText" in first(loaded), false);
  assert.equal("predictionHelped" in first(loaded), false);
  assert.equal("observedState" in first(loaded), false);
  assert.deepEqual(roundtrip(loaded), loaded);
  assert.strictEqual(recordEvidence(loaded, "old", 1, { helped: true }), loaded);
});

test("legacy records survive changed or removed cases without using current answer indices", () => {
  const legacy = { id: "retired-guide", index: 42, token: "retired", answer: 7, correct: false, evidence: 5, evidenceCorrect: true };
  const loaded = readInvestigations(JSON.stringify({ version: 1, attempts: [legacy] }));
  assert.deepEqual(first(loaded), { ...legacy, schemaVersion: 1, legacy: true });
  assert.deepEqual(roundtrip(loaded), loaded);
});

test("only a new unanswered legacy explanation may snapshot today's question; old prediction stays legacy", () => {
  const legacy = { id: "metar", index: 0, token: "old-open", answer: 1, correct: true, evidence: null };
  const loaded = readInvestigations(JSON.stringify({ version: 1, attempts: [legacy] }));
  const after = recordEvidence(loaded, "old-open", 1);
  assert.equal(first(after).schemaVersion, 1);
  assert.equal(first(after).legacy, true);
  assert.equal(first(after).correct, true);
  assert.equal("question" in first(after), false);
  assert.equal("answerText" in first(after), false);
  assert.equal(first(after).evidenceQuestion, guideProbes.metar[0].evidence);
  assert.equal(first(after).evidenceText, guideProbes.metar[0].evidenceOptions[1]);
  assert.equal(first(after).evidenceCorrect, true);
  assert.deepEqual(roundtrip(after), after);
});

test("malformed v2 snapshots are not downgraded to legacy or repaired with today's rubric", () => {
  const valid = first(predict());
  const broken = [
    { ...valid, options: null }, { ...valid, answerText: "not selected" }, { ...valid, correctIndex: 99 },
    { ...valid, evidenceOptions: [] }, { ...valid, evidenceCorrectIndex: -1 }, { ...valid, evidenceQuestion: undefined },
    { ...valid, observedState: [] }, { ...valid, schemaVersion: 3 }, { ...valid, predictionHelped: "false" },
    { ...valid, evidence: 1, evidenceText: "wrong text", evidenceCorrect: true },
  ];
  assert.equal(readInvestigations(JSON.stringify({ version: 1, attempts: broken })).attempts.length, 0);
  assert.deepEqual(roundtrip({ version: 1, attempts: [valid] }), { version: 1, attempts: [valid] });
});

test("invalid choices and tokens leave records unchanged", () => {
  const store = freeze(predict());
  for (const answer of [-1, 99, 1.5, "1", null, NaN]) {
    assert.strictEqual(recordPrediction(store, input({ token: "invalid", answer })), store);
    assert.strictEqual(recordEvidence(store, "first", answer, { helped: true }), store);
  }
  for (const token of ["", " ", null, 1]) assert.strictEqual(recordPrediction(store, input({ token })), store);
  for (const id of ["", "constructor", "removed", null, {}, 1]) assert.strictEqual(recordPrediction(store, input({ token: "bad-id", id })), store);
  for (const kind of ["", " ", null, 1]) assert.strictEqual(markInvestigationHelp(store, "first", kind), store);
});

test("state snapshots reject non-JSON values instead of silently changing the actual observation", () => {
  const store = predict(), cyclic = {}, extraArray = [1, 2];
  cyclic.self = cyclic;
  extraArray.note = "not a JSON array element";
  for (const state of [null, [], { n: NaN }, { n: Infinity }, { n: undefined }, { f: () => {} }, { n: 1n }, { when: new Date(0) }, { sparse: new Array(2) }, { extraArray }, cyclic]) {
    assert.strictEqual(recordObservation(store, "first", state), store);
    if (state !== null) assert.strictEqual(recordPrediction(store, input({ token: "bad", state })), store);
  }
  assert.deepEqual(first(predict({ state: undefined })).state, {});
  assert.deepEqual(first(recordObservation(store, "first", { n: 0, absent: null, flags: [false, true] })).observedState, { n: 0, absent: null, flags: [false, true] });
});
