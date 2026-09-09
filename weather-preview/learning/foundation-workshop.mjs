import { calculate, cleanInputs, directionLabel, timeLabel } from "../model.mjs";
import { sceneAppearance } from "../presentation.mjs";

const option = (id, label) => ({ id, label });
const windChoices = [option("onshore", "Z wody na ląd"), option("calm", "Bez wyraźnej bryzy"), option("offshore", "Z lądu nad wodę")];
const saturationChoices = [option("yes", "Osiągnie nasycenie"), option("no", "Pozostanie bez nasycenia"), option("unchanged", "Temperatura się nie zmieni")];
const temperatureEvidence = [option("water", "Woda jest cieplejsza od lądu"), option("equal", "Obie temperatury są takie same"), option("land", "Ląd jest cieplejszy od wody")];
const cloudEvidence = [option("above", "Porcja jest powyżej poziomu kondensacji"), option("below", "Porcja jest poniżej poziomu kondensacji"), option("top", "Porcja dotarła do wierzchołka chmury")];
const fogEvidence = [option("equal", "Temperatura osiągnęła początkowy punkt rosy lub spadła niżej"), option("above", "Temperatura jest wyższa od początkowego punktu rosy"), option("added", "Do powietrza dopłynęła dodatkowa para wodna")];

export const foundationSources = {
  breeze: { label: "NWS: nagrzewanie lądu i wody oraz bryza", url: "https://www.weather.gov/bgm/WeatherInActionLakeShadowBreeze" },
  cloud: { label: "NWS: unoszenie i poziom kondensacji", url: "https://www.weather.gov/source/zhu/ZHU_Training_Page/clouds/stratus_form_dissipate/Marine_Layer.html" },
  fog: { label: "NWS: nocne ochładzanie i mgła radiacyjna", url: "https://www.weather.gov/safety/fog-radiation" },
  faa: { label: "FAA: Aviation Weather Handbook, rozdziały 6 i 12", url: "https://www.faa.gov/regulationspolicies/handbooksmanuals/aviation/faa-h-8083-28b-aviation-weather-handbook" },
};

