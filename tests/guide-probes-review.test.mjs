import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createServer } from "vite";
import { activities, lessonStateAt } from "../weather-preview/learning/catalog.mjs";
import { guideProbes, probeState, readInvestigations, recordPrediction, recordObservation, recordEvidence } from "../weather-preview/learning/guide-probes.mjs";
import { forcedLift, skyReport, tafAt, tafExample, heightReference, icingConditions } from "../weather-preview/learning/science.mjs";
import { decodeMetar } from "../src/lib/metar-reader.js";
import { clouds } from "../src/data/clouds.js";

const reviewed = ["obserwacja", "rodziny", "front", "metar", "wysokosc", "oblodzenie", "nazwy"];
const near = (actual, expected, tolerance = 1e-8) => assert.ok(Math.abs(actual - expected) < tolerance, `${actual} != ${expected}`);
const resultAt = (id, index, model) => model(probeState(id, index, true));
const soleAnswer = (id, index, claims) => {
  assert.equal(claims.length, guideProbes[id][index].options.length);
  assert.deepEqual(claims.flatMap((matches, i) => matches ? [i] : []), [guideProbes[id][index].correct]);
};

test("all seven guides retain their cases, decision keys and one-variable setup", () => {
  const keys = { obserwacja: [1, 2, 0], rodziny: [2, 0, 1], front: [1, 2, 0, 1], metar: [0, 2, 1, 1], wysokosc: [2, 0, 1], oblodzenie: [0, 2, 1], nazwy: [1, 2, 0] };
  for (const id of reviewed) {
    assert.equal(guideProbes[id].length, activities[id].steps.length);
    assert.deepEqual(guideProbes[id].map(p => p.correct), keys[id]);
    for (const [index, p] of guideProbes[id].entries()) {
      assert.equal(new Set(p.options).size, 3);
      assert.equal(new Set(p.evidenceOptions).size, 3);
      assert.ok(p.evidenceOptions[p.evidenceCorrect]);
      if (p.kind === "cause") {
        const before = probeState(id, index), after = probeState(id, index, true);
        assert.deepEqual(Object.keys(before).filter(key => before[key] !== after[key]), [activities[id].steps[index].key]);
      }
    }
  }
});

test("front: moist cloud at 1540 m is colder than the stable environment", () => {
  const r = resultAt("front", 0, forcedLift);
  assert.equal(r.height, 1540);
  // Independent numerical fixtures for the existing approximate LCL / 9.8 / 6 K/km model.
  near(r.base, 457.9734885494684);
  near(r.parcel, 24 - 9.8 * r.base / 1000 - 6 * (1540 - r.base) / 1000);
  near(r.parcel, 13.01970074351202);
  near(r.temperatureEnvironment, 24 - 4 * 1.54);
  near(r.parcel - r.temperatureEnvironment, -4.82029925648798);
  assert.equal(r.opacity, 1);
  soleAnswer("front", 0, [!r.saturated, r.saturated && r.parcel < r.temperatureEnvironment, r.saturated && r.parcel > r.temperatureEnvironment]);
});

test("front: dry trial stays below its LCL, despite cooling more at the same height", () => {
  const before = forcedLift(probeState("front", 1)), after = resultAt("front", 1, forcedLift);
  near(after.base, 2655.2940879149182);
  near(after.parcel, 24 - 9.8 * 1.54);
  near(after.parcel, 8.908);
  assert.equal(after.height, before.height);
  assert.equal(after.temperatureEnvironment, before.temperatureEnvironment);
  assert.ok(after.parcel < before.parcel);
  assert.equal(after.opacity, 0);
  soleAnswer("front", 1, [after.base < before.base, after.saturated === before.saturated, !after.saturated]);
});

test("front: restored humidity returns condensation without extra lift or environmental cooling", () => {
  const before = forcedLift(probeState("front", 2)), after = resultAt("front", 2, forcedLift);
  assert.equal(before.saturated, false);
  assert.equal(after.height, before.height);
  assert.equal(after.temperatureEnvironment, before.temperatureEnvironment);
  near(after.parcel, 13.01970074351202);
  soleAnswer("front", 2, [after.saturated, !after.saturated && after.height === before.height, !after.saturated && after.temperatureEnvironment === before.temperatureEnvironment]);
});

