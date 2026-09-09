// Static assessment data. Feedback/correct/explanation are post-submit only;
// hint, accessibleDescription and sourceUrl reveal assistance, not raw evidence.
const option = (id, label, feedback) => ({ id, label, feedback });
const field = (id, label, options, factIndices) => ({ id, label, options, ...(factIndices ? { factIndices } : {}) });
const reason = (options) => ({ label: "Która zasada uzasadnia Twoją decyzję?", options });

const sources = {
  breeze: "https://www.weather.gov/bgm/WeatherInActionLakeShadowBreeze",
  cloud: "https://weather.metoffice.gov.uk/learn-about/weather/how-weather-works/what-is-convection",
  fog: "https://www.weather.gov/safety/fog-radiation",
  observation: "https://cloudatlas.wmo.int/en/observing-clouds.html",
  height: "https://cloudatlas.wmo.int/en/height-and-altitude.html",
  classification: "https://cloudatlas.wmo.int/en/cloud-classification-summary.html",
  lifting: "https://www.weather.gov/spotterguide/ingredients",
  stability: "https://www.weather.gov/lmk/indices",
  metar: "https://aviationweather.gov/help/data/",
  ceiling: "https://www.weather.gov/asos/METAR.html",
  sounding: "https://www.weather.gov/source/zhu/ZHU_Training_Page/convective_parameters/skewt/skewtinfo.html",
  icing: "https://www.weather.gov/source/zhu/ZHU_Training_Page/icing_stuff/icing/icing.htm",
  turbulence: "https://www.weather.gov/zme/safety_turb",
  storm: "https://www.weather.gov/safety/lightning-thunderstorm-development",
  life: "https://www.weather.gov/spotterguide/life",
};

const rules = {
  breeze: reason([
    option("clock", "O poranku obieg kieruje się na ląd, a wieczorem nad wodę; decyduje pora dnia.", "Godzina nie zastępuje porównania temperatur lądu i wody."),
    option("contrast", "Różnica temperatur wyznacza kierunek dolnej gałęzi, a wyżej powietrze wraca.", "Porównujesz temperatury, a nie samą etykietę dnia lub nocy."),
    option("same-flow", "Cieplejsza strona przyciąga powietrze zarówno przy powierzchni, jak i wyżej.", "W zamkniętym schemacie górna gałąź stanowi powrót."),
  ]),
  cloud: reason([
    option("fixed-height", "Poziom nasycenia zależy od wysokości uniesienia, ale nie od początkowego punktu rosy.", "Początkowa różnica temperatury i punktu rosy zmienia wysokość kondensacji."),
    option("stop-cooling", "Kondensacja równoważy chłodzenie, dlatego dalsze unoszenie nie zmienia temperatury.", "W tym modelu zmienia się tempo chłodzenia, a nie znika jego przyczyna."),
    option("lcl", "Unoszenie ochładza porcję, a początek nasycenia zależy od początkowych T i Td.", "LCL jest początkiem kondensacji tej porcji, nie wierzchołkiem chmury ani prognozą opadu."),
  ]),
  fog: reason([
    option("dewpoint", "Przy chłodzeniu RH może rosnąć bez dodawania pary; o nasyceniu decyduje różnica T i Td.", "Wilgotność względna zależy także od temperatury, nie tylko od zawartości pary. Po nasyceniu w tym modelu pozostaje na 100%."),
    option("fixed-rh", "Bez dopływu pary RH nie zmienia się, nawet jeśli temperatura spada w stronę punktu rosy.", "Ochłodzenie może zwiększyć RH nawet bez dopływu pary."),
    option("final-temperature", "O nasyceniu rozstrzyga końcowa temperatura; początkowy punkt rosy nie zmienia wyniku.", "Potrzebna jest również informacja o początkowej wilgotności lub punkcie rosy."),
  ]),
  observation: reason([
    option("horizon", "Horyzont pozwala porównać chmurę z zabudową i wyznaczyć z kadru jej podstawę w metrach.", "Brakuje pomiaru odległości i geometrii potrzebnych do takiego wyznaczenia wysokości."),
    option("evidence", "Zdjęcie pozwala opisać budowę, lecz liczbową wysokość trzeba poprzeć pomiarem.", "Opis wyglądu i pomiar wysokości to różne rodzaje informacji."),
    option("shadow", "Cień podstawy odróżnia chmury burzowe od pozostałych, więc zastępuje porównanie budowy.", "Cieniowanie zależy także od budowy, perspektywy i oświetlenia."),
  ]),
  families: reason([
    option("level", "Piętro rozstrzyga rodzaj; chmury na tym samym piętrze różnią się tylko wyglądem.", "Na jednym piętrze może występować kilka rodzajów."),
    option("colour", "Kolor rozstrzyga rodzaj; różna budowa może wynikać z oświetlenia tej samej chmury.", "Kolor nie zastępuje porównania organizacji chmur."),
    option("structure", "Na wspólnym piętrze różne rodzaje odróżnia organizacja: zasłona, włókna lub człony.", "Porównuj zasłonę, włókna lub człony; piętro samo nie rozstrzyga."),
  ]),
  front: reason([
    option("separate", "Wymuszenie unosi porcję, wilgoć wpływa na nasycenie, a różnica temperatur na dalszy ruch.", "Porcję można unosić mimo hamującej relacji temperatur, a kondensacja zależy też od wilgotności."),
    option("stable-clear", "Stabilne otoczenie zatrzymuje kondensację, nawet gdy front lub zbocze wymusza unoszenie.", "Front lub zbocze mogą wymusić uniesienie do nasycenia."),
    option("gradient", "Stromy spadek temperatury otoczenia sprawia, że uniesiona porcja staje się cieplejsza.", "Porównaj rzeczywiste chłodzenie porcji z otoczeniem na tym samym poziomie."),
  ]),
  wind: reason([
    option("destination", "Kierunek dryfu podaje kierunek wiatru; obie wartości opisują ten sam ruch powietrza.", "Meteorologiczny kierunek wiatru opisuje, skąd wieje, nie dokąd przemieszcza się znacznik."),
    option("opposite", "Przy prostym dryfie kierunek „z” jest przeciwny do „do”; każdą warstwę odczytuję osobno.", "Do kierunku dryfu dodaj 180° i sprowadź wynik do pełnego obrotu."),
    option("average", "Kierunki obu warstw należy uśrednić, aby uzyskać jeden kierunek wiatru nad obserwatorem.", "Uśrednienie usuwa informację o zmianie przepływu między poziomami."),
  ]),
  metar: reason([
    option("lowest", "Najniższa podstawa wyznacza pułap; pokrycie kolejnych warstw nie zmienia jego wysokości.", "Warstwy FEW i SCT nie tworzą pułapu; w tych raportach szukaj najniższej BKN lub OVC."),
    option("until-metar", "Okres grupy TAF kończy następny METAR; dopóki go nie ma, utrzymuje się poprzednia prognoza.", "Granice grup i okres ważności TAF nie zależą od nadejścia obserwacji."),
    option("cover-time", "Pułap zależy od pokrycia; TAF czytam w oknach czasu, a FM rozpoczyna nowy stan bazowy.", "Oddziel podstawę od pułapu oraz obserwację od prognozy i jej okien czasowych."),
  ]),
  height: reason([
    option("reference", "AGL to MSL minus wysokość terenu; wynik ujemny oznacza poziom pod powierzchnią.", "Wspólne odniesienie do poziomu morza pozwala porównać teren i zadany poziom. Poziom pod terenem nie jest warstwą powietrza."),
    option("same", "Poziom o stałym MSL utrzymuje ten sam odstęp od ziemi również nad wyższym terenem.", "Odległość od gruntu zmienia się wraz z wysokością terenu."),
    option("pressure", "Poziom ciśnienia zachowuje stałe AGL; zmienia się tylko jego wysokość względem morza.", "Poziom ciśnienia nie jest stałą odległością od dowolnego terenu."),
  ]),
  sounding: reason([
    option("slope", "Temperaturę odczytuję z nachylenia krzywej; pionowa i ukośna oś dają ten sam odczyt.", "Do odczytu potrzebujesz skali i wspólnego poziomu ciśnienia, nie samego nachylenia krzywej."),
    option("same-pressure", "T, Td i porcję porównuję przy tym samym ciśnieniu; pochylenie osi nie zmienia danych.", "Przechylenie osi zmienia współrzędne rysunku, nie temperatury ani wiatr."),
    option("thickness", "Odstęp między T i Td podaje grubość chmury, którą porównuję na kolejnych poziomach.", "Odstęp wskazuje bliskość nasycenia, nie grubość chmury."),
  ]),
  icing: reason([
    option("all-frozen", "Ujemna temperatura oznacza kryształki zamiast kropli; fazę wody rozstrzyga termometr.", "Ciekła woda może pozostawać przechłodzona."),
    option("time", "Dłuższa ekspozycja pozwala kroplom zamarznąć także na powierzchni cieplejszej od 0°C.", "Czas sam nie wystarcza do pokazanego mechanizmu zamarzania kropli."),
    option("droplets-surface", "Zamarzanie kropli wymaga ciekłej wody i zimnej powierzchni; procent nie określa tempa.", "Faza wody i temperatura powierzchni są potrzebne, a intensywność wymaga dodatkowych danych."),
  ]),
  turbulence: reason([
    option("flow", "Przeszkody, ogrzewanie i uskok mogą zaburzać przepływ bez chmur; skala nie mierzy siły.", "Rozpoznajesz przyczynę, nie kategorię zmierzonej turbulencji."),
    option("cloud", "O zaburzeniach przepływu można wnioskować dopiero po pojawieniu się chmury w tej warstwie.", "Przeszkody, ogrzewanie i różnice przepływu mogą działać bez chmur."),
    option("percent", "Procent wymuszenia pozwala porównać intensywność turbulencji między różnymi mechanizmami.", "Ta skala nie jest skalibrowana do fizycznej intensywności."),
  ]),
  storm: reason([
    option("instability-only", "Silna chwiejność może uzupełnić małą wilgotność lub brak wymuszenia przy inicjacji burzy.", "Sama chwiejność nie dostarcza wilgoci ani skutecznego wymuszenia."),
    option("ingredients-stage", "Składniki opisują możliwość inicjacji, a stadium wskazuje przepływy rozwiniętej komórki.", "Potencjał inicjacji i etap życia komórki są różnymi pytaniami."),
    option("always-up", "Przy komplecie składników prąd wstępujący pozostaje dominujący także w stadium zaniku.", "W umownym stadium zaniku dominuje prąd zstępujący."),
  ]),
  names: reason([
    option("complete-name", "Pełna nazwa wymaga cechy opadu i pochodzenia, nawet gdy zapis obserwacji ich nie obejmuje.", "Nie dopisuj członów, których nie wspierają obserwacje."),
    option("all-rain", "Obecność smug uzasadnia praecipitatio; ich zanik nad ziemią nie zmienia członu opadu.", "Rozróżnij smugi zanikające nad ziemią od opadu docierającego do powierzchni."),
    option("observed", "Gatunek i opad wynikają z obserwowanych cech; człon pochodzenia wymaga historii rozwoju.", "Nazwa ma odzwierciedlać dostępne dane, nie wypełniać wszystkie możliwe miejsca."),
  ]),
};

