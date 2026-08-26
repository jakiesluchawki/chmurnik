export const JOURNAL_BACKUP_VERSION = 1;
export const MAX_JOURNAL_ENTRIES = 500;
export const MAX_JOURNAL_PHOTO_LENGTH = 900_000;

function normalizeText(value, maximumLength, required = true) {
  if (typeof value !== "string") {
    if (!required && value == null) return "";
    throw new TypeError("Journal entry contains invalid text");
  }
  const normalized = value.trim();
  if ((required && !normalized) || normalized.length > maximumLength) {
    throw new RangeError("Journal entry contains text outside allowed limits");
  }
  return normalized;
}

function normalizeDate(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new TypeError("Journal entry contains an invalid local date");
  }
  const [year, month, day] = value.split("-").map(Number);
  const parsed = new Date(year, month - 1, day, 12);
  if (
    parsed.getFullYear() !== year
    || parsed.getMonth() !== month - 1
    || parsed.getDate() !== day
  ) {
    throw new TypeError("Journal entry contains an invalid calendar date");
  }
  return value;
}

function normalizePhoto(photo) {
  if (photo == null || photo === "") return null;
  if (
    typeof photo !== "string"
    || photo.length > MAX_JOURNAL_PHOTO_LENGTH
    || !/^data:image\/(?:jpeg|png|webp);base64,(?:[a-z\d+/]{4})*(?:[a-z\d+/]{4}|[a-z\d+/]{2}(?:==)?|[a-z\d+/]{3}=?)$/i.test(photo)
  ) {
    throw new TypeError("Journal entry contains an invalid local photo");
  }
  return photo;
}

export function normalizeJournalEntry(entry) {
  if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
    throw new TypeError("Journal entry must be an object");
  }
  if (!Number.isFinite(entry.createdAt) || entry.createdAt < 0) {
    throw new TypeError("Journal entry contains an invalid creation time");
  }
  if (!["niska", "średnia", "wysoka"].includes(entry.confidence)) {
    throw new TypeError("Journal entry contains an invalid confidence");
  }

  return {
    id: normalizeText(entry.id, 100),
    date: normalizeDate(entry.date),
    location: normalizeText(entry.location, 160),
    cloud: normalizeText(entry.cloud, 120),
    confidence: entry.confidence,
    evidence: normalizeText(entry.evidence, 4000),
    photo: normalizePhoto(entry.photo),
    createdAt: entry.createdAt,
  };
}

export function serializeJournalBackup(entries, date = new Date()) {
  if (!Array.isArray(entries) || entries.length > MAX_JOURNAL_ENTRIES) {
    throw new RangeError("Journal backup exceeds the allowed number of entries");
  }
  return JSON.stringify({
    kind: "chmurnik-journal",
    version: JOURNAL_BACKUP_VERSION,
    exportedAt: date.toISOString(),
    entries: entries.map(normalizeJournalEntry),
  }, null, 2);
}

export function parseJournalBackup(contents) {
  if (typeof contents !== "string" || contents.length > 50_000_000) {
    throw new TypeError("Journal backup has an invalid size");
  }
  let backup;
  try {
    backup = JSON.parse(contents);
  } catch {
    throw new TypeError("Journal backup is not valid JSON");
  }
  if (
    !backup
    || backup.kind !== "chmurnik-journal"
    || backup.version !== JOURNAL_BACKUP_VERSION
    || !Array.isArray(backup.entries)
    || backup.entries.length > MAX_JOURNAL_ENTRIES
  ) {
    throw new TypeError("Journal backup has an unsupported format");
  }
  return backup.entries.map(normalizeJournalEntry);
}

export function mergeJournalEntries(existing, imported) {
  const merged = new Map(existing.map((entry) => [entry.id, normalizeJournalEntry(entry)]));
  for (const entry of imported) {
    const normalized = normalizeJournalEntry(entry);
    if (!merged.has(normalized.id)) merged.set(normalized.id, normalized);
  }
  if (merged.size > MAX_JOURNAL_ENTRIES) {
    throw new RangeError("Journal cannot contain more than 500 entries");
  }
  return [...merged.values()].sort((first, second) => second.createdAt - first.createdAt);
}

function loadImage(source) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new TypeError("The selected image cannot be opened"));
    image.src = source;
  });
}

export async function compactObservationPhoto(file) {
  if (!file || typeof file.type !== "string" || !file.type.startsWith("image/")) {
    throw new TypeError("Select an image to attach to the observation");
  }
  if (file.size > 30_000_000) throw new RangeError("The selected image is too large");

  const source = URL.createObjectURL(file);
  try {
    const image = await loadImage(source);
    const longestSide = Math.max(image.naturalWidth, image.naturalHeight);
    if (!longestSide) throw new TypeError("The selected image has no readable dimensions");

    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d", { alpha: false });
    if (!context) throw new Error("The selected image cannot be prepared for local storage");

    for (const maximumDimension of [1080, 860, 680]) {
      const scale = Math.min(1, maximumDimension / longestSide);
      canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
      canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      const photo = canvas.toDataURL("image/jpeg", 0.76);
      if (photo.length <= MAX_JOURNAL_PHOTO_LENGTH) return photo;
    }
    throw new RangeError("The selected image is too detailed for local storage");
  } finally {
    URL.revokeObjectURL(source);
  }
}
