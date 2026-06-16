import { fieldQuestions, pairDiscriminators } from "../data/field-guide.js";

function selectedOption(question, answerId) {
  return question.options.find((option) => option.id === answerId);
}

export function scoreFieldObservation(cloudIds, answers) {
  const scores = new Map(
    cloudIds.map((cloudId, order) => [
      cloudId,
      { cloudId, score: 0, matches: [], conflicts: [], order },
    ]),
  );

  for (const question of fieldQuestions) {
    const option = selectedOption(question, answers[question.id]);
    if (!option) continue;

    for (const [cloudId, weight] of Object.entries(option.weights)) {
      const result = scores.get(cloudId);
      if (!result) continue;

      result.score += weight;
      if (weight >= 2) result.matches.push(option.signal);
      if (weight <= -2) result.conflicts.push(option.signal);
    }
  }

  return [...scores.values()].sort(
    (first, second) => second.score - first.score || first.order - second.order,
  );
}

export function observationVerdict(results) {
  const [first, second] = results;
  const gap = (first?.score || 0) - (second?.score || 0);

  if (gap >= 7) {
    return {
      level: "leading",
      label: "Wyraźnie prowadząca hipoteza",
      explanation:
        "Zebrane cechy układają się spójniej dla pierwszego rodzaju, ale nadal warto sprawdzić wskazany dowód rozstrzygający.",
    };
  }

  if (gap >= 3) {
    return {
      level: "moderate",
      label: "Umiarkowana przewaga",
      explanation:
        "Pierwsza hipoteza ma przewagę, lecz część obrazu pozostaje zgodna także z drugim rodzajem.",
    };
  }

  return {
    level: "close",
    label: "Przypadek sporny",
    explanation:
      "Dwie hipotezy są podobnie zgodne z obserwacją. To nie błąd: chmura może być przejściowa albo brakuje rozstrzygającej cechy.",
  };
}

export function nextDiscriminatingObservation(results) {
  const [first, second] = results;
  if (!first || !second) return "";

  return pairDiscriminator(first.cloudId, second.cloudId);
}

export function pairDiscriminator(firstCloudId, secondCloudId) {
  if (!firstCloudId || !secondCloudId) return "";

  const key = [firstCloudId, secondCloudId].sort().join("|");
  return pairDiscriminators[key]
    || "Obserwuj całe niebo przez kolejne 10–15 minut. Porównaj skalę elementów wysoko nad głową, sposób tłumienia Słońca, rodzaj opadu i kierunek przemiany.";
}

export function evidenceCoverage(answers) {
  return fieldQuestions.filter((question) => answers[question.id]).length;
}

export function createObservationDraft(answers, results, cloudLabel = (cloudId) => cloudId) {
  const verdict = observationVerdict(results);
  const evidence = fieldQuestions
    .map((question) => {
      const option = selectedOption(question, answers[question.id]);
      return option ? `${question.eyebrow.split("·").at(-1).trim()}: ${option.label}` : null;
    })
    .filter(Boolean);
  const hypotheses = results
    .slice(0, 3)
    .map((result) => cloudLabel(result.cloudId))
    .join(", ");

  return {
    cloudId: results[0]?.cloudId || "",
    confidence:
      verdict.level === "leading" ? "wysoka" : verdict.level === "moderate" ? "średnia" : "niska",
    evidence: `${evidence.join("; ")}. Hipotezy asystenta: ${hypotheses}.`,
  };
}