const surfaceWind = field("surface", "Jaki kierunek przewidujesz przy powierzchni?", [
  option("onshore", "Z wody na ląd", "Ten kierunek odpowiada cieplejszemu lądowi w lokalnym modelu bryzy."),
  option("offshore", "Z lądu nad wodę", "Ten kierunek odpowiada cieplejszej wodzie w lokalnym modelu bryzy."),
  option("calm", "Brak wyraźnego lokalnego obiegu", "Brak wyraźnego lokalnego obiegu odpowiada małemu kontrastowi temperatur. Sprawdź oba odczyty w tej próbie."),
]);
const returnWind = field("return", "W którą stronę popłynie gałąź powrotna wyżej?", [
  option("offshore", "Z lądu nad wodę", "Górna gałąź płynie tak, gdy przy powierzchni napływ jest z wody na ląd."),
  option("calm", "Nie będzie gałęzi powrotnej", "Zadany lokalny obieg ma gałąź dolną i powrotną."),
  option("onshore", "Z wody na ląd", "Górna gałąź płynie tak, gdy przy powierzchni napływ jest z lądu nad wodę."),
]);
const saturationPair = field("saturation", "W których próbach porcja osiągnie nasycenie?", [
  option("both", "W obu próbach", "Porównaj każdy zadany poziom lub spadek temperatury z progiem tej porcji."),
  option("second-only", "Tylko w próbie B", "Tak jest, gdy próba A nie dochodzi do progu, a próba B go osiąga lub przekracza."),
  option("neither", "W żadnej próbie", "Ten wybór wymaga, aby oba ustawienia pozostawały przed progiem."),
  option("first-only", "Tylko w próbie A", "Próba B oznacza większe uniesienie lub chłodzenie tej samej początkowej porcji, bez osuszania."),
]);
const photoHeight = field("height", "Co można podać o wysokości podstawy z tego kadru?", [
  option("atlas-measurement", "Wysokość równą typowej wartości z atlasu", "Zakres atlasowy nie jest pomiarem konkretnej fotografii."),
  option("horizon-measurement", "Dokładną wysokość z widocznego horyzontu", "Sam horyzont nie dostarcza kompletnej geometrii pomiarowej."),
  option("unmeasured", "Brak pomiaru podstawy w metrach", "Możesz opisać wygląd, ale ten kadr nie dostarcza pomiaru wysokości."),
]);
const photoStructure = field("structure", "Który opis najlepiej pasuje do widocznych chmur?", [
  option("rolls", "Szerokie połączone wały we wspólnej warstwie", "To opis członowanej warstwy; porównaj go z tym, co rzeczywiście widać w kadrze."),
  option("fibres", "Cienkie włókna i smugi", "Szukaj włóknistych pasm, a nie wyraźnych kłębiastych kopuł."),
  option("domes", "Osobne kłębiaste kopuły o wyraźnych konturach", "Ten opis dotyczy oddzielnych kłębów, nie rozległej zasłony ani cienkich smug."),
  option("sheet", "Jednolita zasłona bez wyraźnych członów", "Jednolita warstwa nie opisuje ani odrębnych włókien, ani oddzielnych kopuł."),
]);
const parcelRelation = field("parcel", "Jak porcja wypada temperaturowo wobec otoczenia na zadanym poziomie?", [
  option("warmer", "Jest cieplejsza", "Sam fakt unoszenia nie oznacza cieplejszej porcji. Porównaj oba przebiegi temperatury."),
  option("equal", "Ma tę samą temperaturę", "Wspólna temperatura początkowa nie zapewnia równości po uniesieniu."),
  option("colder", "Jest chłodniejsza", "W tych próbach unoszenie pozostaje wymuszone; porównanie T jest uproszczeniem, nie pełnym rachunkiem wyporności."),
]);
const precipitationLimit = field("limit", "Co sam początek kondensacji mówi o opadzie i wierzchołku chmury?", [
  option("unknown", "Nie rozstrzyga ani opadu, ani wysokości wierzchołka", "LCL wyznacza początek nasycenia tej porcji; model nie wyznacza dalszej budowy i opadu."),
  option("rain", "Gwarantuje opad docierający do ziemi", "Do opadu potrzebny jest dalszy rozwój procesów, którego tu nie obliczamy."),
  option("top", "Podaje wysokość wierzchołka chmury", "Początek kondensacji nie jest szczytem chmury."),
]);
const taf = "TAF EPWA 081100Z 0812/0818 24008KT 9999 SCT020 BKN060 TEMPO 0813/0815 4000 SHRA BKN015 FM081600 28012KT 9999 SCT030";
const liftMethod = "Dwie niezależne próby wymuszonego uniesienia bez mieszania. Do rachunku użyj LCL ≈ 125 × (T − Td) m; tempo chłodzenia porcji: 9,8°C/km przed LCL i umowne 6°C/km powyżej. Liczby opisują model szkoleniowy, nie prognozę.";

