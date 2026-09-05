import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { fieldQuestions, fieldPrinciples, pairDiscriminators } from "../src/data/field-guide.js";
import { comparisonDimensions, comparisonPresets } from "../src/data/comparison.js";
import { learningModules, quizQuestions } from "../src/data/learning.js";

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
  assert.ok(text.includes("Szczegółowe lekcje, dziennik"));
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
