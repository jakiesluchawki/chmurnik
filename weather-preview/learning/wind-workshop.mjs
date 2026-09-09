export const windSources = [
  { label: "WMO: kierunek ruchu chmur i kierunek wiatru", url: "https://cloudatlas.wmo.int/en/direction-and-speed-of-movement.html" },
  { label: "WMO: chmury w stojących falach górskich", url: "https://cloudatlas.wmo.int/en/orographic-influence-on-the-leeward-side.html" },
  { label: "NWS: definicja kierunku wiatru", url: "https://marine.weather.gov/glossary.php?word=wind+direction" },
  { label: "NWS: odtwarzanie chmury w przepływie falowym", url: "https://www.weather.gov/abq/features_acsl" },
];

export const windStations = [
  {
    id: "drift", title: "Śledź jedną warstwę",
    task: "Obejrzyj początek i koniec. Śledź znacznik 1 względem siatki, a potem nazwij wiatr.",
    lower: 90, upper: null, question: "Skąd napływa powietrze w tej warstwie?", correct: "270",
    options: [["0", "Z północy"], ["45", "Z północnego wschodu"], ["90", "Ze wschodu"], ["135", "Z południowego wschodu"], ["180", "Z południa"], ["225", "Z południowego zachodu"], ["270", "Z zachodu"], ["315", "Z północnego zachodu"]],
    evidenceQuestion: "Co zmieniło się między początkiem a końcem?", correctEvidence: "east",
    evidenceOptions: [["west", "Znacznik 1 przesunął się na zachód"], ["east", "Znacznik 1 przesunął się na wschód"], ["still", "Znacznik 1 pozostał w tym samym miejscu"]],
    explanation: "Oznaczony fragment przesunął się na wschód. Przy założeniu prostego dryfu przybliżasz więc wiatr napływający z zachodu. Nazwa wiatru opisuje źródło napływu, a nie cel ruchu.",
    evidence: "Siatka i północ pozostają na miejscu. Obserwacja dotyczy poziomu chmury, nie wiatru przy ziemi. Bez skali odległości i czasu nie obliczysz prędkości.",
  },
  {
    id: "layers", title: "Porównaj dwie warstwy",
    task: "Dodajemy wyższy poziom do tej samej sekwencji. Przełącz chwile i porównaj ślady 1 i 2.",
    lower: 90, upper: 225, question: "Co możesz powiedzieć o tych dwóch warstwach?", correct: "different",
    options: [["same", "Obie warstwy płyną w tym samym kierunku"], ["different", "Kierunek przepływu zmienia się z wysokością"], ["surface", "Znam już dokładny wiatr przy ziemi"]],
    evidenceQuestion: "Który opis odpowiada obu śladom?", correctEvidence: "split",
    evidenceOptions: [["parallel", "Oba znaczniki przesuwają się na wschód"], ["one", "Tylko znacznik 1 zmienia położenie"], ["split", "1 przesuwa się na wschód, a 2 na południowy zachód"]],
    explanation: "Dolny znacznik przesuwa się na wschód, górny na południowy zachód. Odpowiada to napływowi z zachodu i z północnego wschodu. To zmiana kierunku z wysokością, nie pomiar turbulencji ani wiatru przy powierzchni.",
    evidence: "Porównujesz dwa ślady na tej samej siatce. Jeden uśredniony kierunek ukryłby różnicę. Nie znamy odległości między warstwami ani prędkości wiatru.",
  },
  {
    id: "wave", title: "Porównaj obrys i znacznik",
    task: "Przełącz chwile. Porównaj położenie białego obrysu i fioletowej kropki względem grzbietu.",
    lower: 90, upper: null, stationary: true, question: "Jaki wniosek wynika z tej sekwencji?", correct: "flow",
    options: [["calm", "W obszarze chmury nie ma przepływu powietrza"], ["flow", "Powietrze może przepływać przez obszar chmury"], ["ground", "Obserwacja dowodzi braku wiatru przy gruncie"]],
    evidenceQuestion: "Co rzeczywiście zmieniło położenie?", correctEvidence: "air",
    evidenceOptions: [["air", "Kropka zmieniła położenie, a obrys został w tym samym miejscu"], ["both", "Kropka i obrys przesunęły się razem"], ["neither", "Ani kropka, ani obrys nie zmieniły położenia"]],
    explanation: "W stojącej fali górskiej powietrze przepływa przez obszar chmury. Skraplanie pary po stronie wznoszenia i parowanie kropelek po stronie opadania mogą utrzymywać jej obrys w jednym miejscu. Sam ruch całej chmury nie zawsze pokazuje ruch powietrza.",
    evidence: "Kropka pokazuje umowną porcję powietrza, nie śledzoną kroplę. Biała bryła oznacza obszar chmury, nie wzorzec jej gatunku. To przekrój poglądowy, bez obliczania fali, prędkości i turbulencji.",
  },
];

