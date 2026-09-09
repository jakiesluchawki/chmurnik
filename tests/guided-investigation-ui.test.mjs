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
import * as catalog from "../weather-preview/learning/catalog.mjs";
import * as records from "../weather-preview/learning/guide-probes.mjs";

const source = await readFile(new URL("../weather-preview/learning/GuidedInvestigation.jsx", import.meta.url), "utf8");
const ast = ts.createSourceFile("GuidedInvestigation.jsx", source, ts.ScriptTarget.Latest, true, ts.ScriptKind.JSX);
const compiled = ts.transpileModule(ast.statements.filter(node => !ts.isImportDeclaration(node)).map(node => node.getText(ast)).join("\n"), {
  compilerOptions: { jsx: ts.JsxEmit.React, target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
}).outputText;

function memoryStorage(store = records.readInvestigations(null)) {
  const values = new Map([[records.investigationKey, JSON.stringify(store)]]);
  return { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) };
}

// Execute the actual handlers with a hook scheduler. Full React SSR below checks
// their resulting review, including ActivityScene rather than a scene mock.
function harness(id, extra = {}) {
  const slots = [], effects = new Map(), storage = memoryStorage(), resumeRef = { current: null };
  let cursor = 0, pending = [], dirty = false, tree, props = { id, resumeRef, renderControl: () => null, onAssessment() {}, ...extra };
  const context = {
    ...catalog, ...records, exports: {}, localStorage: storage, crypto: globalThis.crypto,
    requestAnimationFrame: callback => callback(),
    ActivityScene: "ActivityScene", ArrowRight: "ArrowRight", ArrowCounterClockwise: "ArrowCounterClockwise", Check: "Check",
    // Bridge VM objects into the model's JSON-data realm, without mocking storage logic.
    recordPrediction: (store, data) => records.recordPrediction(store, structuredClone(data)),
    recordObservation: (store, token, state, options) => records.recordObservation(store, token, structuredClone(state), options),
    React: { Fragment: "Fragment", createElement(type, attributes, ...children) {
      if (typeof type === "function" && type.name === "Choice") return type(attributes);
      return { type, props: attributes || {}, children };
    } },
    useState(initial) {
      const index = cursor++;
      if (!(index in slots)) slots[index] = typeof initial === "function" ? initial() : initial;
      return [slots[index], value => { const next = typeof value === "function" ? value(slots[index]) : value; if (!Object.is(next, slots[index])) { slots[index] = next; dirty = true; } }];
    },
    useRef(initial) { const index = cursor++; return slots[index] ||= { current: initial }; },
    useEffect(setup, deps) {
      const index = cursor++, prior = effects.get(index);
      if (!prior || deps.some((value, i) => !Object.is(value, prior.deps[i]))) pending.push(() => {
        prior?.cleanup?.(); effects.set(index, { deps, cleanup: setup() });
      });
    },
  };
  const Component = vm.runInNewContext(`${compiled}; GuidedInvestigation`, context);
  const nodes = root => Array.isArray(root) ? root.flatMap(nodes) : root && typeof root === "object" ? [root, ...root.children.flatMap(nodes)] : [];
  const text = root => Array.isArray(root) ? root.map(text).join("") : root && typeof root === "object" ? root.children.map(text).join("") : root == null || typeof root === "boolean" ? "" : String(root);
  function render(next = props) {
    props = next;
    for (let pass = 0; pass < 12; pass++) {
      dirty = false; cursor = 0; tree = Component(props);
      const work = pending; pending = []; work.forEach(run => run());
      if (!dirty) return;
    }
    assert.fail("Hook effects failed to settle");
  }
  render();
  return {
    storage, resumeRef, render, props: () => props, scene: () => nodes(tree).find(node => node.type === "ActivityScene"),
    store: () => records.readInvestigations(storage.getItem(records.investigationKey)),
    text: () => text(tree),
    click(label) {
      const node = nodes(tree).find(node => node.type === "button" && text(node).trim() === label);
      assert.ok(node, `Missing button: ${label}`); assert.ok(!node.props.disabled, `Disabled button: ${label}`);
      node.props.onClick(); render();
    },
    close() { for (const effect of effects.values()) effect.cleanup?.(); },
  };
}

