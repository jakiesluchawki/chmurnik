export const fieldQuestions = [
  {
    id: "shape",
    eyebrow: "Dowód 1 · budowa",
    prompt: "Jaki porządek dominuje w obserwowanym fragmencie nieba?",
    help: "Najpierw nazwij geometrię. Kolor zostaw na później, bo silnie zależy od oświetlenia.",
    options: [
      {
        id: "fibres",
        label: "Włókna, haczyki lub smugi",
        description: "Delikatne pasma bez wyraźnych zaokrąglonych członów.",
        signal: "dominują włókna lub smugi",
        weights: { cirrus: 8, cirrostratus: 2, cumulonimbus: 1, stratus: -2, nimbostratus: -2 },
      },
      {
        id: "veil",
        label: "Cienka zasłona",
        description: "Duża część nieba jest przykryta, ale warstwa pozostaje przejrzysta.",
        signal: "obraz jest cienką, rozległą zasłoną",
        weights: { cirrostratus: 8, altostratus: 3, cirrus: 2, cumulus: -2, stratocumulus: -2 },
      },
      {
        id: "layer",
        label: "Jednolita warstwa",
        description: "Mało oddzielnych członów; niebo wygląda jak zasłona lub pokrywa.",
        signal: "dominuje jednolita warstwa",
        weights: { altostratus: 6, nimbostratus: 6, stratus: 6, cirrostratus: 3, stratocumulus: 1, cumulus: -3 },
      },
      {
        id: "cells",
        label: "Ławica członów lub fal",
        description: "Powtarzalne ziarenka, płaty, wały albo soczewki.",
        signal: "widoczna jest ławica powtarzalnych członów",
        weights: { cirrocumulus: 7, altocumulus: 7, stratocumulus: 6, cirrus: -2, stratus: -2 },
      },
      {
        id: "heaps",
        label: "Oddzielne kłęby",
        description: "Kopuły mają własne granice, często płaską podstawę i jasne wierzchołki.",
        signal: "widać oddzielne kłęby i kopuły",
        weights: { cumulus: 8, altocumulus: 2, stratocumulus: 2, altostratus: -3, cirrostratus: -2 },
      },
      {
        id: "tower",
        label: "Wieża o dużej głębokości",
        description: "Rozwój pionowy dominuje nad szerokością i szybko się zmienia.",
        signal: "dominuje silny rozwój pionowy",
        weights: {
          cumulonimbus: 9,
          cumulus: 6,
          altocumulus: 1,
          stratocumulus: -5,
          cirrostratus: -4,
          stratus: -4,
        },
      },
    ],
  },
  {
    id: "scale",
    eyebrow: "Dowód 2 · skala",
    prompt: "Jak duże są powtarzalne elementy przy wyciągniętej ręce?",
    help: "Skala kątowa pomaga rozdzielić podobne ławice. Jeśli nie ma członów, wybierz warstwę bez elementów.",
    options: [
      {
        id: "tiny",
        label: "Mniejsze niż mały palec",
        description: "Bardzo drobne elementy, zwykle bez wyraźnego szarego cienia.",
        signal: "elementy są bardzo drobne i prawie bez cienia",
        weights: { cirrocumulus: 8, cirrus: 1, altocumulus: -3, stratocumulus: -4 },
      },
      {
        id: "medium",
        label: "Około 1–3 palców",
        description: "Człony mają czytelną jasną i ciemną stronę.",
        signal: "elementy mają średnią skalę i własne cieniowanie",
        weights: { altocumulus: 8, stratocumulus: 2, cirrocumulus: -3 },
      },
      {
        id: "large",
        label: "Większe niż trzy palce",
        description: "Duże wały, płaty albo wyraźne kopuły.",
        signal: "elementy są duże i wyraźnie modelowane światłem",
        weights: { stratocumulus: 8, cumulus: 5, altocumulus: 1, cirrocumulus: -4 },
      },
      {
        id: "none",
        label: "Brak oddzielnych elementów",
        description: "Skala członów nie ma zastosowania, bo widoczna jest zasłona lub warstwa.",
        signal: "nie ma oddzielnych członów do porównania",
        weights: { cirrostratus: 4, altostratus: 4, nimbostratus: 4, stratus: 4, cirrocumulus: -2, cumulus: -2 },
      },
      {
        id: "unknown",
        label: "Nie umiem ocenić",
        description: "Perspektywa, horyzont albo kilka nałożonych warstw utrudnia ocenę.",
        signal: "skala elementów pozostaje nierozstrzygnięta",
        weights: {},
      },
    ],
  },
  {
    id: "light",
    eyebrow: "Dowód 3 · światło",
    prompt: "Co dzieje się ze światłem i cieniem?",
    help: "Patrz bezpiecznie w pobliże Słońca, nigdy bezpośrednio w jego tarczę. Halo i sposób tłumienia światła bywają rozstrzygające.",
    options: [
      {
        id: "halo",
        label: "Halo lub ostra tarcza przez zasłonę",
        description: "Wysoka, lodowa warstwa pozostaje optycznie cienka.",
        signal: "występuje halo albo ostra tarcza przez cienką zasłonę",
        weights: { cirrostratus: 10, cirrus: 2, altostratus: -4, nimbostratus: -5 },
      },
      {
        id: "ground-glass",
        label: "Słońce jak przez matowe szkło",
        description: "Tarcza jest rozmyta, a halo nie występuje.",
        signal: "Słońce jest widoczne jak przez matowe szkło",
        weights: { altostratus: 9, stratus: 2, cirrostratus: -4 },
      },
      {
        id: "hidden",
        label: "Słońce całkiem ukryte",
        description: "Warstwa jest gruba albo obserwacja dotyczy ciemnej części układu.",
        signal: "warstwa całkowicie ukrywa Słońce",
        weights: { nimbostratus: 7, altostratus: 5, stratus: 4, cumulonimbus: 2, cirrocumulus: -3 },
      },
      {
        id: "shadows",
        label: "Człony mają jasną i ciemną stronę",
        description: "Trójwymiarowe elementy są dość grube, by tworzyć własne cieniowanie.",
        signal: "człony mają wyraźne cieniowanie",
        weights: { altocumulus: 6, stratocumulus: 6, cumulus: 5, cumulonimbus: 4, cirrocumulus: -3 },
      },
      {
        id: "bright",
        label: "Białe elementy prawie bez cienia",
        description: "Włókna albo drobne ziarenka pozostają bardzo jasne.",
        signal: "elementy są jasne i prawie bez własnego cienia",
        weights: { cirrus: 6, cirrocumulus: 5, cirrostratus: 2, nimbostratus: -4 },
      },
    ],
  },
  {
    id: "precipitation",
    eyebrow: "Dowód 4 · opad",
    prompt: "Jaki związek z opadem naprawdę widzisz?",
    help: "Oddziel smugi, które wyparowują przed ziemią, od opadu ciągłego i przelotnego.",
    options: [
      {
        id: "none",
        label: "Brak widocznego opadu",
        description: "Nie widać smug ani kurtyn opadowych.",
        signal: "nie widać opadu ani virg",
        weights: { cirrus: 1, cirrocumulus: 1, cirrostratus: 1, altocumulus: 1, stratocumulus: 1, cumulus: 1 },
      },
      {
        id: "virga",
        label: "Virga, opad zanika w powietrzu",
        description: "Smugi opadają spod chmury, ale nie docierają do gruntu.",
        signal: "widoczne są smugi virga",
        weights: { altocumulus: 6, altostratus: 5, cirrocumulus: 4, cirrus: 2, stratocumulus: 2 },
      },
      {
        id: "continuous",
        label: "Rozległy opad ciągły",
        description: "Deszcz lub śnieg obejmuje dużą część horyzontu przez dłuższy czas.",
        signal: "opad jest rozległy i ciągły",
        weights: { nimbostratus: 10, altostratus: 4, stratus: 2, cumulonimbus: -3, cirrus: -4 },
      },
      {
        id: "showers",
        label: "Przelotne kurtyny lub ulewa",
        description: "Opad jest lokalny, zmienny albo wyraźnie związany z komórką.",
        signal: "opad ma charakter przelotny lub konwekcyjny",
        weights: { cumulonimbus: 10, cumulus: 5, stratocumulus: 2, nimbostratus: -4 },
      },
      {
        id: "drizzle",
        label: "Mżawka z niskiej warstwy",
        description: "Drobny opad pochodzi z jednolitej, bardzo niskiej podstawy.",
        signal: "występuje mżawka z niskiej warstwy",
        weights: { stratus: 9, stratocumulus: 3, nimbostratus: 2, cirrostratus: -4 },
      },
    ],
  },
  {
    id: "evolution",
    eyebrow: "Dowód 5 · czas",
    prompt: "Co zmieniło się w ciągu ostatnich 10–15 minut?",
    help: "WMO podkreśla ciągłą obserwację. Jeden kadr może ukryć przemianę między rodzajami.",
    options: [
      {
        id: "steady",
        label: "Głównie dryfuje lub faluje",
        description: "Kształt zmienia się powoli, bez szybkiego grubienia albo wzrostu.",
        signal: "układ głównie dryfuje lub faluje",
        weights: { cirrus: 2, cirrocumulus: 2, altocumulus: 2, stratocumulus: 2, stratus: 2 },
      },
      {
        id: "thickening",
        label: "Gęstnieje i obniża się",
        description: "Zasłona tłumi światło coraz silniej, a niższe warstwy przybywają.",
        signal: "warstwa gęstnieje i pozornie się obniża",
        weights: { cirrostratus: 8, altostratus: 8, nimbostratus: 6, cumulus: -3 },
      },
      {
        id: "growing",
        label: "Kopuły szybko rosną pionowo",
        description: "Nowe wypukłości są ostre i pojawiają się jedna nad drugą.",
        signal: "kopuły szybko rosną pionowo",
        weights: { cumulus: 9, cumulonimbus: 6, altocumulus: 2, stratus: -4 },
      },
      {
        id: "icing-top",
        label: "Wierzchołek wygładza się lub włóknieje",
        description: "Kalafiorowa ostrość zanika; może pojawiać się kowadło.",
        signal: "wierzchołek traci ostrość i nabiera cech lodowych",
        weights: {
          cumulonimbus: 12,
          cirrus: 1,
          altocumulus: -3,
          stratocumulus: -5,
          cumulus: -6,
        },
      },
      {
        id: "spreading",
        label: "Rozpada się albo rozlewa w warstwę",
        description: "Kłęby tracą ostrość, łączą się lub pozostawiają płaską pokrywę.",
        signal: "elementy rozpadają się lub rozlewają w warstwę",
        weights: { cumulus: 4, stratocumulus: 4, altocumulus: 3, altostratus: 1 },
      },
      {
        id: "unknown",
        label: "Nie obserwuję wystarczająco długo",
        description: "Zapisz ten brak danych zamiast dopowiadać zmianę z pojedynczego kadru.",
        signal: "zmiana w czasie nie została jeszcze sprawdzona",
        weights: {},
      },
    ],
  },
];

