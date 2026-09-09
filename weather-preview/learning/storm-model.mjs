import { dewPoint } from "../model.mjs";

// Synthetic teaching profiles, not observations or a storm forecast.
export const stormProfiles = {
  cap: [[0, 26], [500, 21.8], [800, 19.5], [1200, 20.5], [1800, 17], [2500, 9], [3000, 3], [4000, -6], [5000, -14]],
  open: [[0, 26], [500, 21], [1000, 16], [1500, 11], [2500, 1], [3500, -9], [5000, -22]],
  new: [[0, 26], [600, 20], [1000, 18], [1500, 17], [2200, 13], [3000, 6], [4000, -4], [5000, -15]],
};
export const stormTrials = [
  { id: "a", name: "Próba A", title: "Czy sama chmura wystarczy?", instruction: "Unieś porcję w okolice 1500 m. Zanim ją puścisz, porównaj obie temperatury na tej wysokości i przewidź kierunek ruchu.", profile: "cap", humidity: 70, target: 1500, guide: true },
  { id: "b", name: "Próba B", title: "Daj tej samej porcji mocniejszy impuls", instruction: "Warunki są takie same jak w próbie A. Zmieniasz tylko wysokość wymuszonego uniesienia: tym razem około 3000 m. Czy po puszczeniu wynik będzie taki sam?", profile: "cap", humidity: 70, target: 3000, guide: true },
  { id: "c", name: "Próba C", title: "A gdy zmieni się otoczenie?", instruction: "Wróć w okolice 1500 m. Porcja ma tę samą wilgotność, ale nad ziemią nie ma już cieplejszej warstwy. Porównaj ten wynik z próbą A.", profile: "open", humidity: 70, target: 1500, guide: true },
  { id: "d", name: "Nowy przypadek 1", title: "Zdecyduj na podstawie nowych danych", instruction: "Masz inny profil temperatury i wilgotność 55%. Unieś porcję w okolice 2200 m. Sama obecność chmury nie rozstrzyga odpowiedzi: sprawdź dane i postaw własną hipotezę.", profile: "new", humidity: 55, target: 2200, guide: false },
  { id: "e", name: "Nowy przypadek 2", title: "Sprawdź, czy rozumiesz zależność", instruction: "Wilgotność nadal wynosi 55%, ale otoczenie ochładza się szybciej z wysokością. Zbadaj okolice 1800 m i przewidź początkową reakcję porcji po puszczeniu.", profile: "open", humidity: 55, target: 1800, guide: false },
];

export function environmentAt(profile, height) {
  const points = stormProfiles[profile] || stormProfiles.cap;
  const h = Math.max(0, Math.min(5000, Number(height) || 0));
  const upper = points.findIndex(([z]) => z >= h);
  if (upper <= 0) return points[0][1];
  const [z0, t0] = points[upper - 1], [z1, t1] = points[upper];
  return t0 + (t1 - t0) * (h - z0) / (z1 - z0);
}
export function stormParcel(profile, humidity, height) {
  const h = Math.max(0, Math.min(5000, Number(height) || 0));
  const rh = Math.max(20, Math.min(100, Number(humidity) || 70));
  const base = 125 * (26 - dewPoint(26, rh));
  const temperature = 26 - 9.8 * Math.min(h, base) / 1000 - 6 * Math.max(0, h - base) / 1000;
  const environment = environmentAt(profile, h);
  const difference = temperature - environment;
  return { height: h, base, temperature, environment, difference,
    tendency: Math.abs(difference) <= 0.2 ? "still" : difference > 0 ? "up" : "down",
    opacity: Math.max(0, Math.min(1, (h - base) / 450)) };
}

export function initialResponse(profile, humidity, height) {
  const initial = stormParcel(profile, humidity, height);
  const direction = initial.tendency === "up" ? 1 : initial.tendency === "down" ? -1 : 0;
  let end = initial.height;
  // Short illustrative displacement only: no real speed, duration or cloud-top prediction.
  for (let i = 0; i < 20 && direction; i++) {
    const next = Math.max(0, Math.min(5000, end + direction * 10));
    if (stormParcel(profile, humidity, next).tendency !== initial.tendency) break;
    end = next;
  }
  return { ...initial, end };
}

export function inTrialWindow(trial, height) { return Math.abs(height - trial.target) <= 100; }
export function appendStormAttempt(history, record) {
  return [...history, { ...record, attempt: history.filter(item => item.trial === record.trial).length + 1 }];
}
export function recordStormEvidence(history, id, evidence, evidenceCorrect, evidenceHelped) {
  return history.map(record => record.id === id && record.evidence === undefined
    ? { ...record, evidence, evidenceCorrect, evidenceHelped } : record);
}
export function illustrativeProgress(value) {
  const fraction = Math.max(0, Math.min(1, value));
  return fraction * fraction * (3 - 2 * fraction);
}