export const foundationWorkshops = {
  bryza: {
    scene: "breeze", title: "Skąd bierze się bryza?", lesson: "wiatr", source: "breeze",
    intro: "Porównaj dwa termometry i dolną gałąź obiegu powietrza.",
    explore: "Zmieniaj porę dnia i kontrast nagrzewania. Porównuj temperatury, nie samą godzinę. Strzałki pokazują kierunek ruchu, nie prędkość wiatru.",
    limits: "Fikcyjny cykl dobowy, bez wiatru z większego układu pogody. Kontrast 0% daje dwie temperatury 20°C; nie oznacza to rzeczywistej ciszy. Różnicę poniżej 0,3°C traktujemy jako brak wyraźnej bryzy. Nie wyliczamy ciśnienia ani prędkości wiatru.",
    recap: "Różne nagrzewanie tworzy kontrast temperatur. Lokalny obieg może się odwrócić, gdy odwraca się ten kontrast; wyżej powietrze wraca. Sama godzina nie wystarcza do oceny wiatru.",
    trials: [
      { id: "day", title: "Zmień nagrzewanie", from: { hour: 14, heating: 0 }, key: "heating", target: 70,
        context: "Godzina 14:00. Zwiększysz kontrast nagrzewania z 0 do 70%. Pozostałe warunki zostają te same.",
        question: "Dokąd popłynie powietrze przy powierzchni?", choices: windChoices, correct: "onshore",
        action: "Zwiększ kontrast do 70%", observe: "Odczytaj oba termometry. Dolna strzałka dotyczy powierzchni, górna pokazuje powrót.",
        evidenceQuestion: "Które porównanie termometrów pasuje do wyniku?", evidence: temperatureEvidence, correctEvidence: "land",
        explanation: "Ląd jest cieplejszy. W tym uproszczeniu powietrze nad nim się unosi, a przy powierzchni napływa powietrze znad wody. Wyższa gałąź prowadzi w przeciwną stronę.",
        comparison: "Zmieniliśmy kontrast nagrzewania, nie godzinę. Obieg pojawił się wraz z różnicą temperatur." },
      { id: "night", title: "Ta sama zatoka nocą", from: { hour: 14, heating: 70 }, key: "hour", target: 2,
        context: "Pozostawisz kontrast 70%, ale przejdziesz z 14:00 do 02:00 w tym samym cyklu.",
        question: "Jaki będzie kierunek przy powierzchni o 02:00?", choices: windChoices, correct: "offshore",
        action: "Przejdź do 02:00", observe: "Sprawdź temperatury wody i lądu oraz obie gałęzie obiegu.",
        evidenceQuestion: "Które porównanie wyjaśnia kierunek nocą?", evidence: temperatureEvidence, correctEvidence: "water",
        explanation: "W tym nocnym wariancie woda jest cieplejsza od lądu. Przy powierzchni powietrze płynie z lądu nad wodę, a wyżej wraca. Obieg odwraca różnica temperatur, nie nazwa pory dnia.",
        comparison: "Kontrast nagrzewania pozostaje ten sam. Zmieniliśmy porę cyklu, więc inny jest znak różnicy temperatur." },
      { id: "contrast", title: "Usuń różnicę", from: { hour: 2, heating: 70 }, key: "heating", target: 0,
        context: "Nadal jest 02:00. Zmniejszysz kontrast nagrzewania do 0%.",
        question: "Co zostanie z lokalnej bryzy w tym modelu?", choices: windChoices, correct: "calm",
        action: "Zmniejsz kontrast do 0%", observe: "Porównaj termometry i sprawdź, czy pozostaje wyraźny obieg.",
        evidenceQuestion: "Co pokazują termometry po zmianie?", evidence: temperatureEvidence, correctEvidence: "equal",
        explanation: "Obie temperatury wynoszą 20°C. Model nie ma teraz kontrastu napędzającego bryzę. Nie wynika z tego, że rzeczywisty wiatr ucichnie: inne przyczyny wiatru są poza sceną.",
        comparison: "Godzina została ta sama. Noc bez kontrastu nie wystarczyła do powstania modelowej bryzy." },
    ],
  },
  chmura: {
    scene: "cloud", title: "Kiedy powstają kropelki?", lesson: "procesy", source: "cloud",
    intro: "Unieś porcję powietrza i odczytaj temperaturę oraz początek kondensacji.",
    explore: "Przesuwaj porcję suwakiem wysokości. Zmiana wilgotności lub temperatury początkowej oznacza porównanie z nową porcją, nie osuszanie istniejącej chmury.",
    limits: "Wymuszone unoszenie bez mieszania z otoczeniem. Każde ustawienie to uniesienie od ziemi, nie model opadania po kondensacji. Początek kondensacji szacujemy jako 125 m na 1°C początkowej różnicy temperatury i punktu rosy. Ochładzanie: 9,8°C/km przed nasyceniem i umowne 6°C/km po nim. Nie obliczamy wyporności, wierzchołka, opadu ani burzy. Wielkość i przejrzystość chmury są ilustracyjne.",
    recap: "Unoszona porcja ochładza się. Początek kondensacji zależy od jej warunków początkowych, nie od jednej stałej wysokości. Para jest niewidoczna; rysunek kropelek nie mówi, czy spadnie deszcz.",
    trials: [
      { id: "low", title: "Pierwsze uniesienie", from: { temperature: 24, humidity: 55, height: 0 }, key: "height", target: 500,
        context: "Porcja przy ziemi ma 24°C i wilgotność względną 55%. Uniesiesz ją na 500 m. Nasycenie to stan, w którym może zacząć się kondensacja pary w kropelki.",
        question: "Co stanie się z porcją na 500 m?", choices: saturationChoices, correct: "no",
        action: "Unieś na 500 m", observe: "Porównaj wysokość porcji z linią kondensacji. Odczytaj temperaturę, nie tylko wygląd chmury.",
        evidenceQuestion: "Gdzie jest porcja względem początku kondensacji?", evidence: cloudEvidence, correctEvidence: "below",
        explanation: "Porcja ochłodziła się, ale na 500 m pozostaje poniżej poziomu kondensacji. Ochłodzenie nie zawsze wystarcza do nasycenia. Niewidoczna para wodna nie jest jeszcze chmurą.",
        comparison: "Warunki przy ziemi pozostały te same. Zmieniliśmy tylko wysokość porcji." },
      { id: "high", title: "Unieś tę samą porcję wyżej", from: { temperature: 24, humidity: 55, height: 500 }, key: "height", target: 1500,
        context: "To nadal początkowe 24°C i wilgotność 55%. Zwiększysz uniesienie z 500 do 1500 m.",
        question: "Czy na 1500 m porcja osiągnie nasycenie?", choices: saturationChoices, correct: "yes",
        action: "Unieś na 1500 m", observe: "Obserwuj przejście przez poziom kondensacji i dalsze ochładzanie porcji.",
        evidenceQuestion: "Która relacja wysokości pasuje do wyniku?", evidence: cloudEvidence, correctEvidence: "above",
        explanation: "Porcja przekroczyła poziom kondensacji. Ilustracja kropelek narasta dopiero powyżej tej granicy. Temperatura przy dalszym unoszeniu wciąż spada; linia nie oznacza wierzchołka chmury.",
        comparison: "Większe uniesienie tej samej porcji pozwoliło jej osiągnąć nasycenie. Nie zmieniliśmy wilgotności początkowej." },
      { id: "dry", title: "Ta sama wysokość, inna porcja", from: { temperature: 24, humidity: 55, height: 1500 }, key: "humidity", target: 20,
        context: "Porównasz poprzednią porcję z suchszą: początkowo 24°C i wilgotność 20%. Obie unosimy na 1500 m.",
        question: "Co przewidujesz dla suchszej porcji na 1500 m?", choices: saturationChoices, correct: "no",
        action: "Porównaj z wilgotnością 20%", observe: "Sprawdź, czy poziom kondensacji mieści się na skali. Nadal odczytuj wysokość porcji.",
        evidenceQuestion: "Gdzie jest suchsza porcja względem własnego progu?", evidence: cloudEvidence, correctEvidence: "below",
        explanation: "Suchsza porcja wymaga większego ochłodzenia do nasycenia. Jej poziom kondensacji leży powyżej zakresu 3000 m. Te same 1500 m nie wystarczają; nie osuszaliśmy istniejącej chmury.",
        comparison: "Jedyna zmiana to wilgotność początkowa. Większa różnica temperatury i punktu rosy podniosła początek kondensacji." },
    ],
  },
  mgla: {
    scene: "fog", title: "Czy nocne chłodzenie wystarczy?", lesson: "procesy", source: "fog",
    intro: "Ochłodź powietrze przy ziemi i sprawdź, jak blisko jest nasycenia.",
    explore: "Zmieniaj spadek temperatury. Wilgotność początkowa wybiera nową porcję powietrza. Mgiełka pokazuje kondensację, a nie zmierzoną widzialność.",
    limits: "Stałe ciśnienie, bez unoszenia i dopływu pary. Zależność Magnusa wyznacza punkt rosy. Po nasyceniu kondensacja utrzymuje wilgotność względną na 100%. Nie rozstrzygamy, ile powstanie mgły, a ile rosy. Nie liczymy widzialności, mieszania, wiatru ani bilansu cieplnego gruntu.",
    recap: "Chłodzenie może zwiększać wilgotność względną bez dodawania pary. O wyniku decyduje odległość od punktu rosy. Kondensacja przy ziemi sprzyja mgle, ale sama scena nie przewiduje jej wystąpienia.",
    trials: [
      { id: "cool", title: "Ochłodź o kilka stopni", from: { temperature: 18, humidity: 70, cooling: 0 }, key: "cooling", target: 3,
        context: "Powietrze przy ziemi ma początkowo 18°C i wilgotność 70%. Ochłodzisz je o 3°C bez dodawania pary. Punkt rosy to temperatura, do której trzeba je ochłodzić, aby osiągnęło nasycenie.",
        question: "Czy takie chłodzenie doprowadzi do nasycenia?", choices: saturationChoices, correct: "no",
        action: "Ochłodź o 3°C", observe: "Odczytaj temperaturę i początkowy punkt rosy. Sprawdź również wilgotność względną.",
        evidenceQuestion: "Które dane wyjaśniają wynik chłodzenia?", evidence: fogEvidence, correctEvidence: "above",
        explanation: "Temperatura spadła do 15°C, ale pozostaje wyższa od początkowego punktu rosy. Wilgotność względna wzrosła bez dodawania pary; jeszcze nie osiągnęła 100%.",
        comparison: "Zmieniliśmy temperaturę, nie dopływ pary. Wyższa wilgotność względna nie musi oznaczać dodania wilgoci." },
      { id: "saturate", title: "Kontynuuj chłodzenie", from: { temperature: 18, humidity: 70, cooling: 3 }, key: "cooling", target: 6,
        context: "To te same warunki początkowe. Zwiększysz całkowite ochłodzenie z 3 do 6°C.",
        question: "Co stanie się po ochłodzeniu o 6°C?", choices: saturationChoices, correct: "yes",
        action: "Ochłodź o 6°C", observe: "Śledź termometr, znacznik początkowego punktu rosy i wilgotność względną.",
        evidenceQuestion: "Jak temperatura odnosi się do początkowego punktu rosy?", evidence: fogEvidence, correctEvidence: "equal",
        explanation: "Powietrze osiągnęło nasycenie, a przy dalszym chłodzeniu część pary kondensuje. Mgiełka ilustruje ten proces. Wiatr, mieszanie i grubość chłodnej warstwy wpływają na rzeczywistą mgłę.",
        comparison: "Tej samej porcji potrzeba było większego chłodzenia. Przejrzystość rysunku nie jest pomiarem widzialności." },
      { id: "drier", title: "Powtórz z suchszym powietrzem", from: { temperature: 18, humidity: 70, cooling: 6 }, key: "humidity", target: 40,
        context: "Porównasz dwie porcje początkowo o 18°C, każdą ochłodzoną o 6°C. Druga zaczyna z wilgotnością 40%, zamiast 70%.",
        question: "Czy suchsza porcja też osiągnie nasycenie?", choices: saturationChoices, correct: "no",
        action: "Porównaj z wilgotnością 40%", observe: "Porównaj temperaturę po chłodzeniu z początkowym punktem rosy nowej porcji.",
        evidenceQuestion: "Które porównanie temperatur pasuje do nowej porcji?", evidence: fogEvidence, correctEvidence: "above",
        explanation: "Suchsza porcja ma niższy początkowy punkt rosy. Temperatura 12°C go nie osiąga. Chłodna noc nie wystarczy jako jedyna przesłanka do przewidzenia mgły.",
        comparison: "Końcowa temperatura się nie zmieniła, ale zmienił się punkt rosy. Porównujemy różną wilgotność początkową, nie usuwanie mgły." },
    ],
  },
};

