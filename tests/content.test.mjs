import assert from "node:assert/strict";
import test from "node:test";
import { clouds } from "../src/data/clouds.js";
import {
  comparisonDimensions,
  comparisonPresets,
  defaultComparisonIds,
} from "../src/data/comparison.js";
import {
  cloudProfiles,
  taxonomyCategories,
  taxonomyTerms,
} from "../src/data/encyclopedia.js";
import { fieldQuestions, pairDiscriminators } from "../src/data/field-guide.js";
import {
  hardCases,
  learningModules,
  lessonPractices,
  moduleChecks,
} from "../src/data/learning.js";
import { lessonMinutes, lessons } from "../src/data/lessons.js";
import { sources } from "../src/data/sources.js";
import { calculatePlacement } from "../src/lib/placement.js";
import {
  createRecognitionQuestion,
  recognitionMastery,
  recognitionWeight,
  selectRecognitionCloud,
  updateRecognitionStats,
  weakestRecognitionCloud,
} from "../src/lib/recognition.js";
import {
  degreesToCompass,
  normalizeDegrees,
  windFromCloudMotion,
} from "../src/lib/wind.js";

test("the atlas contains exactly the ten WMO cloud genera", () => {
  assert.equal(clouds.length, 10);
  assert.deepEqual(
    clouds.map((cloud) => cloud.name).sort(),
    [
      "Altocumulus",
      "Altostratus",
      "Cirrocumulus",
      "Cirrostratus",
      "Cirrus",
      "Cumulonimbus",
      "Cumulus",
      "Nimbostratus",
      "Stratocumulus",
      "Stratus",
    ],
  );
});

