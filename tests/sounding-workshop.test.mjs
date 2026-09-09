import test from "node:test";
import assert from "node:assert/strict";
import { readFile, mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createServer } from "vite";
import postcss from "postcss";
import { soundingScenarios, selectedSounding, soundingCoordinates } from "../weather-preview/learning/science.mjs";
import { transferCases } from "../weather-preview/learning/transfer-cases.mjs";
import { SOUNDING_WORKSHOP_KEY, soundingProfile, soundingStages, soundingSources, soundingRow, soundingPlot, soundingPoint, levelAtPlotY, keyboardLevel,
  initialSoundingWorkshop, updateSoundingWorkshop, soundingReady, restoreSoundingWorkshop, loadSoundingWorkshop, saveSoundingWorkshop } from "../weather-preview/learning/sounding-workshop.mjs";

const update = updateSoundingWorkshop;
const stageState = index => update(initialSoundingWorkshop(), { type: "stage", index });
function prepare(index, decision = soundingStages[index].answer) {
  const stage = soundingStages[index];
  let state = stageState(index);
  for (const pressure of stage.required) state = update(state, { type: "level", pressure });
  return update(state, { type: "decision", value: decision });
}
function finish(index, decision, reason) {
  const stage = soundingStages[index];
  let state = update(prepare(index, decision), { type: "commit" });
  if (stage.id === "skew") state = update(state, { type: "projection", value: "skew" });
  state = update(state, { type: "reason", value: reason || stage.reason });
  return update(state, { type: "explain" });
}
function memoryStorage() {
  const values = new Map();
  return { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value), values };
}

test("the workshop reads the existing second synthetic profile without mutating legacy APIs", () => {
  assert.equal(soundingProfile, soundingScenarios[1]);
  const original = JSON.stringify(soundingScenarios);
  for (const row of soundingProfile.profile) {
    const read = soundingRow(row.pressure);
    for (const key of Object.keys(row)) assert.equal(read[key], row[key]);
    read.temperature = 500;
    assert.equal(soundingRow(row.pressure).temperature, row.temperature);
  }
  assert.equal(JSON.stringify(soundingScenarios), original);
  assert.equal(selectedSounding(2).pressure, 925);
  assert.equal(selectedSounding(2).temperature, 9);
  assert.equal(soundingCoordinates(0, 1000, false).y, 344);
  for (const missing of [0, 50, 199, 555, 1001, null, undefined, NaN]) assert.equal(soundingRow(missing), null);
});

test("six narrow stages use four distinct decisions, separate reasons and official sources", () => {
  assert.equal(soundingStages.length, 6);
  for (const stage of soundingStages) {
    assert.equal(stage.choices.length, 4);
    assert.equal(new Set(stage.choices.map(option => option.id)).size, 4);
    assert.equal(new Set(stage.choices.map(option => option.label)).size, 4);
    assert.ok(stage.choices.some(option => option.id === stage.answer));
    assert.ok(stage.reasons.some(option => option.id === stage.reason));
    assert.equal(stage.conclusion.length, 2);
    assert.ok(soundingSources[stage.source]);
    assert.ok(stage.pressures.every(pressure => soundingRow(pressure)));
    assert.ok(stage.required.every(pressure => stage.pressures.includes(pressure)));
  }
  assert.ok(new Set(soundingStages.map(stage => stage.choices.findIndex(option => option.id === stage.answer))).size >= 3);
  assert.deepEqual(soundingStages[0].fields, ["temperature"]);
  assert.equal(soundingStages[0].single, true);
  for (const source of Object.values(soundingSources)) assert.match(new URL(source.url).hostname, /(^|\.)(weather\.gov|noaa\.gov|faa\.gov)$/);
});

test("all stage conclusions agree with unmodified numeric rows", () => {
  assert.equal(soundingRow(850).temperature, 18);
  assert.equal(soundingRow(925).spread, 5);
  assert.equal(soundingRow(800).spread, 12);
  assert.equal(soundingRow(800).temperature - soundingRow(850).temperature, 2);
  assert.equal(soundingRow(700).parcelDifference, -1);
  assert.equal(soundingRow(500).parcelDifference, 1);
  assert.equal(soundingRow(700).windSpeed - soundingRow(925).windSpeed, 20);
  assert.equal(soundingRow(700).windDirection - soundingRow(925).windDirection, 55);
  assert.deepEqual([soundingRow(500).temperature, soundingRow(500).dewpoint, soundingRow(500).parcel], [-8, -18, -7]);
});

