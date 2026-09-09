import { activities, lessonStateAt } from "./catalog.mjs";

const probe = (kind, question, options, correct, evidence, evidenceOptions, evidenceCorrect) => ({ kind, question, options, correct, evidence, evidenceOptions, evidenceCorrect });
export const guideProbes = {
  obserwacja: [
    probe("read", "Jaka budowa przeważa w części fotografii zajętej przez chmury?", ["Cienkie, rozdzielone włókna", "Szerokie, połączone człony", "Jedna wyraźna, pionowa wieża"], 1, "Który szczegół fotografii podtrzymuje Twój opis?", ["Sam ciemniejszy kolor nieba", "Powtarzające się wypukłości i cieniowanie połączonych członów", "Wielkość drzew przy horyzoncie"], 1),
    probe("read", "Czy widoczny horyzont daje wysokość podstawy w metrach?", ["Tak, wystarczy szerokość kadru", "Tak, wystarczy wielkość drzew", "Nie, brakuje danych pomiarowych"], 2, "Co rzeczywiście wnosi widok gruntu?", ["Kontekst perspektywy, nie wysokościomierz", "Dokładny pomiar odległości do chmury", "Pewność, że jest to najniższe piętro"], 0),
    probe("read", "Który opis tej fotografii porównasz z atlasem, nie dopisując pomiarów?", ["Warstwa z połączonymi członami i cieniowaniem; wysokość podstawy niezmierzona", "Ciemna warstwa, więc jej podstawa jest dokładnie na 1000 m", "Chmury przy horyzoncie są małe, więc na pewno należą do wysokiego piętra"], 0, "Co możesz uznać za sprawdzone po odsłonięciu porównania?", ["Automatyczne rozpoznanie każdej chmury w kadrze", "Zgodność widocznych cech z przykładem atlasowym, nie dokładną wysokość", "Pomiar podstawy wykonany z fotografii przez atlas"], 1),
  ],
  rodziny: [
    probe("read", "A i B to niezależne fotografie, nie kolejne chwile. Czym wyróżnia się budowa chmur w B?", ["Szeroką, ciągłą zasłoną", "Oddzielnymi kłębami o płaskich podstawach", "Cienką, włóknistą strukturą"], 2, "Czy samo jasne zabarwienie wystarczyłoby do tej oceny?", ["Nie, porównuję też włókna w B z kłębami w A", "Tak, biel wyznacza rodzaj chmury", "Tak, podobna jasność dowodzi tej samej wysokości"], 0),
    probe("read", "Na kolejnym, niezależnym zdjęciu B porównaj budowę z włóknami w A. Co widzisz?", ["Rozległą zasłonę, miejscami pofalowaną", "Odizolowaną wysoką wieżę", "Tę samą organizację w cienkie włókna"], 0, "Czy różnica budowy na tych zdjęciach jest pomiarem różnicy wysokości?", ["Tak, szarość zasłony wyznacza jej wysokość", "Nie, opis budowy i ustalenie piętra wymagają rozdzielenia", "Tak, zasłona musi leżeć tuż nad gruntem"], 1),
    probe("read", "B pokazuje chmury z góry, A z dołu. Jak opiszesz organizację B, bez wnioskowania o zmianie tej samej chmury?", ["Pojedyncza wysoka wieża", "Warstwa z wyraźnymi członami", "Same drobne cienkie włókna"], 1, "Czy widok z góry i członowana budowa ustalają same dokładną wysokość lub rodzaj?", ["Tak, każdy widok z góry oznacza wysokie piętro", "Tak, wielkość członów na dowolnym zdjęciu jest pomiarem ich rozmiaru", "Nie, potrzebuję także skali i kontekstu obserwacji; piętro nie zastępuje budowy"], 2),
  ],
  front: [
    probe("cause", "Porcję o 24°C i wilgotności względnej 80% uniesiemy o 1540 m w stabilnym otoczeniu. Który wynik przewidujesz?", ["Nie powstanie chmura, bo stabilność wyklucza kondensację", "Powstanie chmura, choć porcja pozostanie chłodniejsza od otoczenia", "Powstanie chmura i porcja będzie cieplejsza od otoczenia"], 1, "Który odczyt odróżnia kondensację od bycia cieplejszą porcją?", ["Jest chmura, ale na tej samej wysokości porcja ma około 13,0°C, a otoczenie 17,8°C", "Sam podpis chłodniejszej masy dowodzi temperatury unoszonej porcji", "Widoczna chmura oznacza, że porcja musi być cieplejsza od otoczenia"], 0),
    probe("cause", "Przy tym samym uniesieniu 1540 m porównamy osobną porcję: nadal początkowo 24°C, lecz wilgotność względna 25%. Co przewidujesz?", ["Suchsza porcja osiągnie nasycenie wcześniej niż wilgotna", "Chmura pozostanie taka sama niezależnie od wilgotności", "Suchsza porcja nie osiągnie tu kondensacji"], 2, "Które dane pozwalają przypisać różnicę wilgotności początkowej?", ["Obie porcje zaczęły z tą samą wilgotnością", "Uniesienie nadal wynosi 1540 m, a temperatura otoczenia około 17,8°C", "Obie porcje mają ten sam poziom kondensacji"], 1),
    probe("cause", "Przywrócimy początkową wilgotność 80%, zachowując uniesienie 1540 m i otoczenie. Co stanie się z kondensacją?", ["Chmura wróci bez dodatkowego uniesienia", "Chmura nie wróci bez zwiększenia uniesienia", "Chmura nie wróci bez ochłodzenia otoczenia"], 0, "Które porównanie wyjaśnia powrót chmury?", ["W obu próbach uniesienie samo w sobie gwarantuje chmurę", "Po zmianie porcja znalazła się wyżej niż wcześniej", "Wilgotniejsza porcja osiąga nasycenie wcześniej; zmieniono wilgotność, nie uniesienie ani otoczenie"], 2),
    probe("cause", "Na 1540 m pozostawimy wilgotną porcję, lecz spadek temperatury otoczenia zmienimy z 4 na 9°C/km. Jaki będzie znak różnicy temperatur?", ["Temperatury porcji i otoczenia będą równe", "Porcja będzie cieplejsza od otoczenia", "Porcja pozostanie chłodniejsza od otoczenia"], 1, "Który odczyt uzasadnia wynik bez dopowiadania toru ruchu ani burzy?", ["Chmura jest widoczna, więc znamy jej dalszą wysokość", "Strzałka w górę dowodzi samodzielnego unoszenia", "Na tej samej wysokości około 13,0°C jest większe od 10,1°C; scena nadal wymusza ruch"], 2),
  ],
  wiatr: [
    probe("cause", "Skierujemy dolną chmurę na wschód. Z której strony napływa w tym modelu?", ["Z zachodu, czyli z 270°", "Ze wschodu, czyli z 90°", "Z północy, czyli z 0°"], 0, "Co odróżnia dwa odczyty przy kompasie?", ["Ten sam kierunek w innych jednostkach", "Jeden mówi dokąd, drugi skąd", "Jeden podaje prędkość, drugi wysokość"], 1),
    probe("cause", "Dodamy chmurę na wyższym poziomie. Czy musi płynąć tak samo?", ["Tak, jedna kolumna ma jeden wiatr", "Tak, jeśli nie widać opadu", "Nie, warstwy mogą płynąć inaczej"], 2, "Dlaczego pokazujemy dwa oddzielne kompasy?", ["By nie zastępować różnych warstw jedną średnią", "By zmierzyć odległość chmur od powierzchni", "By nadać obu warstwom identyczną prędkość"], 0),
    probe("cause", "Wyższą chmurę skierujemy do 225°. Jaki kierunek „z” otrzymasz?", ["225°", "45°", "135°"], 1, "Czy dwa różne kierunki określają intensywność turbulencji?", ["Tak, dowodzą silnej turbulencji", "Tak, dowodzą słabej turbulencji", "Nie, sam kierunek to za mało"], 2),
  ],
  metar: [
    probe("cause", "W szkoleniowym raporcie zmienimy SCT020 na BKN020, pozostawiając BKN060. Gdzie będzie pułap?", ["Na 2000 ft nad lotniskiem", "Nadal na 6000 ft nad lotniskiem", "Na średniej wysokości 4000 ft"], 0, "Dlaczego pułap zmienił się bez obniżania podstaw?", ["Każde SCT już tworzyło pułap", "BKN020 jest teraz najniższą warstwą BKN lub OVC w tym raporcie", "Pułap wyznacza zawsze wyższa warstwa"], 1),
    probe("cause", "Obniżymy BKN z 2000 do 1000 ft. Jak zmieni się grupa?", ["BKN020", "BKN100", "BKN010"], 2, "Co oznaczają trzy cyfry po BKN?", ["Podstawę w setkach stóp nad lotniskiem", "Grubość chmury w setkach metrów", "Wierzchołek w kilometrach nad morzem"], 0),
    probe("cause", "Zamiast METAR-u otworzymy TAF. Jakiego rodzaju informację będziesz czytać?", ["Pomiar warunków, które na pewno wystąpią w przyszłości", "Prognozę na wskazany przedział czasu", "Dalszy ciąg obserwacji zmieniany suwakami poprzedniego raportu"], 1, "TAF zaczyna się od SCT020 BKN060, choć poprzedni METAR miał BKN010. Co z tego wynika?", ["To pomiar potwierdzający wzrost podstawy tej samej chmury", "Poprzedni suwak obliczył nowe warunki atmosferyczne", "To oddzielny przykład prognozy, nie dalszy pomiar ani wynik suwaków METAR-u"], 2),
    probe("cause", "Odczytamy 14 UTC. Jak rozumiesz BKN015 w grupie TEMPO 0813/0815 tego TAF-u?", ["Pułap 1500 ft jest pewnym, ciągłym stanem od 13 do 15 UTC", "Prognozowany jest przejściowy pułap 1500 ft w oknie 13–15 UTC, nie pewny stan dokładnie o 14", "Pułap 1500 ft został zmierzony o 14 UTC"], 1, "Co od 16 UTC oznacza FM081600 z SCT030, bez BKN i OVC?", ["Nowy stan bazowy: SCT na 3000 ft, bez określonego pułapu chmurowego w tej grupie", "Pułap na 3000 ft, bo każda najniższa chmura tworzy pułap", "Niebo na pewno zupełnie bezchmurne, bo nie ma BKN"], 0),
  ],
  wysokosc: [
    probe("cause", "Pod poziomem 1500 m MSL teren wzrośnie do 1300 m MSL. Ile miejsca zostanie nad gruntem?", ["1500 m", "2800 m", "200 m"], 2, "Który rachunek zachowuje wspólny punkt odniesienia obu wysokości?", ["1500 m MSL minus 1300 m MSL daje 200 m AGL", "1300 minus 1500 daje 200 m nad gruntem", "1500 plus 1300 daje 2800 m AGL"], 0),
    probe("cause", "Teren wzrośnie do 1800 m MSL. Gdzie znajdzie się poziom 1500 m MSL?", ["300 m pod powierzchnią terenu", "300 m nad powierzchnią", "Na tej samej powierzchni"], 0, "Jak potraktujesz taki punkt profilu?", ["Jako dostępną warstwę powietrza na ujemnej wysokości AGL", "Nie jako warstwę powietrza nad tym gruntem", "Jak zwykły poziom 300 m nad gruntem"], 1),
    probe("cause", "Wracamy nad teren 100 m MSL. Jak opiszesz stały poziom 1500 m MSL względem obu odniesień?", ["1400 m MSL i 1500 m AGL", "1500 m MSL i 1400 m AGL", "1600 m MSL i 1500 m AGL"], 1, "Czy ten rachunek daje uniwersalne przeliczenie hPa na metry?", ["Tak, 850 hPa musi wszędzie leżeć na 1500 m MSL", "Tak, jeśli odejmiemy wysokość terenu od ciśnienia", "Nie, porównujemy wysokości geometryczne, a nie wyznaczamy wysokości powierzchni ciśnienia"], 2),
  ],
  oblodzenie: [
    probe("cause", "Przy −10°C powtórzymy próbę bez kropli, z większą umowną ekspozycją. Co pokaże ten mechanizm?", ["Brak osadu z ciekłych kropli", "Osad wynikający z samego chłodu", "Osad o znanej grubości w milimetrach"], 0, "Czego brakuje, mimo zimnego skrzydła i dodatniej ekspozycji?", ["Ujemnej temperatury skrzydła", "Ciekłej wody uderzającej w skrzydło", "Jeszcze większej ekspozycji, która zastąpi brak wody"], 1),
    probe("cause", "W osobnej próbie dodamy ciekłe krople, zachowując −10°C i umowną ekspozycję. Co przewidujesz?", ["Krople poniżej zera nie istnieją", "Woda zawsze pozostanie ciekła", "Może powstawać osad lodu z uderzających kropli"], 2, "Jak połączysz fazę napływającej wody, temperaturę i symbol osadu?", ["Napływa woda ciekła poniżej 0°C; na zimnym skrzydle może zamarzać", "Napływają tylko suche kryształki, bo każda woda poniżej 0°C jest już lodem", "Z rozmiaru symbolu odczytam rzeczywistą grubość lodu w milimetrach"], 0),
    probe("cause", "Zaczniemy nową próbę z samymi suchymi kryształkami przy −10°C. Czy zadziała tu pokazany mechanizm kroplowy?", ["Tak, faza wody nie ma znaczenia", "Nie, nie ma przechłodzonych kropli; to nie wyklucza innych zagrożeń lodowych", "Tak, kryształki są ciekłą wodą"], 1, "Jak należałoby zbadać topnienie poprzedniego osadu, którego ten model nie oblicza?", ["Uznać brak symbolu w nowej próbie za dowód stopienia starego lodu", "Wnioskować o topnieniu z samej obecności suchych kryształków", "Śledzić tę samą oblodzoną powierzchnię w czasie, zamiast porównywać osobne próby od czystej powierzchni"], 2),
  ],
  nazwy: [
    probe("read", "Który gatunek Cumulus pasuje do opisanych wysokich kłębów zachowujących ostre wypukłości?", ["humilis", "congestus", "calvus"], 1, "Co uzasadnia gatunek, zamiast nazywać każdą chmurę z opadem Cumulonimbus?", ["Silny rozwój pionowy z zachowaną kłębiastą budową", "Sam opad, niezależnie od budowy górnej części", "Historia przemiany, której nie obserwowano"], 0),
    probe("read", "Opad dociera do ziemi. Który człon odpowiada tej obserwacji?", ["virga", "genitus", "praecipitatio"], 2, "Co odróżnia ten przypadek od virga?", ["Kolor widocznej podstawy chmury", "Dotarcie opadu do powierzchni", "Dokładny pomiar wysokości chmury"], 1),
    probe("read", "Nie obserwowano wcześniejszego rozwoju. Czy dopiszesz pochodzenie?", ["Nie, pozostawię je nieznane", "Tak, wywnioskuję je z samej nazwy", "Tak, wywnioskuję je z samego opadu"], 0, "Jakie dodatkowe dane uzasadniłyby człon o pochodzeniu?", ["Podobieństwo kształtu do sąsiedniej chmury innego rodzaju", "Jedno zdjęcie ciemniejszej podstawy z opadem", "Obserwacja w czasie powstania z określonej chmury lub jej przemiany"], 2),
  ],
};

