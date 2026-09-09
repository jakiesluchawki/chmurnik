export const TURBULENCE_STORAGE = "chmurnik:turbulence-workshop:v1";
export const turbulenceSources = [
  { label: "NWS: przeszkody, konwekcja i uskok", url: "https://www.weather.gov/zme/safety_turb" },
  { label: "NWS: podłoże i przepływ", url: "https://www.weather.gov/source/zhu/ZHU_Training_Page/turbulence_stuff/turbulence/turbulence.htm" },
  { label: "FAA: Aviation Weather Handbook (2022), rozdział 19.2", url: "https://www.faa.gov/documentLibrary/media/Order/FAA-H-8083-28_Order_8083.28.pdf" },
];

export const turbulenceTrials = [
  {
    id: "terrain", title: "Co zmienia przeszkoda?", short: "Przeszkoda",
    setup: "Wiatr wieje z lewej. Podnieś przeszkodę w jego drodze. Ogrzewanie i dopływ powietrza pozostają takie same.",
    action: "Przeciągnij uchwyt podłoża w górę albo dotknij „Wysuń przeszkodę”.",
    question: "Gdzie spodziewasz się dodatkowych zawirowań względem gładkiego podłoża?",
    predictions: [
      ["before", "Przed przeszkodą, po stronie napływu"],
      ["lee", "Za przeszkodą, po stronie odpływu"],
      ["everywhere", "Jednakowo przed przeszkodą i za nią"],
      ["none", "Dopiero po ogrzaniu podłoża przez słońce"],
    ], correctPrediction: "lee",
    evidenceQuestion: "Który fragment porównania wskazuje działanie przeszkody?",
    evidence: [
      ["inlet", "Zmienił się kierunek wiatru dopływającego z lewej."],
      ["heat", "Nad ogrzewanym podłożem pojawił się pionowy prąd."],
      ["wake", "Przy tym samym napływie zmienił się tor za przeszkodą."],
    ], correctEvidence: "wake",
    explanation: "Przeszkoda odchyla przepływ, a po jej zawietrznej stronie mogą powstawać wiry. To mechanizm mechaniczny: w porównaniu zmieniliśmy tylko podłoże.",
    limit: "Gładka linia A jest punktem odniesienia, nie obietnicą spokojnego powietrza. Nie obliczamy zasięgu wirów, fal górskich ani intensywności turbulencji; znaczenie mają też wiatr i stabilność atmosfery.",
    hint: "Porównaj obszar przed przeszkodą i za nią. Sprawdź, czy warunki na wejściu do obu prób są te same.",
    source: 1,
  },
  {
    id: "thermal", title: "Czy potrzeba przeszkody?", short: "Ogrzewanie",
    setup: "Podłoże jest płaskie. Ogrzej jeden skrawek, pozostawiając otoczenie bez dodatkowego ogrzewania. Porównujemy początek ruchu przy ziemi.",
    action: "Dotknij słońca nad poletkiem. Każde naciśnięcie zmienia ogrzewanie; czwarty dotyk je wyłącza.",
    question: "Gdzie zacznie się unoszenie związane z tą zmianą?",
    predictions: [
      ["warm", "Nad skrawkiem, który ogrzewamy od dołu"],
      ["cool", "Nad otoczeniem bez dodatkowego ogrzewania"],
      ["uniform", "Jednakowo nad całą powierzchnią podłoża"],
      ["obstacle", "Dopiero po ustawieniu przeszkody na podłożu"],
    ], correctPrediction: "warm",
    evidenceQuestion: "Co odróżnia ten wynik od opływu przeszkody?",
    evidence: [
      ["surface", "Prąd wznoszący jest nad ogrzewanym skrawkiem płaskiej ziemi."],
      ["lee", "Wiry skupiają się za wysoką przeszkodą na płaskiej ziemi."],
      ["layer", "Dwie warstwy mają różne poziome kierunki przepływu."],
    ], correctEvidence: "surface",
    explanation: "Podłoże przekazuje ciepło powietrzu. Cieplejsza porcja może zacząć się unosić, a obok występuje ruch kompensujący w dół. To początek konwekcji, a nie opływ przeszkody.",
    limit: "Konwekcja może zachodzić bez chmur. Dalej w górze jej rozwój zależy od profilu temperatury i wilgotności. Rysunek nie określa wysokości termiki, prędkości wznoszenia ani czasu ogrzewania.",
    hint: "Znajdź miejsce, w którym dodaliśmy ciepło. Porównaj ruch tam i nad sąsiednim podłożem.",
    source: 2,
  },
  {
    id: "shear", title: "Ta sama prędkość. Ten sam wiatr?", short: "Dwie warstwy",
    setup: "Dół: 200 m, wiatr z zachodu 10 kt. Góra: 600 m, również 10 kt. Zmień tylko kierunek górnego wiatru. To zadane dane szkoleniowe.",
    action: "Obróć uchwyt górnej strzałki lub dotknij „Wiatr górą z północy”. Długość w tym porównaniu pozostaje taka sama.",
    question: "Po zmianie kierunku tylko górnej warstwy: co powiesz o wietrze na tych dwóch poziomach?",
    predictions: [
      ["equal", "Jest jednakowy, bo obie prędkości nadal wynoszą 10 kt."],
      ["speed", "Różni się prędkością, choć oba wskazania wynoszą 10 kt."],
      ["direction", "Różni się kierunkiem mimo jednakowej prędkości 10 kt."],
      ["cloud", "Porównanie jest możliwe dopiero po pojawieniu się chmur."],
    ], correctPrediction: "direction",
    evidenceQuestion: "Które dane potwierdzają różnicę wiatru?",
    evidence: [
      ["length", "Strzałki są równoległe, lecz mają różne długości."],
      ["vectors", "Strzałki mają równe długości, lecz inne kierunki."],
      ["height", "Same wysokości 200 i 600 m, bez odczytu strzałek."],
    ], correctEvidence: "vectors",
    explanation: "Wiatr ma prędkość i kierunek. Różnica między poziomami to pionowy uskok wiatru, także wtedy, gdy prędkości są równe. W eksploracji sprawdź drugi przypadek: ten sam kierunek, ale różne prędkości.",
    limit: "Różnica wektorów opisuje te dwa poziomy. Nie znamy zmian pomiędzy nimi ani stabilności powietrza. Sam uskok nie określa pewnego wystąpienia ani siły turbulencji. Nie rysujemy wymyślonych wirów na podstawie samej różnicy.",
    hint: "Porównaj osobno długości i kierunki strzałek, a nie tylko liczby przy nich.",
    source: 0,
  },
];

