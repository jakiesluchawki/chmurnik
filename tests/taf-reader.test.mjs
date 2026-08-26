import assert from "node:assert/strict";
import test from "node:test";
import {
  decodeMetar,
  detectAviationReportType,
} from "../src/lib/metar-reader.js";
import {
  decodeAviationReport,
  decodeTaf,
  formatTafTime,
} from "../src/lib/taf-reader.js";
import { tafExamples } from "../src/data/field-practice.js";

const klvm =
  "KLVM 261730Z 2618/2718 29008KT P6SM FEW090 BKN200 FM262300 VRB06KT P6SM VCSH SCT100 BKN140 PROB30 2623/2704 VRB25G40KT 6SM -TSRA BKN080CB FM270700 30008KT P6SM SCT100 BKN160";
const base = "TAF EPWA 261130Z 2612/2712 24010KT 9999 SCT030";

test("the user's exact headerless KLVM forecast never masquerades as a METAR", () => {
  assert.equal(detectAviationReportType(klvm), "TAF");
  assert.throws(() => decodeMetar(klvm), /prognoza TAF/);
  const result = decodeAviationReport(klvm);
  assert.equal(result.type, "TAF");
  assert.equal(result.station, "KLVM");
  assert.equal(result.hasHeading, false);
  assert.equal(result.validity.code, "2618/2718");
  assert.equal(result.durationMinutes, 24 * 60);
  assert.deepEqual(result.issued, { day: 26, hour: 17, minute: 30 });
  assert.deepEqual(
    result.segments.map((item) => item.kind),
    ["INITIAL", "FM", "PROB", "FM"],
  );
  const [initial, evening, probable, morning] = result.segments;
  assert.equal(initial.conditions.wind.speed, 8);
  assert.equal(initial.conditions.wind.from, 290);
  assert.equal(initial.conditions.ceiling.height, 20000);
  assert.equal(evening.conditions.wind.variable, true);
  assert.equal(evening.conditions.wind.speed, 6);
  assert.equal(evening.conditions.ceiling.height, 14000);
  assert.equal(probable.probability, 30);
  assert.equal(probable.conditions.wind.variable, true);
  assert.equal(probable.conditions.wind.from, null);
  assert.equal(probable.conditions.wind.speed, 25);
  assert.equal(probable.conditions.wind.gust, 40);
  assert.equal(probable.conditions.ceiling.height, 8000);
  assert.equal(probable.conditions.clouds[0].type, "CB");
  assert.match(probable.conditions.weather[0], /natężenie opadu: słabe/);
  assert.equal(morning.conditions.wind.from, 300);
  assert.equal(morning.conditions.ceiling.height, 16000);
  assert.equal(morning.conditions.weather.length, 0);
  assert.equal(
    result.wind,
    undefined,
    "A forecast must not expose one current wind.",
  );
  assert.equal(result.temperature, undefined);
  assert.equal(
    result.segments.flatMap((item) => item.conditions.unsupported).length,
    0,
  );
});

test("headings, corrections, lowercase, newlines and a single terminator are accepted", () => {
  for (const prefix of ["TAF ", "TAF AMD ", "TAF COR ", "AMD ", ""]) {
    const value = decodeAviationReport(
      `  ${prefix}${klvm.replaceAll(" ", "\n")} = `.toLowerCase(),
    );
    assert.equal(value.type, "TAF");
    assert.equal(value.segments.length, 4);
  }
  assert.deepEqual(decodeTaf(`TAF AMD ${klvm}`).modifiers, ["AMD"]);
});

test("TEMPO and BECMG alone do not turn a METAR trend into TAF", () => {
  for (const trend of [
    "NOSIG",
    "TEMPO FM1300 2000 SHRA BKN008",
    "BECMG FM1300 TL1400 5000 BR",
  ]) {
    const raw = `METAR EPWA 261200Z 24010KT 9999 SCT030 20/10 Q1015 ${trend}`;
    assert.equal(detectAviationReportType(raw), "METAR");
    const value = decodeAviationReport(raw);
    assert.equal(value.type, "METAR");
    assert.equal(value.trend, trend);
    assert.equal(value.visibility.meters, 10000);
  }
  assert.equal(
    decodeAviationReport("SPECI EPWA 261200Z 24010KT 9999 SCT030 20/10 Q1015")
      .type,
    "SPECI",
  );
});

test("forecast words inside preserved METAR remarks do not alter report type", () => {
  const value = decodeAviationReport(
    "EPWA 261200Z 24010KT 9999 SCT030 20/10 Q1015 RMK TAF PROB30 FM261800 2618/2718",
  );
  assert.equal(value.type, "METAR");
  assert.equal(value.remarks, "TAF PROB30 FM261800 2618/2718");
});

test("conflicting explicit observation headings fail instead of displaying forecast as fact", () => {
  for (const type of ["METAR", "SPECI"]) {
    assert.throws(() => decodeAviationReport(`${type} ${klvm}`), /Nagłówek/);
    assert.throws(() => decodeMetar(`${type} ${klvm}`), /TAF/);
  }
});

