export const soundingPressureGrid = [1000, 925, 850, 700, 500, 300, 200];
export const soundingTemperatureGrid = [-70, -60, -50, -40, -30, -20, -10, 0, 10, 20, 30, 40];

export const soundingGlossary = [
  {
    id: "lcl",
    term: "LCL",
    polish: "poziom kondensacji przy unoszeniu",
    explanation:
      "Wysokość, na której unoszona porcja osiąga nasycenie. Jest wskazówką podstawy chmury tworzonej przez tę konkretną parcelę, nie uniwersalną podstawą wszystkich chmur.",
  },
  {
    id: "lfc",
    term: "LFC",
    polish: "poziom swobodnej konwekcji",
    explanation:
      "Poziom, powyżej którego porcja staje się cieplejsza od otoczenia i może dalej wznosić się dzięki dodatniej wyporności.",
  },
  {
    id: "el",
    term: "EL",
    polish: "poziom równowagi",
    explanation:
      "Górny poziom, przy którym wznosząca się porcja ponownie osiąga temperaturę otoczenia. Nie jest automatycznie rzeczywistym wierzchołkiem każdej chmury.",
  },
  {
    id: "freezing",
    term: "0°C",
    polish: "poziom temperatury zamarzania",
    explanation:
      "Poziom, na którym temperatura otoczenia przecina 0°C. Mokry termometr, faza hydrometeorów i ruch pionowy nadal mają znaczenie dla oblodzenia i rodzaju opadu.",
  },
];