test("each cloud record exposes evidence, taxonomy, sources and image provenance", () => {
  for (const cloud of clouds) {
    assert.ok(cloud.observe.length >= 3, `${cloud.name} needs observable evidence`);
    assert.ok(Array.isArray(cloud.species));
    assert.ok(Array.isArray(cloud.varieties));
    assert.ok(Array.isArray(cloud.features));
    assert.ok(Array.isArray(cloud.accessoryClouds));
    assert.ok(cloud.sourceIds.includes("wmoAtlas"));
    assert.match(cloud.image.page, /^https:\/\/commons\.wikimedia\.org\//);
    assert.ok(cloud.image.license);
    assert.doesNotMatch(cloud.image.src, /^\//, `${cloud.name} must respect the Vite base path`);
  }
});

test("the encyclopedia exposes the complete formal term inventory", () => {
  assert.equal(taxonomyTerms.length, 49);
  assert.deepEqual(
    Object.fromEntries(taxonomyCategories.map((category) => [category.id, category.count])),
    {
      species: 15,
      varieties: 9,
      features: 11,
      accessory: 4,
      mother: 2,
      special: 5,
      upper: 3,
    },
  );

  for (const category of taxonomyCategories) {
    assert.equal(
      taxonomyTerms.filter((term) => term.category === category.id).length,
      category.count,
      `${category.label} count must match the published index`,
    );
  }
});

test("all fifteen WMO species are present exactly once", () => {
  assert.deepEqual(
    taxonomyTerms
      .filter((term) => term.category === "species")
      .map((term) => term.id)
      .sort(),
    [
      "calvus",
      "capillatus",
      "castellanus",
      "congestus",
      "fibratus",
      "floccus",
      "fractus",
      "humilis",
      "lenticularis",
      "mediocris",
      "nebulosus",
      "spissatus",
      "stratiformis",
      "uncinus",
      "volutus",
    ],
  );
});

test("taxonomy relationships resolve to known terms, genera and sources", () => {
  const cloudIds = new Set(clouds.map((cloud) => cloud.id));
  const terms = new Map(taxonomyTerms.map((term) => [term.id, term]));
  const categoryByField = {
    species: "species",
    varieties: "varieties",
    features: "features",
    accessoryClouds: "accessory",
  };

  for (const term of taxonomyTerms) {
    assert.ok(term.definition.length >= 70, `${term.id} needs a substantive definition`);
    assert.ok(term.diagnostic.length >= 45, `${term.id} needs diagnostic guidance`);
    assert.ok(term.sourceIds.length > 0, `${term.id} needs an authoritative source`);
    for (const sourceId of term.sourceIds) assert.ok(sources[sourceId], `${term.id} references ${sourceId}`);
    for (const genusId of term.genera) assert.ok(cloudIds.has(genusId), `${term.id} references ${genusId}`);
  }

  for (const cloud of clouds) {
    for (const [field, category] of Object.entries(categoryByField)) {
      for (const termId of cloud[field]) {
        assert.equal(terms.get(termId)?.category, category, `${cloud.id}.${field} references ${termId}`);
        assert.ok(terms.get(termId).genera.includes(cloud.id), `${termId} must link back to ${cloud.id}`);
      }
    }
  }
});

test("every genus has a professional reference profile explaining formation", () => {
  assert.deepEqual(Object.keys(cloudProfiles).sort(), clouds.map((cloud) => cloud.id).sort());

  for (const cloud of clouds) {
    const profile = cloudProfiles[cloud.id];
    assert.ok(profile.essence.length >= 100, `${cloud.name} needs an encyclopedic overview`);
    assert.ok(profile.composition.length >= 80, `${cloud.name} needs microphysics`);
    assert.ok(profile.formation.length >= 3, `${cloud.name} needs formation mechanisms`);
    assert.ok(profile.weather.length >= 2, `${cloud.name} needs weather interpretation`);
    assert.ok(profile.aviation.length >= 2, `${cloud.name} needs aviation significance`);
    assert.ok(profile.evolution.length >= 2, `${cloud.name} needs evolution pathways`);
    assert.ok(profile.lookAlikes.length >= 2, `${cloud.name} needs differential diagnosis`);
    assert.ok(profile.fieldChecklist.length >= 3, `${cloud.name} needs a field protocol`);
  }
});

test("the learning path includes wind interpretation as a full module", () => {
  const wind = learningModules.find((module) => module.id === "wiatr");
  assert.ok(wind);
  assert.ok(wind.outcomes.includes("dryf chmur"));
  assert.ok(wind.outcomes.includes("uskok"));
  assert.ok(wind.sourceIds.includes("faaWeather"));
});

test("every advertised lesson has honest timing and substantive teaching material", () => {
  assert.deepEqual(Object.keys(lessons).sort(), learningModules.map((module) => module.id).sort());
  assert.deepEqual(Object.keys(lessonPractices).sort(), learningModules.map((module) => module.id).sort());
  assert.deepEqual(Object.keys(moduleChecks).sort(), learningModules.map((module) => module.id).sort());

  for (const module of learningModules) {
    const lesson = lessons[module.id];
    const practice = lessonPractices[module.id];
    const check = moduleChecks[module.id];
    const prose = lesson.chapters
      .flatMap((chapter) => [
        ...chapter.paragraphs,
        chapter.checkpoint.prompt,
        chapter.checkpoint.answer,
      ])
      .join(" ");
    const wordCount = prose.trim().split(/\s+/).length;
    const readingMinutes = lesson.timePlan
      .find((item) => item.label.startsWith("Czytanie"))
      .minutes;
    const chapterMinutes = lesson.chapters
      .reduce((sum, chapter) => sum + chapter.minutes, 0);
    const wordsPerMinute = wordCount / readingMinutes;

    assert.equal(lessonMinutes(lesson), module.minutes, `${module.id} timing must match its label`);
    assert.equal(chapterMinutes, readingMinutes, `${module.id} chapter timing must match reading time`);
    assert.ok(
      wordsPerMinute >= 45 && wordsPerMinute <= 100,
      `${module.id} reading allocation must be credible`,
    );
    assert.ok(lesson.objectives.length >= 4, `${module.id} needs explicit outcomes`);
    assert.ok(lesson.chapters.length >= 4, `${module.id} needs a real chapter structure`);
    assert.ok(prose.length >= 1800, `${module.id} needs substantive explanatory prose`);
    assert.ok(lesson.recap.length >= 4, `${module.id} needs a useful recap`);
    assert.equal(practice.steps.length, 3, `${module.id} needs a structured practice`);
    assert.equal(check.options.length, 4, `${module.id} check needs four choices`);
    assert.equal(new Set(check.options).size, 4, `${module.id} check choices must be unique`);
    assert.ok(check.explanation.length >= 80, `${module.id} check needs reasoning`);

    for (const chapter of lesson.chapters) {
      assert.ok(chapter.paragraphs.length >= 2, `${module.id}.${chapter.number} needs depth`);
      assert.ok(chapter.sourceIds.length > 0, `${module.id}.${chapter.number} needs sources`);
      assert.ok(
        chapter.checkpoint.prompt.length >= 30,
        `${module.id}.${chapter.number} needs an active-recall prompt`,
      );
      assert.ok(
        chapter.checkpoint.answer.length >= 70,
        `${module.id}.${chapter.number} needs an explanatory recall answer`,
      );
      for (const sourceId of chapter.sourceIds) {
        assert.ok(sources[sourceId], `${module.id}.${chapter.number} references ${sourceId}`);
      }
    }
  }
});

test("recognition questions always contain four unique plausible choices", () => {
  for (const cloud of clouds) {
    const question = createRecognitionQuestion(cloud.id, () => 0.42);
    assert.equal(question.choices.length, 4);
    assert.equal(new Set(question.choices).size, 4);
    assert.ok(question.choices.includes(cloud.id));
    for (const choice of question.choices) {
      assert.ok(clouds.some((candidate) => candidate.id === choice));
    }
  }
});

test("recognition practice increases priority after an error", () => {
  const initial = {};
  const afterError = updateRecognitionStats(initial, "cirrus", false);
  const afterSuccess = updateRecognitionStats(initial, "cumulus", true);

  assert.ok(recognitionWeight(afterError.cirrus) > recognitionWeight(afterSuccess.cumulus));
  assert.equal(
    selectRecognitionCloud(["cirrus", "cumulus"], afterError, null, () => 0),
    "cirrus",
  );
});

test("recognition mastery exposes weak genera instead of a single opaque score", () => {
  const cloudIds = ["cirrus", "cumulus", "stratus"];
  const stats = {
    cirrus: { correct: 1, wrong: 3 },
    cumulus: { correct: 4, wrong: 0 },
  };
  const mastery = recognitionMastery(cloudIds, stats);

  assert.equal(mastery.find((item) => item.cloudId === "cirrus").state, "focus");
  assert.equal(mastery.find((item) => item.cloudId === "cumulus").state, "steady");
  assert.equal(mastery.find((item) => item.cloudId === "stratus").state, "new");
  assert.equal(weakestRecognitionCloud(cloudIds, stats), "cirrus");
});

test("wind interpretation reverses cloud motion and normalizes bearings", () => {
  assert.equal(normalizeDegrees(-45), 315);
  assert.equal(degreesToCompass(359), "N");
  assert.deepEqual(windFromCloudMotion(45), {
    toward: 45,
    from: 225,
    towardLabel: "NE",
    fromLabel: "SW",
  });
  assert.deepEqual(windFromCloudMotion(270), {
    toward: 270,
    from: 90,
    towardLabel: "W",
    fromLabel: "E",
  });
});

test("placement routes beginners, intermediate learners and experienced users differently", () => {
  assert.equal(calculatePlacement([0, 0, 0, 0, 0]).moduleId, "obserwacja");
  assert.equal(calculatePlacement([1, 1, 1, 1, 1]).moduleId, "procesy");
  assert.equal(calculatePlacement([2, 2, 2, 2, 2]).moduleId, "lotnictwo");
});

test("the field assistant covers five evidence classes with valid cloud weights", () => {
  const cloudIds = new Set(clouds.map((cloud) => cloud.id));

  assert.deepEqual(
    fieldQuestions.map((question) => question.id),
    ["shape", "scale", "light", "precipitation", "evolution"],
  );

  for (const question of fieldQuestions) {
    assert.ok(question.options.length >= 5, `${question.id} needs meaningful alternatives`);
    for (const option of question.options) {
      assert.ok(option.label.length > 5);
      assert.ok(option.description.length > 20);
      assert.ok(option.signal.length > 15);
      for (const cloudId of Object.keys(option.weights)) {
        assert.ok(cloudIds.has(cloudId), `${question.id}.${option.id} references ${cloudId}`);
      }
    }
  }
});

test("the comparison laboratory covers every genus with evidence-led presets", () => {
  const cloudIds = new Set(clouds.map((cloud) => cloud.id));
  const covered = new Set();
  const pairKeys = new Set();

  assert.equal(comparisonDimensions.length, 7);

  for (const preset of comparisonPresets) {
    assert.equal(preset.cloudIds.length, 2);
    assert.ok(preset.title.length > 12);

    const key = [...preset.cloudIds].sort().join("|");
    assert.ok(!pairKeys.has(key), `${preset.id} duplicates ${key}`);
    assert.ok(pairDiscriminators[key], `${preset.id} needs a specific discriminator`);
    pairKeys.add(key);

    for (const cloudId of preset.cloudIds) {
      assert.ok(cloudIds.has(cloudId), `${preset.id} references ${cloudId}`);
      covered.add(cloudId);
    }
  }

  assert.deepEqual([...covered].sort(), [...cloudIds].sort());

  for (const cloud of clouds) {
    const defaults = defaultComparisonIds(cloud.id);
    assert.equal(defaults.length, 2);
    assert.ok(defaults.includes(cloud.id));
  }
});

test("comparison dimensions resolve substantive content for every genus", () => {
  for (const cloud of clouds) {
    const record = { cloud, profile: cloudProfiles[cloud.id] };
    for (const dimension of comparisonDimensions) {
      const values = dimension.value(record);
      assert.ok(Array.isArray(values));
      assert.ok(values.length > 0, `${cloud.id}.${dimension.id} needs content`);
      assert.ok(values.every((value) => value.length >= 15));
      assert.ok(
        values.join(" ").length >= 70,
        `${cloud.id}.${dimension.id} needs substantive comparison content`,
      );
    }
  }
});

test("hard cases expose more disputed boundaries and valid comparison routes", () => {
  const cloudIds = new Set(clouds.map((cloud) => cloud.id));

  assert.ok(hardCases.length >= 8);
  for (const item of hardCases) {
    assert.ok(item.question.length >= 45);
    assert.ok(item.answer.length >= 100);
    assert.ok(Array.isArray(item.cloudIds));
    for (const cloudId of item.cloudIds) {
      assert.ok(cloudIds.has(cloudId), `${item.pair} references ${cloudId}`);
    }
  }
});
