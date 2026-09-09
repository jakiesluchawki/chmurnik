import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";
import ts from "typescript";
import { transferCases, orderedOptions } from "../weather-preview/learning/transfer-cases.mjs";
import * as state from "../weather-preview/learning/transfer-state.mjs";

const cases = Object.values(transferCases).flat();
const questions = task => [...task.fields, { ...task.reason, id: "reason" }];
const answer = (record, key, value, api = state) => api.updateTransfer(record, { type: "answer", key, value });
const fill = (record, task, api = state) => Object.entries(task.correct).reduce((r, [key, value]) => answer(r, key, value, api), record);
const taskFor = record => transferCases[record.activityId].find(task => task.id === record.attempt.caseId);
const recordFor = (activityId, task) => {
  let record = state.nextTransfer(state.initialTransfer(activityId));
  while (record.attempt.caseId !== task.id) record = state.nextTransfer(record);
  return record;
};

test("all 28 case IDs and correct answer IDs retain their meaning", () => {
  const expected = {
    bryza: [{ surface: "offshore", return: "onshore", reason: "contrast" }, { surface: "onshore", return: "offshore", reason: "contrast" }],
    chmura: [{ saturation: "second-only", cooling: "continues", reason: "lcl" }, { saturation: "second-only", limit: "unknown", reason: "lcl" }],
    mgla: [{ saturation: "second-only", humidity: "increases", reason: "dewpoint" }, { saturation: "neither", reach: "outside-range", reason: "dewpoint" }],
    obserwacja: [{ structure: "fibres", height: "unmeasured", reason: "evidence" }, { structure: "domes", height: "unmeasured", reason: "evidence" }],
    rodziny: [{ pair: "cs-ci", basis: "organization", reason: "structure" }, { pair: "st-sc", basis: "organization", reason: "structure" }],
    front: [{ saturation: "saturated", parcel: "colder", reason: "separate" }, { saturation: "above-range", parcel: "colder", reason: "separate" }],
    wiatr: [{ from: "315", speed: "unknown", reason: "opposite" }, { lower: "90", upper: "0", inference: "directional-shear", reason: "opposite" }],
    metar: [{ base: "1500", ceiling: "BKN060", time: "base-fm", reason: "cover-time" }, { layers: "both-3500", time: "fm-end", above: "unknown", reason: "cover-time" }],
    wysokosc: [{ agl: "700", reference: "fixed", reason: "reference" }, { position: "below-200", air: "not-air", reason: "reference" }],
    sondaz: [{ warmer: "900", saturation: "950", reason: "same-pressure" }, { parcel: "both-colder", wind: "stronger-turning", projection: "same-data", reason: "same-pressure" }],
    oblodzenie: [{ mechanism: "supported", rate: "unknown", reason: "droplets-surface" }, { mechanism: "inactive", scope: "limited", reason: "droplets-surface" }],
    turbulencja: [{ response: "mechanical-thermal", cloud: "not-required", reason: "flow" }, { mechanism: "speed-shear", intensity: "unknown", reason: "flow" }],
    burza: [{ ingredients: "incomplete", change: "wet", reason: "ingredients-stage" }, { flow: "down", limit: "not-instant", reason: "ingredients-stage" }],
    nazwy: [{ species: "humilis", feature: "none-observed", origin: "unknown", reason: "observed" }, { species: "congestus", feature: "virga", origin: "unknown", reason: "observed" }],
  };
  assert.equal(cases.length, 28);
  assert.deepEqual(Object.keys(transferCases).sort(), Object.keys(expected).sort());
  for (const [id, bank] of Object.entries(transferCases)) {
    assert.deepEqual(bank.map(task => task.id), [`${id}-a-v1`, `${id}-b-v1`]);
    assert.deepEqual(bank.map(task => task.correct), expected[id]);
  }
});

