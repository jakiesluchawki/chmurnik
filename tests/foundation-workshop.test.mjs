import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import { buildSync } from "esbuild";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { calculate, LIMITS } from "../weather-preview/model.mjs";
import { sceneAppearance } from "../weather-preview/presentation.mjs";
import { dragHeight } from "../weather-preview/interaction.mjs";
import { transferCases } from "../weather-preview/learning/transfer-cases.mjs";
import {
  foundationWorkshops, foundationSnapshot, foundationReadout, foundationHeightY,
  createFoundationState, updateFoundation, foundationAttempt, foundationReady,
  readFoundationState, loadFoundationState, saveFoundationState, foundationStorageKey,
} from "../weather-preview/learning/foundation-workshop.mjs";

const componentUrl = new URL("../weather-preview/learning/FoundationWorkshop.jsx", import.meta.url);
const source = readFileSync(componentUrl, "utf8");
const bundle = buildSync({
  stdin: { contents: `${source}\nexport { FoundationSceneFrame, FoundationControl, GuidedTrial, Comparison };`, sourcefile: fileURLToPath(componentUrl), resolveDir: fileURLToPath(new URL(".", componentUrl)), loader: "jsx" },
  bundle: true, write: false, format: "cjs", platform: "node", loader: { ".css": "empty" }, external: ["react", "react-dom"],
});
const module = { exports: {} };
new Function("require", "module", "exports", bundle.outputFiles[0].text)(createRequire(import.meta.url), module, module.exports);
const { FoundationSceneFrame, FoundationControl, GuidedTrial, Comparison } = module.exports;
const render = (Component, props) => renderToStaticMarkup(React.createElement(Component, props));
const trialFor = state => foundationWorkshops[state.id].trials[state.index];
const predict = (state, value = trialFor(state).correct) => updateFoundation(state, { type: "predict", value });
const reach = state => updateFoundation(state, { type: "change", value: trialFor(state).target });
const observe = state => updateFoundation(state, { type: "observe" });
const explain = (state, value = trialFor(state).correctEvidence) => updateFoundation(state, { type: "evidence", value });
const finish = state => explain(observe(reach(predict(state))));