export const windWorkshopKey = "chmurnik-wind-observations-v1";
export const windSessionKey = "chmurnik-wind-observation-session-v2";
const newId = () => globalThis.crypto.randomUUID();
const validFrame = frame => Number.isInteger(frame) && frame >= 0 && frame <= 2;
const cleanFrames = frames => Array.isArray(frames) ? [...new Set(frames.filter(validFrame))] : [];
const clampFrame = frame => Number.isFinite(frame) ? Math.max(0, Math.min(2, frame)) : 0;
const validId = id => typeof id === "string" && id.length > 0 && id.length <= 100;
const hasOption = (options, answer) => options.some(([id]) => id === answer);
const getStation = id => windStations.find(station => station.id === id);

export function windPosition(direction, frame) {
  const angle = direction * Math.PI / 180, distance = (clampFrame(frame) - 1) * 105;
  return { x: 300 + Math.sin(angle) * distance, y: 165 - Math.cos(angle) * distance };
}
export function windOrigin(toward) { return ((toward + 180) % 360 + 360) % 360; }
export function wavePosition(frame) {
  const t = clampFrame(frame) / 2;
  return { x: 150 + 300 * t, y: 163 - 236 * t * (1 - t) };
}
export function waveTrail(frame) {
  // Subdivide the quadratic at t so its trail never reveals a future position.
  const t = clampFrame(frame) / 2, end = wavePosition(frame);
  return `M150 163Q${150 + 150 * t} ${163 - 118 * t} ${end.x} ${end.y}`;
}
export function windFrameDescription(station, frame) {
  const point = (p, offset = 0) => `x ${Math.round(p.x)}, y ${Math.round(p.y + offset)}`;
  const positions = station.stationary ? `Środek obrysu: x 308, y 105. Kropka: ${point(wavePosition(frame))}.` :
    `Znacznik 1: ${point(windPosition(station.lower, frame), 23)}.${station.upper === null ? "" : ` Znacznik 2: ${point(windPosition(station.upper, frame), -23)}.`}`;
  const view = station.stationary ? "Przekrój nad grzbietem." : "Widok z góry: północ u góry, wschód po prawej.";
  return `Chwila ${frame + 1}. ${view} ${positions} Współrzędne rysunku: x rośnie w prawo, y w dół. To nie metry.`;
}
export function canReadSequence(frames) { return Array.isArray(frames) && frames.includes(0) && frames.includes(2); }

