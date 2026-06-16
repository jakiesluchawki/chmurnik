import assert from "node:assert/strict";
import { access } from "node:fs/promises";
import test from "node:test";
import { clouds } from "../src/data/clouds.js";
import {
  comparisonDimensions,
  comparisonPresets,
  defaultComparisonIds,
} from "../src/data/comparison.js";
import {
  cloudProfiles,
  getCloudProfile,
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
import {
  aviationBriefingSets,
  metarDecodeSections,
  metarSectionByGroupLabel,
  metarStructurePhases,
  metarTrainingScenarios,
  tafTrainingScenarios,
} from "../src/data/metar-training.js";
import { sources } from "../src/data/sources.js";
import {
  soundingPressureGrid,
  soundingScenarios,
} from "../src/data/soundings.js";
import {
  cloudBands,
  pressureLevels,
  weatherLayers,
} from "../src/data/weather-layers.js";
import {
  aviationReviewPriority,
  aviationReviewQueue,
  aviationReviewSummary,
  chooseDifferentScenario,
  createAviationQuestionBank,
  evaluateTrainingAnswer,
  findReportedCeiling,
  parseSkyGroup,
  updateAviationReview,
} from "../src/lib/metar-training.js";
import {
  evaluateNomenclature,
  getNomenclatureOrigins,
  nomenclatureOptions,
  normalizeNomenclatureSelection,
  specialCloudRules,
} from "../src/lib/nomenclature.js";
import {
  normalizeCloudSearch,
  searchCloudAtlas,
  searchTaxonomyTerms,
} from "../src/lib/cloud-search.js";
import { calculatePlacement } from "../src/lib/placement.js";
import {
  createRecognitionQuestion,
  recognitionMastery,
  recognitionWeight,
  selectRecognitionCloud,
  selectRecognitionImage,
  updateRecognitionStats,
  weakestRecognitionCloud,
} from "../src/lib/recognition.js";
import {
  degreesToCompass,
  normalizeDegrees,
  windFromCloudMotion,
} from "../src/lib/wind.js";
import {
  pressureSurfaceContext,
  weatherLayerReading,
} from "../src/lib/weather-layers.js";
import {
  interpolatePressureAtTemperature,
  pressurePosition,
  soundingPath,
  soundingPoint,
  soundingSummary,
  temperaturePosition,
} from "../src/lib/sounding.js";

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

test("training soundings cover four distinct, internally coherent profiles", () => {
  assert.deepEqual(
    soundingScenarios.map((scenario) => scenario.id),
    [
      "stratus-inversion",
      "capped-warm-sector",
      "deep-convection",
      "elevated-convection",
    ],
  );
  assert.deepEqual(soundingPressureGrid, [1000, 925, 850, 700, 500, 300, 200]);

  for (const scenario of soundingScenarios) {
    assert.match(scenario.sourceType, /Idealizowany profil dydaktyczny/);
    assert.ok(scenario.profile.length >= 9, `${scenario.id} needs a deep column`);
    assert.equal(scenario.check.options.length, 4);
    assert.equal(new Set(scenario.check.options).size, 4);
    assert.ok(scenario.check.correct >= 0 && scenario.check.correct < 4);
    assert.ok(scenario.reading.aviation.length >= 90);
    assert.ok(scenario.reading.uncertainty.length >= 90);

    for (let index = 0; index < scenario.profile.length; index += 1) {
      const level = scenario.profile[index];
      assert.ok(level.temperature >= level.dewpoint, `${scenario.id} has supersaturation`);
      assert.ok(level.windDirection >= 0 && level.windDirection < 360);
      assert.ok(level.windSpeed >= 0);
      if (index > 0) {
        assert.ok(
          scenario.profile[index - 1].pressure > level.pressure,
          `${scenario.id} pressure levels must rise monotonically`,
        );
      }
    }

    for (const layer of scenario.cloudLayers) {
      assert.ok(layer.bottom > layer.top, `${scenario.id} cloud layer must have depth`);
    }

    if (scenario.levels.lfc && scenario.levels.el) {
      assert.ok(scenario.levels.lcl > scenario.levels.lfc);
      assert.ok(scenario.levels.lfc > scenario.levels.el);
    }

    const computedFreezing = interpolatePressureAtTemperature(scenario.profile);
    assert.ok(
      Math.abs(computedFreezing - scenario.levels.freezing) <= 35,
      `${scenario.id} freezing annotation must agree with its temperature trace`,
    );
  }

  assert.equal(
    soundingScenarios.find((scenario) => scenario.id === "stratus-inversion").levels.lfc,
    null,
  );
  assert.equal(
    soundingScenarios.find((scenario) => scenario.id === "elevated-convection")
      .profile.filter((level) => level.parcel === null).length,
    3,
  );
});

test("the sounding projection uses log pressure and visibly skewed isotherms", () => {
  assert.equal(pressurePosition(1000), 1);
  assert.equal(pressurePosition(200), 0);
  assert.ok(pressurePosition(500) > 0.5 && pressurePosition(500) < 0.6);
  assert.ok(temperaturePosition(0, 200) > temperaturePosition(0, 1000));

  const scenario = soundingScenarios[2];
  for (const level of scenario.profile) {
    const temperature = soundingPoint(level.temperature, level.pressure);
    const dewpoint = soundingPoint(level.dewpoint, level.pressure);
    assert.ok(temperature.x >= dewpoint.x);
    assert.equal(temperature.y, dewpoint.y);
  }

  const path = soundingPath(scenario.profile, "temperature");
  assert.match(path, /^M /);
  assert.equal((path.match(/[ML] /g) || []).length, scenario.profile.length);

  const summary = soundingSummary(scenario);
  assert.equal(summary.parcelOrigin, "powierzchnia");
  assert.equal(summary.surfaceSpread, 8);
  assert.equal(summary.hasInversion, false);
  assert.equal(summary.maximumWind.windSpeed, 82);
});

test("atlas search finds clouds by code, Polish observation and taxonomy", () => {
  const search = (query) => searchCloudAtlas(clouds, {
    query,
    getProfile: getCloudProfile,
    taxonomyTerms,
  });

  assert.equal(normalizeCloudSearch("  KOWADŁO  "), "kowadlo");
  assert.deepEqual(search("Ci").map((cloud) => cloud.id), ["cirrus"]);
  assert.equal(search("pierzaste")[0].id, "cirrus");
  assert.ok(search("kowadlo").some((cloud) => cloud.id === "cumulonimbus"));
  assert.ok(search("bez halo").some((cloud) => cloud.id === "altostratus"));
  assert.ok(search("drobne fale").some((cloud) => cloud.id === "cirrocumulus"));
  assert.deepEqual(
    searchCloudAtlas(clouds, {
      query: "nimb",
      level: "średnie",
      getProfile: getCloudProfile,
      taxonomyTerms,
    }).map((cloud) => cloud.id),
    ["nimbostratus", "cumulonimbus"],
    "a name fragment must search every level without unrelated taxonomy matches",
  );
  assert.deepEqual(
    searchCloudAtlas(clouds, {
      query: "",
      level: "wysokie",
      getProfile: getCloudProfile,
      taxonomyTerms,
    }).map((cloud) => cloud.level),
    ["wysokie", "wysokie", "wysokie"],
  );
});

test("taxonomy search ranks formal terms, aliases and compatible genera", () => {
  const search = (query, options = {}) => searchTaxonomyTerms(taxonomyTerms, {
    query,
    cloudList: clouds,
    ...options,
  });

  assert.deepEqual(search("kowadło").map((term) => term.id), ["incus"]);
  assert.deepEqual(search("soczewka").map((term) => term.id), ["lenticularis"]);
  assert.deepEqual(search("pożar").map((term) => term.id), ["flammagenitus"]);
  assert.deepEqual(search("NLC").map((term) => term.id), ["noctilucent"]);
  assert.deepEqual(
    search("włóknisty", { category: "species" }).map((term) => term.id),
    ["fibratus", "capillatus"],
  );
  assert.ok(search("parujące przed dotarciem")[0]?.id === "virga");
  assert.equal(
    search("Cb", { includeCompatibleGenera: true }).every(
      (term) => term.genera.includes("cumulonimbus"),
    ),
    true,
  );
  assert.deepEqual(
    search("Cb", { includeCompatibleGenera: false }),
    [],
    "the primary search must not flood results with every term compatible with a genus",
  );
  assert.deepEqual(
    search("Cumulonimbus", { includeCompatibleGenera: false }),
    [],
    "a direct genus query must lead to its monograph rather than incidental term mentions",
  );
});

test("every upper-atmosphere entry includes licensed photographic evidence", () => {
  const upperAtmosphereTerms = taxonomyTerms.filter((term) => term.category === "upper");

  assert.equal(upperAtmosphereTerms.length, 3);
  for (const term of upperAtmosphereTerms) {
    assert.ok(term.image?.src.startsWith("assets/upper-atmosphere/"), `${term.name} needs a local image`);
    assert.ok(term.image?.alt, `${term.name} needs alternative text`);
    assert.ok(term.image?.author, `${term.name} needs an author`);
    assert.match(term.image?.license ?? "", /^CC /, `${term.name} needs a compatible license`);
    assert.match(term.image?.page ?? "", /^https:\/\/commons\.wikimedia\.org\/wiki\/File:/);
    assert.equal(term.sourceIds.length, 2, `${term.name} needs classification and photo sources`);
  }
});

test("each cloud record exposes evidence, taxonomy, sources and a varied photo bank", async () => {
  const imageIds = new Set();

  for (const cloud of clouds) {
    assert.ok(cloud.observe.length >= 3, `${cloud.name} needs observable evidence`);
    assert.ok(Array.isArray(cloud.species));
    assert.ok(Array.isArray(cloud.varieties));
    assert.ok(Array.isArray(cloud.features));
    assert.ok(Array.isArray(cloud.accessoryClouds));
    assert.ok(cloud.sourceIds.includes("wmoAtlas"));
    assert.ok(cloud.images.length >= 3, `${cloud.name} needs at least three recognition photos`);

    for (const image of cloud.images) {
      assert.ok(!imageIds.has(image.id), `${image.id} must be globally unique`);
      imageIds.add(image.id);
      assert.match(image.page, /^https:\/\/commons\.wikimedia\.org\//);
      assert.ok(image.author);
      assert.ok(image.license);
      assert.ok(image.note.length >= 30);
      assert.ok(image.diagnostic.length >= 50);
      assert.doesNotMatch(image.src, /^\//, `${cloud.name} must respect the Vite base path`);
      await access(new URL(`../public/${image.src}`, import.meta.url));
    }
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
    assert.ok(category.singular, `${category.label} needs a singular result label`);
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

test("the nomenclature workshop only offers terms compatible with the selected genus", () => {
  const altocumulus = nomenclatureOptions("altocumulus");
  const cirrus = nomenclatureOptions("cirrus");

  assert.deepEqual(
    altocumulus.species.map((term) => term.id),
    clouds.find((cloud) => cloud.id === "altocumulus").species,
  );
  assert.ok(altocumulus.varieties.some((term) => term.id === "perlucidus"));
  assert.ok(!cirrus.varieties.some((term) => term.id === "perlucidus"));
  assert.ok(
    getNomenclatureOrigins("cirrus").some(
      (origin) => origin.id === "mother:genitus:cumulonimbogenitus",
    ),
  );
  assert.ok(
    getNomenclatureOrigins("stratus").some((origin) => origin.id === "silvagenitus"),
  );
});

test("WMO nomenclature distinguishes valid multiple varieties from contradictions", () => {
  const valid = evaluateNomenclature({
    cloudId: "altocumulus",
    speciesId: "stratiformis",
    varietyIds: ["perlucidus", "translucidus"],
    featureIds: [],
    accessoryIds: [],
  });
  const conflict = evaluateNomenclature({
    cloudId: "altocumulus",
    speciesId: "stratiformis",
    varietyIds: ["translucidus", "opacus"],
    featureIds: [],
    accessoryIds: [],
  });

  assert.equal(valid.status, "valid");
  assert.equal(valid.name, "Altocumulus stratiformis perlucidus translucidus");
  assert.equal(conflict.status, "conflict");
  assert.match(conflict.conflicts[0], /wzajemnie się wykluczają/);
});

test("origin suffixes require evidence and the fresh-contrail exception stays strict", () => {
  const motherCloud = evaluateNomenclature({
    cloudId: "cirrus",
    speciesId: "spissatus",
    varietyIds: [],
    featureIds: [],
    accessoryIds: [],
    originId: "mother:genitus:cumulonimbogenitus",
    evidenceConfirmed: false,
  });
  const supportedMotherCloud = evaluateNomenclature({
    ...motherCloud.normalized,
    evidenceConfirmed: true,
  });
  const freshContrail = evaluateNomenclature({
    cloudId: "cirrus",
    speciesId: null,
    varietyIds: [],
    featureIds: [],
    accessoryIds: [],
    originId: "contrail",
    evidenceConfirmed: true,
  });
  const invalidContrail = evaluateNomenclature({
    ...freshContrail.normalized,
    speciesId: "fibratus",
  });

  assert.equal(motherCloud.status, "needs-evidence");
  assert.equal(motherCloud.name, "Cirrus spissatus cumulonimbogenitus");
  assert.equal(supportedMotherCloud.status, "valid");
  assert.equal(freshContrail.name, "Cirrus homogenitus");
  assert.equal(freshContrail.status, "valid");
  assert.equal(invalidContrail.status, "conflict");
  assert.match(invalidContrail.conflicts[0], /wyłącznie nazwę Cirrus homogenitus/);
});

test("special-cloud rules and selection normalization preserve scientific scope", () => {
  const byId = new Map(specialCloudRules.map((rule) => [rule.id, rule]));

  assert.deepEqual(byId.get("flammagenitus").genera, ["cumulus", "cumulonimbus"]);
  assert.deepEqual(byId.get("homomutatus").genera, ["cirrus", "cirrocumulus", "cirrostratus"]);
  assert.deepEqual(byId.get("cataractagenitus").genera, ["cumulus", "stratus"]);
  assert.deepEqual(byId.get("silvagenitus").genera, ["stratus"]);
  for (const [id, rule] of byId) {
    assert.deepEqual(
      rule.genera,
      taxonomyTerms.find((term) => term.id === id).genera,
      `${id} must expose the same genus scope in the index and validator`,
    );
  }

  const normalized = normalizeNomenclatureSelection({
    cloudId: "cirrus",
    speciesId: "congestus",
    varietyIds: ["perlucidus", "radiatus"],
    featureIds: ["incus", "mamma"],
    accessoryIds: ["pileus"],
    originId: "silvagenitus",
  });

  assert.deepEqual(normalized, {
    cloudId: "cirrus",
    speciesId: null,
    varietyIds: ["radiatus"],
    featureIds: ["mamma"],
    accessoryIds: [],
    originId: null,
    evidenceConfirmed: false,
  });
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
    const question = createRecognitionQuestion(cloud.id, {
      imageIds: cloud.images.map((image) => image.id),
      random: () => 0.42,
    });
    assert.equal(question.choices.length, 4);
    assert.equal(new Set(question.choices).size, 4);
    assert.ok(question.choices.includes(cloud.id));
    assert.ok(cloud.images.some((image) => image.id === question.imageId));
    for (const choice of question.choices) {
      assert.ok(clouds.some((candidate) => candidate.id === choice));
    }
  }
});

test("recognition photo selection avoids repeating the previous frame", () => {
  const imageIds = ["first", "second", "third"];

  assert.equal(selectRecognitionImage(imageIds, null, () => 0), "first");
  assert.equal(selectRecognitionImage(imageIds, "first", () => 0), "second");
  assert.equal(selectRecognitionImage(imageIds, "second", () => 0.999), "third");
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

test("the Windy decoder corpus teaches eight fields with evidence and checks", () => {
  assert.equal(weatherLayers.length, 8);
  assert.deepEqual(Object.keys(pressureLevels), ["300", "500", "700", "850", "925", "1000"]);
  assert.deepEqual(Object.keys(cloudBands), ["low", "medium", "high"]);

  for (const layer of weatherLayers) {
    assert.ok(layer.question.length >= 60, `${layer.id} needs a precise question`);
    assert.ok(layer.reference.length >= 90, `${layer.id} needs a reference-frame explanation`);
    assert.ok(layer.compare.length >= 3, `${layer.id} needs triangulation guidance`);
    assert.ok(layer.trap.length >= 100, `${layer.id} needs a substantive trap`);
    assert.ok(layer.sourceIds.length >= 3, `${layer.id} needs multiple sources`);
    assert.equal(layer.check.options.length, 4, `${layer.id} check needs four choices`);
    assert.equal(new Set(layer.check.options).size, 4, `${layer.id} choices must be unique`);
    assert.ok(layer.check.correct >= 0 && layer.check.correct < 4);
    assert.ok(layer.check.explanation.length >= 130, `${layer.id} needs explanatory feedback`);
    for (const sourceId of layer.sourceIds) {
      assert.ok(sources[sourceId], `${layer.id} references ${sourceId}`);
    }
  }
});

test("the Windy decoder keeps pressure surfaces and terrain conceptually separate", () => {
  assert.deepEqual(pressureSurfaceContext(850, 1300), {
    altitude: 1460,
    use: "temperatura i adwekcja w dolnej troposferze",
    pressure: 850,
    terrain: 1300,
    agl: 160,
    intersectsTerrain: false,
    nearTerrain: true,
  });
  assert.equal(pressureSurfaceContext(850, 1800).intersectsTerrain, true);
  assert.match(weatherLayerReading("wind", { pressure: 850, terrain: 1300 }), /160 m AGL/);
  assert.match(weatherLayerReading("wind", { pressure: 850, terrain: 1800 }), /przecinać teren/);
  assert.match(
    weatherLayerReading("cloud-bands", { cloudBand: "medium" }),
    /około 2–6,5 km/,
  );
  assert.match(weatherLayerReading("cloud-base"), /modelowym gruntem \(AGL\)/);
  assert.match(weatherLayerReading("cape"), /nie procentowa prognoza burzy/);
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

test("the METAR workshop offers varied reports and four plausible answers", () => {
  assert.ok(metarTrainingScenarios.length >= 6);

  const reports = new Set();
  for (const scenario of metarTrainingScenarios) {
    assert.ok(!reports.has(scenario.report), `${scenario.id} duplicates a report`);
    reports.add(scenario.report);
    assert.ok(scenario.groups.length >= 6, `${scenario.id} needs a complete guided decode`);
    assert.ok(scenario.questions.length >= 4, `${scenario.id} needs a substantive exercise`);

    for (const question of scenario.questions) {
      assert.equal(question.options.length, 4, `${question.id} must have four choices`);
      assert.equal(new Set(question.options).size, 4, `${question.id} choices must be unique`);
      assert.ok(question.correct >= 0 && question.correct < 4);
      assert.ok(question.explanation.length >= 45, `${question.id} needs teaching feedback`);
      assert.ok(question.focusTokens.length >= 1, `${question.id} needs evidence highlighting`);
    }
  }
});

test("the active decode explains the complete METAR structure and section variants", () => {
  assert.equal(metarStructurePhases.length, 4);
  assert.equal(metarDecodeSections.length, 10);
  assert.deepEqual(
    metarDecodeSections.map((section) => section.id),
    [
      "type",
      "station",
      "time",
      "wind",
      "visibility",
      "weather",
      "clouds",
      "temperature",
      "pressure",
      "supplements",
    ],
  );

  for (const section of metarDecodeSections) {
    assert.ok(section.purpose.length >= 60, `${section.id} needs a clear purpose`);
    assert.ok(section.syntax.length >= 60, `${section.id} needs syntax guidance`);
    assert.ok(section.examples.length >= 3, `${section.id} needs multiple examples`);
    assert.ok(section.watchFor.length >= 60, `${section.id} needs an interpretation warning`);
  }

  const visibility = metarDecodeSections.find((section) => section.id === "visibility");
  assert.equal(visibility.spotlight.code, "CAVOK");
  assert.match(visibility.spotlight.expansion, /Ceiling And Visibility OK/);
  assert.match(visibility.spotlight.meaning, /co najmniej 10 km/);
  assert.match(visibility.spotlight.meaning, /CB ani TCU/);
  assert.match(visibility.spotlight.limits, /nie znaczy „bezchmurnie”/);

  for (const scenario of metarTrainingScenarios) {
    for (const group of scenario.groups) {
      assert.ok(
        metarSectionByGroupLabel[group.label],
        `${scenario.id}.${group.token} needs a section guide`,
      );
    }
  }
});

test("the TAF workshop teaches timelines rather than isolated abbreviations", () => {
  assert.ok(tafTrainingScenarios.length >= 2);

  for (const scenario of tafTrainingScenarios) {
    assert.ok(scenario.report.startsWith("TAF "));
    assert.ok(scenario.timeline.length >= 3, `${scenario.id} needs a meaningful timeline`);
    assert.ok(scenario.questions.length >= 3, `${scenario.id} needs timeline practice`);
    for (const question of scenario.questions) {
      assert.equal(question.options.length, 4);
      assert.equal(new Set(question.options).size, 4);
    }
  }
});

test("multi-report briefings require synthesis across three coherent reports", () => {
  const scenarioIds = new Set(metarTrainingScenarios.map((scenario) => scenario.id));

  assert.ok(aviationBriefingSets.length >= 2);
  for (const briefing of aviationBriefingSets) {
    assert.ok(briefing.context.length >= 90, `${briefing.id} needs a real briefing context`);
    assert.ok(briefing.reports.length >= 3, `${briefing.id} needs at least three reports`);
    assert.ok(briefing.questions.length >= 4, `${briefing.id} needs a substantive exercise`);

    for (const report of briefing.reports) {
      assert.ok(scenarioIds.has(report.scenarioId), `${briefing.id} references ${report.scenarioId}`);
      assert.ok(report.note.length >= 30, `${briefing.id}.${report.scenarioId} needs a role`);
    }

    for (const question of briefing.questions) {
      assert.equal(question.options.length, 4, `${question.id} must have four choices`);
      assert.equal(new Set(question.options).size, 4, `${question.id} choices must be unique`);
      assert.ok(question.explanation.length >= 80, `${question.id} needs reasoning`);
      assert.ok(question.topic.length >= 12, `${question.id} needs a review topic`);
      assert.ok(question.focusScenarioIds.length >= 1, `${question.id} needs report evidence`);
      assert.ok(question.focusTokens.length >= 1, `${question.id} needs token evidence`);
      for (const scenarioId of question.focusScenarioIds) {
        assert.ok(
          briefing.reports.some((report) => report.scenarioId === scenarioId),
          `${question.id} focuses a report outside its briefing`,
        );
      }
    }
  }
});

test("aviation review becomes urgent after errors and relaxes after recall", () => {
  const bank = createAviationQuestionBank(
    metarTrainingScenarios,
    tafTrainingScenarios,
    aviationBriefingSets,
  );
  const now = Date.UTC(2026, 5, 16, 8, 0, 0);
  const item = bank[0];
  const afterError = updateAviationReview({}, item, false, now);
  const afterRecall = updateAviationReview(afterError, item, true, now + 1000);
  const afterSecondRecall = updateAviationReview(
    afterRecall,
    item,
    true,
    now + (6 * 60 * 60 * 1000) + 2000,
  );

  assert.equal(afterError[item.key].dueAt, now);
  assert.ok(afterRecall[item.key].dueAt > now);
  assert.ok(afterSecondRecall[item.key].dueAt > afterRecall[item.key].dueAt);
  assert.ok(
    aviationReviewPriority(afterError[item.key], now)
      > aviationReviewPriority(afterRecall[item.key], now + 1000),
  );
  assert.ok(
    aviationReviewPriority(afterRecall[item.key], now + 1000)
      > aviationReviewPriority(afterSecondRecall[item.key], now + 2000),
  );
  assert.deepEqual(aviationReviewQueue(bank, afterError, now).map((entry) => entry.key), [item.key]);
  assert.equal(aviationReviewQueue(bank, afterRecall, now + 1000).length, 0);

  const summary = aviationReviewSummary(bank, afterRecall, now + 1000);
  assert.equal(summary.tracked, 1);
  assert.equal(summary.due, 0);
  assert.equal(summary.nextDueAt, afterRecall[item.key].dueAt);
});

test("ceiling logic distinguishes BKN OVC and VV from FEW and SCT", () => {
  assert.deepEqual(parseSkyGroup("BKN018CB"), {
    token: "BKN018CB",
    amount: "BKN",
    heightFt: 1800,
    cloudType: "CB",
    createsCeiling: true,
  });
  assert.equal(parseSkyGroup("SCT018TCU").createsCeiling, false);
  assert.equal(findReportedCeiling("EPWA 161230Z 9999 BKN018CB OVC050").token, "BKN018CB");
  assert.equal(findReportedCeiling("EPGD 160530Z 1200 BR VV002").heightFt, 200);
  assert.equal(findReportedCeiling("EPKK 161400Z 9999 FEW020 SCT045"), null);
});

test("training answers and scenario rotation are deterministic at their boundaries", () => {
  const question = metarTrainingScenarios[0].questions[0];
  assert.equal(evaluateTrainingAnswer(question, question.correct).isCorrect, true);
  assert.equal(evaluateTrainingAnswer(question, 0).correct, question.options[question.correct]);
  assert.equal(chooseDifferentScenario(0, 1, () => 0.5), 0);
  assert.notEqual(chooseDifferentScenario(2, 6, () => 0), 2);
  assert.notEqual(chooseDifferentScenario(2, 6, () => 0.999), 2);
});
