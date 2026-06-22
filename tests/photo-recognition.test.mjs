import test from "node:test";
import assert from "node:assert/strict";

import {
  aggregateCloudFamilies,
  interpretCloudProbabilities,
  recognitionClassIds,
} from "../src/lib/photo-recognition.js";
import {
  buildCloudRecognizerInput,
  isPhotoCaptureCancellation,
  normalizeCapturedPhoto,
  photoCaptureErrorMessage,
} from "../src/lib/native-cloud-recognizer.js";

test("aggregates genus scores into meteorologically useful families", () => {
  const ranked = recognitionClassIds().map((id) => ({ id, probability: 0 }));
  ranked.find((row) => row.id === "cumulus").probability = 0.43;
  ranked.find((row) => row.id === "cumulonimbus").probability = 0.31;
  ranked.find((row) => row.id === "cirrus").probability = 0.26;

  const families = aggregateCloudFamilies(ranked);
  assert.equal(families[0].id, "convective");
  assert.ok(Math.abs(families[0].probability - (0.43 / 0.69)) < 1e-12);
  assert.equal(families[1].id, "high");
});

test("family ranking is not biased by the number of genera in a family", () => {
  const ranked = recognitionClassIds().map((id) => ({ id, probability: 0 }));
  ranked.find((row) => row.id === "cirrus").probability = 0.12;
  ranked.find((row) => row.id === "cirrocumulus").probability = 0.11;
  ranked.find((row) => row.id === "cirrostratus").probability = 0.10;
  ranked.find((row) => row.id === "cumulus").probability = 0.25;

  assert.equal(aggregateCloudFamilies(ranked)[0].id, "convective");
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
    buildCloudRecognizerInput({ uri: "file:///tmp/capacitor-camera.jpeg", base64: "unused" }),
    { path: "file:///tmp/capacitor-camera.jpeg" },
  );
});

test("keeps Base64 as a compatibility fallback for injected QA images", () => {
  assert.deepEqual(buildCloudRecognizerInput("aGVsbG8="), { base64: "aGVsbG8=" });
  assert.deepEqual(buildCloudRecognizerInput({ base64String: "aGVsbG8=" }), { base64: "aGVsbG8=" });
  assert.throws(() => buildCloudRecognizerInput({}), /danych zdjęcia/);
});

test("normalizes the new native camera result around its file URI", () => {
  assert.deepEqual(normalizeCapturedPhoto({
    uri: "file:///tmp/capacitor-camera.jpeg",
    webPath: "capacitor://localhost/_capacitor_file_/tmp/capacitor-camera.jpeg",
    thumbnail: "unused",
  }), {
    uri: "file:///tmp/capacitor-camera.jpeg",
    base64: undefined,
    previewUrl: "capacitor://localhost/_capacitor_file_/tmp/capacitor-camera.jpeg",
  });
});

test("keeps the camera thumbnail only as a web compatibility fallback", () => {
  assert.deepEqual(normalizeCapturedPhoto({ thumbnail: "aGVsbG8=" }), {
    uri: undefined,
    base64: "aGVsbG8=",
    previewUrl: "data:image/jpeg;base64,aGVsbG8=",
  });
  assert.throws(() => normalizeCapturedPhoto({}), /nie zwrócił pliku/);
});

test("recognizes native cancellation and explains structured camera errors", () => {
  assert.equal(isPhotoCaptureCancellation({ code: "OS-PLUG-CAMR-0006" }), true);
  assert.equal(isPhotoCaptureCancellation({ code: "OS-PLUG-CAMR-0020" }), true);
  assert.equal(isPhotoCaptureCancellation({ code: "OS-PLUG-CAMR-0010" }), false);
  assert.match(photoCaptureErrorMessage({ code: "OS-PLUG-CAMR-0003" }), /Ustawieniach.*0003/);
  assert.match(photoCaptureErrorMessage({ code: "OS-PLUG-CAMR-0019" }), /0019/);
});
