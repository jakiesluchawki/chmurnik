function localDateParts(date) {
  const value = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(value.getTime())) throw new TypeError("Invalid date");
  return [value.getFullYear(), value.getMonth() + 1, value.getDate()];
}

export function localDateKey(date = new Date()) {
  return localDateParts(date).map((part) => String(part).padStart(2, "0")).join("-");
}

export function dailyIndex(date, length) {
  if (!Number.isInteger(length) || length < 1) return -1;
  const key = localDateKey(date);
  let hash = 2166136261;
  for (const character of key) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0) % length;
}

export function selectDailyCloud(cloudList, date = new Date()) {
  const candidates = cloudList.flatMap((cloud) =>
    (cloud.images || []).map((image) => ({ cloud, image })),
  );
  const index = dailyIndex(date, candidates.length);
  if (index < 0) return null;
  return {
    ...candidates[index],
    dateKey: localDateKey(date),
    index,
    total: candidates.length,
  };
}