for (const [id, workshop] of Object.entries(foundationWorkshops)) {
  test(`${id}: three one-variable guided trials agree with the unchanged physics`, () => {
    assert.equal(workshop.trials.length, 3);
    for (const trial of workshop.trials) {
      const snapshot = foundationSnapshot(id, { ...trial.from, [trial.key]: trial.target });
      assert.deepEqual(snapshot.result, calculate(workshop.scene, snapshot.input));
      assert.deepEqual(snapshot.appearance, sceneAppearance(workshop.scene, snapshot.input));
      const outcome = id === "bryza" ? snapshot.result.direction : snapshot.result.saturated ? "yes" : "no";
      assert.equal(trial.correct, outcome, trial.id);
      const evidence = id === "bryza" ? snapshot.result.difference === 0 ? "equal" : snapshot.result.difference > 0 ? "land" : "water" :
        id === "chmura" ? snapshot.input.height > snapshot.result.base ? "above" : "below" : snapshot.result.current > snapshot.result.initialDew ? "above" : "equal";
      assert.equal(trial.correctEvidence, evidence, trial.id);
      const changed = Object.keys(trial.from).filter(key => trial.from[key] !== snapshot.input[key]);
      assert.deepEqual(changed, [trial.key]);
      for (const options of [trial.choices, trial.evidence]) assert.equal(new Set(options.map(o => o.label)).size, options.length);
    }
    assert.equal(transferCases[id].length, 2, "reuse the independent cases without replacement");
  });

  test(`${id}: controls, evidence and help cannot rewrite the first prediction`, () => {
    let state = createFoundationState(id);
    for (const action of [{ type: "change", value: trialFor(state).target }, { type: "observe" }, { type: "evidence", value: trialFor(state).correctEvidence }, { type: "next" }]) {
      assert.strictEqual(updateFoundation(state, action), state);
    }
    const wrong = trialFor(state).choices.find(o => o.id !== trialFor(state).correct).id;
    state = predict(state, wrong);
    const predictionRecord = structuredClone(foundationAttempt(state));
    assert.equal(predictionRecord.predictionHelped, false);
    assert.strictEqual(predict(state), state);
    state = updateFoundation(state, { type: "help" });
    assert.equal(foundationAttempt(state).predictionHelped, false);
    state = reach(state);
    assert.ok(foundationReady(state));
    assert.equal(foundationAttempt(state).phase, "action", "a slider target is not completion");
    assert.strictEqual(updateFoundation(state, { type: "next" }), state);
    state = observe(state);
    assert.equal(foundationAttempt(state).phase, "evidence");
    assert.strictEqual(updateFoundation(state, { type: "change", value: 0 }), state);
    const wrongEvidence = trialFor(state).evidence.find(o => o.id !== trialFor(state).correctEvidence).id;
    state = explain(state, wrongEvidence);
    assert.equal(foundationAttempt(state).evidenceHelped, true);
    assert.equal(foundationAttempt(state).prediction, wrong);
    assert.equal(foundationAttempt(state).evidence, wrongEvidence);
    assert.strictEqual(explain(state), state);
    const first = structuredClone(foundationAttempt(state));
    state = updateFoundation(state, { type: "retry" });
    assert.deepEqual(state.trials[0][0], first);
    state = finish(state);
    assert.deepEqual(state.trials[0][0], first);
    assert.equal(state.trials[0].length, 2);
    assert.deepEqual(readFoundationState(id, JSON.stringify(state)), state);
  });

  test(`${id}: guided sequence survives reload at every phase and changes no independent case`, () => {
    let state = createFoundationState(id);
    const cases = JSON.stringify(transferCases[id]);
    for (let i = 0; i < 3; i++) {
      assert.equal(state.index, i);
      for (const action of [predict, reach, observe, explain]) {
        state = action(state);
        assert.deepEqual(readFoundationState(id, JSON.stringify(state)), state);
      }
      state = updateFoundation(state, { type: "next" });
    }
    assert.equal(state.index, 2);
    assert.equal(JSON.stringify(transferCases[id]), cases);
  });

  test(`${id}: actual concealed guide has no target outcome, reason choices or help copy`, () => {
    const previousDocument = globalThis.document;
    globalThis.document = { hidden: false };
    try {
      let state = createFoundationState(id);
      for (let i = 0; i < 3; i++) {
        const trial = trialFor(state);
        const html = render(GuidedTrial, { id, state, dispatch() {}, reduced: true });
        assert.ok(html.includes("Zapisz przewidywanie"));
        assert.ok(!html.includes("type=\"range\""));
        assert.ok(!html.includes(trial.explanation));
        assert.ok(!html.includes(workshop.limits));
        assert.ok(!html.includes("foundation-comparison"));
        assert.ok(!html.includes("foundation-condensation-line"));
        assert.ok(!html.includes("foundation-dew-marker"));
        assert.ok(!html.includes("foundation-flow-direction"));
        for (const option of trial.evidence) assert.ok(!html.includes(option.label));
        state = finish(state);
        const complete = render(GuidedTrial, { id, state, dispatch() {}, reduced: true });
        assert.ok(complete.includes(trial.explanation));
        assert.ok(complete.includes("Porównaj A i B"));
        assert.ok(complete.includes("Twój odczyt:"));
        assert.ok(complete.indexOf("Porównaj A i B") < complete.lastIndexOf(i < 2 ? "Następna próba" : "Sprawdź się na nowych danych"));
        if (i < 2) state = updateFoundation(state, { type: "next" });
      }
    } finally { globalThis.document = previousDocument; }
  });

  test(`${id}: each mechanism uses an illustrated native slider with tap alternatives`, () => {
    for (const name of Object.keys(LIMITS[workshop.scene])) {
      const html = render(FoundationControl, { id, name, input: workshop.trials[0].from, onChange() {} });
      assert.match(html, /type="range"/);
      assert.match(html, /aria-valuetext=/);
      assert.match(html, /aria-label="Zmniejsz:/);
      assert.match(html, /aria-label="Zwiększ:/);
      assert.match(html, /<label for=/);
      assert.match(html, /class="range-thumb"/);
      if (name === "height") assert.match(html, /cloud.webp/);
    }
  });
}

test("new diagram preserves zero and continuous condensate at both exact boundaries", () => {
  const cloud = { temperature: 24, humidity: 55, height: 0 };
  const base = foundationSnapshot("chmura", cloud).result.base;
  const fog = { temperature: 18, humidity: 70, cooling: 0 };
  const needed = foundationSnapshot("mgla", fog).result.needed;
  for (const [id, input, key, boundary] of [["chmura", cloud, "height", base], ["mgla", fog, "cooling", needed]]) {
    for (const offset of [-0.01, 0, 0.01]) {
      const snapshot = foundationSnapshot(id, { ...input, [key]: boundary + offset });
      if (offset <= 0) assert.equal(snapshot.appearance.opacity, 0);
      else assert.ok(snapshot.appearance.opacity > 0 && snapshot.appearance.opacity < 0.01);
      const html = render(FoundationSceneFrame, { id, snapshot });
      assert.ok(html.includes(`opacity:${snapshot.appearance.opacity}`));
    }
  }
});

test("height coordinates are independent of labels and off-scale bases are not clamped", () => {
  assert.equal(foundationHeightY(0), 83);
  assert.equal(foundationHeightY(3000), 17);
  assert.ok(foundationHeightY(1500) > foundationHeightY(1800));
  const snapshot = foundationSnapshot("chmura", { temperature: 24, humidity: 20, height: 1500 });
  const html = render(FoundationSceneFrame, { id: "chmura", snapshot });
  assert.ok(snapshot.result.base > 3000);
  assert.ok(html.includes("poza skalą"));
  assert.ok(!html.includes("class=\"foundation-condensation-line\""));
  assert.ok(html.includes(`class="foundation-parcel" style="top:${foundationHeightY(1500)}%"`));
});

test("saturation labels never round to a false 100 percent", () => {
  const needed = foundationSnapshot("mgla", { temperature: 18, humidity: 70, cooling: 0 }).result.needed;
  const rows = foundationReadout("mgla", { temperature: 18, humidity: 70, cooling: needed - 0.0001 });
  assert.equal(rows[2][1], "<100%");
  assert.equal(rows[3][1], "Bez nasycenia");
});

test("direct parcel control shares the plot scale and stays unavailable before prediction", () => {
  for (const sceneHeight of [154, 208, 290]) {
    const start = sceneHeight * foundationHeightY(0) / 100;
    const end = sceneHeight * foundationHeightY(1500) / 100;
    assert.equal(dragHeight(0, start, end, sceneHeight, 0.66), 1500);
  }
  const snapshot = foundationSnapshot("chmura", { temperature: 24, humidity: 55, height: 0 });
  const html = render(FoundationSceneFrame, { id: "chmura", snapshot, onHeightChange() {} });
  assert.match(html, /role="slider"/);
  assert.match(html, /aria-orientation="vertical"/);
  assert.match(html, /foundation-parcel-control/);
  assert.match(html, /<\/div><p class="foundation-scene-caption"/);
  const concealed = render(FoundationSceneFrame, { id: "chmura", snapshot, concealed: true, onHeightChange() {} });
  assert.doesNotMatch(concealed, /role="slider"/);
});

test("breeze arrows and temperature evidence agree for day, night and no contrast", () => {
  for (const hour of [2, 7, 14, 19]) {
    const snapshot = foundationSnapshot("bryza", { hour, heating: 70 });
    const html = render(FoundationSceneFrame, { id: "bryza", snapshot });
    assert.match(html, new RegExp(snapshot.result.direction === "onshore" ? "M270 174 H338" : "M338 174 H270"));
    assert.ok(html.includes("wyżej: powrót"));
  }
  const html = render(FoundationSceneFrame, { id: "bryza", snapshot: foundationSnapshot("bryza", { hour: 2, heating: 0 }) });
  assert.ok(html.includes('opacity:0'));
  assert.ok(html.includes("Brak wyraźnej bryzy"));
  assert.ok(!html.includes("wyżej: powrót"));
});

test("comparison is generated from exact saved inputs without mutation", () => {
  const before = Object.freeze({ temperature: 24, humidity: 55, height: 500 });
  const after = Object.freeze({ temperature: 24, humidity: 55, height: 1500 });
  const html = render(Comparison, { id: "chmura", before, after });
  for (const text of ["500 m", "1500 m", "19,1°C", "10,4°C", "A · przed", "B · po"]) assert.ok(html.includes(text), text);
  assert.equal(before.height, 500);
});

test("untrusted storage cannot manufacture a prediction or skip the evidence gate", () => {
  for (const raw of [undefined, "no", "null", "[]", '{"version":10}']) assert.deepEqual(readFoundationState("bryza", raw), createFoundationState("bryza"));
  let state = createFoundationState("bryza");
  state.index = 2;
  state.trials[0][0] = { phase: "complete", evidence: "land", observed: { hour: 14, heating: 70 } };
  const restored = readFoundationState("bryza", JSON.stringify(state));
  assert.equal(restored.index, 0);
  assert.equal(foundationAttempt(restored).phase, "predict");
  state = predict(createFoundationState("chmura"));
  state.trials[0][0].observed = { temperature: 10, humidity: 55, height: 500 };
  assert.equal(foundationAttempt(readFoundationState("chmura", JSON.stringify(state))).phase, "action");
});

test("help before a prediction and after a prediction are recorded separately", () => {
  let state = updateFoundation(createFoundationState("chmura"), { type: "help" });
  state = predict(state);
  assert.equal(foundationAttempt(state).predictionHelped, true);
  state = createFoundationState("mgla");
  state = predict(state);
  state = updateFoundation(state, { type: "help" });
  state = explain(observe(reach(state)));
  assert.equal(foundationAttempt(state).predictionHelped, false);
  assert.equal(foundationAttempt(state).evidenceHelped, true);
});

test("evidence phase keeps the decisive saved data alongside its question", () => {
  const oldDocument = globalThis.document;
  globalThis.document = { hidden: false };
  try {
    const id = "chmura", state = observe(reach(predict(createFoundationState(id))));
    const html = render(GuidedTrial, { id, state, dispatch() {}, reduced: true });
    const decision = html.slice(html.indexOf('class="foundation-decision"'));
    assert.match(decision, /Zapisana obserwacja B/);
    assert.match(decision, /500 m/);
    assert.match(decision, /1200 m/);
    assert.match(decision, /19,1°C/);
    assert.ok(!decision.includes(trialFor(state).explanation));
  } finally { globalThis.document = oldDocument; }
});

test("refreshing independent practice does not mount the guide and expose its answers", () => {
  for (const mode of ["guide", "explore", "transfer"]) {
    const state = updateFoundation(createFoundationState("chmura"), { type: "mode", value: mode });
    assert.equal(readFoundationState("chmura", JSON.stringify(state)).mode, mode);
  }
  assert.match(source, /const mode = state.mode/);
  assert.match(source, /current.current.mode !== "transfer"\) markTransferHelp\(id\)/);
});

test("free A/B labels do not assert chronology and show exact cooling inputs", () => {
  const html = render(Comparison, { id: "mgla", before: { temperature: 18, humidity: 70, cooling: 6 }, after: { temperature: 18, humidity: 70, cooling: 2 }, ordered: false });
  assert.ok(!html.includes("A · przed"));
  assert.ok(html.includes("ochłodzenie o 6,0°C"));
  assert.ok(html.includes("ochłodzenie o 2,0°C"));
});

test("denied storage keeps an in-page record and durable writes use a new isolated key", () => {
  const blocked = { getItem() { throw new Error("blocked"); }, setItem() { throw new Error("blocked"); } };
  const state = predict(createFoundationState("mgla"), "no");
  assert.equal(saveFoundationState(state, blocked), false);
  assert.deepEqual(loadFoundationState("mgla", blocked), state);
  const values = new Map();
  const storage = { getItem: key => values.get(key), setItem: (key, value) => values.set(key, value) };
  assert.equal(saveFoundationState(state, storage), true);
  assert.deepEqual([...values.keys()], [foundationStorageKey("mgla")]);
  assert.deepEqual(readFoundationState("mgla", values.get(foundationStorageKey("mgla"))), state);
});

test("portable component keeps transfer, reduced motion and return-lesson hooks", () => {
  assert.match(source, /export function FoundationWorkshop\(\{ id, mainSite \}\)/);
  assert.match(source, /FoundationSession key=\{id\}/);
  assert.match(source, /<TransferTrial key=\{id\} activityId=\{id\}/);
  assert.match(source, /if \(mode === "transfer"\) markTransferHelp\(id\)/);
  assert.match(source, /prefers-reduced-motion: reduce/);
  assert.match(source, /returnLesson/);
  assert.doesNotMatch(source, /@capacitor|chmurnik\.cloud|speechSynthesis|fetch\(/);
  const css = readFileSync(new URL("../weather-preview/learning/foundation-workshop.css", import.meta.url), "utf8");
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)/);
  assert.doesNotMatch(css, /position:\s*(sticky|fixed)/);
  assert.match(css, /min-height: 44px/);
});