export const soundingScenarios = [
  {
    id: "stratus-inversion",
    number: "01",
    label: "Niska warstwa",
    title: "Stratus uwięziony pod inwersją",
    short:
      "T i Td są blisko przy ziemi, a temperatura rośnie w dolnej warstwie. Wilgoć nie ma łatwej drogi ku górze.",
    sourceType: "Idealizowany profil dydaktyczny",
    parcelOrigin: "powierzchnia",
    profile: [
      { pressure: 1000, temperature: 7, dewpoint: 6, parcel: 7, windDirection: 160, windSpeed: 4 },
      { pressure: 950, temperature: 8, dewpoint: 7, parcel: 3, windDirection: 170, windSpeed: 7 },
      { pressure: 925, temperature: 9, dewpoint: 7, parcel: 1, windDirection: 180, windSpeed: 9 },
      { pressure: 900, temperature: 9, dewpoint: 6, parcel: -1, windDirection: 190, windSpeed: 11 },
      { pressure: 850, temperature: 6, dewpoint: 0, parcel: -5, windDirection: 210, windSpeed: 16 },
      { pressure: 700, temperature: -4, dewpoint: -15, parcel: -16, windDirection: 230, windSpeed: 23 },
      { pressure: 500, temperature: -20, dewpoint: -35, parcel: -34, windDirection: 250, windSpeed: 34 },
      { pressure: 300, temperature: -46, dewpoint: -58, parcel: -57, windDirection: 265, windSpeed: 48 },
      { pressure: 200, temperature: -58, dewpoint: -70, parcel: -68, windDirection: 270, windSpeed: 57 },
    ],
    levels: {
      lcl: 960,
      lfc: null,
      el: null,
      freezing: 790,
    },
    inversion: { bottom: 1000, top: 925, label: "inwersja przyziemna" },
    cloudLayers: [
      { bottom: 985, top: 900, label: "płytka warstwa nasycona" },
    ],
    reading: {
      verdict: "Stabilna, wilgotna warstwa graniczna",
      stability:
        "Porcja chłodzi się szybciej niż otoczenie w warstwie inwersji, pozostaje więc ujemnie wyporna. Nie ma LFC.",
      moisture:
        "Mały odstęp T–Td od powierzchni do około 900 hPa wspiera niski Stratus, mgłę lub Stratocumulus.",
      wind:
        "Wiatr nasila się stopniowo, lecz w najniższej warstwie nie ma gwałtownego skoku prędkości.",
      aviation:
        "Najważniejsze mogą być niski pułap, widzialność i możliwe oblodzenie w przechłodzonej warstwie, a nie konwekcja.",
      uncertainty:
        "Profil punktowy nie pokazuje, gdzie warstwa styka się z terenem ani czy nasycenie utrzymuje się między stacją a trasą.",
    },
    check: {
      prompt: "Który wniosek najlepiej łączy wszystkie sygnały tego profilu?",
      options: [
        "Duża energia konwekcji powierzchniowej gwarantuje burzę.",
        "Wilgoć jest płytka i ograniczona inwersją, więc bardziej prawdopodobna jest niska warstwa niż głęboka konwekcja.",
        "Szeroki odstęp T–Td przy ziemi wskazuje bardzo suche powietrze.",
        "Brak LFC oznacza, że nie mogą wystąpić żadne chmury.",
      ],
      correct: 1,
      explanation:
        "Bliskość T i Td wskazuje nasycenie, ale inwersja i chłodniejsza od otoczenia parcela hamują pionowy rozwój. To środowisko niskiej warstwy, nie swobodnej głębokiej konwekcji.",
    },
  },
  {
    id: "capped-warm-sector",
    number: "02",
    label: "Pokrywa",
    title: "Wilgotny dół pod ciepłą pokrywą",
    short:
      "Wilgotne powietrze przy ziemi napotyka cieplejszą warstwę na wysokości około 800 hPa. Ta warstwa hamuje jego unoszenie przed osiągnięciem LFC.",
    sourceType: "Idealizowany profil dydaktyczny",
    parcelOrigin: "powierzchnia",
    profile: [
      { pressure: 1000, temperature: 27, dewpoint: 19, parcel: 27, windDirection: 150, windSpeed: 9 },
      { pressure: 925, temperature: 22, dewpoint: 17, parcel: 21, windDirection: 170, windSpeed: 14 },
      { pressure: 850, temperature: 18, dewpoint: 13, parcel: 16, windDirection: 190, windSpeed: 20 },
      { pressure: 800, temperature: 20, dewpoint: 8, parcel: 13, windDirection: 210, windSpeed: 27 },
      { pressure: 700, temperature: 9, dewpoint: 1, parcel: 8, windDirection: 225, windSpeed: 34 },
      { pressure: 600, temperature: 1, dewpoint: -7, parcel: 1, windDirection: 235, windSpeed: 41 },
      { pressure: 500, temperature: -8, dewpoint: -18, parcel: -7, windDirection: 245, windSpeed: 49 },
      { pressure: 300, temperature: -36, dewpoint: -48, parcel: -33, windDirection: 260, windSpeed: 64 },
      { pressure: 200, temperature: -52, dewpoint: -63, parcel: -51, windDirection: 270, windSpeed: 72 },
    ],
    levels: {
      lcl: 885,
      lfc: 610,
      el: null,
      elUnresolved: true,
      freezing: 585,
    },
    inversion: { bottom: 850, top: 800, label: "pokrywa hamująca" },
    cloudLayers: [
      { bottom: 900, top: 840, label: "możliwa płytka chmura przy LCL" },
    ],
    reading: {
      verdict: "Chwiejność warunkowa z silnym hamowaniem",
      stability:
        "Po osiągnięciu LCL unoszona porcja powietrza pozostaje wyraźnie chłodniejsza od warstwy około 800 hPa. Dopiero wyżej staje się cieplejsza od otoczenia. W pokazanym zakresie nie osiąga jeszcze górnego poziomu równowagi EL.",
      moisture:
        "Wilgoć jest duża nisko, ale powyżej 800 hPa odstęp T–Td rośnie. Sama wilgotna powierzchnia nie dowodzi głębokiej chmury.",
      wind:
        "Prędkość i kierunek zmieniają się z wysokością, co może organizować konwekcję dopiero wtedy, gdy zostanie ona zainicjowana.",
      aviation:
        "Najpierw może dominować spokojniejsza warstwa lub cumulus ograniczony pokrywą. Jej przełamanie może szybko zmienić charakter sytuacji.",
      uncertainty:
        "Siła wymuszenia, zmiana temperatury powierzchni i wybór parceli decydują, czy zaznaczony LFC jest osiągalny.",
    },
    check: {
      prompt: "Dlaczego duży potencjał powyżej pokrywy nie oznacza jeszcze burzy?",
      options: [
        "Bo T i Td nigdy nie mogą spotkać się na diagramie.",
        "Bo wiatr na 200 hPa jest zawsze zbyt silny dla chmur.",
        "Bo parcela musi najpierw pokonać warstwę ujemnej wyporności i potrzebuje mechanizmu unoszenia.",
        "Bo LCL zawsze znajduje się wyżej niż EL.",
      ],
      correct: 2,
      explanation:
        "Ciepła warstwa około 800 hPa hamuje unoszenie. Dopiero odpowiednio silne wymuszenie, ogrzewanie lub zmiana profilu może doprowadzić parcelę do LFC.",
    },
  },
  {
    id: "deep-convection",
    number: "03",
    label: "Głęboka konwekcja",
    title: "Wilgotna parcela z rozległą dodatnią wypornością",
    short:
      "Unoszona porcja powietrza jest cieplejsza od otoczenia w dużej części profilu. Sprzyja to silnemu rozwojowi pionowemu, ale nie wskazuje, gdzie rozpocznie się konwekcja.",
    sourceType: "Idealizowany profil dydaktyczny",
    parcelOrigin: "powierzchnia",
    profile: [
      { pressure: 1000, temperature: 30, dewpoint: 22, parcel: 30, windDirection: 140, windSpeed: 10 },
      { pressure: 925, temperature: 24, dewpoint: 19, parcel: 24, windDirection: 165, windSpeed: 17 },
      { pressure: 850, temperature: 18, dewpoint: 13, parcel: 19, windDirection: 190, windSpeed: 25 },
      { pressure: 700, temperature: 6, dewpoint: -2, parcel: 9, windDirection: 220, windSpeed: 37 },
      { pressure: 600, temperature: -2, dewpoint: -10, parcel: 2, windDirection: 235, windSpeed: 45 },
      { pressure: 500, temperature: -12, dewpoint: -22, parcel: -7, windDirection: 245, windSpeed: 53 },
      { pressure: 400, temperature: -24, dewpoint: -35, parcel: -19, windDirection: 255, windSpeed: 61 },
      { pressure: 300, temperature: -39, dewpoint: -50, parcel: -34, windDirection: 265, windSpeed: 72 },
      { pressure: 200, temperature: -55, dewpoint: -65, parcel: -54, windDirection: 275, windSpeed: 82 },
    ],
    levels: {
      lcl: 900,
      lfc: 835,
      el: null,
      elUnresolved: true,
      freezing: 625,
    },
    inversion: null,
    cloudLayers: [
      { bottom: 900, top: 200, label: "możliwa głęboka chmura konwekcyjna" },
    ],
    reading: {
      verdict: "Głęboka chwiejność powierzchniowa",
      stability:
        "Powyżej LFC unoszona porcja powietrza jest cieplejsza od otoczenia aż do górnej granicy wykresu. Profil nie sięga do górnego poziomu równowagi EL, więc nie podajemy jego wysokości.",
      moisture:
        "Niski poziom ma mały odstęp T–Td. Suchsze powietrze średnie może wzmacniać parowanie i prądy zstępujące, ale nie unieważnia potencjału konwekcji.",
      wind:
        "Wyraźne skręcanie i wzrost prędkości z wysokością wskazują silny uskok głęboki, ważny dla organizacji komórek.",
      aviation:
        "Jeśli konwekcja zostanie zainicjowana, możliwe są głębokie Cumulonimbus, silne prądy pionowe, grad, oblodzenie, turbulencja i wyładowania.",
      uncertainty:
        "Profil nie wskazuje, gdzie i kiedy powstanie burza. Potrzebne są wymuszenie, radar, satelita, wyładowania i aktualne ostrzeżenia.",
    },
    check: {
      prompt: "Który element najbardziej odróżnia ten profil od samej wysokiej wartości CAPE na mapie?",
      options: [
        "Widać pionową relację T, Td, parceli i wiatru oraz poziomy, między którymi działa wyporność.",
        "Diagram gwarantuje dokładną trasę każdej przyszłej burzy.",
        "Profil usuwa potrzebę sprawdzania radaru i ostrzeżeń.",
        "Każda linia na diagramie jest obserwacją z powierzchni.",
      ],
      correct: 0,
      explanation:
        "Profil pokazuje strukturę całej kolumny: wilgoć, pokrywę lub jej brak, głębokość wyporności i uskok. Nadal jest punktem w czasie i przestrzeni, a nie prognozą toru burzy.",
    },
  },
  {
    id: "elevated-convection",
    number: "04",
    label: "Konwekcja wyniesiona",
    title: "Stabilna powierzchnia, chwiejna warstwa wyżej",
    short:
      "Stabilna warstwa przy ziemi hamuje unoszenie. Wilgotne powietrze powyżej inwersji może jednak stać się cieplejsze od otoczenia po wymuszonym uniesieniu.",
    sourceType: "Idealizowany profil dydaktyczny",
    parcelOrigin: "850 hPa, nad inwersją",
    profile: [
      { pressure: 1000, temperature: 4, dewpoint: 1, parcel: null, windDirection: 60, windSpeed: 7 },
      { pressure: 950, temperature: 3, dewpoint: 0, parcel: null, windDirection: 80, windSpeed: 10 },
      { pressure: 900, temperature: 3, dewpoint: -1, parcel: null, windDirection: 105, windSpeed: 15 },
      { pressure: 850, temperature: 10, dewpoint: 8, parcel: 10, windDirection: 155, windSpeed: 27 },
      { pressure: 800, temperature: 7, dewpoint: 6, parcel: 6, windDirection: 185, windSpeed: 34 },
      { pressure: 700, temperature: -1, dewpoint: -3, parcel: 0, windDirection: 215, windSpeed: 43 },
      { pressure: 600, temperature: -8, dewpoint: -12, parcel: -6, windDirection: 230, windSpeed: 51 },
      { pressure: 500, temperature: -17, dewpoint: -25, parcel: -14, windDirection: 245, windSpeed: 60 },
      { pressure: 300, temperature: -42, dewpoint: -55, parcel: -39, windDirection: 265, windSpeed: 74 },
      { pressure: 200, temperature: -57, dewpoint: -68, parcel: -56, windDirection: 275, windSpeed: 81 },
    ],
    levels: {
      lcl: 820,
      lfc: 760,
      el: null,
      elUnresolved: true,
      freezing: 715,
    },
    inversion: { bottom: 900, top: 850, label: "inwersja oddzielająca powierzchnię" },
    cloudLayers: [
      { bottom: 825, top: 200, label: "możliwa konwekcja wyniesiona" },
    ],
    reading: {
      verdict: "Chwiejność wyniesiona ponad stabilnym dołem",
      stability:
        "Przyziemna warstwa jest chłodna i stabilna. Powietrze unoszone z wilgotnej warstwy około 850 hPa osiąga natomiast własny LCL i LFC. Pozostaje cieplejsze od otoczenia przy górnej granicy wykresu, więc nie wyznaczamy tu górnego poziomu równowagi EL.",
      moisture:
        "T i Td zbliżają się nad inwersją, a nie przy powierzchni. To zmienia poziom podstawy i źródło powietrza dla chmury.",
      wind:
        "Szybki wzrost prędkości oraz skręt przez dolne poziomy wskazują znaczny uskok, mimo słabego wiatru przy ziemi.",
      aviation:
        "Burze lub oblodzenie mogą występować ponad stabilną warstwą, podczas gdy obserwacja powierzchniowa wygląda stosunkowo spokojnie.",
      uncertainty:
        "Wybór parceli jest częścią diagnozy. Automatyczny parametr liczony tylko od powierzchni może nie opisać tego przypadku.",
    },
    check: {
      prompt: "Dlaczego analiza wyłącznie parceli powierzchniowej byłaby tu myląca?",
      options: [
        "Bo powierzchnia ciśnienia 850 hPa zawsze leży pod ziemią.",
        "Bo wilgotna, chwiejna parcela zaczyna ruch nad stabilną inwersją, a nie przy gruncie.",
        "Bo punkt rosy może być większy od temperatury.",
        "Bo wiatr nie może zmieniać kierunku z wysokością.",
      ],
      correct: 1,
      explanation:
        "Źródłem konwekcji jest warstwa około 850 hPa. NWS podkreśla, że indeksy oparte wyłącznie na parceli powierzchniowej mogą pominąć konwekcję wyniesioną.",
    },
  },
];

export function getSoundingScenario(id) {
  return soundingScenarios.find((scenario) => scenario.id === id);
}
