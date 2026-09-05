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

  if (!first || first.score <= 0) {
    return {
      level: "none",
      label: "Za mało informacji",
      explanation: "Te odpowiedzi nie wskazują rodzaju chmury. Możesz wrócić do pytań, kiedy zobaczysz jej cechy wyraźniej.",
    };
  }
  if (!second) {
    return {
      level: "moderate",
      label: "Jedna propozycja do sprawdzenia",
      explanation: "Zaznaczone cechy wskazują tę możliwość, ale nie potwierdzają rozpoznania. Sprawdź zdjęcia i opis w atlasie.",
    };
  }

  if (gap >= 7) {
    return {
      level: "leading",
      label: "Pierwsza propozycja pasuje najlepiej",
      explanation:
        "Twoje odpowiedzi pasują najlepiej do pierwszego rodzaju. Porównaj jednak jego opis i zdjęcia z obserwowaną chmurą; to nadal propozycja, nie potwierdzone rozpoznanie.",
    };
  }

  if (gap >= 3) {
    return {
      level: "moderate",
      label: "Warto porównać podobne rodzaje",
      explanation:
        "Pierwsza propozycja pasuje trochę lepiej, ale część zaznaczonych cech występuje też u innych rodzajów. Sprawdź różnice w ich opisach.",
    };
  }

  return {
    level: "close",
    label: "Nie ma wyraźnego rozstrzygnięcia",
    explanation:
      "Podobne rodzaje pasują do zaznaczonych cech. Zwróć uwagę na opisane niżej różnice; same odpowiedzi nie wystarczają do wyboru jednej nazwy.",
  };
}

export function fieldHypotheses(results) {
  return results.filter((result) => Number.isFinite(result.score) && result.score > 0 && result.matches?.length > 0).slice(0, 3);
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
  const supported = fieldHypotheses(results);
  if (supported.length === 0) return null;
  const verdict = observationVerdict(supported);
  const evidence = fieldQuestions
    .map((question) => {
      const option = selectedOption(question, answers[question.id]);
      return option ? `${question.eyebrow.split("·").at(-1).trim()}: ${option.label}` : null;
    })
    .filter(Boolean);
  const hypotheses = supported
    .map((result) => cloudLabel(result.cloudId))
    .join(", ");

  return {
    cloudId: supported[0].cloudId,
    confidence:
      verdict.level === "leading" ? "wysoka" : verdict.level === "moderate" ? "średnia" : "niska",
    evidence: `${evidence.join("; ")}. Hipotezy asystenta: ${hypotheses}.`,
  };
}
