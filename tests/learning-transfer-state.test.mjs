import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createServer } from "vite";
import vm from "node:vm";
import ts from "typescript";
import { activities, sources, lessonStateAt, lessonStepComplete } from "../weather-preview/learning/catalog.mjs";
import { guideProbes } from "../weather-preview/learning/guide-probes.mjs";
import { returnLesson } from "../weather-preview/tutorial.mjs";
import { transferCases } from "../weather-preview/learning/transfer-cases.mjs";
import {
  TRANSFER_KEY, TRANSFER_REVISION, initialTransfer, nextTransfer, updateTransfer,
  validResponse, evaluateTransfer, restoreTransfer, loadTransfer, saveTransfer,
  markTransferHelp,
} from "../weather-preview/learning/transfer-state.mjs";

const activityIds = [...Object.keys(activities), "bryza", "chmura", "mgla"].sort();
const componentCleanups = new WeakMap();
const keyFor = id => `${TRANSFER_KEY}:${id}`;
const questions = task => [...task.fields, { ...task.reason, id: "reason" }];
const clone = value => structuredClone(value);
const answer = (record, key, value) => updateTransfer(record, { type: "answer", key, value });
const complete = (record, response) => Object.entries(response).reduce(
  (draft, [key, value]) => answer(draft, key, value), record,
);
const submit = record => updateTransfer(record, { type: "submit" });
const currentTask = record => transferCases[record.activityId].find(task => task.id === record.attempt.caseId);
function caseRecord(activityId, caseId) {
  assert.ok(transferCases[activityId]?.some(task => task.id === caseId), `missing ${activityId}/${caseId}`);
  let record = initialTransfer(activityId);
  do { record = nextTransfer(record); } while (record.attempt.caseId !== caseId);
  return record;
}
function replaceGlobal(t, name, descriptor) {
  const previous = Object.getOwnPropertyDescriptor(globalThis, name);
  Object.defineProperty(globalThis, name, { configurable: true, ...descriptor });
  t.after(() => previous ? Object.defineProperty(globalThis, name, previous) : delete globalThis[name]);
}
function storageFixture(t) {
  const cleanups = [];
  t.after(() => { for (const cleanup of cleanups) cleanup(); });
  const data = new Map();
  const writes = [];
  const storage = {
    getItem: key => data.get(key) ?? null,
    setItem(key, value) { writes.push([key, value]); data.set(key, String(value)); },
    removeItem(key) { writes.push([key, null]); data.delete(key); },
    clear() { writes.push(["clear", null]); data.clear(); },
  };
  replaceGlobal(t, "localStorage", { writable: true, value: storage });
  const browserWindow = new EventTarget();
  componentCleanups.set(browserWindow, cleanups);
  Object.defineProperty(browserWindow, "localStorage", { get: () => globalThis.localStorage });
  replaceGlobal(t, "window", { writable: true, value: browserWindow });
  return { data, writes, storage };
}
let freshImport = 0;
const freshState = () => import(`../weather-preview/learning/transfer-state.mjs?review=${++freshImport}`);

test("transfer bank covers all 14 activities and at least 28 reachable case keys", () => {
  assert.equal(activityIds.length, 14);
  assert.deepEqual(Object.keys(transferCases).sort(), activityIds);
  const ids = new Set();
  for (const activityId of activityIds) {
    assert.ok(transferCases[activityId].length >= 2, activityId);
    for (const task of transferCases[activityId]) {
      assert.ok(!ids.has(task.id), `duplicate case: ${task.id}`);
      ids.add(task.id);
      const fields = questions(task);
      assert.equal(new Set(fields.map(field => field.id)).size, fields.length, task.id);
      assert.deepEqual(Object.keys(task.correct).sort(), fields.map(field => field.id).sort(), task.id);
      for (const field of fields) {
        assert.equal(new Set(field.options.map(option => option.id)).size, field.options.length);
        assert.ok(field.options.some(option => option.id === task.correct[field.id]), `${task.id}/${field.id}`);
        assert.ok(field.options.every(option => option.label && option.feedback), `${task.id}/${field.id}`);
      }
      assert.equal(validResponse(task, task.correct, true), true, task.id);
      assert.equal(evaluateTransfer(task, task.correct).correct, true, task.id);
    }
  }
  assert.ok(ids.size >= 28);
});