export const pairDiscriminators = {
  "altocumulus|cirrocumulus":
    "Wyciągnij rękę: dominujące elementy Cirrocumulus są zwykle mniejsze od małego palca i prawie bez cienia; Altocumulus ma większe, częściej cieniowane człony.",
  "altocumulus|stratocumulus":
    "Porównaj skalę elementów wysoko nad głową, nie przy horyzoncie. Duże wały szersze niż trzy palce wspierają Stratocumulus; mniejsze, wyraźnie oddzielone płaty częściej Altocumulus.",
  "altostratus|cirrostratus":
    "Sprawdź światło: halo i ostra tarcza wspierają Cirrostratus. Tarcza podobna do matowego szkła, bez halo, wspiera Altostratus.",
  "altostratus|nimbostratus":
    "Obserwuj opad i tarczę Słońca. Długotrwały opad przy całkowicie ukrytym Słońcu wspiera Nimbostratus; widoczna rozmyta tarcza częściej Altostratus.",
  "cirrostratus|cirrus":
    "Sprawdź pokrycie całego nieba. Oddzielne włókna wspierają Cirrus, a ciągła cienka zasłona z możliwym halo — Cirrostratus.",
  "cumulonimbus|cumulus":
    "Patrz na najwyższy wierzchołek przez kilka minut. Gładzenie, włóknienie lub kowadło oznacza zlodzenie i wspiera Cumulonimbus; ostre kalafiorowe kopuły wspierają Cumulus.",
  "nimbostratus|stratus":
    "Sprawdź głębokość układu i charakter opadu. Mżawka z jednolitej bardzo niskiej warstwy wspiera Stratus; rozległy ciągły deszcz lub śnieg i warstwy pannus wspierają Nimbostratus.",
  "stratocumulus|stratus":
    "Szukaj członów i przerw. Stratocumulus zachowuje duże wały lub płaty, podczas gdy Stratus jest bardziej jednolity i może dawać mżawkę.",
};

export const fieldPrinciples = [
  "Obejrzyj całe niebo i pełny horyzont, nie tylko najciekawszy fragment.",
  "Obserwuj zmianę przez co najmniej 10–15 minut.",
  "Oddziel cechę widoczną od wniosku o nazwie i pogodzie.",
];
