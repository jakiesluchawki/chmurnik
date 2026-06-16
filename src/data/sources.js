export const sources = {
  wmoAtlas: {
    id: "wmoAtlas",
    organization: "World Meteorological Organization",
    title: "International Cloud Atlas",
    label: "WMO Cloud Atlas",
    url: "https://cloudatlas.wmo.int/",
    kind: "Norma klasyfikacyjna",
    trust:
      "Oficjalny, międzynarodowy wzorzec nazw i opisu chmur używany w meteorologii.",
    scope:
      "Rodzaje, gatunki, odmiany, cechy dodatkowe, chmury towarzyszące i zasady identyfikacji.",
    checkText: "International Cloud Atlas",
    retrieved: "16 czerwca 2026",
  },
  wmoSummary: {
    id: "wmoSummary",
    organization: "World Meteorological Organization",
    title: "Cloud classification summary",
    label: "WMO: tabela klasyfikacji",
    url: "https://cloudatlas.wmo.int/en/cloud-classification-summary.html",
    kind: "Norma klasyfikacyjna",
    trust:
      "Zwięzła tabela urzędowej klasyfikacji WMO, w tym dopuszczalnych kombinacji nazw.",
    scope: "Dziesięć rodzajów oraz przypisane gatunki, odmiany i cechy.",
    checkText: "Cloud classification summary",
    retrieved: "16 czerwca 2026",
  },
  wmoPrinciples: {
    id: "wmoPrinciples",
    organization: "World Meteorological Organization",
    title: "Principles of cloud classification",
    label: "WMO: zasady klasyfikacji",
    url: "https://cloudatlas.wmo.int/en/principles-of-cloud-classification.html",
    kind: "Norma klasyfikacyjna",
    trust:
      "Oficjalne zasady tworzenia pełnych nazw: rodzaj, gatunek, odmiana, cecha dodatkowa, chmura towarzysząca, chmura macierzysta i chmura specjalna.",
    scope:
      "Definicje warstw taksonomii, reguły genitus i mutatus oraz pięć kategorii chmur specjalnych.",
    checkText: "Principles of cloud classification",
    retrieved: "16 czerwca 2026",
  },
  wmoObservation: {
    id: "wmoObservation",
    organization: "World Meteorological Organization",
    title: "Identifying clouds",
    label: "WMO: obserwacja i identyfikacja",
    url: "https://cloudatlas.wmo.int/en/identifying-clouds.html",
    kind: "Metodyka obserwacji",
    trust:
      "Oficjalne wytyczne WMO dotyczące identyfikacji z powierzchni, obserwowania całego nieba i śledzenia ewolucji chmur.",
    scope:
      "Budowa obserwacji terenowej, ciągła obserwacja, pełny horyzont, zmienność wyglądu i wpływ uskoku wiatru.",
    checkText: "Identifying clouds",
    retrieved: "16 czerwca 2026 · monitoring automatyczny",
  },
  wmoUpperAtmosphere: {
    id: "wmoUpperAtmosphere",
    organization: "World Meteorological Organization",
    title: "Upper atmospheric clouds",
    label: "WMO: chmury górnej atmosfery",
    url: "https://cloudatlas.wmo.int/en/upper-atmospheric-clouds.html",
    kind: "Norma klasyfikacyjna",
    trust:
      "Oficjalny atlas odróżniający chmury polarnej stratosfery i mezosfery od dziesięciu rodzajów troposferycznych.",
    scope:
      "Chmury perłowe, polarne chmury stratosferyczne i obłoki srebrzyste.",
    checkText: "Upper atmospheric clouds",
    retrieved: "16 czerwca 2026",
  },
  faaWeather: {
    id: "faaWeather",
    organization: "Federal Aviation Administration",
    title: "Aviation Weather Handbook FAA-H-8083-28B",
    label: "FAA Aviation Weather Handbook",
    url: "https://www.faa.gov/regulationspolicies/handbooksmanuals/aviation/faa-h-8083-28b-aviation-weather-handbook",
    kind: "Podręcznik lotniczy",
    trust:
      "Aktualny podręcznik FAA łączący meteorologię z podejmowaniem decyzji w lotnictwie.",
    scope:
      "Stabilność, fronty, konwekcja, oblodzenie, turbulencja, burze i interpretacja pogody.",
    checkText: "FAA-H-8083-28B",
    retrieved: "16 czerwca 2026 · monitoring automatyczny",
  },
  easaAircrew: {
    id: "easaAircrew",
    organization: "European Union Aviation Safety Agency",
    title: "Easy Access Rules for Aircrew",
    label: "EASA Aircrew",
    url: "https://www.easa.europa.eu/en/document-library/easy-access-rules/easy-access-rules-aircrew-regulation-eu-no-11782011",
    kind: "Ramy szkolenia lotniczego",
    trust:
      "Oficjalne europejskie wymagania i materiały konsolidujące zakres wiedzy załóg lotniczych.",
    scope: "Zakres szkolenia meteorologicznego pilotów w Europie.",
    checkText: "Easy Access Rules for Aircrew",
    retrieved: "16 czerwca 2026",
  },
  awcCodes: {
    id: "awcCodes",
    organization: "NOAA Aviation Weather Center",
    title: "METAR and TAF product information",
    label: "AWC: METAR i TAF",
    url: "https://aviationweather.gov/help/data/",
    kind: "Wskazówki operacyjne",
    trust:
      "Oficjalny serwis NOAA wyjaśniający format i wykorzystanie lotniczych danych pogodowych.",
    scope: "Grupy zachmurzenia, pułap, widzialność oraz struktura raportów.",
    checkText: "METAR",
    retrieved: "16 czerwca 2026 · monitoring automatyczny",
  },
  windyLevels: {
    id: "windyLevels",
    organization: "Windy Community",
    title: "Display wind at various altitudes instead of pressure",
    label: "Windy: wysokość i ciśnienie",
    url: "https://community.windy.com/topic/39492/how-to-configure-windy-web-and-ios-to-display-wind-at-various-altitudes-instead-of-pressure",
    kind: "Objaśnienie interfejsu",
    trust:
      "Dokumentacja społeczności Windy pomaga zrozumieć kontrolki produktu; nie jest normą meteorologiczną.",
    scope: "Przełączanie poziomów ciśnienia i przybliżonych wysokości.",
    checkText: "Display wind at various altitudes instead of pressure",
    retrieved: "16 czerwca 2026",
  },
  windyClouds: {
    id: "windyClouds",
    organization: "Windy Community",
    title: "Cloud tops lower than cloud base",
    label: "Windy: podstawa i wierzchołki",
    url: "https://community.windy.com/topic/43145/cloud-tops-lower-than-cloud-base",
    kind: "Objaśnienie interfejsu",
    trust:
      "Odpowiedź zespołu Windy wyjaśnia, że warstwy podstawy i wierzchołków opisują różne pola modelu; nie zastępują obserwacji.",
    scope:
      "Wierzchołki chmur konwekcyjnych, najniższa warstwa zachmurzenia przekraczająca 50% i ograniczenia porównywania obu pól.",
    checkText: "Cloud tops lower than cloud base",
    retrieved: "16 czerwca 2026 · monitoring automatyczny",
  },
  windyCloudBase: {
    id: "windyCloudBase",
    organization: "Windy Community",
    title: "Is the cloud base layer in AGL or MSL?",
    label: "Windy: podstawa chmur AGL",
    url: "https://community.windy.com/topic/7102/is-the-cloud-base-layer-in-agl-or-msl",
    kind: "Objaśnienie interfejsu",
    trust:
      "Odpowiedź moderatora Windy potwierdza odniesienie AGL i opisuje wpływ uproszczonego modelu wysokości terenu.",
    scope:
      "Wysokość podstawy chmur nad gruntem, rozdzielczość orografii modelu i możliwe rozbieżności w górach.",
    checkText: "above ground level",
    retrieved: "16 czerwca 2026 · monitoring automatyczny",
  },
  commons: {
    id: "commons",
    organization: "Wikimedia Commons",
    title: "Repozytorium wolnych mediów",
    label: "Wikimedia Commons",
    url: "https://commons.wikimedia.org/",
    kind: "Źródło fotografii",
    trust:
      "Każde zdjęcie ma osobną stronę pliku z autorem, licencją i historią.",
    scope: "Fotografie identyfikacyjne użyte w atlasie.",
    checkText: "Wikimedia Commons",
    retrieved: "16 czerwca 2026",
  },
};

export const sourceList = Object.values(sources);

export function getSources(ids = []) {
  return ids.map((id) => sources[id]).filter(Boolean);
}