test("FM, validity and probability reveal a TAF even when its header is incomplete", () => {
  for (const marker of ["2612/2712", "FM261800", "PROB30 2618/2622"]) {
    const value = `EPWA 261130Z ${marker} 24010KT CAVOK`;
    assert.equal(detectAviationReportType(value), "TAF");
    assert.throws(() => decodeMetar(value), /TAF/);
  }
  assert.throws(
    () => decodeAviationReport("EPWA 261130Z FM261800 24010KT CAVOK"),
    /okresu TAF/,
  );
});

test("one report only, bounded input, valid station and valid issuance time", () => {
  for (const value of [
    "",
    null,
    {},
    "x".repeat(6001),
    "TAF 1234 261130Z 2612/2712 24010KT CAVOK",
    "TAF EPWA 322399Z 2612/2712 24010KT CAVOK",
    `${base}= ${base}=`,
    `${base} ${klvm}`,
    `${base} METAR EPGD 261200Z CAVOK`,
  ])
    assert.throws(() => decodeAviationReport(value));
});

test("validity handles midnight 24:00 and month rollover without inventing a date", () => {
  const sameDay = decodeTaf("TAF EPWA 260530Z 2606/2624 24010KT CAVOK");
  assert.equal(sameDay.durationMinutes, 18 * 60);
  assert.equal(formatTafTime(sameDay.validity.end), "dzień 26, 24:00 UTC");
  const rollover = decodeTaf(
    "TAF EPWA 312030Z 3121/0124 24010KT CAVOK FM010030 30010KT 9999 BKN010",
  );
  assert.equal(rollover.durationMinutes, 27 * 60);
  assert.deepEqual(rollover.segments[1].start, { day: 1, hour: 0, minute: 30 });
  assert.match(rollover.warnings.join(" "), /koniec miesiąca/);
  assert.equal(rollover.validity.start.month, undefined);
  assert.equal(rollover.validity.start.year, undefined);
});

test("ambiguous month length never fabricates a precise duration", () => {
  const value = decodeTaf("TAF EPWA 281730Z 2818/0100 24010KT CAVOK");
  assert.equal(value.durationMinutes, null);
  assert.equal(value.validity.start.day, 28);
  assert.equal(value.validity.end.day, 1);
});

test("invalid and unsupported validity periods fail clearly", () => {
  for (const range of [
    "2612/2612",
    "2618/2612",
    "2612/2818",
    "0012/0112",
    "3212/0112",
    "2624/2712",
    "2612/2725",
    "2612/2512",
  ])
    assert.throws(() => decodeTaf(`TAF EPWA 261130Z ${range} 24010KT CAVOK`));
});

test("a change cannot reference a nonexistent day in a possible month frame", () => {
  assert.throws(() => decodeTaf("TAF EPWA 281730Z 2818/0106 24010KT CAVOK FM290100 30010KT CAVOK"));
  const value = decodeTaf("TAF EPWA 281730Z 2818/0100 24010KT CAVOK TEMPO 2820/2900 3000 RA BKN010");
  assert.equal(value.durationMinutes, 30 * 60);
});

test("forecast changes must fit the validity and FM must be chronological", () => {
  for (const change of [
    "FM261100",
    "FM271300",
    "FM262400",
    "FM261299",
    "TEMPO 2713/2714",
    "BECMG 2620/2618",
    "PROB30 2612/2812",
    "FM261900 24010KT CAVOK FM261800",
  ])
    assert.throws(() => decodeTaf(`${base} ${change} 30010KT CAVOK`));
});

test("unsupported or incomplete time groups cannot be flattened into a forecast base", () => {
  for (const change of [
    "FM2300",
    "FM2618",
    "FM26ABCD",
    "PROB50 2618/2620",
    "TEMPO",
    "BECMG 1800",
    "INTER 2618/2620",
    "NOSIG",
  ])
    assert.throws(() => decodeTaf(`${base} ${change} 30010KT CAVOK`));
  assert.throws(() => decodeTaf(`${base} FM261800`), /nie zawiera warunków/);
  assert.throws(
    () => decodeTaf("TAF EPWA 261130Z 2612/2712 TEMPO 2613/2614 4000 RA"),
    /nie zawiera warunków/,
  );
});

test("partial TEMPO and BECMG changes never fabricate missing wind or temperature", () => {
  const value = decodeTaf(
    `${base} BECMG 2614/2616 6000 -RA BKN020 TEMPO 2618/2620 2000 RA BKN008`,
  );
  for (const segment of value.segments.slice(1)) {
    assert.equal(segment.partial, true);
    assert.equal(segment.conditions.wind, null);
    assert.deepEqual(segment.conditions.warnings, []);
    assert.equal(segment.conditions.temperature, null);
  }
  assert.equal(value.segments[0].conditions.wind.speed, 10);
});

test("an incomplete FM does not inherit the preceding visibility, sky or phenomena", () => {
  const value = decodeTaf(`${base} FM261800 30012KT`);
  const conditions = value.segments[1].conditions;
  assert.equal(conditions.visibility, null);
  assert.equal(conditions.skyReported, false);
  assert.ok(
    conditions.warnings.some((warning) => /widzialności/.test(warning)),
  );
  assert.ok(
    conditions.warnings.some((warning) => /danych o niebie/.test(warning)),
  );
});