export function probeState(id, index, revealed = false) {
  const before = lessonStateAt(id, index);
  const step = activities[id].steps[index];
  if (guideProbes[id][index].kind === "read" && id === "rodziny") return { ...before, [step.key]: step.target };
  return revealed ? { ...before, [step.key]: step.target } : before;
}

export const investigationKey = "chmurnik-guide-investigations-v1";

const plainObject = value => value !== null && typeof value === "object" && (Object.getPrototypeOf(value) === Object.prototype || Object.getPrototypeOf(value) === null);
const choiceIndex = (options, index) => Array.isArray(options) && Number.isInteger(index) && index >= 0 && typeof options[index] === "string" && options[index].length > 0;
const optionList = options => Array.isArray(options) && options.length > 1 && options.every(value => typeof value === "string" && value.length > 0);
const nonempty = value => typeof value === "string" && value.trim().length > 0;

function jsonValue(value, parents = new Set()) {
  if (value === null || typeof value === "string" || typeof value === "boolean") return true;
  if (typeof value === "number") return Number.isFinite(value);
  if ((!plainObject(value) && !Array.isArray(value)) || parents.has(value) || Object.getOwnPropertySymbols(value).length) return false;
  if (Array.isArray(value) && (Object.keys(value).length !== value.length || Object.keys(value).some((key, index) => key !== String(index)))) return false;
  parents.add(value);
  const valid = Object.values(value).every(item => jsonValue(item, parents));
  parents.delete(value);
  return valid;
}