for (const activityId of activityIds) {
  const bank = transferCases[activityId] || [];
  for (const task of bank) {
    const label = `${activityId}/${task.id}`;
    test(`${label}: empty draft and incomplete submit never commit an answer`, () => {
      let record = caseRecord(activityId, task.id);
      assert.deepEqual(record.attempt.response, {});
      assert.equal(record.attempt.step, 0);
      assert.equal(record.attempt.submitted, false);
      assert.equal(evaluateTransfer(task, {}), null);
      for (const field of questions(task)) {
        const before = clone(record);
        assert.deepEqual(submit(record), before);
        record = answer(record, field.id, task.correct[field.id]);
        assert.equal(record.attempt.submitted, false, field.id);
        assert.equal(record.attempt.revealed, false, field.id);
      }
      assert.equal(submit(record).attempt.submitted, true);
    });

    test(`${label}: draft edits and step navigation preserve choices without feedback`, () => {
      let record = caseRecord(activityId, task.id);
      const initial = record;
      const start = clone(record);
      for (const step of [-1, 0.5, NaN, Infinity, "1", task.fields.length + 1, 1]) {
        assert.deepEqual(updateTransfer(record, { type: "step", step }), start, String(step));
      }
      for (const [index, field] of questions(task).entries()) {
        record = answer(record, field.id, field.options[0].id);
        record = answer(record, field.id, field.options.at(-1).id);
        assert.equal(record.attempt.response[field.id], field.options.at(-1).id);
        if (index < task.fields.length) {
          record = updateTransfer(record, { type: "step", step: index + 1 });
          assert.equal(record.attempt.step, index + 1);
        }
      }
      const response = clone(record.attempt.response);
      for (let step = task.fields.length; step >= 0; step--) {
        record = updateTransfer(record, { type: "step", step });
        assert.equal(record.attempt.step, step);
        assert.deepEqual(record.attempt.response, response);
      }
      assert.deepEqual(initial, start, "reducer must not mutate its input");
      assert.equal(record.attempt.submitted, false);
      for (const action of [
        { type: "answer", key: "unknown", value: "unknown" },
        { type: "answer", key: "__proto__", value: "unknown" },
        { type: "answer", key: task.fields[0].id, value: "invalid-option" },
        { type: "answer", key: "reason", value: null }, { type: "unknown" },
      ]) assert.deepEqual(updateTransfer(record, action), record);
    });

    test(`${label}: every wrong choice is partial, including correct decision with wrong reason`, () => {
      for (const field of questions(task)) for (const option of field.options) {
        const response = { ...task.correct, [field.id]: option.id };
        const expected = Object.fromEntries(questions(task).map(item => [item.id, item.id !== field.id || option.id === task.correct[field.id]]));
        assert.deepEqual(evaluateTransfer(task, response), {
          fields: expected, correct: option.id === task.correct[field.id],
        }, `${field.id}/${option.id}`);
      }
      for (const invalid of [null, [], "answer", 1, {}, { ...task.correct, reason: "invalid" }, { ...task.correct, extra: "invalid" }]) {
        assert.equal(evaluateTransfer(task, invalid), null);
      }
    });

    test(`${label}: help persists through edits and submitted/revealed results are frozen`, () => {
      for (const action of [{ type: "help" }, { type: "help", hint: true }, { type: "reveal" }]) {
        let record = updateTransfer(caseRecord(activityId, task.id), action);
        assert.equal(record.attempt.assisted, true);
        assert.equal(record.attempt.hint, action.hint === true);
        if (action.type !== "reveal") {
          record = complete(record, task.correct);
          assert.equal(record.attempt.assisted, true);
          record = submit(record);
        }
        assert.equal(record.attempt.submitted, true);
        assert.equal(record.attempt.revealed, action.type === "reveal");
        const frozen = clone(record);
        for (const later of [
          { type: "answer", key: "reason", value: task.reason.options[0].id },
          { type: "step", step: 0 }, { type: "help", hint: true },
          { type: "reveal" }, { type: "submit" },
        ]) assert.deepEqual(updateTransfer(record, later), frozen);
      }
      const independent = submit(complete(caseRecord(activityId, task.id), task.correct));
      assert.equal(independent.attempt.assisted, false);
      assert.deepEqual(updateTransfer(independent, { type: "help" }), independent);
    });
  }

  test(`${activityId}: new cases clear fields and exhausted bank is explicitly repeated`, () => {
    let record = initialTransfer(activityId);
    const visited = [];
    for (let i = 0; i < bank.length * 2 + 1; i++) {
      const old = clone(record);
      record = nextTransfer(record);
      const a = record.attempt;
      assert.equal(a.repeated, visited.includes(a.caseId));
      assert.deepEqual(a.response, {});
      assert.equal(a.step, 0);
      for (const flag of ["hint", "assisted", "submitted", "revealed"]) assert.equal(a[flag], false, flag);
      assert.equal(record.serial, old.serial + 1);
      if (old.attempt) {
        assert.notEqual(a.caseId, old.attempt.caseId);
        assert.deepEqual(record.history.at(-1), old.attempt);
      }
      visited.push(a.caseId);
      record = complete(record, currentTask(record).correct);
      record = updateTransfer(record, { type: "help", hint: true });
      record = updateTransfer(record, { type: "reveal" });
    }
    assert.equal(new Set(visited.slice(0, bank.length)).size, bank.length);
    assert.deepEqual(record.seen, [...new Set(visited)]);
  });

  test(`${activityId}: first committed answer survives retry, reload and history rotation (last 40)`, () => {
    let record = nextTransfer(initialTransfer(activityId));
    const task = currentTask(record);
    const wrongReason = task.reason.options.find(option => option.id !== task.correct.reason).id;
    record = submit(complete(record, { ...task.correct, reason: wrongReason }));
    const first = clone(record.attempt);
    record = nextTransfer(record);
    assert.deepEqual(record.history[0], first);
    assert.equal(record.history[0].response.reason, wrongReason);
    record = restoreTransfer(activityId, JSON.parse(JSON.stringify(record)));
    assert.deepEqual(record.history[0], first);
    const all = [first];
    for (let i = 0; i < 45; i++) {
      record = submit(complete(record, currentTask(record).correct));
      all.push(clone(record.attempt));
      record = nextTransfer(record);
      assert.deepEqual(record.history, all.slice(-40));
    }
    assert.equal(record.history.length, 40);
    assert.deepEqual(restoreTransfer(activityId, clone(record)).history, all.slice(-40));
  });

  test(`${activityId}: corrupt active records are rejected without reusing seen cases as new`, () => {
    const record = nextTransfer(initialTransfer(activityId));
    for (const invalid of [null, [], 42, "record", {},
      { ...record, revision: TRANSFER_REVISION + 1 }, { ...record, activityId: "invalid" },
      { ...record, serial: -1 }, { ...record, serial: 0.5 },
      { ...record, serial: Number.MAX_SAFE_INTEGER + 1 }, { ...record, seen: ["missing-case"] },
    ]) assert.deepEqual(restoreTransfer(activityId, invalid), initialTransfer(activityId));
    for (const damaged of [
      { caseId: "missing-case" }, { response: [] }, { response: { reason: "invalid" } },
      { submitted: true }, { hint: true, assisted: false }, { revealed: true },
      { step: -1 }, { step: 0.5 }, { step: 1 }, { step: 100 }, { assisted: "true" },
    ]) {
      const restored = restoreTransfer(activityId, { ...record, attempt: { ...record.attempt, ...damaged } });
      assert.equal(restored.attempt, null, JSON.stringify(damaged));
      assert.deepEqual(restored.seen, record.seen);
      assert.notEqual(nextTransfer(restored).attempt.caseId, record.attempt.caseId);
    }
  });

  test(`${activityId}: persistence and a fresh module reload never clear help or committed answers`, async t => {
    const { data } = storageFixture(t);
    let record = nextTransfer(initialTransfer(activityId));
    record = answer(record, currentTask(record).fields[0].id, currentTask(record).fields[0].options[0].id);
    record = updateTransfer(record, { type: "help", hint: true });
    assert.equal(saveTransfer(record), true);
    assert.deepEqual(loadTransfer(activityId), record);
    const reloaded = await freshState();
    assert.deepEqual(reloaded.loadTransfer(activityId), record);
    assert.equal(reloaded.loadTransfer(activityId).attempt.assisted, true);
    assert.equal(reloaded.loadTransfer(activityId).attempt.hint, true);
    record = submit(complete(record, currentTask(record).correct));
    saveTransfer(record);
    assert.deepEqual(reloaded.loadTransfer(activityId), record);
    data.set(keyFor(activityId), "{broken-json");
    assert.doesNotThrow(() => reloaded.loadTransfer(activityId));
    assert.equal(reloaded.loadTransfer(activityId).attempt, null);
  });

  test(`${activityId}: help event identifies the activity and cannot alter a committed result`, t => {
    storageFixture(t);
    const events = [];
    window.addEventListener("chmurnik:transfer-help", event => events.push(event.detail));
    let record = nextTransfer(initialTransfer(activityId));
    saveTransfer(record);
    markTransferHelp(activityId);
    assert.deepEqual(events, [activityId]);
    assert.equal(loadTransfer(activityId).attempt.assisted, true);
    assert.equal(loadTransfer(activityId).attempt.submitted, false);
    record = submit(complete(loadTransfer(activityId), currentTask(record).correct));
    saveTransfer(record);
    markTransferHelp(activityId);
    assert.deepEqual(loadTransfer(activityId), record);
    assert.deepEqual(events, [activityId]);
  });

  test(`${activityId}: quota failure must prefer current session memory to the older disk record`, t => {
    const { storage } = storageFixture(t);
    const draft = nextTransfer(initialTransfer(activityId));
    saveTransfer(draft);
    storage.setItem = () => { throw new Error("QuotaExceededError"); };
    const helped = updateTransfer(draft, { type: "help", hint: true });
    assert.equal(saveTransfer(helped), false);
    assert.deepEqual(loadTransfer(activityId), helped, "older persistent record must not erase current help/draft");
  });

  test(`${activityId}: persistence merges help and rejects stale committed or older-generation writes`, t => {
    storageFixture(t);
    const draft = nextTransfer(initialTransfer(activityId));
    saveTransfer(updateTransfer(draft, { type: "help", hint: true }));
    const field = currentTask(draft).fields[0];
    saveTransfer(answer(draft, field.id, field.options[0].id));
    const helped = loadTransfer(activityId);
    assert.equal(helped.attempt.assisted, true);
    assert.equal(helped.attempt.hint, true);
    assert.equal(helped.attempt.response[field.id], field.options[0].id);
    const committed = submit(complete(helped, currentTask(helped).correct));
    saveTransfer(committed);
    saveTransfer(draft);
    assert.deepEqual(loadTransfer(activityId), committed);
    const next = nextTransfer(committed);
    saveTransfer(next);
    saveTransfer(committed);
    assert.deepEqual(loadTransfer(activityId), next);
    assert.deepEqual(loadTransfer(activityId).history.at(-1), committed.attempt);
  });
}