const caseBank = {
  bryza: [
    {
      id: "bryza-a-v1", title: "Zatoka o poranku",
      context: "Przewidź lokalny obieg z podanych temperatur modelowych. Pomijamy wiatr związany z większym układem pogody.",
      facts: ["Godzina: 07:00", "Kontrast nagrzewania: 80%", "Temperatura lądu: 17,9°C", "Temperatura wody: 19,0°C"],
      fields: [surfaceWind, returnWind], reason: rules.breeze,
      correct: { surface: "offshore", return: "onshore", reason: "contrast" },
      explanation: "Ląd jest chłodniejszy od wody. Model daje napływ przy powierzchni z lądu nad wodę i powrót wyżej na ląd. Poranna godzina nie zmienia wyniku porównania temperatur. Nie jest to prognoza całego wiatru nad wybrzeżem.",
      hint: "Porównaj oba termometry, a potem rozdziel dolną gałąź obiegu i jego powrót.",
      sourceUrls: [sources.breeze],
    },
    {
      id: "bryza-b-v1", title: "Zatoka wieczorem",
      context: "Przewidź lokalny obieg z podanych temperatur modelowych. Pomijamy wiatr związany z większym układem pogody.",
      facts: ["Godzina: 19:00", "Kontrast nagrzewania: 60%", "Temperatura lądu: 21,6°C", "Temperatura wody: 20,8°C"],
      fields: [surfaceWind, returnWind], reason: rules.breeze,
      correct: { surface: "onshore", return: "offshore", reason: "contrast" },
      explanation: "Ląd nadal jest cieplejszy od wody. W tym cyklu przy powierzchni powietrze płynie z wody na ląd, a wyżej wraca. Sama wieczorna godzina nie gwarantuje odwrócenia obiegu; wynik nie określa rzeczywistych warunków żeglugi.",
      hint: "Nie zastępuj danych termometrów skojarzeniem z porą dnia.",
      sourceUrls: [sources.breeze],
    },
  ],
  chmura: [
    {
      id: "chmura-a-v1", title: "Dwie wysokości tej samej porcji", context: liftMethod,
      facts: ["Temperatura początkowa: 20°C", "Wilgotność początkowa: 65%", "Początkowy punkt rosy: 13,2°C", "Uniesienie A: 600 m", "Uniesienie B: 1200 m"],
      fields: [saturationPair, field("cooling", "Co stanie się z temperaturą podczas dalszego uniesienia po nasyceniu?", [
        option("constant", "Przestanie się zmieniać", "Przy dalszym unoszeniu porcja nadal się rozpręża; nasycenie nie zatrzymuje chłodzenia."),
        option("warmer", "Zacznie rosnąć", "W zadanym modelu temperatura porcji nadal maleje, mimo wydzielania ciepła kondensacji."),
        option("continues", "Nadal będzie spadać", "Powyżej LCL model przyjmuje wolniejsze, ale nadal obecne chłodzenie."),
      ])], reason: rules.cloud,
      correct: { saturation: "second-only", cooling: "continues", reason: "lcl" },
      explanation: "LCL wynosi około 847 m. Na 600 m porcja jest jeszcze nienasycona i ma około 14,1°C; na 1200 m jest nasycona i ma około 9,6°C. Chłodzenie trwa także powyżej LCL. Nie wyliczamy opadu ani wierzchołka chmury.",
      hint: "Oszacuj próg z początkowych T i Td, a potem porównaj z nim obie wysokości.",
      sourceUrls: [sources.cloud, sources.sounding],
    },
    {
      id: "chmura-b-v1", title: "Inna porcja, inne wysokości", context: liftMethod,
      facts: ["Temperatura początkowa: 30°C", "Wilgotność początkowa: 30%", "Początkowy punkt rosy: 10,5°C", "Uniesienie A: 1800 m", "Uniesienie B: 2800 m"],
      fields: [saturationPair, precipitationLimit], reason: rules.cloud,
      correct: { saturation: "second-only", limit: "unknown", reason: "lcl" },
      explanation: "LCL to około 2433 m: próba A jest poniżej, a B powyżej progu. Temperatura porcji wynosi odpowiednio około 12,4°C i 4,0°C. Sama duża wysokość nie wystarcza do nasycenia; jego początek nie rozstrzyga o opadzie ani wierzchołku chmury.",
      hint: "Nie przenoś wysokości kondensacji poprzedniej porcji na nowe warunki początkowe.",
      sourceUrls: [sources.cloud, sources.sounding],
    },
  ],
  mgla: [
    {
      id: "mgla-a-v1", title: "Dwa warianty ochłodzenia",
      context: "Porównaj dwie porcje o tych samych warunkach początkowych. Ochładzamy je przy gruncie, przy stałym ciśnieniu, bez unoszenia i dopływu pary. To model szkoleniowy.",
      facts: ["Temperatura początkowa: 22°C", "Wilgotność początkowa: 80%", "Początkowy punkt rosy: 18,4°C", "Ochłodzenie A: 2°C", "Ochłodzenie B: 5°C"],
      fields: [saturationPair, field("humidity", "Jak zmieni się RH względem początkowej wartości?", [
        option("increases", "W obu próbach wzrośnie", "Chłodzenie zwiększa RH; po nasyceniu model zatrzymuje ją na 100%."),
        option("same", "Pozostanie taka sama w obu", "Stały dopływ pary nie jest warunkiem zmiany RH; tu zmienia się temperatura."),
        option("decreases", "W obu próbach spadnie", "Przy zadanym chłodzeniu bez osuszania powietrze zbliża się do nasycenia."),
      ])], reason: rules.fog,
      correct: { saturation: "second-only", humidity: "increases", reason: "dewpoint" },
      explanation: "Potrzeba około 3,61°C ochłodzenia. Po spadku o 2°C końcowe T to 20°C, a RH około 90,5%; po spadku o 5°C T to 17°C i model osiąga nasycenie. RH może rosnąć bez dodawania pary. Nie rozstrzygamy, czy w rzeczywistości powstanie mgła, czy rosa.",
      hint: "Od temperatury początkowej odejmij zadane ochłodzenie i porównaj z początkowym punktem rosy.",
      sourceUrls: [sources.fog, sources.metar],
    },
    {
      id: "mgla-b-v1", title: "Ochłodzenie w ograniczonym zakresie",
      context: "Porównaj dwie próby przy stałym ciśnieniu, bez unoszenia i dopływu pary. Dostępne ochłodzenie w modelu ma ograniczony zakres; nie zmieniaj początkowej wilgotności.",
      facts: ["Temperatura początkowa: 26°C", "Wilgotność początkowa: 50%", "Początkowy punkt rosy: 14,8°C", "Ochłodzenie A: 5°C", "Ochłodzenie B: 9°C", "Maksymalne ochłodzenie: 10°C"],
      fields: [{ ...saturationPair, factIndices: [0, 1, 2, 3, 4] }, field("reach", "Czy nasycenie jest osiągalne samym chłodzeniem w dostępnym zakresie?", [
        option("at-maximum", "Tak, najpóźniej przy maksymalnym ochłodzeniu", "Sprawdź różnicę początkowego T i Td; sam koniec skali nie musi oznaczać progu."),
        option("outside-range", "Nie, wymagane ochłodzenie przekracza zakres", "Próg tej porcji wymaga około 11,22°C ochłodzenia, a dostępne jest najwyżej 10°C."),
        option("already", "Tak, już w obu podanych próbach", "W obu próbach końcowa temperatura pozostaje wyższa od początkowego punktu rosy."),
      ], [0, 1, 2, 5])], reason: rules.fog,
      correct: { saturation: "neither", reach: "outside-range", reason: "dewpoint" },
      explanation: "Próg to około 11,22°C ochłodzenia, poza zakresem 10°C. Ani 5°C, ani 9°C nie wystarcza. Po spadku o 9°C temperatura wynosi 17°C, a RH około 86,8%: wzrosła, ale nie osiągnęła 100%. Brak nasycenia tej porcji nie jest prognozą widzialności.",
      hint: "Porównaj potrzebny spadek T do punktu rosy także z końcem dostępnej skali.",
      sourceUrls: [sources.fog, sources.metar],
    },
  ],
  obserwacja: [
    {
      id: "obserwacja-a-v1", title: "Opis kadru 1",
      context: "Obejrzyj fotografię przed porównaniem z atlasem. Opisz budowę chmur i oceń, jakie dane o ich wysokości zapewnia kadr.",
      facts: ["Pojedyncza autentyczna fotografia, pełny kadr.", "Nie załączono danych z pomiaru odległości ani wysokości."],
      image: {
        src: "./photos/transfer-01.jpg", alt: "Fotografia nieba nad zabudową i drzewami, pełny kadr.",
        credit: "Famartin", license: "CC BY-SA 3.0", licenseUrl: "https://creativecommons.org/licenses/by-sa/3.0/",
        sourceUrl: "https://commons.wikimedia.org/wiki/File:2013-09-10_06_47_39_Cirrus_in_Elko%2C_Nevada.jpg",
        accessibleDescription: "Na niebie widać cienkie, wygięte smugi i włókniste pasma, rozdzielone obszarami niebieskiego nieba. Opis jest pomocą w interpretacji fotografii.",
      },
      fields: [photoStructure, photoHeight], reason: rules.observation,
      correct: { structure: "fibres", height: "unmeasured", reason: "evidence" },
      explanation: "Widać włókna i smugi. Fotografia w atlasie jest przypisana do Cirrus. Kadr nie podaje pomiaru podstawy w metrach; typowy zakres wysokości rodzaju nie zastępuje pomiaru tej chmury.",
      hint: "Porównaj krawędzie i organizację chmur. Oddziel to, co widzisz, od tego, co wymagałoby przyrządu.",
      sourceUrls: [sources.observation, sources.height],
    },
    {
      id: "obserwacja-b-v1", title: "Opis kadru 2",
      context: "Obejrzyj inną fotografię. Wybierz opis budowy, bez zgadywania nazwy gatunku ani dokładnej wysokości.",
      facts: ["Pojedyncza autentyczna fotografia, pełny kadr.", "Nie załączono danych z pomiaru odległości ani wysokości."],
      image: {
        src: "./photos/transfer-02.jpg", alt: "Fotografia nieba nad wodą i odległym brzegiem, pełny kadr.",
        credit: "Janne Naukkarinen", license: "domena publiczna", licenseUrl: "https://creativecommons.org/publicdomain/mark/1.0/",
        sourceUrl: "https://commons.wikimedia.org/wiki/File:Cumulus_mediocris_3.JPG",
        accessibleDescription: "Widać oddzielne białe kopuły z wyraźnymi wypukłymi krawędziami i ciemniejszymi podstawami. Opis jest pomocą w interpretacji fotografii.",
      },
      fields: [photoStructure, photoHeight], reason: rules.observation,
      correct: { structure: "domes", height: "unmeasured", reason: "evidence" },
      explanation: "Oddzielne kopuły o wyraźnych konturach różnią się od włókien i jednolitej zasłony. To fotografia przypisana do Cumulus mediocris, lecz zadanie nie wymaga nazwy gatunku. Ciemna podstawa nie jest sama dowodem burzy ani pomiarem wysokości.",
      hint: "Sprawdź, czy widoczne elementy tworzą odrębne kłęby czy wspólną warstwę. Nie traktuj cienia jak pomiaru.",
      sourceUrls: [sources.observation, sources.height],
    },
  ],
  rodziny: [
    {
      id: "rodziny-a-v1", title: "Porównanie fotografii 1",
      context: "Porównaj dwie autentyczne fotografie. Na zdjęciu A oceniaj niebo wokół Słońca, nie drobny fragment chmury przy dolnej krawędzi.",
      facts: ["Dwa niezależne pełne kadry, oznaczone A i B.", "Nie dołączono pomiarów wysokości chmur."],
      images: [
        { label: "A", src: "./photos/transfer-03.jpg", alt: "Fotografia A: niebo ze Słońcem, pełny kadr.", credit: "Rollcloud", license: "domena publiczna", licenseUrl: "https://creativecommons.org/publicdomain/mark/1.0/", sourceUrl: "https://commons.wikimedia.org/wiki/File:Cs_nebulosus_with_faint_halo.jpg", accessibleDescription: "Wokół Słońca znajduje się cienka rozległa zasłona z subtelnym halo. To opis pomocniczy, nie niezależna obserwacja ucznia." },
        { label: "B", src: "./photos/transfer-04.jpg", alt: "Fotografia B: niebo z fragmentami drzew i przewodów, pełny kadr.", credit: "Famartin", license: "CC BY-SA 4.0", licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/", sourceUrl: "https://commons.wikimedia.org/wiki/File:2023-08-31_11_37_51_Cirrus_uncinus_(mares'_tails)_viewed_from_Aquetong_Lane_in_the_Mountainview_section_of_Ewing_Township%2C_Mercer_County%2C_New_Jersey.jpg", accessibleDescription: "Na niebieskim tle widoczne są odrębne wygięte włókna i smugi. To opis pomocniczy." },
      ],
      fields: [field("pair", "Które przypisanie najlepiej pasuje do zdjęć?", [
        option("ci-cs", "A: Cirrus; B: Cirrostratus", "W A rozległa zasłona dominuje nad odrębnymi włóknami; w B jest odwrotnie."),
        option("cs-ci", "A: Cirrostratus; B: Cirrus", "Zasłona wokół Słońca i odrębne włókna to różne organizacje chmur."),
        option("ci-ci", "A i B: Cirrus", "Wspólne typowe piętro nie czyni z rozległej zasłony odrębnych włókien."),
      ]), field("basis", "Które porównanie jest tu najbardziej użyteczne?", [
        option("brightness", "Jasność nieba jako jedyne kryterium", "Jasność zależy także od oświetlenia; porównaj organizację widocznych struktur."),
        option("height", "Założenie identycznej wysokości podstaw", "Nie otrzymujesz pomiaru podstaw, a wspólne piętro nie rozstrzyga rodzaju."),
        option("organization", "Rozległa zasłona wobec odrębnych włókien", "To istotna różnica widoczna w tej parze; halo w A jest dodatkową wskazówką."),
      ])], reason: rules.families,
      correct: { pair: "cs-ci", basis: "organization", reason: "structure" },
      explanation: "A przedstawia zasłonę Cirrostratus z subtelnym halo, B odrębne włókna Cirrus. Rodzaje mogą dzielić typowe wysokie piętro, lecz różnią się budową. Halo pomaga w tym kadrze, ale nie jest obowiązkowym testem każdego Cirrostratus.",
      hint: "Porównaj organizację całej widocznej struktury, nie tylko jej jasność.",
      sourceUrls: [sources.observation, "https://cloudatlas.wmo.int/en/cirrus-ci.html", "https://cloudatlas.wmo.int/en/cirrostratus-cs.html"],
    },
    {
      id: "rodziny-b-v1", title: "Porównanie fotografii 2",
      context: "Porównaj organizację chmur na dwóch autentycznych fotografiach. Nie szacuj dokładnych wysokości podstaw.",
      facts: ["Dwa niezależne pełne kadry, oznaczone A i B.", "Nie dołączono pomiarów wysokości chmur."],
      images: [
        { label: "A", src: "./photos/transfer-05.jpg", alt: "Fotografia A: niebo nad terenem zabudowanym i polem, pełny kadr.", credit: "Famartin", license: "CC BY-SA 4.0", licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/", sourceUrl: "https://commons.wikimedia.org/wiki/File:2016-10-01_18_00_40_Low_stratus_over_a_field_at_the_National_Weather_Service's_Baltimore-Washington_Weather_Forecast_Office_on_Old_Ox_Road_(Virginia_State_Secondary_Route_606)_in_Sterling%2C_Loudoun_County%2C_Virginia.jpg", accessibleDescription: "Niebo zajmuje mało zróżnicowana warstwa bez wyraźnych odrębnych kłębiastych członów. To opis pomocniczy." },
        { label: "B", src: "./photos/transfer-06.jpg", alt: "Fotografia B: niebo nad drzewami, pełny kadr.", credit: "Famartin", license: "CC BY-SA 4.0", licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/", sourceUrl: "https://commons.wikimedia.org/wiki/File:2018-05-18_18_27_24_Low_stratiform_clouds_(base_near_3%2C000_feet_AGL)_with_wavy%2C_bumpy_base_viewed_from_Mercer_County_Route_622_(North_Olden_Avenue)_in_Ewing_Township%2C_Mercer_County%2C_New_Jersey.jpg", accessibleDescription: "Warstwa składa się z szerokich połączonych wałów i wyraźnych członów. To opis pomocniczy." },
      ],
      fields: [field("pair", "Które przypisanie najlepiej pasuje do zdjęć?", [
        option("sc-st", "A: Stratocumulus; B: Stratus", "Wyraźne człony warstwy widać w B, a nie w A."),
        option("st-st", "A i B: Stratus", "Szary kolor nie usuwa członowanej budowy widocznej w B."),
        option("st-sc", "A: Stratus; B: Stratocumulus", "Porównanie gładkiej warstwy z dużymi połączonymi członami wspiera to przypisanie."),
      ]), field("basis", "Która różnica jest tu istotna?", [
        option("organization", "Mało zróżnicowana warstwa wobec dużych połączonych członów", "To różnica budowy, nie pomiar piętra ani samej jasności."),
        option("colour", "Dwa odcienie szarości jako rozstrzygający test", "Odcień zależy także od światła; sam kolor nie rozstrzyga rodzaju."),
        option("altitude", "Dokładna różnica wysokości podstaw odczytana ze zdjęć", "Nie dostarczono danych do takiego pomiaru."),
      ])], reason: rules.families,
      correct: { pair: "st-sc", basis: "organization", reason: "structure" },
      explanation: "A jest przypisane do Stratus, B do Stratocumulus. W pierwszym dominuje mało zróżnicowana warstwa, w drugim duże człony. Wspólne typowe niskie piętro i szary kolor nie wystarczą do przypisania tego samego rodzaju. Nie podajemy wysokości z kadru.",
      hint: "Zwróć uwagę, czy warstwa ma wyraźne duże człony, czy raczej jednolitą podstawę.",
      sourceUrls: [sources.observation, "https://cloudatlas.wmo.int/en/stratus-st.html", "https://cloudatlas.wmo.int/en/stratocumulus-sc.html"],
    },
  ],
  front: [
    {
      id: "front-a-v1", title: "Uniesienie przy granicy mas",
      context: "Chłodniejsza masa przesuwa się pod porcję i wymusza jej uniesienie. Użyj LCL ≈ 125 × (T − Td) m oraz chłodzenia porcji 9,8°C/km przed LCL i umownego 6°C/km powyżej. Pomijamy mieszanie i pełny rachunek temperatury wirtualnej.",
      facts: ["Temperatura początkowa: 24°C", "Wilgotność początkowa: 80%", "Początkowy punkt rosy: 20,3°C", "Uniesienie: 880 m", "Spadek temperatury otoczenia: 4°C/km", "Maksymalne uniesienie modelu: 2200 m"],
      fields: [field("saturation", "Jaki stan przewidujesz po zadanym uniesieniu?", [
        option("unsaturated", "Jeszcze przed nasyceniem", "Oszacuj LCL: w tej wilgotnej porcji leży poniżej zadanych 880 m."),
        option("saturated", "Nasycenie zostało osiągnięte", "880 m przekracza LCL wynoszący około 458 m."),
        option("no-cloud-in-stability", "Nasycenie jest niemożliwe przy takim gradiencie otoczenia", "Otoczenie nie usuwa wymuszonego uniesienia ani wilgoci porcji."),
      ]), parcelRelation], reason: rules.front,
      correct: { saturation: "saturated", parcel: "colder", reason: "separate" },
      explanation: "LCL≈458 m, więc na 880 m porcja jest nasycona. Ma około 17,0°C, a otoczenie 20,5°C: pozostaje chłodniejsza mimo kondensacji. Unoszenie wymusza front. Stabilne otoczenie nie wyklucza chmury przy wymuszeniu; nie przewidujemy burzy.",
      hint: "Rozwiąż osobno dwa porównania: uniesienie z LCL oraz temperaturę porcji z temperaturą otoczenia.",
      sourceUrls: [sources.lifting, sources.stability, sources.sounding],
    },
    {
      id: "front-b-v1", title: "Porcja unoszona nad zboczem",
      context: "Przepływ nad zboczem wymusza uniesienie porcji. Użyj LCL ≈ 125 × (T − Td) m oraz chłodzenia 9,8°C/km przed LCL i umownego 6°C/km powyżej. To model tej porcji, nie prognoza pogody w górach.",
      facts: ["Temperatura początkowa: 24°C", "Wilgotność początkowa: 25%", "Początkowy punkt rosy: 2,8°C", "Uniesienie: 1980 m", "Spadek temperatury otoczenia: 9°C/km", "Maksymalne uniesienie modelu: 2200 m"],
      fields: [field("saturation", "Jak zadane i maksymalne uniesienie wypadają względem nasycenia?", [
        option("at-target", "Porcja jest już nasycona na zadanym poziomie", "Duża wysokość nie zastępuje porównania z LCL tej suchej porcji."),
        option("at-maximum", "Jeszcze nie, ale osiągnie nasycenie przy 2200 m", "LCL wynosi około 2655 m, a więc leży wyżej niż maksymalne uniesienie."),
        option("above-range", "Nie osiągnie nasycenia nawet przy maksymalnym uniesieniu", "Próg tej porcji wypada poza zakresem 2200 m."),
      ]), parcelRelation], reason: rules.front,
      correct: { saturation: "above-range", parcel: "colder", reason: "separate" },
      explanation: "LCL≈2655 m przekracza zakres 2200 m. Na 1980 m porcja ma około 4,6°C, otoczenie 6,2°C; porcja jest chłodniejsza. Gradient otoczenia 9°C/km nie gwarantuje cieplejszej suchej porcji. Ruch nadal wymusza zbocze; nie diagnozujemy naturalnej głębokiej konwekcji.",
      hint: "Porównaj suche chłodzenie porcji z gradientem otoczenia; osobno sprawdź dostępny zakres uniesienia.",
      sourceUrls: [sources.lifting, sources.stability, sources.sounding],
    },
  ],
  wiatr: [
    {
      id: "wiatr-a-v1", title: "Ruch jednej warstwy",
      context: "Przyjmij prosty dryf fragmentu chmury wraz z powietrzem. Kierunki liczymy zgodnie z ruchem wskazówek zegara od północy; to schemat, nie obserwacja chmury falowej.",
      facts: ["Ruch chmury w kierunku: 135°", "Liczba obserwowanych warstw: 1", "Nie podano odległości przebytej w jednostce czasu."],
      fields: [field("from", "Z jakiego kierunku przybliżasz wiatr w tej warstwie?", [
        option("135", "Z 135° (SE)", "135° opisuje tutaj kierunek ruchu, nie kierunek pochodzenia."),
        option("315", "Z 315° (NW)", "Po dodaniu 180° do 135° otrzymujesz 315°."),
        option("45", "Z 45° (NE)", "To obrót o 90°, a potrzebny jest kierunek przeciwny."),
      ], [0]), field("speed", "Co można powiedzieć o prędkości?", [
        option("degrees-speed", "Można ją oszacować z kierunku i rozmiaru chmury w kadrze", "Kierunek nie podaje prędkości, a rozmiar w kadrze nie zastępuje pomiaru odległości i czasu."),
        option("zero", "Można przyjąć zerową prędkość, skoro nie zmierzono odległości", "Brak danych nie jest pomiarem zerowej prędkości."),
        option("unknown", "Nie można jej obliczyć bez odległości przebytej w danym czasie", "Potrzebujesz również odległości i czasu oraz założeń dotyczących dryfu."),
      ])], reason: rules.wind,
      correct: { from: "315", speed: "unknown", reason: "opposite" },
      explanation: "135°+180°=315°, czyli wiatr z NW w założeniu prostego dryfu tej warstwy. Sam kierunek nie podaje prędkości. Ruch lub bezruch dowolnej chmury nie zawsze wiernie odwzorowuje przepływ powietrza.",
      hint: "Oddziel pytania „dokąd przemieszcza się chmura” i „skąd napływa powietrze”.",
      sourceUrls: [sources.metar, sources.observation],
    },
    {
      id: "wiatr-b-v1", title: "Ruch na dwóch poziomach",
      context: "Przyjmij prosty dryf dwóch warstw. Każdą odczytaj oddzielnie; 0° i 360° oznaczają północ.",
      facts: ["Ruch dolnej chmury w kierunku: 270°", "Ruch górnej chmury w kierunku: 180°", "Nie podano prędkości ani odległości między poziomami."],
      fields: [field("lower", "Skąd napływa dolna warstwa?", [
        option("270", "Z 270° (W)", "To podany kierunek dryfu dolnej chmury, a nie pochodzenia wiatru."),
        option("180", "Z 180° (S)", "Nie obracamy kierunku o 90° ani nie przenosimy wartości górnej warstwy."),
        option("90", "Z 90° (E)", "Kierunek przeciwny do 270° to 90°."),
      ], [0]), field("upper", "Skąd napływa górna warstwa?", [
        option("0", "Z 0° / 360° (N)", "Kierunek przeciwny do 180° to północ."),
        option("180", "Z 180° (S)", "180° jest kierunkiem podróży górnej chmury."),
        option("90", "Z 90° (E)", "Ten wynik dotyczy dolnej warstwy; poziomów nie należy utożsamiać."),
      ], [1]), field("inference", "Jaki dodatkowy wniosek jest uzasadniony?", [
        option("one-wind", "Obie warstwy mają taki sam wiatr", "Kierunki po przeliczeniu pozostają różne."),
        option("directional-shear", "Kierunek zmienia się z wysokością, ale brak danych do intensywności turbulencji", "To informacja o uskoku kierunkowym, nie o zmierzonej turbulencji."),
        option("severe", "Różnica kierunków dowodzi silnej turbulencji", "Potrzebne są dalsze dane o przepływie i otoczeniu."),
      ])], reason: rules.wind,
      correct: { lower: "90", upper: "0", inference: "directional-shear", reason: "opposite" },
      explanation: "Dolny wiatr jest z 90°, górny z 0°/360°. Zmiana kierunku z wysokością jest uskokiem kierunkowym. Nie uśredniamy warstw i nie określamy intensywności turbulencji na podstawie samych dwóch kierunków.",
      hint: "Wykonaj obrót o pół pełnego koła osobno dla każdego poziomu.",
      sourceUrls: [sources.metar, sources.observation],
    },
  ],
  metar: [
    {
      id: "metar-a-v1", title: "Dwie depesze, dwa odczyty czasu",
      context: "Depesze szkoleniowe, dzień 8 UTC; wysokości AGL. METAR: obserwacja, TAF: prognoza.",
      facts: ["METAR EPWA 081200Z 24008KT 9999 FEW015 BKN060 18/12 Q1015", taf, "Odczyt TAF A: dzień 8, 15:00 UTC", "Odczyt TAF B: dzień 8, 16:00 UTC"],
      fields: [field("base", "Jaka jest najniższa podana podstawa w METAR?", [
        option("6000", "6000 ft AGL", "To podstawa wyższej warstwy BKN060, nie najniższej."),
        option("1500", "1500 ft AGL", "FEW015 podaje podstawę 15 setek stóp nad lotniskiem."),
        option("15", "15 ft AGL", "Trzy cyfry zapisują setki stóp, nie pojedyncze stopy."),
      ], [0]), field("ceiling", "Która warstwa tworzy pułap w METAR?", [
        option("FEW015", "FEW015: 1500 ft AGL", "FEW nie tworzy pułapu, mimo niższej podstawy."),
        option("none", "Żadna z podanych warstw", "Raport zawiera BKN, które tworzy pułap."),
        option("BKN060", "BKN060: 6000 ft AGL", "To najniższa warstwa BKN lub OVC w raporcie."),
      ], [0]), field("time", "Które warunki chmurowe TAF obowiązują o 15 i o 16 UTC?", [
        option("base-fm", "15: SCT020 BKN060 bez TEMPO; 16: nowe FM z SCT030", "TEMPO kończy się o 15, a FM od 16 ustanawia nowy stan bazowy."),
        option("tempo-fm", "15: nadal TEMPO z BKN015; 16: nowe FM z SCT030", "Końcowej godziny okna TEMPO nie przedłużamy na następną godzinę."),
        option("base-base", "15 i 16: wcześniejsze SCT020 BKN060", "FM081600 zastępuje wcześniejszy stan bazowy od 16 UTC."),
      ], [1, 2, 3])], reason: rules.metar,
      correct: { base: "1500", ceiling: "BKN060", time: "base-fm", reason: "cover-time" },
      explanation: "Najniższa podstawa to 1500 ft AGL, lecz pułap tworzy BKN060 na 6000 ft. FEW nie tworzy ceiling. O 15 UTC wygasa okno TEMPO 13–15; pozostaje wcześniejsza baza. Od 16 UTC FM wprowadza SCT030. To odczyt prognozy, nie późniejszy pomiar nieba.",
      hint: "Osobno sprawdź ilość chmur, setki stóp i końce okresów grup TAF.",
      sourceUrls: [sources.metar, sources.ceiling],
    },
    {
      id: "metar-b-v1", title: "Koniec okresu prognozy",
      context: "Depesze szkoleniowe, dzień 8 UTC; wysokości AGL. METAR: obserwacja, TAF: prognoza.",
      facts: ["METAR EPWA 081200Z 24008KT 9999 OVC035 18/12 Q1015", taf, "Odczyt TAF A: dzień 8, 17:00 UTC", "Odczyt TAF B: dzień 8, 18:00 UTC"],
      fields: [field("layers", "Jakie są najniższa podstawa i pułap w METAR?", [
        option("base-only", "Podstawa 3500 ft AGL; brak warstwy tworzącej pułap", "OVC jest warstwą tworzącą pułap."),
        option("both-3500", "Podstawa i pułap: 3500 ft AGL", "OVC035 jest najniższą podaną warstwą i tworzy pułap."),
        option("both-35", "Podstawa i pułap: 35 ft AGL", "035 oznacza 35 setek stóp."),
      ], [0]), field("time", "Jak odczytasz TAF o 17 i 18 UTC?", [
        option("fm-fm", "17 i 18: nadal FM z SCT030", "O 18 kończy się ważność tej prognozy; nie przedłużamy FM poza nią."),
        option("tempo-end", "17: TEMPO z BKN015; 18: koniec prognozy", "TEMPO dotyczyło 13–15 UTC, a nie godziny 17."),
        option("fm-end", "17: FM z SCT030; 18: poza okresem ważności", "FM obowiązuje o 17, ale o 18 brak już ważnej prognozy z tej depeszy."),
      ], [1, 2, 3]), field("above", "Co koniec raportu chmur na OVC mówi o warstwach wyżej?", [
        option("unknown", "Nie rozstrzyga, czy wyżej są inne chmury", "Zakończenie zapisu na OVC nie jest dowodem braku chmur ponad nią."),
        option("clear", "Gwarantuje bezchmurne niebo powyżej", "Raport nie uzasadnia takiego wniosku."),
        option("top", "Podaje wierzchołek wszystkich chmur na 3500 ft", "Kod podaje podstawę warstwy, nie jej grubość lub wierzchołek."),
      ], [0])], reason: rules.metar,
      correct: { layers: "both-3500", time: "fm-end", above: "unknown", reason: "cover-time" },
      explanation: "OVC035 ma podstawę i tworzy pułap na 3500 ft AGL. O 17 obowiązuje FM z SCT030 bez TEMPO; brak warstwy tworzącej pułap w tej grupie nie oznacza 0 ft. O 18 kończy się ważność TAF, nie „zaczyna się bezchmurne niebo”. METAR zakończony na OVC nie wyklucza chmur wyżej.",
      hint: "Rozróżnij brak ważnej prognozy, brak podanej warstwy pułapu i informację o podstawie OVC.",
      sourceUrls: [sources.metar, sources.ceiling],
    },
  ],
  wysokosc: [
    {
      id: "wysokosc-a-v1", title: "Poziom odniesienia nad terenem",
      context: "MSL oznacza wysokość względem średniego poziomu morza, a AGL względem lokalnego gruntu. Rozpatruj stały poziom geometryczny, nie powierzchnię stałego ciśnienia.",
      facts: ["Poziom odniesienia: 1500 m MSL", "Wysokość terenu: 800 m MSL"],
      fields: [field("agl", "Jaka jest odległość zadanego poziomu od gruntu?", [
        option("1500", "1500 m AGL", "1500 m jest tu wysokością względem morza, nie gruntu."),
        option("700", "700 m AGL", "Od 1500 m MSL odejmujesz 800 m MSL terenu."),
        option("2300", "2300 m AGL", "Wysokości o wspólnym odniesieniu odejmujemy, a nie dodajemy."),
      ]), field("reference", "Jak wysokość terenu wpływa na zadane 1500 m MSL?", [
        option("follows-ground", "Poziom przesuwa się w górę o 800 m", "To zachowałoby odległość AGL, ale nie zadane MSL."),
        option("becomes-agl", "MSL staje się równoważne AGL", "Punkty odniesienia pozostają różne."),
        option("fixed", "Poziom MSL pozostaje stały; zmienia się odległość od terenu", "Zmieniasz teren, nie wysokość zadanej płaszczyzny nad morzem."),
      ])], reason: rules.height,
      correct: { agl: "700", reference: "fixed", reason: "reference" },
      explanation: "1500 − 800 = 700 m nad lokalnym gruntem. Zadany poziom nadal ma 1500 m MSL. Powierzchnia stałego ciśnienia to inne pojęcie i nie ma ogólnie stałej wysokości MSL lub AGL.",
      hint: "Obie liczby mają wspólne odniesienie do morza. Narysuj dwa poziomy i porównaj ich różnicę.",
      sourceUrls: [sources.height],
    },
    {
      id: "wysokosc-b-v1", title: "Poziom odniesienia przy innym terenie",
      context: "MSL odnosi się do średniego poziomu morza, AGL do lokalnego gruntu. Zadana wysokość geometryczna pozostaje stała, niezależnie od terenu.",
      facts: ["Poziom odniesienia: 1500 m MSL", "Wysokość terenu: 1700 m MSL"],
      fields: [field("position", "Gdzie względem terenu wypada zadany poziom?", [
        option("below-200", "200 m pod terenem", "1500 − 1700 = −200 m: poziom leży poniżej powierzchni."),
        option("above-200", "200 m nad terenem", "Wartość bezwzględna różnicy usuwa istotny znak."),
        option("above-1500", "1500 m nad terenem", "To pomylenie MSL z AGL."),
      ]), field("air", "Jak opisać warstwę powietrza na tym poziomie w tym miejscu?", [
        option("zero", "Jako warstwę na 0 m AGL", "Nie przesuwamy zadanego poziomu na grunt ani nie obcinamy wyniku do zera."),
        option("not-air", "Poziom nie wyznacza tu warstwy powietrza nad gruntem", "Zadany poziom leży pod terenem, więc nie opisuje tam powietrza nad gruntem."),
        option("negative-air", "Jako dostępną warstwę atmosfery na −200 m AGL", "Ujemna różnica opisuje położenie pod terenem, nie warstwę powietrza."),
      ])], reason: rules.height,
      correct: { position: "below-200", air: "not-air", reason: "reference" },
      explanation: "Poziom 1500 m MSL leży 200 m poniżej terenu 1700 m MSL. Nie ma tam warstwy powietrza nad gruntem. Nie zastępuj tego wyniku zerowym AGL ani nie traktuj ujemnej różnicy jako dostępnej warstwy atmosfery. Nie jest to ocena warunków lotu.",
      hint: "Zachowaj znak różnicy. Sprawdź, czy zadany poziom w ogóle znajduje się nad powierzchnią.",
      sourceUrls: [sources.height],
    },
  ],
  sondaz: [
    {
      id: "sondaz-a-v1", title: "Dwa poziomy profilu",
      context: "To dwa poziomy uproszczonego profilu szkoleniowego, nie radiosondaż z konkretnego dnia. T to temperatura otoczenia, Td to punkt rosy. Porównaj dane na wskazanych ciśnieniach.",
      facts: ["Poziom A: 950 hPa; T = 8°C; Td = 7°C", "Poziom B: 900 hPa; T = 9°C; Td = 6°C"],
      fields: [field("warmer", "Na którym z tych poziomów otoczenie jest cieplejsze?", [
        option("950", "Na 950 hPa", "8°C jest niższe od 9°C; nie wnioskuj wyłącznie z wysokości."),
        option("900", "Na 900 hPa", "Wartość T wynosi tam 9°C, wobec 8°C na 950 hPa."),
        option("equal", "Temperatury są równe", "Odczyty różnią się o 1°C."),
      ]), field("saturation", "Który poziom jest bliższy nasycenia według odstępu T−Td?", [
        option("900", "900 hPa", "Tam odstęp wynosi 3°C, a na 950 hPa tylko 1°C."),
        option("both-saturated", "Oba już są nasycone", "Na żadnym z podanych poziomów T nie jest równe Td."),
        option("950", "950 hPa", "Mniejszy odstęp T−Td wskazuje większą bliskość nasycenia."),
      ])], reason: rules.sounding,
      correct: { warmer: "900", saturation: "950", reason: "same-pressure" },
      explanation: "Na 900 hPa jest o 1°C cieplej; bliżej nasycenia jest 950 hPa (odstęp 1°C zamiast 3°C). Porównanie końców nie dowodzi jednostajnego wzrostu T w całej warstwie: w profilu szkoleniowym na 925 i 900 hPa temperatura wynosi 9°C. Nie wyznaczamy grubości chmury z odstępu T−Td.",
      hint: "Porównaj najpierw same T, a potem policz osobno T−Td w każdym wierszu.",
      sourceUrls: [sources.sounding],
    },
    {
      id: "sondaz-b-v1", title: "Temperatura porcji i wiatr",
      context: "Kolejne dwa poziomy tego samego uproszczonego profilu szkoleniowego. Korzystaj z podanej temperatury porcji; nie musisz jej obliczać. Kierunek wiatru oznacza, skąd wieje.",
      facts: ["Poziom A: 850 hPa; T = 6°C; Td = 0°C; T porcji = −5°C; wiatr z 210° przy 16 kt", "Poziom B: 700 hPa; T = −4°C; Td = −15°C; T porcji = −16°C; wiatr z 230° przy 23 kt", "Rozważ te same dane na osi temperatury pionowej i pochylonej (Skew-T)."],
      fields: [field("parcel", "Jak temperatura porcji wypada wobec otoczenia?", [
        option("both-colder", "Porcja jest chłodniejsza na obu poziomach", "−5°C < 6°C oraz −16°C < −4°C; porównujemy na tym samym ciśnieniu."),
        option("both-warmer", "Porcja jest cieplejsza na obu poziomach", "W obu wierszach temperatura porcji jest niższa."),
        option("mixed", "Chłodniejsza na 850 hPa, cieplejsza na 700 hPa", "−16°C jest niższe, nie wyższe od −4°C."),
      ]), field("wind", "Jak zmienia się wiatr od 850 do 700 hPa?", [
        option("weaker", "Słabnie i zachowuje kierunek", "Prędkość rośnie z 16 do 23 kt, kierunek także się zmienia."),
        option("stronger-turning", "Przyspiesza i zmienia kierunek z 210° na 230°", "Odczyt wskazuje wzrost o 7 kt i zmianę kierunku o 20°; nie jest miarą turbulencji."),
        option("same-speed", "Zmienia tylko kierunek, bez zmiany prędkości", "Nie pomijaj wzrostu prędkości o 7 kt."),
      ]), field("projection", "Co zmieni pochylenie osi temperatury?", [
        option("warms", "Przesunięcie krzywej w prawo odczytam jako wyższą temperaturę porcji", "Na pochylonych osiach trzeba odczytać nową siatkę temperatury, nie sam kierunek przesunięcia krzywej."),
        option("changes-wind", "Obrót osi temperatury uwzględnię również przy odczycie kierunku wiatru", "Dane wiatru nie zależą od pochylenia osi temperatury."),
        option("same-data", "Odczytam te same dane, uwzględniając inne położenie punktów i osi", "Ciśnienie, temperatury i wiatr pozostają tymi samymi liczbami."),
      ])], reason: rules.sounding,
      correct: { parcel: "both-colder", wind: "stronger-turning", projection: "same-data", reason: "same-pressure" },
      explanation: "Porcja jest chłodniejsza o 11°C na 850 hPa i o 12°C na 700 hPa. Wiatr wzrasta z 16 do 23 kt i zmienia kierunek z 210° na 230°. Projekcja nie zmienia danych. Same dwa wiersze nie określają intensywności turbulencji ani pełnej wyporności porcji.",
      hint: "Nie porównuj porcji na jednym ciśnieniu z otoczeniem na drugim. Oddziel dane od ich projekcji.",
      sourceUrls: [sources.sounding],
    },
  ],
  oblodzenie: [
    {
      id: "oblodzenie-a-v1", title: "Krople i powierzchnia 1",
      context: "Rozważ tylko osadzanie i zamarzanie kropli uderzających w powierzchnię. Powierzchnia zaczyna bez lodu i ma temperaturę powietrza. Pomijamy inne mechanizmy oblodzenia; skala ekspozycji jest umowna, bez jednostki czasu.",
      facts: ["Temperatura powietrza i powierzchni: −6°C", "Faza wody: krople ciekłej wody", "Ekspozycja w modelu: 30%"],
      fields: [field("mechanism", "Czy są spełnione warunki tego mechanizmu akrecji?", [
        option("no-liquid", "Nie, ciekła woda nie może występować poniżej 0°C", "Krople mogą pozostawać przechłodzone; faza ciekła jest jawną daną."),
        option("supported", "Tak, krople trafiają na powierzchnię poniżej 0°C", "Zadane ciekłe krople i zimna powierzchnia wspierają ten mechanizm."),
        option("too-short", "Nie, ekspozycja musi przekroczyć 50%", "Model nie definiuje takiego progu; procent nie jest czasem w minutach."),
      ]), field("rate", "Jakie tempo narastania lodu w mm/min można podać?", [
        option("thirty", "Tempo można oszacować z procentu ekspozycji i temperatury powierzchni", "Umowna ekspozycja i temperatura nie zastępują pomiaru czasu ani ilości osadzającego się lodu."),
        option("point-three", "Tempo można odczytać z grubości osadu na schemacie po danej ekspozycji", "Rysunek nie ma skali grubości lodu ani czasu potrzebnych do obliczenia mm/min."),
        option("unknown", "Tempo wymaga dodatkowych danych o czasie, ilości wody i wielkości kropli", "Brakuje m.in. kalibracji, czasu i ilości oraz rozmiarów kropli."),
      ])], reason: rules.icing,
      correct: { mechanism: "supported", rate: "unknown", reason: "droplets-surface" },
      explanation: "Ciekłe krople przy −6°C są przechłodzone. Uderzając w zimną powierzchnię, mogą na niej zamarzać. W tym schemacie występuje osadzanie lodu, ale 30% ekspozycji nie wyznacza tempa w mm/min ani kategorii rzeczywistego oblodzenia. Nie oceniamy bezpieczeństwa lotu.",
      hint: "Oddziel warunki mechanizmu od wielkości, do których nie podano jednostek i kalibracji.",
      sourceUrls: [sources.icing],
    },
    {
      id: "oblodzenie-b-v1", title: "Krople i powierzchnia 2",
      context: "Powierzchnia zaczyna bez lodu i ma temperaturę powietrza. Badaj wyłącznie zamarzanie uderzających kropli; nie szron, silnik ani wcześniej wychłodzoną powierzchnię. Ekspozycja ma umowną skalę, nie minuty.",
      facts: ["Temperatura powietrza i powierzchni: +3°C", "Faza wody: krople ciekłej wody", "Ekspozycja w modelu: 80%"],
      fields: [field("mechanism", "Co przewiduje ten model dla zamarzania kropli?", [
        option("more-ice", "Akrecję, ponieważ 80% zapewnia dostatecznie długi kontakt", "Ekspozycja nie zastępuje warunku temperatury powierzchni."),
        option("crystals", "Akrecję, ponieważ krople automatycznie stają się kryształkami", "Dane określają fazę ciekłą, a temperatura powierzchni jest dodatnia."),
        option("inactive", "Brak akrecji w tym mechanizmie i przy tych założeniach", "Powierzchnia oraz krople mają tu temperaturę dodatnią."),
      ]), field("scope", "Jak daleko wolno rozszerzyć ten wynik?", [
        option("limited", "Tylko na zadany mechanizm i temperaturę powierzchni", "Brak akrecji w tym przypadku nie wyklucza wszystkich innych mechanizmów i sytuacji."),
        option("all-icing", "Na brak wszelkiego oblodzenia przy dodatniej temperaturze powietrza", "Np. powierzchnia mogłaby być wcześniej wychłodzona; ten przypadek wyraźnie to wyklucza."),
        option("safe-flight", "Na ogólną ocenę bezpieczeństwa lotu", "Ten prosty model nie dostarcza danych do takiej oceny."),
      ])], reason: rules.icing,
      correct: { mechanism: "inactive", scope: "limited", reason: "droplets-surface" },
      explanation: "Przy +3°C także na powierzchni krople nie zamarzają w opisanym mechanizmie, mimo 80% ekspozycji. To wynik tej próby, nie wykluczenie wszelkiego oblodzenia przy dodatniej temperaturze powietrza ani ocena bezpieczeństwa.",
      hint: "Sprawdź temperaturę samej powierzchni i zakres zjawisk, które przyjęto w zadaniu.",
      sourceUrls: [sources.icing],
    },
  ],
  turbulencja: [
    {
      id: "turbulencja-a-v1", title: "Dwa otoczenia przepływu",
      context: "Przewidź jakościową odpowiedź w dwóch niezależnych schematach przepływu. W obu ustawiono 45% umownego wymuszenia; nie jest to zmierzona intensywność turbulencji.",
      facts: ["Próba A: wiatr napływa na przeszkodę terenową.", "Próba B: fragmenty podłoża są nierównomiernie ogrzane.", "W obu próbach: wymuszenie 45%", "Nie podano wilgotności ani obserwacji chmur."],
      fields: [field("response", "Gdzie i jak przewidujesz zaburzenia?", [
        option("swapped", "A: wyłącznie unoszenie nad ciepłym podłożem; B: wiry za przeszkodą", "Te opisy przypisano odwrotnie do danych otoczenia."),
        option("mechanical-thermal", "A: zaburzenia za przeszkodą; B: ruchy pionowe nad ogrzanym podłożem", "Przeszkoda zmienia przepływ mechanicznie, a ogrzewanie może wywołać konwekcję."),
        option("same", "W obu taki sam przebieg, bo procent wymuszenia jest równy", "Jednakowy suwak nie znosi różnicy mechanizmów."),
      ]), field("cloud", "Czy brak danych o chmurach wyklucza te mechanizmy?", [
        option("excludes", "Tak, oba wymagają widocznej chmury", "Zaburzenia mechaniczne i ruchy termiczne mogą występować bez chmur."),
        option("thermal-only", "Wyklucza tylko ruchy termiczne", "Konwekcja nie musi doprowadzać do kondensacji."),
        option("not-required", "Nie, widoczna chmura nie jest warunkiem żadnego z nich", "Rozpatrujemy przyczynę ruchów, a nie dowód kondensacji."),
      ])], reason: rules.turbulence,
      correct: { response: "mechanical-thermal", cloud: "not-required", reason: "flow" },
      explanation: "A odpowiada zaburzeniom mechanicznym, w tym po zawietrznej przeszkody; B ruchom termicznym nad ogrzanym podłożem. Widoczna chmura nie jest konieczna. Wspólne 45% nie pozwala porównać fizycznej intensywności ani określić kategorii turbulencji.",
      hint: "Najpierw przypisz każdej próbie przyczynę zmiany ruchu, niezależnie od suwaka i obecności chmur.",
      sourceUrls: [sources.turbulence],
    },
    {
      id: "turbulencja-b-v1", title: "Ruch dwóch warstw",
      context: "Odczytaj surową obserwację znaczników w dwóch poziomych warstwach. Skala przemieszczenia i umowna siła nie są skalibrowane do rzeczywistej atmosfery.",
      facts: ["Znaczniki obu warstw ruszają w tym samym kierunku.", "W tym samym czasie górny znacznik pokonuje większą odległość niż dolny.", "Umowne wymuszenie: 85%", "Nie podano odległości między poziomami ani pomiaru turbulencji."],
      fields: [field("mechanism", "Jaką zmianę przepływu wskazują znaczniki?", [
        option("speed-shear", "Zmianę prędkości z wysokością", "Różne przemieszczenia w tym samym czasie wskazują różne prędkości warstw."),
        option("direction-only", "Wyłącznie zmianę kierunku z wysokością", "W danych kierunek obu warstw jest ten sam."),
        option("equal-wind", "Jednakowy wiatr na obu poziomach", "Jednakowy kierunek nie oznacza jednakowej prędkości."),
      ]), field("intensity", "Jaką intensywność turbulencji można przypisać?", [
        option("severe", "Silną, ponieważ ustawiono 85%", "Umowny procent nie jest fizyczną kategorią intensywności."),
        option("unknown", "Dane nie wystarczają do przypisania intensywności", "Uskok może sprzyjać zaburzeniom, ale nie zastępuje pomiaru ani oceny warunków przepływu."),
        option("none", "Na pewno brak turbulencji, bo kierunek się nie zmienia", "Uskok prędkości także może mieć znaczenie; brak zmiany kierunku nie wyklucza zaburzeń."),
      ])], reason: rules.turbulence,
      correct: { mechanism: "speed-shear", intensity: "unknown", reason: "flow" },
      explanation: "Widać uskok prędkości między poziomami, bez podanej zmiany kierunku. 85% to parametr ilustracji, nie pomiar. Bez dalszych danych nie określamy intensywności turbulencji ani konsekwencji operacyjnych.",
      hint: "Porównaj osobno kierunek i przebytą odległość. Czy procent ma fizyczną jednostkę lub kalibrację?",
      sourceUrls: [sources.turbulence],
    },
  ],
  burza: [
    {
      id: "burza-a-v1", title: "Zestaw warunków początkowych",
      context: "Użyj uproszczonego modelu trzech składników: dostępna wilgoć, chwiejność i skuteczne uniesienie. Wymuszenie w tym zadaniu pokonuje hamowanie. Oceniasz kompletność składników, nie prawdopodobieństwo rzeczywistej burzy.",
      facts: ["Wilgoć: mało", "Równowaga: chwiejna", "Wymuszenie: skuteczne uniesienie", "Etap: przed rozwojem komórki"],
      fields: [field("ingredients", "Czy model ma komplet składników inicjacji?", [
        option("complete", "Tak, chwiejność i wymuszenie zapewniają potrzebne warunki", "Nie zastępują dostępnej wilgoci."),
        option("incomplete", "Nie, jeden z potrzebnych warunków pozostaje niespełniony", "W tym wariancie brakuje wilgoci wymaganej przez model."),
        option("dissipating", "Tak, mała wilgoć wskazuje jedynie późniejszy etap życia komórki", "Nie podano rozwiniętej komórki; to ocena inicjacji, a nie jej późniejszego zaniku."),
      ], [0, 1, 2]), field("change", "Która pojedyncza zmiana uzupełnia zestaw w modelu?", [
        option("stable", "Zmiana równowagi na stabilną", "Usunęłaby jeden z wymaganych składników zamiast dostarczyć wilgoć."),
        option("no-lift", "Usunięcie wymuszenia", "Usunęłoby uniesienie, nie naprawiając braku wilgoci."),
        option("wet", "Zwiększenie dostępnej wilgoci", "Pozostałe dwa wymagane składniki są już obecne."),
      ], [0, 1, 2])], reason: rules.storm,
      correct: { ingredients: "incomplete", change: "wet", reason: "ingredients-stage" },
      explanation: "Przy małej wilgotności brakuje jednego ze składników wymaganych w tym schemacie, mimo chwiejności i skutecznego uniesienia. Samo zwiększenie dostępnej wilgoci uzupełnia zestaw. Oznacza to możliwość rozwoju w uproszczonym modelu, nie gwarancję, godzinę wystąpienia ani prognozę burzy.",
      hint: "Sprawdź każdy składnik osobno. Nie zamieniaj oceny inicjacji w odczyt stadium życia.",
      sourceUrls: [sources.storm, sources.lifting],
    },
    {
      id: "burza-b-v1", title: "Etap życia komórki",
      context: "Załóż, że pojedyncza komórka już się rozwinęła i przechodzi do umownego stadium zaniku. Przewidź dominujący przepływ na tym etapie, a nie ponowną inicjację.",
      facts: ["Wilgoć: dużo", "Równowaga: chwiejna", "Wymuszenie: skuteczne uniesienie", "Etap: stadium zaniku"],
      fields: [field("flow", "Który przepływ dominuje w tym stadium modelowej komórki?", [
        option("only-up", "Prąd wstępujący nadal przeważa nad zstępującym", "To nie jest opis stadium zaniku w modelu pojedynczej komórki."),
        option("none", "Prądy równoważą się i znika przewaga ruchu pionowego", "W tym stadium nie zakładamy równowagi prądów; dominuje ruch zstępujący."),
        option("down", "Prąd zstępujący przeważa nad wstępującym", "W idealizowanym stadium zaniku dominuje ruch w dół."),
      ], [3]), field("limit", "Co wolno wnioskować o ustaniu pozostałych zjawisk?", [
        option("not-instant", "Nazwa stadium nie dowodzi ich natychmiastowego ustania", "Nie określiliśmy dokładnego czasu zaniku opadu, wyładowań lub innych zjawisk."),
        option("no-rain", "Cały opad znika w chwili rozpoczęcia stadium", "Opad może nadal występować podczas zaniku."),
        option("no-effects", "Wszystkie skutki komórki już ustały", "Schemat przepływu nie jest takim dowodem ani oceną bezpieczeństwa."),
      ], [3])], reason: rules.storm,
      correct: { flow: "down", limit: "not-instant", reason: "ingredients-stage" },
      explanation: "Dostępna wilgoć, chwiejność i skuteczne uniesienie nie oznaczają ciągłej przewagi ruchu w górę. W zadanym stadium zaniku dominuje prąd zstępujący. To uproszczony cykl pojedynczej komórki, nie opis każdej burzy; nie wyznacza chwili ustania opadu lub wyładowań.",
      hint: "Oddziel składniki umożliwiające rozwój od etapu życia już istniejącej komórki.",
      sourceUrls: [sources.storm, sources.life],
    },
  ],
  nazwy: [
    {
      id: "nazwy-a-v1", title: "Nazwa na podstawie opisu 1",
      context: "Syntetyczna obserwacja dydaktyczna, nie podpis fotografii. Rodzaj rozpoznano jako Cumulus. Dobierz tylko człony uzasadnione opisem; brak obserwacji historii nie oznacza znanego pochodzenia.",
      facts: ["Oddzielne chmury z płaskimi podstawami.", "Niewielka rozciągłość pionowa i spłaszczony wygląd.", "Nie zaobserwowano smug opadu pod chmurami.", "Nie prowadzono obserwacji wcześniejszego rozwoju chmur."],
      fields: [field("species", "Który gatunek pasuje do opisu?", [
        option("congestus", "congestus", "Ten gatunek ma duży rozwój pionowy, którego tu nie opisano."),
        option("humilis", "humilis", "Niewielka rozciągłość pionowa i spłaszczenie odpowiadają Cumulus humilis."),
        option("calvus", "calvus", "Calvus jest gatunkiem Cumulonimbus, nie podanego rodzaju Cumulus."),
      ]), field("feature", "Jaki człon dotyczący opadu dopiszesz?", [
        option("virga", "virga", "Potrzebne są obserwowane smugi opadu zanikające nad ziemią."),
        option("praecipitatio", "praecipitatio", "Potrzebny jest obserwowany opad docierający do powierzchni."),
        option("none-observed", "Żaden z tych członów nie ma potwierdzenia", "Opis nie dostarcza dowodu na virga ani praecipitatio; nie jest to prognoza przyszłego opadu."),
      ]), field("origin", "Co zapiszesz o pochodzeniu?", [
        option("unknown", "Nie dopiszę członu pochodzenia", "Brakuje obserwacji wcześniejszego rozwoju."),
        option("stratocumulogenitus", "stratocumulogenitus", "Nie zaobserwowano rozwoju z chmur Stratocumulus."),
        option("stratomutatus", "stratomutatus", "Nie zaobserwowano przekształcenia warstwy Stratus."),
      ])], reason: rules.names,
      correct: { species: "humilis", feature: "none-observed", origin: "unknown", reason: "observed" },
      explanation: "Opis uzasadnia Cumulus humilis. Brak zaobserwowanych smug nie uzasadnia ani virga, ani praecipitatio. Bez historii nie dopisujemy pochodzenia: nie trzeba wypełniać wszystkich miejsc w nazwie.",
      hint: "Oddziel kształt i rozwój pionowy, widoczny opad oraz informacje o wcześniejszej historii.",
      sourceUrls: [sources.classification, "https://cloudatlas.wmo.int/en/species-cumulus-humilis-cu-hum.html"],
    },
    {
      id: "nazwy-b-v1", title: "Nazwa na podstawie opisu 2",
      context: "Syntetyczna obserwacja dydaktyczna, nie podpis fotografii. Rodzaj rozpoznano jako Cumulus. Dobierz gatunek i cechę opadu bez odgadywania historii.",
      facts: ["Chmury o dużej rozciągłości pionowej i wyraźnych, wypukłych konturach.", "Pod tymi chmurami obserwuje się smugi opadu, które zanikają przed dotarciem do ziemi.", "Nie prowadzono obserwacji wcześniejszego rozwoju chmur."],
      fields: [field("species", "Który gatunek pasuje do opisu?", [
        option("humilis", "humilis", "Niewielki, spłaszczony rozwój nie odpowiada podanej dużej rozciągłości pionowej."),
        option("calvus", "calvus", "Nie zmieniamy podanego rodzaju Cumulus na Cumulonimbus bez dowodów."),
        option("congestus", "congestus", "Znaczny rozwój pionowy i wyraźne wypukłe kontury odpowiadają Cumulus congestus."),
      ]), field("feature", "Która cecha opisuje podany opad?", [
        option("virga", "virga", "Smugi zanikają nad powierzchnią i do niej nie docierają."),
        option("praecipitatio", "praecipitatio", "Ten człon dotyczy opadu docierającego do powierzchni."),
        option("none-observed", "Brak obserwowanej cechy opadu", "W tym opisie smugi są widoczne; brak opadu na ziemi nie usuwa ich z obserwacji."),
      ]), field("origin", "Co wiadomo o pochodzeniu chmury?", [
        option("stratocumulogenitus", "Powstała z chmur Stratocumulus", "Opis obecnego wyglądu nie dowodzi tej historii."),
        option("unknown", "Dane nie uzasadniają członu pochodzenia", "Pochodzenie wymaga obserwacji rozwoju, której tu nie ma."),
        option("stratomutatus", "Powstała przez przekształcenie Stratus", "Nie obserwowano takiego przekształcenia."),
      ])], reason: rules.names,
      correct: { species: "congestus", feature: "virga", origin: "unknown", reason: "observed" },
      explanation: "Uzasadniona nazwa to Cumulus congestus virga. Zanik smug przed ziemią odróżnia virga od praecipitatio. Nie dopisujemy członu pochodzenia bez historii i nie zmieniamy podpisu żadnej autentycznej fotografii.",
      hint: "Sama obecność smug nie rozstrzyga członu opadu: sprawdź, czy docierają do ziemi.",
      sourceUrls: [sources.classification, "https://cloudatlas.wmo.int/en/species-cumulus-congestus-cu-con.html", "https://cloudatlas.wmo.int/en/supplementary-features-and-accessory-clouds-cumulus.html"],
    },
  ],
};

// Order depends only on stable IDs, never on correctness, wording or the saved answer.
export function orderedOptions(caseId, fieldId, options) {
  const score = id => {
    let hash = 2166136261;
    for (const character of `assessment-v2:${caseId}:${fieldId}:${id}`) {
      hash = Math.imul(hash ^ character.charCodeAt(0), 16777619);
    }
    return hash >>> 0;
  };
  return [...options].sort((a, b) => score(a.id) - score(b.id) || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
}

export const transferCases = Object.fromEntries(Object.entries(caseBank).map(([activityId, cases]) => [activityId,
  cases.map(task => ({ ...task,
    fields: task.fields.map(field => ({ ...field, options: orderedOptions(task.id, field.id, field.options) })),
    reason: { ...task.reason, options: orderedOptions(task.id, "reason", task.reason.options) },
  })),
]));
