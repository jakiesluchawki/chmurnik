const wmoSources = ["wmoAtlas", "wmoSummary", "wmoPrinciples"];

export const taxonomyCategories = [
  {
    id: "species",
    label: "Gatunki",
    singular: "Gatunek",
    count: 15,
    description:
      "Opisują kształt i strukturę chmury. Jeden rodzaj może mieć kilka gatunków, ale nie każdy rodzaj ma gatunki.",
  },
  {
    id: "varieties",
    label: "Odmiany",
    singular: "Odmiana",
    count: 9,
    description:
      "Doprecyzowują układ elementów albo stopień przejrzystości. Niektóre odmiany mogą występować jednocześnie.",
  },
  {
    id: "features",
    label: "Cechy dodatkowe",
    singular: "Cecha dodatkowa",
    count: 11,
    description:
      "Nazwy szczególnych części chmury lub zjawisk bezpośrednio z nią związanych, takich jak kowadło, wał czy virga.",
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
      "Rozległa ławica lub warstwa złożona z połączonych albo regularnie rozmieszczonych członów.",
    diagnostic:
      "Dominuje układ poziomy i duży zasięg. Rozmiar elementów oraz cieniowanie rozstrzygają między Cc, Ac i Sc.",
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
      "Wysoko położona, często halo-twórcza zasłona wskazuje Cs; bardzo niska szara warstwa prowadzi do St.",
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
      "Stratus fractus jest bardziej warstwowy i wilgotny; Cumulus fractus zdradza konwekcyjne kłębienie mimo niepełnego rozwoju.",
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
      "Dopóki wierzchołek pozostaje wyraźnie kłębiasty i ciekłowodny, klasyfikacja nie przechodzi jeszcze w Cumulonimbus.",
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
      "Prześwity znajdują się między członami; w translucidus światło przechodzi przez samą chmurę.",
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
      "Opacus opisuje własność optyczną, dlatego nie rozstrzyga samodzielnie między Ac, As, Sc i St.",
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
      "Pionowe lub ukośne smugi opadu parujące albo sublimujące przed dotarciem do powierzchni.",
    diagnostic:
      "Śledź, czy smuga zanika w powietrzu. Gdy opad dociera do gruntu, właściwym terminem jest praecipitatio.",
    genera: ["cirrocumulus", "altocumulus", "altostratus", "nimbostratus", "stratocumulus", "cumulus", "cumulonimbus"],
    sourceIds: wmoSources,
  },
  {
    id: "praecipitatio",
    category: "features",
    name: "praecipitatio",
    polish: "opad docierający do powierzchni",
    definition:
      "Deszcz, śnieg, krupa lub inny hydrometeor wypadający z chmury i osiągający powierzchnię Ziemi.",
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
      "Lej lub stożek zwisający z podstawy chmury, wskazujący skoncentrowany wir. Po kontakcie z powierzchnią może być tornadem albo trąbą wodną.",
    diagnostic:
      "Sam wygląd na zdjęciu nie potwierdza kontaktu z gruntem; pył lub rozbryzg przy powierzchni jest osobnym dowodem.",
    genera: ["cumulus", "cumulonimbus"],
    sourceIds: wmoSources,
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
      "Krótkotrwałe grzebienie fal przypominające załamujące się fale morskie, powstające przy silnym uskoku prędkości wiatru.",
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
      "Rotacja murus podnosi znaczenie operacyjne obserwacji, ale sama obecność obniżenia nie potwierdza tornada.",
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
      "Przykład: Stratocumulus stratusmutatus oznacza, że warstwa Stratus rozwinęła członowaną strukturę Stratocumulus.",
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
      "Trwała chmura antropogeniczna, która rozwinęła wygląd jednego z naturalnych rodzajów, na przykład rozległego Cirrus.",
    diagnostic:
      "Termin zachowuje informację o pochodzeniu nawet wtedy, gdy morfologia odpowiada już zwykłej klasyfikacji rodzaju.",
    genera: ["cirrus", "cirrocumulus", "cirrostratus"],
    sourceIds: ["wmoSpecialClouds"],
  },
  {
    id: "silvagenitus",
    category: "special",
    name: "silvagenitus",
    polish: "powstały nad lasem",
    definition:
      "Chmura powstająca lokalnie nad lasem wskutek zwiększonej wilgotności i parowania lub ewapotranspiracji.",
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
      "Cirrus jest zapisem przepływu w górnej troposferze: cienkim, lodowym i często silnie deformowanym przez wiatr. Jego znaczenie wynika bardziej z ewolucji całego pola niż z pojedynczego włókna.",
    composition:
      "Prawie wyłącznie kryształki lodu. Kształt smug zależy od opadania kryształków, uskoku wiatru i różnic wilgotności w kolejnych warstwach.",
    formation: [
      "łagodne unoszenie wilgotnego powietrza przy strefach frontowych",
      "rozciąganie resztek kowadła Cumulonimbus",
      "lokalne fale i turbulencja w pobliżu prądu strumieniowego",
      "trwałe smugi kondensacyjne przechodzące w homogenitus lub homomutatus",
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
      { name: "Smuga kondensacyjna", rule: "Sprawdź liniowy początek i rozszerzanie zgodne z ruchem samolotu; później klasyfikacja WMO nadal może prowadzić do Cirrus homogenitus." },
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
      mutatus: ["cirrostratomutatus", "altocumulomutatus", "cumulonimbomutatus"],
    },
  },
  cirrocumulus: {
    essence:
      "Cirrocumulus jest wysoką chmurą członowaną. Jego drobne elementy zdradzają małą skalę struktur na dużej wysokości, ale perspektywa i brak cienia muszą być oceniane razem.",
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
    optics: ["korona wokół Słońca lub Księżyca", "iridescencja w świeżych, cienkich elementach"],
    evolution: [
      "Może tworzyć się z Cirrus lub Cirrostratus i ponownie tracić członowaną strukturę.",
      "Virga z drobnych elementów może prowadzić do floccus lub cavum.",
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
      genitus: ["cirrusgenitus", "cirrostratusgenitus"],
      mutatus: ["cirrusmutatus", "cirrostratusmutatus", "altocumulomutatus"],
    },
  },
  cirrostratus: {
    essence:
      "Cirrostratus jest wysoką lodową zasłoną. Może być niemal niewidoczny, dlatego ocena halo, kontrastu nieba i ostrości cieni jest ważniejsza od koloru.",
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
      "Może gęstnieć i obniżać optycznie obraz nieba przed przejściem w Altostratus.",
      "Może powstać z Cirrus, Cirrocumulus lub lodowej części Cumulonimbus.",
    ],
    lookAlikes: [
      { name: "Altostratus translucidus", rule: "As zwykle rozmywa tarczę Słońca jak matowe szkło i nie wytwarza typowego halo." },
      { name: "Jednolita mgiełka", rule: "Zanieczyszczenie lub wilgotna mgiełka zmniejsza kontrast blisko horyzontu, ale nie tworzy spójnej lodowej zasłony i halo." },
    ],
    fieldChecklist: [
      "sprawdź halo i ostrość cieni rzucanych przez przedmioty",
      "oceń, czy zasłona obejmuje większość nieba",
      "obserwuj, czy warstwa grubieje i czy pojawiają się niższe chmury",
    ],
    namingExamples: ["Cirrostratus fibratus", "Cirrostratus nebulosus", "Cirrostratus duplicatus"],
    motherClouds: {
      genitus: ["cirrusgenitus", "cirrocumulusgenitus", "cumulonimbogenitus"],
      mutatus: ["cirrusmutatus", "cirrocumulomutatus", "altostratusmutatus"],
    },
  },
  altocumulus: {
    essence:
      "Altocumulus obejmuje wyjątkowo różnorodne chmury średnie: od spokojnych ławic, przez fale orograficzne, po wieżyczki zapowiadające głębszą niestabilność.",
    composition:
      "Głównie krople wody, często przechłodzone; przy niższych temperaturach także kryształki lodu. Virga i cavum ujawniają przemiany fazowe.",
    formation: [
      "falowanie i kondensacja w stabilnej wilgotnej warstwie średniej",
      "płytka konwekcja ponad stabilną warstwą",
      "unoszenie orograficzne tworzące lenticularis",
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
      "Castellanus jest ważnym sygnałem profilu termodynamicznego, lecz wymaga zestawienia z sondażem i prognozą.",
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
      genitus: ["cumulusgenitus", "cumulonimbusgenitus"],
      mutatus: ["cirrocumulomutatus", "altostratusmutatus", "nimbostratusmutatus", "stratocumulusmutatus", "cumulusmutatus"],
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
      "Virga może nie docierać do ziemi przy suchej warstwie pod chmurą, powodując ochłodzenie i lokalne porywy.",
    ],
    aviation: [
      "Może obejmować szeroki zakres wysokości i zawierać przechłodzoną wodę, dlatego potencjał oblodzenia zależy od temperatury i struktury warstwy.",
      "Jednolity wygląd z ziemi nie ujawnia liczby warstw ani intensywności oblodzenia.",
      "Opad i niższy pannus mogą znacząco pogarszać widzialność oraz ocenę właściwej podstawy.",
    ],
    optics: ["Słońce jak przez matowe szkło w translucidus", "rzadko wyraźne halo; jego obecność przemawia raczej za Cirrostratus"],
    evolution: [
      "Grubieje w Nimbostratus, gdy opad staje się rozległy i ciągły.",
      "Może rozpadać się na Altocumulus albo powstawać z niego przez zlewanie elementów.",
    ],
    lookAlikes: [
      { name: "Cirrostratus", rule: "Halo i ostrzejsza tarcza Słońca wspierają Cs; As daje bardziej matowe, szare światło." },
      { name: "Nimbostratus", rule: "Ns ma całkowicie zasłonięte Słońce i jest związany z rozległym opadem docierającym do powierzchni." },
      { name: "Stratus", rule: "St jest znacznie niższy, ma wyraźniejszy kontakt z rzeźbą terenu i częściej daje mżawkę." },
    ],
    fieldChecklist: [
      "zanotuj, czy położenie Słońca jest rozpoznawalne",
      "sprawdź ciągłość opadu i obecność pannus",
      "porównaj dolną krawędź z terenem i niższymi chmurami",
    ],
    namingExamples: ["Altostratus translucidus", "Altostratus opacus praecipitatio", "Altostratus undulatus"],
    motherClouds: {
      genitus: ["altocumulusgenitus", "cumulonimbusgenitus"],
      mutatus: ["cirrostratusmutatus", "altocumulomutatus", "nimbostratusmutatus"],
    },
  },
  nimbostratus: {
    essence:
      "Nimbostratus jest głęboką, rozległą chmurą opadu warstwowego. Jego klasyfikacja opiera się na całym systemie: ciągłym opadzie, zasłoniętym Słońcu i słabo określonej podstawie.",
    composition:
      "Wielofazowa chmura o dużej grubości: krople, przechłodzona woda, kryształki lodu i opadające hydrometeory współistnieją na różnych poziomach.",
    formation: [
      "grubienie Altostratus w rozległym ruchu wstępującym",
      "zlewanie i rozprzestrzenianie innych chmur w systemie frontowym",
      "transformacja rozległych warstw opadowych",
    ],
    weather: [
      "Daje długotrwały deszcz lub śnieg obejmujący duży obszar.",
      "Nie wyklucza wbudowanej konwekcji; wyładowania lub gwałtowne komórki wskazują na dodatkowe struktury Cumulonimbus.",
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
      genitus: ["cumulusgenitus", "cumulonimbusgenitus"],
      mutatus: ["altocumulomutatus", "altostratusmutatus", "stratocumulusmutatus"],
    },
  },
  stratocumulus: {
    essence:
      "Stratocumulus jest niską warstwą zbudowaną z dużych członów, wałów lub płatów. Często ujawnia granicę mieszania i inwersję w dolnej troposferze.",
    composition:
      "Głównie krople wody, przy ujemnej temperaturze często przechłodzone; w chłodniejszych i grubszych partiach możliwy jest lód.",
    formation: [
      "rozlewanie Cumulus pod inwersją",
      "turbulentne mieszanie w wilgotnej warstwie granicznej",
      "adwekcja chłodnego powietrza nad cieplejszą powierzchnię",
      "transformacja Stratus albo pozostałości systemu opadowego",
    ],
    weather: [
      "Często przynosi jedynie słaby opad lub mżawkę, ale grubsze komórki mogą dawać przelotny deszcz albo śnieg.",
      "Rozległe pola nad oceanem silnie wpływają na bilans promieniowania, mimo pozornie spokojnej pogody.",
      "Castellanus lub rozwijające się człony wskazują na większą niestabilność niż płaski stratiformis.",
    ],
    aviation: [
      "Może tworzyć rozległy niski pułap i warunki IMC.",
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
      "oceń wielkość członów i procent szczelin",
      "sprawdź, czy podstawa jest wspólna dla całego pola",
      "obserwuj kierunek transformacji: warstwa zamyka się czy rozpada",
    ],
    namingExamples: ["Stratocumulus stratiformis perlucidus", "Stratocumulus volutus", "Stratocumulus asperitas"],
    motherClouds: {
      genitus: ["altostratusgenitus", "nimbostratusgenitus", "cumulusgenitus", "cumulonimbusgenitus"],
      mutatus: ["altocumulomutatus", "nimbostratusmutatus", "stratusmutatus", "cumulusmutatus"],
    },
  },
  stratus: {
    essence:
      "Stratus jest bardzo niską, prawie bezstrukturalną warstwą. Fizycznie jest bliski mgle; rozróżnienie zależy od tego, czy chmura styka się z powierzchnią w miejscu obserwacji.",
    composition:
      "Drobne krople wody, często w płytkiej warstwie przyziemnej; przy temperaturach ujemnych możliwe przechłodzone krople i ziarna lodowe.",
    formation: [
      "radiacyjne lub adwekcyjne ochłodzenie wilgotnej warstwy",
      "unoszenie mgły lub obniżenie warstwy chmurowej ku terenowi",
      "mieszanie chłodnego powietrza z wilgocią nad wodą lub mokrym gruntem",
      "nasycenie powietrza chłodzonego przez opad",
    ],
    weather: [
      "Może dawać mżawkę, drobny śnieg lub ziarna lodowe, ale nie typowy silny opad konwekcyjny.",
      "Nawet bez opadu znacząco ogranicza widzialność i dopływ promieniowania słonecznego.",
      "Rozrywanie warstwy zależy od ogrzewania podłoża, mieszania i napływu suchszego powietrza.",
    ],
    aviation: [
      "Bardzo niski pułap i słaba widzialność mogą być ważniejsze operacyjnie niż intensywność opadu.",
      "Kontakt z terenem tworzy zasłonięte wzniesienia i ryzyko CFIT.",
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
      genitus: ["cumulusgenitus", "cumulonimbusgenitus"],
      mutatus: ["stratocumulomutatus"],
    },
  },
  cumulus: {
    essence:
      "Cumulus jest widzialnym przekrojem prądów wstępujących w warstwie granicznej. Płaska podstawa pokazuje poziom kondensacji, a kształt wierzchołka tempo i głębokość konwekcji.",
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
      "Congestus może zawierać przechłodzoną wodę oraz intensywny opad; brak wyładowań nie czyni go obojętnym.",
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
      genitus: ["altocumulusgenitus", "stratocumulusgenitus", "stratusgenitus"],
      mutatus: ["altocumulomutatus", "stratocumulomutatus"],
    },
  },
  cumulonimbus: {
    essence:
      "Cumulonimbus jest głębokim układem konwekcyjnym, nie tylko efektowną chmurą. Jego pełna ocena obejmuje rdzeń wstępujący, opad, wypływ, kowadło i otoczenie burzy.",
    composition:
      "Wielofazowa mieszanina kropli, dużych przechłodzonych kropel, kryształków lodu, śniegu, krupy i gradu w silnych prądach pionowych.",
    formation: [
      "głęboka konwekcja przy odpowiedniej wilgoci, niestabilności i mechanizmie inicjacji",
      "rozwój Cumulus congestus po przekroczeniu poziomu zlodzenia",
      "organizacja komórek przez uskok wiatru, granice wypływu lub wymuszanie frontowe",
    ],
    weather: [
      "Może powodować ulewny opad, grad, wyładowania, porywy, downburst, trąby i gwałtowne powodzie.",
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
      genitus: ["altocumulusgenitus", "altostratusgenitus", "nimbostratusgenitus", "stratocumulusgenitus", "cumulusgenitus"],
      mutatus: ["altocumulomutatus", "stratocumulomutatus", "cumulusmutatus"],
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
