import assert from "node:assert/strict";
import test from "node:test";
import { clouds } from "../src/data/clouds.js";
import {
  createObservationDraft,
  evidenceCoverage,
  nextDiscriminatingObservation,
  observationVerdict,
  pairDiscriminator,
  scoreFieldObservation,
} from "../src/lib/field-guide.js";

const cloudIds = clouds.map((cloud) => cloud.id);

test("field observation ranks a deeply convective cloud first", () => {
  const results = scoreFieldObservation(cloudIds, {
    shape: "tower",
    scale: "large",
    light: "shadows",
    precipitation: "showers",
    evolution: "icing-top",
  });

  assert.equal(results[0].cloudId, "cumulonimbus");
  assert.ok(results[0].score > results[1].score);
  assert.ok(results[0].matches.length >= 4);
});

test("element scale separates Cirrocumulus from Altocumulus", () => {
  const tiny = scoreFieldObservation(cloudIds, {
    shape: "cells",
    scale: "tiny",
    light: "bright",
    precipitation: "none",
    evolution: "steady",
  });
  const medium = scoreFieldObservation(cloudIds, {
    shape: "cells",
    scale: "medium",
    light: "shadows",
    precipitation: "none",
    evolution: "steady",
  });

  assert.equal(tiny[0].cloudId, "cirrocumulus");
  assert.equal(medium[0].cloudId, "altocumulus");
});

test("close hypotheses return an explicit discriminator", () => {
  const guidance = nextDiscriminatingObservation([
    { cloudId: "altocumulus", score: 12 },
    { cloudId: "cirrocumulus", score: 11 },
  ]);

  assert.match(guidance, /małego palca/i);
  assert.equal(observationVerdict([
    { cloudId: "altocumulus", score: 12 },
    { cloudId: "cirrocumulus", score: 11 },
  ]).level, "close");
  assert.match(pairDiscriminator("cirrostratus", "altostratus"), /matowego szkła/i);
  assert.match(pairDiscriminator("cirrus", "cumulus"), /całe niebo/i);
});

test("field scoring is deterministic when evidence is tied", () => {
  const first = scoreFieldObservation(cloudIds, {});
  const second = scoreFieldObservation(cloudIds, {});

  assert.deepEqual(first.map((item) => item.cloudId), cloudIds);
  assert.deepEqual(second, first);
  assert.equal(evidenceCoverage({ shape: "cells", scale: "unknown" }), 2);
});

test("field results create a structured private journal draft", () => {
  const answers = {
    shape: "tower",
    scale: "large",
    light: "shadows",
    precipitation: "showers",
    evolution: "icing-top",
  };
  const results = scoreFieldObservation(cloudIds, answers);
  const draft = createObservationDraft(answers, results, (id) => id.toUpperCase());

  assert.equal(draft.cloudId, "cumulonimbus");
  assert.equal(draft.confidence, "wysoka");
  assert.match(draft.evidence, /budowa: Wieża o dużej głębokości/i);
  assert.match(draft.evidence, /Hipotezy asystenta: CUMULONIMBUS/i);
});
