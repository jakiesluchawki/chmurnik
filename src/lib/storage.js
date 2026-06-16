const KEYS = {
  profile: "cloud-recognition:profile",
  progress: "cloud-recognition:progress",
  journal: "cloud-recognition:journal",
  recognition: "cloud-recognition:recognition",
  observationDraft: "cloud-recognition:observation-draft",
  lessonPositions: "cloud-recognition:lesson-positions",
};

function read(key, fallback) {
  try {
    const value = window.localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function write(key, value) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // The app remains usable when storage is blocked or full.
  }
}

export function loadProfile() {
  return read(KEYS.profile, null);
}

export function saveProfile(profile) {
  write(KEYS.profile, profile);
}

export function loadProgress() {
  return read(KEYS.progress, []);
}

export function saveProgress(progress) {
  write(KEYS.progress, progress);
}

export function loadLessonPosition(lessonId) {
  const positions = read(KEYS.lessonPositions, {});
  return Number.isInteger(positions[lessonId]) ? positions[lessonId] : 0;
}

export function saveLessonPosition(lessonId, chapterIndex) {
  const positions = read(KEYS.lessonPositions, {});
  write(KEYS.lessonPositions, { ...positions, [lessonId]: chapterIndex });
}

export function loadJournal() {
  return read(KEYS.journal, []);
}

export function saveJournal(entries) {
  write(KEYS.journal, entries);
}

export function loadRecognitionStats() {
  return read(KEYS.recognition, {});
}

export function saveRecognitionStats(stats) {
  write(KEYS.recognition, stats);
}

export function loadObservationDraft() {
  return read(KEYS.observationDraft, null);
}

export function saveObservationDraft(draft) {
  write(KEYS.observationDraft, draft);
}

export function clearObservationDraft() {
  try {
    window.localStorage.removeItem(KEYS.observationDraft);
  } catch {
    // The draft is optional when storage is unavailable.
  }
}
