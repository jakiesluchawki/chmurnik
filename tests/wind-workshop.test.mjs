import test from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createServer } from "vite";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  windStations, windSources, windPosition, wavePosition, waveTrail, windOrigin, windFrameDescription, canReadSequence,
  saveWindObservation, saveWindEvidence, readWindRecords, createWindSession, currentWindRecord, updateWindSession,
  readWindSession, mergeWindRecords, loadWindSession, persistWindSession, windSessionKey, windWorkshopKey,
} from "../weather-preview/learning/wind-workshop.mjs";

const act = (state, ...actions) => actions.reduce(updateWindSession, state);
function decide(state, answer = windStations[state.index].correct) {
  return act(state, { type: "frame", frame: 2 }, { type: "answer", answer }, { type: "commit" });
}
function finish(state, answer = windStations[state.index].correctEvidence) {
  return act(state, { type: "evidence", answer }, { type: "explain" });
}
function storageFixture(initial = []) {
  const data = new Map(initial);
  return { data, getItem: key => data.get(key) ?? null, setItem: (key, value) => data.set(key, value) };
}

test("wind coordinates retain the three existing cases and distinguish travel from source", () => {
  const start = windPosition(90, 0), end = windPosition(90, 2);
  assert.equal(end.x - start.x, 210); assert.equal(end.y, start.y);
  assert.deepEqual(windStations.map(s => [s.id, s.lower, s.upper]), [["drift", 90, null], ["layers", 90, 225], ["wave", 90, null]]);
  assert.equal(windOrigin(90), 270); assert.equal(windOrigin(225), 45);
  assert.ok(windPosition(225, 2).x < windPosition(225, 0).x);
  assert.ok(windPosition(225, 2).y > windPosition(225, 0).y);
  assert.deepEqual(wavePosition(0), { x: 150, y: 163 });
  assert.deepEqual(wavePosition(1), { x: 300, y: 104 });
  assert.deepEqual(wavePosition(2), { x: 450, y: 163 });
});

test("all compass origins stay reciprocal without implying an operational calm code", () => {
  for (let direction = -360; direction <= 720; direction += 45) {
    const origin = windOrigin(direction);
    assert.ok(origin >= 0 && origin < 360);
    assert.equal((origin - direction + 1080) % 360, 180);
  }
  assert.equal(windStations[0].options.find(([id]) => id === "0")[1], "Z północy");
});

test("wave trail ends at the current observation, never at a future position", () => {
  assert.equal(waveTrail(0), "M150 163Q150 163 150 163");
  assert.equal(waveTrail(1), "M150 163Q225 104 300 104");
  assert.equal(waveTrail(2), "M150 163Q300 45 450 163");
  assert.deepEqual(wavePosition(-1), wavePosition(0));
  assert.deepEqual(wavePosition(5), wavePosition(2));
  assert.deepEqual(windPosition(90, NaN), windPosition(90, 0));
  assert.deepEqual(wavePosition(Infinity), wavePosition(0));
});

test("current-frame descriptions give equivalent raw evidence without naming its interpretation", () => {
  for (const station of windStations) {
    for (let frame = 0; frame <= 2; frame++) {
      const label = windFrameDescription(station, frame);
      assert.match(label, /Współrzędne rysunku/);
      assert.doesNotMatch(label, /nieruchom|falow|stojąc|z zachodu|na wschód|km\/h|m\/s|NaN|Infinity/);
    }
  }
  assert.match(windFrameDescription(windStations[0], 0), /Znacznik 1: x 195, y 188/);
  assert.match(windFrameDescription(windStations[0], 0), /północ u góry, wschód po prawej/);
  assert.match(windFrameDescription(windStations[1], 2), /Znacznik 2: x 226, y 216/);
  assert.doesNotMatch(windFrameDescription(windStations[2], 0), /450|300/);
});

test("observing start and end is required but does not count as success", () => {
  assert.equal(canReadSequence(null), false);
  assert.equal(canReadSequence([0, 1]), false);
  assert.equal(canReadSequence([0, 2]), true);
  const initial = createWindSession();
  assert.strictEqual(updateWindSession(initial, { type: "answer", answer: "270" }), initial);
  assert.strictEqual(updateWindSession(initial, { type: "commit" }), initial);
  assert.strictEqual(updateWindSession(initial, { type: "frame", frame: 1.5 }), initial);
  const observed = updateWindSession(initial, { type: "frame", frame: 2 });
  assert.equal(observed.records.length, 0);
  assert.strictEqual(updateWindSession(observed, { type: "commit" }), observed);
  assert.strictEqual(updateWindSession(observed, { type: "next" }), observed);
});

