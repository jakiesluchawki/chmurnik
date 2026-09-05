const wmoSources = ["wmoAtlas", "wmoSummary", "wmoPrinciples"];

export const taxonomyCategories = [
  {
    id: "species",
    label: "Gatunki",
    singular: "Gatunek",
    count: 15,
    description:
      "Opisują kształt i budowę chmury. Na przykład Cumulus humilis jest niski i płaski, a Cumulus congestus silnie wypiętrzony. Nie każdy rodzaj dzieli się na gatunki.",
  },
  {
    id: "varieties",
    label: "Odmiany",
    singular: "Odmiana",
    count: 9,
    description:
      "Opisują układ chmur albo to, ile światła przepuszcza warstwa. Jedna chmura może mieć kilka odmian, o ile ich cechy się nie wykluczają.",
  },
  {
    id: "features",
    label: "Cechy dodatkowe",
    singular: "Cecha dodatkowa",
    count: 11,
    description:
      "Nazywają charakterystyczne części chmury i związane z nią zjawiska, na przykład kowadło, wał szkwałowy lub virga: opad, który nie dociera do ziemi.",
  },
  {
    id: "accessory",
    label: "Chmury towarzyszące",
    singular: "Chmura towarzysząca",
    count: 4,
    description:
      "Mniejsze chmury związane z główną chmurą, odrębne albo częściowo z nią złączone.",
  },
  {
    id: "mother",
    label: "Chmury macierzyste",
    singular: "Oznaczenie pochodzenia",
    count: 2,
    description:
      "Końcówki genitus i mutatus zapisują pochodzenie albo przemianę chmury. To informacja o historii rozwoju.",
  },
  {
    id: "special",
    label: "Chmury specjalne",
    singular: "Chmura specjalna",
    count: 5,
    description:
      "Nazwy związane z lokalnym źródłem powstania, takim jak pożar, wodospad, las lub działalność człowieka.",
  },
  {
    id: "upper",
    label: "Górna atmosfera",
    singular: "Chmura górnej atmosfery",
    count: 3,
    description:
      "Rzadkie chmury polarnej stratosfery i mezosfery, klasyfikowane poza dziesięcioma rodzajami troposferycznymi.",
  },
];

