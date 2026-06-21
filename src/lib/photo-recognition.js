const CLOUD_CLASSES = [
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

const FAMILY_DEFINITIONS = [
  {
    id: "high",
    label: "wysokie i pierzaste",
    shortLabel: "wysokie",
    classIds: ["cirrus", "cirrocumulus", "cirrostratus"],
    evidence: "Szukaj włókien, drobnej skali elementów, przeświecającego światła i braku własnego, ciemnego cienia.",
  },
  {
    id: "middle",
    label: "piętro średnie",
    shortLabel: "średnie",
    classIds: ["altocumulus", "altostratus"],
    evidence: "Porównaj skalę członów, stopień zasłonięcia Słońca i obecność własnego cieniowania.",
  },
  {
    id: "low-layered",
    label: "niskie i warstwowe",
    shortLabel: "niskie",
    classIds: ["nimbostratus", "stratocumulus", "stratus"],
    evidence: "Sprawdź ciągłość warstwy, niską podstawę, szarość i to, czy z kadru widać opad.",
  },
  {
    id: "convective",
    label: "konwekcyjne",
    shortLabel: "konwekcyjne",
    classIds: ["cumulus", "cumulonimbus"],
    evidence: "Szukaj kalafiorowej budowy, wyraźnej podstawy i rozwoju pionowego. Kowadło jest mocnym dowodem na Cumulonimbus.",
  },
  {
    id: "clear",
    label: "bez wyraźnego zachmurzenia",
    shortLabel: "bez chmur",
    classIds: ["clear_sky"],
    evidence: "Model nie znalazł wystarczająco wyraźnej struktury chmury. Spróbuj kadru z większą ilością nieba.",
  },
];

const DEFAULT_POLICY = {
  minimumConfidence: 0.2,
  marginThreshold: 0.68,
};

function normalizedProbabilities(probabilities) {
  if (!Array.isArray(probabilities) || probabilities.length !== CLOUD_CLASSES.length) {
    throw new Error("Model zwrócił niepełny zestaw prawdopodobieństw.");
  }
  const finite = probabilities.map((value) => Number(value));
  if (finite.some((value) => !Number.isFinite(value) || value < 0)) {
    throw new Error("Model zwrócił nieprawidłowe prawdopodobieństwa.");
  }
  const total = finite.reduce((sum, value) => sum + value, 0);
  if (total <= 0) throw new Error("Model nie zwrócił rozpoznawalnego wyniku.");
  return finite.map((value) => value / total);
}

export function aggregateCloudFamilies(ranked) {
  return FAMILY_DEFINITIONS
    .map((family) => ({
      ...family,
      probability: family.classIds.reduce(
        (sum, classId) => sum + (ranked.find((item) => item.id === classId)?.probability || 0),
        0,
      ),
    }))
    .sort((a, b) => b.probability - a.probability);
}

export function interpretCloudProbabilities(probabilities, policy = {}) {
  const values = normalizedProbabilities(probabilities);
  const ranked = CLOUD_CLASSES
    .map((id, index) => ({ id, probability: values[index] }))
    .sort((a, b) => b.probability - a.probability);
  const minimumConfidence = Number(policy.minimumConfidence ?? DEFAULT_POLICY.minimumConfidence);
  const marginThreshold = Number(policy.marginThreshold ?? DEFAULT_POLICY.marginThreshold);
  const margin = ranked[0].probability - ranked[1].probability;
  const accepted = ranked[0].probability >= minimumConfidence && margin >= marginThreshold;
  const families = aggregateCloudFamilies(ranked);
  const familyMargin = families[0].probability - families[1].probability;

  return {
    state: ranked[0].id === "clear_sky" && accepted ? "clear" : accepted ? "hypothesis" : "ambiguous",
    ranked: ranked.slice(0, 3),
    families: families.slice(0, 2),
    leadingFamily: families[0],
    confidence: ranked[0].probability,
    margin,
    familyMargin,
    policy: { minimumConfidence, marginThreshold },
  };
}

export function recognitionClassIds() {
  return [...CLOUD_CLASSES];
}

export function cloudFamilyDefinitions() {
  return FAMILY_DEFINITIONS.map((family) => ({ ...family, classIds: [...family.classIds] }));
}