test("front: environmental lapse changes the temperature sign, not the prescribed parcel or cloud", () => {
  const before = forcedLift(probeState("front", 3)), after = resultAt("front", 3, forcedLift);
  for (const key of ["height", "parcel", "base", "saturated", "opacity"]) assert.equal(after[key], before[key]);
  near(after.temperatureEnvironment, 24 - 9 * 1.54);
  near(after.parcel - after.temperatureEnvironment, 2.87970074351202);
  const difference = after.parcel - after.temperatureEnvironment;
  soleAnswer("front", 3, [Math.abs(difference) < .05, difference > .05, difference < -.05]);
  // A dry parcel in the same 9 K/km environment is still colder: no "unstable => rises" shortcut.
  const dry = forcedLift({ ...probeState("front", 3, true), moisture: "dry" });
  near(dry.parcel - dry.temperatureEnvironment, -1.232);
  assert.equal(dry.buoyant, false);
});

test("METAR: changing cover alone changes ceiling from 6000 to 2000 ft, not cloud base", () => {
  const before = skyReport(probeState("metar", 0)), after = resultAt("metar", 0, skyReport);
  assert.equal(before.ceiling, 6000);
  assert.equal(after.base, before.base);
  assert.deepEqual(after.decoded.clouds.map(c => c.height), [2000, 6000]);
  assert.equal(after.ceiling, after.decoded.ceiling.height);
  soleAnswer("metar", 0, [after.ceiling === 2000, after.ceiling === 6000, after.ceiling === 4000]);
});

test("METAR: the base code encodes hundreds of feet, not hundreds of metres or cloud thickness", () => {
  const r = resultAt("metar", 1, skyReport);
  assert.equal(r.base, 1000);
  assert.equal(r.ceiling, 1000);
  soleAnswer("metar", 1, [2000 === r.base, 10000 === r.base, 1000 === r.base]);
  assert.equal(r.decoded.clouds[0].code, guideProbes.metar[1].options[guideProbes.metar[1].correct]);
  const ovc = skyReport({ cover: "OVC", base: 10 });
  assert.equal(ovc.ceiling, 1000);
  assert.deepEqual(ovc.decoded.clouds.map(c => c.code), ["OVC010"]);
  assert.equal(ovc.groups.includes("BKN060"), false);
});

test("TAF: forecast case is independent of the modified METAR and TEMPO is not an observation", () => {
  const state = probeState("metar", 2, true);
  assert.equal(state.product, "taf");
  assert.equal(state.base, 10);
  assert.match(tafExample, /^TAF EPWA 081100Z 0812\/0818 .* SCT020 BKN060 TEMPO /);
  assert.equal(tafExample.includes("BKN010"), false);
  assert.equal(guideProbes.metar[2].correct, 1);
  assert.equal(probeState("metar", 3, true).hour, 14);
  assert.equal(tafAt(12).temporary, null);
  assert.ok(tafAt(13).temporary);
  assert.match(tafAt(14).temporary, /4000 m.*BKN015/);
  assert.equal(tafAt(15).temporary, null);
  assert.equal(tafAt(18).valid, false);
  // Decode the raw TEMPO cloud group independently of the scene's explanatory label.
  const tempoGroup = tafExample.split("TEMPO ")[1].split(" FM")[0];
  const tempoCloud = decodeMetar(`METAR EPWA 081400Z 24008KT ${tempoGroup.slice("0813/0815 ".length)} 18/12 Q1015`);
  assert.equal(tempoCloud.ceiling.height, 1500);
  assert.equal(tempoCloud.visibility.meters, 4000);
  assert.equal(guideProbes.metar[3].correct, 1);
});

test("TAF evidence: FM SCT030 replaces the base but does not create a 3000 ft ceiling", () => {
  const group = tafExample.split("FM081600 ")[1];
  const r = decodeMetar(`METAR EPWA 081600Z ${group} 18/12 Q1015`);
  assert.equal(r.clouds[0].height, 3000);
  assert.equal(r.clouds[0].cover, "SCT");
  assert.equal(r.ceiling, null);
  assert.match(tafAt(16).base, /SCT030/);
  assert.equal(tafAt(16).temporary, null);
  assert.equal(guideProbes.metar[3].evidenceCorrect, 0);
});

