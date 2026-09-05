const confusions = {
  cirrus: ["cirrostratus", "cirrocumulus", "altostratus"],
  cirrocumulus: ["altocumulus", "stratocumulus", "cirrus"],
  cirrostratus: ["altostratus", "cirrus", "nimbostratus"],
  altocumulus: ["cirrocumulus", "stratocumulus", "altostratus"],
  altostratus: ["cirrostratus", "nimbostratus", "stratus"],
  nimbostratus: ["altostratus", "stratus", "cumulonimbus"],
  stratocumulus: ["altocumulus", "stratus", "cumulus"],
  stratus: ["stratocumulus", "nimbostratus", "altostratus"],
  cumulus: ["stratocumulus", "cumulonimbus", "altocumulus"],
  cumulonimbus: ["cumulus", "nimbostratus", "altostratus"],
};

function shuffle(items, random = Math.random) {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const target = Math.floor(random() * (index + 1));
    [result[index], result[target]] = [result[target], result[index]];
  }
  return result;
}

export function selectRecognitionImage(imageIds, previousId = null, random = Math.random) {
  const candidates = imageIds.filter((id) => id !== previousId);
  const pool = candidates.length ? candidates : imageIds;
  if (!pool.length) return null;
  const index = Math.min(pool.length - 1, Math.floor(random() * pool.length));
  return pool[index];
}

export function createRecognitionQuestion(
  cloudId,
  {
    imageIds = [],
    previousImageId = null,
    random = Math.random,
  } = {},
) {
  const distractors = confusions[cloudId] || [];
  return {
    cloudId,
    imageId: selectRecognitionImage(imageIds, previousImageId, random),
    choices: shuffle([cloudId, ...distractors], random),
  };
}

export function recognitionWeight(record = {}) {
  const correct = record.correct || 0;
  const wrong = record.wrong || 0;
  return 1 + (wrong * 3) + Math.max(0, 2 - correct);
}

export function selectRecognitionCloud(cloudIds, stats = {}, previousId = null, random = Math.random) {
  const candidates = cloudIds.filter((id) => id !== previousId);
  const weighted = candidates.map((id) => ({
    id,
    weight: recognitionWeight(stats[id]),
  }));
  const total = weighted.reduce((sum, item) => sum + item.weight, 0);
  let cursor = random() * total;

  for (const item of weighted) {
    cursor -= item.weight;
    if (cursor < 0) return item.id;
  }

  return weighted.at(-1)?.id || cloudIds[0];
}

export function updateRecognitionStats(stats, cloudId, correct) {
  const previous = stats[cloudId] || { correct: 0, wrong: 0 };
  return {
    ...stats,
    [cloudId]: {
      correct: previous.correct + (correct ? 1 : 0),
      wrong: previous.wrong + (correct ? 0 : 1),
    },
  };
}

export function recognitionSummary(stats) {
  return Object.values(stats).reduce(
    (summary, record) => ({
      correct: summary.correct + (record.correct || 0),
      wrong: summary.wrong + (record.wrong || 0),
    }),
    { correct: 0, wrong: 0 },
  );
}

export function recognitionMastery(cloudIds, stats = {}) {
  return cloudIds.map((cloudId) => {
    const record = stats[cloudId] || { correct: 0, wrong: 0 };
    const correct = record.correct || 0;
    const wrong = record.wrong || 0;
    const attempts = correct + wrong;
    const accuracy = attempts ? correct / attempts : null;

    let state = "new";
    let label = "Bez prób";

    if (attempts > 0) {
      state = "learning";
      label = "Ćwiczysz";
    }
    if (wrong > correct || (attempts >= 2 && accuracy < 0.6)) {
      state = "focus";
      label = "Do powtórki";
    }
    if (attempts >= 3 && accuracy >= 0.75) {
      state = "steady";
      label = "Dobre wyniki";
    }

    return {
      cloudId,
      correct,
      wrong,
      attempts,
      accuracy,
      state,
      label,
      priority: recognitionWeight(record),
    };
  });
}

export function weakestRecognitionCloud(cloudIds, stats = {}) {
  return recognitionMastery(cloudIds, stats)
    .sort((first, second) => {
      if (second.priority !== first.priority) return second.priority - first.priority;
      if (first.attempts !== second.attempts) return first.attempts - second.attempts;
      return cloudIds.indexOf(first.cloudId) - cloudIds.indexOf(second.cloudId);
    })[0]?.cloudId || cloudIds[0];
}
