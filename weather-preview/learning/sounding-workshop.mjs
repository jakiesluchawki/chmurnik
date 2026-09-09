import { soundingScenarios } from "./science.mjs";

export const SOUNDING_WORKSHOP_KEY = "chmurnik:sounding-workshop:v1";
export const soundingProfile = soundingScenarios.find(profile => profile.id === "capped-warm-sector");
export const soundingSources = {
  axes: { label: "NWS: linie i ograniczenia sondażu", url: "https://www.weather.gov/source/zhu/ZHU_Training_Page/convective_parameters/skewt/skewtinfo.html" },
  moisture: { label: "NOAA JetStream: temperatura i punkt rosy", url: "https://www.noaa.gov/jetstream/upperair/skew-t-plots" },
  inversion: { label: "NWS: warstwa inwersji", url: "https://www.weather.gov/source/zhu/ZHU_Training_Page/clouds/stratus_form_dissipate/Marine_Layer.html" },
  wind: { label: "NWS: kierunek wiatru", url: "https://forecast.weather.gov/glossary.php?word=WIND" },
  faa: { label: "FAA: Aviation Weather Handbook, 2026", url: "https://www.faa.gov/regulationspolicies/handbooksmanuals/aviation/faa-h-8083-28b-aviation-weather-handbook" },
};
const options = (...items) => items.map(([id, label]) => ({ id, label }));