export const taxonomyTerms = [
  {
    id: "fibratus",
    category: "species",
    name: "fibratus",
    polish: "włóknisty",
    definition:
      "Cienkie włókna albo pasma, zwykle proste lub łagodnie zakrzywione, które nie kończą się haczykami ani gęstymi kępkami.",
    diagnostic:
      "Szukaj delikatnej, równoległej struktury. W Cirrostratus włókna mogą być wtopione w rozległą zasłonę.",
    genera: ["cirrus", "cirrostratus"],
    sourceIds: wmoSources,
  },
  {
    id: "uncinus",
    category: "species",
    name: "uncinus",
    polish: "haczykowaty",
    definition:
      "Cirrus zakończony haczykiem lub przecinkiem, często z długim włóknistym ogonem opadających kryształków lodu.",
    diagnostic:
      "Zgrubienie znajduje się na jednym końcu włókna, a nie na całej jego długości. Kształt bywa nazywany końskim ogonem.",
    genera: ["cirrus"],
    sourceIds: wmoSources,
  },
  {
    id: "spissatus",
    category: "species",
    name: "spissatus",
    polish: "gęsty",
    definition:
      "Cirrus na tyle optycznie gruby, że przy patrzeniu ku Słońcu może wyglądać szarawo. Często powstaje z pozostałości kowadła Cumulonimbus.",
    diagnostic:
      "Wciąż ma włóknistą, lodową budowę Cirrus, ale jest wyraźnie gęstszy od typowych cienkich smug.",
    genera: ["cirrus"],
    sourceIds: wmoSources,
  },
  {
    id: "castellanus",
    category: "species",
    name: "castellanus",
    polish: "wieżyczkowaty",
    definition:
      "Chmura z szeregiem pionowych wypukłości przypominających blanki, wyrastających ze wspólnej poziomej podstawy.",
    diagnostic:
      "Wieżyczki są szczególnie czytelne z boku. W Altocumulus mogą wskazywać niestabilność na poziomie średnim.",
    genera: ["cirrus", "cirrocumulus", "altocumulus", "stratocumulus"],
    sourceIds: wmoSources,
  },
  {
    id: "floccus",
    category: "species",
    name: "floccus",
    polish: "kłaczkowaty",
    definition:
      "Małe kępki o kłębiastym wierzchu i postrzępionej podstawie, często z opadającymi smugami kryształków lub kropli.",
    diagnostic:
      "Elementy są bardziej odrębne i kępkowate niż w stratiformis; nie tworzą regularnych wieżyczek castellanus.",
    genera: ["cirrus", "cirrocumulus", "altocumulus", "stratocumulus"],
    sourceIds: wmoSources,
  },
  {
    id: "stratiformis",
    category: "species",
    name: "stratiformis",
    polish: "warstwowy",
    definition:
      "Rozległa ławica lub warstwa złożona z połączonych albo regularnie rozmieszczonych kłębów, płatów czy wałów.",
    diagnostic:
      "Chmury rozciągają się przede wszystkim na boki. Wielkość elementów i ich cieniowanie pomagają odróżnić Cirrocumulus (Cc), Altocumulus (Ac) i Stratocumulus (Sc).",
    genera: ["cirrocumulus", "altocumulus", "stratocumulus"],
    sourceIds: wmoSources,
  },
  {
    id: "lenticularis",
    category: "species",
    name: "lenticularis",
    polish: "soczewkowaty",
    definition:
      "Gładkie soczewki lub migdały, często wydłużone i wyraźnie odcięte, tworzące się w falowym przepływie powietrza.",
    diagnostic:
      "Pozornie stoją w miejscu mimo silnego wiatru. Kilka soczewek może układać się jedna nad drugą.",
    searchTerms: ["soczewka", "ufo", "fala górska", "orograficzna"],
    genera: ["cirrocumulus", "altocumulus", "stratocumulus"],
    sourceIds: wmoSources,
  },
  {
    id: "volutus",
    category: "species",
    name: "volutus",
    polish: "walcowaty",
    definition:
      "Długi, poziomy, odizolowany wał chmurowy obracający się wokół osi poziomej i przemieszczający się jako spójna struktura.",
    diagnostic:
      "W przeciwieństwie do arcus jest oddzielony od chmury macierzystej i nie stanowi jej przyczepionej krawędzi szkwałowej.",
    searchTerms: ["wał", "roll cloud", "walec"],
    genera: ["altocumulus", "stratocumulus"],
    sourceIds: wmoSources,
  },
  {
    id: "nebulosus",
    category: "species",
    name: "nebulosus",
    polish: "mglisty",
    definition:
      "Jednolita zasłona lub warstwa bez wyraźnych członów, włókien i charakterystycznej struktury.",
    diagnostic:
      "Wysoka, cienka zasłona, czasem z halo, może być Cirrostratus (Cs). Bardzo niska, szara warstwa częściej odpowiada Stratus (St).",
    genera: ["cirrostratus", "stratus"],
    sourceIds: wmoSources,
  },
  {
    id: "fractus",
    category: "species",
    name: "fractus",
    polish: "postrzępiony",
    definition:
      "Nieregularne, poszarpane fragmenty chmur, które szybko zmieniają kształt i mogą powstawać pod opadem lub w turbulentnej warstwie.",
    diagnostic:
      "W Cumulus fractus widać zalążki kłębiastych kopuł. Stratus fractus ma mniej wypukłą budowę. Sam postrzępiony brzeg nie wystarcza do ich rozróżnienia.",
    genera: ["stratus", "cumulus"],
    sourceIds: wmoSources,
  },
  {
    id: "humilis",
    category: "species",
    name: "humilis",
    polish: "niski, płaski",
    definition:
      "Cumulus o małej rozciągłości pionowej, płaskiej podstawie i szerokości wyraźnie większej niż wysokość.",
    diagnostic:
      "Kopuły są dobrze zarysowane, lecz wzrost szybko zatrzymuje stabilna warstwa lub słaba wyporność.",
    genera: ["cumulus"],
    sourceIds: wmoSources,
  },
  {
    id: "mediocris",
    category: "species",
    name: "mediocris",
    polish: "średnio rozwinięty",
    definition:
      "Cumulus o umiarkowanym rozwoju pionowym, którego wysokość jest zbliżona do szerokości.",
    diagnostic:
      "To etap między płaskim humilis a silnie wypiętrzonym congestus; obserwacja tempa wzrostu jest ważniejsza niż jeden kadr.",
    genera: ["cumulus"],
    sourceIds: wmoSources,
  },
  {
    id: "congestus",
    category: "species",
    name: "congestus",
    polish: "wypiętrzony",
    definition:
      "Silnie rozwinięty Cumulus z ostrymi, kalafiorowymi wieżami i wysokością znacznie większą od szerokości podstawy.",
    diagnostic:
      "Porównaj ostre, kłębiaste kopuły z wygładzającym się lub włóknistym wierzchołkiem Cumulonimbus. Nie określaj składu chmury wyłącznie na podstawie jej wielkości.",
    genera: ["cumulus"],
    sourceIds: wmoSources,
  },
  {
    id: "calvus",
    category: "species",
    name: "calvus",
    polish: "łysy, wygładzony",
    definition:
      "Cumulonimbus, którego górne wypukłości zaczynają tracić ostre kontury i stają się gładkawe wskutek zlodzenia.",
    diagnostic:
      "Brak klasycznego kowadła nie wyklucza burzy. Przejście z kalafiorowej faktury do gładkiej jest cechą graniczną z congestus.",
    genera: ["cumulonimbus"],
    sourceIds: wmoSources,
  },
  {
    id: "capillatus",
    category: "species",
    name: "capillatus",
    polish: "włóknisty",
    definition:
      "Dojrzały Cumulonimbus z wyraźnie włóknistą, pierzastą lub pasiastą górną częścią zbudowaną z kryształków lodu.",
    diagnostic:
      "Często, lecz nie zawsze, tworzy kowadło incus. Włóknisty wierzchołek odróżnia go od calvus.",
    genera: ["cumulonimbus"],
    sourceIds: wmoSources,
  },
  {
    id: "intortus",
    category: "varieties",
    name: "intortus",
    polish: "splątany",
    definition:
      "Włókna Cirrus są nieregularnie zakrzywione i splątane, bez uporządkowania typowego dla radiatus lub vertebratus.",
    diagnostic: "Oceniaj układ całej grupy włókien, nie pojedyncze zagięcie.",
    genera: ["cirrus"],
    sourceIds: wmoSources,
  },
  {
    id: "vertebratus",
    category: "varieties",
    name: "vertebratus",
    polish: "kręgowy",
    definition:
      "Elementy układają się jak kręgosłup, żebra albo szkielet ryby: główna oś z bocznymi odgałęzieniami.",
    diagnostic: "Wzór musi być czytelny w organizacji wielu włókien Cirrus.",
    genera: ["cirrus"],
    sourceIds: wmoSources,
  },
  {
    id: "undulatus",
    category: "varieties",
    name: "undulatus",
    polish: "pofalowany",
    definition:
      "Elementy lub warstwa układają się w fale, często jako jeden albo dwa systemy równoległych pasm.",
    diagnostic:
      "Fale wskazują organizację przepływu; nie określają samodzielnie wysokości ani rodzaju chmury.",
    genera: ["cirrocumulus", "cirrostratus", "altocumulus", "altostratus", "stratocumulus", "stratus"],
    sourceIds: wmoSources,
  },
  {
    id: "radiatus",
    category: "varieties",
    name: "radiatus",
    polish: "promienisty",
    definition:
      "Równoległe pasma pozornie zbiegają się ku jednemu lub dwóm punktom horyzontu wskutek perspektywy.",
    diagnostic:
      "Pasma są w rzeczywistości prawie równoległe. Zbieżność nie oznacza, że fizycznie spotykają się nad horyzontem.",
    genera: ["cirrus", "altocumulus", "altostratus", "stratocumulus", "cumulus"],
    sourceIds: wmoSources,
  },
  {
    id: "lacunosus",
    category: "varieties",
    name: "lacunosus",
    polish: "perforowany",
    definition:
      "Cienka ławica z regularnymi, zaokrąglonymi otworami o postrzępionych krawędziach, często przypominająca plaster miodu.",
    diagnostic:
      "Otwory należą do układu warstwy. Pojedynczy cavum jest cechą dodatkową o innej skali i genezie.",
    genera: ["cirrocumulus", "altocumulus", "stratocumulus"],
    sourceIds: wmoSources,
  },
  {
    id: "duplicatus",
    category: "varieties",
    name: "duplicatus",
    polish: "podwójny, wielowarstwowy",
    definition:
      "Dwie lub więcej warstw albo ławic tego samego rodzaju występuje na nieco różnych wysokościach i może częściowo się nakładać.",
    diagnostic:
      "Nie każda wielowarstwowa sytuacja to duplicatus; warstwy muszą należeć do tego samego rodzaju.",
    genera: ["cirrus", "cirrostratus", "altocumulus", "altostratus", "stratocumulus"],
    sourceIds: wmoSources,
  },
  {
    id: "translucidus",
    category: "varieties",
    name: "translucidus",
    polish: "przeświecający",
    definition:
      "Warstwa jest na tyle cienka, że położenie Słońca lub Księżyca można wyraźnie rozpoznać.",
    diagnostic:
      "To kategoria przejrzystości, nie synonim cienkiej chmury wysokiej. Występuje także w niskich i średnich rodzajach.",
    genera: ["altocumulus", "altostratus", "stratocumulus", "stratus"],
    sourceIds: wmoSources,
  },
  {
    id: "perlucidus",
    category: "varieties",
    name: "perlucidus",
    polish: "z prześwitami",
    definition:
      "Między elementami ławicy pozostają wyraźne szczeliny, przez które widać niebo, Słońce, Księżyc lub wyższą warstwę.",
    diagnostic:
      "Prześwity znajdują się między kłębami lub płatami; w translucidus światło przechodzi przez samą chmurę.",
    genera: ["altocumulus", "stratocumulus"],
    sourceIds: wmoSources,
  },
  {
    id: "opacus",
    category: "varieties",
    name: "opacus",
    polish: "nieprzeświecający",
    definition:
      "Warstwa jest wystarczająco gruba, aby całkowicie zasłonić położenie Słońca lub Księżyca.",
    diagnostic:
      "Ta odmiana mówi o zasłanianiu światła, nie o wysokości. Może dotyczyć Altocumulus, Altostratus, Stratocumulus lub Stratus.",
    genera: ["altocumulus", "altostratus", "stratocumulus", "stratus"],
    sourceIds: wmoSources,
  },
  {
    id: "incus",
    category: "features",
    name: "incus",
    polish: "kowadło",
    definition:
      "Górna część Cumulonimbus rozlana w kształt kowadła wskutek dojścia prądu wstępującego do stabilnej warstwy i silnego przepływu wysokościowego.",
    diagnostic:
      "Kowadło jest włókniste i lodowe. Może rozciągać się daleko poza rdzeń opadowy.",
    searchTerms: ["anvil", "burza", "kowadło burzowe"],
    genera: ["cumulonimbus"],
    sourceIds: wmoSources,
  },
  {
    id: "mamma",
    category: "features",
    name: "mamma",
    polish: "wymiona",
    definition:
      "Workowate wypukłości zwisające z dolnej powierzchni chmury, szczególnie efektowne pod kowadłem, lecz niewyłączne dla burz.",
    diagnostic:
      "Ich obecność nie dowodzi tornada ani automatycznie skrajnej pogody przy powierzchni.",
    genera: ["cirrus", "cirrocumulus", "altocumulus", "altostratus", "stratocumulus", "cumulonimbus"],
    sourceIds: wmoSources,
  },
  {
    id: "virga",
    category: "features",
    name: "virga",
    polish: "smugi opadu niedochodzące do ziemi",
    definition:
      "Pionowe lub ukośne smugi opadu, które zanikają przed dotarciem do ziemi. Krople parują, a kryształki lodu mogą przechodzić bezpośrednio w parę wodną, czyli sublimować.",
    diagnostic:
      "Śledź, czy smuga zanika w powietrzu. Gdy opad dociera do gruntu, właściwym terminem jest praecipitatio.",
    searchTerms: ["parujące przed dotarciem", "opad nie dociera do ziemi"],
    genera: ["cirrocumulus", "altocumulus", "altostratus", "nimbostratus", "stratocumulus", "cumulus", "cumulonimbus"],
    sourceIds: wmoSources,
  },
  {
    id: "praecipitatio",
    category: "features",
    name: "praecipitatio",
    polish: "opad docierający do powierzchni",
    definition:
      "Opad, na przykład deszcz, śnieg lub krupa, który wypada z chmury i dociera do powierzchni Ziemi.",
    diagnostic:
      "Termin dotyczy widocznego związku opadu z chmurą, nie jego intensywności ani czasu trwania.",
    genera: ["altostratus", "nimbostratus", "stratocumulus", "stratus", "cumulus", "cumulonimbus"],
    sourceIds: wmoSources,
  },
  {
    id: "arcus",
    category: "features",
    name: "arcus",
    polish: "wał szkwałowy",
    definition:
      "Gęsty poziomy wał przy przedniej dolnej części chmury konwekcyjnej, związany z czołem wypływu chłodnego powietrza.",
    diagnostic:
      "Jest przyczepiony do układu burzowego lub konwekcyjnego; odizolowany walec może być volutus.",
    searchTerms: ["shelf cloud", "szkwał", "wał", "front szkwałowy"],
    genera: ["cumulus", "cumulonimbus"],
    sourceIds: wmoSources,
  },
  {
    id: "tuba",
    category: "features",
    name: "tuba",
    polish: "lej",
    definition:
      "Lej lub stożek zwisający z podstawy chmury i związany z wirującym powietrzem. O tornadzie decyduje kontakt wiru z powierzchnią, nie długość widocznego leja.",
    diagnostic:
      "Widoczny lej nie musi sięgać ziemi, choć wir już do niej dociera. Wirujące szczątki, pył lub rozbryzg u podstawy mogą być dodatkową wskazówką; nie podchodź bliżej, żeby to sprawdzić.",
    genera: ["cumulus", "cumulonimbus"],
    sourceIds: [...wmoSources, "nwsSpotterGlossary"],
  },
  {
    id: "asperitas",
    category: "features",
    name: "asperitas",
    polish: "wzburzona powierzchnia",
    definition:
      "Wyraźne, chaotyczne fale na spodzie chmury, oglądane od dołu jak wzburzone ciemne morze.",
    diagnostic:
      "Struktura jest bardziej nieregularna i dramatyczna niż undulatus; nie oznacza, że chmura jest burzowa.",
    searchTerms: ["wzburzone morze", "undulatus asperatus"],
    genera: ["altocumulus", "stratocumulus"],
    sourceIds: wmoSources,
  },
  {
    id: "cavum",
    category: "features",
    name: "cavum",
    polish: "otwór opadowy",
    definition:
      "Wyraźna okrągła lub wydłużona dziura w cienkiej warstwie chmury, często z virga opadającą z jej środka.",
    diagnostic:
      "Zwykle powstaje po zainicjowaniu kryształków lodu w przechłodzonej warstwie; bywa związany z przelotem samolotu.",
    genera: ["cirrocumulus", "altocumulus", "stratocumulus"],
    sourceIds: wmoSources,
  },
  {
    id: "cauda",
    category: "features",
    name: "cauda",
    polish: "ogon",
    definition:
      "Niska pozioma smuga chmurowa połączona z murus i skierowana ku strefie opadu, związana z dopływem powietrza do burzy.",
    diagnostic:
      "Nie należy mylić jej z lejem tuba; cauda jest pozioma i połączona z chmurą ścienną.",
    genera: ["cumulonimbus"],
    sourceIds: wmoSources,
  },
  {
    id: "fluctus",
    category: "features",
    name: "fluctus",
    polish: "fala Kelvina–Helmholtza",
    definition:
      "Krótkotrwałe grzebienie przypominające załamujące się fale morskie. Powstają przy uskoku wiatru, gdy sąsiednie warstwy powietrza poruszają się z różną prędkością.",
    diagnostic:
      "Regularne zawijające się grzebienie odróżniają fluctus od zwykłego pofalowania undulatus.",
    searchTerms: ["turbulencja", "uskok wiatru", "Kelvin Helmholtz", "fala"],
    genera: ["cirrus", "altocumulus", "stratocumulus", "stratus", "cumulus"],
    sourceIds: wmoSources,
  },
  {
    id: "murus",
    category: "features",
    name: "murus",
    polish: "chmura ścienna",
    definition:
      "Lokalne, trwałe obniżenie podstawy Cumulonimbus, zwykle pod bezdeszczową częścią silnego prądu wstępującego.",
    diagnostic:
      "Obracająca się chmura ścienna jest niepokojącym objawem w burzy. Samo obniżenie podstawy nie potwierdza jednak tornada; sprawdź aktualne ostrzeżenia.",
    searchTerms: ["wall cloud", "superkomórka", "tornado"],
    genera: ["cumulonimbus"],
    sourceIds: wmoSources,
  },
  {
    id: "pileus",
    category: "accessory",
    name: "pileus",
    polish: "czapeczka",
    definition:
      "Mała, gładka chmura soczewkowata nad szybko rosnącą wieżą konwekcyjną, tworzona przez unoszenie wilgotnej warstwy nad wierzchołkiem.",
    diagnostic:
      "Wieża może szybko przebić pileus. Jest sygnałem silnego wzrostu, lecz nie osobnym dowodem burzy.",
    genera: ["cumulus", "cumulonimbus"],
    sourceIds: wmoSources,
  },
  {
    id: "velum",
    category: "accessory",
    name: "velum",
    polish: "welon",
    definition:
      "Rozległa pozioma zasłona ponad lub wokół środkowej albo górnej części chmury konwekcyjnej.",
    diagnostic:
      "Jest większa i trwalsza niż pileus, a rosnąca wieża może ją częściowo przebić.",
    genera: ["cumulus", "cumulonimbus"],
    sourceIds: wmoSources,
  },
  {
    id: "pannus",
    category: "accessory",
    name: "pannus",
    polish: "strzępy opadowe",
    definition:
      "Postrzępione niskie fragmenty pod główną chmurą, często tworzące się w wilgotnym powietrzu chłodzonym przez opad.",
    diagnostic:
      "Pannus może zasłaniać właściwą podstawę i sprawiać wrażenie niższego rodzaju chmury.",
    genera: ["altostratus", "nimbostratus", "cumulus", "cumulonimbus"],
    sourceIds: wmoSources,
  },
  {
    id: "flumen",
    category: "accessory",
    name: "flumen",
    polish: "pas dopływowy",
    definition:
      "Niski szeroki pas chmur układający się wzdłuż przepływu ku superkomórce, związany z dopływem wilgotnego powietrza.",
    diagnostic:
      "Jest powiązany z układem burzowym, ale nie łączy się z murus w taki sposób jak cauda.",
    genera: ["cumulonimbus"],
    sourceIds: wmoSources,
  },
  {
    id: "genitus",
    category: "mother",
    name: "genitus",
    polish: "powstały z części innej chmury",
    definition:
      "Nowy rodzaj rozwija się z części chmury macierzystej, która nadal istnieje. Nazwa źródłowego rodzaju otrzymuje końcówkę -genitus.",
    diagnostic:
      "Przykład: Cirrus cumulonimbogenitus rozwija się z górnej części Cumulonimbus, podczas gdy chmura burzowa nadal jest rozpoznawalna.",
    genera: ["cirrus", "cirrocumulus", "cirrostratus", "altocumulus", "altostratus", "nimbostratus", "stratocumulus", "stratus", "cumulus", "cumulonimbus"],
    sourceIds: wmoSources,
  },
  {
    id: "mutatus",
    category: "mother",
    name: "mutatus",
    polish: "przekształcony z innej chmury",
    definition:
      "Cała chmura lub jej większa część przechodzi w nowy rodzaj. Nazwa pierwotnego rodzaju otrzymuje końcówkę -mutatus.",
    diagnostic:
      "Przykład: Stratocumulus stratomutatus oznacza, że warstwa Stratus przekształciła się w chmurę z wyraźnymi kłębami lub wałami.",
    genera: ["cirrus", "cirrocumulus", "cirrostratus", "altocumulus", "altostratus", "nimbostratus", "stratocumulus", "stratus", "cumulus", "cumulonimbus"],
    sourceIds: wmoSources,
  },
  {
    id: "cataractagenitus",
    category: "special",
    name: "cataractagenitus",
    polish: "powstały przy wodospadzie",
    definition:
      "Chmura tworzona przez rozbryzg dużego wodospadu, gdy unoszona wilgoć prowadzi do lokalnego nasycenia.",
    diagnostic:
      "Pochodzenie musi być bezpośrednio związane z pyłem wodnym i przepływem przy wodospadzie.",
    genera: ["cumulus", "stratus"],
    sourceIds: ["wmoSpecialClouds"],
  },
  {
    id: "flammagenitus",
    category: "special",
    name: "flammagenitus",
    polish: "powstały wskutek intensywnego ciepła",
    definition:
      "Chmura konwekcyjna rozwinięta nad pożarem lub erupcją wulkaniczną wskutek silnego lokalnego ogrzewania i unoszenia.",
    diagnostic:
      "Źródło termiczne jest częścią pełnej nazwy; rozwój może prowadzić do głębokiej, niebezpiecznej konwekcji.",
    searchTerms: ["pożar", "wulkan", "pyrocumulus", "pyrocumulonimbus"],
    genera: ["cumulus", "cumulonimbus"],
    sourceIds: ["wmoSpecialClouds", "faaWeather"],
  },
  {
    id: "homogenitus",
    category: "special",
    name: "homogenitus",
    polish: "powstały wskutek działalności człowieka",
    definition:
      "Chmura powstała bezpośrednio wskutek działalności człowieka, najczęściej smuga kondensacyjna rozwijająca się za samolotem.",
    diagnostic:
      "Jeśli chmura później upodobni się do naturalnego rodzaju, jej dalszą historię może opisywać termin homomutatus.",
    genera: ["cirrus", "cirrocumulus", "cirrostratus", "altocumulus", "altostratus", "nimbostratus", "stratocumulus", "stratus", "cumulus", "cumulonimbus"],
    sourceIds: ["wmoSpecialClouds", "wmoContrails"],
  },
  {
    id: "homomutatus",
    category: "special",
    name: "homomutatus",
    polish: "przekształcony z homogenitus",
    definition:
      "Trwała smuga kondensacyjna, która rozprzestrzeniła się i zmieniła w Cirrus, Cirrocumulus lub Cirrostratus o wyglądzie podobnym do chmur powstałych naturalnie.",
    diagnostic:
      "Nazwa zachowuje informację o pochodzeniu od samolotu, nawet gdy smuga nie jest już rozpoznawalna. Potrzebna jest obserwacja jej przemiany, nie tylko końcowego wyglądu.",
    genera: ["cirrus", "cirrocumulus", "cirrostratus"],
    sourceIds: ["wmoSpecialClouds"],
  },
  {
    id: "silvagenitus",
    category: "special",
    name: "silvagenitus",
    polish: "powstały nad lasem",
    definition:
      "Chmura powstająca lokalnie nad lasem dzięki wilgoci oddawanej przez rośliny i parującej z mokrych powierzchni. Parowanie połączone z oddawaniem wody przez rośliny to ewapotranspiracja.",
    diagnostic:
      "Związek przestrzenny i proces nad obszarem leśnym są istotniejsze niż sam kłębiasty wygląd.",
    genera: ["stratus"],
    sourceIds: ["wmoSpecialClouds"],
  },
  {
    id: "nacreous",
    category: "upper",
    name: "Nacreous clouds",
    polish: "chmury perłowe",
    definition:
      "Bardzo rzadkie, soczewkowate chmury polarnej stratosfery na wysokości około 20–30 km, intensywnie iryzujące przed wschodem lub po zachodzie Słońca.",
    diagnostic:
      "Jasne barwy perłowe utrzymują się przy Słońcu kilka stopni pod horyzontem; zwykłe chmury troposferyczne są wtedy ciemne.",
    image: {
      src: "assets/upper-atmosphere/nacreous-clouds-antarctica.jpg",
      alt: "Iryzujące chmury perłowe nad stacją McMurdo na Antarktydzie",
      width: 1920,
      height: 1440,
      author: "Alan Light",
      license: "CC BY 2.0",
      page: "https://commons.wikimedia.org/wiki/File:Nacreous_clouds_Antarctica.jpg",
    },
    genera: [],
    sourceIds: ["wmoUpperAtmosphere", "nacreousPhoto"],
  },
  {
    id: "polar-stratospheric",
    category: "upper",
    name: "Polar stratospheric clouds",
    polish: "polarne chmury stratosferyczne",
    definition:
      "Chmury powstające zimą w bardzo zimnej polarnej stratosferze, obejmujące różne składy cząstek i mające znaczenie dla chemii ozonu.",
    diagnostic:
      "Nie wszystkie polarne chmury stratosferyczne są efektownie perłowe; typ optyczny i skład nie są tym samym podziałem.",
    image: {
      src: "assets/upper-atmosphere/polar-stratospheric-cloud-type-i.jpg",
      alt: "Polarna chmura stratosferyczna typu I ponad Cirrus o wschodzie Słońca",
      width: 1920,
      height: 671,
      author: "François Guerraz",
      license: "CC BY-SA 3.0",
      page: "https://commons.wikimedia.org/wiki/File:Polar_Stratospheric_Cloud_type_I_above_Cirrus.jpg",
    },
    searchTerms: ["PSC", "stratosfera polarna", "ozon"],
    genera: [],
    sourceIds: ["wmoUpperAtmosphere", "polarStratosphericPhoto"],
  },
  {
    id: "noctilucent",
    category: "upper",
    name: "Noctilucent clouds",
    polish: "obłoki srebrzyste",
    definition:
      "Najwyższe obserwowane chmury, zwykle około 80–85 km w mezosferze, złożone z drobnych kryształków lodu i widoczne podczas zmierzchu.",
    diagnostic:
      "Świecą srebrzyście lub niebieskawo po zachodzie, gdy mezosfera jest jeszcze oświetlona, a dolna atmosfera pozostaje w cieniu.",
    image: {
      src: "assets/upper-atmosphere/noctilucent-clouds-laboe.jpg",
      alt: "Obłoki srebrzyste nad wodą w Laboe po zachodzie Słońca",
      width: 1920,
      height: 1280,
      author: "Matthias Süßen",
      license: "CC BY-SA 4.0",
      page: "https://commons.wikimedia.org/wiki/File:Noctilucent-clouds-msu-6817.jpg",
    },
    searchTerms: ["NLC", "mezosfera", "nocne obłoki"],
    genera: [],
    sourceIds: ["wmoUpperAtmosphere", "noctilucentPhoto"],
  },
];

