import assert from "node:assert/strict";
import test from "node:test";

import {
  cloudRecognitionClasses,
  interpretPhotoRecognition,
  recognitionSignalLabel,
} from "../src/lib/photo-recognition.js";

const probabilities = (entries) => cloudRecognitionClasses.map((id) => entries[id] || 0);

test("returns three ranked hypotheses above the calibrated threshold", () => {
  const result = interpretPhotoRecognition({
    probabilities: probabilities({ cumulus: 0.82, stratocumulus: 0.54, cumulonimbus: 0.41 }),
    marginThreshold: 0.2,
  });

  assert.equal(result.state, "ranked");
  assert.deepEqual(result.ranked.map((item) => item.id), ["cumulus", "stratocumulus", "cumulonimbus"]);
});

test("abstains when no genus reaches the calibrated threshold", () => {
  const result = interpretPhotoRecognition({
    probabilities: probabilities({ cirrus: 0.78, cirrostratus: 0.7, altostratus: 0.58 }),
    marginThreshold: 0.25,
  });

  assert.equal(result.state, "abstained");
});

test("recognizes a clear-sky signal only when it is distinctly stronger", () => {
  const result = interpretPhotoRecognition({
    probabilities: probabilities({ clear_sky: 0.78, cirrus: 0.42 }),
    marginThreshold: 0.25,
  });

  assert.equal(result.state, "clear");
});

test("rejects malformed model output", () => {
  assert.throws(
    () => interpretPhotoRecognition({ probabilities: [0.5], marginThreshold: 0.25 }),
    /niepełny zestaw/i,
  );
});

test("uses human signal labels instead of certainty claims", () => {
  assert.equal(recognitionSignalLabel(0.84), "silny sygnał");
  assert.equal(recognitionSignalLabel(0.3), "słaby sygnał");
});
