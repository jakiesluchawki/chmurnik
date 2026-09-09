import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";
import ts from "typescript";
import postcss from "postcss";
import * as model from "../weather-preview/model.mjs";
import * as tutorial from "../weather-preview/tutorial.mjs";
import { experiments } from "../weather-preview/content.mjs";

const source = await readFile(new URL("../weather-preview/main.jsx", import.meta.url), "utf8");
const parsed = ts.createSourceFile("main.jsx", source, ts.ScriptTarget.Latest, true, ts.ScriptKind.JSX);
const appSource = parsed.statements.find(node => ts.isFunctionDeclaration(node) && node.name.text === "App").getText(parsed);
const appCode = ts.transpileModule(appSource, { compilerOptions: { jsx: ts.JsxEmit.React, target: ts.ScriptTarget.ES2022 } }).outputText;

// Exercise the real App handlers and rendered branches without loading shared UI dependencies.
function harness(scene) {
  const slots = [], listeners = new Map(), helped = [], stored = new Map();
  let cursor = 0, pending = [], tree;
  const context = {
    ...model, ...tutorial, experiments,
    React: { createElement: (type, props, ...children) => ({ type, props: props || {}, children }), Fragment: "fragment" },
    useState(initial) {
      const index = cursor++;
      if (!(index in slots)) slots[index] = typeof initial === "function" ? initial() : initial;
      return [slots[index], value => { slots[index] = typeof value === "function" ? value(slots[index]) : value; }];
    },
    useRef(initial) {
      const index = cursor++;
      return slots[index] ||= { current: initial };
    },
    useEffect(effect, deps) {
      const index = cursor++;
      if (!slots[index] || deps.some((value, i) => !Object.is(value, slots[index][i]))) pending.push(effect);
      slots[index] = deps;
    },
    initialScene: () => tutorial.sceneFromHash(context.location.hash),
    mainSite: "https://example.test/",
    location: { hash: `#${tutorial.sceneHashes[scene]}`, search: "?from=wiatr" },
    history: { replaceState(_state, _unused, hash) { context.location.hash = hash; } },
    window: {
      matchMedia: () => ({ matches: false, addEventListener() {}, removeEventListener() {} }),
      addEventListener: (type, callback) => listeners.set(type, callback),
      removeEventListener() {}, innerHeight: 568,
    },
    document: { addEventListener() {}, removeEventListener() {}, getElementById: () => null },
    localStorage: { getItem: key => stored.get(key), setItem: (key, value) => stored.set(key, value) },
    requestAnimationFrame: callback => callback(),
    markTransferHelp: id => helped.push(id),
    num: value => value.toFixed(1), metres: value => `${value} m`,
    crypto: { randomUUID: () => `trial-${stored.size}` },
  };
  for (const name of ["Scene", "Slider", "TransferTrial", "ArrowLeft", "ArrowRight", "Play", "Pause", "ArrowCounterClockwise", "Sun", "Moon", "Drop", "Thermometer", "Wind", "Cloud", "BookOpen", "Check", "Plus", "Minus", "FloppyDisk", "ArrowsClockwise"]) context[name] = name;
  const App = vm.runInNewContext(`${appCode}; App`, context);
  function nodes(root = tree) {
    if (!root || typeof root !== "object") return [];
    if (Array.isArray(root)) return root.flatMap(nodes);
    return [root, ...root.children.flatMap(nodes)];
  }
  function text(root) {
    if (Array.isArray(root)) return root.map(text).join("");
    if (root && typeof root === "object") return root.children.map(text).join("");
    return typeof root === "string" || typeof root === "number" ? String(root) : "";
  }
  function render() {
    cursor = 0;
    tree = App();
    const effects = pending;
    pending = [];
    effects.forEach(effect => effect());
  }
  function click(label) {
    const button = nodes().find(node => node.type === "button" && text(node).trim() === label.trim());
    assert.ok(button, `Missing button: ${label}`);
    assert.ok(!button.props.disabled, `Disabled button: ${label}`);
    button.props.onClick();
    render();
  }
  render();
  return {
    nodes, text, render, click, helped, stored,
    sliders: () => nodes().filter(node => node.type === "Slider"),
    change(value) { this.sliders()[0].props.onChange(value); render(); },
    hash(value) { context.location.hash = `#${value}`; listeners.get("hashchange")(); render(); },
  };
}