export const cloudProfiles = {
  cirrus: {
    essence:
      "Cirrus tworzy wysoko na niebie włókna i smugi z kryształków lodu, rozciągane przez wiatr. Obserwuj, czy pojedyncze pasma zanikają, czy stopniowo łączą się w coraz gęstszą zasłonę.",
    composition:
      "Prawie wyłącznie kryształki lodu. Opadające kryształki trafiają do warstw o różnej wilgotności i wietrze. Zmiana prędkości lub kierunku wiatru z wysokością, czyli uskok wiatru, rozciąga smugi.",
    formation: [
      "łagodne unoszenie wilgotnego powietrza przy strefach frontowych",
      "rozciąganie resztek kowadła Cumulonimbus",
      "lokalne fale i turbulencja w pobliżu prądu strumieniowego",
      "smugi samolotowe trwające co najmniej 10 minut (Cirrus homogenitus), które po dalszej przemianie mogą otrzymać określenie homomutatus",
    ],
    weather: [
      "Izolowany Cirrus może nie zapowiadać istotnej zmiany pogody.",
      "Narastanie pokrycia, przejście w Cirrostratus i obniżanie kolejnych warstw wspiera interpretację zbliżania się rozległego systemu frontowego.",
      "Spissatus pochodzenia burzowego może pozostawać długo po zaniku głównego rdzenia konwekcyjnego.",
    ],
    aviation: [
      "Zwykle nie tworzy klasycznego oblodzenia strukturalnego z przechłodzonych kropli, lecz wskazuje środowisko kryształków lodu.",
      "Gęsty Cirrus i kowadła mogą wiązać się z turbulencją, ograniczeniem widzialności z kokpitu oraz kryształkami lodu niebezpiecznymi dla części silników.",
      "Nie wolno traktować jasnej, cienkiej postaci jako dowodu bezpiecznej odległości od głębokiej konwekcji.",
    ],
    optics: [
      "halo, słońca poboczne i łuki przy uporządkowanych kryształkach",
      "subtelne barwy iryzacyjne w cienkich, świeżych fragmentach",
    ],
    evolution: [
      "Cirrus może gęstnieć i rozszerzać się w Cirrostratus.",
      "Fragmenty kowadła mogą odrywać się jako Cirrus spissatus cumulonimbogenitus.",
      "Silny uskok rozciąga włókna i może tworzyć radiatus, vertebratus lub fluctus.",
    ],
    lookAlikes: [
      { name: "Smuga kondensacyjna", rule: "Obserwuj jej powstanie za samolotem. Smuga trwająca co najmniej 10 minut to Cirrus homogenitus; po rozprzestrzenieniu i przemianie może stać się Cirrus homomutatus." },
      { name: "Cirrostratus fibratus", rule: "Cirrostratus tworzy bardziej ciągłą zasłonę obejmującą dużą część nieba." },
      { name: "Virga z Altocumulus", rule: "Znajdź wyżej właściwą ławicę Ac i oceń większą skalę oraz cieniowanie elementów." },
    ],
    fieldChecklist: [
      "zanotuj kierunek włókien i ich zmianę w 10–20 minut",
      "sprawdź, czy rośnie pokrycie całego nieba",
      "szukaj halo oraz niższych warstw na horyzoncie",
    ],
    namingExamples: ["Cirrus fibratus", "Cirrus uncinus", "Cirrus spissatus cumulonimbogenitus", "Cirrus vertebratus"],
    motherClouds: {
      genitus: ["cirrocumulogenitus", "altocumulogenitus", "cumulonimbogenitus"],
      mutatus: ["cirrostratomutatus"],
    },
  },
  cirrocumulus: {
    essence:
      "Cirrocumulus tworzy wysoko położone ławice bardzo drobnych kłębków, ziaren lub fal. Przy rozpoznawaniu porównaj ich pozorną wielkość i cieniowanie; same „baranki” nie wystarczą do odróżnienia go od Altocumulus.",
    composition:
      "Głównie kryształki lodu, czasem silnie przechłodzone krople w krótkotrwałych fragmentach. Elementy często szybko zmieniają się wskutek przemian fazowych.",
    formation: [
      "falowanie w wilgotnej warstwie górnej troposfery",
      "konwekcyjne komórki o niewielkiej rozciągłości w warstwie wysokiej",
      "przemiana Cirrus lub Cirrostratus w członowaną strukturę",
    ],
    weather: [
      "Wskazuje wilgoć i ruch falowy lub niestabilność wysoko, lecz nie jest prostym zwiastunem opadu przy powierzchni.",
      "W połączeniu z narastającym Cirrostratus może być elementem większej zmiany synoptycznej.",
    ],
    aviation: [
      "Znajduje się zwykle na poziomach przelotowych i może współwystępować z falami oraz zmianami wiatru.",
      "Sam widok z ziemi nie pozwala określić głębokości warstwy ani intensywności turbulencji.",
    ],
    optics: ["korona: niewielkie barwne pierścienie wokół Słońca lub Księżyca", "iryzacja: pastelowe barwy w cienkich fragmentach"],
    evolution: [
      "Może tworzyć się z Cirrus lub Cirrostratus i ponownie tracić członowaną strukturę.",
      "Pod kępkami floccus może być widoczna virga, czyli opad zanikający przed dotarciem do ziemi. Cavum to otwór w warstwie, często ze smugą opadu pośrodku.",
    ],
    lookAlikes: [
      { name: "Altocumulus", rule: "Cc ma drobniejsze elementy i zwykle nie wykazuje własnego szarego cienia; sama reguła palca nie wystarcza." },
      { name: "Cirrus floccus", rule: "Cirrus floccus tworzy bardziej odrębne kępki z włóknistymi smugami, a nie rozległą ławicę ziaren." },
    ],
    fieldChecklist: [
      "porównaj rozmiar elementów z małym palcem przy wyciągniętej ręce",
      "sprawdź własne cieniowanie i regularność fal",
      "wykonaj drugą obserwację po kilku minutach, bo Cc bywa krótkotrwały",
    ],
    namingExamples: ["Cirrocumulus stratiformis undulatus", "Cirrocumulus lenticularis", "Cirrocumulus cavum"],
    motherClouds: {
      genitus: [],
      mutatus: ["cirromutatus", "cirrostratomutatus", "altocumulomutatus"],
    },
  },
  cirrostratus: {
    essence:
      "Cirrostratus tworzy wysoko położoną zasłonę z kryształków lodu. Bywa tak cienki, że łatwiej dostrzec halo, czyli pierścień wokół Słońca lub Księżyca, niż samą chmurę. Brak halo jej nie wyklucza.",
    composition:
      "Kryształki lodu rozłożone w rozległej, zwykle cienkiej warstwie, często związanej z łagodnym wznoszeniem na dużej skali.",
    formation: [
      "rozszerzanie i zagęszczanie pola Cirrus",
      "unoszenie przed rozległą strefą frontową",
      "rozprzestrzenianie lodowej części kowadła Cumulonimbus",
    ],
    weather: [
      "Rozległy, gęstniejący Cirrostratus często wyprzedza układ frontowy, ale odstęp czasowy nie jest stały.",
      "Brak halo nie wyklucza Cirrostratus; orientacja i kształt kryształków mogą nie sprzyjać zjawisku.",
    ],
    aviation: [
      "Może ograniczać kontrast i widzialność Słońca na poziomach przelotowych.",
      "Jest sygnałem wilgoci w górnej troposferze, lecz nie określa samodzielnie pułapu niższych warstw ani zagrożenia oblodzeniem.",
    ],
    optics: ["halo 22°", "słońca poboczne", "górny i dolny łuk styczny", "słup słoneczny"],
    evolution: [
      "Gdy warstwa grubieje i sięga niżej, Cirrostratus może przekształcić się w Altostratus.",
      "Może powstać z Cirrus, Cirrocumulus lub lodowej części Cumulonimbus.",
    ],
    lookAlikes: [
      { name: "Altostratus translucidus", rule: "As zwykle rozmywa tarczę Słońca jak matowe szkło i nie wytwarza typowego halo." },
      { name: "Jednolita mgiełka", rule: "Zanieczyszczenie lub wilgotna mgiełka zmniejsza kontrast blisko horyzontu, ale nie tworzy spójnej lodowej zasłony i halo." },
    ],
    fieldChecklist: [
      "szukaj halo, zasłaniając samą tarczę Słońca przeszkodą; nie patrz w Słońce. Porównaj też ostrość cieni na ziemi",
      "oceń, czy zasłona obejmuje większość nieba",
      "obserwuj, czy warstwa grubieje i czy pojawiają się niższe chmury",
    ],
    namingExamples: ["Cirrostratus fibratus", "Cirrostratus nebulosus", "Cirrostratus duplicatus"],
    motherClouds: {
      genitus: ["cirrocumulogenitus", "cumulonimbogenitus"],
      mutatus: ["cirromutatus", "cirrocumulomutatus", "altostratomutatus"],
    },
  },
  altocumulus: {
    essence:
      "Altocumulus występuje zwykle na średnich wysokościach, w ławicach kłębów, soczewkach lub wieżyczkach. Jego elementy często mają jasną i ciemną stronę. To jedna ze wskazówek odróżniających go od drobniejszego Cirrocumulus.",
    composition:
      "Głównie krople wody, także przechłodzone, czyli wciąż ciekłe mimo temperatury poniżej 0°C. Może zawierać również lód. Smugi zanikającego opadu to virga, a otwór w warstwie ze smugą pośrodku nazywamy cavum.",
    formation: [
      "falowanie i kondensacja w stabilnej wilgotnej warstwie średniej",
      "płytka konwekcja ponad stabilną warstwą",
      "falowy przepływ nad górami, w którym mogą powstawać soczewki lenticularis",
      "rozpad lub rozprzestrzenianie chmur konwekcyjnych",
    ],
    weather: [
      "Castellanus obserwowany rano może wskazywać niestabilność poziomu średniego, ale nie gwarantuje popołudniowej burzy.",
      "Lenticularis wskazuje fale i silny przepływ przez przeszkodę, nie nadchodzący front.",
      "Rozległy stratiformis może być częścią strefy frontowej albo warstwy pod inwersją.",
    ],
    aviation: [
      "Przechłodzone krople mogą powodować oblodzenie, szczególnie w grubszych partiach i chmurach falowych.",
      "Lenticularis oraz równoległe ławice mogą wskazywać falę górską i silną turbulencję w pobliżu rotorów, mimo gładkiego wyglądu.",
      "Wieżyczki castellanus wskazują na niestabilność na ich wysokości. Porównaj je z sondażem, czyli pomiarem temperatury, wilgotności i wiatru w pionie, oraz z prognozą.",
    ],
    optics: ["korona", "iryzacja", "gloria obserwowana z góry", "cienie promieniste między ławicami"],
    evolution: [
      "Może przechodzić w Altostratus, Stratocumulus lub rozwijać wieże prowadzące do głębszej konwekcji.",
      "Cavum może pojawić się po zainicjowaniu lodu w przechłodzonej ławicy.",
    ],
    lookAlikes: [
      { name: "Cirrocumulus", rule: "Ac ma zwykle większe człony i własne cieniowanie; ocena wymaga całej ławicy, nie pojedynczego fragmentu." },
      { name: "Stratocumulus", rule: "Sc jest zwykle niższy, ma większe elementy i mocniejszą fakturę podstawy." },
      { name: "Altostratus", rule: "As jest przede wszystkim ciągłą zasłoną, nawet jeśli ma fale; Ac zachowuje członowaną strukturę." },
    ],
    fieldChecklist: [
      "zanotuj wielkość, cień i organizację elementów",
      "sprawdź, czy ławica stoi względem terenu i czy występują góry",
      "obserwuj rozwój wieżyczek oraz pojawienie się virga",
    ],
    namingExamples: ["Altocumulus stratiformis perlucidus", "Altocumulus castellanus", "Altocumulus lenticularis duplicatus", "Altocumulus cavum"],
    motherClouds: {
      genitus: ["cumulogenitus", "cumulonimbogenitus"],
      mutatus: ["cirrocumulomutatus", "altostratomutatus", "nimbostratomutatus", "stratocumulomutatus"],
    },
  },
  altostratus: {
    essence:
      "Altostratus jest rozległą warstwą średnią, której grubość może zmieniać się od przeświecającej zasłony do niemal całkowitego zasłonięcia Słońca.",
    composition:
      "Mieszanina kropelek wody, przechłodzonych kropli i kryształków lodu, zależnie od wysokości i głębokości warstwy.",
    formation: [
      "rozległe łagodne unoszenie wilgotnego powietrza",
      "grubienie i obniżanie Cirrostratus",
      "rozlewanie średnich chmur i pozostałości rozległej konwekcji",
    ],
    weather: [
      "Często poprzedza długotrwały opad i może przechodzić w Nimbostratus.",
      "Virga to opad, który zanika przed dotarciem do ziemi. Parowanie kropli ochładza powietrze pod chmurą i może sprzyjać prądom zstępującym oraz porywom wiatru.",
    ],
    aviation: [
      "Może obejmować szeroki zakres wysokości i zawierać przechłodzoną wodę, dlatego potencjał oblodzenia zależy od temperatury i struktury warstwy.",
      "Jednolity wygląd z ziemi nie ujawnia liczby warstw ani intensywności oblodzenia.",
      "Opad i niższy pannus mogą znacząco pogarszać widzialność oraz ocenę właściwej podstawy.",
    ],
    optics: ["Słońce jak przez matowe szkło w odmianie translucidus", "halo przemawia raczej za współwystępującym Cirrostratus niż za samym Altostratus"],
    evolution: [
      "Grubieje w Nimbostratus, gdy opad staje się rozległy i ciągły.",
      "Może rozpadać się na Altocumulus albo powstawać z niego przez zlewanie elementów.",
    ],
    lookAlikes: [
      { name: "Cirrostratus", rule: "Halo i ostrzejsza tarcza Słońca wspierają Cs; As daje bardziej matowe, szare światło." },
      { name: "Nimbostratus", rule: "Ns całkowicie zasłania Słońce, a jego podstawa jest rozmyta przez rozległy, niemal ciągły opad. Opad zwykle dociera do ziemi, ale nie musi." },
      { name: "Stratus", rule: "St jest znacznie niższy, ma wyraźniejszy kontakt z rzeźbą terenu i częściej daje mżawkę." },
    ],
    fieldChecklist: [
      "zanotuj, czy położenie Słońca jest rozpoznawalne",
      "sprawdź ciągłość opadu i obecność pannus",
      "porównaj dolną krawędź z terenem i niższymi chmurami",
    ],
    namingExamples: ["Altostratus translucidus", "Altostratus opacus praecipitatio", "Altostratus undulatus"],
    motherClouds: {
      genitus: ["altocumulogenitus", "cumulonimbogenitus"],
      mutatus: ["cirrostratomutatus", "nimbostratomutatus"],
    },
  },
  nimbostratus: {
    essence:
      "Nimbostratus jest głęboką, rozległą chmurą opadu warstwowego. Jego klasyfikacja opiera się na całym systemie: ciągłym opadzie, zasłoniętym Słońcu i słabo określonej podstawie.",
    composition:
      "Gruba chmura zawierająca na różnych poziomach krople, kryształki lodu, śnieg i inne cząstki opadu. Część kropli może pozostawać ciekła poniżej 0°C: to woda przechłodzona.",
    formation: [
      "grubienie Altostratus w rozległym ruchu wstępującym",
      "zlewanie i rozprzestrzenianie innych chmur w systemie frontowym",
      "transformacja rozległych warstw opadowych",
    ],
    weather: [
      "Daje długotrwały deszcz lub śnieg obejmujący duży obszar.",
      "W rozległej warstwie mogą być ukryte chmury Cumulonimbus. Wyładowania lub gwałtowne nasilenie opadu wymagają sprawdzenia, czy nie rozwija się burza.",
      "Pannus i parowanie opadu mogą stopniowo obniżać widzialną podstawę.",
    ],
    aviation: [
      "Rozległość, wielowarstwowość, oblodzenie, opad i niska widzialność mogą utrudniać omijanie oraz ocenę warunków.",
      "Podstawa obserwowana z ziemi może należeć do pannus, a nie do głównej masy Ns.",
      "Nazwa rodzaju nie opisuje pełnego profilu temperatury ani intensywności oblodzenia.",
    ],
    optics: ["zwykle brak bezpośredniej tarczy Słońca", "rozproszone, płaskie oświetlenie pod grubą warstwą"],
    evolution: [
      "Najczęściej rozwija się z Altostratus i może po przejściu układu rozpadać się na Stratocumulus lub Stratus.",
      "Cumulus i Cumulonimbus mogą wnosić materiał do rozległej warstwy opadowej.",
    ],
    lookAlikes: [
      { name: "Altostratus opacus", rule: "Jeśli opad nie jest jeszcze rozległy i ciągły, a struktura pozostaje cieńsza, bardziej właściwy może być As." },
      { name: "Cumulonimbus zasłonięty opadem", rule: "Nagłe zmiany, wyładowania, grad i wyraźna konwekcja wskazują na Cb ukryty w systemie." },
      { name: "Stratus z mżawką", rule: "St jest płytszy i zwykle nie produkuje rozległego umiarkowanego lub silnego opadu." },
    ],
    fieldChecklist: [
      "oceń zasięg i ciągłość opadu, nie tylko ciemność chmury",
      "oddziel niskie pannus od głównej warstwy",
      "sprawdź radar i wyładowania pod kątem wbudowanej konwekcji",
    ],
    namingExamples: ["Nimbostratus praecipitatio", "Nimbostratus pannus", "Nimbostratus altostratomutatus"],
    motherClouds: {
      genitus: ["cumulogenitus", "cumulonimbogenitus"],
      mutatus: ["altocumulomutatus", "altostratomutatus", "stratocumulomutatus"],
    },
  },
  stratocumulus: {
    essence:
      "Stratocumulus tworzy niską warstwę dużych, często połączonych kłębów, wałów lub płatów. Może rozciągać się pod inwersją: warstwą, w której temperatura rośnie z wysokością i ogranicza dalsze unoszenie powietrza.",
    composition:
      "Głównie krople wody, przy ujemnej temperaturze często przechłodzone; w chłodniejszych i grubszych partiach możliwy jest lód.",
    formation: [
      "rozlewanie Cumulus pod inwersją",
      "turbulentne mieszanie w wilgotnej warstwie granicznej",
      "napływ chłodnego powietrza nad cieplejszą powierzchnię",
      "transformacja Stratus albo pozostałości systemu opadowego",
    ],
    weather: [
      "Często przynosi jedynie słaby opad lub mżawkę, ale grubsze komórki mogą dawać przelotny deszcz albo śnieg.",
      "Rozległe pola nad oceanem silnie wpływają na bilans promieniowania, mimo pozornie spokojnej pogody.",
      "Castellanus lub rozwijające się człony wskazują na większą niestabilność niż płaski stratiformis.",
    ],
    aviation: [
      "Może tworzyć niski pułap i warunki IMC, czyli warunki meteorologiczne niespełniające minimów dla lotu z widocznością.",
      "Przechłodzona warstwa jest potencjalnym środowiskiem oblodzenia; intensywność nie wynika z samego rodzaju.",
      "W pobliżu terenu górskiego lenticularis i fluctus mogą wskazywać przepływ falowy i turbulencję.",
    ],
    optics: ["promienie zmierzchowe przez szczeliny", "sporadyczna korona w cienkich jednorodnych fragmentach"],
    evolution: [
      "Może powstać z rozlewających się Cumulus i ponownie rozpadać na komórki konwekcyjne.",
      "Przy osłabieniu mieszania może przejść w Stratus; przy ogrzewaniu podłoża warstwa może się rozrywać.",
    ],
    lookAlikes: [
      { name: "Altocumulus", rule: "Sc ma większe elementy, niższą podstawę i zwykle mocniejszy kontrast między jasną kopułą a ciemną podstawą." },
      { name: "Stratus", rule: "St nie ma dominującej członowanej struktury, choć fragmenty mogą być postrzępione." },
      { name: "Pole Cumulus z góry", rule: "Sprawdź, czy elementy są połączone wspólną warstwą i czy obserwujesz je z samolotu." },
    ],
    fieldChecklist: [
      "porównaj wielkość kłębów i oszacuj, ile nieba widać między nimi",
      "sprawdź, czy podstawa jest wspólna dla całego pola",
      "obserwuj, czy przerwy w warstwie się zamykają, czy powiększają",
    ],
    namingExamples: ["Stratocumulus stratiformis perlucidus", "Stratocumulus volutus", "Stratocumulus asperitas"],
    motherClouds: {
      genitus: ["altostratogenitus", "nimbostratogenitus", "cumulogenitus", "cumulonimbogenitus"],
      mutatus: ["altocumulomutatus", "nimbostratomutatus", "stratomutatus"],
    },
  },
  stratus: {
    essence:
      "Stratus to niska, zwykle szara warstwa bez wyraźnych kłębów. Może powstać z unoszącej się mgły, ale nie jest to jedyna droga. Obserwator zanurzony w tej samej warstwie na wzgórzu widzi mgłę, a osoba w dolinie chmurę nad sobą.",
    composition:
      "Zwykle drobne krople wody, także przechłodzone, czyli ciekłe poniżej 0°C. Przy niskiej temperaturze może zawierać drobne cząstki lodu, a w grubszej warstwie także cząstki opadu.",
    formation: [
      "ochładzanie wilgotnego powietrza nad stygnącym podłożem lub podczas napływu nad chłodniejszą powierzchnię",
      "unoszenie mgły lub obniżenie warstwy chmurowej ku terenowi",
      "mieszanie chłodnego powietrza z wilgocią nad wodą lub mokrym gruntem",
      "nasycenie powietrza chłodzonego przez opad",
    ],
    weather: [
      "Może dawać mżawkę, śnieg lub śnieg ziarnisty, ale nie typową ulewę z chmury burzowej.",
      "Nawet bez opadu znacząco ogranicza widzialność i dopływ promieniowania słonecznego.",
      "Rozrywanie warstwy zależy od ogrzewania podłoża, mieszania i napływu suchszego powietrza.",
    ],
    aviation: [
      "Dla pilota bardzo niski pułap i słaba widzialność mogą mieć większe znaczenie niż siła opadu.",
      "Chmura może zasłaniać wzniesienia. Zwiększa to ryzyko CFIT: zderzenia sterowanego, sprawnego samolotu z terenem.",
      "Zimą przechłodzony Stratus może powodować oblodzenie w płytkiej, ale rozległej warstwie.",
    ],
    optics: ["korona w jednorodnych drobnych kroplach", "łuk mgłowy i gloria przy obserwacji z góry"],
    evolution: [
      "Może unieść się z mgły, rozpaść na fractus albo rozwinąć człony Stratocumulus.",
      "Nad stokiem ta sama warstwa może być Stratus dla obserwatora w dolinie i mgłą dla obserwatora na grzbiecie.",
    ],
    lookAlikes: [
      { name: "Mgła", rule: "Mgła styka się z gruntem w miejscu obserwacji; ten sam obłok może być chmurą dla osoby patrzącej z innej wysokości." },
      { name: "Nimbostratus pannus", rule: "Sprawdź obecność głównej rozległej warstwy opadowej powyżej i ciągłego opadu." },
      { name: "Stratocumulus", rule: "Sc ma wyraźne człony, wały lub szczeliny, a nie niemal jednolitą podstawę." },
    ],
    fieldChecklist: [
      "zanotuj wysokość podstawy względem lokalnego terenu",
      "sprawdź kontakt warstwy ze wzgórzami i kierunek napływu",
      "rozróżnij mżawkę od opadu pochodzącego z wyższej warstwy",
    ],
    namingExamples: ["Stratus nebulosus opacus", "Stratus fractus", "Stratus undulatus praecipitatio"],
    motherClouds: {
      genitus: ["nimbostratogenitus", "cumulogenitus", "cumulonimbogenitus"],
      mutatus: ["stratocumulomutatus"],
    },
  },
  cumulus: {
    essence:
      "Cumulus rośnie tam, gdzie unoszące się powietrze ochładza się na tyle, że powstają krople. Płaska podstawa często wyznacza ten poziom, a kopuły pozwalają śledzić dalszy wzrost chmury. Porównuj je w kolejnych obserwacjach.",
    composition:
      "W niższych i cieplejszych częściach krople wody; w silnie wypiętrzonych i zimnych partiach mogą pojawiać się przechłodzone krople i pierwsze kryształki lodu.",
    formation: [
      "termiki nad nierównomiernie ogrzaną powierzchnią",
      "unoszenie na zbieżności, bryzie, froncie lub stoku",
      "rozpad warstwy Stratocumulus albo Altocumulus na odrębne komórki",
    ],
    weather: [
      "Humilis często oznacza płytką konwekcję ograniczoną stabilną warstwą.",
      "Mediocris i congestus wymagają obserwacji tempa wzrostu, opadu i zlodzenia wierzchołka.",
      "Congestus może dawać intensywny przelotny opad nawet przed formalnym przejściem w Cumulonimbus.",
    ],
    aviation: [
      "Wewnątrz aktywnych wież występują silne prądy pionowe i turbulencja.",
      "Congestus może zawierać przechłodzoną wodę oraz intensywny opad. Brak wyładowań nie oznacza bezpiecznych warunków do lotu.",
      "Podstawa Cumulus pomaga szacować poziom kondensacji, ale jest lokalną obserwacją, nie pełną prognozą pułapu.",
    ],
    optics: ["jasne srebrne obwódki przy Słońcu za chmurą", "promienie i cienie między komórkami"],
    evolution: [
      "Humilis może zaniknąć wieczorem albo przejść przez mediocris do congestus.",
      "Zlodzenie i wygładzenie wierzchołka oznacza przejście do Cumulonimbus calvus.",
      "Pod inwersją Cumulus może rozlewać się w Stratocumulus cumulogenitus.",
    ],
    lookAlikes: [
      { name: "Cumulonimbus calvus", rule: "Szukaj utraty ostrych kalafiorowych konturów i wygładzenia lodowego wierzchołka." },
      { name: "Stratocumulus castellanus", rule: "Sc zachowuje wspólną warstwę lub wał, z którego wyrastają wieżyczki." },
      { name: "Pannus", rule: "Pannus rozwija się pod opadem i jest związany z główną chmurą powyżej, a nie niezależnym termikiem." },
    ],
    fieldChecklist: [
      "porównuj wysokość wieży z szerokością podstawy",
      "obserwuj ostrość konturów i tempo odbudowy kopuł",
      "szukaj opadu, pileus, arcus i pierwszych oznak zlodzenia",
    ],
    namingExamples: ["Cumulus humilis", "Cumulus mediocris", "Cumulus congestus praecipitatio", "Cumulus fractus"],
    motherClouds: {
      genitus: ["altocumulogenitus", "stratocumulogenitus"],
      mutatus: ["stratocumulomutatus", "stratomutatus"],
    },
  },
  cumulonimbus: {
    essence:
      "Cumulonimbus to silnie wypiętrzona chmura, w której gwałtowne ruchy powietrza mogą przynosić burzę, grad i szkwały. Zagrożenia nie kończą się na jej widocznym brzegu; ważne są też opad, kowadło i wypływ powietrza pod chmurą.",
    composition:
      "Wielofazowa mieszanina kropli, dużych przechłodzonych kropel, kryształków lodu, śniegu, krupy i gradu w silnych prądach pionowych.",
    formation: [
      "silne unoszenie wilgotnego powietrza w warunkach sprzyjających dalszemu wzrostowi chmury",
      "rozwój Cumulus congestus, gdy wierzchołek zaczyna się wygładzać i nabierać lodowej struktury",
      "organizacja komórek przez uskok wiatru, granice wypływu lub wymuszanie frontowe",
    ],
    weather: [
      "Może powodować ulewę, grad, wyładowania, trąby i gwałtowne powodzie. Downburst to silny prąd zstępujący, który po dotarciu do ziemi rozchodzi się na boki i wywołuje niszczące porywy.",
      "Zagrożenia mogą występować daleko od widocznego rdzenia: wyładowania z kowadła, silny wypływ i turbulencja.",
      "Brak klasycznego kowadła nie wyklucza aktywnego Cumulonimbus calvus.",
    ],
    aviation: [
      "Silna lub skrajna turbulencja, oblodzenie, grad, wyładowania, uskoki i mikroporywy czynią aktywną komórkę obszarem do omijania, nie do penetracji na podstawie oceny wzrokowej.",
      "Radar pokładowy ma ograniczenia geometrii, tłumienia i interpretacji; atlas nie zastępuje procedur operacyjnych.",
      "Kowadło i obszar pod nim mogą zawierać kryształki lodu, turbulencję i wyładowania poza głównym echem opadowym.",
    ],
    optics: ["częste wyładowania wewnątrzchmurowe", "tęcza w strefie opadu", "barwy zachodu na kowadle"],
    evolution: [
      "Calvus przechodzi w capillatus wraz ze wzrostem udziału lodu i włóknienia wierzchołka.",
      "Dojrzała komórka może wytworzyć incus, mamma, arcus, murus, cauda, tuba i flumen.",
      "Pozostałości kowadła mogą przekształcić się w Cirrus, Cirrostratus lub Altostratus pochodzenia cumulonimbogenitus.",
    ],
    lookAlikes: [
      { name: "Cumulus congestus", rule: "Congestus zachowuje ostre kalafiorowe kopuły; calvus zaczyna się wygładzać i lodowieć." },
      { name: "Nimbostratus z wbudowaną konwekcją", rule: "Wyładowania, szybkie zmiany i silne echa radarowe wskazują Cb ukryty w rozległej warstwie." },
      { name: "Cirrus spissatus", rule: "Gęsta pozostałość kowadła nie musi już mieć aktywnego głębokiego rdzenia, ale jej pochodzenie pozostaje ważne." },
    ],
    fieldChecklist: [
      "nie oceniaj odległości i ruchu burzy wyłącznie wzrokiem",
      "szukaj zlodzenia wierzchołka, opadu, wypływu i nowych komórek",
      "łącz obserwację z radarami, wyładowaniami, ostrzeżeniami i procedurami operacyjnymi",
    ],
    namingExamples: ["Cumulonimbus calvus", "Cumulonimbus capillatus incus", "Cumulonimbus capillatus mamma", "Cumulonimbus murus cauda"],
    motherClouds: {
      genitus: ["altocumulogenitus", "altostratogenitus", "nimbostratogenitus", "stratocumulogenitus", "cumulogenitus"],
      mutatus: ["cumulomutatus"],
    },
  },
};

export function getTaxonomyTerm(id) {
  return taxonomyTerms.find((term) => term.id === id);
}

export function getCloudProfile(id) {
  return cloudProfiles[id];
}

export function getTermsForCloud(cloud) {
  const ids = [
    ...cloud.species,
    ...cloud.varieties,
    ...cloud.features,
    ...(cloud.accessoryClouds || []),
  ];

  return ids.map(getTaxonomyTerm).filter(Boolean);
}