export const foundationNumber = (value, digits = 1) => value.toLocaleString("pl-PL", { minimumFractionDigits: digits, maximumFractionDigits: digits });
export const foundationTemperature = value => `${foundationNumber(value)}°C`;
export const foundationMetres = value => `${Math.round(value / 10) * 10} m`;
export const foundationHeightY = height => 83 - (height / 3000) * 66;

export function foundationSnapshot(id, values) {
  const scene = foundationWorkshops[id].scene;
  const input = cleanInputs(scene, values);
  return { input, result: calculate(scene, input), appearance: sceneAppearance(scene, input) };
}

export function foundationReadout(id, values) {
  const { input, result } = foundationSnapshot(id, values);
  if (id === "bryza") return [
    ["Woda", foundationTemperature(result.water)], ["Ląd", foundationTemperature(result.land)],
    ["Przy powierzchni", directionLabel(result.direction)], ["Pora cyklu", timeLabel(input.hour)],
  ];
  if (id === "chmura") return [
    ["Porcja nad ziemią", foundationMetres(input.height)], ["Temperatura porcji", foundationTemperature(result.parcel)],
    ["Początek kondensacji (około)", `${foundationMetres(result.base)}${result.aboveScene ? " (poza skalą)" : ""}`],
    ["Stan", result.saturated ? "Nasycenie" : "Bez nasycenia"],
  ];
  return [
    ["Po chłodzeniu", foundationTemperature(result.current)], ["Początkowy punkt rosy", foundationTemperature(result.initialDew)],
    ["Wilgotność względna", result.saturated ? "100%" : result.relative >= 99.9 ? "<100%" : `${foundationNumber(result.relative)}%`],
    ["Stan", result.saturated ? "Nasycenie" : "Bez nasycenia"],
  ];
}