function stateSnapshot(state) {
  try {
    return plainObject(state) && jsonValue(state) ? JSON.parse(JSON.stringify(state)) : null;
  } catch { return null; }
}

function questionSnapshot(item) {
  return {
    question: item.question, options: [...item.options], correctIndex: item.correct,
    evidenceQuestion: item.evidence, evidenceOptions: [...item.evidenceOptions], evidenceCorrectIndex: item.evidenceCorrect,
  };
}

function validSnapshot(record) {
  return nonempty(record.question) && optionList(record.options) && choiceIndex(record.options, record.correctIndex)
    && choiceIndex(record.options, record.answer) && record.answerText === record.options[record.answer]
    && nonempty(record.evidenceQuestion) && optionList(record.evidenceOptions) && choiceIndex(record.evidenceOptions, record.evidenceCorrectIndex);
}

function validRecord(record) {
  if (!plainObject(record) || !nonempty(record.token) || !nonempty(record.id)
    || !Number.isInteger(record.index) || record.index < 0 || !Number.isInteger(record.answer) || record.answer < 0) return false;
  if (record.schemaVersion === undefined || record.schemaVersion === 1) return true;
  if (record.schemaVersion !== 2 || !validSnapshot(record) || typeof record.correct !== "boolean") return false;
  if (![record.predictionHelped, record.evidenceHelped, record.descriptionUsed, record.setupUsed].every(value => typeof value === "boolean")) return false;
  if (!Array.isArray(record.evidenceHelpKinds) || !record.evidenceHelpKinds.every(nonempty)) return false;
  if (stateSnapshot(record.state) === null || (record.observedState !== null && stateSnapshot(record.observedState) === null)) return false;
  return record.evidence === null ? record.evidenceText === null && record.evidenceCorrect === null
    : choiceIndex(record.evidenceOptions, record.evidence) && record.evidenceText === record.evidenceOptions[record.evidence] && typeof record.evidenceCorrect === "boolean";
}