const finite = (value, min, max) => Number.isFinite(value) && value >= min && value <= max;
const clamp = (value, min, max) => Number.isFinite(value) ? Math.max(min, Math.min(max, value)) : min;
export const initialTurbulenceInputs = () => ({ roughness: 0, heat: 0, side: "left", upperSpeed: 10, upperFrom: 270 });
export function validTurbulenceInputs(value) {
  return value && finite(value.roughness, 0, 100) && Number.isInteger(value.heat) && finite(value.heat, 0, 3)
    && ["left", "right"].includes(value.side) && finite(value.upperSpeed, 0, 30) && finite(value.upperFrom, 0, 360);
}
export function readyToPredict(trialId, inputs) {
  if (!validTurbulenceInputs(inputs)) return false;
  if (trialId === "terrain") return inputs.roughness > 0;
  if (trialId === "thermal") return inputs.heat > 0;
  return trialId === "shear" && inputs.upperSpeed === 10 && inputs.upperFrom !== 270;
}

// Coordinates below are a qualitative drawing, never metres, seconds or wind speed.
export function mechanicalTrace(roughness, lane = 0) {
  const amount = clamp(roughness, 0, 100) / 100;
  return Array.from({ length: 81 }, (_, i) => {
    const x = 4 + i * 1.15, base = 40 + lane * 12;
    const lift = x > 17 && x < 49 ? Math.sin((x - 17) / 32 * Math.PI) ** 2 * amount * 24 : 0;
    const wake = x > 49 ? Math.sin((x - 49) / 6) * Math.sin(Math.min(1, (x - 49) / 8) * Math.PI / 2) * Math.exp(-(x - 49) / 40) * amount * (3 + lane * 2) : 0;
    return { x, y: base - lift + wake };
  });
}
export function thermalDrawing(heat, side) {
  const amount = clamp(heat, 0, 3) / 3;
  const x = side === "right" ? 72 : 28, neighbor = 100 - x;
  const top = 67 - amount * 42;
  return {
    amount, x, neighbor, top,
    up: `M ${x} 72 C ${x - 6} 57 ${x + 6} ${top + 12} ${x} ${top}`,
    down: `M ${neighbor} ${top} C ${neighbor + 8} ${top + 12} ${neighbor - 8} 57 ${neighbor} 72`,
  };
}
export function windVector(speed, from) {
  if (!finite(speed, 0, 30) || !finite(from, 0, 360)) return null;
  const radians = from * Math.PI / 180;
  const clean = value => Math.abs(value) < 1e-10 ? 0 : value;
  return { east: clean(-speed * Math.sin(radians)), north: clean(-speed * Math.cos(radians)) };
}
export function layerDifference(upperSpeed, upperFrom) {
  const upper = windVector(upperSpeed, upperFrom), lower = windVector(10, 270);
  if (!upper) return null;
  const east = upper.east - lower.east, north = upper.north - lower.north;
  return { upper, lower, east, north, magnitude: Math.hypot(east, north), heightDifference: 400 };
}
export function windFromPointer(x, y, { left, top, width, height }, fixedSpeed = false) {
  if (![x, y, left, top, width, height].every(Number.isFinite) || width <= 0 || height <= 0) return null;
  const east = (x - left) / width * 100 - 50, north = 50 - (y - top) / height * 100;
  const radius = Math.hypot(east, north);
  const upperFrom = (Math.round((Math.atan2(-east, -north) * 180 / Math.PI + 360) / 15) * 15) % 360;
  return { upperFrom: radius < 2 ? 270 : upperFrom, upperSpeed: fixedSpeed ? 10 : Math.round(clamp(radius / 1.2, 0, 30) / 5) * 5 };
}