test("storage errors and unavailable storage retain a session-only attempt", async t => {
  const api = await freshState();
  storageFixture(t);
  const record = updateTransfer(nextTransfer(initialTransfer("metar")), { type: "reveal" });
  replaceGlobal(t, "localStorage", { get() { throw new Error("SecurityError"); } });
  assert.equal(api.saveTransfer(record), false);
  assert.deepEqual(api.loadTransfer("metar"), record);
});

test("successful recovery releases pending memory and reads later persistent records", async t => {
  const { data, storage } = storageFixture(t);
  const api = await freshState();
  const originalWrite = storage.setItem;
  const first = nextTransfer(initialTransfer("metar"));
  api.saveTransfer(first);
  storage.setItem = () => { throw new Error("QuotaExceededError"); };
  const helped = updateTransfer(first, { type: "help", hint: true });
  assert.equal(api.saveTransfer(helped), false);
  assert.deepEqual(api.loadTransfer("metar"), helped);
  storage.setItem = originalWrite;
  assert.equal(api.saveTransfer(helped), true);
  const later = nextTransfer(helped);
  data.set(keyFor("metar"), JSON.stringify(later));
  assert.deepEqual(api.loadTransfer("metar"), later, "successful recovery must not keep shadowing storage");
});

test("corrupt history uses the same status invariants as a current attempt", () => {
  const record = nextTransfer(initialTransfer("metar"));
  const corrupt = [
    { ...record.attempt, hint: true, assisted: false },
    { ...record.attempt, revealed: true, assisted: false, submitted: false },
    { ...record.attempt, step: -1 },
    { ...record.attempt, response: { invalid: "answer" } },
  ];
  assert.deepEqual(restoreTransfer("metar", { ...record, history: corrupt }).history, []);
});

