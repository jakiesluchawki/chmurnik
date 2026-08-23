const KEYS = {
  profile: "cloud-recognition:profile",
  progress: "cloud-recognition:progress",
  journal: "cloud-recognition:journal",
  recognition: "cloud-recognition:recognition",
  observationDraft: "cloud-recognition:observation-draft",
  lessonPositions: "cloud-recognition:lesson-positions",
  aviationReview: "cloud-recognition:aviation-review",
  photoFeedback: "cloud-recognition:photo-feedback",
  onboarding: "chmurnik:onboarding:v1",
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
    return true;
  } catch {
    return false;
  }
}

export function loadProfile() {
  return read(KEYS.profile, null);
}

export function saveProfile(profile) {
  return write(KEYS.profile, profile);
}

export function loadProgress() {
  return read(KEYS.progress, []);
}

export function saveProgress(progress) {
  return write(KEYS.progress, progress);
}

export function loadLessonPosition(lessonId) {
  const positions = read(KEYS.lessonPositions, {});
  return Number.isInteger(positions[lessonId]) ? positions[lessonId] : 0;
}

export function saveLessonPosition(lessonId, chapterIndex) {
  const positions = read(KEYS.lessonPositions, {});
  return write(KEYS.lessonPositions, { ...positions, [lessonId]: chapterIndex });
}

export function loadJournal() {
  return read(KEYS.journal, []);
}

export function saveJournal(entries) {
  return write(KEYS.journal, entries);
}

export function loadRecognitionStats() {
  return read(KEYS.recognition, {});
}

export function saveRecognitionStats(stats) {
  return write(KEYS.recognition, stats);
}

export function loadObservationDraft() {
  return read(KEYS.observationDraft, null);
}

export function saveObservationDraft(draft) {
  return write(KEYS.observationDraft, draft);
}

export function clearObservationDraft() {
  try {
    window.localStorage.removeItem(KEYS.observationDraft);
    return true;
  } catch {
    return false;
  }
}

export function loadAviationReview() {
  return read(KEYS.aviationReview, {});
}

export function saveAviationReview(records) {
  return write(KEYS.aviationReview, records);
}

export function clearAviationReview() {
  try {
    window.localStorage.removeItem(KEYS.aviationReview);
    return true;
  } catch {
    return false;
  }
}

export function loadPhotoFeedback() {
  return read(KEYS.photoFeedback, []);
}

export function savePhotoFeedback(records) {
  return write(KEYS.photoFeedback, records.slice(0, 50));
}

export function clearPhotoFeedback() {
  try {
    window.localStorage.removeItem(KEYS.photoFeedback);
    return true;
  } catch {
    return false;
  }
}

export function loadOnboarding() {
  return read(KEYS.onboarding, { completed: false });
}

export function saveOnboarding(value) {
  return write(KEYS.onboarding, value);
}
