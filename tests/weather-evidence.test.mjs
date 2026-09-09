import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createServer } from "vite";
import postcss from "postcss";
import { forcedLift, heightReference, icingConditions, selectedSounding, skyReport } from "../weather-preview/learning/science.mjs";

const fmt = value => Number(value.toFixed(1)).toLocaleString("pl-PL");
const beforeDetails = html => html.split("<details")[0];
const metric = (label, value) => `<span>${label}</span><strong>${value}</strong>`;

test("P1 scene evidence: rendered values, coordinate anchors and closed explanations", async t => {
  const cacheDir = await mkdtemp(join(tmpdir(), "chmurnik-evidence-ssr-"));
  const server = await createServer({
    configFile: false, root: fileURLToPath(new URL("..", import.meta.url)),
    cacheDir, publicDir: false, logLevel: "error",
    server: { middlewareMode: true, ws: false, hmr: false, watch: null },
    optimizeDeps: { noDiscovery: true, include: [] },
  });
  t.after(async () => { await server.close(); await rm(cacheDir, { recursive: true, force: true }); });
  assert.equal(server.httpServer, null, "SSR checks must not start a browser-facing server");
  const { ActivityScene, heightScenePosition } = await server.ssrLoadModule("/weather-preview/learning/Scenes.jsx");
  const render = (id, state) => renderToStaticMarkup(React.createElement(ActivityScene, { id, state }));

  await t.test("height uses one exact coordinate for the terrain and the reference", () => {
    assert.equal(heightScenePosition(0), 8);
    assert.equal(heightScenePosition(1500), 52.4);
    assert.equal(heightScenePosition(1800), 61.28);
    for (let terrain = 0; terrain <= 2000; terrain += 100) {
      const result = heightReference({ terrain });
      const ground = heightScenePosition(result.terrain), level = heightScenePosition(result.msl);
      const html = render("wysokosc", { terrain });
      assert.ok(html.includes(`class="lab-terrain-column" style="height:${ground}%"`));
      assert.ok(html.includes(`style="bottom:${level}%"><span class="lab-reference-label">1500 m MSL</span>`));
      for (const sceneHeight of [180, 192, 260, 480]) {
        const groundY = sceneHeight * (1 - ground / 100);
        const levelY = sceneHeight * (1 - level / 100);
        assert.equal(Math.sign(levelY - groundY), Math.sign(result.terrain - result.msl));
      }
      assert.ok(!html.includes("cloud.webp"), "a geometric reference must not invent a cloud");
    }
  });

  await t.test("height distinguishes above, equal and below ground in visible evidence and ARIA", () => {
    for (const [terrain, relation, className] of [
      [1300, "200 m AGL · nad gruntem", "lab-reference-line "],
      [1500, "0 m AGL · na powierzchni terenu", "lab-reference-line at-ground"],
      [1800, "300 m pod terenem", "lab-reference-line buried"],
    ]) {
      const html = render("wysokosc", { terrain });
      assert.ok(beforeDetails(html).includes(`<strong>${relation}</strong>`));
      assert.ok(html.includes(`poziom 1500 metrów MSL. ${relation}.`));
      assert.ok(html.includes(`class="${className}"`));
      if (terrain > 1500) assert.equal(heightReference({ terrain }).agl, null);
    }
  });

  await t.test("height label size cannot contribute to the coordinate anchor", async () => {
    const css = postcss.parse(await readFile(new URL("../weather-preview/learning/style.css", import.meta.url), "utf8"));
    const declarations = selector => {
      const values = {};
      css.walkRules(selector, rule => rule.walkDecls(decl => { values[decl.prop] = decl.value; }));
      return values;
    };
    const anchor = declarations(".lab-reference-line");
    assert.equal(anchor.height, "0");
    assert.equal(anchor.border, "0");
    assert.equal(anchor.padding, "0");
    assert.equal(anchor["border-top"], undefined);
    const line = declarations(".lab-reference-line::before");
    assert.equal(line.position, "absolute");
    assert.equal(line.top, "0");
    assert.equal(line.transform, "translateY(-50%)");
    assert.equal(line["border-top"], "2px dashed currentColor");
    assert.equal(declarations(".lab-reference-label").position, "absolute");
    assert.equal(declarations(".lab-terrain-column").transition, undefined, "ground must not lag behind current numeric evidence");
  });

  await t.test("front temperatures and same-height context are visible before details", () => {
    for (const progress of [0, 1, 2, 3, 4, 10, 70, 100]) for (const moisture of ["dry", "wet"]) for (const stability of ["stable", "unstable"]) {
      const state = { progress, moisture, stability, mechanism: "front" };
      const result = forcedLift(state), visible = beforeDetails(render("front", state));
      assert.ok(visible.includes(metric("Temperatura porcji", `${fmt(result.parcel)}°C`)));
      assert.ok(visible.includes(metric("Temperatura otoczenia", `${fmt(result.temperatureEnvironment)}°C`)));
      assert.ok(visible.includes(`Ta sama wysokość: <strong>${Math.round(result.height)} m uniesienia</strong>`));
      assert.ok(visible.includes("Ruch nadal wymuszamy."));
      assert.equal(visible.includes("Temperatury są równe w pokazanej dokładności."), fmt(result.parcel) === fmt(result.temperatureEnvironment));
    }
    const stable = beforeDetails(render("front", { progress: 70, moisture: "wet", stability: "stable", mechanism: "front" }));
    const unstable = beforeDetails(render("front", { progress: 70, moisture: "wet", stability: "unstable", mechanism: "front" }));
    assert.ok(stable.includes("4,8°C chłodniejsza"));
    assert.ok(unstable.includes("2,9°C cieplejsza"));
  });

  await t.test("METAR report, lowest base and ceiling remain visible for every cover", () => {
    for (const cover of ["FEW", "SCT", "BKN", "OVC"]) for (const base of [5, 10, 20, 45]) {
      const state = { cover, base, product: "metar", hour: 12 };
      const result = skyReport(state), visible = beforeDetails(render("metar", state));
      assert.ok(visible.includes(`<code class="lab-report">${result.report}</code>`));
      assert.ok(visible.includes(metric("Najniższa podstawa", `${result.base} ft AGL`)));
      assert.ok(visible.includes(metric("Pułap (ceiling)", `${result.ceiling} ft AGL`)));
      assert.ok(visible.includes("METAR szkoleniowy"));
      if (cover === "OVC") {
        assert.ok(visible.includes('<div class="lab-sky-unknown">Powyżej OVC: brak danych</div>'));
        assert.ok(visible.includes("To nie znaczy, że nie ma tam chmur."));
        assert.ok(!visible.includes("BKN060"));
        assert.ok(!visible.includes("6000 ft"));
      } else {
        assert.ok(visible.includes("BKN060"));
        assert.ok(!visible.includes("lab-sky-unknown"));
      }
    }
  });

  await t.test("TAF is still separate from the editable METAR and respects time boundaries", () => {
    for (const hour of [14, 15, 16, 18]) {
      const html = render("metar", { cover: "OVC", base: 5, product: "taf", hour });
      assert.ok(!html.includes("lab-sky-unknown"));
      assert.ok(!html.includes("OVC005"));
      if (hour === 18) assert.ok(html.includes("Poza okresem ważności"));
      if (hour === 16) assert.ok(html.includes("SCT030 · od 16:00 UTC"));
    }
  });

  await t.test("sounding wind is visible for the selected level, only after wind is introduced", () => {
    for (let index = 0; index < 9; index++) for (const projection of ["straight", "skew"]) {
      const level = selectedSounding(index);
      const visible = beforeDetails(render("sondaz", { level: index, detail: "wind", projection }));
      assert.ok(visible.includes(metric(`Wiatr na ${level.pressure} hPa`, `z ${level.windDirection}° · ${level.windSpeed} kt`)));
      assert.ok(visible.includes("kt: węzły"));
    }
    for (const detail of ["temperature", "moisture", "parcel"]) {
      assert.ok(!render("sondaz", { level: 2, detail, projection: "straight" }).includes("lab-wind-metric"));
    }
  });

  await t.test("icing phase, temperature, exposure and independent trial are visible together", () => {
    for (const temperature of [-25, -10, -1, 0, 3]) for (const phase of ["dry", "liquid", "ice"]) for (const exposure of [0, 50, 100]) {
      const state = { temperature, phase, exposure }, result = icingConditions(state);
      const visible = beforeDetails(render("oblodzenie", state));
      assert.ok(visible.includes(metric("Powietrze i skrzydło", `${temperature}°C`)));
      assert.ok(visible.includes(`Osobna próba od czystej powierzchni · ekspozycja ${exposure}%`));
      assert.ok(visible.includes("Zmiana ustawień to nowa próba. Zniknięcie osadu nie oznacza topnienia."));
      assert.ok(visible.includes("Napływająca woda"));
      assert.equal(visible.includes("Przechłodzone krople ciekłej wody"), phase === "liquid" && temperature < 0);
      if (phase === "ice") assert.ok(visible.includes("Tylko suche kryształki lodu"));
      if (phase === "dry") assert.ok(visible.includes("Bez kropli"));
      assert.equal(visible.includes("Na krawędzi pokazano umowny osad."), result.amount > 0);
      if (result.accretion && exposure === 0) assert.ok(visible.includes("Ekspozycja wynosi 0%: jeszcze bez osadu."));
    }
  });

  await t.test("long readouts remain collapsed in the five changed scenes", () => {
    for (const [id, state] of [
      ["front", { progress: 70, moisture: "wet", stability: "unstable", mechanism: "front" }],
      ["metar", { cover: "SCT", base: 20, product: "metar", hour: 12 }],
      ["wysokosc", { terrain: 1800 }],
      ["sondaz", { level: 2, detail: "wind", projection: "straight" }],
      ["oblodzenie", { temperature: -10, phase: "liquid", exposure: 50 }],
    ]) {
      const html = render(id, state);
      assert.ok(html.includes('<details class="lab-readout">'));
      assert.ok(!html.includes('<details class="lab-readout" open'));
    }
  });
});
