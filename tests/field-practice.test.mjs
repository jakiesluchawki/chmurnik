import assert from "node:assert/strict";
import test from "node:test";
import { decodeMetar } from "../src/lib/metar-reader.js";
import {
  apparentWind,
  beaufortForce,
  windComponents,
} from "../src/lib/wind.js";
import {
  metarExamples,
  practiceCases,
  recordPracticeAttempt,
} from "../src/data/field-practice.js";
import { sources } from "../src/data/sources.js";

const near = (a, b) =>
  assert.ok(Math.abs(a - b) < 0.01, `${a} differs from ${b}`);
const report = (body) => decodeMetar(`METAR EPWA 261200Z ${body}`);

test("METAR separates observation from trend and remarks", () => {
  const value = report(
    "24015G25KT 8000 SCT020 BKN045 17/15 Q1012 TEMPO 2000 SHRA BKN010 RMK TEST",
  );
  assert.equal(value.ceiling.height, 4500);
  assert.equal(value.visibility.meters, 8000);
  assert.equal(value.wind.gust, 25);
  assert.equal(value.trend, "TEMPO 2000 SHRA BKN010");
  assert.equal(value.remarks, "TEST");
  assert.equal(value.temperature, 17);
  assert.deepEqual(value.unsupported, []);
});

test("unknown vertical visibility never becomes a zero or known ceiling", () => {
  const value = report("00000KT 0300 FG VV/// 10/10 Q1019");
  assert.deepEqual(value.ceiling, { height: null, uncertain: true });
  assert.equal(value.wind.from, null);
  assert.equal(value.wind.calm, true);
  assert.equal(report("00000KT 0300 BKN/// OVC010").ceiling.uncertain, true);
});

test("US mixed and bounded visibility keep their qualifiers", () => {
  near(
    report("18012KT 1 1/2SM -RA BKN008 18/17 A2992").visibility.meters,
    2414.016,
  );
  assert.equal(report("VRB03KT M1/4SM").visibility.qualifier, "less-than");
  assert.equal(report("VRB03KT P6SM").visibility.qualifier, "greater-than");
  assert.equal(report("VRB03KT 9999").visibility.meters, 10000);
  assert.equal(report("VRB03KT 0000").visibility.meters, 50);
  assert.equal(report("VRB03KT 1/0SM").visibility, null);
});

test("international units, temperatures and varying wind are supported", () => {
  const value = report("35010MPS 310V040 9999 SCT020 M02/M05 Q0999");
  near(value.wind.speed, 19.43846);
  assert.deepEqual(value.wind.range, [310, 40]);
  assert.equal(value.temperature, -2);
  assert.equal(value.dewpoint, -5);
  assert.equal(value.pressure.hpa, 999);
  near(report("36020KMH CAVOK").wind.speed, 10.7991);
  near(report("00000KT 10SM CLR 20/10 A2992").pressure.hpa, 1013.2075);
});

test("CAVOK never claims a completely empty sky", () => {
  const value = report("VRB03KT CAVOK 21/13 Q1016");
  assert.equal(value.cavok, true);
  assert.equal(value.ceiling, null);
  assert.match(
    value.groups.find((group) => group.code === "CAVOK").detail,
    /nie znaczy/,
  );
  assert.ok(
    report("CAVOK BKN005 -RA").warnings.some((warning) =>
      /sprzeczności/.test(warning),
    ),
  );
});

test("partial decoding preserves RVR, wind shear, missing and unsupported data", () => {
  const value = report("27012KT 0900 R27/0800U WS R27 BKN/// 12/// Q////");
  assert.ok(value.unsupported.includes("R27/0800U"));
  assert.ok(value.unsupported.includes("WS"));
  assert.ok(value.unsupported.includes("Q////"));
  assert.equal(value.temperature, 12);
  assert.equal(value.dewpoint, null);
  assert.ok(value.warnings.length);
  assert.equal(report("NIL").nil, true);
});

test("malformed inputs and TAF cannot masquerade as METAR", () => {
  for (const value of [
    "",
    "TAF EPWA 261200Z 2612/2712 27010KT CAVOK",
    "METAR EPWA 329900Z",
    "EPWA 261200Z CAVOK= EPGD 261200Z CAVOK=",
    "hello",
    "x".repeat(6001),
  ]) {
    assert.throws(() => decodeMetar(value));
  }
  for (const wind of ["40012KT", "00012KT", "27012G05KT"]) {
    assert.equal(report(wind).wind, null);
    assert.ok(report(wind).unsupported.includes(wind));
  }
  assert.equal(
    decodeMetar("SPECI COR EPWA 261200Z 00000KT CAVOK=").corrected,
    true,
  );
});

