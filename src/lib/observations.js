import { clouds } from "../data/clouds.js";
import { normalizeJournalEntry, parseJournalBackup } from "./journal.js";
import { localDateKey } from "./daily-cloud.js";
import { cloudComparisonCandidates } from "./photo-recognition.js";

export const OBSERVATION_BACKUP_VERSION = 2;
export const MAX_OBSERVATIONS = 500;
export const MAX_BACKUP_BYTES = 50_000_000;
const ids = new Set(clouds.map((cloud) => cloud.id));

function limitedText(value, length) {
  if (value == null) return "";
  if (typeof value !== "string" || value.length > length)
    throw new TypeError("Invalid observation text");
  return value.trim();
}

export function normalizeObservation(entry) {
  const normalized = normalizeJournalEntry({
    ...entry,
    location: entry.location || "Nie podano",
    cloud: entry.cloud || "Nierozpoznana",
    evidence: entry.evidence || "Brak notatki.",
    photo: entry.photo || null,
  });
  const confirmedCloudId = entry.confirmedCloudId || null;
  if (confirmedCloudId && !ids.has(confirmedCloudId))
    throw new TypeError("Invalid confirmed cloud");
  let hypothesis = null;
  if (entry.hypothesis != null) {
    const value = entry.hypothesis;
    if (!Array.isArray(value.candidates) || value.candidates.length > 3)
      throw new TypeError("Invalid hypothesis");
    hypothesis = {
      modelVersion: limitedText(value.modelVersion, 80),
      family: limitedText(value.family, 120),
      state: limitedText(value.state, 40),
      candidates: value.candidates.map((candidate) => {
        if (
          !ids.has(candidate.id) ||
          !Number.isFinite(candidate.probability) ||
          candidate.probability < 0 ||
          candidate.probability > 1
        )
          throw new TypeError("Invalid hypothesis candidate");
        return { id: candidate.id, probability: candidate.probability };
      }),
    };
  }
  return {
    ...normalized,
    location: limitedText(entry.location, 160),
    evidence: limitedText(entry.evidence, 4000),
    confirmedCloudId,
    hypothesis,
    favorite: entry.favorite === true,
  };
}

export function observationFromRecognition(
  result,
  now = new Date(),
  id = crypto.randomUUID(),
) {
  return normalizeObservation({
    id,
    date: localDateKey(now),
    createdAt: now.getTime(),
    location: "",
    cloud: "Nierozpoznana",
    confidence: "niska",
    evidence: "",
    photo: null,
    confirmedCloudId: null,
    hypothesis: result
      ? {
          modelVersion: result.modelVersion || "nieznana",
          family: result.state === "clear" ? "Bez wyraźnych chmur"
            : result.state === "hypothesis" ? result.leadingFamily?.label || "Hipoteza do sprawdzenia"
              : "Rodzaj chmury nierozstrzygnięty",
          state: result.state,
          candidates: cloudComparisonCandidates(result)
            .map(({ id: cloudId, probability }) => ({
              id: cloudId,
              probability,
            })),
        }
      : null,
  });
}

export function observationTitle(entry) {
  if (entry.confirmedCloudId)
    return clouds.find((cloud) => cloud.id === entry.confirmedCloudId).name;
  if (entry.hypothesis)
    return entry.hypothesis.family || "Nierozstrzygnięte niebo";
  return entry.cloud || "Moja obserwacja";
}

export function confirmedGenera(entries) {
  return [
    ...new Set(
      entries
        .map((entry) => entry.confirmedCloudId)
        .filter((id) => ids.has(id)),
    ),
  ];
}

export function parseObservationBackup(contents) {
  if (typeof contents !== "string" || contents.length > MAX_BACKUP_BYTES)
    throw new Error("Kopia jest zbyt duża (maks. 50 MB na część).");
  const backup = JSON.parse(contents);
  if (backup.kind === "chmurnik-journal" && backup.version === 1)
    return parseJournalBackup(contents).map(normalizeObservation);
  if (
    backup.kind !== "chmurnik-observations" ||
    backup.version !== OBSERVATION_BACKUP_VERSION ||
    !Array.isArray(backup.entries) ||
    backup.entries.length > MAX_OBSERVATIONS
  )
    throw new Error("Nieznany format kopii.");
  const entries = backup.entries.map(normalizeObservation);
  if (new Set(entries.map((entry) => entry.id)).size !== entries.length)
    throw new Error("Kopia zawiera powtórzone identyfikatory.");
  return entries;
}

export function serializeObservationBackup(entries) {
  if (!Array.isArray(entries) || entries.length > MAX_OBSERVATIONS)
    throw new Error("Za dużo obserwacji.");
  const contents = JSON.stringify({
    kind: "chmurnik-observations",
    version: OBSERVATION_BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    entries: entries.map(normalizeObservation),
  });
  if (contents.length > MAX_BACKUP_BYTES)
    throw new Error("Kopia jest zbyt duża; eksportuj ją w częściach.");
  return contents;
}

export function postcardCaption(entry) {
  return {
    title: observationTitle(entry),
    status: entry.confirmedCloudId
      ? "Rozpoznanie autora obserwacji"
      : entry.hypothesis
        ? "Hipoteza do sprawdzenia"
        : "Własna obserwacja",
    date: entry.date,
  };
}
