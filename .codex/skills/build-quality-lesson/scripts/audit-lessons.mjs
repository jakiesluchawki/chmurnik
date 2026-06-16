#!/usr/bin/env node

import { pathToFileURL } from "node:url";
import { resolve } from "node:path";

const root = resolve(process.argv[2] || process.cwd());
const importFromRoot = (path) => import(pathToFileURL(resolve(root, path)));

const [{ learningModules, lessonPractices, moduleChecks }, { lessons, lessonMinutes }] =
  await Promise.all([
    importFromRoot("src/data/learning.js"),
    importFromRoot("src/data/lessons.js"),
  ]);

const failures = [];
const fail = (message) => failures.push(message);

for (const module of learningModules) {
  const lesson = lessons[module.id];
  const practice = lessonPractices[module.id];
  const check = moduleChecks[module.id];

  if (!lesson) {
    fail(`${module.id}: missing lesson`);
    continue;
  }

  if (lessonMinutes(lesson) !== module.minutes) {
    fail(`${module.id}: ${lessonMinutes(lesson)} planned minutes != ${module.minutes} advertised`);
  }

  const readingPlan = lesson.timePlan.find((item) => item.label.startsWith("Czytanie"))?.minutes;
  const chapterMinutes = lesson.chapters.reduce((sum, chapter) => sum + chapter.minutes, 0);
  if (readingPlan !== chapterMinutes) {
    fail(`${module.id}: ${chapterMinutes} chapter minutes != ${readingPlan} reading minutes`);
  }

  if (lesson.objectives.length < 4) fail(`${module.id}: fewer than four outcomes`);
  if (lesson.chapters.length < 4) fail(`${module.id}: fewer than four chapters`);
  if (lesson.recap.length < 4) fail(`${module.id}: recap is too short`);

  const proseLength = lesson.chapters
    .flatMap((chapter) => [
      ...chapter.paragraphs,
      chapter.checkpoint?.prompt || "",
      chapter.checkpoint?.answer || "",
    ])
    .join(" ")
    .length;
  if (proseLength < 1800) fail(`${module.id}: explanatory prose is too shallow`);
  const wordCount = lesson.chapters
    .flatMap((chapter) => [
      ...chapter.paragraphs,
      chapter.checkpoint?.prompt || "",
      chapter.checkpoint?.answer || "",
    ])
    .join(" ")
    .trim()
    .split(/\s+/)
    .length;
  const wordsPerMinute = wordCount / readingPlan;
  if (wordsPerMinute < 45 || wordsPerMinute > 100) {
    fail(`${module.id}: ${Math.round(wordsPerMinute)} words per reading minute is not credible`);
  }

  for (const chapter of lesson.chapters) {
    if (chapter.paragraphs.length < 2) {
      fail(`${module.id}.${chapter.number}: fewer than two explanatory paragraphs`);
    }
    if (!chapter.sourceIds?.length) {
      fail(`${module.id}.${chapter.number}: missing source IDs`);
    }
    if (!chapter.checkpoint?.prompt || chapter.checkpoint.prompt.length < 30) {
      fail(`${module.id}.${chapter.number}: missing active-recall prompt`);
    }
    if (!chapter.checkpoint?.answer || chapter.checkpoint.answer.length < 70) {
      fail(`${module.id}.${chapter.number}: active-recall answer is too shallow`);
    }
  }

  if (!practice || practice.steps.length !== 3 || !practice.outcome) {
    fail(`${module.id}: practice needs three steps and a completion condition`);
  }
  if (!check || check.options.length !== 4 || new Set(check.options).size !== 4) {
    fail(`${module.id}: check needs four unique choices`);
  }
  if (!check || check.explanation.length < 80) {
    fail(`${module.id}: check explanation is too short`);
  }
}

if (failures.length) {
  console.error(`Lesson audit failed (${failures.length}):`);
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exitCode = 1;
} else {
  console.log(`Lesson audit passed: ${learningModules.length} modules meet the quality contract.`);
}