test("shared coordinates, hit testing and keyboard access agree at every supplied level", () => {
  for (const stage of soundingStages) for (const pressure of stage.pressures) {
    const straight = soundingPoint(soundingRow(pressure).temperature, pressure, stage);
    const skew = soundingPoint(soundingRow(pressure).temperature, pressure, stage, true);
    assert.equal(straight.y, skew.y);
    assert.ok(straight.x >= soundingPlot.left && straight.x <= soundingPlot.right);
    assert.ok(skew.x >= soundingPlot.left && skew.x <= soundingPlot.right);
    assert.equal(levelAtPlotY(stage, straight.y), pressure);
    for (const pixelHeight of [215, 230, 320]) {
      const clientY = straight.y / soundingPlot.height * pixelHeight;
      const normalized = clientY / pixelHeight * soundingPlot.height;
      assert.equal(levelAtPlotY(stage, normalized), pressure);
    }
    assert.equal(keyboardLevel(stage, pressure, "Home"), stage.pressures[0]);
    assert.equal(keyboardLevel(stage, pressure, "End"), stage.pressures.at(-1));
    assert.ok(keyboardLevel(stage, pressure, "ArrowUp") <= pressure);
    assert.ok(keyboardLevel(stage, pressure, "ArrowDown") >= pressure);
    assert.equal(keyboardLevel(stage, pressure, "x"), null);
  }
});

test("log pressure spacing and skew translation preserve same-level differences", () => {
  const stage = soundingStages.at(-1);
  const one = soundingPoint(0, 1000, stage), half = soundingPoint(0, 500, stage), quarter = soundingPoint(0, 250, stage);
  assert.ok(Math.abs((one.y - half.y) - (half.y - quarter.y)) < 1e-10);
  for (const pressure of stage.pressures) {
    const row = soundingRow(pressure);
    const gap = skew => soundingPoint(row.temperature, pressure, stage, skew).x - soundingPoint(row.dewpoint, pressure, stage, skew).x;
    assert.ok(Math.abs(gap(false) - gap(true)) < 1e-10);
    for (const field of stage.fields) {
      const p = soundingPoint(row[field], pressure, stage, true);
      assert.ok(p.x >= soundingPlot.left && p.x <= soundingPlot.right);
    }
  }
  assert.equal(soundingPoint(0, 199, stage), null);
  assert.equal(soundingPoint(0, 1001, stage), null);
  assert.equal(soundingPoint(NaN, 500, stage), null);
  assert.equal(levelAtPlotY(stage, soundingPlot.top - 1), null);
  assert.equal(levelAtPlotY(stage, soundingPlot.bottom + 1), null);
  assert.equal(levelAtPlotY(stage, NaN), null);
});

test("visiting target values does not count as an answer and invalid inputs cannot bypass locks", () => {
  for (let index = 0; index < soundingStages.length; index++) {
    const stage = soundingStages[index];
    let state = prepare(index);
    assert.equal(soundingReady(stage, state.attempt), true);
    assert.equal(state.attempt.committed, false);
    assert.deepEqual(state.first, {});
    state = update(state, { type: "reason", value: stage.reason });
    assert.equal(state.attempt.reason, null);
    state = update(state, { type: "commit" });
    assert.equal(state.attempt.committed, true);
    assert.equal(state.first[stage.id].decision, stage.answer);
    const locked = state;
    for (const action of [{ type: "decision", value: "other" }, { type: "level", pressure: stage.start }, { type: "explain" }]) assert.equal(update(locked, action), locked);
  }
  const untouched = initialSoundingWorkshop();
  for (const action of [{ type: "stage", index: -1 }, { type: "stage", index: 7 }, { type: "level", pressure: 333 }, { type: "mode", mode: "other" }, { type: "commit" }]) assert.equal(update(untouched, action), untouched);
});

test("skew cannot be viewed before prediction; explanation waits for the actual toggle", () => {
  let state = prepare(5);
  assert.equal(update(state, { type: "projection", value: "skew" }), state);
  state = update(state, { type: "commit" });
  state = update(state, { type: "reason", value: soundingStages[5].reason });
  assert.equal(update(state, { type: "explain" }), state);
  state = update(state, { type: "projection", value: "skew" });
  const before = soundingRow(state.attempt.pressure);
  state = update(state, { type: "projection", value: "straight" });
  assert.deepEqual(soundingRow(state.attempt.pressure), before);
  assert.equal(update(state, { type: "explain" }).attempt.explained, true);
});