test("height: all three answer values use the same MSL reference", () => {
  const pass = resultAt("wysokosc", 0, heightReference);
  soleAnswer("wysokosc", 0, [pass.agl === 1500, pass.agl === 2800, pass.agl === 200]);
  assert.equal(pass.agl, 1500 - 1300);
  const buried = resultAt("wysokosc", 1, heightReference);
  assert.equal(buried.agl, null);
  assert.equal(buried.terrain - buried.msl, 300);
  soleAnswer("wysokosc", 1, [buried.belowGround, buried.agl === 300, buried.agl === 0]);
  const lowland = resultAt("wysokosc", 2, heightReference);
  soleAnswer("wysokosc", 2, [lowland.msl === 1400 && lowland.agl === 1500, lowland.msl === 1500 && lowland.agl === 1400, lowland.msl === 1600 && lowland.agl === 1500]);
});

test("height: equality is ground contact, not buried or an above-ground air layer", () => {
  assert.deepEqual(heightReference({ terrain: 1500 }), { msl: 1500, terrain: 1500, agl: 0, belowGround: false });
  assert.equal(heightReference({ terrain: 1499 }).agl, 1);
  assert.equal(heightReference({ terrain: 1501 }).agl, null);
});

test("icing: zero, liquid accretion and dry crystals are separate qualitative trials", () => {
  const dry = resultAt("oblodzenie", 0, icingConditions);
  assert.equal(dry.temperature, -10);
  assert.equal(probeState("oblodzenie", 0, true).exposure, 50);
  assert.equal(dry.amount, 0);
  assert.equal(dry.accretion, false);
  const liquid = resultAt("oblodzenie", 1, icingConditions);
  assert.equal(liquid.temperature, dry.temperature);
  assert.equal(liquid.liquid, true);
  assert.equal(liquid.accretion, true);
  assert.equal(liquid.amount, .5);
  const crystals = resultAt("oblodzenie", 2, icingConditions);
  assert.equal(crystals.temperature, -10);
  assert.equal(crystals.liquid, false);
  assert.equal(crystals.accretion, false);
  assert.equal(crystals.amount, 0);
  soleAnswer("oblodzenie", 1, [!liquid.liquid, !liquid.accretion, liquid.amount > 0]);
  assert.deepEqual([guideProbes.oblodzenie[0].correct, guideProbes.oblodzenie[2].correct], [0, 1]);
});

test("icing: exposure does not replace liquid water or determine physical ice thickness", () => {
  for (const exposure of [0, 25, 50, 100]) {
    for (const phase of ["dry", "ice"]) assert.equal(icingConditions({ temperature: -10, phase, exposure }).amount, 0);
    assert.equal(icingConditions({ temperature: 5, phase: "liquid", exposure }).amount, 0);
  }
  assert.equal(icingConditions({ temperature: -10, phase: "liquid", exposure: 0 }).amount, 0);
  // The existing model has a strict T < 0 gate; this is not a real-world no-icing threshold.
  assert.equal(icingConditions({ temperature: 0, phase: "liquid", exposure: 50 }).amount, 0);
  const r = icingConditions({ temperature: -10, phase: "liquid", exposure: 50 });
  assert.equal("thickness" in r, false);
  assert.equal("melted" in r, false);
  assert.equal("risk" in r, false);
});

test("photographic cases present the intended independent A/B images without inventing measured heights", () => {
  const pairs = [["cumulus", "cirrus"], ["cirrus", "altostratus"], ["altostratus", "stratocumulus"]];
  for (const [index, [a, b]] of pairs.entries()) {
    assert.equal(lessonStateAt("rodziny", index).genus, a);
    assert.equal(probeState("rodziny", index).genus, b);
    assert.ok(clouds.find(c => c.id === b).images[0].author);
  }
  assert.match(guideProbes.rodziny[0].question, /niezależne fotografie/);
  assert.match(guideProbes.rodziny[2].question, /z góry, A z dołu/);
  assert.equal(probeState("obserwacja", 1, true).altitude, "unknown");
  // These are content/asset-selection checks, not automated image classification.
  assert.match(guideProbes.obserwacja[2].options[0], /niezmierzona/);
});