test("transfer actions never write production progress, lesson positions, photos or old A/B trials", t => {
  const { data, writes } = storageFixture(t);
  const protectedKeys = [
    "cloud-recognition:progress", "cloud-recognition:lesson-positions",
    "cloud-recognition:observation-draft", "cloud-recognition:photo-feedback",
    "cloud-recognition:journal", "cloud-recognition:recognition",
    "chmurnik:weather-preview:v1", "chmurnik:onboarding:v1",
  ];
  for (const key of protectedKeys) data.set(key, JSON.stringify({ sentinel: key }));
  const before = new Map(data);
  for (const activityId of activityIds) {
    let record = nextTransfer(initialTransfer(activityId));
    saveTransfer(record);
    markTransferHelp(activityId);
    record = complete(loadTransfer(activityId), currentTask(record).correct);
    saveTransfer(submit(record));
    saveTransfer(nextTransfer(loadTransfer(activityId)));
    saveTransfer(updateTransfer(loadTransfer(activityId), { type: "reveal" }));
  }
  assert.ok(writes.length > activityIds.length);
  for (const [key] of writes) assert.ok(activityIds.some(id => key === keyFor(id)), key);
  for (const [key, value] of before) assert.equal(data.get(key), value, key);
});

const textMarkup = text => renderToStaticMarkup(React.createElement("span", null, text)).slice(6, -7);
function assertConcealed(html, task) {
  for (const token of ["transfer-feedback", "Właściwy wniosek:", "Twoja odpowiedź:", 'aria-label="Poprawnie"']) {
    assert.ok(!html.includes(token), `${task.id}: premature ${token}`);
  }
  for (const text of [task.explanation, task.hint, ...questions(task).flatMap(field => field.options.map(option => option.feedback))]) {
    assert.ok(!html.includes(textMarkup(text)), `${task.id}: premature feedback: ${text}`);
  }
  for (const photo of task.images || (task.image ? [task.image] : [])) {
    assert.ok(!html.includes(textMarkup(photo.sourceUrl)), `${task.id}: source before help`);
    if (photo.accessibleDescription) assert.ok(!html.includes(textMarkup(photo.accessibleDescription)));
  }
}

