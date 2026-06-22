import test from "node:test";
import assert from "node:assert/strict";

import {
  aggregateCloudFamilies,
  interpretCloudProbabilities,
  recognitionClassIds,
} from "../src/lib/photo-recognition.js";
import {
  buildCloudRecognizerInput,
  cameraPermissionGranted,
} from "../src/lib/native-cloud-recognizer.js";

test("aggregates genus scores into meteorologically useful families", () => {
  const ranked = recognitionClassIds().map((id) => ({ id, probability: 0 }));
  ranked.find((row) => row.id === "cumulus").probability = 0.43;
  ranked.find((row) => row.id === "cumulonimbus").probability = 0.31;
  ranked.find((row) => row.id === "cirrus").probability = 0.26;

  const families = aggregateCloudFamilies(ranked);
  assert.equal(families[0].id, "convective");
  assert.equal(families[0].probability, 0.74);
  assert.equal(families[1].id, "high");
});

test("keeps close genus scores as hypotheses instead of a verdict", () => {
  const result = interpretCloudProbabilities([
    0.12, 0.08, 0.06, 0.05, 0.04, 0.03, 0.04, 0.03, 0.38, 0.15, 0.02,
  ]);

  assert.equal(result.state, "ambiguous");
  assert.equal(result.ranked[0].id, "cumulus");
  assert.equal(result.leadingFamily.id, "convective");
  assert.ok(result.familyMargin > result.margin);
});

test("accepts a genus only when the calibrated margin is decisive", () => {
  const result = interpretCloudProbabilities([
    0.02, 0.01, 0.01, 0.02, 0.01, 0.01, 0.02, 0.01, 0.81, 0.05, 0.03,
  ]);

  assert.equal(result.state, "hypothesis");
  assert.equal(result.ranked[0].id, "cumulus");
});

test("rejects malformed model output", () => {
  assert.throws(() => interpretCloudProbabilities([0.5, 0.5]), /niepełny/);
});

test("sends a native camera file path without a Base64 bridge payload", () => {
  assert.deepEqual(
    buildCloudRecognizerInput({ path: "file:///tmp/capacitor-camera.jpeg", base64: "unused" }),
    { path: "file:///tmp/capacitor-camera.jpeg" },
  );
});

test("keeps Base64 as a compatibility fallback for injected QA images", () => {
  assert.deepEqual(buildCloudRecognizerInput("aGVsbG8="), { base64: "aGVsbG8=" });
  assert.deepEqual(buildCloudRecognizerInput({ base64String: "aGVsbG8=" }), { base64: "aGVsbG8=" });
  assert.throws(() => buildCloudRecognizerInput({}), /danych zdjęcia/);
});

test("accepts only usable iOS camera permission states", () => {
  assert.equal(cameraPermissionGranted("granted"), true);
  assert.equal(cameraPermissionGranted("limited"), true);
  assert.equal(cameraPermissionGranted("prompt"), false);
  assert.equal(cameraPermissionGranted("denied"), false);
});