test("repeating an observation preserves a wrong first decision", () => {
  const first = saveWindObservation([], "drift", "90");
  const repeated = saveWindObservation(first, "drift", "270");
  assert.equal(first.length, 1); assert.equal(repeated.length, 2);
  assert.equal(repeated[0].correct, false); assert.equal(repeated[0].repeated, false);
  assert.equal(repeated[1].correct, true); assert.equal(repeated[1].repeated, true);
  assert.strictEqual(saveWindObservation(first, "drift", "invalid"), first);
  assert.strictEqual(saveWindObservation(first, "unknown", "90"), first);
});

test("an attempt id makes repeated submission idempotent", () => {
  const first = saveWindObservation([], "drift", "90", { id: "attempt-a", seen: [0, 2] });
  assert.strictEqual(saveWindObservation(first, "drift", "270", { id: "attempt-a" }), first);
  assert.equal(first[0].legacy, false);
  assert.deepEqual(first[0].seen, [0, 2]);
});

test("evidence is separately immutable and cannot precede the primary decision", () => {
  const empty = [];
  assert.strictEqual(saveWindEvidence(empty, "missing", "east"), empty);
  const first = saveWindObservation([], "drift", "90", { id: "attempt-a", seen: [0, 2] });
  const withEvidence = saveWindEvidence(first, "attempt-a", "west");
  assert.equal(first[0].evidence, undefined);
  assert.equal(withEvidence[0].evidenceCorrect, false);
  assert.strictEqual(saveWindEvidence(withEvidence, "attempt-a", "east"), withEvidence);
  assert.strictEqual(saveWindEvidence(first, "attempt-a", "invalid"), first);
});

test("all three cases require a committed conclusion then committed evidence", () => {
  let state = createWindSession();
  for (const [index, station] of windStations.entries()) {
    assert.equal(state.index, index);
    assert.strictEqual(updateWindSession(state, { type: "evidence", answer: station.correctEvidence }), state);
    state = decide(state);
    assert.equal(currentWindRecord(state).correct, true);
    assert.strictEqual(updateWindSession(state, { type: "next" }), state);
    assert.strictEqual(updateWindSession(state, { type: "commit" }), state);
    assert.strictEqual(updateWindSession(state, { type: "answer", answer: station.options[0][0] }), state);
    assert.strictEqual(updateWindSession(state, { type: "explain" }), state);
    state = finish(state);
    assert.equal(currentWindRecord(state).evidenceCorrect, true);
    assert.strictEqual(updateWindSession(state, { type: "explain" }), state);
    if (index < 2) state = updateWindSession(state, { type: "next" });
  }
  assert.equal(state.records.length, 3);
  assert.strictEqual(updateWindSession(state, { type: "next" }), state);
});

test("wrong conclusion and wrong evidence survive replay, retry and later success", () => {
  const first = finish(decide(createWindSession(), "90"), "west");
  const snapshot = structuredClone(first.records);
  let retry = updateWindSession(first, { type: "retry" });
  assert.equal(retry.frame, 0);
  assert.deepEqual(retry.seen, [0]);
  assert.equal(retry.draft, null);
  assert.notEqual(retry.attemptId, first.attemptId);
  retry = finish(decide(retry));
  assert.deepEqual(first.records, snapshot);
  assert.deepEqual(retry.records[0], snapshot[0]);
  assert.equal(retry.records[1].repeated, true);
  assert.equal(retry.records[1].helped, true);
  assert.equal(retry.records[1].correct, true);
  assert.equal(retry.records[1].evidenceCorrect, true);
});

test("help before a decision and help only before evidence remain distinct", () => {
  const before = finish(decide(updateWindSession(createWindSession(), { type: "help", open: true })));
  assert.equal(currentWindRecord(before).helped, true);
  assert.equal(currentWindRecord(before).evidenceHelped, true);
  const decision = decide(createWindSession());
  const original = structuredClone(currentWindRecord(decision));
  const after = finish(updateWindSession(decision, { type: "help", open: true }));
  assert.deepEqual(currentWindRecord(decision), original);
  assert.equal(currentWindRecord(after).helped, false);
  assert.equal(currentWindRecord(after).evidenceHelped, true);
});