export const soundingStages = [
  {
    id: "level", short: "Jeden poziom", title: "Najpierw znajdź jeden odczyt",
    intro: "Wskaż 850 hPa na wykresie. hPa to hektopaskale: jednostka ciśnienia, nie metry. Mniejsze ciśnienie jest wyżej.",
    instruction: "Przeczytaj temperaturę wybranego punktu: w prawo jest cieplej. Nie zmieniasz powietrza, tylko miejsce odczytu.",
    pressures: [1000, 925, 850], start: 1000, target: 850, required: [850], fields: ["temperature"], domain: [0, 35], single: true, source: "axes",
    question: "Jaka jest temperatura otoczenia na 850 hPa?",
    choices: options(["27", "27°C"], ["13", "13°C"], ["18", "18°C"], ["20", "20°C"]), answer: "18",
    reasonQuestion: "Jak połączyłeś obie osie?",
    reasons: options(["same-row", "Poziom z osi ciśnienia, temperaturę z punktu na tej samej poziomej linii."], ["surface", "Poziom z osi ciśnienia, temperaturę z najniższego punktu profilu."], ["pressure", "Liczbę przy wybranym poziomie potraktowałem jako temperaturę."]), reason: "same-row",
    hint: "Wybierz 850 hPa po lewej. Idź poziomo do punktu T, a potem odczytaj jego położenie na osi °C.",
    conclusion: ["Na 850 hPa jest 18°C. Liczba 850 opisuje ciśnienie, a nie temperaturę ani wysokość w metrach.", "Wybór innego poziomu nie ogrzewa powietrza. Odsłaniasz inny wiersz tego samego, syntetycznego profilu."],
  },
  {
    id: "moisture", short: "Punkt rosy", title: "Ile brakuje do nasycenia?",
    intro: "T to temperatura powietrza, Td to punkt rosy: temperatura, do której trzeba je schłodzić do nasycenia bez zmiany zawartości pary i ciśnienia.",
    instruction: "Porównaj 925 i 800 hPa. Wskaż oba poziomy i odejmij Td od T osobno na każdym z nich.",
    pressures: [1000, 925, 850, 800, 700], start: 925, target: 800, required: [925, 800], reference: 925, fields: ["temperature", "dewpoint"], domain: [-5, 35], source: "moisture",
    question: "Jakie są odstępy T − Td na 925 i 800 hPa?",
    choices: options(["reversed", "925 hPa: 12°C; 800 hPa: 5°C"], ["sum", "925 hPa: 39°C; 800 hPa: 28°C"], ["cross", "925 hPa: 14°C; 800 hPa: 3°C"], ["gaps", "925 hPa: 5°C; 800 hPa: 12°C"]), answer: "gaps",
    reasonQuestion: "Które porównanie wspiera ten odczyt?",
    reasons: options(["temperature-only", "Wybieram cieplejszy poziom, nie potrzebuję jego punktu rosy."], ["gap", "Porównuję T minus Td na każdym poziomie, nie same temperatury."], ["dewpoint-only", "Porównuję punkty rosy bez uwzględnienia temperatur powietrza."]), reason: "gap",
    hint: "Dla 925 hPa odejmij 17 od 22. Dla 800 hPa odejmij 8 od 20. Mniejszy odstęp oznacza mniej chłodzenia do nasycenia.",
    conclusion: ["Na 925 hPa odstęp wynosi 5°C, na 800 hPa 12°C. Pierwszy poziom wymaga mniej chłodzenia do nasycenia przy zachowaniu tych założeń.", "Bliskość T i Td jest wskazówką wilgotności. Nie rysujemy na tej podstawie pewnej chmury, jej gatunku ani pułapu; ten profil nie jest obserwacją nieba."],
  },
  {
    id: "inversion", short: "Dwa poziomy", title: "Co zmienia się w drodze ku górze?",
    intro: "Śledź teraz tylko temperaturę otoczenia. Odcinek linii łączy dane z dwóch poziomów, nie pokazuje ruchu pojedynczej porcji.",
    instruction: "Wskaż 850, potem 800 hPa. Który z tych poziomów jest wyżej i co dzieje się tam z temperaturą?",
    pressures: [1000, 925, 850, 800, 700], start: 850, target: 800, required: [850, 800], reference: 850, fields: ["temperature"], domain: [0, 35], source: "inversion",
    question: "Między 850 a 800 hPa temperatura…",
    choices: options(["rises", "rośnie ku górze"], ["falls", "maleje ku górze"], ["equal", "pozostaje taka sama"], ["time", "zmienia się w czasie w jednym miejscu"]), answer: "rises",
    reasonQuestion: "Który dowód określa zmianę w pionie?",
    reasons: options(["pressure-warm", "Większa liczba hPa zawsze oznacza wyższą temperaturę."], ["time-axis", "Oś pionowa porządkuje kolejne chwile pomiaru."], ["higher-warmer", "Na wyższym poziomie 800 hPa odczytuję 20°C, a niżej 18°C."]), reason: "higher-warmer",
    hint: "800 hPa jest wyżej niż 850 hPa. Porównaj temperatury 20°C i 18°C, a nie sam kierunek ruchu kursora.",
    conclusion: ["Przechodzisz z 18°C na 850 hPa do 20°C na 800 hPa. Wzrost temperatury z wysokością to inwersja; różnica między tymi próbkami wynosi 2°C.", "Taka warstwa ogranicza mieszanie pionowe. Z dwóch próbek nie wyznaczasz jednak dokładnych granic warstwy w metrach ani czasu jej zaniku."],
  },
  {
    id: "parcel", short: "Porcja", title: "Porównuj na tym samym poziomie",
    intro: "Przerywana linia to temperatura umownie unoszonej porcji. To gotowe dane dydaktyczne, nie pomiar drugiego termometru ani nowy rachunek unoszenia.",
    instruction: "Porównaj porcję z otoczeniem na 700 i 500 hPa. Minus w temperaturze nie oznacza jeszcze, że porcja jest chłodniejsza od otoczenia.",
    pressures: [1000, 850, 800, 700, 600, 500], start: 700, target: 500, required: [700, 500], reference: 700, fields: ["temperature", "parcel"], domain: [-15, 35], source: "axes",
    question: "Gdzie porcja jest cieplejsza od swojego otoczenia?",
    choices: options(["both", "Na obu porównywanych poziomach"], ["500", "Tylko na 500 hPa"], ["700", "Tylko na 700 hPa"], ["neither", "Na żadnym z tych poziomów"]), answer: "500",
    reasonQuestion: "Jak zachować uczciwe porównanie?",
    reasons: options(["surface", "Porównuję każdą temperaturę porcji z temperaturą przy powierzchni."], ["zero", "Sprawdzam, czy temperatura porcji jest powyżej zera stopni."], ["same-pressure", "Zestawiam porcję i otoczenie przy tym samym ciśnieniu, także poniżej zera."]), reason: "same-pressure",
    hint: "Na 500 hPa −7°C jest wyższą temperaturą niż −8°C. Na 700 hPa zestaw ze sobą 8°C i 9°C.",
    conclusion: ["Na 700 hPa porcja ma 8°C, otoczenie 9°C. Na 500 hPa porcja ma −7°C, otoczenie −8°C. Relacja zmienia znak: porcja jest tam o 1°C cieplejsza.", "To tylko porównanie temperatur. Nie obliczamy rzeczywistej wyporności, energii CAPE, hamowania CIN ani toru porcji; nie wynika stąd gwarancja burzy."],
  },
  {
    id: "wind", short: "Wiatr", title: "Wiatr też ma swój poziom",
    intro: "Kierunek „z” mówi, skąd wieje: 180° to z południa. kt oznacza węzły, jednostkę prędkości, a nie stopnie.",
    instruction: "Wskaż 925 i 700 hPa. Czy zmienia się kierunek, prędkość, czy obie wartości? Czytaj wiatr obok właściwego poziomu.",
    pressures: [1000, 925, 850, 800, 700], start: 925, target: 700, required: [925, 700], reference: 925, fields: ["temperature"], domain: [0, 35], wind: true, source: "wind",
    question: "Od 925 do 700 hPa wiatr…",
    choices: options(["direction", "zmienia kierunek, zachowuje prędkość"], ["slower", "słabnie i zmienia kierunek"], ["both", "przyspiesza i zmienia kierunek"], ["speed", "przyspiesza, zachowuje kierunek"]), answer: "both",
    reasonQuestion: "Na których danych opierasz odpowiedź?",
    reasons: options(["paired-wind", "Na kierunku i prędkości odczytanych osobno na 925 oraz 700 hPa."], ["temperature", "Na nachyleniu linii temperatury między wybranymi poziomami."], ["one-level", "Na samym kierunku na 700 hPa, bez wcześniejszego odczytu."]), reason: "paired-wind",
    hint: "Na 925 hPa: z 170° przy 14 kt. Na 700 hPa: z 225° przy 34 kt. Sprawdź obie pary, nie tylko większą liczbę.",
    conclusion: ["Prędkość rośnie z 14 do 34 kt, a kierunek zmienia się ze 170° na 225°. Liczby kierunku określają napływ, nie kierunek, w którym leci balon.", "Zmianę wiatru w pionie nazywamy uskokiem. Same te dwa odczyty nie wyznaczają intensywności turbulencji ani bezpieczeństwa lotu."],
  },
  {
    id: "skew", short: "Pochylone osie", title: "Inny rysunek, jakie odczyty?",
    intro: "Znane dane pokażemy teraz na pełnym zakresie 1000–200 hPa. Odstępy na osi ciśnienia są logarytmiczne: równe odcinki rysunku nie oznaczają równych różnic hPa.",
    instruction: "Wybierz 500 hPa. Przewidź efekt pochylenia osi, zapisz wybór, a dopiero potem przełącz widok i odczytaj punkt ponownie.",
    pressures: soundingProfile.profile.map(row => row.pressure), start: 500, target: 500, required: [500], fields: ["temperature", "dewpoint", "parcel"], domain: [-70, 35], source: "axes",
    question: "Co odczytasz po pochyleniu osi na 500 hPa?",
    choices: options(["warmer", "Wyższą temperaturę otoczenia, ten sam punkt rosy"], ["colder", "Niższą temperaturę otoczenia, niższy punkt rosy"], ["pressure", "Te same temperatury, ale inne ciśnienie poziomu"], ["unchanged", "Te same temperatury i to samo ciśnienie"]), answer: "unchanged",
    reasonQuestion: "Co należy uwzględnić przy odczycie pochylonej siatki?",
    reasons: options(["vertical", "Zawsze schodzę pionowo od punktu do dolnej osi temperatury."], ["isotherm", "Śledzę linię stałej temperatury: po pochyleniu nie jest pionowa."], ["right", "Każde przesunięcie punktu w prawo uznaję za ogrzanie powietrza."]), reason: "isotherm",
    hint: "Przełącznik przerysowuje ten sam wiersz. Linia stałej temperatury też się pochyla; nie rzutuj punktu pionowo na dolną skalę.",
    conclusion: ["Na 500 hPa pozostają: T = −8°C, Td = −18°C, porcja = −7°C. Zmieniło się położenie punktów i linii stałej temperatury, nie powietrze.", "To wprowadzenie do Skew-T/log-p: pochylonej temperatury i logarytmicznego ciśnienia. Pomijamy siatkę adiabatyczną i stosunku zmieszania. Nie jest to pełny diagram do analizy operacyjnej."],
  },
];

