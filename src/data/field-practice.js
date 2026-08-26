export const metarExamples = [
  {
    label: "Porywy i niski pułap",
    report:
      "METAR EPWA 261200Z 24015G25KT 6000 -RA SCT012 BKN025 17/15 Q1012 NOSIG",
  },
  {
    label: "CAVOK i kierunek zmienny",
    report: "METAR EPGD 261230Z VRB03KT CAVOK 21/13 Q1016",
  },
  {
    label: "Mgła i nieznana VV",
    report: "SPECI EPKK 260500Z 00000KT 0300 FG VV/// 10/10 Q1019",
  },
  {
    label: "Raport z USA",
    report:
      "METAR KJFK 261251Z 18012KT 1 1/2SM -RA BKN008 OVC020 18/17 A2992 RMK AO2",
  },
];

export const practiceCases = [
  {
    id: "ceiling",
    track: "metar",
    title: "Która warstwa wyznacza pułap?",
    context: "FEW008 SCT015 BKN030 OVC070",
    question: "Wskaż raportowany pułap, nie najniższą pojedynczą chmurę.",
    choices: ["800 ft", "1500 ft", "3000 ft", "7000 ft"],
    answer: 2,
    explanation:
      "BKN030 jest najniższą warstwą BKN/OVC. FEW i SCT nie wyznaczają pułapu. Wysokości METAR odnoszą się do lotniska, nie do poziomu morza.",
    takeaway: "Najniższa chmura ≠ pułap.",
    sources: ["awcCodes", "faaWeather"],
  },
  {
    id: "crosswind",
    track: "metar",
    title: "Z której strony wieje?",
    context: "Wiatr 240°T / 20 kt · oś drogi startowej 270°T",
    question: "Jaka jest składowa boczna dla kierunku średniego?",
    choices: [
      "10 kt z lewej",
      "10 kt z prawej",
      "20 kt z lewej",
      "Nie ma składowej bocznej",
    ],
    answer: 0,
    explanation:
      "Różnica wynosi −30°. Składowa boczna to 20 × sin(−30°) = −10 kt, czyli z lewej. Obie wartości są geograficzne (T); numer pasa nie zastępuje jego dokładnego kierunku.",
    takeaway: "Najpierw wspólna północ, potem obliczenie.",
    sources: ["awcCodes", "faaWeather"],
  },
  {
    id: "trend",
    track: "metar",
    title: "Teraz czy za chwilę?",
    context: "8000 SCT020 BKN045 TEMPO 2000 SHRA BKN010",
    question: "Co opisuje bieżącą obserwację, przed grupą TEMPO?",
    choices: [
      "2000 m i pułap 1000 ft",
      "8000 m i pułap 4500 ft",
      "8000 m i pułap 2000 ft",
      "Średnia obu widzialności",
    ],
    answer: 1,
    explanation:
      "TEMPO rozpoczyna prognozę przejściowych zmian. Nie podmienia bieżącej obserwacji. W tym ćwiczeniu obserwacja to 8000 m i BKN045, a pogorszenie wymaga osobnej uwagi.",
    takeaway: "Oddziel obserwację od trendu.",
    sources: ["awcCodes"],
  },
  {
    id: "unknown-vv",
    track: "metar",
    title: "Brak liczby też jest informacją",
    context: "0300 FG VV///",
    question: "Jak zapisać wysokość pułapu?",
    choices: [
      "0 ft",
      "300 ft",
      "Nieznana; VV nie została określona",
      "Nieograniczona",
    ],
    answer: 2,
    explanation:
      "Ukośniki oznaczają brak określonej wartości. 0300 to widzialność pozioma 300 m, a nie wysokość. Braku danych nie wolno zamieniać w dobrą pogodę ani liczbę zero.",
    takeaway: "Nieznane pozostaje nieznane.",
    sources: ["awcCodes", "faaWeather"],
  },
  {
    id: "apparent-beam",
    track: "wind",
    title: "Przyspieszasz na północ",
    context:
      "Wiatr rzeczywisty z E: 10 kt · jacht płynie na N: 6 kt · bez prądu",
    question: "Co poczujesz na pokładzie względem postoju?",
    choices: [
      "Słabszy wiatr bardziej od rufy",
      "Ten sam wiatr z boku",
      "Silniejszy wiatr bardziej od dziobu",
      "Wiatr wyłącznie od dziobu",
    ],
    answer: 2,
    explanation:
      "Od wektora ruchu powietrza odejmujemy prędkość jachtu. Wynik ma około 11,7 kt i przychodzi około 59° od prawej strony dziobu. Żagle reagują na wiatr pozorny.",
    takeaway: "Ruch jachtu zmienia to, co czujesz.",
    sources: ["orcWindVectors"],
  },
  {
    id: "apparent-run",
    track: "wind",
    title: "Płyniesz z wiatrem",
    context: "Wiatr z N: 12 kt · kurs S: 5 kt · bez prądu i dryfu",
    question: "Ile wynosi wiatr pozorny w tym prostym modelu?",
    choices: [
      "17 kt od dziobu",
      "7 kt od rufy",
      "12 kt z lewej",
      "5 kt od rufy",
    ],
    answer: 1,
    explanation:
      "Powietrze i jacht przemieszczają się na południe. Względem pokładu powietrze ma prędkość 12 − 5 = 7 kt. To model bez prądu, a nie pomiar z telefonu.",
    takeaway: "Z wiatrem: prędkości mogą się odejmować.",
    sources: ["orcWindVectors"],
  },
  {
    id: "gust",
    track: "wind",
    title: "Średnia nie opowiada całej historii",
    context: "Prognoza przy powierzchni: wiatr 16 kt, porywy 28 kt",
    question: "Co warto zrobić przed wyjściem na wodę?",
    choices: [
      "Patrzeć wyłącznie na 16 kt",
      "Przyjąć stałe 28 kt przez cały dzień",
      "Uznać porywy za błąd modelu",
      "Sprawdzić też porywy, akwen, ostrzeżenia i własne ograniczenia",
    ],
    answer: 3,
    explanation:
      "Poryw jest krótkim wzrostem prędkości, nie średnią. Liczba Beauforta sama nie opisuje osłony brzegu, rozbiegu fali ani możliwości załogi. Trening nie podejmuje decyzji za sternika.",
    takeaway: "Patrz na zakres warunków i swoje ograniczenia.",
    sources: ["metOfficeBeaufort", "windyOverlays"],
  },
  {
    id: "cloud-motion",
    track: "wind",
    title: "Chmury idą na wschód",
    context:
      "Przez kilka minut śledzisz tę samą warstwę chmur przesuwającą się ku E.",
    question: "Jaki ostrożny wniosek możesz zapisać?",
    choices: [
      "Wiatr na tej wysokości jest z W; przy wodzie może być inny",
      "Przy wodzie na pewno jest z E",
      "Przy wodzie ma 20 kt",
      "Cała atmosfera porusza się jednakowo",
    ],
    answer: 0,
    explanation:
      "Kierunek wiatru nazywamy stroną, z której nadchodzi. Śledzony ruch chmur pomaga oszacować wiatr na ich wysokości, ale nie podaje prędkości ani wiatru przy wodzie.",
    takeaway: "Dokąd idzie chmura ≠ skąd wieje wiatr.",
    sources: ["wmoObservation", "faaWeather"],
  },
  {
    id: "wind-level",
    track: "maps",
    title: "Dwie mapy, dwa poziomy",
    context: "Ta sama godzina: 10 m → 12 kt · 850 hPa → 35 kt",
    question:
      "Który odczyt jest bliższy pytaniu o wiatr przy powierzchni akwenu?",
    choices: [
      "850 hPa, bo mapa ma więcej koloru",
      "Średnia obu liczb",
      "10 m, z uwzględnieniem lokalnych warunków",
      "Oba opisują dokładnie to samo",
    ],
    answer: 2,
    explanation:
      "10 m jest poziomem przy powierzchni. 850 hPa to powierzchnia ciśnienia wyżej w atmosferze, nie wysokość 850 m. Model nie zastępuje lokalnego pomiaru.",
    takeaway: "Najpierw poziom, dopiero potem kolor.",
    sources: ["windyOverlays", "ecmwfModelLevels"],
  },
  {
    id: "accumulation",
    track: "maps",
    title: "Ten sam kolor, inne okno czasu",
    context: "Mapa A: suma 6 mm / 3 h · mapa B: suma 6 mm / 24 h",
    question: "Czy można powiedzieć, że natężenie deszczu będzie takie samo?",
    choices: [
      "Tak, 6 to zawsze 6",
      "Nie; to sumy w różnych przedziałach, nie chwilowe natężenie",
      "Tak, jeśli wybrano ten sam model",
      "Mapa B zawsze oznacza silniejszy deszcz",
    ],
    answer: 1,
    explanation:
      "Suma opadu opisuje cały przedział. Nie mówi, czy woda spadnie równomiernie czy w krótkiej ulewie. Przed porównaniem sprawdź jednostkę, okno i czas ważności.",
    takeaway: "Czytaj legendę i przedział czasu.",
    sources: ["windyOverlays"],
  },
  {
    id: "cape",
    track: "maps",
    title: "CAPE nie jest procentem",
    context:
      "Model pokazuje CAPE 1800 J/kg. W pobliżu nie ma jeszcze echa radarowego.",
    question: "Co z tego wynika?",
    choices: [
      "Burza na pewno powstanie tutaj",
      "Brak echa wyklucza rozwój burzy",
      "To 18% prawdopodobieństwa burzy",
      "Jest potencjał wyporności; potrzeba też oceny uruchomienia konwekcji",
    ],
    answer: 3,
    explanation:
      "CAPE jest miarą energii, nie prawdopodobieństwem. Hamowanie, wilgoć, wymuszenie i zmiana w czasie mają znaczenie. Sprawdź radar, obserwacje, ostrzeżenia i prognozę specjalistyczną.",
    takeaway: "Potencjał ≠ zdarzenie.",
    sources: ["nwsSkewT", "faaWeather"],
  },
  {
    id: "model-gap",
    track: "maps",
    title: "Modele się nie zgadzają",
    context:
      "Dla tego samego miejsca, poziomu i godziny: model A 12 kt, model B 24 kt.",
    question: "Jak potraktować tę różnicę?",
    choices: [
      "Wybrać niższą liczbę, bo jest wygodniejsza",
      "Zawsze zaufać droższemu modelowi",
      "Zbadać niepewność, aktualność przebiegów i lokalne obserwacje",
      "Uśrednić i uznać 18 kt za pewnik",
    ],
    answer: 2,
    explanation:
      "Rozbieżność jest informacją o niepewności. Sprawdź porównywalność danych i najnowsze pomiary. Średnia arytmetyczna nie staje się przez to zweryfikowaną prognozą.",
    takeaway: "Niepewność warto zobaczyć, nie ukrywać.",
    sources: ["windyAcademy", "faaWeather"],
  },
];

export function recordPracticeAttempt(records, id, correct, now = Date.now()) {
  const previous = records[id] || { attempts: 0, correct: 0 };
  return {
    ...records,
    [id]: {
      attempts: previous.attempts + 1,
      correct: previous.correct + (correct ? 1 : 0),
      lastCorrect: correct,
      lastAt: now,
    },
  };
}
