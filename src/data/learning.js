export const learningModules = [
  {
    id: "obserwacja",
    number: "01",
    level: "Początek",
    title: "Najpierw patrz, potem nazywaj",
    minutes: 12,
    summary:
      "Sześć pytań, które zamieniają „jakaś chmura” w uporządkowaną obserwację.",
    outcomes: ["kształt", "warstwa", "skala", "światło", "opad", "zmiana w czasie"],
    sourceIds: ["wmoAtlas"],
  },
  {
    id: "rodziny",
    number: "02",
    level: "Podstawy",
    title: "Dziesięć rodzajów bez wkuwania",
    minutes: 18,
    summary:
      "Czytaj rdzenie łacińskich nazw i łącz je z wysokością oraz budową chmury.",
    outcomes: ["cirro", "alto", "stratus", "cumulus", "nimbus"],
    sourceIds: ["wmoSummary"],
  },
  {
    id: "procesy",
    number: "03",
    level: "Rozumienie",
    title: "Dlaczego chmura powstaje",
    minutes: 20,
    summary:
      "Wilgoć, unoszenie, ochładzanie i stabilność jako wspólny mechanizm wielu różnych obrazów nieba.",
    outcomes: ["punkt rosy", "kondensacja", "inwersja", "konwekcja"],
    sourceIds: ["faaWeather"],
  },
  {
    id: "fronty",
    number: "04",
    level: "Synoptyka",
    title: "Niebo przed i za frontem",
    minutes: 22,
    summary:
      "Sekwencje chmur są wskazówką, nie zegarkiem. Naucz się odróżniać sygnał od pewnej prognozy.",
    outcomes: ["front ciepły", "front chłodny", "okluzja", "niepewność"],
    sourceIds: ["faaWeather"],
  },
  {
    id: "wiatr",
    number: "05",
    level: "Obserwacja",
    title: "Czytanie wiatru z ruchu chmur",
    minutes: 24,
    summary:
      "Kierunek, uskoki, fale i pozorny ruch: jak wyciągać wnioski z nieba bez udawania, że chmura jest anemometrem.",
    outcomes: ["wiatr z kierunku", "dryf chmur", "uskok", "fala górska", "perspektywa"],
    sourceIds: ["faaWeather", "wmoAtlas"],
  },
  {
    id: "lotnictwo",
    number: "06",
    level: "Lotnictwo",
    title: "Chmury w METAR i TAF",
    minutes: 26,
    summary:
      "FEW, SCT, BKN i OVC; pułap, podstawa, widzialność i to, czego kod nie mówi.",
    outcomes: ["grupy zachmurzenia", "ceiling", "AGL", "CB/TCU"],
    sourceIds: ["awcCodes", "easaAircrew"],
  },
  {
    id: "warstwy",
    number: "07",
    level: "Modele",
    title: "Czytanie atmosfery w pionie",
    minutes: 28,
    summary:
      "MSL, AGL, poziomy ciśnienia i wysokość geopotencjalna bez mylenia warstwy modelu z wysokością nad domem.",
    outcomes: ["AGL", "MSL", "hPa", "geopotencjał", "interpolacja modelu"],
    sourceIds: ["faaWeather", "windyLevels"],
  },
  {
    id: "zagrozenia",
    number: "08",
    level: "Operacyjne",
    title: "Oblodzenie, turbulencja i burze",
    minutes: 32,
    summary:
      "Połącz typ chmury, temperaturę, wodę przechłodzoną i dynamikę, nie wyciągając wniosku z jednej mapy.",
    outcomes: ["icing", "CAT", "konwekcja", "CAPE", "wind shear"],
    sourceIds: ["faaWeather", "easaAircrew"],
  },
  {
    id: "ekspert",
    number: "09",
    level: "Eksperckie",
    title: "Gatunki, odmiany i sporne granice",
    minutes: 35,
    summary:
      "Pełna składnia nazwy WMO, rzadkie cechy oraz uczciwe rozumowanie, kiedy dwa odczytania są obronione.",
    outcomes: ["species", "varietas", "supplementary features", "mother-clouds"],
    sourceIds: ["wmoAtlas", "wmoSummary"],
  },
];

export const placementQuestions = [
  {
    id: "visual",
    prompt: "Na zdjęciu widzisz drobne „ziarenka”. Co sprawdzasz najpierw?",
    answers: [
      { label: "Tylko kolor", score: 0 },
      { label: "Rozmiar elementów i ich cień", score: 2 },
      { label: "Czy pada w mojej miejscowości", score: 1 },
    ],
  },
  {
    id: "codes",
    prompt: "Co w raporcie METAR oznacza BKN?",
    answers: [
      { label: "Zachmurzenie 5–7 oktantów", score: 2 },
      { label: "Rodzaj niskiej chmury", score: 0 },
      { label: "Nie wiem jeszcze", score: 0 },
    ],
  },
  {
    id: "height",
    prompt: "Model pokazuje wiatr na 850 hPa. Czy to stała wysokość nad terenem?",
    answers: [
      { label: "Tak, zawsze dokładnie 1500 m AGL", score: 0 },
      { label: "Nie, to powierzchnia ciśnienia o zmiennej wysokości", score: 2 },
      { label: "Zależy wyłącznie od pory dnia", score: 1 },
    ],
  },
  {
    id: "taxonomy",
    prompt: "Cumulus congestus i Cumulonimbus calvus rozróżnia przede wszystkim…",
    answers: [
      { label: "kolor podstawy", score: 0 },
      { label: "oznaka zlodzenia i wygładzenia wierzchołka", score: 2 },
      { label: "obecność deszczu gdziekolwiek pod chmurą", score: 1 },
    ],
  },
  {
    id: "uncertainty",
    prompt: "Dwie osoby podają różne nazwy tej samej chmury. Najlepsza reakcja to…",
    answers: [
      { label: "sprawdzić kryteria, perspektywę i moment rozwoju", score: 2 },
      { label: "uznać, że jedna na pewno nie zna klasyfikacji", score: 0 },
      { label: "wybrać dłuższą nazwę", score: 0 },
    ],
  },
];

