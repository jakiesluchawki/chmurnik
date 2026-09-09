import test from "node:test";
import assert from "node:assert/strict";
import { access, mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { transferCases } from "../weather-preview/learning/transfer-cases.mjs";
import { activities, lessonStateAt } from "../weather-preview/learning/catalog.mjs";
import { guides, guideInputsAt, sceneHashes } from "../weather-preview/tutorial.mjs";
import { breeze, cloud, fog, LIMITS } from "../weather-preview/model.mjs";
import { skyReport, tafExample, tafAt, forcedLift, icingConditions, heightReference,
  selectedSounding, soundingCoordinates, soundingScenarios, stormIngredients,
  windFromCloudMotion } from "../weather-preview/learning/science.mjs";
import { clouds } from "../src/data/clouds.js";
import previewConfig from "../weather-preview/vite.config.mjs";

const allCases = Object.values(transferCases).flat();
const photos = (exercise) => exercise.images ?? (exercise.image ? [exercise.image] : []);
const allPhotos = allCases.flatMap(photos);
const originalPhotos = new Map(clouds.flatMap((item) => item.images.map((image) => [image.page, image])));
const text = (value) => assert.ok(typeof value === "string" && value.trim().length > 0);
const fieldById = (exercise, id) => exercise.fields.find((field) => field.id === id);
const shownFacts = (exercise, id) => {
  const indices = fieldById(exercise, id).factIndices;
  return indices ? indices.map((index) => exercise.facts[index]) : exercise.facts;
};
const rawText = (exercise) => [exercise.title, exercise.context, ...exercise.facts].join("\n");
const polish = (value) => String(value).replace("-", "−").replace(".", ",");

// Parse only the explicitly labelled raw facts, so a changed bank input changes the calculation.
function number(exercise, prefix) {
  const fact = exercise.facts.find((item) => item.startsWith(prefix));
  assert.ok(fact, `${exercise.id}: missing ${prefix}`);
  const match = fact.slice(prefix.length).match(/^\s*([+−-]?\d+(?:[.,]\d+)?)/);
  assert.ok(match, `${exercise.id}: non-numeric ${prefix}`);
  return Number(match[1].replace("−", "-").replace(",", "."));
}
function approximate(actual, displayed, decimals = 1) {
  assert.ok(Math.abs(actual - displayed) <= 0.5 * 10 ** -decimals + 1e-9,
    `${actual} does not round to ${displayed}`);
}
function validInputs(scene, input) {
  for (const [key, value] of Object.entries(input)) {
    const [min, max] = LIMITS[scene][key];
    assert.ok(value >= min && value <= max, `${scene}.${key}: ${value}`);
  }
  for (let index = 0; index <= guides[scene].steps.length; index++) {
    assert.notDeepEqual(input, guideInputsAt(scene, index), "Transfer must not repeat a tutorial state");
  }
}
function differsFromLesson(id, input) {
  for (let index = 0; index <= activities[id].steps.length; index++) {
    const state = lessonStateAt(id, index);
    assert.ok(Object.entries(input).some(([key, value]) => state[key] !== value), `${id}: tutorial state ${index}`);
  }
}
const saturationAnswer = (a, b) => a ? (b ? "both" : "first-only") : (b ? "second-only" : "neither");

test("bank covers all 14 activity IDs with exactly two fixed, unique cases each", () => {
  assert.deepEqual(Object.keys(transferCases).sort(), [...Object.keys(activities), ...Object.values(sceneHashes)].sort());
  assert.equal(allCases.length, 28);
  assert.equal(new Set(allCases.map((exercise) => exercise.id)).size, 28);
  for (const [id, pair] of Object.entries(transferCases)) {
    assert.equal(pair.length, 2);
    assert.deepEqual(pair.map((exercise) => exercise.id), [`${id}-a-v1`, `${id}-b-v1`]);
    assert.notEqual(pair[0].title, pair[1].title);
    assert.notDeepEqual({ facts: pair[0].facts, photos: photos(pair[0]) }, { facts: pair[1].facts, photos: photos(pair[1]) });
  }
  assert.deepEqual(JSON.parse(JSON.stringify(transferCases)), transferCases);
});

for (const [activityId, pair] of Object.entries(transferCases)) {
  test(`${activityId}: complete decision/reason schema, feedback and valid fact subsets`, () => {
    for (const exercise of pair) {
      for (const key of ["id", "title", "context", "explanation", "hint"]) text(exercise[key]);
      assert.ok(Array.isArray(exercise.facts) && exercise.facts.length >= 2);
      exercise.facts.forEach(text);
      assert.ok(exercise.fields.length >= 2 && exercise.fields.length <= 3);
      const ids = exercise.fields.map((field) => field.id);
      assert.equal(new Set(ids).size, ids.length);
      assert.ok(!ids.includes("reason"));
      assert.deepEqual(Object.keys(exercise.correct).sort(), [...ids, "reason"].sort());
      for (const question of [...exercise.fields, { ...exercise.reason, id: "reason" }]) {
        text(question.label);
        assert.ok(question.options.length >= 3);
        assert.equal(new Set(question.options.map((option) => option.id)).size, question.options.length);
        assert.equal(new Set(question.options.map((option) => option.label)).size, question.options.length);
        for (const option of question.options) {
          for (const key of ["id", "label", "feedback"]) text(option[key]);
          assert.ok(option.feedback.length > 20);
          assert.equal(option.correct, undefined, "Answer marker belongs only in the post-submit key");
        }
        assert.equal(question.options.filter((option) => option.id === exercise.correct[question.id]).length, 1);
        if (question.factIndices !== undefined) {
          assert.ok(Array.isArray(question.factIndices) && question.factIndices.length > 0);
          assert.equal(new Set(question.factIndices).size, question.factIndices.length);
          for (const index of question.factIndices) assert.ok(Number.isInteger(index) && index >= 0 && index < exercise.facts.length);
        }
      }
      assert.ok(exercise.sourceUrls.length > 0);
      for (const link of exercise.sourceUrls) {
        const url = new URL(link);
        assert.equal(url.protocol, "https:");
        assert.ok(["www.weather.gov", "weather.metoffice.gov.uk", "cloudatlas.wmo.int", "aviationweather.gov"].includes(url.hostname));
      }
    }
  });
}

test("answer positions vary; the bank contains no scene, randomizer, clock or executable grading dependency", async () => {
  const positions = allCases.flatMap((exercise) => [...exercise.fields, { ...exercise.reason, id: "reason" }]
    .map((question) => question.options.findIndex((option) => option.id === exercise.correct[question.id])));
  for (const position of [0, 1, 2]) assert.ok(positions.includes(position));
  assert.ok(positions.filter((position) => position !== 0).length > positions.length / 2);
  const source = await readFile(new URL("../weather-preview/learning/transfer-cases.mjs", import.meta.url), "utf8");
  assert.doesNotMatch(source, /^\s*import\b|\bActivityScene\b|Math\.random|Date\(|Date\.|\beval\(|\bfetch\(/m);
  for (const exercise of allCases) {
    for (const forbidden of ["input", "state", "scene", "generator", "evaluate", "tolerance", "target"]) {
      assert.equal(exercise[forbidden], undefined);
    }
    const raw = rawText(exercise);
    assert.ok(!raw.includes(exercise.explanation));
    assert.ok(!raw.includes(exercise.hint));
    assert.doesNotMatch(raw, /correct|accretion|belowGround|possible=|agl=null|LCL[≈=]\d/);
  }
});

test("breeze decisions follow new model temperatures rather than time-of-day labels", () => {
  for (const exercise of transferCases.bryza) {
    const input = { hour: number(exercise, "Godzina:"), heating: number(exercise, "Kontrast nagrzewania:") };
    validInputs("breeze", input);
    const result = breeze(input);
    approximate(result.land, number(exercise, "Temperatura lądu:"));
    approximate(result.water, number(exercise, "Temperatura wody:"));
    assert.equal(exercise.correct.surface, result.direction);
    assert.equal(exercise.correct.return, result.direction === "onshore" ? "offshore" : "onshore");
    assert.ok(Math.abs(result.difference) > 0.3 + 0.1, "Rounding cannot cross the calm boundary");
  }
  assert.equal(breeze({ hour: 19, heating: 60 }).night, true);
  assert.equal(transferCases.bryza[1].correct.surface, "onshore");
});

test("cloud cases use the existing LCL/parcel helper and remain categorical under displayed rounding", () => {
  for (const exercise of transferCases.chmura) {
    const input = { temperature: number(exercise, "Temperatura początkowa:"), humidity: number(exercise, "Wilgotność początkowa:") };
    const heights = [number(exercise, "Uniesienie A:"), number(exercise, "Uniesienie B:")];
    const results = heights.map((height) => { validInputs("cloud", { ...input, height }); return cloud({ ...input, height }); });
    assert.equal(exercise.correct.saturation, saturationAnswer(...results.map((result) => result.saturated)));
    const td = number(exercise, "Początkowy punkt rosy:");
    approximate(results[0].dew, td);
    for (const height of heights) assert.ok(Math.abs(height - 125 * (input.temperature - td)) > 125 * 0.05);
    assert.ok(results[1].parcel < results[0].parcel);
    for (const result of results) assert.ok(exercise.explanation.includes(`${Math.round(result.base)} m`));
  }
  assert.equal(transferCases.chmura[0].correct.cooling, "continues");
  assert.equal(transferCases.chmura[1].correct.limit, "unknown");
});

test("fog inputs distinguish rising RH, saturation and an unreachable cooling threshold", () => {
  for (const exercise of transferCases.mgla) {
    const input = { temperature: number(exercise, "Temperatura początkowa:"), humidity: number(exercise, "Wilgotność początkowa:") };
    const coolings = [number(exercise, "Ochłodzenie A:"), number(exercise, "Ochłodzenie B:")];
    const results = coolings.map((cooling) => { validInputs("fog", { ...input, cooling }); return fog({ ...input, cooling }); });
    assert.equal(exercise.correct.saturation, saturationAnswer(...results.map((result) => result.saturated)));
    approximate(results[0].initialDew, number(exercise, "Początkowy punkt rosy:"));
    assert.ok(results.every((result) => result.relative > input.humidity && result.relative <= 100));
    for (const cooling of coolings) assert.ok(Math.abs(cooling - results[0].needed) > 0.05);
    if (exercise.correct.reach) {
      const max = number(exercise, "Maksymalne ochłodzenie:");
      assert.equal(max, LIMITS.fog.cooling[1]);
      assert.ok(results[0].needed > max + 0.05);
      assert.equal(exercise.correct.reach, "outside-range");
      approximate(results[1].relative, 86.8);
    } else {
      assert.equal(exercise.correct.humidity, "increases");
      approximate(results[0].relative, 90.5);
    }
  }
});

test("forced lift keeps saturation separate from parcel/environment temperature", () => {
  for (const exercise of transferCases.front) {
    const height = number(exercise, "Uniesienie:");
    const maximum = number(exercise, "Maksymalne uniesienie modelu:");
    const humidity = number(exercise, "Wilgotność początkowa:");
    const gradient = number(exercise, "Spadek temperatury otoczenia:");
    assert.equal(number(exercise, "Temperatura początkowa:"), 24);
    assert.equal(maximum, 2200);
    assert.ok([80, 25].includes(humidity));
    assert.ok([4, 9].includes(gradient));
    const input = { progress: height / maximum * 100, moisture: humidity === 80 ? "wet" : "dry", stability: gradient === 4 ? "stable" : "unstable" };
    differsFromLesson("front", input);
    const result = forcedLift(input);
    approximate(result.height, height, 0);
    approximate(result.dew, number(exercise, "Początkowy punkt rosy:"));
    assert.equal(exercise.correct.parcel, result.parcel < result.temperatureEnvironment ? "colder" : "warmer");
    assert.equal(exercise.correct.saturation, result.saturated ? "saturated" : result.base > maximum ? "above-range" : "unsaturated");
    assert.equal(result.buoyant, false);
    assert.ok(exercise.explanation.includes(`${Math.round(result.base)} m`));
    if (input.moisture === "dry") assert.ok(result.base > maximum && result.base < 3000);
  }
});

test("wind cases reverse raw drift independently for each layer without inventing speed", () => {
  const [single, pair] = transferCases.wiatr;
  const direction = number(single, "Ruch chmury w kierunku:");
  differsFromLesson("wiatr", { direction, layers: "one" });
  assert.equal(single.correct.from, String(windFromCloudMotion(direction).from));
  assert.equal(single.correct.speed, "unknown");
  const lower = number(pair, "Ruch dolnej chmury w kierunku:");
  const upper = number(pair, "Ruch górnej chmury w kierunku:");
  differsFromLesson("wiatr", { direction: lower, upper, layers: "two" });
  assert.equal(pair.correct.lower, String(windFromCloudMotion(lower).from));
  assert.equal(pair.correct.upper, String(windFromCloudMotion(upper).from));
  assert.notEqual(pair.correct.lower, pair.correct.upper);
  assert.equal(pair.correct.inference, "directional-shear");
});

test("METAR distinguishes base/ceiling and TAF uses day-8 exclusive time windows", () => {
  const [a, b] = transferCases.metar;
  const first = skyReport({ cover: "FEW", base: 15 });
  const second = skyReport({ cover: "OVC", base: 35 });
  assert.equal(a.facts[0], first.report);
  assert.equal(b.facts[0], second.report);
  assert.equal(a.correct.base, String(first.base));
  assert.equal(first.decoded.ceiling.height, 6000);
  assert.equal(a.correct.ceiling, "BKN060");
  assert.equal(second.base, second.decoded.ceiling.height);
  assert.equal(b.correct.layers, `both-${second.base}`);
  assert.equal(b.correct.above, "unknown");
  for (const exercise of [a, b]) {
    assert.equal(exercise.context, "Depesze szkoleniowe, dzień 8 UTC; wysokości AGL. METAR: obserwacja, TAF: prognoza.");
    assert.equal(exercise.facts[1], tafExample);
    assert.deepEqual(fieldById(exercise, "time").factIndices, [1, 2, 3]);
    for (const field of exercise.fields.filter((field) => field.id !== "time")) {
      assert.deepEqual(field.factIndices, [0]);
      assert.deepEqual(shownFacts(exercise, field.id), [exercise.facts[0]]);
    }
    assert.equal(shownFacts(exercise, "time").some((fact) => fact.startsWith("METAR")), false);
  }
  const times = [a, b].flatMap((exercise) => ["A", "B"].map((label) => number(exercise, `Odczyt TAF ${label}: dzień 8, `)));
  assert.deepEqual(times, [15, 16, 17, 18]);
  assert.deepEqual(times.map((hour) => tafAt(hour).valid), [true, true, true, false]);
  assert.ok(times.every((hour) => tafAt(hour).temporary === null));
  assert.match(tafAt(times[0]).base, /SCT020 BKN060/);
  for (const hour of times.slice(1, 3)) assert.match(tafAt(hour).base, /SCT030/);
  assert.equal(a.correct.time, "base-fm");
  assert.equal(b.correct.time, "fm-end");
  differsFromLesson("metar", { cover: "FEW", base: 15 });
  differsFromLesson("metar", { cover: "OVC", base: 35 });
});

test("height cases retain MSL and reject a below-ground atmospheric level", () => {
  for (const exercise of transferCases.wysokosc) {
    const input = { terrain: number(exercise, "Wysokość terenu:") };
    differsFromLesson("wysokosc", input);
    const result = heightReference(input);
    assert.equal(number(exercise, "Poziom odniesienia:"), result.msl);
    if (!result.belowGround) {
      assert.equal(exercise.correct.agl, String(result.agl));
      assert.equal(exercise.correct.reference, "fixed");
    } else {
      assert.equal(exercise.correct.position, `below-${result.terrain - result.msl}`);
      assert.equal(exercise.correct.air, "not-air");
      assert.equal(result.agl, null);
    }
  }
});

test("sounding facts are unchanged rows of the existing idealized profile, not new parcel calculations", () => {
  assert.equal(soundingScenarios[0].id, "stratus-inversion");
  const [a, b] = transferCases.sondaz;
  const first = [1, 3].map(selectedSounding);
  const second = [4, 5].map(selectedSounding);
  assert.deepEqual(a.facts, first.map((row, index) => `Poziom ${index ? "B" : "A"}: ${row.pressure} hPa; T = ${polish(row.temperature)}°C; Td = ${polish(row.dewpoint)}°C`));
  assert.deepEqual(b.facts.slice(0, 2), second.map((row, index) => `Poziom ${index ? "B" : "A"}: ${row.pressure} hPa; T = ${polish(row.temperature)}°C; Td = ${polish(row.dewpoint)}°C; T porcji = ${polish(row.parcel)}°C; wiatr z ${row.windDirection}° przy ${row.windSpeed} kt`));
  assert.equal(a.correct.warmer, String(first.toSorted((x, y) => y.temperature - x.temperature)[0].pressure));
  assert.equal(a.correct.saturation, String(first.toSorted((x, y) => x.spread - y.spread)[0].pressure));
  assert.equal(selectedSounding(2).temperature, selectedSounding(3).temperature);
  assert.ok(second.every((row) => row.parcel < row.temperature));
  assert.equal(b.correct.parcel, "both-colder");
  assert.ok(second[1].windSpeed > second[0].windSpeed && second[1].windDirection !== second[0].windDirection);
  assert.equal(b.correct.wind, "stronger-turning");
  assert.equal(b.correct.projection, "same-data");
  for (const row of [...first, ...second]) {
    const straight = soundingCoordinates(row.temperature, row.pressure, false);
    const skew = soundingCoordinates(row.temperature, row.pressure, true);
    assert.equal(straight.y, skew.y);
    assert.notEqual(straight.x, skew.x);
  }
  for (const exercise of [a, b]) {
    assert.match(exercise.context, /idealizowanego profilu dydaktycznego/);
    assert.doesNotMatch(rawText(exercise), /stratus-inversion|inwersja|izotermia|odstęp \d/);
  }
});

test("icing preserves the liquid/surface conditions and never grades an arbitrary intensity", () => {
  for (const exercise of transferCases.oblodzenie) {
    assert.ok(exercise.facts.includes("Faza wody: krople ciekłej wody"));
    const input = { temperature: number(exercise, "Temperatura powietrza i powierzchni:"), phase: "liquid", exposure: number(exercise, "Ekspozycja w modelu:") };
    differsFromLesson("oblodzenie", input);
    const result = icingConditions(input);
    assert.equal(exercise.correct.mechanism, result.accretion ? "supported" : "inactive");
    assert.equal(result.amount, result.accretion ? input.exposure / 100 : 0);
    assert.match(exercise.context, /bez lodu/);
    assert.doesNotMatch(rawText(exercise), /przechłodzone|mm\/min|akrecję/);
  }
  assert.equal(transferCases.oblodzenie[0].correct.rate, "unknown");
  assert.equal(transferCases.oblodzenie[1].correct.scope, "limited");
});

test("turbulence has qualitative evidence and no calibrated severity or outcome scene", () => {
  const [a, b] = transferCases.turbulencja;
  assert.ok(a.facts.some((fact) => fact.includes("przeszkodę")));
  assert.ok(a.facts.some((fact) => fact.includes("nierównomiernie ogrzane")));
  assert.equal(number(a, "W obu próbach: wymuszenie"), 45);
  assert.equal(a.correct.response, "mechanical-thermal");
  assert.equal(a.correct.cloud, "not-required");
  assert.ok(b.facts.some((fact) => fact.includes("górny znacznik pokonuje większą odległość")));
  assert.equal(number(b, "Umowne wymuszenie:"), 85);
  assert.equal(b.correct.mechanism, "speed-shear");
  assert.equal(b.correct.intensity, "unknown");
  for (const mechanism of ["mechanical", "thermal"]) differsFromLesson("turbulencja", { mechanism, strength: 45 });
  differsFromLesson("turbulencja", { mechanism: "shear", strength: 85 });
  for (const exercise of [a, b]) assert.doesNotMatch(rawText(exercise), /uskok|mechaniczn|termiczn|shear|silna turbulencja/);
});

test("storm cases distinguish missing moisture from the stage of an existing cell", () => {
  const [a, b] = transferCases.burza;
  const inputs = [a, b].map((exercise) => Object.fromEntries([
    ["moisture", exercise.facts[0].match(/wariant (dry|wet)/)[1]],
    ["stability", exercise.facts[1].match(/wariant (stable|unstable)/)[1]],
    ["trigger", exercise.facts[2].match(/wariant (none|lift)/)[1]],
  ]));
  assert.equal(stormIngredients(inputs[0]).possible, false);
  assert.equal(a.correct.ingredients, "incomplete");
  assert.equal(stormIngredients({ ...inputs[0], moisture: a.correct.change }).possible, true);
  assert.equal(a.correct.change, "wet");
  assert.equal(stormIngredients(inputs[1]).possible, true);
  assert.match(b.facts[3], /stadium zaniku \(2\)/);
  assert.equal(b.correct.flow, "down");
  assert.equal(b.correct.limit, "not-instant");
  differsFromLesson("burza", { ...inputs[0], phase: 0 });
  differsFromLesson("burza", { ...inputs[1], phase: 2 });
  for (const field of b.fields) assert.deepEqual(field.factIndices, [3]);
  for (const exercise of [a, b]) assert.doesNotMatch(rawText(exercise), /brakuje wilgoci|komplet jest|zstępujący|gwarantuje/);
});

test("synthetic cloud names preserve observed precipitation and unknown history without relabelling photos", () => {
  const [a, b] = transferCases.nazwy;
  assert.deepEqual(a.correct, { species: "humilis", feature: "none-observed", origin: "unknown", reason: "observed" });
  assert.deepEqual(b.correct, { species: "congestus", feature: "virga", origin: "unknown", reason: "observed" });
  assert.ok(a.facts.some((fact) => fact.includes("Niewielka rozciągłość pionowa")));
  assert.ok(a.facts.some((fact) => fact.includes("Nie zaobserwowano smug")));
  assert.ok(b.facts.some((fact) => fact.includes("dużej rozciągłości pionowej")));
  assert.ok(b.facts.some((fact) => fact.includes("zanikają przed dotarciem do ziemi")));
  for (const exercise of [a, b]) {
    assert.match(exercise.context, /Syntetyczna obserwacja/);
    assert.ok(exercise.facts.some((fact) => fact.includes("Nie prowadzono obserwacji wcześniejszego rozwoju")));
    assert.doesNotMatch(rawText(exercise), /humilis|congestus|virga|praecipitatio|genitus|mutatus/);
    assert.equal(photos(exercise).length, 0);
    const cu = clouds.find((item) => item.id === "cumulus");
    assert.ok(cu.species.includes(exercise.correct.species));
    if (exercise.correct.feature !== "none-observed") assert.ok(cu.features.includes(exercise.correct.feature));
  }
});

test("six authentic photographs retain attribution and licensing but expose only neutral filenames and alt", () => {
  assert.equal(allPhotos.length, 6);
  assert.equal(new Set(allPhotos.map((image) => image.src)).size, 6);
  const tutorialSources = new Set(clouds.map((item) => item.images[0].page));
  const diagnostic = /cirrus|cumulus|stratus|nebulosus|uncinus|mediocris|włókn|smug|kopuł|wał|halo|zasłon|warstw|podstaw/i;
  for (const exercise of allCases) {
    assert.ok(!(exercise.image && exercise.images));
    if (exercise.images) assert.deepEqual(exercise.images.map((image) => image.label), ["A", "B"]);
    for (const image of photos(exercise)) {
      for (const key of ["src", "alt", "credit", "license", "licenseUrl", "sourceUrl", "accessibleDescription"]) text(image[key]);
      const original = originalPhotos.get(image.sourceUrl);
      assert.ok(original, `${image.src}: missing provenance`);
      assert.equal(image.credit, original.author);
      assert.equal(image.license.toLowerCase(), original.license.toLowerCase());
      assert.equal(new URL(image.licenseUrl).hostname, "creativecommons.org");
      const expectedLicense = image.license.startsWith("CC BY-SA")
        ? `https://creativecommons.org/licenses/by-sa/${image.license.split(" ").at(-1)}/`
        : "https://creativecommons.org/publicdomain/mark/1.0/";
      assert.equal(image.licenseUrl, expectedLicense);
      assert.match(image.src, /^\.\/photos\/transfer-\d{2}\.jpg$/);
      assert.doesNotMatch(image.alt, diagnostic);
      assert.doesNotMatch(image.src, diagnostic);
      assert.ok(!rawText(exercise).includes(image.sourceUrl));
      assert.ok(!rawText(exercise).includes(image.accessibleDescription));
      assert.ok(!tutorialSources.has(image.sourceUrl));
      assert.ok(!original.src.includes("stratocumulus-jastrzebie"));
    }
  }
  assert.deepEqual(transferCases.obserwacja.map((exercise) => exercise.correct.structure), ["fibres", "domes"]);
  assert.ok(transferCases.obserwacja.every((exercise) => exercise.correct.height === "unmeasured"));
  assert.deepEqual(transferCases.rodziny.map((exercise) => exercise.correct.pair), ["cs-ci", "st-sc"]);
  const genera = new Map(clouds.flatMap((item) => item.images.map((image) => [image.page, item.id])));
  assert.deepEqual(transferCases.rodziny.map((exercise) => exercise.images.map((image) => genera.get(image.sourceUrl))),
    [["cirrostratus", "cirrus"], ["stratus", "stratocumulus"]]);
});

test("Vite packs exact original bytes at neutral aliases in the actual output directory", async (t) => {
  const destination = await mkdtemp(resolve(tmpdir(), "chmurnik-transfer-photos-"));
  t.after(() => rm(destination, { recursive: true, force: true }));
  const plugin = previewConfig.plugins.find((plugin) => plugin.name === "weather-preview-brand");
  assert.equal(typeof plugin.writeBundle, "function");
  await plugin.writeBundle({ dir: destination });
  for (const image of allPhotos) {
    const original = originalPhotos.get(image.sourceUrl);
    const actual = await readFile(resolve(destination, image.src));
    const expected = await readFile(new URL(`../public/${original.src}`, import.meta.url));
    assert.deepEqual(actual, expected, `${image.src}: photograph must not be replaced or altered`);
  }
  await access(resolve(destination, "wordmark.png"));
  await access(resolve(destination, "photos/observation.jpg"));
  for (const item of clouds) await access(resolve(destination, "photos", item.images[0].src.split("/").at(-1)));
});