test("ordering is deterministic, unique and independent of labels, array order and saved responses", async () => {
  const reloaded = await import("../weather-preview/learning/transfer-cases.mjs?quality-order-reload");
  for (const task of cases) for (const field of questions(task)) {
    const ids = field.options.map(option => option.id);
    assert.equal(new Set(ids).size, ids.length, `${task.id}/${field.id}`);
    const input = structuredClone(field.options);
    assert.deepEqual(orderedOptions(task.id, field.id, input).map(option => option.id), ids);
    assert.deepEqual(input, field.options, "ordering does not mutate shared options");
    const relabelled = [...input].reverse().map(option => ({ ...option, label: "Nowe brzmienie", feedback: "Inne objaśnienie" }));
    assert.deepEqual(orderedOptions(task.id, field.id, relabelled).map(option => option.id), ids);
    const again = Object.values(reloaded.transferCases).flat().find(item => item.id === task.id);
    assert.deepEqual(questions(again).find(item => item.id === field.id).options.map(option => option.id), ids);
    for (const option of field.options) {
      assert.equal(state.evaluateTransfer(task, { ...task.correct, [field.id]: option.id }).fields[field.id], option.id === task.correct[field.id]);
    }
  }
});

test("neither fixed positions nor the longest/shortest reason recover the answer key", () => {
  const firstPositions = [0, 0, 0, 0], reasonPositions = [0, 0, 0];
  let uniquelyLongest = 0, uniquelyShortest = 0;
  for (const task of cases) {
    const field = task.fields[0];
    if (task.id.includes("-a-")) firstPositions[field.options.findIndex(option => option.id === task.correct[field.id])]++;
    reasonPositions[task.reason.options.findIndex(option => option.id === task.correct.reason)]++;
    const lengths = task.reason.options.map(option => option.label.length);
    const correctLength = task.reason.options.find(option => option.id === task.correct.reason).label.length;
    const otherLengths = task.reason.options.filter(option => option.id !== task.correct.reason).map(option => option.label.length);
    uniquelyLongest += otherLengths.every(length => correctLength > length);
    uniquelyShortest += otherLengths.every(length => correctLength < length);
    assert.ok(Math.max(...lengths) / Math.min(...lengths) <= 1.3, `${task.id}: disproportionate reason lengths`);
    assert.equal(new Set(task.reason.options.map(option => option.label)).size, 3);
    assert.ok(task.reason.options.every(option => option.label.length >= 55 && option.feedback.length > 30));
  }
  assert.ok(firstPositions.filter(Boolean).length >= 3);
  assert.ok(Math.max(...firstPositions) <= 7, firstPositions.join(","));
  assert.ok(reasonPositions.every(count => count >= 4 && count <= 16), reasonPositions.join(","));
  assert.ok(uniquelyLongest > 0 && uniquelyLongest <= 12, `longest: ${uniquelyLongest}/28`);
  assert.ok(uniquelyShortest > 0 && uniquelyShortest <= 12, `shortest: ${uniquelyShortest}/28`);
  const positions = task => questions(task).map(field => field.options.findIndex(option => option.id === task.correct[field.id]));
  assert.notDeepEqual(positions(transferCases.metar[0]), positions(transferCases.metar[1]));
});

test("all learner-facing copy excludes implementation vocabulary while retaining sources", () => {
  for (const task of cases) {
    const text = [task.title, task.context, ...task.facts, task.explanation, task.hint,
      ...questions(task).flatMap(field => [field.label, ...field.options.flatMap(option => [option.label, option.feedback])]),
    ].join("\n");
    assert.doesNotMatch(text, /\b(helper|dry|wet|stable|unstable|lift|possible|belowGround|accretion|amount|true|false|null)\b/i, task.id);
    assert.ok(task.sourceUrls.length > 0 && task.sourceUrls.every(url => new URL(url).protocol === "https:"), task.id);
  }
});