export function soundingRow(pressure) {
  const row = soundingProfile.profile.find(row => row.pressure === pressure);
  return row ? { ...row, spread: row.temperature - row.dewpoint, parcelDifference: row.parcel - row.temperature } : null;
}
export const soundingPlot = { left: 58, right: 410, top: 30, bottom: 238, width: 440, height: 286 };
export function soundingPoint(temperature, pressure, stage, skew = false) {
  const lower = Math.max(...stage.pressures), upper = Math.min(...stage.pressures);
  if (!Number.isFinite(temperature) || !Number.isFinite(pressure) || pressure < upper || pressure > lower) return null;
  const fraction = Math.log(lower / pressure) / Math.log(lower / upper);
  const [min, max] = stage.domain;
  return { x: soundingPlot.left + (temperature - min) / (max - min) * 282 + (skew ? fraction * 70 : 0),
    y: soundingPlot.bottom - fraction * (soundingPlot.bottom - soundingPlot.top) };
}
export function levelAtPlotY(stage, value) {
  // Allow floating-point roundoff in viewport-to-SVG conversion, not extra levels.
  if (!Number.isFinite(value) || value < soundingPlot.top - 1e-8 || value > soundingPlot.bottom + 1e-8) return null;
  return stage.pressures.reduce((best, pressure) => Math.abs(soundingPoint(0, pressure, stage).y - value) < Math.abs(soundingPoint(0, best, stage).y - value) ? pressure : best);
}
export function keyboardLevel(stage, pressure, key) {
  const index = stage.pressures.indexOf(pressure);
  if (index < 0) return null;
  if (key === "Home") return stage.pressures[0];
  if (key === "End") return stage.pressures.at(-1);
  const step = { ArrowUp: 1, ArrowRight: 1, ArrowDown: -1, ArrowLeft: -1, PageUp: 2, PageDown: -2 }[key];
  return step === undefined ? null : stage.pressures[Math.max(0, Math.min(stage.pressures.length - 1, index + step))];
}