export function saveWindObservation(records, station, answer, metadata = {}) {
  const item = getStation(station);
  if (!item || !hasOption(item.options, answer) || records.some(record => record.id === metadata.id && metadata.id)) return records;
  return [...records, {
    id: validId(metadata.id) ? metadata.id : newId(), station, answer, correct: answer === item.correct,
    repeated: records.some(record => record.station === station), helped: metadata.helped === true,
    seen: cleanFrames(metadata.seen), legacy: !Array.isArray(metadata.seen),
  }];
}
export function saveWindEvidence(records, id, evidence, helped = false) {
  const record = records.find(item => item.id === id), station = getStation(record?.station);
  if (!station || record.evidence || !hasOption(station.evidenceOptions, evidence)) return records;
  return records.map(item => item.id === id ? {
    ...item, evidence, evidenceCorrect: evidence === station.correctEvidence, evidenceHelped: helped === true,
  } : item);
}
export function readWindRecords(value) {
  const records = [];
  for (const [index, raw] of (Array.isArray(value) ? value : []).entries()) {
    const station = getStation(raw?.station);
    if (!station || !hasOption(station.options, raw.answer)) continue;
    const id = validId(raw.id) ? raw.id : `legacy-${index}`;
    if (records.some(record => record.id === id)) continue;
    const record = {
      id, station: station.id, answer: raw.answer, correct: raw.answer === station.correct,
      repeated: records.some(item => item.station === station.id), helped: raw.helped === true,
      seen: cleanFrames(raw.seen), legacy: raw.legacy === true || !validId(raw.id),
    };
    if (hasOption(station.evidenceOptions, raw.evidence)) Object.assign(record, {
      evidence: raw.evidence, evidenceCorrect: raw.evidence === station.correctEvidence, evidenceHelped: raw.evidenceHelped === true,
    });
    records.push(record);
  }
  return records;
}
export function createWindSession(records = []) {
  return { version: 2, mode: "guide", index: 0, frame: 0, seen: [0], draft: null, evidenceDraft: null,
    helped: false, helpOpen: false, attemptId: newId(), records: readWindRecords(records) };
}
export function currentWindRecord(state) { return state.records.find(record => record.id === state.attemptId); }
export function updateWindSession(state, action) {
  const station = windStations[state.index], record = currentWindRecord(state);
  if (action.type === "mode" && ["guide", "assessment"].includes(action.mode)) return { ...state, mode: action.mode, helpOpen: false };
  if (action.type === "frame" && validFrame(action.frame)) return { ...state, frame: action.frame, seen: [...new Set([...state.seen, action.frame])] };
  if (action.type === "answer" && !record && canReadSequence(state.seen) && hasOption(station.options, action.answer)) return { ...state, draft: action.answer };
  if (action.type === "commit" && !record && canReadSequence(state.seen) && hasOption(station.options, state.draft)) return {
    ...state, records: saveWindObservation(state.records, station.id, state.draft, { id: state.attemptId, helped: state.helped, seen: state.seen }),
  };
  if (action.type === "evidence" && record && !record.evidence && hasOption(station.evidenceOptions, action.answer)) return { ...state, evidenceDraft: action.answer };
  if (action.type === "explain" && record && !record.evidence && hasOption(station.evidenceOptions, state.evidenceDraft)) return {
    ...state, records: saveWindEvidence(state.records, state.attemptId, state.evidenceDraft, state.helped),
  };
  if (action.type === "help") return { ...state, helped: true, helpOpen: action.open ?? state.helpOpen };
  if (action.type === "retry" || (action.type === "restart" && record?.evidence) ||
    (action.type === "next" && record?.evidence && state.index < windStations.length - 1)) {
    const index = action.type === "restart" ? 0 : state.index + (action.type === "next" ? 1 : 0);
    return { ...state, index, frame: 0, seen: [0], draft: null, evidenceDraft: null, helpOpen: false,
      helped: state.records.some(item => item.station === windStations[index].id) || (action.type === "retry" && state.helped), attemptId: newId() };
  }
  return state;
}
export function readWindSession(value, legacy = []) {
  if (value?.version !== 2) return createWindSession(legacy);
  const state = createWindSession(value.records);
  state.mode = value.mode === "assessment" ? "assessment" : "guide";
  state.index = Number.isInteger(value.index) && windStations[value.index] ? value.index : 0;
  state.frame = validFrame(value.frame) ? value.frame : 0;
  state.seen = [...new Set([0, ...cleanFrames(value.seen), state.frame])];
  if (validId(value.attemptId)) state.attemptId = value.attemptId;
  if (currentWindRecord(state)?.station !== windStations[state.index].id && currentWindRecord(state)) state.attemptId = newId();
  const station = windStations[state.index], record = currentWindRecord(state);
  state.draft = record?.answer ?? (hasOption(station.options, value.draft) ? value.draft : null);
  state.evidenceDraft = record?.evidence ?? (record && hasOption(station.evidenceOptions, value.evidenceDraft) ? value.evidenceDraft : null);
  state.helpOpen = value.helpOpen === true && state.mode === "guide";
  state.helped = value.helped === true || state.helpOpen || record?.helped === true || record?.evidenceHelped === true;
  return state;
}
export function mergeWindRecords(existing, incoming) {
  let merged = readWindRecords(existing);
  for (const item of readWindRecords(incoming)) {
    const prior = merged.find(record => record.id === item.id);
    if (!prior) merged.push({ ...item, repeated: merged.some(record => record.station === item.station) });
    else if (prior.station === item.station && prior.answer === item.answer && !prior.evidence && item.evidence) {
      merged = saveWindEvidence(merged, prior.id, item.evidence, item.evidenceHelped);
    }
  }
  return merged;
}

let memory = null, pendingWrite = false;
function browserStorage() { try { return globalThis.localStorage; } catch { return null; } }
function parse(value) { try { return JSON.parse(value); } catch { return null; } }
export function loadWindSession(storage = browserStorage()) {
  if (pendingWrite && memory) return readWindSession(memory);
  try {
    if (storage) return readWindSession(parse(storage.getItem(windSessionKey)), parse(storage.getItem(windWorkshopKey)));
  } catch { /* Storage denial leaves a usable in-page workshop. */ }
  return readWindSession(memory);
}
export function persistWindSession(state, storage = browserStorage()) {
  let merged = state;
  try {
    const old = storage ? readWindSession(parse(storage.getItem(windSessionKey)), parse(storage.getItem(windWorkshopKey))) : memory;
    if (old) {
      const priorHelp = old.attemptId === state.attemptId && old.helped;
      const priorRecord = old.records.find(item => item.id === state.attemptId);
      // A stale view cannot turn help already opened elsewhere into an unassisted answer.
      const incoming = state.records.map(item => item.id === state.attemptId && priorHelp ? {
        ...item, helped: priorRecord ? priorRecord.helped : true,
        ...(item.evidence && !priorRecord?.evidence ? { evidenceHelped: true } : {}),
      } : item);
      merged = { ...state, records: mergeWindRecords(old.records, incoming), helped: state.helped || priorHelp };
      const record = currentWindRecord(merged);
      if (record) merged.draft = record.answer;
    }
    memory = merged;
    if (!storage) throw new Error("No browser storage");
    storage.setItem(windSessionKey, JSON.stringify(merged));
    pendingWrite = false;
    return { state: merged, durable: true };
  } catch {
    memory = merged;
    pendingWrite = true;
    return { state: merged, durable: false };
  }
}