test("after the third case learners can revisit the first without clearing their history", () => {
  let state = createWindSession();
  assert.strictEqual(updateWindSession(state, { type: "restart" }), state);
  for (let index = 0; index < 3; index++) {
    state = finish(decide(state));
    if (index < 2) state = updateWindSession(state, { type: "next" });
  }
  const restarted = updateWindSession(state, { type: "restart" });
  assert.equal(restarted.index, 0);
  assert.equal(restarted.helped, true);
  assert.equal(currentWindRecord(restarted), undefined);
  assert.deepEqual(restarted.records, state.records);
  assert.deepEqual(restarted.seen, [0]);
});

test("closing help or restarting an unfinished observation does not erase exposure", () => {
  const helped = act(createWindSession(), { type: "help", open: true }, { type: "help", open: false }, { type: "retry" });
  assert.equal(helped.helpOpen, false);
  assert.equal(helped.helped, true);
  assert.equal(currentWindRecord(decide(helped)).helped, true);
});

test("reload restores drafts, observed frames, locked decisions and independent-practice mode", () => {
  const draft = act(createWindSession(), { type: "frame", frame: 2 }, { type: "answer", answer: "90" });
  assert.deepEqual(readWindSession(JSON.parse(JSON.stringify(draft))), draft);
  const locked = act(decide(draft, "90"), { type: "evidence", answer: "west" }, { type: "mode", mode: "assessment" });
  const restored = readWindSession(JSON.parse(JSON.stringify(locked)));
  assert.deepEqual(restored, locked);
  assert.equal(restored.mode, "assessment");
  assert.strictEqual(updateWindSession(restored, { type: "answer", answer: "270" }), restored);
});

test("record restoration rejects invalid answers and recomputes derived outcomes", () => {
  const restored = readWindRecords([
    null, { station: "unknown", answer: "270" }, { station: "drift", answer: "invalid" },
    { id: "first", station: "drift", answer: "90", correct: true, repeated: true, seen: [0, 0, 2, 5, "2"], evidence: "west", evidenceCorrect: true },
    { id: "first", station: "drift", answer: "270" }, { station: "drift", answer: "270", correct: false, repeated: false },
  ]);
  assert.equal(restored.length, 2);
  assert.equal(restored[0].correct, false); assert.equal(restored[0].evidenceCorrect, false);
  assert.equal(restored[0].repeated, false); assert.equal(restored[1].repeated, true);
  assert.equal(restored[1].legacy, true);
  assert.deepEqual(restored[0].seen, [0, 2]);
  assert.deepEqual(readWindRecords(restored), restored);
});

test("malformed session fields cannot inject completion or an answer from another case", () => {
  const value = { version: 2, records: [{ id: "old", station: "layers", answer: "different" }], index: 0, frame: 8,
    seen: [1.5, "2", -1], attemptId: "old", draft: "flow", evidenceDraft: "air", mode: "bad", helpOpen: true };
  const restored = readWindSession(value);
  assert.equal(restored.mode, "guide"); assert.equal(restored.frame, 0);
  assert.deepEqual(restored.seen, [0]);
  assert.equal(restored.draft, null); assert.equal(restored.evidenceDraft, null);
  assert.equal(restored.helped, true); assert.equal(currentWindRecord(restored), undefined);
  assert.notEqual(restored.attemptId, "old");
  assert.equal(readWindSession({ version: 2, index: -1 }).index, 0);
});

test("merging by identity keeps the original primary and evidence, including equal-length records", () => {
  const original = finish(decide(createWindSession(), "90"), "west");
  const altered = [{ ...original.records[0], answer: "270", correct: true, evidence: "east", evidenceCorrect: true }];
  assert.deepEqual(mergeWindRecords(original.records, altered), original.records);
  const other = decide(createWindSession());
  const merged = mergeWindRecords(original.records, other.records);
  assert.equal(merged.length, 2);
  assert.deepEqual(merged[0], original.records[0]);
  assert.equal(merged[1].repeated, true);
  const pending = decide(createWindSession());
  assert.equal(mergeWindRecords(pending.records, finish(pending).records)[0].evidence, "east");
});

test("legacy v1 history migrates without overwriting it or inventing help provenance", () => {
  const raw = JSON.stringify([{ station: "drift", answer: "90", correct: true, repeated: false }]);
  const storage = storageFixture([[windWorkshopKey, raw]]);
  const loaded = loadWindSession(storage);
  assert.equal(loaded.records[0].correct, false);
  assert.equal(loaded.records[0].legacy, true);
  const saved = persistWindSession(decide(loaded), storage);
  assert.equal(saved.durable, true);
  assert.equal(storage.getItem(windWorkshopKey), raw);
  assert.equal(loadWindSession(storage).records.length, 2);
  assert.equal(loadWindSession(storage).records[1].repeated, true);
});

