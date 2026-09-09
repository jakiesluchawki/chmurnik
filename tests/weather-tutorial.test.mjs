import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  fog,
  cloud,
  breeze,
  calculate,
  LIMITS,
  cleanInputs,
  readTrials,
  serializeTrials,
} from "../weather-preview/model.mjs";
import {
  guides,
  guideInputsAt,
  guideStepComplete,
  sceneFromHash,
  returnLesson,
  quizCases,
} from "../weather-preview/tutorial.mjs";
import { weatherLessonLinks } from "../src/lib/weather-lesson-links.js";

test("all tutorial steps require one real change and reconstruct earlier conditions", () => {
  for (const [scene, guide] of Object.entries(guides)) {
    let input = { ...guide.start };
    for (const [index, step] of guide.steps.entries()) {
      assert.deepEqual(guideInputsAt(scene, index), input);
      assert.equal(guideStepComplete(scene, index, input), false);
      assert.ok(
        step.instruction && step.expect && step.explanation && step.action,
      );
      assert.ok(Object.hasOwn(LIMITS[scene], step.key));
      input[step.key] = step.target;
      assert.deepEqual(cleanInputs(scene, input), input);
      assert.equal(guideStepComplete(scene, index, input), true);
      const other = Object.keys(input).find((key) => key !== step.key);
      assert.equal(
        guideStepComplete(scene, index, {
          ...input,
          [other]: input[other] + 1,
        }),
        false,
      );
    }
    assert.deepEqual(guideInputsAt(scene, guide.steps.length), input);
    assert.equal(guideStepComplete(scene, guide.steps.length, input), false);
  }
});

