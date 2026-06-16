import assert from "node:assert/strict";
import test from "node:test";
import { clouds } from "../src/data/clouds.js";
import {
  cloudProfiles,
  taxonomyCategories,
  taxonomyTerms,
} from "../src/data/encyclopedia.js";
import { fieldQuestions } from "../src/data/field-guide.js";
import { learningModules } from "../src/data/learning.js";
import { sources } from "../src/data/sources.js";
import { calculatePlacement } from "../src/lib/placement.js";
import {
  createRecognitionQuestion,
  recognitionWeight,
  selectRecognitionCloud,
  updateRecognitionStats,
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
