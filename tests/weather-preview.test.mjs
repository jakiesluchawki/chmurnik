import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  breeze,
  cloud,
  dewPoint,
  cleanInputs,
  readTrials,
  serializeTrials,
  DEFAULTS,
  timeLabel,
} from "../weather-preview/model.mjs";
import { experiments } from "../weather-preview/content.mjs";

test("breeze reverses when the relative temperatures reverse", () => {
  const day = breeze({ hour: 14, heating: 70 }),
    night = breeze({ hour: 2, heating: 70 });
  assert.ok(day.land > day.water);
  assert.equal(day.direction, "onshore");
  assert.ok(night.land < night.water);
  assert.equal(night.direction, "offshore");
  assert.ok(Math.abs(day.difference + night.difference) < 1e-10);
});
test("equal temperatures give no forced breeze at every time", () => {
  for (let hour = 0; hour < 24; hour += 0.5)
    assert.equal(breeze({ hour, heating: 0 }).direction, "calm");
});
test("the breeze cycle is continuous at midnight", () => {
  const a = breeze({ hour: 0, heating: 100 }),
    b = breeze({ hour: 23.5, heating: 100 });
  assert.ok(Math.abs(a.land - b.land) < 1);
  assert.ok(Math.abs(a.water - b.water) < 1);
});
test("dew point is bounded and has a known Magnus reference", () => {
  assert.equal(dewPoint(20, 100), 20);
  assert.ok(Math.abs(dewPoint(20, 50) - 9.26) < 0.05);
});
test("more humidity lowers LCL at the same temperature", () => {
  let previous = Infinity;
  for (let humidity = 20; humidity <= 100; humidity += 5) {
    const out = cloud({ temperature: 24, humidity, height: 0 });
    assert.ok(out.base <= previous);
    previous = out.base;
  }
  assert.equal(previous, 0);
});
test("the actual guided case changes condensation, not temperature or height inputs", () => {
  const dry = cloud({ temperature: 24, humidity: 40, height: 1500 });
  const moist = cloud({ temperature: 24, humidity: 70, height: 1500 });
  assert.equal(dry.saturated, false);
  assert.equal(moist.saturated, true);
  assert.ok(dry.base > 1500);
  assert.ok(moist.base < 1500);
});
test("parcel T and dew point meet continuously at the LCL", () => {
  const { base } = cloud(DEFAULTS.cloud);
  const before = cloud({ ...DEFAULTS.cloud, height: base - 1e-6 });
  const after = cloud({ ...DEFAULTS.cloud, height: base + 1e-6 });
  assert.ok(Math.abs(before.parcel - before.parcelDew) < 1e-7);
  assert.ok(Math.abs(after.parcel - before.parcel) < 1e-7);
  assert.equal(after.parcel, after.parcelDew);
});
test("dry high LCL stays outside the scene instead of clamping to an invented cloud", () => {
  const out = cloud({ temperature: 35, humidity: 20, height: 3000 });
  assert.ok(out.base > 3000);
  assert.equal(out.aboveScene, true);
  assert.equal(out.saturated, false);
});
test("all allowed model inputs return finite ordered temperatures", () => {
  for (let temperature = 5; temperature <= 35; temperature += 5)
    for (let humidity = 20; humidity <= 100; humidity += 5)
      for (let height = 0; height <= 3000; height += 100) {
        const c = cloud({ temperature, humidity, height });
        for (const key of ["dew", "base", "parcel", "parcelDew", "growth"])
          assert.ok(Number.isFinite(c[key]));
        assert.ok(c.parcel <= temperature + 1e-9);
        assert.ok(c.parcelDew <= c.parcel + 1e-9);
      }
});
test("untrusted saved input rejects null, strings, NaN and out-of-range values", () => {
  assert.deepEqual(cleanInputs("cloud", null), DEFAULTS.cloud);
  assert.deepEqual(
    cleanInputs("breeze", { hour: NaN, heating: "90" }),
    DEFAULTS.breeze,
  );
  assert.deepEqual(cleanInputs("breeze", { hour: 900, heating: -10 }), {
    hour: 23.5,
    heating: 0,
  });
});
test("trial snapshots roundtrip with versioning and do not trust saved outputs", () => {
  const trials = [
    {
      id: "test",
      scene: "cloud",
      input: { temperature: 24, humidity: 70, height: 1500 },
    },
  ];
  assert.deepEqual(readTrials(serializeTrials(trials)), trials);
  assert.deepEqual(readTrials("{bad"), []);
  assert.deepEqual(readTrials('{"version":2,"trials":[]}'), []);
  assert.equal(
    readTrials(
      serializeTrials(
        Array.from({ length: 12 }, (_, i) => ({ ...trials[0], id: String(i) })),
      ),
    ).length,
    8,
  );
  assert.deepEqual(
    readTrials('{"version":1,"trials":[null,{"scene":"evil","id":"x"}]}'),
    [],
  );
});
test("clock labels and question choices are complete", () => {
  assert.equal(timeLabel(2), "02:00");
  assert.equal(timeLabel(23.5), "23:30");
  for (const entry of Object.values(experiments)) {
    assert.equal(new Set(entry.choices).size, 4);
    assert.ok(entry.choices[entry.correct]);
    assert.equal(entry.recap.length, 4);
    assert.ok(entry.source.startsWith("https://"));
  }
});
test("preview stays outside the production entry and has no audio or camera code", async () => {
  const source = await readFile(
    new URL("../weather-preview/main.jsx", import.meta.url),
    "utf8",
  );
  const main = await readFile(
    new URL("../src/main.jsx", import.meta.url),
    "utf8",
  );
  assert.doesNotMatch(main, /weather-preview/);
  assert.doesNotMatch(source, /getUserMedia|speechSynthesis|new Audio|fetch\(/);
  assert.match(source, /step === ["']explain["']/);
  assert.match(source, /disabled=\{!tested\}/);
  assert.match(source, /!locked && !tutorial && \(\s*<section className="comparison"/);
});