export const turbulenceTrial = id => turbulenceTrials.find(trial => trial.id === id);
export const activeTurbulenceAttempt = state => state.attempts.find(attempt => attempt.id === state.activeId);
export function initialTurbulenceState() {
  return { revision: 1, trialId: "terrain", inputs: initialTurbulenceInputs(), activeId: null, attempts: [], exposed: [], helped: false };
}
export function updateTurbulence(state, action) {
  const trial = turbulenceTrial(state.trialId), active = activeTurbulenceAttempt(state);
  const editAttempt = patch => ({ ...state, attempts: state.attempts.map(attempt => attempt.id === state.activeId ? { ...attempt, ...patch } : attempt) });
  if (action.type === "inputs") {
    const inputs = { ...state.inputs, ...action.value };
    return !active && validTurbulenceInputs(inputs) ? { ...state, inputs } : state;
  }
  if (action.type === "predict") {
    if (active || !readyToPredict(trial.id, state.inputs) || !trial.predictions.some(([id]) => id === action.value)
      || typeof action.id !== "string" || !action.id || state.attempts.some(attempt => attempt.id === action.id)) return state;
    return { ...state, activeId: action.id, attempts: [...state.attempts, {
      id: action.id, trialId: trial.id, inputs: { ...state.inputs }, prediction: action.value,
      predictionHelped: state.helped || state.exposed.includes(trial.id),
      repeated: state.attempts.some(attempt => attempt.trialId === trial.id),
      observed: false, evidence: null, evidenceHelped: null, helped: state.helped || state.exposed.includes(trial.id),
    }] };
  }
  if (action.type === "observe") return active && !active.observed ? editAttempt({ observed: true }) : state;
  if (action.type === "evidence") {
    return active?.observed && !active.evidence && trial.evidence.some(([id]) => id === action.value)
      ? editAttempt({ evidence: action.value, evidenceHelped: active.helped }) : state;
  }
  if (action.type === "help") {
    const exposed = [...new Set([...state.exposed, action.trialId || state.trialId])].filter(id => turbulenceTrial(id));
    const relevant = !action.trialId || action.trialId === state.trialId;
    const helped = relevant && active && !active.evidence ? editAttempt({ helped: true }) : state;
    return { ...helped, exposed, helped: state.helped || relevant };
  }
  if (action.type === "select" && turbulenceTrial(action.trialId)) {
    if (state.trialId === action.trialId && !action.repeat) return state;
    return { ...state, trialId: action.trialId, inputs: initialTurbulenceInputs(), activeId: null,
      helped: state.exposed.includes(action.trialId) || state.attempts.some(attempt => attempt.trialId === action.trialId) };
  }
  return state;
}