test("first incorrect decision and explanation survive help, retries and storage roundtrips", () => {
  const stage = soundingStages[0], storage = memoryStorage();
  let state = update(prepare(0, "27"), { type: "commit" });
  assert.equal(state.first.level.decisionHelped, false);
  state = update(state, { type: "help", hint: true });
  state = update(state, { type: "reason", value: "surface" });
  state = update(state, { type: "explain" });
  assert.equal(state.first.level.decisionHelped, false);
  assert.equal(state.first.level.reasonHelped, true);
  assert.equal(saveSoundingWorkshop(state, storage), true);
  assert.deepEqual(loadSoundingWorkshop(storage), state);
  const first = { ...state.first.level };
  state = update(loadSoundingWorkshop(storage), { type: "stage", index: 0 });
  state = update(state, { type: "level", pressure: stage.target });
  state = update(state, { type: "decision", value: stage.answer });
  state = update(state, { type: "commit" });
  state = update(state, { type: "reason", value: stage.reason });
  state = update(state, { type: "explain" });
  assert.deepEqual(state.first.level, first);
  assert.equal(state.attempt.repeated, true);
  assert.equal(state.history.length, 2);
  assert.equal(saveSoundingWorkshop(state, storage), true);
  assert.deepEqual(loadSoundingWorkshop(storage).first.level, first);
  assert.deepEqual([...storage.values.keys()], [SOUNDING_WORKSHOP_KEY]);
});

test("unfinished first attempts remain distinct from later completed repeats", () => {
  let state = update(prepare(2), { type: "commit" });
  const first = { ...state.first.inversion };
  state = update(state, { type: "stage", index: 2 });
  for (const p of soundingStages[2].required) state = update(state, { type: "level", pressure: p });
  state = update(state, { type: "decision", value: "rises" });
  state = update(state, { type: "commit" });
  state = update(state, { type: "reason", value: "higher-warmer" });
  state = update(state, { type: "explain" });
  assert.deepEqual(state.first.inversion, first);
  assert.equal(state.first.inversion.reason, null);
  assert.equal(state.attempt.explained, true);
});

test("all valid stages resume; invalid storage, disabled storage and incomplete states are honest", () => {
  for (let index = 0; index < soundingStages.length; index++) {
    for (const state of [stageState(index), prepare(index), finish(index)]) assert.deepEqual(restoreSoundingWorkshop(JSON.parse(JSON.stringify(state))), state);
  }
  for (const invalid of [null, [], { version: 99 }, { ...initialSoundingWorkshop(), stageIndex: 8 }, { ...initialSoundingWorkshop(), attempt: { committed: true } }]) assert.deepEqual(restoreSoundingWorkshop(invalid), initialSoundingWorkshop());
  assert.equal(saveSoundingWorkshop(initialSoundingWorkshop(), null), false);
  const blocked = { getItem() { throw new Error("blocked"); }, setItem() { throw new Error("quota"); } };
  assert.equal(saveSoundingWorkshop(initialSoundingWorkshop(), blocked), false);
  assert.deepEqual(loadSoundingWorkshop(blocked), initialSoundingWorkshop());
  const before = update(prepare(3), { type: "commit" });
  const after = update(before, { type: "mode", mode: "explore" });
  assert.equal(after.attempt.help, true);
  assert.equal(after.first.parcel.decisionHelped, false);
});

test("independent cases retain another profile, not repeated guide values", () => {
  assert.equal(transferCases.sondaz.length, 2);
  assert.ok(transferCases.sondaz[0].facts.some(fact => fact.includes("950 hPa")));
  assert.equal(soundingRow(950), null);
  assert.equal(soundingRow(700).temperature, 9);
  assert.ok(transferCases.sondaz[1].facts.some(fact => fact.includes("700 hPa") && fact.includes("−4°C")));
});