test("persisted pending evidence resumes with exactly one primary record", () => {
  const storage = storageFixture();
  const saved = persistWindSession(decide(createWindSession(), "90"), storage);
  const resumed = loadWindSession(storage);
  assert.deepEqual(resumed, saved.state);
  assert.strictEqual(updateWindSession(resumed, { type: "commit" }), resumed);
  const done = persistWindSession(finish(resumed, "west"), storage);
  assert.equal(done.state.records.length, 1);
  assert.deepEqual(loadWindSession(storage).records, done.state.records);
});

test("stale views cannot remove help recorded before a primary decision", () => {
  const storage = storageFixture(), start = createWindSession();
  persistWindSession(updateWindSession(start, { type: "help", open: true }), storage);
  const saved = persistWindSession(decide(start), storage);
  assert.equal(currentWindRecord(saved.state).helped, true);
  assert.equal(saved.state.helped, true);
});

test("stale evidence writes preserve a clean primary but retain later help", () => {
  const storage = storageFixture(), primary = decide(createWindSession(), "90");
  persistWindSession(primary, storage);
  persistWindSession(updateWindSession(primary, { type: "help", open: true }), storage);
  const saved = persistWindSession(finish(primary, "west"), storage);
  assert.equal(currentWindRecord(saved.state).helped, false);
  assert.equal(currentWindRecord(saved.state).evidenceHelped, true);
  const stale = persistWindSession(primary, storage);
  assert.equal(currentWindRecord(stale.state).evidence, "west");
  assert.equal(currentWindRecord(stale.state).answer, "90");
});

test("storage failure keeps in-page attempts and reports non-durability until recovery", () => {
  const denied = { getItem() { throw new Error("blocked"); }, setItem() { throw new Error("blocked"); } };
  const state = finish(decide(createWindSession(), "90"), "west");
  assert.equal(persistWindSession(state, denied).durable, false);
  assert.deepEqual(loadWindSession(denied), state);
  assert.deepEqual(loadWindSession(null), state);
  const storage = storageFixture();
  assert.equal(persistWindSession(loadWindSession(denied), storage).durable, true);
  assert.deepEqual(loadWindSession(storage), state);
  const quota = { getItem: storage.getItem, setItem() { throw new Error("quota"); } };
  const repeat = finish(decide(updateWindSession(state, { type: "retry" })));
  assert.equal(persistWindSession(repeat, quota).durable, false);
  assert.equal(loadWindSession(quota).records.length, 2);
  assert.equal(persistWindSession(loadWindSession(quota), storage).durable, true);
});