test("Vite SSR: all cases conceal actual rendered feedback until full commitment", async t => {
  const { data, writes } = storageFixture(t);
  const cacheDir = await mkdtemp(join(tmpdir(), "chmurnik-transfer-ssr-"));
  t.after(() => rm(cacheDir, { recursive: true, force: true }));
  // Middleware mode plus ws:false loads JSX/CSS without any HTTP/WebSocket listener.
  const server = await createServer({
    configFile: false, root: fileURLToPath(new URL("..", import.meta.url)),
    cacheDir, publicDir: false, logLevel: "error",
    server: { middlewareMode: true, ws: false, hmr: false, watch: null },
    optimizeDeps: { noDiscovery: true, include: [] },
  });
  t.after(() => server.close());
  assert.equal(server.httpServer, null);
  const { TransferTrial } = await server.ssrLoadModule("/weather-preview/learning/TransferTrial.jsx");
  const render = record => {
    data.set(keyFor(record.activityId), JSON.stringify(record));
    return renderToStaticMarkup(React.createElement(TransferTrial, { activityId: record.activityId }));
  };
  for (const activityId of activityIds) for (const task of transferCases[activityId]) {
    await t.test(`${task.id}: blank, every draft step, wrong reason, commit, reveal and next`, () => {
      let record = caseRecord(activityId, task.id);
      const empty = render(record);
      assertConcealed(empty, task);
      assert.ok(!empty.includes("checked="), `${task.id}: default selected answer`);
      assert.ok(empty.includes('disabled=""'), `${task.id}: blank answer must disable advance`);
      assert.ok(empty.includes(`data-case="${task.id}"`));
      for (const [index, field] of questions(task).entries()) {
        record = answer(record, field.id, task.correct[field.id]);
        record = updateTransfer(record, { type: "step", step: index });
        assertConcealed(render(record), task);
      }
      const wrong = task.reason.options.find(option => option.id !== task.correct.reason);
      const partial = render(submit(answer(record, "reason", wrong.id)));
      assert.ok(partial.includes("transfer-feedback"));
      assert.ok(partial.includes(textMarkup(wrong.feedback)));
      assert.ok(!partial.includes("Poprawna decyzja i właściwa zasada"));
      assert.equal((partial.match(/<li><details open=""/g) || []).length, 1, "only the wrong reason starts expanded");
      const committed = render(submit(record));
      assert.ok(committed.includes("transfer-feedback"));
      assert.ok(committed.includes(textMarkup(task.explanation)));
      assert.ok(committed.includes("Poprawna decyzja i właściwa zasada"));
      assert.ok(!committed.includes('type="radio"'));
      assert.equal((committed.match(/<li><details open=""/g) || []).length, 0, "correct answers stay collapsed");
      for (const field of questions(task)) assert.ok(committed.includes(textMarkup(field.options.find(option => option.id === task.correct[field.id]).label)));
      const helped = render(submit(updateTransfer(record, { type: "help", hint: true })));
      assert.ok(helped.includes("Poprawnie, z pomocą"));
      const revealed = render(updateTransfer(caseRecord(activityId, task.id), { type: "reveal" }));
      assert.ok(revealed.includes("Wyjaśnienie bez oceny"));
      assert.ok(!revealed.includes("Poprawna decyzja i właściwa zasada"));
      assert.equal((revealed.match(/<li><details open=""/g) || []).length, questions(task).length);
      const next = nextTransfer(submit(record));
      const nextHtml = render(next);
      assertConcealed(nextHtml, currentTask(next));
      assert.ok(!nextHtml.includes("checked="));
      assert.ok(nextHtml.includes(next.attempt.repeated ? "powtórka znanego przypadku" : "nowy przypadek"));
      if (next.attempt.repeated) assert.ok(render(submit(complete(next, currentTask(next).correct))).includes("Poprawna odpowiedź w powtórce"));
    });
  }
  for (const [key] of writes) assert.ok(activityIds.some(id => key === keyFor(id)), key);
});