for (const [activityId, bank] of Object.entries(transferCases)) for (const task of bank) {
  test(`${task.id}: decisions lock before reason, back only views, restart archives an unfinished first attempt`, () => {
    let record = recordFor(activityId, task);
    assert.deepEqual(answer(record, "reason", task.correct.reason), record, "reason cannot be answered before decisions");
    for (const field of task.fields) record = answer(record, field.id, field.options[0].id);
    const firstDecisions = structuredClone(record.attempt.response);
    record = state.updateTransfer(record, { type: "step", step: task.fields.length });
    assert.deepEqual(record.attempt.decisionResponse, firstDecisions);
    assert.equal(record.attempt.decisionAssisted, false);
    assert.equal(record.attempt.submitted, false);
    assert.equal(record.attempt.response.reason, undefined);
    assert.deepEqual(state.updateTransfer(record, { type: "submit" }), record);
    for (let step = task.fields.length - 1; step >= 0; step--) {
      record = state.updateTransfer(record, { type: "step", step });
      assert.equal(record.attempt.step, step);
      const field = task.fields[step];
      assert.deepEqual(answer(record, field.id, field.options[1].id), record, "back cannot rewrite decisions");
    }
    record = state.updateTransfer(record, { type: "help", hint: true });
    assert.equal(record.attempt.assisted, true);
    assert.equal(record.attempt.decisionAssisted, false, "help after lock does not rewrite the first decision status");
    const first = structuredClone(record.attempt);
    record = state.updateTransfer(record, { type: "restart-help" });
    assert.equal(record.attempt.caseId, task.id);
    assert.equal(record.attempt.assisted, true);
    assert.equal(record.attempt.repeated, true);
    assert.deepEqual(record.attempt.response, {});
    assert.deepEqual(record.history.at(-1), first);
    assert.deepEqual(record.firstAttempts[task.id], first);
    assert.equal(first.submitted, false, "locking decisions is not a completed assessment");
    record = state.updateTransfer(fill(record, task), { type: "submit" });
    assert.equal(record.attempt.submitted, true);
    assert.equal(record.attempt.decisionAssisted, true);
    assert.deepEqual(record.firstAttempts[task.id], first, "a successful retry never replaces the unfinished original");
    assert.deepEqual(state.restoreTransfer(activityId, JSON.parse(JSON.stringify(record))), record);
  });
}

test("the first submitted answer survives more than 40 later attempts", () => {
  let record = state.nextTransfer(state.initialTransfer("metar"));
  const task = taskFor(record);
  record = fill(record, task);
  record = answer(record, "reason", task.reason.options.find(option => option.id !== task.correct.reason).id);
  record = state.updateTransfer(record, { type: "submit" });
  const first = structuredClone(record.attempt);
  for (let i = 0; i < 45; i++) {
    record = state.nextTransfer(record);
    record = state.updateTransfer(fill(record, taskFor(record)), { type: "submit" });
    record = state.restoreTransfer("metar", JSON.parse(JSON.stringify(record)));
  }
  assert.equal(record.history.length, 40);
  assert.deepEqual(record.firstAttempts[task.id], first);
  assert.equal(state.evaluateTransfer(task, first.response).correct, false);
});

function legacyRecord(task, response, submitted, step = 0) {
  return { revision: 1, activityId: "metar", serial: 1, seen: [task.id], history: [],
    attempt: { caseId: task.id, response, step, assisted: false, hint: false, repeated: false, submitted, revealed: false } };
}

test("legacy submitted answers stay unchanged; legacy drafts are never auto-submitted or silently called independent", () => {
  const task = transferCases.metar[0];
  const submitted = legacyRecord(task, { ...task.correct }, true, task.fields.length);
  assert.deepEqual(state.restoreTransfer("metar", submitted).attempt, submitted.attempt);
  for (const response of [{}, { base: "1500" }, { reason: task.correct.reason }, { ...task.correct }]) {
    for (const step of [0, ...(Object.keys(response).length === questions(task).length ? [task.fields.length] : [])]) {
      const old = legacyRecord(task, response, false, step);
      const restored = state.restoreTransfer("metar", old);
      assert.deepEqual(restored.attempt.response, old.attempt.response);
      assert.equal(restored.attempt.submitted, false);
      assert.equal(restored.attempt.assisted, true);
      assert.equal(restored.attempt.legacy, true);
      assert.deepEqual(restored.firstAttempts[task.id], old.attempt);
      assert.equal(restored.firstAttempts[task.id].submitted, false);
      assert.deepEqual(state.restoreTransfer("metar", restored), restored);
    }
  }
});

let moduleSerial = 0;

