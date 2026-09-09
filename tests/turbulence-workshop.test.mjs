import test from "node:test";
import assert from "node:assert/strict";
import { readFile, mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";
import ts from "typescript";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createServer } from "vite";
import * as model from "../weather-preview/learning/turbulence-workshop.mjs";
import { transferCases } from "../weather-preview/learning/transfer-cases.mjs";
import { returnLesson } from "../weather-preview/tutorial.mjs";

const { turbulenceTrials, initialTurbulenceInputs, initialTurbulenceState, updateTurbulence, activeTurbulenceAttempt,
  readyToPredict, mechanicalTrace, thermalDrawing, windVector, layerDifference, windFromPointer, restoreTurbulenceState, createTurbulenceStore, TURBULENCE_STORAGE } = model;
const setups = { terrain: { roughness: 65 }, thermal: { heat: 2 }, shear: { upperFrom: 0 } };
const configure = id => updateTurbulence(updateTurbulence(initialTurbulenceState(), { type: "select", trialId: id }), { type: "inputs", value: setups[id] });
const commit = (state, id = "first", value = model.turbulenceTrial(state.trialId).correctPrediction) => updateTurbulence(state, { type: "predict", id, value });
const clone = value => structuredClone(value);

test("three isolated interventions have four plausible predictions and separate evidence, sources and limits", () => {
  assert.equal(turbulenceTrials.length, 3);
  assert.equal(new Set(turbulenceTrials.map(trial => trial.correctPrediction)).size, 3);
  const positions = [];
  for (const trial of turbulenceTrials) {
    assert.equal(readyToPredict(trial.id, initialTurbulenceInputs()), false);
    assert.equal(readyToPredict(trial.id, { ...initialTurbulenceInputs(), ...setups[trial.id] }), true);
    assert.equal(trial.predictions.length, 4);
    assert.equal(new Set(trial.predictions.map(([id]) => id)).size, 4);
    assert.equal(new Set(trial.predictions.map(([, label]) => label)).size, 4);
    assert.ok(trial.evidence.some(([id]) => id === trial.correctEvidence));
    assert.ok(trial.limit.length > 100 && trial.explanation.length > 100);
    assert.match(model.turbulenceSources[trial.source].url, /^https:\/\/(www\.weather\.gov|www\.faa\.gov)\//);
    positions.push(trial.predictions.findIndex(([id]) => id === trial.correctPrediction));
  }
  assert.equal(new Set(positions).size, 3, "correct choices are not always in the same position");
  assert.equal(transferCases.turbulencja.length, 2, "reuse the separately validated independent cases");
  assert.ok(transferCases.turbulencja.every(task => !turbulenceTrials.some(trial => trial.id === task.id)));
});

test("mechanical illustration is continuous, finite and changes downstream, not the inlet", () => {
  for (let lane = 0; lane < 3; lane++) {
    const base = mechanicalTrace(0, lane), changed = mechanicalTrace(100, lane);
    assert.ok(base.every(point => point.y === 40 + lane * 12));
    assert.deepEqual(changed.filter(point => point.x <= 17), base.filter(point => point.x <= 17));
    assert.ok(changed.some(point => point.x > 50 && point.y > 40 + lane * 12));
    assert.ok(changed.some(point => point.x > 50 && point.y < 40 + lane * 12));
    for (let value = 0; value <= 100; value++) {
      const trace = mechanicalTrace(value, lane);
      assert.ok(trace.every(point => Number.isFinite(point.x) && point.y > 0 && point.y < 80));
      if (value) assert.ok(trace.every((point, i) => Math.abs(point.y - mechanicalTrace(value - 1, lane)[i].y) < .4));
    }
  }
  assert.deepEqual(mechanicalTrace(-1), mechanicalTrace(0));
  assert.deepEqual(mechanicalTrace(Infinity), mechanicalTrace(0));
});

test("convection follows heating location and has a compensating return, with zero added circulation at zero heat", () => {
  assert.equal(thermalDrawing(0, "left").amount, 0);
  let previous = 100;
  for (let heat = 1; heat <= 3; heat++) {
    const left = thermalDrawing(heat, "left"), right = thermalDrawing(heat, "right");
    assert.equal(left.x, right.neighbor);
    assert.equal(left.neighbor, right.x);
    assert.equal(left.top, right.top);
    assert.ok(left.top < previous); previous = left.top;
    assert.match(left.up, /M 28 72/);
    assert.match(left.down, /72$/);
  }
});

test("two-layer vectors use meteorological FROM convention and exact vector differences, not a severity score", () => {
  assert.deepEqual(windVector(10, 270), { east: 10, north: 0 });
  assert.deepEqual(windVector(10, 0), { east: 0, north: -10 });
  assert.deepEqual(windVector(10, 90), { east: -10, north: 0 });
  assert.deepEqual(windVector(10, 180), { east: 0, north: 10 });
  assert.equal(layerDifference(10, 270).magnitude, 0);
  assert.equal(layerDifference(20, 270).magnitude, 10);
  assert.equal(layerDifference(10, 90).magnitude, 20);
  assert.ok(Math.abs(layerDifference(10, 0).magnitude - Math.sqrt(200)) < 1e-10);
  for (let speed = 0; speed <= 30; speed++) for (let from = 0; from <= 360; from += 15) {
    const result = layerDifference(speed, from);
    assert.ok(Number.isFinite(result.magnitude) && result.magnitude <= 40);
    assert.equal(result.heightDifference, 400);
    assert.ok(!["severity", "turbulence", "safe", "rate"].some(key => key in result));
  }
  for (const value of [NaN, Infinity, "10", null, -1, 31]) assert.equal(windVector(value, 0), null);
});

test("vector pointer conversion respects scene bounds and preserves speed in the guide", () => {
  const rect = { left: 100, top: 50, width: 200, height: 200 };
  assert.deepEqual(windFromPointer(300, 150, rect, true), { upperFrom: 270, upperSpeed: 10 });
  assert.deepEqual(windFromPointer(200, 250, rect, true), { upperFrom: 0, upperSpeed: 10 });
  assert.deepEqual(windFromPointer(200, 50, rect, true), { upperFrom: 180, upperSpeed: 10 });
  assert.equal(windFromPointer(3000, 150, rect).upperSpeed, 30);
  assert.equal(windFromPointer(200, 150, rect).upperSpeed, 0);
  assert.equal(windFromPointer(200, 150, { ...rect, width: 0 }), null);
});

for (const trial of turbulenceTrials) test(`${trial.id}: lock prediction before result; preserve unfinished first and independent prediction after later help`, () => {
  let state = configure(trial.id);
  assert.deepEqual(updateTurbulence(state, { type: "observe" }), state);
  assert.deepEqual(updateTurbulence(state, { type: "evidence", value: trial.correctEvidence }), state);
  const wrong = trial.predictions.find(([id]) => id !== trial.correctPrediction)[0];
  state = commit(state, "first", wrong);
  const first = clone(state.attempts[0]);
  assert.equal(first.observed, false);
  assert.equal(first.evidence, null);
  assert.deepEqual(updateTurbulence(state, { type: "inputs", value: initialTurbulenceInputs() }), state);
  assert.deepEqual(commit(state, "overwrite"), state);
  state = updateTurbulence(state, { type: "observe" });
  state = updateTurbulence(state, { type: "help" });
  state = updateTurbulence(state, { type: "evidence", value: trial.correctEvidence });
  const completed = clone(state.attempts[0]);
  assert.equal(completed.prediction, wrong);
  assert.equal(completed.predictionHelped, false);
  assert.equal(completed.evidenceHelped, true);
  assert.deepEqual(updateTurbulence(state, { type: "evidence", value: trial.evidence.find(([id]) => id !== trial.correctEvidence)[0] }), state);
  for (let i = 0; i < 45; i++) {
    state = updateTurbulence(state, { type: "select", trialId: trial.id, repeat: true });
    state = updateTurbulence(state, { type: "inputs", value: setups[trial.id] });
    state = commit(state, `repeat-${i}`);
    assert.equal(activeTurbulenceAttempt(state).repeated, true);
    assert.equal(activeTurbulenceAttempt(state).predictionHelped, true);
  }
  assert.deepEqual(state.attempts[0], completed);
  assert.equal(state.attempts[1].evidence, null, "an unfinished original is not completed by a later retry");
  assert.deepEqual(restoreTurbulenceState(JSON.parse(JSON.stringify(state))), state);
});

function storageFixture() {
  const values = new Map(), writes = [];
  return { values, writes, storage: { getItem: key => values.get(key) ?? null, setItem(key, value) { writes.push(key); values.set(key, value); } } };
}

test("reload preserves first responses, stale UI cannot overwrite them, failed storage retains session only", () => {
  const { storage, values, writes } = storageFixture();
  values.set("unrelated-photo-records", "unchanged");
  const one = createTurbulenceStore(storage), two = createTurbulenceStore(storage);
  const initial = one.load();
  one.apply({ type: "inputs", value: setups.terrain });
  one.apply({ type: "predict", id: "first", value: "before" });
  const first = clone(one.load().attempts[0]);
  two.apply({ type: "predict", id: "stale", value: "lee" }, initial);
  assert.deepEqual(one.load().attempts, [first]);
  one.apply({ type: "help" });
  const reload = createTurbulenceStore(storage);
  assert.equal(reload.load().attempts[0].helped, true);
  assert.equal(reload.load().attempts[0].predictionHelped, false);
  storage.setItem = () => { throw new Error("QuotaExceeded"); };
  reload.apply({ type: "observe" });
  reload.apply({ type: "evidence", value: "wake" });
  assert.equal(reload.durable, false);
  assert.equal(reload.load().attempts[0].evidence, "wake");
  assert.equal(values.get("unrelated-photo-records"), "unchanged");
  assert.ok(writes.every(key => key === TURBULENCE_STORAGE));
});

test("untrusted storage cannot fabricate completion, accept invalid inputs or duplicate first records", () => {
  const valid = commit(configure("terrain"));
  const duplicated = clone(valid); duplicated.attempts.push(clone(duplicated.attempts[0]));
  assert.equal(restoreTurbulenceState(duplicated).attempts.length, 1);
  for (const patch of [{ prediction: "invented" }, { observed: false, evidence: "wake", evidenceHelped: false }, { inputs: { ...valid.inputs, roughness: null } }]) {
    const bad = clone(valid); Object.assign(bad.attempts[0], patch);
    assert.equal(restoreTurbulenceState(bad).attempts.length, 0);
    assert.equal(restoreTurbulenceState(bad).activeId, null);
  }
  for (const invalid of [null, {}, { ...valid, revision: 999 }, { ...valid, inputs: { ...valid.inputs, heat: "2" } }]) {
    assert.deepEqual(restoreTurbulenceState(invalid), initialTurbulenceState());
  }
});

const source = await readFile(new URL("../weather-preview/learning/TurbulenceWorkshop.jsx", import.meta.url), "utf8");
const ast = ts.createSourceFile("TurbulenceWorkshop.jsx", source, ts.ScriptTarget.Latest, true, ts.ScriptKind.JSX);
const compiled = ts.transpileModule(ast.statements.filter(node => !ts.isImportDeclaration(node)).map(node => node.getText(ast)).join("\n"), {
  compilerOptions: { jsx: ts.JsxEmit.React, target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
}).outputText;

// Actual component handlers, with a minimal hook scheduler; SSR below renders the full tree.
function componentHarness(name, props = {}, provided = {}) {
  const slots = [], effects = new Map(); let cursor = 0, pending = [], tree;
  const storage = storageFixture().storage;
  const window = new EventTarget(), media = new EventTarget(), document = new EventTarget();
  Object.assign(media, { matches: true });
  Object.assign(window, { localStorage: storage, matchMedia: () => media, location: { search: "?from=wiatr" } });
  document.hidden = false;
  const context = {
    Slider() {},
    ...model, returnLesson, exports: {}, window, document, crypto: globalThis.crypto, structuredClone, URLSearchParams,
    markTransferHelp() {}, requestAnimationFrame: callback => callback(),
    ArrowLeft: "ArrowLeft", ArrowRight: "ArrowRight", ArrowsVertical: "ArrowsVertical", ArrowCounterClockwise: "ArrowCounterClockwise", BookOpen: "BookOpen", Sun: "Sun", TransferTrial: "TransferTrial",
    React: { Fragment: "Fragment", createElement: (type, props, ...children) => ({ type, props: props || {}, children }) },
    useId: () => "test-id",
    useState(initial) { const index = cursor++; if (!(index in slots)) slots[index] = typeof initial === "function" ? initial() : initial; return [slots[index], value => { slots[index] = typeof value === "function" ? value(slots[index]) : value; }]; },
    useRef(initial) { const index = cursor++; return slots[index] ||= { current: initial }; },
    useEffect(setup, deps) {
      const index = cursor++, old = effects.get(index);
      if (!old || deps.some((value, i) => !Object.is(value, old.deps[i]))) pending.push(() => { old?.cleanup?.(); effects.set(index, { deps, setup, cleanup: setup() }); });
    }, ...provided,
  };
  const Component = vm.runInNewContext(`${compiled}; ${name}`, context);
  const nodes = root => Array.isArray(root) ? root.flatMap(nodes) : root && typeof root === "object" ? [root, ...root.children.flatMap(nodes)] : [];
  const text = root => Array.isArray(root) ? root.map(text).join("") : root && typeof root === "object" ? root.children.map(text).join("") : typeof root === "string" ? root : "";
  function render(next = props) { props = next; cursor = 0; tree = Component(props); const work = pending; pending = []; work.forEach(fn => fn()); }
  render(); render();
  return { window: context.window, media, storage: context.window.localStorage, nodes: () => nodes(tree), text: () => text(tree), render,
    click(label) { const button = nodes(tree).find(node => node.type === "button" && text(node).trim() === label); assert.ok(button, `missing ${label}`); assert.ok(!button.props.disabled, `disabled ${label}`); button.props.onClick(); render(); },
    radio(name, value) { const input = nodes(tree).find(node => node.type === "input" && node.props.name === name && node.props.value === value); assert.ok(input); input.props.onChange(); render(); },
    unmount() { for (const effect of effects.values()) effect.cleanup?.(); effects.clear(); },
    replay() { for (const effect of effects.values()) { effect.cleanup?.(); effect.cleanup = effect.setup(); } render(); },
  };
}

test("rendered guide locks before comparison, distinguishes help, preserves first choice and mounts only TransferTrial for assessment", t => {
  const marked = [], ui = componentHarness("TurbulenceWorkshop", { mainSite: "/chmurnik/" }, { markTransferHelp: id => marked.push(id) });
  t.after(ui.unmount);
  const scene = () => ui.nodes().find(node => node.type?.name === "TurbulenceScene");
  const stored = () => JSON.parse(ui.storage.getItem(TURBULENCE_STORAGE));
  for (const trial of turbulenceTrials) {
    assert.equal(scene().props.revealed, false);
    assert.ok(!ui.text().includes(trial.explanation));
    assert.ok(!ui.text().includes(trial.evidenceQuestion));
    scene().props.onInputs(setups[trial.id]); ui.render();
    ui.radio("turb-prediction", trial.predictions.find(([id]) => id !== trial.correctPrediction)[0]);
    ui.click("Zapisz przewidywanie");
    assert.equal(scene().props.locked, true);
    assert.equal(scene().props.revealed, false);
    assert.ok(!ui.text().includes(trial.evidenceQuestion));
    const first = clone(stored().attempts.at(-1));
    scene().props.onInputs(initialTurbulenceInputs()); ui.render();
    assert.deepEqual(stored().attempts.at(-1), first);
    ui.click("Porównaj A i B");
    assert.equal(scene().props.revealed, true);
    assert.ok(ui.text().includes(trial.evidenceQuestion));
    ui.click("Podpowiedź do porównania");
    ui.radio("turb-evidence", trial.correctEvidence); ui.click("Zapisz dowód");
    assert.ok(ui.text().includes("nie potwierdziło"));
    assert.equal(stored().attempts.at(-1).predictionHelped, false);
    assert.equal(stored().attempts.at(-1).evidenceHelped, true);
    ui.click(trial.id === "shear" ? "Zastosuj zasadę w nowych danych" : "Następne doświadczenie");
  }
  assert.equal(ui.nodes().find(node => node.type === "TransferTrial").props.activityId, "turbulencja");
  assert.equal(scene(), undefined);
  ui.click("Eksperymentuj");
  assert.deepEqual(marked, ["turbulencja"]);
  assert.equal(scene().props.explore, true);
  assert.equal(scene().props.locked, false);
  assert.equal(scene().props.revealed, true);
});

test("actual tap and keyboard handlers manipulate terrain, heat and wind; cancelled drag restores its starting state", t => {
  for (const trial of turbulenceTrials) {
    let inputs = initialTurbulenceInputs();
    const ui = componentHarness("TurbulenceScene", { trialId: trial.id, inputs, onInputs: value => { inputs = { ...inputs, ...value }; } });
    t.after(ui.unmount);
    const rerender = () => ui.render({ trialId: trial.id, inputs, onInputs: value => { inputs = { ...inputs, ...value }; } });
    const key = key => ({ key, preventDefault() {} });
    if (trial.id === "terrain") {
      ui.click("Wysuń przeszkodę"); assert.equal(inputs.roughness, 65); rerender();
      const handle = ui.nodes().find(node => node.props.role === "slider");
      handle.props.onKeyDown(key("Home")); assert.equal(inputs.roughness, 0); rerender();
      ui.nodes().find(node => node.props.role === "slider").props.onKeyDown(key("ArrowUp")); assert.equal(inputs.roughness, 10); rerender();
      const scene = ui.nodes().find(node => node.props.className === "turb-landscape");
      scene.props.ref.current = { getBoundingClientRect: () => ({ height: 200 }) };
      const draggable = ui.nodes().find(node => node.props.role === "slider");
      const target = { setPointerCapture() {}, hasPointerCapture: () => true, releasePointerCapture() {} };
      const event = { pointerId: 1, pointerType: "touch", clientY: 150, preventDefault() {}, currentTarget: target };
      draggable.props.onPointerDown(event); draggable.props.onPointerMove({ ...event, clientY: 126 });
      assert.equal(inputs.roughness, 60);
      draggable.props.onPointerCancel(event); assert.equal(inputs.roughness, 10);
    } else if (trial.id === "thermal") {
      const sun = ui.nodes().find(node => node.props["aria-label"] === "Ogrzej lewy skrawek");
      sun.props.onClick(); assert.equal(inputs.heat, 1); rerender();
      ui.click("Wyłącz ogrzewanie"); assert.equal(inputs.heat, 0);
    } else {
      ui.click("Wiatr górą z północy"); assert.equal(inputs.upperFrom, 0); rerender();
      ui.nodes().find(node => node.props.role === "slider").props.onKeyDown(key("ArrowLeft"));
      assert.equal(inputs.upperFrom, 345); assert.equal(inputs.upperSpeed, 10);
    }
  }
});

test("navigation and exploration mark help; cleanup/replayed effects do not; reduced motion stays readable", t => {
  const ui = componentHarness("TurbulenceWorkshop", { mainSite: "/" }); t.after(ui.unmount);
  ui.replay();
  assert.equal(ui.storage.getItem(TURBULENCE_STORAGE), null, "effect replay does not invent a first record or help");
  assert.ok(ui.text().includes("Ruch ograniczony"));
  ui.window.dispatchEvent(new Event("hashchange")); ui.render();
  assert.equal(JSON.parse(ui.storage.getItem(TURBULENCE_STORAGE)).helped, true);
  ui.unmount();
  const before = ui.storage.getItem(TURBULENCE_STORAGE);
  ui.window.dispatchEvent(new Event("popstate"));
  assert.equal(ui.storage.getItem(TURBULENCE_STORAGE), before);
});

test("shared sources expose all three principles, while independent case help remains in TransferTrial", t => {
  const marked = [], ui = componentHarness("TurbulenceWorkshop", { mainSite: "/" }, { markTransferHelp: id => marked.push(id) }); t.after(ui.unmount);
  const sources = () => ui.nodes().filter(node => node.type === "details").at(-1);
  sources().props.onToggle({ currentTarget: { open: true } }); ui.render();
  assert.deepEqual(JSON.parse(ui.storage.getItem(TURBULENCE_STORAGE)).exposed.sort(), ["shear", "terrain", "thermal"]);
  ui.click("Sprawdź się");
  sources().props.onToggle({ currentTarget: { open: true } });
  assert.deepEqual(marked, ["turbulencja"]);
});

test("Vite SSR: full component and every apparatus render without a browser; result/evidence stay concealed until their gates", async t => {
  const cacheDir = await mkdtemp(join(tmpdir(), "chmurnik-turbulence-ssr-"));
  const server = await createServer({ configFile: false, root: fileURLToPath(new URL("..", import.meta.url)), cacheDir,
    publicDir: false, logLevel: "error", server: { middlewareMode: true, ws: false, hmr: false, watch: null }, optimizeDeps: { noDiscovery: true, include: [] } });
  t.after(async () => { await server.close(); await rm(cacheDir, { recursive: true, force: true }); });
  const { TurbulenceWorkshop, TurbulenceScene } = await server.ssrLoadModule("/weather-preview/learning/TurbulenceWorkshop.jsx");
  const html = renderToStaticMarkup(React.createElement(TurbulenceWorkshop, { mainSite: "/chmurnik/" }));
  assert.ok(html.includes("Co zmienia przeszkoda?"));
  assert.ok(html.includes('/chmurnik/#/learn/zagrozenia'));
  assert.ok(!html.includes("data-testid=\"observation\""));
  assert.ok(!html.includes("name=\"turb-evidence\""));
  assert.ok(!html.includes(turbulenceTrials[0].explanation));
  for (const trial of turbulenceTrials) {
    const inputs = { ...initialTurbulenceInputs(), ...setups[trial.id] };
    const render = (revealed, paused) => renderToStaticMarkup(React.createElement(TurbulenceScene, { trialId: trial.id, inputs, onInputs() {}, revealed, paused }));
    assert.ok(!render(false, false).includes('data-testid="observation"'));
    const still = render(true, true), moving = render(true, false);
    assert.ok(still.includes('data-testid="observation"'));
    assert.ok(!still.includes("animateMotion"));
    if (trial.id !== "shear") assert.ok(moving.includes("animateMotion"));
    assert.doesNotMatch(still, /NaN|Infinity|undefined/);
    assert.ok(still.includes(trial.id === "shear" ? "Długości strzałek" : "nie pokazują realnej prędkości"));
  }
  const originalWindow = Object.getOwnPropertyDescriptor(globalThis, "window");
  const { storage, values } = storageFixture();
  Object.defineProperty(globalThis, "window", { configurable: true, value: { localStorage: storage } });
  try {
    for (const trial of turbulenceTrials) {
      let state = configure(trial.id);
      const render = () => {
        values.set(TURBULENCE_STORAGE, JSON.stringify(state));
        return renderToStaticMarkup(React.createElement(TurbulenceWorkshop, { mainSite: "/chmurnik/" }));
      };
      assert.ok(!render().includes('data-testid="observation"'));
      state = commit(state);
      const locked = render();
      assert.ok(locked.includes("Porównaj A i B"));
      assert.ok(!locked.includes('data-testid="observation"'));
      assert.ok(!locked.includes('name="turb-prediction"'));
      assert.ok(!locked.includes('name="turb-evidence"'));
      state = updateTurbulence(state, { type: "observe" });
      const observed = render();
      assert.ok(observed.includes('data-testid="observation"'));
      assert.ok(observed.includes('name="turb-evidence"'));
      assert.ok(!observed.includes(trial.explanation));
      state = updateTurbulence(state, { type: "evidence", value: trial.correctEvidence });
      assert.ok(render().includes(trial.explanation));
    }
  } finally {
    if (originalWindow) Object.defineProperty(globalThis, "window", originalWindow); else delete globalThis.window;
  }
});

test("CSS remains scoped, has usable touch targets and reduced-motion rules without sticky scene occlusion", async () => {
  const css = await readFile(new URL("../weather-preview/learning/turbulence-workshop.css", import.meta.url), "utf8");
  assert.match(css, /touch-action: none/);
  assert.match(css, /min-height: 44px/);
  assert.match(css, /prefers-reduced-motion: reduce/);
  assert.match(css, /grid-template-columns: minmax\(0, 1fr\)/);
  assert.doesNotMatch(css, /position:\s*(fixed|sticky)/);
  for (const line of css.split("\n").filter(line => line.includes("{") && !line.trim().startsWith("@"))) assert.ok(line.trim().startsWith(".turb-"), line);
});