function updateRecord(store, token, update) {
  let changed = false;
  const attempts = store.attempts.map(record => {
    if (record.token !== token) return record;
    const next = update(record);
    if (next !== record) changed = true;
    return next;
  });
  return changed ? { ...store, attempts } : store;
}

export function readInvestigations(raw) {
  try {
    const data = JSON.parse(raw);
    if (data?.version !== 1 || !Array.isArray(data.attempts)) return { version: 1, attempts: [] };
    // History is validated against its own snapshot, never today's rubric.
    return { version: 1, attempts: data.attempts.filter(validRecord).map(record => record.schemaVersion === 2
      ? record : { ...record, schemaVersion: 1, legacy: true }) };
  }
  catch { return { version: 1, attempts: [] }; }
}

export function recordPrediction(store, { id, index, answer, state, token, helped = false }) {
  if (!nonempty(id) || !Object.hasOwn(guideProbes, id) || !Number.isInteger(index) || index < 0 || !nonempty(token)) return store;
  const item = guideProbes[id]?.[index];
  if (!item || !choiceIndex(item.options, answer)) return store;
  if (store.attempts.some(a => a.token === token)) return store;
  const savedState = stateSnapshot(state ?? {});
  if (savedState === null) return store;
  return { ...store, version: 1, attempts: [...store.attempts, {
    schemaVersion: 2, legacy: false, id, index, token, ...questionSnapshot(item), answer, answerText: item.options[answer],
    state: savedState, correct: answer === item.correct, predictionHelped: helped === true,
    observedState: null, setupUsed: false, evidence: null, evidenceText: null, evidenceCorrect: null,
    evidenceHelped: helped === true, descriptionUsed: false, evidenceHelpKinds: [],
  }] };
}

