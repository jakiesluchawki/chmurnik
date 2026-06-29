export const cloudRecognitionClasses = [
  "cirrus",
  "cirrocumulus",
  "cirrostratus",
  "altocumulus",
  "altostratus",
  "nimbostratus",
  "stratocumulus",
  "stratus",
  "cumulus",
  "cumulonimbus",
  "clear_sky",
];

export function interpretPhotoRecognition({
  probabilities,
  marginThreshold,
  minimumConfidence = 0,
  classes = cloudRecognitionClasses,
}) {
  if (!Array.isArray(probabilities) || probabilities.length !== classes.length) {
    throw new Error("Model zwrócił niepełny zestaw hipotez.");
  }

  const values = classes.map((id, index) => ({
    id,
    probability: Math.max(0, Math.min(1, Number(probabilities[index]) || 0)),
  }));
  const clearSky = values.find((item) => item.id === "clear_sky");
  const ranked = values
    .filter((item) => item.id !== "clear_sky")
    .sort((first, second) => second.probability - first.probability)
    .slice(0, 3);
  const leading = ranked[0];
  const margin = leading.probability - ranked[1].probability;
  const threshold = Math.max(0, Math.min(1, Number(marginThreshold) || 0.3));
  const confidenceThreshold = Math.max(
    0,
    Math.min(1, Number(minimumConfidence) || 0),
  );
  const clear = clearSky.probability >= Math.max(0.55, leading.probability + 0.12);
  const abstained =
    !clear &&
    (margin < threshold || leading.probability < confidenceThreshold);

  return {
    state: clear ? "clear" : abstained ? "abstained" : "ranked",
    ranked,
    clearSkyProbability: clearSky.probability,
    margin,
    marginThreshold: threshold,
    minimumConfidence: confidenceThreshold,
  };
}

export function recognitionSignalLabel(probability) {
  if (probability >= 0.8) return "silny sygnał";
  if (probability >= 0.62) return "wyraźny sygnał";
  if (probability >= 0.45) return "umiarkowany sygnał";
  return "słaby sygnał";
}