test("overlapping probability and temporary windows remain separate from each other and the base", () => {
  const value = decodeTaf(
    `${base} TEMPO 2614/2620 4000 RA BKN010 PROB40 TEMPO 2616/2618 1500 TSRA BKN008CB FM262100 30008KT CAVOK`,
  );
  const [initial, temporary, probable, final] = value.segments;
  assert.equal(initial.conditions.visibility.meters, 10000);
  assert.equal(temporary.kind, "TEMPO");
  assert.equal(temporary.probability, null);
  assert.equal(probable.kind, "PROB");
  assert.equal(probable.probability, 40);
  assert.equal(probable.temporary, true);
  assert.equal(probable.conditions.ceiling.height, 800);
  assert.equal(final.conditions.cavok, true);
  assert.equal(final.conditions.ceiling, null);
});

test("NSW changes phenomena only and CAVOK never promises an empty sky", () => {
  const value = decodeTaf(`${base} BECMG 2614/2616 NSW FM261800 30010KT CAVOK`);
  assert.equal(value.segments[1].conditions.noSignificantWeather, true);
  assert.equal(value.segments[1].conditions.skyReported, false);
  assert.equal(value.segments[1].conditions.wind, null);
  assert.match(
    value.segments[2].conditions.groups.find((group) => group.code === "CAVOK")
      .detail,
    /nie znaczy/,
  );
  assert.ok(
    decodeTaf(
      `${base} TEMPO 2616/2618 NSW RA`,
    ).segments[1].conditions.warnings.some((warning) =>
      /sprzeczne/.test(warning),
    ),
  );
});

test("NIL and CNL have no forecast periods or invented weather", () => {
  for (const [flag, status] of [
    ["NIL", "unavailable"],
    ["CNL", "cancelled"],
  ]) {
    for (const range of ["", "2612/2712 "]) {
      const value = decodeAviationReport(`TAF EPWA 261130Z ${range}${flag}`);
      assert.equal(value.status, status);
      assert.deepEqual(value.segments, []);
    }
    assert.throws(() =>
      decodeTaf(`TAF EPWA 261130Z 2612/2712 ${flag} 24010KT CAVOK`),
    );
    assert.throws(() => decodeTaf(`${base} ${flag}`));
  }
});

test("forecast temperature extrema keep their time and cannot become observed dewpoint", () => {
  const value = decodeTaf(`${base} TX24/2615Z TNM02/2705Z`);
  assert.deepEqual(
    value.temperatureExtremes.map((item) => [item.kind, item.temperature]),
    [
      ["max", 24],
      ["min", -2],
    ],
  );
  assert.equal(value.segments[0].conditions.temperature, null);
  assert.equal(value.segments[0].conditions.dewpoint, null);
  assert.throws(() => decodeTaf(`${base} TX24/2718Z`), /poza ważnością/);
});

test("low-level wind shear stays distinct from surface wind and unsupported groups stay visible", () => {
  const value = decodeTaf(`${base} WS020/27040KT QNH2992INS 620304`);
  const conditions = value.segments[0].conditions;
  assert.equal(conditions.wind.speed, 10);
  assert.deepEqual(conditions.windShear[0], {
    height: 2000,
    from: 270,
    speed: 40,
    code: "WS020/27040KT",
  });
  assert.deepEqual(conditions.unsupported, ["QNH2992INS", "620304"]);
  assert.equal(conditions.pressure, null);
  assert.ok(value.warnings.length);
  assert.ok(
    decodeTaf(
      `${base} WS999/99999KT`,
    ).segments[0].conditions.unsupported.includes("WS999/99999KT"),
  );
});

test("US fractions, unknown vertical visibility and calm wind retain their meaning in a TAF", () => {
  const value = decodeTaf(
    "TAF KJFK 261130Z 2612/2712 00000KT M1/4SM FG VV/// TEMPO 2614/2616 1 1/2SM BR BKN005",
  );
  assert.equal(value.segments[0].conditions.wind.calm, true);
  assert.equal(value.segments[0].conditions.visibility.qualifier, "less-than");
  assert.equal(value.segments[0].conditions.ceiling.uncertain, true);
  assert.equal(value.segments[1].conditions.visibility.meters, 1.5 * 1609.344);
});

test("TAF remarks are preserved, not interpreted as additional forecasts", () => {
  const value = decodeTaf(`${base} RMK NXT TAF BY 261800Z`);
  assert.equal(value.remarks, "NXT TAF BY 261800Z");
  assert.equal(value.segments.length, 1);
});

test("all offered TAF examples decode without unsupported groups and provenance stays explicit", () => {
  assert.equal(tafExamples[0].report, klvm);
  assert.equal(tafExamples[0].synthetic, false);
  for (const example of tafExamples) {
    const value = decodeAviationReport(example.report);
    assert.equal(value.type, "TAF");
    assert.equal(
      value.segments.flatMap((item) => item.conditions.unsupported).length,
      0,
    );
  }
});
