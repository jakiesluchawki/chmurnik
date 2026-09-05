import assert from "node:assert/strict";
import test from "node:test";
import { lessons, lessonMinutes } from "../src/data/lessons.js";
import { learningModules, lessonPractices, moduleChecks } from "../src/data/learning.js";

test("lesson editing preserves the full course and declared active time", () => {
  const expected = { obserwacja: [4, 12], rodziny: [5, 18], procesy: [5, 20], fronty: [5, 22],
    wiatr: [6, 24], lotnictwo: [7, 26], warstwy: [6, 28], zagrozenia: [7, 32], ekspert: [7, 35] };
  assert.deepEqual(Object.keys(lessons).sort(), Object.keys(expected).sort());
  for (const module of learningModules) {
    assert.equal(lessons[module.id].chapters.length, expected[module.id][0]);
    assert.equal(lessonMinutes(lessons[module.id]), expected[module.id][1]);
    assert.equal(module.minutes, expected[module.id][1]);
    assert.equal(moduleChecks[module.id].options.length, 4);
  }
});

test("wind teaching distinguishes the exercise's toward input from WMO's from convention", () => {
  const chapter = lessons.wiatr.chapters[0];
  assert.ok(chapter.sourceIds.includes("wmoCloudMotion"));
  assert.match(chapter.paragraphs.join(" "), /Według konwencji WMO.*skąd/);
  assert.match(chapter.paragraphs.join(" "), /Nie odwracaj ponownie/);
  assert.match(moduleChecks.wiatr.explanation, /nie odwracamy ponownie/);
  assert.match(lessonPractices.wiatr.steps[2], /Nie odwracaj ponownie/);
});

test("practices disclose elapsed observation time and do not promise three model guesses", () => {
  assert.match(lessonPractices.fronty.body, /co najmniej 90 minut czasu kalendarzowego/);
  assert.match(lessonPractices.fronty.body, /aktywną pracę, nie czekanie/);
  assert.doesNotMatch(lessonPractices.obserwacja.outcome, /trzy hipotezy/);
  assert.match(lessonPractices.obserwacja.outcome, /Jeśli odpowiedzi nie wystarczą/);
  assert.match(lessonPractices.lotnictwo.body, /przykładzie szkoleniowym, nie na bieżącej pogodzie/);
});