for (const [scene, tabId] of Object.entries(tutorial.sceneHashes)) {
  test(`legacy ${tabId}: assessment mounts only the keyed shared trial, never tutorial outputs`, () => {
    const ui = harness(scene);
    ui.click("Eksperymentuj");
    ui.click("Zapisz próbę do porównania");
    ui.click("Sprawdź się");
    const trial = ui.nodes().find(node => node.type === "TransferTrial");
    assert.equal(trial.props.activityId, tabId);
    assert.equal(trial.props.key, tabId);
    assert.equal(ui.sliders().length, 0);
    assert.equal(ui.nodes().filter(node => node.type === "Scene").length, 0);
    for (const name of ["guide-intro", "comparison", "instrument", "method", "recap", "challenge"])
      assert.equal(ui.nodes().some(node => node.props.className === name), false, name);
    ui.click("Sprawdź się");
    assert.deepEqual(ui.helped, []);
    ui.click("Prowadź mnie");
    assert.deepEqual(ui.helped, [tabId]);
    ui.click("Sprawdź się");
    ui.click("Eksperymentuj");
    assert.deepEqual(ui.helped, [tabId, tabId]);
    assert.equal(ui.nodes().filter(node => node.type === "Scene" && node.props.mini).length, 1);
    assert.ok(ui.stored.has(model.STORAGE_KEY));
  });

  test(`legacy ${tabId}: switching modes preserves the guide step and inputs until explicit restart`, () => {
    const ui = harness(scene), guide = tutorial.guides[scene];
    ui.change(guide.steps[0].target);
    ui.click("Dalej ");
    ui.change(guide.steps[1].target);
    const saved = ui.sliders()[0].props.value;
    ui.click("Eksperymentuj");
    ui.change(ui.sliders()[0].props.min);
    ui.click("Prowadź mnie");
    assert.equal(ui.sliders()[0].props.id, guide.steps[1].key);
    assert.equal(ui.sliders()[0].props.value, saved);
    ui.click("Sprawdź się");
    ui.click("Prowadź mnie");
    assert.equal(ui.sliders()[0].props.value, saved);
    assert.equal(ui.sliders().length, 1);
    ui.click("Przewodnik od początku");
    assert.equal(ui.sliders()[0].props.id, guide.steps[0].key);
    assert.equal(ui.sliders()[0].props.value, guide.start[guide.steps[0].key]);
  });
}

test("legacy scene buttons and the initial hash listener mark the old assessment activity", () => {
  const ui = harness("cloud");
  ui.click("Sprawdź się");
  ui.click("03Noc i mgła");
  assert.deepEqual(ui.helped, ["chmura"]);
  ui.click("Sprawdź się");
  ui.hash("bryza");
  assert.deepEqual(ui.helped, ["chmura", "mgla"]);
  ui.click("Sprawdź się");
  assert.equal(ui.nodes().find(node => node.type === "TransferTrial").props.key, "bryza");
});

test("legacy guide has one actionable parameter for every step and keeps the old guided entry unreachable", () => {
  for (const [scene, guide] of Object.entries(tutorial.guides)) {
    const ui = harness(scene);
    for (const [index, step] of guide.steps.entries()) {
      assert.equal(ui.sliders().length, 1);
      assert.equal(ui.sliders()[0].props.id, step.key);
      ui.change(step.target);
      ui.click(index === guide.steps.length - 1 ? "Podsumuj " : "Dalej ");
    }
    assert.ok(ui.nodes().some(node => ui.text(node) === "POKAZ UKOŃCZONY"));
    ui.click("Przewodnik od początku");
    assert.equal(ui.sliders().length, 1);
  }
  const chooseMode = appSource.slice(appSource.indexOf("function chooseMode"), appSource.indexOf("function storeTrials"));
  assert.match(chooseMode, /\["tutorial", "assessment", "explore"\]\.includes\(next\)/);
  assert.doesNotMatch(chooseMode, /setGuideIndex|guideInputsAt|quiz\.start|scrollIntoView/);
});

test("compact legacy CSS is scoped, leaves slider centering intact and permits document scrolling", async () => {
  const source = await readFile(new URL("../weather-preview/style.css", import.meta.url), "utf8");
  const compact = postcss.parse(source.slice(source.indexOf("/* Compact legacy workbench;")));
  const rules = new Map();
  compact.walkRules(rule => {
    for (const selector of rule.selectors)
      if (!rules.has(selector)) rules.set(selector, new Map(rule.nodes.filter(node => node.type === "decl").map(node => [node.prop, node.value])));
    assert.ok(rule.selectors.every(selector => selector.startsWith(".legacy-weather-preview")), rule.selector);
    assert.doesNotMatch(rule.selector, /range-thumb|slider-thumb/);
    rule.walkDecls(decl => {
      assert.notEqual(decl.prop, "order");
      assert.notEqual(decl.prop, "grid-row");
      assert.ok(!["auto", "scroll", "clip", "hidden"].includes(decl.value) || !decl.prop.startsWith("overflow") || rule.selector.endsWith(".scene-visual"));
      assert.doesNotMatch(decl.value, /100[ds]?vh/);
    });
  });
  assert.equal(rules.get('.legacy-weather-preview .mode-switch button[aria-pressed="true"]').get("background"), "var(--violet)");
  assert.equal(rules.get('.legacy-weather-preview .mode-switch button[aria-pressed="true"]').get("color"), "white");
  assert.equal(rules.get(".legacy-weather-preview .mode-switch button").get("border-radius"), "12px");
  for (const label of [".height-scale", ".measure small", ".scene-hour small", ".scene-result small", ".parcel-readout", ".return-label", ".fog-readout span"])
    assert.equal(rules.get(`.legacy-weather-preview ${label}`).get("font-size"), "0.75rem", label);
  assert.equal(rules.get(".legacy-weather-preview .height-scale span").get("white-space"), "nowrap");
  assert.equal(rules.get(".legacy-weather-preview .scene-stamp").get("font-size"), "0.6875rem");
  assert.equal(rules.get(".legacy-weather-preview .scene-stamp").get("position"), "static");
});