test("science references are primary WMO and NWS pages", () => {
  assert.equal(windSources.length, 4);
  for (const source of windSources) assert.match(source.url, /^https:\/\/(cloudatlas\.wmo\.int|marine\.weather\.gov|www\.weather\.gov)\//);
  assert.match(windStations[2].explanation, /Skraplanie pary.*parowanie kropelek/);
  assert.match(windStations[2].evidence, /nie wzorzec jej gatunku/);
  assert.match(windStations[1].evidence, /Nie znamy odległości/);
});

test("real SSR markup respects the observation, decision, evidence and feedback boundaries", async t => {
  const cacheDir = await mkdtemp(join(tmpdir(), "chmurnik-wind-"));
  const server = await createServer({ configFile: false, root: fileURLToPath(new URL("..", import.meta.url)), cacheDir,
    publicDir: false, logLevel: "error", server: { middlewareMode: true, ws: false, hmr: false, watch: null }, optimizeDeps: { noDiscovery: true, include: [] } });
  const originalStorage = Object.getOwnPropertyDescriptor(globalThis, "localStorage");
  t.after(async () => {
    if (originalStorage) Object.defineProperty(globalThis, "localStorage", originalStorage);
    else delete globalThis.localStorage;
    await server.close(); await rm(cacheDir, { recursive: true, force: true });
  });
  const { WindField, WindWorkshop } = await server.ssrLoadModule("/weather-preview/learning/WindWorkshop.jsx");
  function render(state) {
    Object.defineProperty(globalThis, "localStorage", { configurable: true, value: storageFixture([[windSessionKey, JSON.stringify(state)]]) });
    return renderToStaticMarkup(React.createElement(WindWorkshop, { mainSite: "../" }));
  }
  for (const [index, station] of windStations.entries()) {
    await t.test(`${station.id}: no pre-observation answer or future interpretation`, () => {
      const state = { ...createWindSession(), index };
      const html = render(state);
      assert.ok(html.includes(station.title));
      assert.ok(!html.includes(station.question));
      assert.ok(!html.includes(station.explanation));
      assert.ok(!html.includes(station.evidenceQuestion));
      for (const [, label] of [...station.options, ...station.evidenceOptions]) assert.ok(!html.includes(label));
      assert.doesNotMatch(html, /nieruchom|stojąc|falow|270°|Z zachodu|wind-source-links/);
      assert.match(html, /dane syntetyczne, nie prognoza/);
      assert.match(html, /href="\.\.\/#\/learn\/wiatr"/);
      assert.match(html, /aria-live="polite"/);
    });
    await t.test(`${station.id}: evidence choices only after primary lock; feedback only after both locks`, () => {
      const initial = { ...createWindSession(), index };
      const observed = updateWindSession(initial, { type: "frame", frame: 2 });
      const before = render(observed);
      assert.ok(before.includes(station.question));
      assert.ok(!before.includes(station.evidenceQuestion));
      assert.ok(!before.includes(station.explanation));
      assert.doesNotMatch(before, /wind-source-links|wind-result/);
      const primary = decide(initial, station.options.find(([id]) => id !== station.correct)[0]);
      const pending = render(primary);
      assert.ok(pending.includes(station.evidenceQuestion));
      assert.ok(!pending.includes(station.explanation));
      assert.doesNotMatch(pending, /zgodny z modelem|do poprawy|wind-result|wind-source-links/);
      const done = render(finish(primary, station.evidenceOptions.find(([id]) => id !== station.correctEvidence)[0]));
      assert.ok(done.includes(station.explanation));
      assert.match(done, /do poprawy/);
      assert.match(done, /Pierwszy zapis tego przypadku/);
      assert.match(done, /wind-source-links/);
    });
  }
  await t.test("independent mode restores without mounting guide hints, source links or model feedback", () => {
    const state = act(finish(decide(createWindSession())), { type: "help", open: true }, { type: "mode", mode: "assessment" });
    const html = render(state);
    assert.doesNotMatch(html, /wind-intro|wind-field|wind-source-links|wind-result|Kierunek meteorologiczny/);
    assert.match(html, /aria-pressed="true">Sprawdź się/);
  });
  await t.test("explicit help is recorded and the panel is not hidden answer-bearing DOM", () => {
    const state = updateWindSession(createWindSession(), { type: "frame", frame: 2 });
    assert.doesNotMatch(render(state), /Kierunek meteorologiczny/);
    const helped = updateWindSession(state, { type: "help", open: true });
    assert.match(render(helped), /Kierunek meteorologiczny/);
    assert.equal(currentWindRecord(decide(helped)).helped, true);
  });
  await t.test("field renders only the current wave path and uses unique grid ids", () => {
    const initial = renderToStaticMarkup(React.createElement(WindField, { station: windStations[2], frame: 0 }));
    assert.doesNotMatch(initial, /Q300 45|Q225 104|falow|nieruchom/);
    const middle = renderToStaticMarkup(React.createElement(WindField, { station: windStations[2], frame: 1 }));
    assert.match(middle, /M150 163Q225 104 300 104/);
    assert.doesNotMatch(middle, /Q300 45/);
    const pair = renderToStaticMarkup(React.createElement("div", null,
      React.createElement(WindField, { station: windStations[0], frame: 0 }),
      React.createElement(WindField, { station: windStations[0], frame: 2 })));
    const ids = [...pair.matchAll(/<pattern id="([^"]+)"/g)].map(match => match[1]);
    assert.equal(new Set(ids).size, 2);
    assert.doesNotMatch(pair, /NaN|Infinity/);
  });
});

test("owned CSS declares readable labels, touch targets, focus and reduced-motion fallback", async () => {
  const css = await readFile(new URL("../weather-preview/learning/wind-workshop.css", import.meta.url), "utf8");
  assert.doesNotMatch(css, /var\(--pink\)|var\(--olive\)|min-height:210px/);
  assert.match(css, /min-height:44px/); assert.match(css, /min-height:48px/);
  assert.match(css, /focus-visible/); assert.match(css, /touch-action:manipulation/);
  assert.match(css, /prefers-reduced-motion:reduce/);
  assert.match(css, /animation:none!important;transition:none!important/);
  assert.match(css, /\.wind-field text\{font:24px/);
});