const freshAttempt = trial => ({ phase: "predict", input: { ...trial.from }, helped: false });
export function createFoundationState(id) {
  if (!Object.hasOwn(foundationWorkshops, id)) throw new Error("Unknown foundation workshop");
  return { version: 1, id, mode: "guide", index: 0, helpSeen: false, trials: foundationWorkshops[id].trials.map(trial => [freshAttempt(trial)]) };
}
export function foundationAttempt(state) { return state.trials[state.index].at(-1); }
export function foundationReady(state) {
  const trial = foundationWorkshops[state.id].trials[state.index];
  return foundationAttempt(state).phase === "action" && foundationAttempt(state).input[trial.key] === trial.target;
}

// The slider sets up an observation. Only a separate evidence answer ends a trial.
export function updateFoundation(state, action) {
  const workshop = foundationWorkshops[state.id], trial = workshop.trials[state.index];
  const current = foundationAttempt(state);
  if (action.type === "mode" && ["guide", "explore", "transfer"].includes(action.value)) return { ...state, mode: action.value };
  if (action.type === "next") return current.phase === "complete" && state.index < workshop.trials.length - 1 ? { ...state, index: state.index + 1 } : state;
  if (action.type === "retry") {
    if (!current.prediction) return state;
    return { ...state, trials: state.trials.map((attempts, index) => index === state.index ? [...attempts, { ...freshAttempt(trial), helped: true }] : attempts) };
  }
  let next = current;
  if (action.type === "help") next = { ...current, helped: true };
  if (action.type === "predict" && current.phase === "predict" && trial.choices.some(o => o.id === action.value)) {
    next = { ...current, prediction: action.value, predictionHelped: current.helped || state.helpSeen, phase: "action" };
  }
  if (action.type === "change" && current.phase === "action" && Number.isFinite(action.value)) {
    next = { ...current, input: cleanInputs(workshop.scene, { ...trial.from, [trial.key]: action.value }) };
  }
  if (action.type === "observe" && foundationReady(state)) next = { ...current, observed: { ...current.input }, phase: "evidence" };
  if (action.type === "evidence" && current.phase === "evidence" && trial.evidence.some(o => o.id === action.value)) {
    next = { ...current, evidence: action.value, evidenceHelped: current.helped || state.helpSeen, phase: "complete" };
  }
  if (next === current) return state;
  return { ...state, helpSeen: state.helpSeen || action.type === "help", trials: state.trials.map((attempts, index) => index === state.index ? [...attempts.slice(0, -1), next] : attempts) };
}