test("legacy retained repeats never stand in for a missing first attempt", () => {
  const task = transferCases.metar[0];
  const old = legacyRecord(task, { ...task.correct }, true, task.fields.length);
  old.serial = 50;
  old.attempt.repeated = true;
  old.history = [structuredClone(old.attempt)];
  const restored = state.restoreTransfer("metar", old);
  assert.deepEqual(restored.attempt, old.attempt);
  assert.equal(restored.firstAttempts[task.id], undefined);
  assert.equal(state.nextTransfer(restored).firstAttempts[task.id], undefined);
});

async function fixture(t) {
  const api = await import(`../weather-preview/learning/transfer-state.mjs?quality=${++moduleSerial}`);
  const originals = Object.fromEntries(["localStorage", "window"].map(key => [key, Object.getOwnPropertyDescriptor(globalThis, key)]));
  const data = new Map();
  const storage = { getItem: key => data.get(key) ?? null, setItem: (key, value) => data.set(key, String(value)) };
  Object.defineProperty(globalThis, "localStorage", { configurable: true, value: storage });
  Object.defineProperty(globalThis, "window", { configurable: true, value: new EventTarget() });
  t.after(() => { for (const [key, descriptor] of Object.entries(originals)) descriptor ? Object.defineProperty(globalThis, key, descriptor) : delete globalThis[key]; });
  return { api, data, storage };
}

test("stale saves cannot unlock decisions, rewrite their first values, or clear help", async t => {
  const { api, storage } = await fixture(t);
  let draft = api.nextTransfer(api.initialTransfer("metar"));
  const task = taskFor(draft);
  for (const field of task.fields) draft = answer(draft, field.id, field.options[0].id, api);
  api.saveTransfer(draft);
  const locked = api.updateTransfer(draft, { type: "step", step: task.fields.length });
  api.saveTransfer(locked);
  api.saveTransfer(api.updateTransfer(locked, { type: "help", hint: true }));
  const stale = answer(draft, task.fields[0].id, task.fields[0].options[1].id, api);
  api.saveTransfer(stale);
  const saved = api.loadTransfer("metar");
  assert.deepEqual(saved.attempt.decisionResponse, locked.attempt.decisionResponse);
  assert.deepEqual(saved.attempt.response, locked.attempt.response);
  assert.equal(saved.attempt.assisted, true);
  assert.equal(saved.attempt.decisionAssisted, false);
  assert.equal(saved.attempt.hint, true);
  storage.setItem = () => { throw new Error("QuotaExceededError"); };
  const committed = api.updateTransfer(answer(saved, "reason", task.correct.reason, api), { type: "submit" });
  assert.equal(api.saveTransfer(committed), false);
  assert.deepEqual(api.loadTransfer("metar"), committed);
  api.saveTransfer(stale);
  assert.deepEqual(api.loadTransfer("metar"), committed);
});

const source = await readFile(new URL("../weather-preview/learning/TransferTrial.jsx", import.meta.url), "utf8");
const parsed = ts.createSourceFile("TransferTrial.jsx", source, ts.ScriptTarget.Latest, true, ts.ScriptKind.JSX);
const body = parsed.statements.find(node => ts.isFunctionDeclaration(node) && node.name?.text === "TransferTrial").getText(parsed);
const compiled = ts.transpileModule(body, { compilerOptions: { jsx: ts.JsxEmit.React, target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS } });

