import test from "node:test";
import assert from "node:assert/strict";
import { readFile, access } from "node:fs/promises";
import { activities, lessonStateAt, lessonStepComplete, sources } from "../weather-preview/learning/catalog.mjs";
import { skyReport, tafAt, forcedLift, icingConditions, heightReference, selectedSounding,
  stormIngredients, windFromCloudMotion, soundingCoordinates } from "../weather-preview/learning/science.mjs";
import { weatherLessonLinks } from "../src/lib/weather-lesson-links.js";
import { returnLesson, sceneHashes } from "../weather-preview/tutorial.mjs";
import { clouds } from "../src/data/clouds.js";

for (const [id, activity] of Object.entries(activities)) test(`learning guide ${id}: every step has an achievable action, explanation and four-answer check`, () => {
  assert.ok(activity.steps.length >= 3);
  for (let i = 0; i < activity.steps.length; i++) {
    const step = activity.steps[i], control = activity.controls.find(c => c.key === step.key);
    assert.ok(control, `${id}: missing control for ${step.key}`);
    assert.ok(step.expect.length > 35 && step.explanation.length > 60);
    const before = lessonStateAt(id, i);
    assert.equal(lessonStepComplete(id, i, before), false);
    assert.equal(lessonStepComplete(id, i, { ...before, [step.key]: step.target }), true);
    if (control.options) assert.ok(control.options.some(([value]) => value === step.target));
    else { assert.ok(step.target >= control.min && step.target <= control.max); assert.equal((step.target - control.min) % control.step, 0); }
  }
  assert.equal(activity.check.options.length, 4);
  assert.equal(new Set(activity.check.options).size, 4);
  assert.ok(activity.check.correct >= 0 && activity.check.correct < 4);
  for (const key of activity.sources) assert.match(sources[key][1], /^https:\/\//);
});

test("all nine full lessons reach all 14 reciprocal workshops on bundled root, Pages and native paths", () => {
  const ids = ["obserwacja", "rodziny", "procesy", "fronty", "wiatr", "lotnictwo", "warstwy", "zagrozenia", "ekspert"];
  for (const [base, root] of [["/chmurnik/", "https://jakiesluchawki.github.io/chmurnik/"],
    ["/", "https://chmurnik.cloud/"], ["/", "capacitor://localhost/"]]) {
    const reached = new Set();
    for (const lesson of ids) {
      const links = weatherLessonLinks(lesson, base);
      assert.ok(links.length);
      for (const link of links) {
        const url = new URL(link.href, root);
        assert.equal(url.protocol, new URL(root).protocol);
        assert.equal(url.host, new URL(root).host);
        assert.equal(url.pathname, `${base}pogoda-preview/index.html`);
        const scene = url.hash.slice(1); reached.add(scene);
        assert.ok(Object.hasOwn(activities, scene) || Object.values(sceneHashes).includes(scene));
        assert.equal(returnLesson(url.search, "none"), lesson);
        const back = new URL(`#/learn/${returnLesson(url.search, "none")}`, new URL("../", url));
        assert.equal(back.href, `${root}#/learn/${lesson}`);
      }
    }
    assert.equal(reached.size, 14);
    assert.deepEqual(weatherLessonLinks("constructor", base), []);
  }
});

test("METAR lower cover changes ceiling, not height; codes agree with existing decoder", () => {
  for (const cover of ["FEW", "SCT", "BKN", "OVC"]) for (const base of [5, 10, 20, 45]) {
    const result = skyReport({ cover, base });
    assert.equal(result.base, base * 100);
    assert.equal(result.decoded.ceiling.height, result.ceiling);
    assert.equal(result.ceiling, ["BKN", "OVC"].includes(cover) ? base * 100 : 6000);
    assert.equal(result.groups.includes("BKN060"), cover !== "OVC");
  }
  assert.match(skyReport({ cover: "BKN", base: 10 }).groups, /^BKN010/);
});
test("TAF validity, TEMPO and FM use distinct windows with exclusive ends", () => {
  assert.equal(tafAt(12).temporary, null);
  assert.match(tafAt(13).temporary, /TEMPO/); assert.match(tafAt(14).temporary, /4000/);
  assert.equal(tafAt(15).temporary, null);
  assert.match(tafAt(16).base, /SCT030/);
  assert.equal(tafAt(18).valid, false);
});
test("forced lift separates moisture from buoyancy and fades only after saturation", () => {
  const wet = forcedLift({ progress: 70, moisture: "wet", stability: "stable" });
  const dry = forcedLift({ progress: 70, moisture: "dry", stability: "stable" });
  const unstable = forcedLift({ progress: 70, moisture: "wet", stability: "unstable" });
  assert.equal(wet.height, dry.height); assert.ok(wet.opacity > 0); assert.equal(dry.opacity, 0);
  assert.equal(wet.buoyant, false); assert.equal(unstable.buoyant, true);
  assert.equal(wet.parcel, unstable.parcel);
  const start = forcedLift({ progress: 0, moisture: "wet", stability: "stable" });
  const around = forcedLift({ progress: (start.base + 1) / 22, moisture: "wet", stability: "stable" });
  assert.ok(around.opacity > 0 && around.opacity < .01);
});
test("icing example requires cold surface, liquid droplets and exposure", () => {
  assert.equal(icingConditions({ temperature: -10, phase: "dry", exposure: 100 }).amount, 0);
  assert.equal(icingConditions({ temperature: -10, phase: "ice", exposure: 100 }).amount, 0);
  assert.equal(icingConditions({ temperature: 5, phase: "liquid", exposure: 100 }).amount, 0);
  assert.equal(icingConditions({ temperature: -10, phase: "liquid", exposure: 0 }).amount, 0);
  assert.equal(icingConditions({ temperature: -10, phase: "liquid", exposure: 50 }).amount, .5);
});
test("height references reject a below-ground atmospheric level", () => {
  assert.equal(heightReference({ terrain: 1300 }).agl, 200);
  assert.equal(heightReference({ terrain: 1800 }).agl, null);
  assert.equal(heightReference({ terrain: 1500 }).agl, 0);
});
test("sounding readings remain identical when projection is skewed", () => {
  const level = selectedSounding(2);
  assert.equal(level.pressure, 925); assert.equal(level.temperature, 9);
  assert.equal(level.dewpoint, 7); assert.equal(level.parcel, 1);
  for (let i = 0; i < 9; i++) {
    const row = selectedSounding(i);
    const a = soundingCoordinates(row.temperature, row.pressure, false), b = soundingCoordinates(row.temperature, row.pressure, true);
    assert.equal(a.y, b.y);
    assert.ok(a.x <= b.x);
    assert.ok(b.x < 410 && b.y >= 48 && b.y <= 344);
  }
});
test("all three storm ingredients are necessary in this teaching example, not a probability", () => {
  for (const moisture of ["dry", "wet"]) for (const stability of ["stable", "unstable"]) for (const trigger of ["none", "lift"]) {
    const result = stormIngredients({ moisture, stability, trigger });
    assert.equal(result.possible, moisture === "wet" && stability === "unstable" && trigger === "lift");
    assert.equal(result.probability, undefined);
  }
  assert.equal(windFromCloudMotion(90).from, 270); assert.equal(windFromCloudMotion(225).from, 45);
});
test("real cloud photos have source and licensing metadata and exist locally", async () => {
  for (const cloud of clouds) {
    const image = cloud.images[0];
    assert.ok(image.author && image.license && image.page && image.diagnostic);
    await access(new URL(`../public/${image.src}`, import.meta.url));
  }
});
test("observation hides name, image description and source link until explicit reveal", async () => {
  const source = await readFile(new URL("../weather-preview/learning/Scenes.jsx", import.meta.url), "utf8");
  assert.match(source, /state.reveal !== "shown"/);
  assert.match(source, /alt=\{hidden \?/);
  assert.match(source, /!hidden &&/);
  assert.match(source, /hidden \? <>/);
  assert.match(source, /photos\/observation.jpg/);
});
test("new controls reuse the centered native slider, guide gates and reduced motion", async () => {
  const source = await readFile(new URL("../weather-preview/learning/LearningStudio.jsx", import.meta.url), "utf8");
  assert.match(source, /import \{ Slider \} from "\.\.\/Slider.jsx"/);
  assert.match(source, /if \(!complete\) return/);
  assert.match(source, /disabled=\{answer === null\}/);
  assert.match(source, /disabled=\{checked\}/);
  assert.match(source, /prefers-reduced-motion/);
  assert.match(source, /visibilitychange/);
});