export function recordObservation(store, token, state, { setupUsed = false } = {}) {
  const observedState = stateSnapshot(state);
  if (observedState === null) return store;
  return updateRecord(store, token, record => !Number.isInteger(record.answer) || record.answer < 0 || record.observedState != null ? record
    : { ...record, observedState, setupUsed: setupUsed === true });
}

export function markInvestigationHelp(store, token, kind) {
  if (!nonempty(kind)) return store;
  return updateRecord(store, token, record => {
    if (!Number.isInteger(record.answer) || record.answer < 0 || record.evidence !== null) return record;
    const kinds = record.evidenceHelpKinds || [];
    if (record.evidenceHelped && kinds.includes(kind)) return record;
    return { ...record, evidenceHelped: true, descriptionUsed: record.descriptionUsed === true || kind === "description",
      evidenceHelpKinds: kinds.includes(kind) ? kinds : [...kinds, kind] };
  });
}

export function recordEvidence(store, token, answer, { helped = false, descriptionUsed = false } = {}) {
  return updateRecord(store, token, record => {
    if (record.evidence !== null) return record;
    const stored = optionList(record.evidenceOptions) && choiceIndex(record.evidenceOptions, record.evidenceCorrectIndex) && nonempty(record.evidenceQuestion);
    // Only a previously unanswered legacy explanation may use the current
    // question; capture it now without reconstructing its old prediction.
    const current = stored ? null : guideProbes[record.id]?.[record.index];
    if (!stored && (record.schemaVersion === 2 || !current)) return record;
    const options = stored ? record.evidenceOptions : current.evidenceOptions;
    const correctIndex = stored ? record.evidenceCorrectIndex : current.evidenceCorrect;
    if (!choiceIndex(options, answer)) return record;
    const kinds = [...(record.evidenceHelpKinds || [])];
    if (helped === true && !kinds.includes("help")) kinds.push("help");
    if (descriptionUsed === true && !kinds.includes("description")) kinds.push("description");
    return { ...record,
      ...(!stored ? { schemaVersion: 1, legacy: true, evidenceQuestion: current.evidence, evidenceOptions: [...options], evidenceCorrectIndex: correctIndex } : {}),
      evidence: answer, evidenceText: options[answer], evidenceCorrect: answer === correctIndex,
      evidenceHelped: record.predictionHelped === true || record.evidenceHelped === true || helped === true || descriptionUsed === true,
      descriptionUsed: record.descriptionUsed === true || descriptionUsed === true, evidenceHelpKinds: kinds,
    };
  });
}