// Exercise the actual component handlers without a browser, server or build.
function harness(api, activityId) {
  const slots = [], effects = new Map();
  let cursor = 0, pending = [], tree;
  const context = {
    ...api, transferCases, exports: {}, window: globalThis.window, URL,
    ArrowLeft: "ArrowLeft", ArrowRight: "ArrowRight", Check: "Check", Question: "Question",
    requestAnimationFrame: callback => callback(),
    React: { createElement: (type, props, ...children) => ({ type, props: props || {}, children }) },
    useState(initial) {
      const index = cursor++;
      if (!(index in slots)) slots[index] = typeof initial === "function" ? initial() : initial;
      return [slots[index], value => { slots[index] = typeof value === "function" ? value(slots[index]) : value; }];
    },
    useRef(initial) { const index = cursor++; return slots[index] ||= { current: initial }; },
    useEffect(setup, deps) {
      const index = cursor++, old = effects.get(index);
      if (!old || deps.some((value, i) => !Object.is(value, old.deps[i]))) pending.push(() => {
        old?.cleanup?.(); effects.set(index, { deps, setup, cleanup: setup() });
      });
    },
  };
  const Component = vm.runInNewContext(`${compiled.outputText}; TransferTrial`, context);
  const nodes = root => Array.isArray(root) ? root.flatMap(nodes) : root && typeof root === "object" ? [root, ...root.children.flatMap(nodes)] : [];
  const text = root => Array.isArray(root) ? root.map(text).join("") : root && typeof root === "object" ? root.children.map(text).join("") : typeof root === "string" ? root : "";
  function render() {
    cursor = 0; tree = Component({ activityId });
    const work = pending; pending = []; work.forEach(effect => effect());
  }
  function click(label) {
    const button = nodes(tree).find(node => node.type === "button" && text(node).trim() === label);
    assert.ok(button, `missing button ${label}`);
    assert.ok(!button.props.disabled, `disabled button ${label}`);
    button.props.onClick(); render();
  }
  const unmount = () => { for (const effect of effects.values()) effect.cleanup?.(); effects.clear(); };
  render();
  return { nodes: () => nodes(tree), text: () => text(tree), click, render, unmount,
    answer(id) {
      const input = nodes(tree).find(node => node.type === "input" && node.props.value === id);
      assert.ok(input && !input.props.disabled, `missing/enabled input ${id}`);
      input.props.onChange(); render();
    },
    strictReplay() { for (const effect of effects.values()) { effect.cleanup?.(); effect.cleanup = effect.setup(); } render(); },
  };
}

test("rendered flow conceals reason until locking, disables back edits and explicitly labels an assisted restart", async t => {
  const { api } = await fixture(t);
  const ui = harness(api, "metar"); t.after(ui.unmount);
  const task = taskFor(api.loadTransfer("metar"));
  for (const field of task.fields) {
    for (const option of task.reason.options) assert.ok(!ui.text().includes(option.label));
    ui.answer(task.correct[field.id]); ui.click("Dalej");
  }
  assert.ok(api.loadTransfer("metar").attempt.decisionResponse);
  for (const option of task.reason.options) assert.ok(ui.text().includes(option.label));
  ui.click("Wstecz");
  assert.ok(ui.nodes().filter(node => node.type === "input").every(node => node.props.disabled));
  const first = structuredClone(api.loadTransfer("metar").attempt);
  ui.nodes().find(node => node.type === "input").props.onChange(); ui.render();
  assert.deepEqual(api.loadTransfer("metar").attempt, first, "even a stale handler cannot rewrite primary answers");
  ui.click("Zmień decyzje w powtórce z pomocą");
  assert.ok(ui.text().includes("Próba z pomocą"));
  const retry = api.loadTransfer("metar");
  assert.equal(retry.attempt.submitted, false);
  assert.deepEqual(retry.firstAttempts[task.id], first);
  assert.deepEqual(retry.attempt.response, {});
  assert.ok(ui.nodes().filter(node => node.type === "input").every(node => !node.props.disabled));
});

test("normal back, effect replay and unmount are not help; a hint or source exposure is help", async t => {
  const { api } = await fixture(t);
  let ui = harness(api, "metar");
  ui.strictReplay();
  ui.answer("1500"); ui.click("Dalej"); ui.click("Wstecz");
  assert.equal(api.loadTransfer("metar").attempt.assisted, false);
  ui.unmount();
  assert.equal(api.loadTransfer("metar").attempt.assisted, false);
  assert.equal(api.loadTransfer("metar").attempt.submitted, false);
  ui = harness(api, "metar");
  ui.click("Przypomnij zasadę");
  assert.equal(api.loadTransfer("metar").attempt.assisted, true);
  assert.equal(api.loadTransfer("metar").attempt.hint, true);
  ui.unmount();
  ui = harness(api, "obserwacja"); t.after(ui.unmount);
  ui.click("Pokaż źródło (może ujawnić odpowiedź)");
  assert.equal(api.loadTransfer("obserwacja").attempt.assisted, true);
  assert.equal(api.loadTransfer("obserwacja").attempt.submitted, false);
});