test("breeze walkthrough teaches temperature contrast, reversal and calm", () => {
  const states = [0, 1, 2, 3].map(
    (i) => breeze(guideInputsAt("breeze", i)).direction,
  );
  assert.deepEqual(states, ["calm", "onshore", "offshore", "calm"]);
});
test("cloud walkthrough does not claim condensation before it occurs", () => {
  const states = [0, 1, 2, 3, 4].map((i) => cloud(guideInputsAt("cloud", i)));
  assert.deepEqual(
    states.map((s) => s.saturated),
    [false, false, true, false, true],
  );
  assert.ok(Math.abs(states[1].parcel - 19.1) < 0.01);
  assert.ok(states[3].aboveScene);
  assert.ok(states[4].base < states[0].base);
});
test("fog walkthrough reaches saturation only after sufficient cooling", () => {
  const states = [0, 1, 2, 3, 4].map((i) => fog(guideInputsAt("fog", i)));
  assert.deepEqual(
    states.map((s) => s.saturated),
    [false, false, true, false, true],
  );
  assert.equal(states[1].current, 15);
  assert.ok(states[1].relative > 70 && states[1].relative < 100);
  assert.ok(Math.abs(states[0].initialDew - 12.44) < 0.05);
  assert.ok(states[4].needed < states[2].needed);
});
test("fog threshold is continuous and supersaturation is removed", () => {
  const input = { temperature: 18, humidity: 70, cooling: 0 };
  const { needed } = fog(input);
  const before = fog({ ...input, cooling: needed - 1e-7 });
  const at = fog({ ...input, cooling: needed });
  const after = fog({ ...input, cooling: needed + 1e-7 });
  assert.equal(before.saturated, false);
  assert.equal(at.saturated, true);
  assert.equal(after.saturated, true);
  assert.ok(Math.abs(before.relative - 100) < 1e-5);
  assert.equal(after.relative, 100);
  assert.equal(after.dew, after.current);
});
test("fog model stays finite and monotonic over all UI inputs", () => {
  for (let temperature = 15; temperature <= 30; temperature++)
    for (let humidity = 40; humidity <= 95; humidity += 5) {
      let previous = 0;
      for (let cooling = 0; cooling <= 10; cooling += 0.5) {
        const out = fog({ temperature, humidity, cooling });
        for (const [key, value] of Object.entries(out))
          if (key !== "saturated") assert.ok(Number.isFinite(value));
        assert.ok(out.current >= 5);
        assert.ok(out.dew <= out.current);
        assert.ok(out.relative >= previous && out.relative <= 100);
        assert.ok(out.remaining >= 0);
        previous = out.relative;
      }
    }
});
test("new scene preserves v1 snapshots from earlier experiments", () => {
  const trials = Object.entries(guides).map(([scene, { start }]) => ({
    scene,
    id: scene,
    input: start,
  }));
  assert.deepEqual(readTrials(serializeTrials(trials)), trials);
  assert.deepEqual(calculate("fog", trials[2].input), fog(trials[2].input));
  assert.throws(() => calculate("oops", {}));
});
test("assessment presets differ from tutorial presets and require the intended action", () => {
  for (const [scene, quiz] of Object.entries(quizCases)) {
    assert.notEqual(quiz.start[quiz.key], quiz.target);
    assert.deepEqual(cleanInputs(scene, quiz.start), quiz.start);
  }
  assert.equal(fog({ ...quizCases.fog.start, cooling: 6 }).saturated, true);
});
test("lesson links and return targets are explicit and reciprocal in bundled web and native apps", () => {
  assert.equal(weatherLessonLinks("wiatr", "/chmurnik/").length, 2);
  assert.equal(weatherLessonLinks("procesy", "/chmurnik/").length, 2);
  assert.equal(
    weatherLessonLinks("zagrozenia", "/chmurnik/").find(link => link.href.endsWith("#burza")).title,
    "Sprawdź, co podtrzymuje unoszenie powietrza",
  );
  for (const [base, root] of [["/chmurnik/", "https://jakiesluchawki.github.io/chmurnik/"],
    ["/", "https://chmurnik.cloud/"], ["/", "capacitor://localhost/"]]) {
    assert.equal(weatherLessonLinks("zagrozenia", base).length, 3);
    for (const lesson of ["wiatr", "procesy"]) {
      const links = weatherLessonLinks(lesson, base);
      assert.equal(links.length, 2);
      for (const link of links) {
        const url = new URL(link.href, root);
        assert.equal(url.protocol, new URL(root).protocol);
        assert.equal(url.host, new URL(root).host);
        assert.equal(url.pathname, `${base}pogoda-preview/index.html`);
        assert.ok(guides[sceneFromHash(url.hash)]);
        assert.equal(returnLesson(url.search, "other"), lesson);
      }
    }
    assert.deepEqual(weatherLessonLinks("__proto__", base), []);
  }
  for (const base of ["https://evil.test/", "//evil.test/", "/../"]) assert.deepEqual(weatherLessonLinks("wiatr", base), []);
  assert.equal(returnLesson("?from=https://evil.test", "procesy"), "procesy");
  assert.equal(sceneFromHash("#mgla"), "fog");
  assert.equal(sceneFromHash("#unknown"), "breeze");
});
test("runtime exposes local workshop links and every production build stages their bundle", async () => {
  const source = await readFile(
    new URL("../src/App.jsx", import.meta.url),
    "utf8",
  );
  const pkg = JSON.parse(
    await readFile(new URL("../package.json", import.meta.url), "utf8"),
  );
  assert.doesNotMatch(source, /VITE_WEATHER_PREVIEW/);
  assert.match(
    source,
    /weatherLessonLinks\(selected, import.meta.env.BASE_URL\)/,
  );
  assert.match(source, /const experimentLinks = weatherLessonLinks\(selected, import.meta.env.BASE_URL\)/);
  assert.match(source, /const previewActivities = weatherLessonLinks\(previewLesson, import.meta.env.BASE_URL\)/);
  assert.match(source, /href=\{weatherWorkshopCatalog\(import.meta.env.BASE_URL\)\}/);
  assert.equal(pkg.scripts.prebuild, "npm run weather:bundle");
  assert.equal(pkg.scripts["prebuild:pages"], "npm run weather:bundle");
  assert.match(pkg.scripts["weather:bundle"], /vite build --config weather-preview\/vite.config.mjs --outDir \.\.\/build\/weather-bundle/);
  assert.equal(pkg.scripts["ios:sync"], "npm run build && cap sync ios");
});