export function restoreTurbulenceState(value) {
  if (!value || value.revision !== 1 || !turbulenceTrial(value.trialId) || !validTurbulenceInputs(value.inputs) || !Array.isArray(value.attempts)) return initialTurbulenceState();
  const seen = new Set();
  const attempts = value.attempts.filter(attempt => {
    const trial = turbulenceTrial(attempt?.trialId);
    if (!trial || typeof attempt.id !== "string" || !attempt.id || seen.has(attempt.id) || !validTurbulenceInputs(attempt.inputs)
      || !readyToPredict(trial.id, attempt.inputs) || !trial.predictions.some(([id]) => id === attempt.prediction)
      || ![attempt.predictionHelped, attempt.repeated, attempt.observed, attempt.helped].every(item => typeof item === "boolean")
      || (attempt.evidence !== null && (!attempt.observed || !trial.evidence.some(([id]) => id === attempt.evidence)))
      || (attempt.evidence === null ? attempt.evidenceHelped !== null : typeof attempt.evidenceHelped !== "boolean")) return false;
    seen.add(attempt.id); return true;
  }).map(attempt => ({ ...attempt, inputs: { ...attempt.inputs } }));
  const active = attempts.find(attempt => attempt.id === value.activeId && attempt.trialId === value.trialId);
  return { revision: 1, trialId: value.trialId, inputs: active ? { ...active.inputs } : { ...value.inputs }, activeId: active?.id || null, attempts,
    exposed: Array.isArray(value.exposed) ? [...new Set(value.exposed.filter(id => turbulenceTrial(id)))] : [], helped: value.helped === true };
}

// All mutations read the latest saved state. Failed storage retains a session copy.
export function createTurbulenceStore(storage) {
  let memory = initialTurbulenceState(), durable = Boolean(storage), memoryOnly = false;
  function load() {
    if (!memoryOnly && storage) {
      try {
        const raw = storage.getItem(TURBULENCE_STORAGE);
        if (raw) memory = restoreTurbulenceState(JSON.parse(raw));
      } catch { durable = false; memoryOnly = true; }
    }
    return structuredClone(memory);
  }
  return {
    load,
    get durable() { return durable; },
    apply(action, expected) {
      const current = load();
      if (expected && (expected.trialId !== current.trialId || expected.activeId !== current.activeId)) return current;
      memory = updateTurbulence(current, action);
      try {
        if (!storage) throw new Error("No local storage");
        storage.setItem(TURBULENCE_STORAGE, JSON.stringify(memory)); durable = true; memoryOnly = false;
      } catch { durable = false; memoryOnly = true; }
      return structuredClone(memory);
    },
  };
}