test("every METAR example is decodable and explicitly synthetic in the UI contract", () => {
  for (const example of metarExamples)
    assert.equal(decodeMetar(example.report).unsupported.length, 0);
});

test("wind components use from-direction, sign, and one reference north", () => {
  assert.deepEqual(windComponents(270, 20, 270), {
    headwind: 20,
    crosswind: 0,
  });
  assert.deepEqual(windComponents(90, 20, 270), {
    headwind: -20,
    crosswind: 0,
  });
  near(windComponents(240, 20, 270).crosswind, -10);
  near(windComponents(300, 20, 270).crosswind, 10);
  near(windComponents(0, 20, 360).headwind, 20);
  assert.throws(() => windComponents(NaN, 20, 270));
  assert.throws(() => windComponents(0, -1, 0));
});

test("apparent wind handles reaching, running, still air and exact cancellation", () => {
  const beam = apparentWind(90, 10, 0, 6);
  near(beam.speed, Math.sqrt(136));
  near(beam.relative, 59.0362);
  const run = apparentWind(0, 12, 180, 5);
  near(run.speed, 7);
  near(Math.abs(run.relative), 180);
  assert.deepEqual(apparentWind(0, 5, 180, 5), {
    speed: 0,
    from: null,
    relative: null,
  });
  near(apparentWind(123, 0, 35, 5).from, 35);
  near(apparentWind(280, 12, 100, 0).from, 280);
  assert.throws(() => apparentWind(90, 10, 0, -3));
});

test("Beaufort handles the full official whole-knot range", () => {
  for (const [speed, force] of [
    [0, 0],
    [1, 1],
    [3, 1],
    [4, 2],
    [10, 3],
    [16, 4],
    [17, 5],
    [28, 7],
    [63, 11],
    [64, 12],
  ])
    assert.equal(beaufortForce(speed), force);
  assert.throws(() => beaufortForce(Infinity));
});

test("practice cases have four unique options, feedback, and valid primary sources", () => {
  assert.equal(
    new Set(practiceCases.map((item) => item.id)).size,
    practiceCases.length,
  );
  for (const item of practiceCases) {
    assert.equal(item.choices.length, 4);
    assert.equal(new Set(item.choices).size, 4);
    assert.ok(
      Number.isInteger(item.answer) && item.answer >= 0 && item.answer < 4,
    );
    assert.ok(item.explanation.length > 80);
    assert.ok(item.sources.every((id) => sources[id]));
  }
  for (const track of ["wind", "metar", "maps"])
    assert.equal(
      practiceCases.filter((item) => item.track === track).length,
      4,
    );
});

test("practice progress keeps incorrect and correct attempts separate", () => {
  const first = recordPracticeAttempt({}, "ceiling", false, 100);
  const second = recordPracticeAttempt(first, "ceiling", true, 200);
  assert.deepEqual(second.ceiling, {
    attempts: 2,
    correct: 1,
    lastCorrect: true,
    lastAt: 200,
  });
  assert.equal(first.ceiling.lastCorrect, false);
});
test("missing sky data never masquerades as an absent ceiling", () => {
  const missing = decodeMetar("METAR EPWA 261200Z 24010KT 9999 20/10 Q1015");
  assert.equal(missing.skyReported, false);
  assert.match(missing.warnings.join(" "), /Nie wnioskuj z tego o braku pułapu/);
  for (const code of ["CAVOK", "NSC", "CLR", "SKC", "NCD", "SCT020"]) {
    const reported = decodeMetar(`METAR EPWA 261200Z 24010KT ${code === "CAVOK" ? "" : "9999 "}${code} 20/10 Q1015`);
    assert.equal(reported.skyReported, true);
  }
});

test("invalid magnitudes and hidden multiple reports remain unsupported", () => {
  for (const wind of ["240999KT", "240200MPS", "00020KT", "27010G05KT"]) {
    const result = decodeMetar(`EPWA 261200Z ${wind} 9999 NSC 20/10 Q1015`);
    assert.equal(result.wind, null);
    assert.ok(result.unsupported.includes(wind));
  }
  const visibility = decodeMetar("KJFK 261200Z 24010KT 1/00SM CLR 20/10 A2992");
  assert.equal(visibility.visibility, null);
  assert.throws(() => decodeMetar("EPWA 261200Z 24010KT 9999 NSC EPGD 261230Z 01010KT 9000"), /jedną/);
});