const newAttempt = (stage, number, repeated = false) => ({ number, pressure: stage.start, seen: [stage.start], projection: "straight", skewSeen: false,
  decision: null, reason: null, committed: false, explained: false, help: repeated, hint: false, decisionHelped: null, reasonHelped: null, repeated });
export function initialSoundingWorkshop() {
  return { version: 1, mode: "guide", stageIndex: 0, serial: 1, attempt: newAttempt(soundingStages[0], 1), first: {}, history: [] };
}
export function soundingReady(stage, attempt) {
  return attempt.pressure === stage.target && stage.required.every(pressure => attempt.seen.includes(pressure));
}
function snapshot(stage, attempt) {
  return { stageId: stage.id, number: attempt.number, pressure: attempt.pressure, decision: attempt.decision, reason: attempt.explained ? attempt.reason : null,
    decisionHelped: attempt.decisionHelped, reasonHelped: attempt.reasonHelped, repeated: attempt.repeated };
}
export function updateSoundingWorkshop(state, action) {
  const stage = soundingStages[state.stageIndex], a = state.attempt;
  let next = a;
  if (action.type === "mode" && ["guide", "explore", "assessment"].includes(action.mode)) {
    return { ...state, mode: action.mode, attempt: action.mode === "explore" ? { ...a, help: true } : a };
  }
  if (action.type === "stage" && Number.isInteger(action.index) && soundingStages[action.index]) {
    return { ...state, stageIndex: action.index, serial: state.serial + 1,
      attempt: newAttempt(soundingStages[action.index], state.serial + 1, Boolean(state.first[soundingStages[action.index].id])) };
  }
  if (action.type === "help") next = { ...a, help: true, hint: a.hint || action.hint === true };
  if (action.type === "level" && !a.committed && stage.pressures.includes(action.pressure)) next = { ...a, pressure: action.pressure, seen: [...new Set([...a.seen, action.pressure])], decision: null };
  if (action.type === "decision" && !a.committed && stage.choices.some(option => option.id === action.value)) next = { ...a, decision: action.value };
  if (action.type === "commit" && !a.committed && a.decision && soundingReady(stage, a)) {
    next = { ...a, committed: true, decisionHelped: a.help };
    const record = snapshot(stage, next);
    return { ...state, attempt: next, first: state.first[stage.id] ? state.first : { ...state.first, [stage.id]: record }, history: [...state.history, record].slice(-60) };
  }
  if (action.type === "projection" && stage.id === "skew" && a.committed && ["straight", "skew"].includes(action.value)) next = { ...a, projection: action.value, skewSeen: a.skewSeen || action.value === "skew" };
  if (action.type === "reason" && a.committed && !a.explained && stage.reasons.some(option => option.id === action.value)) next = { ...a, reason: action.value };
  if (action.type === "explain" && a.committed && !a.explained && a.reason && (stage.id !== "skew" || a.skewSeen)) {
    next = { ...a, explained: true, reasonHelped: a.help };
    const record = snapshot(stage, next);
    return { ...state, attempt: next, first: state.first[stage.id]?.number === a.number ? { ...state.first, [stage.id]: record } : state.first,
      history: state.history.map(item => item.number === a.number ? record : item) };
  }
  return next === a ? state : { ...state, attempt: next };
}

