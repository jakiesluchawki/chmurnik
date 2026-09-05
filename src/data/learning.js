export const learningModules = [
  {
    id: "obserwacja",
    number: "01",
    level: "Początek",
    title: "Najpierw patrz, potem nazywaj",
    minutes: 12,
    summary:
      "Przyjrzyj się kształtowi, warstwom, wielkości elementów, światłu, opadowi i zmianom. Zapiszesz opis, który można porównać z atlasem.",
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
      "Sprawdzisz, jak wilgotne powietrze się ochładza i dlaczego raz tworzy warstwę chmur, a innym razem wysokie kłęby.",
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
      "Przybliżysz kierunek wiatru, śledząc ruch wybranej chmury. Poznasz też sytuacje, w których jej ruch może wprowadzić w błąd.",
    outcomes: ["wiatr z kierunku", "dryf chmur", "uskok", "fala górska", "perspektywa"],
    sourceIds: ["faaWeather", "wmoAtlas", "wmoCloudMotion"],
  },
  {
    id: "lotnictwo",
    number: "06",
    level: "Lotnictwo",
    title: "Chmury w METAR i TAF",
    minutes: 26,
    summary:
      "Odczytasz grupy zachmurzenia i odróżnisz najniższą podstawę od pułapu. Sprawdzisz, jakiej informacji nie daje pojedyncza depesza.",
    outcomes: ["grupy zachmurzenia", "pułap", "AGL", "CB/TCU"],
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
    outcomes: ["oblodzenie", "turbulencja", "konwekcja", "CAPE", "uskok wiatru"],
    sourceIds: ["faaWeather", "easaAircrew"],
  },
  {
    id: "ekspert",
    number: "09",
    level: "Eksperckie",
    title: "Gatunki, odmiany i sporne granice",
    minutes: 35,
    summary:
      "Złożysz pełną nazwę zgodnie z zasadami WMO. Nauczysz się uzasadniać jej części i rozstrzygać różnice między dwiema obserwacjami.",
    outcomes: ["gatunki", "odmiany", "cechy dodatkowe", "chmury macierzyste"],
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

export const lessonPractices = {
  obserwacja: {
    label: "Protokół 90 sekund",
    title: "Opisz niebo bez użycia nazwy chmury",
    body:
      "Zbuduj zapis, który inna osoba mogłaby sprawdzić. Nie oceniaj jeszcze, jaki to rodzaj.",
    steps: [
      "Zapisz dominującą sylwetkę, wielkość elementów i stopień cieniowania.",
      "Sprawdź halo, prześwity, opad oraz relację podstawy do horyzontu.",
      "Po 90 sekundach zanotuj kierunek i rodzaj zmiany: wzrost, zanik, gęstnienie albo rozlewanie.",
    ],
    outcome:
      "Masz opis i zapis zmiany po 90 sekundach. Otwórz Pytania obserwatora i porównaj otrzymane propozycje z opisem. Jeśli odpowiedzi nie wystarczą do wskazania rodzaju, zanotuj, czego nie udało się ustalić.",
  },
  rodziny: {
    label: "Dekoder nazw",
    title: "Rozłóż pięć nazw na części znaczeniowe",
    body:
      "Nazwy mają być mapą cech, nie ciągiem łacińskich sylab do zapamiętania.",
    steps: [
      "Wybierz po jednym przykładzie z członami cirro-, alto-, stratus, cumulus i nimbus.",
      "Dla każdego członu zapisz, czy mówi o poziomie, budowie czy opadzie.",
      "Sprawdź w atlasie, gdzie dosłowne znaczenie pomaga, a gdzie nazwa historyczna wymaga doprecyzowania.",
    ],
    outcome:
      "Masz pięć nazw rozłożonych na części i przy każdej wyjaśnienie, co nazwa podpowiada, a co trzeba jeszcze sprawdzić na niebie.",
  },
  procesy: {
    label: "Mapa mechanizmu",
    title: "Połącz wygląd chmury z drogą unoszenia",
    body:
      "Przećwicz wyjaśnianie genezy bez sprowadzania każdej chmury do jednego procesu.",
    steps: [
      "Znajdź przykład warstwy, oddzielnych kłębów i chmury związanej z terenem lub falą.",
      "Dla każdego przykładu nazwij prawdopodobne unoszenie: rozległe, konwekcyjne, orograficzne albo turbulentne.",
      "Dopisz, jaka informacja byłaby potrzebna, aby odróżnić główny mechanizm od współwystępującego.",
    ],
    outcome:
      "Przy każdym z trzech przykładów masz możliwy mechanizm powstania, obserwację, która go wspiera, oraz brakującą informację. Sama nazwa chmury nie wystarcza.",
  },
  fronty: {
    label: "Dziennik sekwencji",
    title: "Porównaj cztery obserwacje tego samego nieba",
    body:
      "Sprawdź, czy zmiany nieba pasują do poznanej sekwencji frontowej. Cztery obserwacje co pół godziny zajmują co najmniej 90 minut czasu kalendarzowego. Podany czas lekcji obejmuje aktywną pracę, nie czekanie między obserwacjami.",
    steps: [
      "Wykonaj cztery zapisy nieba w odstępie co najmniej 30 minut.",
      "W każdym zapisie oceń wysokość pozorną, grubość optyczną, opad i kierunek przemieszczania.",
      "Na końcu wskaż, które fakty wspierają zmianę frontową, a które mogły powstać lokalnie.",
    ],
    outcome:
      "Nie prognozuj godziny opadu z samego Cirrus. Zapisz scenariusz i obserwację, która mogłaby go obalić.",
  },
  wiatr: {
    label: "Śledzenie elementu",
    title: "Oddziel dryf, rozwój i pozorny ruch",
    body:
      "Jedna smuga lub krawędź może zmieniać kształt. Potrzebujesz kilku punktów odniesienia i czasu.",
    steps: [
      "Wybierz mały, trwały element wysoko nad głową i określ, dokąd się przesuwa względem kompasu.",
      "Po dwóch minutach powtórz pomiar na drugim elemencie tej samej warstwy.",
      "Odwróć wskazany kierunek „dokąd” o 180° i zapisz przybliżony kierunek wiatru „skąd”, wraz z poziomem chmury. Nie odwracaj ponownie gotowego kierunku „skąd” z raportu.",
    ],
    outcome:
      "Jeżeli element rośnie w miejscu, fala stoi albo virga opada, oznacz wynik jako niejednoznaczny zamiast wymuszać kierunek.",
  },
  lotnictwo: {
    label: "Ćwiczenie odczytu depeszy",
    title: "Znajdź pułap, nie sumuj warstw",
    body:
      "Pracuj na przykładzie szkoleniowym, nie na bieżącej pogodzie: EPWA 161200Z 24012KT 9999 SCT020 BKN060 18/11 Q1016.",
    steps: [
      "Przelicz wysokości grup zachmurzenia z setek stóp na pełne wartości AGL.",
      "Wskaż najniższą warstwę tworzącą pułap i oddziel ją od warstwy SCT.",
      "Wypisz dwie ważne rzeczy, których ten pojedynczy raport nie mówi o pogodzie na trasie.",
    ],
    outcome:
      "W tym przykładzie pułap wynosi 6000 ft AGL; SCT020 jest ważną warstwą, ale nie tworzy ceiling.",
  },
  warstwy: {
    label: "Rachunek pionowy",
    title: "Przelicz MSL na przybliżone AGL",
    body:
      "Załóż, że powierzchnia 850 hPa leży na 1500 m MSL. Porównaj punkt nizinny 200 m MSL i przełęcz 1300 m MSL.",
    steps: [
      "Odejmij wysokość terenu od wysokości powierzchni ciśnienia w obu punktach.",
      "Oceń, gdzie poziom 850 hPa leży w swobodnej atmosferze, a gdzie bardzo blisko modelowego gruntu.",
      "Dopisz, dlaczego rzeczywisty model może dać inny wynik niż ten prosty rachunek.",
    ],
    outcome:
      "Otrzymasz około 1300 m AGL nad niziną i tylko 200 m AGL nad przełęczą. Ta sama warstwa mapy nie oznacza tej samej wysokości nad człowiekiem.",
  },
  zagrozenia: {
    label: "Tabela danych o zagrożeniach",
    title: "Nie wyciągaj decyzji z jednego parametru",
    body:
      "Zbuduj cztery kolumny: oblodzenie, turbulencja, konwekcja i uskok. Każda wymaga innych dowodów.",
    steps: [
      "Dla każdej kolumny wpisz co najmniej trzy potrzebne informacje, np. temperaturę, fazę wody, ruch pionowy lub profil wiatru.",
      "Zaznacz dane pochodzące z obserwacji, raportu lotniskowego i modelu.",
      "Wybierz jedną sytuację, w której brak chmury nie oznacza braku zagrożenia.",
    ],
    outcome:
      "Masz cztery kolumny, co najmniej trzy potrzebne informacje w każdej i przykład zagrożenia bez widocznej chmury. To ćwiczenie porządkowania danych, nie zgoda na lot.",
  },
  ekspert: {
    label: "Pełna składnia WMO",
    title: "Zbuduj nazwę i uzasadnij każdą jej warstwę",
    body:
      "Długa nazwa jest poprawna tylko wtedy, gdy każdy człon opisuje obserwowalną cechę i jest dopuszczony dla danego rodzaju.",
    steps: [
      "Wybierz rodzaj z atlasu i jeden zgodny z nim gatunek.",
      "Dodaj odmianę lub cechę dodatkową, po czym sprawdź jej relację taksonomiczną w encyklopedii.",
      "Jeśli widzisz przemianę, rozważ genitus lub mutatus i zapisz dowód historyczny, którego wymaga ta końcówka.",
    ],
    outcome:
      "Jeżeli nie potrafisz wskazać dowodu dla członu nazwy, pomiń go. Krótsza klasyfikacja z dobrym uzasadnieniem jest lepsza od efektownej nadinterpretacji.",
  },
};

export const moduleChecks = {
  obserwacja: {
    prompt: "Która notatka jest najlepszym początkiem identyfikacji?",
    options: [
      "To chyba Altocumulus.",
      "Ławica drobnych, cieniowanych członów; bez opadu; powoli gęstnieje.",
      "Ładna szara chmura przed deszczem.",
      "Wysoka chmura, bo wygląda na daleką.",
    ],
    correct: 1,
    explanation:
      "Opis cech i zmiany można sprawdzić oraz porównać z kryteriami. Sama nazwa lub wrażenie od razu zamykają rozumowanie.",
  },
  rodziny: {
    prompt: "Co najpewniej opisuje człon „-stratus”?",
    options: ["Opad gradu", "Wyłącznie niski poziom", "Warstwę lub zasłonę", "Kryształki lodu"],
    correct: 2,
    explanation:
      "Stratus wskazuje budowę warstwową. O poziomie i składzie trzeba wnioskować z pełnej nazwy oraz obserwacji.",
  },
  procesy: {
    prompt: "Co najczęściej odróżnia rozwój kłębiasty od rozległej warstwy?",
    options: [
      "Kolor nieba",
      "Rodzaj aparatu",
      "Stabilność i sposób unoszenia powietrza",
      "Pora roku bez innych danych",
    ],
    correct: 2,
    explanation:
      "Niestabilność podtrzymuje pionowy ruch parceli, a stabilna atmosfera sprzyja rozlewaniu i warstwom, choć procesy mogą współwystępować.",
  },
  fronty: {
    prompt: "Jak traktować sekwencję Ci → Cs → As → Ns?",
    options: [
      "Jako dokładny zegar nadejścia deszczu",
      "Jako model roboczy, który trzeba potwierdzać zmianą całego nieba",
      "Jako regułę obowiązującą tylko latem",
      "Jako dowód frontu chłodnego",
    ],
    correct: 1,
    explanation:
      "To klasyczny model rozwoju zachmurzenia frontu ciepłego, lecz rzeczywiste układy pomijają etapy, nakładają warstwy i zmieniają tempo.",
  },
  wiatr: {
    prompt: "Element chmury dryfuje ku północnemu wschodowi. Przy prostym dryfie wiatr jest…",
    options: ["z północnego wschodu", "z południowego zachodu", "z południowego wschodu", "z północnego zachodu"],
    correct: 1,
    explanation:
      "W tym pytaniu podano, dokąd płynie element. Przybliżony wiatr jest z przeciwnego kierunku, więc odwracamy wartość o 180°. Kierunku już zapisanego jako „skąd”, zgodnie z konwencją WMO, nie odwracamy ponownie.",
  },
  lotnictwo: {
    prompt: "Która grupa jako najniższa tworzy pułap?",
    options: ["FEW015", "SCT020", "BKN045", "CB bez podanej wysokości"],
    correct: 2,
    explanation:
      "Pułap tworzy najniższa warstwa BKN lub OVC albo widzialność pionowa. FEW i SCT nie tworzą ceiling w tym znaczeniu.",
  },
  warstwy: {
    prompt: "Dlaczego 850 hPa nie oznacza jednej stałej wysokości AGL?",
    options: [
      "Bo ciśnienie mierzy się wyłącznie nad morzem",
      "Bo wysokość powierzchni ciśnienia i wysokość terenu zmieniają się przestrzennie",
      "Bo 850 hPa zawsze leży pod ziemią",
      "Bo AGL i MSL są tym samym",
    ],
    correct: 1,
    explanation:
      "Modelowa powierzchnia ciśnienia ma zmienny geopotencjał, a AGL dodatkowo zależy od lokalnego terenu.",
  },
  zagrozenia: {
    prompt: "Który wniosek o oblodzeniu jest najbardziej poprawny?",
    options: [
      "Każda chmura przy temperaturze ujemnej daje silne oblodzenie",
      "Brak opadu wyklucza oblodzenie",
      "Potrzebne są m.in. temperatura, przechłodzona woda i czas ekspozycji",
      "Rodzaj chmury sam wystarcza do decyzji",
    ],
    correct: 2,
    explanation:
      "Nazwa chmury jest wskazówką, ale zagrożenie zależy od fazy i zawartości wody, temperatury, rozmiaru kropli, ruchu pionowego oraz ekspozycji.",
  },
  ekspert: {
    prompt: "Kiedy końcówka „mutatus” jest uzasadniona?",
    options: [
      "Gdy chmura wygląda niezwykle",
      "Gdy cała lub znaczna część chmury przekształciła się z innego rodzaju",
      "Gdy chmura powstała nad miastem",
      "Gdy obserwator nie zna gatunku",
    ],
    correct: 1,
    explanation:
      "Mutatus zapisuje przemianę rodzaju i wymaga dowodu historii rozwoju. Nie jest ogólną etykietą nietypowego wyglądu.",
  },
};