export const hardCases = [
  {
    pair: "Cirrocumulus czy Altocumulus?",
    question: "Małe kłębki tworzą ławicę, ale część ma cień.",
    answer:
      "Nie rozstrzygaj po jednym kłębku. Oceń dominującą wielkość kątową, obecność cieniowania oraz ciągłość z innymi warstwami. Przejście może być rzeczywiste.",
    sourceIds: ["wmoAtlas"],
    cloudIds: ["cirrocumulus", "altocumulus"],
  },
  {
    pair: "Stratus czy mgła?",
    question: "Podstawa dotyka zbocza, ale obserwator stoi niżej w dolinie.",
    answer:
      "Relacja do powierzchni jest lokalna. Dla obserwatora w dolinie może to być Stratus, podczas gdy na zboczu ta sama kropla chmurowa tworzy mgłę.",
    sourceIds: ["wmoAtlas", "faaWeather"],
    cloudIds: [],
  },
  {
    pair: "Cumulus congestus czy Cumulonimbus calvus?",
    question: "Wieża jest ogromna, lecz nie ma jeszcze kowadła.",
    answer:
      "Wielkość nie wystarcza. Szukaj utraty kalafiorowej ostrości i gładkawego, zlodzonego wierzchołka. Calvus nie wymaga jeszcze incus.",
    sourceIds: ["wmoAtlas", "faaWeather"],
    cloudIds: ["cumulus", "cumulonimbus"],
  },
  {
    pair: "Cirrostratus czy Altostratus?",
    question: "Rozległa zasłona tłumi Słońce, ale jej wysokości nie da się ocenić.",
    answer:
      "Sprawdź sposób przechodzenia światła. Halo i ostra tarcza wspierają Cirrostratus; tarcza podobna do matowego szkła, bez halo, wspiera Altostratus. Brak halo sam nie rozstrzyga.",
    sourceIds: ["wmoAtlas", "wmoObservation"],
    cloudIds: ["cirrostratus", "altostratus"],
  },
  {
    pair: "Altostratus czy Nimbostratus?",
    question: "Słońce zniknęło, a spod szarej warstwy zaczyna padać.",
    answer:
      "Granica opiera się na całym systemie. Rozległy, ciągły opad docierający do powierzchni, całkowicie zasłonięte Słońce i niskie pannus wspierają Nimbostratus. Virga lub początek opadu mogą nadal należeć do Altostratus.",
    sourceIds: ["wmoAtlas", "faaWeather"],
    cloudIds: ["altostratus", "nimbostratus"],
  },
  {
    pair: "Altocumulus czy Stratocumulus?",
    question: "Cieniowane człony są duże, lecz perspektywa przy horyzoncie je spłaszcza.",
    answer:
      "Porównuj elementy możliwie wysoko nad głową. Stratocumulus ma zwykle większe wały, niższą podstawę i mocniejszą fakturę; Altocumulus zachowuje mniejszą skalę i częściej występuje jako odrębne ławice średnie.",
    sourceIds: ["wmoAtlas", "wmoObservation"],
    cloudIds: ["altocumulus", "stratocumulus"],
  },
  {
    pair: "Stratocumulus czy Stratus?",
    question: "Niska pokrywa prawie zamknęła całe niebo, ale miejscami widać wały.",
    answer:
      "Szukaj dominującej organizacji. Wyraźne duże człony, przerwy i wały wspierają Stratocumulus; prawie jednolita pokrywa bez członów, szczególnie z mżawką, wspiera Stratus.",
    sourceIds: ["wmoAtlas", "faaWeather"],
    cloudIds: ["stratocumulus", "stratus"],
  },
  {
    pair: "Cirrus czy Cirrostratus?",
    question: "Włókna zaczynają łączyć się w mleczną zasłonę na większej części nieba.",
    answer:
      "Klasyfikuj dominujący stan i zanotuj przemianę. Oddzielne włókna prowadzą do Cirrus; ciągła cienka zasłona obejmująca znaczną część nieba prowadzi do Cirrostratus. Granica może przesuwać się podczas obserwacji.",
    sourceIds: ["wmoAtlas", "wmoObservation"],
    cloudIds: ["cirrus", "cirrostratus"],
  },
];

export const quizQuestions = [
  {
    prompt: "Który sygnał najsilniej wspiera rozpoznanie Cirrostratus?",
    options: ["Ciągły silny deszcz", "Halo wokół Słońca", "Płaska ciemna podstawa"],
    correct: 1,
    explanation:
      "Halo powstaje na kryształkach lodu i jest mocną wskazówką cienkiej wysokiej zasłony.",
  },
  {
    prompt: "Które zachmurzenie w METAR tworzy pułap lotniczy?",
    options: ["Najniższe BKN lub OVC", "Dowolne FEW", "Wyłącznie CB"],
    correct: 0,
    explanation:
      "W uproszczeniu ceiling odnosi się do najniższej warstwy BKN/OVC albo widzialności pionowej.",
  },
  {
    prompt: "Poziom 500 hPa w modelu to…",
    options: [
      "zawsze 5000 m nad terenem",
      "powierzchnia stałego ciśnienia o zmiennej wysokości",
      "wysokość podstawy chmur średnich",
    ],
    correct: 1,
    explanation:
      "Ciśnienie jest współrzędną pionową modelu. Geopotencjał mówi, na jakiej wysokości ta powierzchnia leży.",
  },
];