function completeRecord({ id = "metar", token = "first", helped = false, evidenceHelped = false, answer = 0, setupUsed = false } = {}) {
  const probe = records.guideProbes[id][0];
  let store = records.recordPrediction(records.readInvestigations(null), { id, index: 0, token, answer, state: records.probeState(id, 0), helped });
  store = records.recordObservation(store, token, records.probeState(id, 0, true), { setupUsed });
  return records.recordEvidence(store, token, probe.evidenceCorrect, { helped: evidenceHelped });
}

test("GuidedInvestigation: actual handlers and rendered review honor record snapshots", async t => {
  const cacheDir = await mkdtemp(join(tmpdir(), "chmurnik-guide-ui-"));
  const server = await createServer({ configFile: false, root: fileURLToPath(new URL("..", import.meta.url)), cacheDir, publicDir: false, logLevel: "error", server: { middlewareMode: true, ws: false, hmr: false, watch: null }, optimizeDeps: { noDiscovery: true, include: [] } });
  t.after(async () => { await server.close(); await rm(cacheDir, { recursive: true, force: true }); });
  const { GuidedInvestigation } = await server.ssrLoadModule("/weather-preview/learning/GuidedInvestigation.jsx");
  function renderStore(store, resume = {}, extra = {}) {
    const record = store.attempts.at(-1), savedStorage = Object.getOwnPropertyDescriptor(globalThis, "localStorage");
    Object.defineProperty(globalThis, "localStorage", { configurable: true, value: memoryStorage(store) });
    try {
      return renderToStaticMarkup(React.createElement(GuidedInvestigation, {
        id: record.id, renderControl: () => null, onAssessment() {},
        resumeRef: { current: { index: record.index, stage: "review", state: records.probeState(record.id, record.index, true), token: record.token, prediction: record.answer, evidence: record.evidence, ...resume } }, ...extra,
      }));
    } finally {
      if (savedStorage) Object.defineProperty(globalThis, "localStorage", savedStorage); else delete globalThis.localStorage;
    }
  }
  const review = html => html.match(/<div class="investigation-result"[^>]*>([\s\S]*?)<\/div>/)?.[1] || "";
  const renderUI = ui => renderStore(ui.store(), structuredClone(ui.resumeRef.current));

  await t.test("help before the first prediction is shown from predictionHelped, not nonexistent helped", () => {
    const store = completeRecord({ helped: true });
    assert.equal("helped" in store.attempts[0], false);
    const html = review(renderStore(store, { helpSeen: false, setupUsed: true }));
    assert.match(html, /Przewidywanie zapisano po skorzystaniu z pomocy/);
    assert.match(html, /Uzasadnienie zapisano z dodatkową pomocą/);
    assert.doesNotMatch(html, /Przewidywanie zapisano przed dodatkową pomocą|Użyto przycisku ustawiającego warunki/);
  });

  await t.test("clean prediction and later evidence help remain distinct; later UI help cannot rewrite a clean review", () => {
    const late = review(renderStore(completeRecord({ evidenceHelped: true }), { helpSeen: false }));
    assert.match(late, /Przewidywanie zapisano przed dodatkową pomocą/);
    assert.match(late, /Uzasadnienie zapisano z dodatkową pomocą/);
    assert.doesNotMatch(late, /Przewidywanie zapisano po skorzystaniu z pomocy/);
    const clean = review(renderStore(completeRecord(), { helpSeen: true }, { externalHelp: true }));
    assert.match(clean, /Uzasadnienie zapisano bez dodatkowej pomocy/);
    assert.doesNotMatch(clean, /Uzasadnienie zapisano z dodatkową pomocą|Późniejszy odczyt korzystał/);
  });

  await t.test("review and pending reason render the stored question and choices, not the live rubric", () => {
    const store = completeRecord();
    Object.assign(store.attempts[0], { question: "Recorded question?", options: ["Recorded choice", "Other choice", "Recorded expected choice"], answer: 0, answerText: "Recorded choice", correctIndex: 2, correct: false,
      evidenceQuestion: "Recorded reason?", evidenceOptions: ["Recorded evidence", "Other evidence"], evidence: 0, evidenceText: "Recorded evidence", evidenceCorrectIndex: 1, evidenceCorrect: false });
    const html = renderStore(store, { prediction: 2 });
    assert.match(html, /<h2>Recorded question\?<\/h2>/);
    assert.match(review(html), /Wybrano: <strong>Recorded choice<\/strong>/);
    assert.match(review(html), /W tym przykładzie: <strong>Recorded expected choice<\/strong>/);
    assert.match(review(html), /Spójrz ponownie na dowód: Other evidence/);
    const pending = renderStore(store, { stage: "evidence" });
    assert.match(pending, /<legend>Recorded reason\?<\/legend>/);
    assert.match(pending, />Recorded evidence<\/button>/);
  });

  await t.test("retry review distinguishes its answer from the actual first recorded answer and help", () => {
    const first = completeRecord({ token: "first", answer: 1, helped: true });
    const retry = completeRecord({ token: "retry", answer: 0 });
    const store = { version: 1, attempts: [...first.attempts, ...retry.attempts] };
    const html = review(renderStore(store));
    assert.match(html, /Powtórka znanego przypadku/);
    assert.match(html, /Pierwsza zapisana odpowiedź:/);
    assert.ok(html.includes(first.attempts[0].answerText));
    assert.match(html, /Przewidywanie zapisano po skorzystaniu z pomocy/);
    assert.match(html, /Przewidywanie zapisano przed dodatkową pomocą/);
    assert.match(html, /Ta powtórka jej nie zastępuje/);
    assert.doesNotMatch(html, /Pierwsza odpowiedź zgadza się/);
    assert.equal(store.attempts[0].correct, false);
    assert.equal(store.attempts[1].correct, true);
  });

  await t.test("legacy help is unknown rather than silently labelled unaided", () => {
    const store = records.readInvestigations(JSON.stringify({ version: 1, attempts: [{ id: "metar", index: 0, token: "old", answer: 0, correct: true, evidence: 1, evidenceCorrect: true }] }));
    const html = review(renderStore(store));
    assert.match(html, /rekord starszej wersji bez zachowanej treści/);
    assert.match(html, /Brak zapisu pomocy przed przewidywaniem/);
    assert.match(html, /Brak zapisu pomocy przy uzasadnieniu/);
    assert.doesNotMatch(html, /Przewidywanie zapisano przed dodatkową pomocą|Uzasadnienie zapisano bez dodatkowej pomocy/);
  });

  await t.test("every read-only guide saves an actual observation even without an annotation", () => {
    for (const id of ["obserwacja", "rodziny", "nazwy"]) {
      const ui = harness(id), p = records.guideProbes[id][0];
      try {
        ui.click(p.options[p.correct]); ui.click("Zapisz obserwację");
        const record = ui.store().attempts[0];
        assert.ok(record.observedState, `${id}: missing observed state`);
        assert.equal("annotation" in record.observedState, false);
        assert.deepEqual(record.observedState, record.state);
        ui.click(p.evidenceOptions[p.evidenceCorrect]); ui.click("Porównaj z wyjaśnieniem");
        assert.match(review(renderUI(ui)), /Uzasadnienie zapisano bez dodatkowej pomocy/);
      } finally { ui.close(); }
    }
  });

  await t.test("photo description and annotation before prediction are persisted and actually rendered in review", () => {
    const ui = harness("obserwacja"), p = records.guideProbes.obserwacja[0];
    try {
      ui.click("Opis cech zamiast oceny wzrokowej");
      ui.scene().props.onAnnotation({ x: 25, y: 70 }); ui.render();
      ui.click(p.options[0]); ui.click("Zapisz obserwację");
      let record = ui.store().attempts[0];
      assert.equal(record.predictionHelped, true);
      assert.equal(record.descriptionUsed, true);
      assert.deepEqual(record.evidenceHelpKinds, ["description"]);
      assert.deepEqual(record.observedState.annotation, { x: 25, y: 70 });
      assert.equal(record.observedState.describePhotos, true);
      assert.equal(record.correct, false);
      ui.click(p.evidenceOptions[p.evidenceCorrect]); ui.click("Porównaj z wyjaśnieniem");
      record = ui.store().attempts[0];
      assert.equal(record.evidenceHelped, true);
      const html = renderUI(ui);
      assert.match(html, /lab-photo-mark.*?left:25%;top:70%/);
      assert.match(html, /lab-photo-description/);
      assert.match(review(html), /Korzystano z opisu cech fotografii/);
      assert.match(review(html), /Przewidywanie zapisano po skorzystaniu z pomocy/);
    } finally { ui.close(); }
  });

  await t.test("description opened after prediction records evidence help only; the original observation stays unchanged", () => {
    const ui = harness("obserwacja"), p = records.guideProbes.obserwacja[0];
    try {
      ui.click(p.options[p.correct]); ui.click("Zapisz obserwację");
      const observed = structuredClone(ui.store().attempts[0].observedState);
      ui.click("Opis cech zamiast oceny wzrokowej");
      let record = ui.store().attempts[0];
      assert.equal(record.predictionHelped, false);
      assert.equal(record.evidenceHelped, true);
      assert.equal(record.descriptionUsed, true);
      assert.deepEqual(record.evidenceHelpKinds, ["description"]);
      ui.click(p.evidenceOptions[p.evidenceCorrect]); ui.click("Porównaj z wyjaśnieniem");
      record = ui.store().attempts[0];
      assert.deepEqual(record.observedState, observed);
      assert.equal(record.observedState.describePhotos, false);
      const html = review(renderUI(ui));
      assert.match(html, /Przewidywanie zapisano przed dodatkową pomocą/);
      assert.match(html, /Uzasadnienie zapisano z dodatkową pomocą/);
    } finally { ui.close(); }
  });

  await t.test("actual retry preserves the first result and resets the annotation", () => {
    const ui = harness("obserwacja"), p = records.guideProbes.obserwacja[0];
    try {
      ui.scene().props.onAnnotation({ x: 10, y: 20 }); ui.render();
      ui.click(p.options[0]); ui.click("Zapisz obserwację");
      ui.click(p.evidenceOptions[p.evidenceCorrect]); ui.click("Porównaj z wyjaśnieniem");
      const first = structuredClone(ui.store().attempts[0]);
      ui.click("Powtórz ten przykład");
      assert.equal(ui.scene().props.annotation, undefined);
      ui.click(p.options[p.correct]); ui.click("Zapisz obserwację");
      ui.click(p.evidenceOptions[p.evidenceCorrect]); ui.click("Porównaj z wyjaśnieniem");
      assert.equal(ui.store().attempts.length, 2);
      assert.deepEqual(ui.store().attempts[0], first);
      const html = review(renderUI(ui));
      assert.match(html, /Powtórka znanego przypadku/);
      assert.ok(html.includes(first.answerText));
    } finally { ui.close(); }
  });

  await t.test("setup button records setup independently and review reads the saved flag", () => {
    const ui = harness("metar"), p = records.guideProbes.metar[0];
    try {
      ui.click(p.options[1]); ui.click("Zapisz przewidywanie");
      ui.click("Ustaw warunki tej próby"); ui.click("Odczytaj wynik i wskaż dowód");
      ui.click(p.evidenceOptions[p.evidenceCorrect]); ui.click("Porównaj z wyjaśnieniem");
      const record = ui.store().attempts[0];
      assert.equal(record.setupUsed, true);
      assert.equal(record.predictionHelped, false);
      assert.equal(record.evidenceHelped, false);
      assert.equal(record.correct, false);
      assert.deepEqual(record.observedState, records.probeState("metar", 0, true));
      const html = review(renderStore(ui.store(), { setupUsed: false }));
      assert.match(html, /Użyto przycisku ustawiającego warunki; nie jest to wynik oceny/);
      assert.match(html, /Przewidywanie zapisano przed dodatkową pomocą/);
    } finally { ui.close(); }
  });
});