test("names: WMO species, supplementary precipitation feature and unknown origin stay distinct", () => {
  assert.equal(guideProbes.nazwy[0].options[guideProbes.nazwy[0].correct], "congestus");
  assert.equal(guideProbes.nazwy[1].options[guideProbes.nazwy[1].correct], "praecipitatio");
  assert.deepEqual(probeState("nazwy", 2, true), { species: "congestus", feature: "praecipitatio", history: "unknown" });
  assert.equal(guideProbes.nazwy[2].correct, 0);
  assert.equal(guideProbes.nazwy[2].evidenceCorrect, 2);
});

test("setting the target or retrying cannot replace the saved prediction or evidence choice", () => {
  for (const id of reviewed) {
    for (const [index, p] of guideProbes[id].entries()) {
      const wrong = (p.correct + 1) % 3, token = `${id}-${index}`;
      const store = recordPrediction(readInvestigations(null), { id, index, answer: wrong, state: probeState(id, index), token });
      const retry = recordPrediction(store, { id, index, answer: p.correct, state: probeState(id, index, true), token });
      assert.strictEqual(retry, store);
      assert.equal(retry.attempts[0].correct, false);
      const observed = recordObservation(retry, token, probeState(id, index, true), { setupUsed: true });
      assert.deepEqual(observed.attempts[0].observedState, probeState(id, index, true));
      assert.equal(observed.attempts[0].setupUsed, true);
      const reason = recordEvidence(observed, token, p.evidenceCorrect);
      assert.equal(reason.attempts[0].correct, false);
      assert.equal(reason.attempts[0].evidenceCorrect, true);
      assert.equal(reason.attempts[0].predictionHelped, false);
      assert.equal(reason.attempts[0].evidenceHelped, false);
    }
  }
});