export function readFoundationState(id, raw) {
  const state = createFoundationState(id);
  try {
    const data = JSON.parse(raw);
    if (data?.version !== 1 || data.id !== id || !Array.isArray(data.trials)) return state;
    if (["guide", "explore", "transfer"].includes(data.mode)) state.mode = data.mode;
    state.helpSeen = data.helpSeen === true;
    state.trials = foundationWorkshops[id].trials.map((trial, index) => {
      const stored = data.trials[index];
      if (!Array.isArray(stored) || !stored.length) return [freshAttempt(trial)];
      return stored.map(record => {
        const attempt = freshAttempt(trial);
        if (!record || typeof record !== "object") return attempt;
        attempt.helped = record.helped === true;
        if (!trial.choices.some(o => o.id === record.prediction)) return attempt;
        Object.assign(attempt, { prediction: record.prediction, predictionHelped: record.predictionHelped === true, phase: "action" });
        attempt.input = cleanInputs(foundationWorkshops[id].scene, { ...trial.from, [trial.key]: record.input?.[trial.key] ?? trial.from[trial.key] });
        const target = { ...trial.from, [trial.key]: trial.target };
        if (record.observed && Object.keys(target).every(key => record.observed[key] === target[key])) {
          Object.assign(attempt, { input: target, observed: { ...target }, phase: "evidence" });
          if (trial.evidence.some(o => o.id === record.evidence)) Object.assign(attempt, { evidence: record.evidence, evidenceHelped: record.evidenceHelped === true, phase: "complete" });
        }
        return attempt;
      });
    });
    // Corrupt indexes cannot skip unanswered trials.
    const requested = Number.isInteger(data.index) ? Math.max(0, Math.min(2, data.index)) : 0;
    while (state.index < requested && foundationAttempt(state).phase === "complete") state.index++;
    return state;
  } catch { return state; }
}

const memory = new Map();
export const foundationStorageKey = id => `chmurnik:foundation-workshop:v1:${id}`;
export function loadFoundationState(id, storage) {
  try {
    const target = storage === undefined ? globalThis.localStorage : storage;
    const raw = target?.getItem(foundationStorageKey(id));
    return readFoundationState(id, memory.get(id) ?? raw);
  } catch { return readFoundationState(id, memory.get(id)); }
}
export function saveFoundationState(state, storage) {
  const raw = JSON.stringify(state);
  memory.set(state.id, raw);
  try {
    const target = storage === undefined ? globalThis.localStorage : storage;
    if (!target) return false;
    target.setItem(foundationStorageKey(state.id), raw);
    return true;
  } catch { return false; }
}