async function componentCode(path, names) {
  const source = await readFile(new URL(path, import.meta.url), "utf8");
  const parsed = ts.createSourceFile(path, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.JSX);
  const functions = parsed.statements.filter(node => ts.isFunctionDeclaration(node) && names.includes(node.name?.text));
  assert.equal(functions.length, names.length, path);
  const code = ts.transpileModule(functions.map(node => node.getText(parsed)).join("\n"), {
    compilerOptions: { jsx: ts.JsxEmit.React, target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
  }).outputText;
  return `${code}\n${names.at(-1)}`;
}
const trialCode = await componentCode("../weather-preview/learning/TransferTrial.jsx", ["TransferTrial"]);
const studioCode = await componentCode("../weather-preview/learning/LearningStudio.jsx", ["visibleControls", "LearningStudio"]);

// Actual component bodies/handlers with deterministic hooks, not a browser or React scheduler.
// SSR above independently checks the real React markup; this harness checks events and cleanup.
function componentHarness(code, props) {
  const slots = [];
  const effects = new Map();
  let cursor = 0, tree, pendingEffects = [], pendingState = [];
  const context = {
    exports: {}, transferCases, activities, sources, lessonStateAt, lessonStepComplete, returnLesson, guideProbes,
    loadTransfer, saveTransfer, nextTransfer, updateTransfer, evaluateTransfer, markTransferHelp,
    React: { createElement: (type, props, ...children) => ({ type, props: props || {}, children }), Fragment: "fragment" },
    useState(initial) {
      const index = cursor++;
      if (!(index in slots)) slots[index] = typeof initial === "function" ? initial() : initial;
      return [slots[index], value => pendingState.push(() => {
        const next = typeof value === "function" ? value(slots[index]) : value;
        slots[index] = next;
      })];
    },
    useRef(initial) {
      const index = cursor++;
      if (!(index in slots)) slots[index] = { current: initial };
      return slots[index];
    },
    useEffect(setup, deps) {
      const index = cursor++;
      const previous = effects.get(index);
      if (!previous || deps.some((value, i) => !Object.is(value, previous.deps[i]))) {
        pendingEffects.push(() => {
          previous?.cleanup?.();
          effects.set(index, { deps, setup, cleanup: setup() });
        });
      }
    },
    window: globalThis.window, URL,
    document: { hidden: false, addEventListener() {}, removeEventListener() {} },
    matchMedia: () => ({ matches: false, addEventListener() {}, removeEventListener() {} }),
    location: { search: "?from=procesy" }, requestAnimationFrame: callback => callback(),
  };
  for (const name of ["TransferTrial", "GuidedInvestigation", "ActivityScene", "Control", "ArrowLeft", "ArrowRight", "BookOpen", "Check", "Question", "Pause", "Play", "ArrowCounterClockwise", "GridFour"]) context[name] = name;
  const Component = vm.runInNewContext(code, context);
  function render() {
    let count = 0;
    do {
      while (pendingState.length) pendingState.shift()();
      cursor = 0;
      tree = Component(props);
      while (pendingEffects.length) pendingEffects.shift()();
      assert.ok(++count < 20, "component did not settle");
    } while (pendingState.length);
    return tree;
  }
  function nodes(root) {
    if (Array.isArray(root)) return root.flatMap(nodes);
    if (!root || typeof root !== "object") return [];
    return [root, ...root.children.flatMap(nodes)];
  }
  function text(root) {
    if (Array.isArray(root)) return root.map(text).join("");
    if (root && typeof root === "object") return root.children.map(text).join("");
    return typeof root === "string" || typeof root === "number" ? String(root) : "";
  }
  function click(label) {
    const button = nodes(tree).find(node => node.type === "button" && text(node).trim() === label);
    assert.ok(button, `missing button: ${label}`);
    assert.ok(!button.props.disabled, `disabled button: ${label}`);
    button.props.onClick();
    render();
  }
  function unmount() {
    for (const effect of effects.values()) effect.cleanup?.();
    effects.clear();
  }
  render();
  componentCleanups.get(context.window)?.push(unmount);
  return { render, nodes: () => nodes(tree), text, click, unmount };
}

for (const activityId of Object.keys(activities)) {
  test(`${activityId}: LearningStudio isolates guide, exploration and keyed assessment`, t => {
    storageFixture(t);
    const ui = componentHarness(studioCode, { id: activityId, mainSite: "https://example.test/" });
    t.after(ui.unmount);
    const scene = () => ui.nodes().find(node => node.type === "ActivityScene");
    if (guideProbes[activityId]) {
      const guided = ui.nodes().find(node => node.type === "GuidedInvestigation");
      assert.equal(guided.props.id,activityId);
      guided.props.resumeRef.current = {index:1,stage:"evidence",prediction:0};
      ui.click("Swobodnie");
      assert.deepEqual(clone(scene().props.state),activities[activityId].initial);
      ui.click("Sprawdź się");
      assert.equal(scene(),undefined);
      assert.equal(ui.nodes().some(n=>n.type==="GuidedInvestigation"),false);
      assert.equal(ui.nodes().find(n=>n.type==="TransferTrial").props.activityId,activityId);
      ui.click("Prowadź mnie");
      const resumed = ui.nodes().find(n=>n.type==="GuidedInvestigation");
      assert.strictEqual(resumed.props.resumeRef,guided.props.resumeRef);
      assert.deepEqual(clone(resumed.props.resumeRef.current),{index:1,stage:"evidence",prediction:0});
      return;
    }
    const first = clone(scene().props.state);
    const control = ui.nodes().find(node => node.type === "Control");
    const target = activities[activityId].steps[0].target;
    control.props.onChange(target); ui.render();
    const guided = clone(scene().props.state);
    assert.equal(guided[control.props.control.key], target);
    ui.click("Swobodnie");
    assert.deepEqual(clone(scene().props.state), first, "guide settings must not seed exploration");
    ui.click("Sprawdź się");
    const trial = ui.nodes().find(node => node.type === "TransferTrial");
    assert.equal(trial.props.activityId, activityId);
    assert.equal(trial.props.key, activityId);
    assert.equal(scene(), undefined);
    assert.equal(ui.nodes().some(node => ["Control", "Slider"].includes(node.type)), false);
    assert.equal(ui.nodes().some(node => node.props.className === "learning-feedback"), false);
    ui.click("Prowadź mnie");
    assert.deepEqual(clone(scene().props.state), guided);
    ui.click("Swobodnie");
    assert.deepEqual(clone(scene().props.state), first);
  });
}

test("mounted Trial consumes matching help events before the next draft update", t => {
  storageFixture(t);
  saveTransfer(nextTransfer(initialTransfer("metar")));
  saveTransfer(nextTransfer(initialTransfer("wiatr")));
  const ui = componentHarness(trialCode, { activityId: "metar" });
  t.after(ui.unmount);
  const record = clone(loadTransfer("metar"));
  markTransferHelp("wiatr"); ui.render();
  assert.deepEqual(loadTransfer("metar"), record, "other activity event must be ignored");
  markTransferHelp("metar");
  ui.nodes().find(node => node.type === "input").props.onChange();
  ui.render();
  assert.equal(loadTransfer("metar").attempt.assisted, true);
  assert.ok(Object.keys(loadTransfer("metar").attempt.response).length > 0);
  assert.ok(ui.nodes().some(node => node.props.className === "transfer-status" && ui.text(node) === "Próba z pomocą"));
});

test("source click in LearningStudio and following answer retain assistance in mounted Trial", t => {
  storageFixture(t);
  saveTransfer(nextTransfer(initialTransfer("metar")));
  const parent = componentHarness(studioCode, { id: "metar", mainSite: "https://example.test/" });
  parent.click("Sprawdź się");
  const ui = componentHarness(trialCode, { activityId: "metar" });
  t.after(() => { ui.unmount(); parent.unmount(); });
  parent.nodes()[0].props.onClickCapture({ target: { closest: selector => selector === "a" ? {} : null } });
  ui.nodes().find(node => node.type === "input").props.onChange(); ui.render();
  assert.equal(loadTransfer("metar").attempt.assisted, true);
});

test("Trial cleanup preserves drafts and actual help without inventing assistance or committing an answer", t => {
  const { data, writes } = storageFixture(t);
  saveTransfer(nextTransfer(initialTransfer("metar")));
  let ui = componentHarness(trialCode, { activityId: "metar" });
  ui.nodes().find(node => node.type === "input").props.onChange(); ui.render();
  const draft = clone(loadTransfer("metar"));
  const beforeCleanup = writes.length;
  ui.unmount();
  const left = loadTransfer("metar");
  assert.equal(writes.length, beforeCleanup, "unmount alone is not an exposure to help");
  assert.equal(left.attempt.assisted, false);
  assert.equal(left.attempt.submitted, false);
  assert.deepEqual(left, draft);
  ui = componentHarness(trialCode, { activityId: "metar" });
  markTransferHelp("metar"); ui.render();
  const helped = clone(loadTransfer("metar"));
  const afterHelp = writes.length;
  ui.unmount();
  assert.equal(writes.length, afterHelp);
  assert.equal(helped.attempt.assisted, true);
  assert.equal(helped.attempt.submitted, false);
  assert.deepEqual(loadTransfer("metar"), helped, "actual guide/source help remains recorded after unmount");
  const committed = submit(complete(nextTransfer(initialTransfer("metar")), transferCases.metar[0].correct));
  data.set(keyFor("metar"), JSON.stringify(committed));
  ui = componentHarness(trialCode, { activityId: "metar" });
  const count = writes.length;
  ui.unmount();
  assert.equal(writes.length, count, "cleanup of submitted trial must not write a result");
  assert.deepEqual(loadTransfer("metar"), committed);
  ui = componentHarness(trialCode, { activityId: "metar" });
  ui.click("Rozwiąż inny przypadek");
  const current = clone(loadTransfer("metar"));
  ui.unmount();
  assert.equal(loadTransfer("metar").attempt.caseId, current.attempt.caseId);
  assert.equal(loadTransfer("metar").attempt.assisted, false);
  assert.equal(loadTransfer("metar").attempt.submitted, false);
  assert.deepEqual(loadTransfer("metar").attempt, current.attempt);
  assert.deepEqual(loadTransfer("metar").history, committed.history.concat([committed.attempt]));
});

test("a stale mounted Trial cannot erase the first answer committed in another instance", t => {
  storageFixture(t);
  saveTransfer(nextTransfer(initialTransfer("metar")));
  const first = componentHarness(trialCode, { activityId: "metar" });
  const stale = componentHarness(trialCode, { activityId: "metar" });
  t.after(() => { stale.unmount(); first.unmount(); });
  const task = transferCases.metar[0];
  for (const field of questions(task)) {
    first.nodes().find(node => node.type === "input" && node.props.value === task.correct[field.id]).props.onChange();
    first.render();
    first.click(field.id === "reason" ? "Zatwierdź odpowiedzi" : "Dalej");
  }
  const committed = clone(loadTransfer("metar"));
  assert.equal(committed.attempt.submitted, true);
  stale.nodes().find(node => node.type === "input").props.onChange(); stale.render();
  assert.deepEqual(loadTransfer("metar"), committed, "late draft from another mount must not overwrite the committed record");
});

test("photo aids are assisted, and next case removes old source, description and hint", t => {
  storageFixture(t);
  saveTransfer(nextTransfer(initialTransfer("obserwacja")));
  const ui = componentHarness(trialCode, { activityId: "obserwacja" });
  t.after(ui.unmount);
  const task = transferCases.obserwacja[0];
  const photo = (task.images || [task.image])[0];
  assert.ok(!ui.nodes().some(node => node.props.href === photo.sourceUrl));
  ui.click("Pokaż źródło (może ujawnić odpowiedź)");
  assert.ok(ui.nodes().some(node => node.props.href === photo.sourceUrl));
  assert.equal(loadTransfer("obserwacja").attempt.assisted, true);
  ui.click("Opis zdjęcia zamiast oceny wzrokowej");
  assert.ok(ui.nodes().some(node => ui.text(node) === photo.accessibleDescription));
  ui.click("Przypomnij zasadę");
  assert.equal(loadTransfer("obserwacja").attempt.hint, true);
  ui.click("Nie wiem, pokaż wyjaśnienie");
  ui.click("Rozwiąż inny przypadek");
  const next = loadTransfer("obserwacja");
  assert.equal(next.attempt.assisted, false);
  assert.equal(next.attempt.hint, false);
  assert.deepEqual(next.attempt.response, {});
  assert.ok(!ui.nodes().some(node => node.props.href === photo.sourceUrl));
  assert.ok(!ui.nodes().some(node => ui.text(node) === photo.accessibleDescription));
  assert.ok(!ui.nodes().some(node => node.props.className === "transfer-feedback"));
});

test("Trial shows session-only storage warning after a failed save", t => {
  const { storage } = storageFixture(t);
  saveTransfer(nextTransfer(initialTransfer("metar")));
  storage.setItem = () => { throw new Error("QuotaExceededError"); };
  const ui = componentHarness(trialCode, { activityId: "metar" });
  t.after(ui.unmount);
  assert.ok(ui.nodes().some(node => node.props.className === "transfer-storage" && node.props.role === "status"));
});

test("a stale view drops old photo assistance when it adopts a newer case", t => {
  storageFixture(t);
  saveTransfer(nextTransfer(initialTransfer("obserwacja")));
  const first = componentHarness(trialCode, { activityId: "obserwacja" });
  const stale = componentHarness(trialCode, { activityId: "obserwacja" });
  t.after(() => { stale.unmount(); first.unmount(); });
  stale.click("Opis zdjęcia zamiast oceny wzrokowej");
  first.click("Nie wiem, pokaż wyjaśnienie");
  first.click("Rozwiąż inny przypadek");
  const next = clone(loadTransfer("obserwacja"));
  const photo = (currentTask(next).images || [currentTask(next).image])[0];
  stale.nodes().find(node => node.type === "input").props.onChange(); stale.render();
  assert.equal(loadTransfer("obserwacja").attempt.caseId, next.attempt.caseId);
  assert.deepEqual(loadTransfer("obserwacja").attempt.response, {});
  assert.equal(loadTransfer("obserwacja").attempt.assisted, false);
  assert.ok(!stale.nodes().some(node => stale.text(node) === photo.accessibleDescription), "new case must not reveal its description with an independent status");
});

test("a stale source action cannot reveal a newer case without marking that case assisted", t => {
  storageFixture(t);
  saveTransfer(nextTransfer(initialTransfer("obserwacja")));
  const first = componentHarness(trialCode, { activityId: "obserwacja" });
  const stale = componentHarness(trialCode, { activityId: "obserwacja" });
  t.after(() => { stale.unmount(); first.unmount(); });
  first.click("Nie wiem, pokaż wyjaśnienie");
  first.click("Rozwiąż inny przypadek");
  stale.click("Pokaż źródło (może ujawnić odpowiedź)");
  const record = loadTransfer("obserwacja");
  const photo = (currentTask(record).images || [currentTask(record).image])[0];
  const sourceVisible = stale.nodes().some(node => node.props.href === photo.sourceUrl);
  assert.ok(!sourceVisible || record.attempt.assisted, "source is shown for the new case after its help action was dropped");
});

test("a mounted draft recovers safely when storage is cleared or its active record is corrupt", async t => {
  for (const damage of ["removed", "invalid-attempt"]) await t.test(damage, t => {
    const { data } = storageFixture(t);
    const record = nextTransfer(initialTransfer("metar"));
    saveTransfer(record);
    const ui = componentHarness(trialCode, { activityId: "metar" });
    t.after(ui.unmount);
    if (damage === "removed") data.delete(keyFor("metar"));
    else data.set(keyFor("metar"), JSON.stringify({ ...record, attempt: { ...record.attempt, step: -1 } }));
    assert.doesNotThrow(() => {
      ui.nodes().find(node => node.type === "input").props.onChange(); ui.render();
    }, "storage recovery must not dereference a null attempt in a mounted Trial");
  });
});