test("SSR: commitment gates and blocking interpretation-leak regressions", async t => {
  const cacheDir = await mkdtemp(join(tmpdir(), "chmurnik-guide-review-"));
  const server = await createServer({ configFile: false, root: fileURLToPath(new URL("..", import.meta.url)), cacheDir, publicDir: false, logLevel: "error", server: { middlewareMode: true, ws: false, hmr: false, watch: null }, optimizeDeps: { noDiscovery: true, include: [] } });
  t.after(async () => { await server.close(); await rm(cacheDir, { recursive: true, force: true }); });
  const { GuidedInvestigation } = await server.ssrLoadModule("/weather-preview/learning/GuidedInvestigation.jsx");
  const { ActivityScene, heightScenePosition } = await server.ssrLoadModule("/weather-preview/learning/Scenes.jsx");
  const render = (id, index, stage) => renderToStaticMarkup(React.createElement(GuidedInvestigation, { id, renderControl: () => null, onAssessment: () => {}, resumeRef: { current: { index, stage, state: probeState(id, index, stage === "evidence" || stage === "review"), prediction: 0, evidence: null, token: null } } }));
  const textMarkup = value => renderToStaticMarkup(React.createElement("span", null, value)).slice(6, -7);

  await t.test("all seven prediction screens hide reason questions, action targets and review feedback", () => {
    for (const id of reviewed) {
      for (const [index, p] of guideProbes[id].entries()) {
        const before = render(id, index, "predict");
        assert.equal(before.includes(textMarkup(p.evidence)), false, `${id}/${index}: reason question leaked`);
        assert.doesNotMatch(before, /Ustaw warunki tej próby|Porównanie z Twoją odpowiedzią|Wskazany dowód pasuje/);
        assert.match(before, p.kind === "read" ? /Zapisz obserwację/ : /Zapisz przewidywanie/);
        assert.equal(render(id, index, "evidence").includes(textMarkup(p.evidence)), true);
      }
    }
  });

  await t.test("raw readings remain visible; photographic names and ready Latin answers do not", () => {
    const front = render("front", 3, "predict");
    assert.match(front, /13(?:,0)?°C/);
    assert.match(front, /17,8°C/);
    const metar = render("metar", 0, "predict");
    assert.match(metar, /SCT020 BKN060/);
    const taf = render("metar", 3, "predict");
    assert.match(taf, /TEMPO 0813\/0815 4000 SHRA BKN015/);
    const icing = render("oblodzenie", 0, "predict");
    assert.match(icing, /Powietrze i skrzydło/);
    assert.match(icing, /-10°C/);
    assert.match(icing, /Bez kropli/);
    for (const id of ["obserwacja", "rodziny", "nazwy"]) {
      const scene = renderToStaticMarkup(React.createElement(ActivityScene, { id, state: probeState(id, 0), conceal: true, hideInterpretation: true, compareState: id === "rodziny" ? activities.rodziny.initial : undefined }));
      assert.doesNotMatch(scene, /<details|href="https:/);
      assert.doesNotMatch(scene, /alt="(?:Cirrus|Cumulus|Stratocumulus)/);
      if (id === "nazwy") assert.doesNotMatch(scene, /congestus|praecipitatio/);
    }
  });

  await t.test("height line and terrain use exact shared coordinates, including equality", () => {
    const line = heightScenePosition(1500), terrain = heightScenePosition(1800);
    near(line, 52.4);
    near(terrain, 61.28);
    near(terrain - line, 8.88);
    assert.ok(terrain > line);
    const equal = renderToStaticMarkup(React.createElement(ActivityScene, { id: "wysokosc", state: { terrain: 1500 } }));
    assert.match(equal, /height:52\.4%/);
    assert.match(equal, /bottom:52\.4%/);
    assert.match(equal, /at-ground/);
    assert.match(equal, /0 m AGL/);
  });

  // Keep raw evidence visible, but block ready interpretations before commitment.
  await t.test("height evidence choice must precede the buried-air interpretation", () => {
    assert.equal(render("wysokosc", 1, "evidence").includes("Ten poziom nie jest tu warstwą powietrza nad gruntem"), false, "Buried-air verdict is visible before the reason is committed");
  });
  await t.test("front evidence choice must precede the derived warmer/cooler verdict", () => {
    assert.equal(/Porcja jest o .*?cieplejsza.*?od otoczenia/.test(render("front", 3, "evidence")), false, "Derived thermal comparison is visible before the reason is committed");
  });
  await t.test("METAR evidence choice must precede the ready ceiling rule", () => {
    assert.equal(render("metar", 0, "evidence").includes("Najniższa warstwa BKN lub OVC tworzy pułap"), false, "Ceiling rule is visible before the reason is committed");
  });

  await t.test("concealed result scenes retain raw evidence without derived numbers or AX verdicts", () => {
    const scene = (id, index) => renderToStaticMarkup(React.createElement(ActivityScene, { id, state: probeState(id, index, true), hideInterpretation: true }));
    const front = scene("front", 3);
    assert.match(front, /13°C/);
    assert.match(front, /10,1°C/);
    assert.match(front, /1540 m uniesienia/);
    assert.doesNotMatch(front, /Osiągnięte nasycenie|Przed kondensacją|Porcja jest o/);
    const height = scene("wysokosc", 1);
    assert.match(height, /1500 m MSL/);
    assert.match(height, /1800 m MSL/);
    assert.doesNotMatch(height, /300 m pod terenem|warstwą powietrza nad gruntem/);
    const metar = scene("metar", 0);
    assert.match(metar, /BKN020 BKN060/);
    assert.match(metar, /Najniższa podstawa/);
    assert.match(metar, /2000 ft AGL/);
    assert.doesNotMatch(metar, /Pułap \(ceiling\)|Pułap 2000 stóp|tworzy pułap/);
  });

  await t.test("interpretations return after the evidence decision", () => {
    assert.match(render("wysokosc", 1, "review"), /Ten poziom nie jest tu warstwą powietrza nad gruntem/);
    assert.match(render("front", 3, "review"), /Porcja jest o .*?cieplejsza.*?od otoczenia/);
    assert.match(render("metar", 0, "review"), /Najniższa warstwa BKN lub OVC tworzy pułap/);
  });

  await t.test("TAF prediction exposes the raw future group, not the translated target-hour result", () => {
    assert.equal(probeState("metar", 3).hour, 12);
    assert.equal(probeState("metar", 3, true).hour, 14);
    const before = render("metar", 3, "predict");
    assert.match(before, /TEMPO 0813\/0815 4000 SHRA BKN015/);
    assert.match(before, /FM081600 28012KT 9999 SCT030/);
    assert.doesNotMatch(before, /TEMPO: przejściowo 4000 m, przelotny deszcz i BKN015/);
    assert.equal(before.includes(textMarkup(guideProbes.metar[3].evidence)), false);
    // This proves the canonical pre-decision state, not that every TAF card
    // respects hideInterpretation or that reading after commitment is unaided.
  });
});