test("legacy completed results are identified as old, not upgraded to new independent success", async t => {
  const { api, data } = await fixture(t);
  const task = transferCases.metar[0];
  const old = legacyRecord(task, { ...task.correct }, true, task.fields.length);
  data.set(`${api.TRANSFER_KEY}:metar`, JSON.stringify(old));
  const ui = harness(api, "metar"); t.after(ui.unmount);
  assert.ok(ui.text().includes("wcześniejszej wersji"));
  assert.ok(!ui.text().includes("Poprawna decyzja i właściwa zasada"));
  assert.deepEqual(api.loadTransfer("metar").attempt, old.attempt);
});

function linkEvent(type, { inside = false, link = true, button = 0, prevented = false } = {}) {
  const event = new Event(type, { cancelable: true });
  Object.defineProperties(event, {
    button: { value: button },
    target: { value: { closest: selector => selector === "a[href]" ? link && {} : selector === ".transfer-trial" ? inside && {} : null } },
  });
  if (prevented) event.preventDefault();
  return event;
}

test("route changes and outside lesson/catalog links preserve assistance on return, including locked decisions", async t => {
  const { api } = await fixture(t);
  for (const activityId of ["bryza", "metar"]) for (const locked of [false, true]) {
    for (const event of [new Event("hashchange"), new Event("popstate"), linkEvent("click"), linkEvent("auxclick", { button: 1 })]) {
      let record = api.nextTransfer(api.loadTransfer(activityId));
      const task = taskFor(record);
      for (const field of task.fields) record = answer(record, field.id, task.correct[field.id], api);
      if (locked) record = api.updateTransfer(record, { type: "step", step: task.fields.length });
      api.saveTransfer(record);
      let ui = harness(api, activityId);
      window.dispatchEvent(event);
      ui.unmount();
      const returned = api.loadTransfer(activityId);
      assert.equal(returned.attempt.assisted, true, `${activityId}/${event.type}/${locked}`);
      assert.equal(returned.attempt.hint, false, "external help is not an in-trial hint");
      assert.equal(returned.attempt.submitted, false);
      assert.deepEqual(returned.attempt.response, record.attempt.response);
      assert.deepEqual(returned.attempt.decisionResponse, record.attempt.decisionResponse);
      assert.equal(returned.attempt.decisionAssisted, record.attempt.decisionAssisted);
      assert.deepEqual(returned.firstAttempts, record.firstAttempts);
      ui = harness(api, activityId);
      assert.ok(ui.text().includes("Próba z pomocą"));
      ui.unmount();
    }
  }
});

test("navigation listeners ignore non-exposure, detach on cleanup and cannot rewrite a submitted first result", async t => {
  const { api } = await fixture(t);
  let ui = harness(api, "metar");
  ui.strictReplay();
  const draft = structuredClone(api.loadTransfer("metar"));
  for (const event of [linkEvent("click", { inside: true }), linkEvent("click", { link: false }),
    linkEvent("auxclick", { button: 2 }), linkEvent("click", { prevented: true })]) window.dispatchEvent(event);
  assert.deepEqual(api.loadTransfer("metar"), draft);
  ui.unmount();
  for (const event of [new Event("hashchange"), new Event("popstate"), linkEvent("click"), linkEvent("auxclick", { button: 1 })]) window.dispatchEvent(event);
  assert.deepEqual(api.loadTransfer("metar"), draft, "unmounted listeners cannot mark a later unrelated navigation as help");
  const committed = api.updateTransfer(fill(draft, taskFor(draft), api), { type: "submit" });
  api.saveTransfer(committed);
  ui = harness(api, "metar");
  for (const event of [new Event("hashchange"), new Event("popstate"), linkEvent("click")]) window.dispatchEvent(event);
  ui.unmount();
  assert.deepEqual(api.loadTransfer("metar"), committed, "leaving a result is not help for its already submitted answers");
});