test("actual React SSR keeps data visible, conclusions concealed and actions stage-specific", async t => {
  const cacheDir = await mkdtemp(join(tmpdir(), "chmurnik-sounding-ssr-"));
  const server = await createServer({ configFile: false, root: fileURLToPath(new URL("..", import.meta.url)), cacheDir, publicDir: false, logLevel: "error",
    server: { middlewareMode: true, ws: false, hmr: false, watch: null }, optimizeDeps: { noDiscovery: true, include: [] } });
  t.after(async () => { await server.close(); await rm(cacheDir, { recursive: true, force: true }); });
  assert.equal(server.httpServer, null);
  const { SoundingGuide, SoundingChart, SoundingWorkshop } = await server.ssrLoadModule("/weather-preview/learning/SoundingWorkshop.jsx");
  const render = state => renderToStaticMarkup(React.createElement(SoundingGuide, { state }));
  const visible = html => html.split("<details")[0];

  for (let index = 0; index < soundingStages.length; index++) await t.test(`${soundingStages[index].id}: prediction, reason and feedback are separate renders`, () => {
    const stage = soundingStages[index], prepared = prepare(index), before = render(prepared);
    assert.ok(before.includes('role="slider"'));
    assert.ok(before.includes('aria-orientation="vertical"'));
    assert.ok(before.includes('aria-label="Poziom ciśnienia"'));
    assert.ok(before.includes(`value="${stage.target}" selected=""`));
    assert.ok(!before.includes(stage.reasonQuestion));
    assert.ok(!before.includes('class="sounding-feedback"'));
    for (const paragraph of stage.conclusion) assert.ok(!before.includes(paragraph));
    const selected = soundingRow(stage.target);
    for (const field of stage.fields) assert.ok(visible(before).includes(`<dd>${selected[field]}°C</dd>`));
    if (stage.wind) assert.ok(visible(before).includes(`<dd>z ${selected.windDirection}° · ${selected.windSpeed} kt</dd>`));
    if (stage.reference) assert.ok(visible(before).includes(`Porównaj: ${stage.reference} hPa`));
    const committed = update(prepared, { type: "commit" }), after = render(committed);
    assert.ok(after.includes(stage.reasonQuestion));
    assert.ok(after.includes('aria-disabled="true"'));
    assert.ok(!after.includes('class="sounding-feedback"'));
    const finished = render(finish(index));
    assert.ok(finished.includes('class="sounding-feedback"'));
    assert.ok(finished.includes("Odczyt i uzasadnienie się zgadzają"));
    for (const paragraph of stage.conclusion) assert.ok(finished.includes(paragraph));
  });

  await t.test("first plot shows one point and no dewpoint, parcel, wind or full-profile trace", () => {
    const html = render(initialSoundingWorkshop());
    assert.equal((html.match(/class="sounding-point /g) || []).length, 1);
    assert.ok(!html.includes("sounding-trace"));
    assert.ok(!html.includes("Td · punkt rosy"));
    assert.ok(!html.includes("Porcja · dane umowne"));
    assert.ok(!html.includes("sounding-wind-data"));
  });

  await t.test("skew grid and selected reading guide share the coordinate helper", () => {
    const stage = soundingStages[5], row = soundingRow(500), p = soundingPoint(row.temperature, 500, stage, true);
    const html = renderToStaticMarkup(React.createElement(SoundingChart, { stage, pressure: 500, projection: "skew" }));
    assert.ok(html.includes(`cx="${p.x}" cy="${p.y}"`));
    assert.ok(html.includes(`class="sounding-reading-guide" x1="${p.x}" y1="${p.y}"`));
    assert.ok(html.includes("Fioletowa prowadnica"));
  });

  await t.test("root is portable, SSR-safe and mounts only independent evidence during assessment", () => {
    const previous = Object.getOwnPropertyDescriptor(globalThis, "localStorage");
    const storage = memoryStorage();
    Object.defineProperty(globalThis, "localStorage", { configurable: true, value: storage });
    try {
      const initial = renderToStaticMarkup(React.createElement(SoundingWorkshop, { mainSite: "./app/" }));
      assert.ok(initial.includes('href="./app/#/learn/warstwy"'));
      assert.ok(initial.includes("Profil szkoleniowy B"));
      assert.ok(!initial.includes("Pokrywa"));
      assert.ok(!initial.includes("Wilgotny dół pod ciepłą pokrywą"));
      const state = update(initialSoundingWorkshop(), { type: "mode", mode: "assessment" });
      saveSoundingWorkshop(state, storage);
      const independent = renderToStaticMarkup(React.createElement(SoundingWorkshop, { mainSite: "./app/" }));
      assert.ok(independent.includes('class="transfer-trial"'));
      assert.ok(!independent.includes('class="sounding-apparatus"'));
      assert.ok(!independent.includes("Profil szkoleniowy B"));
      assert.ok(!independent.includes("sounding-feedback"));
      assert.ok(!independent.includes("sounding-method"));
    } finally {
      if (previous) Object.defineProperty(globalThis, "localStorage", previous);
      else delete globalThis.localStorage;
    }
  });
});

test("scoped CSS, touch targets and explicit help bridge do not modify common contracts", async () => {
  const css = await readFile(new URL("../weather-preview/learning/sounding-workshop.css", import.meta.url), "utf8");
  const root = postcss.parse(css);
  root.walkRules(rule => assert.ok(rule.selector.split(",").every(selector => selector.trim().startsWith(".sounding-")), rule.selector));
  assert.ok(css.includes("min-height: 44px"));
  assert.ok(css.includes("prefers-reduced-motion"));
  assert.ok(!css.includes("position: sticky"));
  const jsx = await readFile(new URL("../weather-preview/learning/SoundingWorkshop.jsx", import.meta.url), "utf8");
  assert.ok(jsx.includes('markTransferHelp("sondaz")'));
  assert.ok(jsx.includes('<TransferTrial activityId="sondaz" />'));
  assert.ok(jsx.includes("onAuxClick="));
  assert.ok(!/location\.origin|github\.io|chmurnik\.cloud/.test(jsx));
  assert.ok(!jsx.includes("localStorage.clear"));
});