function validRecord(record, stage) {
  return record && stage && record.stageId === stage.id && Number.isSafeInteger(record.number) && record.number > 0 && record.pressure === stage.target
    && stage.choices.some(option => option.id === record.decision) && (record.reason === null || stage.reasons.some(option => option.id === record.reason))
    && typeof record.decisionHelped === "boolean" && typeof record.repeated === "boolean"
    && (record.reason === null ? record.reasonHelped === null : typeof record.reasonHelped === "boolean");
}
export function restoreSoundingWorkshop(value) {
  const fallback = initialSoundingWorkshop;
  if (!value || value.version !== 1 || !["guide", "explore", "assessment"].includes(value.mode)
    || !Number.isInteger(value.stageIndex) || !soundingStages[value.stageIndex] || !Number.isSafeInteger(value.serial) || value.serial < 1) return fallback();
  const stage = soundingStages[value.stageIndex], a = value.attempt;
  if (!a || a.number !== value.serial || !stage.pressures.includes(a.pressure) || !Array.isArray(a.seen) || !a.seen.every(p => stage.pressures.includes(p))
    || !["straight", "skew"].includes(a.projection) || (stage.id !== "skew" && a.projection !== "straight")
    || !["committed", "explained", "help", "hint", "skewSeen", "repeated"].every(key => typeof a[key] === "boolean")
    || (a.decision !== null && !stage.choices.some(option => option.id === a.decision)) || (a.reason !== null && !stage.reasons.some(option => option.id === a.reason))
    || (a.committed ? !a.decision || !soundingReady(stage, a) || typeof a.decisionHelped !== "boolean" : a.reason !== null || a.decisionHelped !== null || a.explained)
    || (a.explained ? !a.reason || typeof a.reasonHelped !== "boolean" || (stage.id === "skew" && !a.skewSeen) : a.reasonHelped !== null)
    || (a.projection === "skew" && (!a.committed || !a.skewSeen)) || (a.hint && !a.help)) return fallback();
  const first = {};
  for (const item of soundingStages) if (validRecord(value.first?.[item.id], item)) first[item.id] = { ...value.first[item.id] };
  const history = Array.isArray(value.history) ? value.history.filter(record => validRecord(record, soundingStages.find(item => item.id === record?.stageId))).slice(-60) : [];
  return { version: 1, mode: value.mode, stageIndex: value.stageIndex, serial: value.serial, attempt: { ...a, seen: [...a.seen] }, first, history };
}
function browserStorage() { try { return globalThis.localStorage; } catch { return null; } }
export function loadSoundingWorkshop(storage = browserStorage()) {
  try { return restoreSoundingWorkshop(JSON.parse(storage?.getItem(SOUNDING_WORKSHOP_KEY) || "null")); } catch { return initialSoundingWorkshop(); }
}
export function saveSoundingWorkshop(state, storage = browserStorage()) {
  try { if (!storage) return false; storage.setItem(SOUNDING_WORKSHOP_KEY, JSON.stringify(state)); return true; } catch { return false; }
}
