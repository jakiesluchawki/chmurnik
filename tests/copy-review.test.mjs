import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { fieldQuestions, fieldPrinciples, pairDiscriminators } from "../src/data/field-guide.js";
import { comparisonDimensions, comparisonPresets } from "../src/data/comparison.js";
import { learningModules, quizQuestions } from "../src/data/learning.js";
import { weatherLayers, pressureLevels } from "../src/data/weather-layers.js";
import { layersHeadings, windyReadingSteps, windCaveats, hazardCards, soundingReadingSteps } from "../src/data/layers-copy.js";
import { soundingScenarios, soundingGlossary } from "../src/data/soundings.js";
import { savedHypothesisMessage } from "../src/lib/observations.js";
import { clouds } from "../src/data/clouds.js";
import { metarStructurePhases, metarDecodeSections, metarTrainingScenarios, tafTrainingScenarios, aviationBriefingSets } from "../src/data/metar-training.js";

test("the combined copy review retains every observation question and answer, not just edits", async () => {
  const text = await readFile(new URL("../design/copy-v4-review.md", import.meta.url), "utf8");
  for (const question of fieldQuestions) {
    for (const value of [question.eyebrow, question.prompt, question.help]) assert.ok(text.includes(value), value);
    for (const option of question.options) {
      for (const value of [option.label, option.description, option.signal]) assert.ok(text.includes(value), value);
    }
  }
  for (const value of [...fieldPrinciples, ...Object.values(pairDiscriminators)]) assert.ok(text.includes(value), value);
  assert.doesNotMatch(text, /<!-- (FIELD_|COMPARISON_COPY)/);
  assert.ok(text.includes("Szczegółowe lekcje,"));
  assert.ok(text.includes("narzędzi terenowych wymagają jeszcze"));
});

test("the complete learning review retains every card and quiz answer", async () => {
  const text = await readFile(new URL("../design/copy-v4-review.md", import.meta.url), "utf8");
  for (const item of learningModules) {
    for (const value of [item.title, item.summary, ...item.outcomes.slice(0, 3)]) assert.ok(text.includes(value), value);
  }
  for (const item of quizQuestions) {
    for (const value of [item.prompt, ...item.options, item.explanation]) assert.ok(text.includes(value), value);
  }
  assert.doesNotMatch(text, /<!-- LEARNING_/);
  assert.match(text, /nie oceny rozpoznawania w terenie/);
});

test("the layers review retains all eight complete cases and all workspace introductions", async () => {
  const text = await readFile(new URL("../design/copy-v4-review.md", import.meta.url), "utf8");
  for (const values of [...Object.values(layersHeadings), ...windyReadingSteps]) {
    for (const value of values) assert.ok(text.includes(value), value);
  }
  for (const item of weatherLayers) {
    for (const value of [item.label, item.question, item.unit, item.reference, item.trap,
      ...item.compare, item.check.prompt, ...item.check.options, item.check.explanation]) {
      assert.ok(text.includes(value), value);
    }
  }
  for (const level of Object.values(pressureLevels)) assert.ok(text.includes(level.use), level.use);
  assert.doesNotMatch(text, /<!-- (LAYERS_|WINDY_|WEATHER_|PRESSURE_)/);
});

test("the weather-workshop review retains every sounding, full explanation and alternative answer", async () => {
  const text = await readFile(new URL("../design/copy-v4-review.md", import.meta.url), "utf8");
  const values = [
    ...windCaveats.flat(), ...hazardCards.flatMap((item) => [item.title, item.text]),
    ...soundingReadingSteps.flat(), ...soundingGlossary.flatMap((item) => [item.term, item.polish, item.explanation]),
    ...soundingScenarios.flatMap((item) => [item.title, item.short, item.sourceType,
      ...Object.values(item.reading), item.check.prompt, ...item.check.options, item.check.explanation]),
  ];
  for (const value of values) assert.ok(text.includes(value), value);
  assert.match(text, /Nie wyznaczono w profilu/);
  assert.match(text, /nie ocena bezpieczeństwa Twojej trasy/);
  assert.doesNotMatch(text, /<!-- (SOUNDING_|WIND_|HAZARD_)/);
});

test("the collection review retains every saved-result branch and manual name option", async () => {
  const text = await readFile(new URL("../design/copy-v4-review.md", import.meta.url), "utf8");
  for (const cloud of clouds) assert.ok(text.includes(`**${cloud.code}: ${cloud.name}** · ${cloud.polish}`));
  for (const hypothesis of [
    { state: "clear", candidates: [] }, { state: "uncertain", candidates: [] },
    { state: "hypothesis", candidates: [{}] }, { state: "uncertain", candidates: [{}] },
  ]) assert.ok(text.includes(savedHypothesisMessage(hypothesis)));
  assert.match(text, /nie prawdopodobieństwo poprawnego/);
  assert.doesNotMatch(text, /<!-- (COLLECTION_|SAVED_)/);
});

test("the METAR review retains all reports, dictionary examples, timelines and full assessments", async () => {
  const text = await readFile(new URL("../design/copy-v4-review.md", import.meta.url), "utf8");
  const values = [
    ...metarStructurePhases.flatMap((item) => [item.title, item.pattern, item.detail]),
    ...metarDecodeSections.flatMap((item) => [item.title, item.shortLabel, item.purpose, item.syntax, item.watchFor,
      ...item.examples.flatMap((example) => [example.code, example.meaning]), ...Object.values(item.spotlight || {})]),
    ...metarTrainingScenarios.flatMap((item) => [item.report, item.context, ...item.groups.map((group) => group.meaning)]),
    ...tafTrainingScenarios.flatMap((item) => [item.report, item.context, ...item.timeline.flatMap((period) => [period.time, period.label, period.detail])]),
    ...aviationBriefingSets.flatMap((item) => [item.context, item.kicker, ...item.reports.map((report) => report.note)]),
    ...[...metarTrainingScenarios, ...tafTrainingScenarios, ...aviationBriefingSets].flatMap((item) =>
      item.questions.flatMap((question) => [question.prompt, ...question.options, question.explanation])),
  ];
  for (const value of values) assert.ok(text.includes(value), value);
  assert.doesNotMatch(text, /<!-- (METAR_|TAF_|BRIEFING_)/);
});

test("the combined copy review preserves complete comparison introductions and source review sets", async () => {
  const text = await readFile(new URL("../design/copy-v4-review.md", import.meta.url), "utf8");
  for (const item of comparisonPresets) assert.ok(text.includes(item.title), item.title);
  for (const item of comparisonDimensions) {
    assert.ok(text.includes(item.title), item.title);
    assert.ok(text.includes(item.description), item.description);
  }
  for (const name of ["entry", "recognition"]) {
    const source = await readFile(new URL(`../design/copy-v4-${name}-review.md`, import.meta.url), "utf8");
    assert.ok(text.includes(source.trim()), name);
  }
});
