export const lessons = {
  obserwacja: {
    lead:
      "Dobra identyfikacja nie zaczyna się od zgadywania nazwy. Zaczyna się od opisu, który inna osoba mogłaby sprawdzić i zakwestionować.",
    objectives: [
      "oddzielić obserwację od interpretacji",
      "opisać sylwetkę, skalę, światło, opad i zmianę",
      "zbudować zapis całego nieba zamiast oceniać pojedynczy fragment",
      "wskazać dowód, którego nadal brakuje",
    ],
    timePlan: [
      { label: "Czytanie i przypomnienia", minutes: 5 },
      { label: "Przykłady", minutes: 2 },
      { label: "Protokół terenowy", minutes: 4 },
      { label: "Punkt kontrolny", minutes: 1 },
    ],
    chapters: [
      {
        number: "01",
        minutes: 1,
        title: "Obserwacja nie jest jeszcze nazwą",
        paragraphs: [
          "Zdanie „to jest Altocumulus” jest hipotezą. Zdanie „widzę ławicę członów z jasną i ciemną stroną, bez opadu, powoli gęstniejącą od zachodu” jest materiałem dowodowym. Drugi zapis można porównać z kryteriami nawet wtedy, gdy nazwa okaże się błędna.",
          "Najczęstszy błąd początkującego polega na bardzo wczesnym przywiązaniu do etykiety. Od tej chwili oko zaczyna wybierać cechy, które ją potwierdzają. Dlatego najpierw zapisujemy to, co da się zobaczyć, a dopiero później uruchamiamy atlas.",
        ],
        callout:
          "Użyteczna notatka odpowiada na pytanie „co dokładnie widziałeś?”, a nie tylko „jak to nazwałeś?”.",
        sourceIds: ["wmoObservation"],
      },
      {
        number: "02",
        minutes: 1,
        title: "Najpierw całe niebo, potem szczegół",
        paragraphs: [
          "Rodzaj chmury może wyglądać inaczej przy horyzoncie, nad głową i pod Słońce. Perspektywa ściska odległe elementy, a silne światło usuwa cieniowanie. Zanim skupisz się na interesującym fragmencie, wykonaj pełny obrót i sprawdź, czy ta sama struktura występuje w innych częściach nieba.",
          "Zwróć uwagę na warstwy. Drobne wysokie elementy mogą być widoczne przez przerwy w niskim Stratocumulus, a postrzępione chmury pod opadem nie muszą być główną chmurą systemu. Jedno zdjęcie często zawiera więcej niż jeden rodzaj.",
        ],
        points: [
          "zasięg warstwy i położenie względem horyzontu",
          "liczba odrębnych poziomów",
          "kierunek napływu oraz obszar wzrostu lub zaniku",
        ],
        sourceIds: ["wmoObservation"],
      },
      {
        number: "03",
        minutes: 2,
        title: "Pięć klas dowodu",
        paragraphs: [
          "Sylwetka mówi, czy dominuje włókno, warstwa, człon czy wieża. Skala pomaga oddzielić drobne elementy wysokie od większych średnich i niskich. Światło ujawnia przejrzystość, cieniowanie, halo i ostrość tarczy Słońca. Opad rozróżnia virga od opadu docierającego do powierzchni. Czas pokazuje wzrost, zlodzenie, rozlewanie i przemianę.",
          "Żadna z tych klas nie działa bez kontekstu. Mały element przy horyzoncie może być pozornie skurczony, brak halo nie wyklucza Cirrostratus, a ciemna podstawa nie oznacza automatycznie Nimbostratus. Siła rozpoznania bierze się z zgodności kilku niezależnych cech.",
        ],
        example: {
          label: "Przykład zapisu",
          title: "Trzy zgodne sygnały",
          body:
            "Drobne białe ziarenka, prawie bez cienia, tworzą regularne fale wysoko na niebie. Taki zestaw wspiera Cirrocumulus mocniej niż sama etykieta „rybia łuska”.",
        },
        sourceIds: ["wmoAtlas", "wmoObservation"],
      },
      {
        number: "04",
        minutes: 1,
        title: "Niepewność jest wynikiem, nie porażką",
        paragraphs: [
          "Jeżeli dwie hipotezy pozostają blisko siebie, nie wybieraj dłuższej nazwy ani tej, którą znasz lepiej. Zapisz prowadzącą parę i znajdź cechę rozstrzygającą. Dla Cirrocumulus i Altocumulus będzie nią przede wszystkim dominująca skala elementów oraz cieniowanie; dla Cumulus congestus i Cumulonimbus calvus — zmiana faktury wierzchołka związana ze zlodzeniem.",
          "Poprawna obserwacja może zakończyć się zdaniem „brak danych do rozstrzygnięcia”. To uczciwsze i bardziej użyteczne niż pewna odpowiedź oparta na słabym kadrze.",
        ],
        callout:
          "Po każdej hipotezie dopisz jedno pytanie: co musiałbym zobaczyć, aby ją odrzucić?",
        sourceIds: ["wmoAtlas", "wmoObservation"],
      },
    ],
    recap: [
      "opisuj cechy przed nazwą",
      "obserwuj cały horyzont i kilka warstw",
      "łącz niezależne dowody",
      "zapisuj konkurencyjną hipotezę i brakujący test",
    ],
  },
  rodziny: {
    lead:
      "Nazwy WMO są złożeniami, ale etymologia jest tylko mapą startową. Pełna klasyfikacja zawsze wraca do obserwowalnej budowy chmury.",
    objectives: [
      "rozumieć rdzenie cirro-, alto-, stratus, cumulus i nimbus",
      "odróżniać poziom od budowy i funkcji opadowej",
      "umieścić dziesięć rodzajów w pamięci bez mechanicznej listy",
      "rozpoznawać miejsca, w których nazwa wymaga doprecyzowania",
    ],
    timePlan: [
      { label: "Czytanie i przypomnienia", minutes: 5 },
      { label: "Tabela rodzajów", minutes: 4 },
      { label: "Dekoder nazw", minutes: 7 },
      { label: "Punkt kontrolny", minutes: 2 },
    ],
    chapters: [
      {
        number: "01",
        minutes: 1,
        title: "Rodzaj jest pierwszą warstwą klasyfikacji",
        paragraphs: [
          "WMO wyróżnia dziesięć rodzajów chmur troposferycznych. Rodzaj jest kategorią podstawową: w danym momencie dana część chmury jest klasyfikowana jako jeden rodzaj, choć na niebie mogą współistnieć różne rodzaje, a chmura może przechodzić z jednego w drugi.",
          "Poziomy wysokie, średnie i niskie są użytecznym porządkiem, ale ich granice zależą od szerokości geograficznej i warunków atmosferycznych. Cumulus i Cumulonimbus dodatkowo rozwijają się pionowo, a Nimbostratus może zajmować kilka pięter.",
        ],
        sourceIds: ["wmoAtlas", "wmoSummary"],
      },
      {
        number: "02",
        minutes: 1,
        title: "cirro- i alto- mówią o poziomie",
        paragraphs: [
          "Człon cirro- prowadzi do rodzajów wysokich, w których dominują kryształki lodu: Cirrus, Cirrocumulus i Cirrostratus. Człon alto- prowadzi do Altocumulus i Altostratus na poziomie średnim. Alto nie oznacza najwyższej chmury; jest historycznym członem nazw tej grupy.",
          "Sam poziom nie rozstrzyga budowy. Cirrocumulus i Altocumulus są członowane, a Cirrostratus i Altostratus tworzą zasłony. Dlatego drugi człon nazwy jest równie ważny.",
        ],
        sourceIds: ["wmoAtlas"],
      },
      {
        number: "03",
        minutes: 1,
        title: "stratus i cumulus opisują organizację",
        paragraphs: [
          "Stratus oznacza warstwę lub zasłonę. Występuje samodzielnie jako niski Stratus, ale także w nazwach Cirrostratus, Altostratus i Nimbostratus. Cumulus wskazuje człony, kłęby albo rozwój konwekcyjny: Cirrocumulus, Altocumulus, Stratocumulus, Cumulus i Cumulonimbus.",
          "To nie jest prosty podział na „płaskie” i „puszyste”. Stratocumulus łączy warstwę z dużymi członami, a Cirrocumulus może tworzyć regularne fale. Liczy się dominująca organizacja całej obserwowanej części nieba.",
        ],
        example: {
          label: "Czytanie nazwy",
          title: "Altocumulus",
          body:
            "Alto- sugeruje poziom średni, a -cumulus członowaną budowę. Nadal trzeba sprawdzić wielkość elementów, cieniowanie i relację do innych warstw.",
        },
        sourceIds: ["wmoSummary"],
      },
      {
        number: "04",
        minutes: 1,
        title: "nimbus wiąże nazwę z opadem",
        paragraphs: [
          "Wśród rodzajów człon opadowy pojawia się w nazwach Nimbostratus i Cumulonimbus. Nimbostratus jest rozległą chmurą opadu warstwowego. Cumulonimbus jest głęboką chmurą konwekcyjną, zdolną do gwałtownych zjawisk.",
          "Obecność deszczu nie wystarcza jednak do użycia jednej z tych nazw. Altostratus może dawać virga lub opad, Cumulus może przynosić przelotny deszcz, a Stratus mżawkę. Trzeba ocenić budowę i zasięg całego systemu.",
        ],
        sourceIds: ["wmoAtlas"],
      },
      {
        number: "05",
        minutes: 1,
        title: "Mapa dziesięciu rodzajów",
        paragraphs: [
          "Zapamiętaj układ, nie kolejność listy. Wysoko: włóknisty Cirrus, ziarnisty Cirrocumulus, zasłonowy Cirrostratus. Średnio: członowany Altocumulus i zasłonowy Altostratus. Nisko: warstwowy Stratus i członowana warstwa Stratocumulus. Pionowo: Cumulus i Cumulonimbus. Wielopoziomowo i opadowo: Nimbostratus.",
          "Ta mapa jest punktem startowym. W praktyce wysokość pozorna bywa myląca, a przejścia między rodzajami są procesem. Dlatego zawsze wracaj do cech diagnostycznych.",
        ],
        callout:
          "Jeżeli potrafisz odtworzyć mapę z osi „poziom” i „budowa”, nie musisz uczyć się dziesięciu nazw jako przypadkowej listy.",
        sourceIds: ["wmoSummary"],
      },
    ],
    recap: [
      "cirro- i alto- porządkują poziom",
      "stratus i cumulus opisują organizację",
      "nimbus wskazuje związek z opadem, ale nie zastępuje diagnozy",
      "rodzaj jest początkiem pełnej nazwy WMO",
    ],
  },
  procesy: {
    lead:
      "Chmura pojawia się, gdy wilgotne powietrze osiąga nasycenie. Najczęściej prowadzi do tego unoszenie i ochładzanie, ale droga może być konwekcyjna, frontowa, orograficzna lub turbulentna.",
    objectives: [
      "wyjaśnić nasycenie bez mylenia go z maksymalną ilością pary",
      "rozróżnić stabilne i niestabilne unoszenie",
      "połączyć mechanizmy z budową warstwową, kłębiastą i falową",
      "rozumieć rolę inwersji, mieszania i fazy wody",
    ],
    timePlan: [
      { label: "Czytanie i przypomnienia", minutes: 6 },
      { label: "Schematy przyczynowe", minutes: 4 },
      { label: "Mapa mechanizmu", minutes: 8 },
      { label: "Punkt kontrolny", minutes: 2 },
    ],
    chapters: [
      {
        number: "01",
        minutes: 1,
        title: "Od pary wodnej do nasycenia",
        paragraphs: [
          "Powietrze zawiera parę wodną, a jej ciśnienie cząstkowe można porównywać z wartością nasycenia zależną przede wszystkim od temperatury. Gdy powietrze ochładza się bez utraty wilgoci, wilgotność względna rośnie. Po osiągnięciu nasycenia dalsze ochładzanie sprzyja kondensacji lub resublimacji na jądrze kondensacji albo lodowym.",
          "Punkt rosy jest temperaturą, do której należałoby ochłodzić powietrze przy zadanym ciśnieniu i zawartości pary, aby osiągnąć nasycenie. Nie jest wysokością podstawy chmury, choć różnica temperatury i punktu rosy przy powierzchni może pomagać w jej przybliżeniu w dobrze wymieszanej warstwie.",
        ],
        sourceIds: ["faaWeather"],
      },
      {
        number: "02",
        minutes: 1,
        title: "Unoszenie i chłodzenie adiabatyczne",
        paragraphs: [
          "Porcja powietrza unoszona do niższego ciśnienia rozszerza się i ochładza. Przed nasyceniem zmiana temperatury jest zbliżona do gradientu suchoadiabatycznego; po rozpoczęciu kondensacji uwalniane ciepło utajone zmniejsza tempo chłodzenia. To dlatego pionowy profil temperatury otoczenia decyduje, czy porcja pozostanie cieplejsza i bardziej wyporna.",
          "Źródłem unoszenia może być ogrzanie podłoża, front, przepływ nad terenem, zbieżność wiatru lub turbulencja. Ten sam stan nasycenia może więc prowadzić do zupełnie innej organizacji chmur.",
        ],
        points: [
          "konwekcja: lokalne, często komórkowe unoszenie",
          "front: rozległe unoszenie związane z układem mas powietrza",
          "orografia: wymuszenie przez teren i fale po zawietrznej",
          "turbulencja: mieszanie wilgotnej warstwy do poziomu kondensacji",
        ],
        sourceIds: ["faaWeather"],
      },
      {
        number: "03",
        minutes: 1,
        title: "Stabilność wybiera kształt",
        paragraphs: [
          "W atmosferze stabilnej wychylona porcja traci wyporność i ma tendencję do powrotu ku poziomowi równowagi. Unoszenie rozlewa się wtedy poziomo, co sprzyja warstwom i falom. W atmosferze niestabilnej porcja może pozostawać cieplejsza od otoczenia i przyspieszać ku górze, tworząc wieże Cumulus lub Cumulonimbus.",
          "Stabilność nie jest stałą etykietą całej atmosfery. Warstwa przy ziemi może być chwiejna, a wyżej zamknięta inwersją. W rezultacie Cumulus rośnie tylko do określonego poziomu i rozlewa się w Stratocumulus albo przestaje się rozwijać.",
        ],
        example: {
          label: "Sytuacja",
          title: "Kopuły zatrzymane na wspólnym poziomie",
          body:
            "Wiele Cumulus ma płaskie podstawy i wierzchołki dochodzące do podobnej wysokości. Wspólny limit może wskazywać stabilną warstwę lub inwersję nad warstwą mieszaną.",
        },
        sourceIds: ["faaWeather"],
      },
      {
        number: "04",
        minutes: 1,
        title: "Inwersja, mieszanie i chmury graniczne",
        paragraphs: [
          "Inwersja to warstwa, w której temperatura rośnie z wysokością. Może tłumić pionowe mieszanie i zatrzymywać wilgoć poniżej. Jeżeli turbulencja miesza tę warstwę aż do nasycenia, powstaje Stratus lub Stratocumulus. Jeżeli ogrzewanie podłoża wzmacnia wyporność, warstwa może się przerwać albo zostać uniesiona.",
          "Niska chmura często nie jest tylko wynikiem „dużej wilgotności”. Potrzebne są również odpowiedni profil temperatury, chłodzenie, mieszanie i dopływ wilgoci. Nocne wypromieniowanie, adwekcja nad chłodną powierzchnię i unoszenie po zboczu to różne drogi do podobnego obrazu.",
        ],
        sourceIds: ["faaWeather"],
      },
      {
        number: "05",
        minutes: 2,
        title: "Mikrofizyka zmienia wygląd i zagrożenie",
        paragraphs: [
          "Chmura może zawierać krople ciekłe, krople przechłodzone, kryształki lodu albo mieszaninę faz. Wysokie Cirrus są zwykle lodowe, ale wysokość nie jest jedynym kryterium fazy. W silnych prądach wstępujących duże ilości przechłodzonej wody mogą występować znacznie poniżej wierzchołka burzy.",
          "Wzrost kropli i kryształków zależy od kondensacji, zderzeń, koalescencji oraz procesów lodowych. To, czy hydrometeory dotrą do ziemi, zależy też od warstwy pod chmurą: virga może całkowicie wyparować lub wysublimować przed powierzchnią.",
        ],
        callout:
          "Rodzaj chmury podpowiada środowisko, lecz fazę wody i zagrożenie trzeba oceniać z temperaturą, dynamiką i dodatkowymi danymi.",
        sourceIds: ["faaWeather"],
      },
    ],
    recap: [
      "ochładzanie do nasycenia uruchamia powstawanie chmury",
      "mechanizm unoszenia organizuje obraz nieba",
      "stabilność i inwersja ograniczają pionowy rozwój",
      "mikrofizyka decyduje o opadzie i części zagrożeń",
    ],
  },
  fronty: {
    lead:
      "Sekwencja Cirrus → Cirrostratus → Altostratus → Nimbostratus jest użytecznym modelem frontu ciepłego, ale rzeczywiste niebo może pomijać etapy, nakładać kilka układów lub rozwijać konwekcję wewnątrz warstwy.",
    objectives: [
      "rozumieć front jako strefę trójwymiarową, nie linię na mapie",
      "czytać sekwencje chmur jako dowód warunkowy",
      "odróżniać typowe sygnały frontu ciepłego, chłodnego i okluzji",
      "budować scenariusz oraz wskazywać dane, które mogą go obalić",
    ],
    timePlan: [
      { label: "Czytanie i przypomnienia", minutes: 5 },
      { label: "Sekwencje i przypadki", minutes: 5 },
      { label: "Dziennik zmian", minutes: 10 },
      { label: "Punkt kontrolny", minutes: 2 },
    ],
    chapters: [
      {
        number: "01",
        minutes: 1,
        title: "Front jest strefą przejścia",
        paragraphs: [
          "Front rozdziela masy powietrza o różnych właściwościach i jest związany z polem temperatury, wilgoci, wiatru oraz ruchu pionowego. Linia na mapie jest uproszczonym śladem tej struktury przy powierzchni. Chmury mogą rozciągać się setki kilometrów przed lub za tym śladem.",
          "Wygląd frontu zależy od nachylenia strefy, prędkości przemieszczania, dostępnej wilgoci, stabilności i przepływu w środkowej troposferze. Dlatego jedna nazwa frontu nie gwarantuje jednego zestawu chmur.",
        ],
        sourceIds: ["faaWeather"],
      },
      {
        number: "02",
        minutes: 1,
        title: "Model frontu ciepłego",
        paragraphs: [
          "Gdy cieplejsze powietrze wślizguje się nad chłodniejszą warstwę, rozległe i stosunkowo łagodne unoszenie może najpierw nasycić górną troposferę. Pojawiają się Cirrus i Cirrostratus, następnie grubszy Altostratus, a przy dostatecznej głębokości i opadzie Nimbostratus.",
          "W praktyce niebo może przejść bez wyraźnego etapu Cirrostratus, opad może zacząć się z Altostratus, a w warstwie może być osadzona konwekcja. Tempo gęstnienia zależy od prędkości układu i geometrii przepływu, więc nie wolno przeliczać odległości do frontu z jednego rodzaju chmury.",
        ],
        example: {
          label: "Sekwencja",
          title: "Co wzmacnia hipotezę frontu ciepłego",
          body:
            "Zasłona wysokich chmur systematycznie obejmuje większą część nieba, tarcza Słońca stopniowo blednie, ciśnienie spada, a niższe warstwy pojawiają się w tym samym kierunku napływu.",
        },
        sourceIds: ["faaWeather", "wmoAtlas"],
      },
      {
        number: "03",
        minutes: 1,
        title: "Front chłodny i wymuszona konwekcja",
        paragraphs: [
          "Chłodniejsze, gęstsze powietrze wsuwające się pod cieplejsze może dawać węższą strefę silniejszego unoszenia. Jeżeli środowisko jest chwiejne i wilgotne, powstają Cumulus congestus, Cumulonimbus, linie szkwału lub zorganizowane pasma opadowe.",
          "Słaby front chłodny w stabilnym środowisku może jednak przynieść tylko warstwy i zmianę kierunku wiatru. Brak burzy nie oznacza braku frontu. Z kolei lokalna linia konwekcyjna może powstać bez klasycznego frontu powierzchniowego.",
        ],
        points: [
          "szukaj zmiany wiatru, temperatury i charakteru opadu",
          "oddziel ruch całej strefy od rozwoju pojedynczych komórek",
          "nie utożsamiaj każdej chmury arcus z frontem synoptycznym",
        ],
        sourceIds: ["faaWeather"],
      },
      {
        number: "04",
        minutes: 1,
        title: "Okluzja i układy złożone",
        paragraphs: [
          "Okluzja powstaje w rozwijającym się niżu, gdy front chłodny dogania ciepły, a ciepłe powietrze zostaje uniesione nad powierzchnię. Zachmurzenie może łączyć cechy rozległego systemu warstwowego z pasmami silniejszego opadu i konwekcją.",
          "Dla obserwatora naziemnego ważniejsze od próby nazwania okluzji na podstawie jednego kadru jest śledzenie kolejności warstw, kierunku wiatru, zmian ciśnienia i charakteru opadu. Klasyfikacja synoptyczna wymaga szerszych danych niż sam atlas chmur.",
        ],
        sourceIds: ["faaWeather"],
      },
      {
        number: "05",
        minutes: 1,
        title: "Po przejściu układu",
        paragraphs: [
          "Napływ chłodniejszego powietrza nad cieplejsze podłoże może zwiększyć chwiejność w dolnej troposferze. Typowym obrazem są pola Cumulus i Stratocumulus, przejaśnienia oraz przelotne opady. Kierunek pasm bywa związany z przepływem i zbieżnością w warstwie granicznej.",
          "Niebo po froncie jest częścią diagnozy: pomaga sprawdzić, czy wcześniejszy scenariusz był spójny z późniejszą zmianą masy powietrza.",
        ],
        callout:
          "Sekwencja jest argumentem wzmacnianym przez czas, wiatr, ciśnienie i opad. Pojedynczy rodzaj chmury nigdy nie jest samodzielnym dowodem frontu.",
        sourceIds: ["faaWeather"],
      },
    ],
    recap: [
      "front to rozległa strefa, a nie tylko linia",
      "sekwencja wysokie → średnie → opadowe jest modelem, nie zegarem",
      "front chłodny może, lecz nie musi, organizować konwekcję",
      "scenariusz trzeba porównywać z późniejszym przebiegiem pogody",
    ],
  },
  wiatr: {
    lead:
      "Chmura nie mierzy wiatru jak anemometr. Pokazuje ruch i deformację na własnej wysokości, a wynik trzeba oddzielić od perspektywy, opadania hydrometeorów, propagacji fali i rozwoju samej chmury.",
    objectives: [
      "odwracać kierunek ruchu na meteorologiczny kierunek wiatru",
      "rozpoznawać uskok między warstwami",
      "oddzielać adwekcję od fali, rozwoju i opadania",
      "opisywać wynik jako przybliżenie z poziomem i niepewnością",
    ],
    timePlan: [
      { label: "Czytanie i przypomnienia", minutes: 6 },
      { label: "Przykłady ruchu", minutes: 4 },
      { label: "Pomiar terenowy", minutes: 12 },
      { label: "Punkt kontrolny", minutes: 2 },
    ],
    chapters: [
      {
        number: "01",
        minutes: 1,
        title: "Wiatr jest „z”, ruch jest „do”",
        paragraphs: [
          "Jeżeli element chmury przemieszcza się ku północnemu wschodowi, jego wektor ruchu wskazuje kierunek do NE. W meteorologii wiatr nazywa się od kierunku, z którego napływa, więc prosty dryf oznacza wiatr z południowego zachodu.",
          "Najpierw nazwij obserwowany ruch, a dopiero potem odwróć go o 180°. Ten porządek ogranicza częsty błąd, w którym użytkownik mapy miesza strzałkę przepływu z nazwą wiatru.",
        ],
        example: {
          label: "Obliczenie",
          title: "Ruch 070°",
          body:
            "Element przesuwa się do 070°. Po odwróceniu o 180° otrzymujesz przybliżony wiatr z 250°, czyli z kierunku zachodnio-południowo-zachodniego.",
        },
        sourceIds: ["faaWeather"],
      },
      {
        number: "02",
        minutes: 1,
        title: "Wybierz element, który można śledzić",
        paragraphs: [
          "Krawędź rosnącego Cumulus zmienia położenie zarówno przez adwekcję, jak i rozwój. Lepszym znacznikiem jest niewielki, trwały fragment warstwy obserwowany przez kilkadziesiąt sekund względem komina, masztu albo kierunku kompasu.",
          "Elementy blisko zenitu dają mniejszy błąd perspektywy niż te przy horyzoncie. Powtórzenie pomiaru na drugim fragmencie tej samej warstwy pomaga wykryć, czy obserwujesz rzeczywisty przepływ, czy lokalną zmianę kształtu.",
        ],
        sourceIds: ["wmoObservation"],
      },
      {
        number: "03",
        minutes: 1,
        title: "Każda warstwa może płynąć inaczej",
        paragraphs: [
          "Stratus, Altocumulus i Cirrus mogą jednocześnie poruszać się w różnych kierunkach i z różną prędkością. To wizualny sygnał pionowego uskoku wiatru. Nie należy uśredniać ich do jednego kierunku bez podania poziomu.",
          "Uskok może zmieniać organizację konwekcji, deformować wieże i rozciągać kowadło. Obserwacja chmur ujawnia geometrię przepływu, ale nie daje dokładnej wartości prędkości ani profilu bez dodatkowych pomiarów.",
        ],
        points: [
          "zapisuj rodzaj lub przybliżone piętro chmury",
          "oddziel kierunek podstawy od ruchu wierzchołka",
          "porównuj kilka minut, nie pojedynczą sekundę",
        ],
        sourceIds: ["faaWeather", "wmoObservation"],
      },
      {
        number: "04",
        minutes: 1,
        title: "Fala może stać w silnym przepływie",
        paragraphs: [
          "Altocumulus lenticularis często pozostaje niemal nieruchomy względem terenu. Powietrze unosi się po stronie napływu, osiąga nasycenie i tworzy krople, a po zawietrznej opada, ogrzewa się i chmura zanika. Materia przepływa przez kształt, choć sam kształt jest zakotwiczony w fali.",
          "Podobnie pasma chmur falowych mogą wskazywać położenie grzbietów fali, a nie prędkość translacji całej struktury. Pozorna nieruchomość nie oznacza ciszy.",
        ],
        sourceIds: ["faaWeather", "wmoAtlas"],
      },
      {
        number: "05",
        minutes: 1,
        title: "Virga łączy opadanie i znoszenie",
        paragraphs: [
          "Smuga virga opada z prędkością zależną od hydrometeorów, jednocześnie jest znoszona przez przepływ i może parować. Jej nachylenie jest wynikiem wielu procesów, nie prostą strzałką wiatru.",
          "Zagięcie smugi może sugerować zmianę wiatru z wysokością, ale bez wiedzy o prędkości opadania i ewaporacji nie przelicza się go na wiarygodny profil.",
        ],
        sourceIds: ["faaWeather"],
      },
      {
        number: "06",
        minutes: 1,
        title: "Burza przemieszcza się i propaguje",
        paragraphs: [
          "Komórka Cumulonimbus jest przenoszona przez przepływ w głębokiej warstwie, lecz nowe prądy wstępujące mogą powstawać po jednej stronie, a stare zanikać po drugiej. Obserwowany układ może więc przemieszczać się inaczej niż pojedyncza część chmury.",
          "Wniosek terenowy powinien być skromny: chmury pomagają rozpoznać kierunek i uskok, ale nie zastępują danych wiatrowych potrzebnych do decyzji operacyjnej.",
        ],
        callout:
          "Zapisuj „ruch chmury wskazuje przybliżony wiatr z…” zamiast „wiatr wynosi…”.",
        sourceIds: ["faaWeather"],
      },
    ],
    recap: [
      "odwracaj ruch o 180°",
      "podawaj warstwę, której dotyczy obserwacja",
      "sprawdzaj falę, wzrost i opadanie jako alternatywy",
      "nie wyznaczaj prędkości ani bezpieczeństwa z samego obrazu chmur",
    ],
  },
  lotnictwo: {
    lead:
      "METAR opisuje warunki obserwowane przy lotnisku w określonym czasie, a TAF jest prognozą dla jego otoczenia. Oba produkty mają precyzyjną składnię, lecz żaden nie jest pełnym obrazem trasy ani automatyczną decyzją o bezpieczeństwie.",
    objectives: [
      "odczytać grupy FEW, SCT, BKN, OVC i VV",
      "wyznaczyć pułap oraz odróżnić go od podstawy dowolnej chmury",
      "rozumieć AGL, czas UTC, CB/TCU i zmienność w TAF",
      "wskazać ograniczenia raportu punktowego i prognozy lotniskowej",
    ],
    timePlan: [
      { label: "Czytanie i przypomnienia", minutes: 7 },
      { label: "Dekodowanie przykładów", minutes: 5 },
      { label: "Odczyt operacyjny", minutes: 11 },
      { label: "Punkt kontrolny", minutes: 3 },
    ],
    chapters: [
      {
        number: "01",
        minutes: 1,
        title: "Najpierw określ produkt, miejsce i czas",
        paragraphs: [
          "METAR jest rutynowym raportem obserwacyjnym dla lotniska. Zaczyna się od identyfikatora, dnia miesiąca i czasu UTC, a następnie podaje między innymi wiatr, widzialność, zjawiska, zachmurzenie, temperaturę, punkt rosy i ciśnienie. Raport może zawierać elementy automatyczne, korekty i uwagi zależne od systemu.",
          "TAF opisuje przewidywane warunki w okresie ważności dla obszaru lotniska. Nie jest prognozą całej trasy. Przed dekodowaniem sprawdź, czy patrzysz na obserwację czy prognozę i czy czas produktu odpowiada interesującemu momentowi.",
        ],
        example: {
          label: "Nagłówek",
          title: "EPWA 161200Z",
          body:
            "EPWA identyfikuje lotnisko, 16 oznacza dzień miesiąca, a 1200Z czas 12:00 UTC. Data miesiąca i szerszy kontekst pochodzą z chwili pobrania produktu.",
        },
        sourceIds: ["awcCodes", "easaAircrew"],
      },
      {
        number: "02",
        minutes: 1,
        title: "Pokrycie nieba: FEW, SCT, BKN, OVC",
        paragraphs: [
          "Grupy zachmurzenia opisują część kopuły nieba zajętą przez warstwę: FEW to 1–2 oktanty, SCT 3–4, BKN 5–7, a OVC 8 oktantów. SKC lub CLR w odpowiednim systemie wskazują brak raportowanego zachmurzenia według reguł produktu.",
          "Po skrócie występuje wysokość podstawy w setkach stóp nad poziomem lotniska. SCT020 oznacza rozproszone zachmurzenie z podstawą około 2000 ft AGL. Grupy są uporządkowane od najniższej podstawy ku wyższym.",
        ],
        points: [
          "FEW: 1–2/8",
          "SCT: 3–4/8",
          "BKN: 5–7/8",
          "OVC: 8/8",
        ],
        sourceIds: ["awcCodes"],
      },
      {
        number: "03",
        minutes: 1,
        title: "Pułap nie jest najniższą dowolną chmurą",
        paragraphs: [
          "W praktyce lotniczej pułap tworzy najniższa warstwa BKN lub OVC albo widzialność pionowa VV w sytuacji zasłoniętego nieba. FEW i SCT mogą być meteorologicznie oraz operacyjnie ważne, ale nie tworzą ceiling w tym technicznym znaczeniu.",
          "Jeżeli raport zawiera SCT015 BKN035 OVC080, najniższa podstawa chmur to 1500 ft AGL, lecz pułap wynosi 3500 ft AGL. To rozróżnienie jest jednym z najczęstszych błędów osób uczących się kodu.",
        ],
        example: {
          label: "Pułap",
          title: "SCT020 BKN060",
          body:
            "Warstwa SCT ma podstawę 2000 ft AGL, ale pułap tworzy BKN060, czyli 6000 ft AGL.",
        },
        sourceIds: ["awcCodes", "easaAircrew"],
      },
      {
        number: "04",
        minutes: 1,
        title: "CB, TCU i widzialność pionowa",
        paragraphs: [
          "Dopiski CB i TCU identyfikują Cumulonimbus lub wypiętrzony Cumulus przy danej warstwie. Są istotne, ponieważ wiążą zachmurzenie z konwekcją, ale brak dopisku nie jest dowodem, że poza strefą obserwacji nie występuje burza.",
          "VV oznacza widzialność pionową, gdy niebo jest zasłonięte i podstawy warstw nie da się wyznaczyć w zwykły sposób. VV002 oznacza widzialność pionową około 200 ft i tworzy pułap. Znaczenie operacyjne zawsze należy odnieść do pełnych procedur i aktualnych danych.",
        ],
        sourceIds: ["awcCodes", "easaAircrew"],
      },
      {
        number: "05",
        minutes: 1,
        title: "TAF opisuje zmiany w czasie",
        paragraphs: [
          "TAF zawiera warunki bazowe oraz grupy zmian. FM wprowadza nowy zestaw warunków od określonego czasu. TEMPO opisuje przewidywane przejściowe wahania w podanym okresie, a PROB może wskazywać prawdopodobieństwo określonego scenariusza zgodnie z zasadami danego produktu.",
          "Nie wybieraj pojedynczej grupy bez osi czasu. Dla planowanego momentu trzeba ustalić warunki bazowe, aktywne grupy przejściowe i kolejny okres. Prognoza ma rozdzielczość i niepewność; nie opisuje każdej minuty ani każdego punktu wokół lotniska.",
        ],
        callout:
          "Najpierw narysuj linię czasu TAF, dopiero potem oceniaj zachmurzenie. Czytanie grup jako luźnej listy usuwa najważniejszy kontekst.",
        sourceIds: ["awcCodes", "easaAircrew"],
      },
      {
        number: "06",
        minutes: 1,
        title: "AGL, MSL i teren",
        paragraphs: [
          "Wysokości warstw zachmurzenia w METAR i TAF odnoszą się do poziomu lotniska, czyli są wartościami AGL dla tego punktu. Nie są wysokościami nad średnim poziomem morza i nie można ich bezpośrednio nanosić na trasę nad zmiennym terenem.",
          "Aby uzyskać przybliżoną wysokość MSL podstawy nad lotniskiem, dodaje się elewację lotniska. To nadal nie mówi, jak wysoko ta sama warstwa leży nad sąsiednim wzgórzem ani czy jest przestrzennie ciągła.",
        ],
        sourceIds: ["awcCodes", "faaWeather"],
      },
      {
        number: "07",
        minutes: 1,
        title: "Czego kod nie mówi",
        paragraphs: [
          "Raport punktowy nie opisuje pełnej geometrii chmur poza otoczeniem lotniska, ich wierzchołków, wszystkich warstw po drodze ani dokładnej intensywności oblodzenia i turbulencji. TAF nie zastępuje obserwacji, ostrzeżeń, prognoz obszarowych i oceny sytuacji na trasie.",
          "Edukacyjny odczyt kończy się dwoma pytaniami: co produkt mówi wprost oraz jakich danych nadal potrzebuję? Ten nawyk jest ważniejszy niż szybkość rozwijania skrótów.",
        ],
        sourceIds: ["awcCodes", "easaAircrew", "faaWeather"],
      },
    ],
    recap: [
      "sprawdź produkt, lotnisko i czas UTC",
      "przelicz wysokość z setek stóp AGL",
      "pułap tworzy najniższe BKN, OVC lub VV",
      "TAF czytaj na osi czasu",
      "raport lotniskowy nie opisuje całej trasy",
    ],
  },
  warstwy: {
    lead:
      "Mapa na poziomie 850 hPa nie pokazuje pogody „1500 metrów nad Tobą”. Pokazuje pole na powierzchni określonego ciśnienia, której wysokość zmienia się przestrzennie i w czasie.",
    objectives: [
      "odróżnić AGL, MSL i wysokość geopotencjalną",
      "rozumieć poziomy ciśnienia jako powierzchnie, nie stałe półki",
      "sprawdzać relację poziomu modelu do terenu",
      "czytać warstwy Windy bez mieszania podstawy, wierzchołków i całkowitego zachmurzenia",
    ],
    timePlan: [
      { label: "Czytanie i przypomnienia", minutes: 6 },
      { label: "Przykłady pionowe", minutes: 6 },
      { label: "Rachunek AGL", minutes: 13 },
      { label: "Punkt kontrolny", minutes: 3 },
    ],
    chapters: [
      {
        number: "01",
        minutes: 1,
        title: "Trzy różne pytania o wysokość",
        paragraphs: [
          "AGL odpowiada na pytanie „jak wysoko nad lokalnym gruntem?”. MSL odnosi wysokość do średniego poziomu morza. Wysokość geopotencjalna opisuje energię potencjalną i jest używana do przedstawiania położenia powierzchni ciśnienia w atmosferze.",
          "Te wartości mogą być podobne na nizinie, lecz bardzo różne w górach. Punkt na 1500 m MSL leży 1400 m AGL nad terenem 100 m MSL, ale tylko 200 m AGL nad przełęczą 1300 m MSL.",
        ],
        sourceIds: ["faaWeather", "windyCloudBase"],
      },
      {
        number: "02",
        minutes: 1,
        title: "Poziom ciśnienia jest falującą powierzchnią",
        paragraphs: [
          "Ciśnienie maleje z wysokością, ale tempo zależy od temperatury i rozkładu masy powietrza. Powierzchnia 850 hPa nie leży wszędzie na tej samej wysokości. Jej geopotencjał rośnie w cieplejszej, grubszej kolumnie i zmienia się wraz z układem barycznym.",
          "Popularne przeliczenia 850 hPa na około 1,5 km czy 500 hPa na około 5,5 km są orientacyjne. Zawsze sprawdzaj mapę geopotencjału lub opis interfejsu, a w górach także to, czy poziom nie przecina modelowego terenu.",
        ],
        sourceIds: ["faaWeather", "windyLevels"],
      },
      {
        number: "03",
        minutes: 1,
        title: "Model wygładza teren i atmosferę",
        paragraphs: [
          "Model numeryczny reprezentuje teren w komórkach siatki. Wysoki szczyt może być obniżony, a wąska dolina wypełniona. Wartość dla wybranego punktu opisuje modelową komórkę, nie dokładny profil nad konkretnym balkonem.",
          "Niektóre poziomy ciśnienia w wysokich górach znajdują się poniżej modelowej powierzchni i są maskowane albo ekstrapolowane. Odczyt wiatru z takiego poziomu może nie opisywać swobodnej atmosfery nad użytkownikiem.",
        ],
        callout:
          "Przed interpretacją poziomu zadaj trzy pytania: jaka to współrzędna, gdzie leży względem terenu i jaka jest rozdzielczość modelu?",
        sourceIds: ["faaWeather", "windyLevels"],
      },
      {
        number: "04",
        minutes: 1,
        title: "Podstawa, wierzchołki i zachmurzenie to różne pola",
        paragraphs: [
          "Warstwa podstawy chmur może przedstawiać najniższą podstawę spełniającą określone kryterium zachmurzenia. Warstwa wierzchołków może koncentrować się na chmurach konwekcyjnych lub innym zdefiniowanym polu. Nie wolno zakładać, że obie mapy opisują dokładnie ten sam obiekt.",
          "Pozornie sprzeczne wartości mogą wynikać z różnych definicji, czasu modelu, interpolacji i współistnienia wielu warstw. Najpierw sprawdź opis produktu, a dopiero potem oceniaj, czy wynik jest fizycznie niemożliwy.",
        ],
        sourceIds: ["windyClouds", "windyCloudBase"],
      },
      {
        number: "05",
        minutes: 1,
        title: "Temperatura i wiatr na różnych poziomach",
        paragraphs: [
          "Porównanie wiatru przy powierzchni, na 850 hPa, 700 hPa i wyżej pokazuje zmianę kierunku oraz prędkości z wysokością. Jest to użyteczne dla oceny transportu mas powietrza, uskoku i organizacji chmur, lecz poziomy trzeba najpierw umieścić w rzeczywistej kolumnie nad terenem.",
          "Temperatura na poziomie ciśnienia nie jest temperaturą na stałej wysokości AGL. Na dwóch obszarach ta sama powierzchnia może leżeć na innych wysokościach, a lokalne warunki przy gruncie mogą być od niej oddzielone inwersją.",
        ],
        sourceIds: ["faaWeather", "windyLevels"],
      },
      {
        number: "06",
        minutes: 1,
        title: "Procedura czytania aplikacji pogodowej",
        paragraphs: [
          "Zacznij od miejsca i czasu, następnie wybierz pole oraz poziom, odczytaj jednostkę i układ odniesienia. Sprawdź wysokość terenu, geopotencjał lub przybliżoną wysokość poziomu. Potem porównaj sąsiednie poziomy i kolejne terminy.",
          "Na końcu połącz model z obserwacją: chmurami, raportem lotniskowym, sondażem lub innymi danymi. Interfejs mapy jest narzędziem do stawiania hipotez, nie warstwowym zdjęciem rzeczywistej atmosfery.",
        ],
        sourceIds: ["windyLevels", "windyClouds", "windyCloudBase"],
      },
    ],
    recap: [
      "AGL zależy od lokalnego terenu, MSL od poziomu morza",
      "poziom ciśnienia ma zmienną wysokość",
      "modelowy teren jest wygładzony",
      "różne warstwy interfejsu mogą używać różnych definicji",
      "porównuj poziomy, czas i obserwacje",
    ],
  },
  zagrozenia: {
    lead:
      "Niebezpieczeństwo wynika z połączenia fazy wody, temperatury, ruchu pionowego, uskoku wiatru i czasu ekspozycji. Sama nazwa chmury nie daje pełnej odpowiedzi.",
    objectives: [
      "łączyć warunki oblodzenia zamiast szukać jednej temperatury granicznej",
      "odróżniać główne źródła turbulencji",
      "rozumieć rolę CAPE, hamowania i inicjacji",
      "czytać chmury jako wskazówki, nie zezwolenie operacyjne",
    ],
    timePlan: [
      { label: "Czytanie i przypomnienia", minutes: 7 },
      { label: "Przypadki zagrożeń", minutes: 6 },
      { label: "Macierz danych", minutes: 16 },
      { label: "Punkt kontrolny", minutes: 3 },
    ],
    chapters: [
      {
        number: "01",
        minutes: 1,
        title: "Zagrożenie jest przecięciem kilku warunków",
        paragraphs: [
          "Chmura mówi coś o nasyceniu i ruchu atmosfery, ale nie podaje bezpośrednio zawartości wody ciekłej, rozkładu temperatury, prędkości prądów pionowych ani czasu ekspozycji. Te wielkości decydują o tym, czy ta sama wizualna klasa jest łagodna czy niebezpieczna.",
          "Dobra analiza nie pyta tylko „jaka to chmura?”, lecz „jaki proces w niej zachodzi, w jakiej temperaturze, na jakiej trasie i przez jak długo?”.",
        ],
        sourceIds: ["faaWeather", "easaAircrew"],
      },
      {
        number: "02",
        minutes: 1,
        title: "Oblodzenie wymaga wody ciekłej i ujemnej temperatury",
        paragraphs: [
          "Oblodzenie strukturalne powstaje, gdy przechłodzone krople uderzają w powierzchnię statku powietrznego i zamarzają. Sama temperatura poniżej zera nie wystarcza: chmura złożona głównie z kryształków lodu może mieć inną charakterystykę niż warstwa bogata w przechłodzoną wodę.",
          "Rozmiar kropli, zawartość wody, temperatura, prędkość przepływu i czas ekspozycji wpływają na tempo oraz rodzaj akrecji. Silne prądy wstępujące mogą podtrzymywać duże krople, dlatego konwekcja wymaga szczególnej ostrożności.",
        ],
        sourceIds: ["faaWeather", "easaAircrew"],
      },
      {
        number: "03",
        minutes: 1,
        title: "Turbulencja ma kilka różnych źródeł",
        paragraphs: [
          "Turbulencja konwekcyjna jest związana z prądami wstępującymi i zstępującymi. Mechaniczna powstaje przy przepływie nad nierównym terenem i przeszkodami. Falowa wiąże się z oscylacją przepływu po zawietrznej gór, a turbulencja w czystym powietrzu może występować przy silnym uskoku bez widocznej chmury.",
          "Wygląd Cumulus lub lenticularis może ostrzegać o dynamice, lecz brak charakterystycznej chmury nie wyklucza zagrożenia. Potrzebny jest profil wiatru, stabilność, teren i aktualne raporty.",
        ],
        points: [
          "konwekcyjna: silne ruchy pionowe",
          "mechaniczna: tarcie i przeszkody",
          "falowa: przepływ nad terenem w stabilnej warstwie",
          "CAT: uskok i deformacja przepływu bez koniecznej chmury",
        ],
        sourceIds: ["faaWeather"],
      },
      {
        number: "04",
        minutes: 1,
        title: "CAPE nie jest prognozą burzy",
        paragraphs: [
          "CAPE opisuje dodatnią wyporność parceli po osiągnięciu poziomu swobodnej konwekcji, przy określonych założeniach o parceli i profilu. Duża wartość oznacza potencjał silnych prądów wstępujących, ale nie gwarantuje inicjacji.",
          "Potrzebne są wilgoć, mechanizm unoszenia i możliwość pokonania warstwy hamującej. Niewielkie CAPE w środowisku silnego uskoku nadal może wspierać zorganizowaną konwekcję, a duże CAPE pod mocną inwersją może pozostać niewykorzystane.",
        ],
        sourceIds: ["faaWeather"],
      },
      {
        number: "05",
        minutes: 1,
        title: "Cumulonimbus to układ wielu zagrożeń",
        paragraphs: [
          "W głębokiej konwekcji współistnieją silne prądy pionowe, duża zawartość wody i lodu, wyładowania, grad, turbulencja oraz gwałtowne zmiany wiatru. Zagrożenia występują także poza widocznym rdzeniem opadowym i pod kowadłem.",
          "Nie czekaj na klasyczny obraz incus. Cumulonimbus calvus może być aktywną burzą, a zorganizowana linia może być częściowo zasłonięta przez chmury warstwowe lub opad.",
        ],
        callout:
          "Aplikacja uczy rozpoznawać sygnały, ale nie wyznacza bezpiecznej odległości ani nie zastępuje procedur i bieżących produktów ostrzegawczych.",
        sourceIds: ["faaWeather", "easaAircrew", "wmoAtlas"],
      },
      {
        number: "06",
        minutes: 1,
        title: "Uskok, szkwał i przepływ zstępujący",
        paragraphs: [
          "Silny gradient wiatru może wpływać na start, podejście i organizację burzy. Prąd zstępujący rozlewający się przy powierzchni może tworzyć gwałtowną zmianę kierunku i prędkości, wał arcus oraz strefę podnoszenia na krawędzi odpływu.",
          "Wał chmurowy jest wskazówką procesu, nie pełnym pomiarem. Niewidoczny odpływ może wyprzedzać chmurę, a intensywność zjawiska wymaga danych obserwacyjnych i ostrzeżeń.",
        ],
        sourceIds: ["faaWeather", "wmoAtlas"],
      },
      {
        number: "07",
        minutes: 1,
        title: "Matryca decyzji: dowód, brak, źródło",
        paragraphs: [
          "Dla każdego zagrożenia zapisz trzy kolumny: co już wiem, czego nie wiem i skąd mogę uzyskać informację. Na przykład typ chmury jest obserwacją, profil temperatury pochodzi z modelu lub sondażu, a aktualne raporty pilotów i ostrzeżenia opisują rzeczywiste zdarzenia.",
          "Ta metoda przeciwdziała pokusie, by jeden efektowny parametr zastąpił pełną analizę.",
        ],
        sourceIds: ["faaWeather", "easaAircrew"],
      },
    ],
    recap: [
      "oblodzenie wymaga przechłodzonej wody i ekspozycji",
      "turbulencja może występować bez chmur",
      "CAPE wymaga wilgoci, inicjacji i oceny hamowania",
      "burza łączy wiele zagrożeń także poza widocznym rdzeniem",
      "zawsze zapisuj brakujące dane",
    ],
  },
  ekspert: {
    lead:
      "Pełna nazwa może łączyć rodzaj, gatunek, odmianę, cechę dodatkową, chmurę towarzyszącą oraz informację o przemianie. Nie każda kombinacja jest dopuszczalna i nie każdy człon musi zostać użyty.",
    objectives: [
      "budować pełną nazwę we właściwej kolejności",
      "odróżniać gatunek, odmianę, cechę i chmurę towarzyszącą",
      "stosować genitus, mutatus i nazwy chmur specjalnych",
      "rozumieć, dlaczego dwie klasyfikacje mogą opisywać różne chwile procesu",
    ],
    timePlan: [
      { label: "Czytanie i przypomnienia", minutes: 7 },
      { label: "Praca z indeksem", minutes: 8 },
      { label: "Budowa nazwy", minutes: 17 },
      { label: "Punkt kontrolny", minutes: 3 },
    ],
    chapters: [
      {
        number: "01",
        minutes: 1,
        title: "Rodzaj jest obowiązkowy, reszta opisuje szczegóły",
        paragraphs: [
          "Pełna klasyfikacja zaczyna się od jednego z dziesięciu rodzajów. Gatunek opisuje kształt lub strukturę i zwykle wybiera się jeden. Odmiany opisują układ elementów lub przejrzystość; niektóre mogą współwystępować. Cechy dodatkowe i chmury towarzyszące nazywają części lub obiekty związane z chmurą główną.",
          "Nie każda chmura ma gatunek, odmianę albo cechę. Brak dodatkowego członu nie oznacza niepełnej obserwacji. Poprawna krótka nazwa jest lepsza niż długa kombinacja niezgodna z tabelą WMO.",
        ],
        sourceIds: ["wmoPrinciples", "wmoSummary"],
      },
      {
        number: "02",
        minutes: 1,
        title: "Gatunek opisuje dominującą postać",
        paragraphs: [
          "Gatunki takie jak fibratus, lenticularis, congestus czy calvus odnoszą się do morfologii. Ten sam gatunek może występować w kilku rodzajach, jeśli formalna tabela na to pozwala, a jego znaczenie trzeba czytać w kontekście rodzaju.",
          "Przy granicy rozwoju liczy się dominujący stan w chwili obserwacji. Cumulus congestus ma ostre, kalafiorowe wypukłości, a Cumulonimbus calvus zaczyna tracić tę fakturę wskutek zlodzenia. Zmiana może nastąpić między dwoma zdjęciami.",
        ],
        example: {
          label: "Granica",
          title: "congestus → calvus",
          body:
            "Wielkość wieży nie rozstrzyga. Dowodem przejścia jest wygładzanie i utrata ostrych konturów w górnej części związana z fazą lodową.",
        },
        sourceIds: ["wmoAtlas", "wmoSummary"],
      },
      {
        number: "03",
        minutes: 1,
        title: "Odmiana mówi o układzie lub przejrzystości",
        paragraphs: [
          "Undulatus opisuje fale, radiatus pozorne zbieganie równoległych pasm, duplicatus wielowarstwowość tego samego rodzaju, a translucidus, perlucidus i opacus różne własności przejrzystości. Odmiana nie zmienia rodzaju.",
          "Niektóre odmiany są wzajemnie wykluczające, a inne mogą wystąpić razem. Dlatego składnię należy sprawdzać w tabeli klasyfikacji, a nie budować przez swobodne łączenie łacińskich nazw.",
        ],
        sourceIds: ["wmoPrinciples", "wmoSummary"],
      },
      {
        number: "04",
        minutes: 1,
        title: "Cecha dodatkowa nie jest osobną chmurą",
        paragraphs: [
          "Incus, mamma, arcus, virga, praecipitatio czy cavum opisują szczególną część chmury albo zjawisko bezpośrednio z nią związane. Mogą mieć duże znaczenie wizualne i operacyjne, lecz nie zastępują rodzaju ani gatunku.",
          "Chmury towarzyszące, takie jak pileus, velum i pannus, są odrębnymi mniejszymi chmurami związanymi z chmurą główną. Pannus pod Nimbostratus nie powinien przesłonić klasyfikacji rozległego systemu opadowego powyżej.",
        ],
        sourceIds: ["wmoPrinciples", "wmoAtlas"],
      },
      {
        number: "05",
        minutes: 1,
        title: "genitus i mutatus zapisują historię",
        paragraphs: [
          "Genitus stosuje się, gdy chmura rozwija się z innej chmury, ale ta macierzysta nadal istnieje. Mutatus opisuje sytuację, w której cała lub znaczna część chmury macierzystej przekształciła się w inny rodzaj. Oba człony wymagają obserwacji procesu, nie tylko podobieństwa wyglądu.",
          "Na przykład Cirrus może powstać z górnej części Cumulonimbus. Sam włóknisty obłok po burzy nie wystarcza jednak do wpisania pochodzenia, jeżeli obserwator nie zna historii rozwoju.",
        ],
        sourceIds: ["wmoPrinciples"],
      },
      {
        number: "06",
        minutes: 1,
        title: "Chmury specjalne i wpływ człowieka",
        paragraphs: [
          "WMO wyróżnia nazwy związane z lokalnym źródłem powstania, między innymi homogenitus dla chmur wynikających z działalności człowieka oraz cataractagenitus, flammagenitus, silvagenitus i homomutatus w odpowiednich sytuacjach.",
          "Smuga kondensacyjna może rozwinąć się w Cirrus homogenitus, a następnie ulec dalszej przemianie. Pochodzenie antropogeniczne nie usuwa jej z klasyfikacji chmur; dodaje informację o genezie.",
        ],
        sourceIds: ["wmoPrinciples", "wmoSummary"],
      },
      {
        number: "07",
        minutes: 1,
        title: "Spór klasyfikacyjny może dotyczyć czasu i skali",
        paragraphs: [
          "Dwie osoby mogą patrzeć z różnych miejsc, w innym momencie albo na inną część układu. Jedna widzi oddzielne włókna Cirrus, druga ciągłą zasłonę Cirrostratus. Obie obserwacje mogą być poprawne dla swoich zakresów.",
          "Rozstrzygnięcie wymaga doprecyzowania obiektu, czasu, dominującej struktury i historii. W klasyfikacji dynamicznej pytanie „która nazwa jest zawsze prawdziwa?” bywa gorzej postawione niż „co dokładnie klasyfikujemy i według jakiego kryterium?”.",
        ],
        callout:
          "Eksperckość nie polega na najdłuższej nazwie. Polega na wskazaniu kryterium, dowodu, zakresu i uczciwej granicy pewności.",
        sourceIds: ["wmoAtlas", "wmoObservation", "wmoPrinciples"],
      },
    ],
    recap: [
      "rodzaj jest podstawą pełnej nazwy",
      "gatunek, odmiana i cecha pełnią różne role",
      "genitus i mutatus wymagają historii rozwoju",
      "nie każda formalnie brzmiąca kombinacja jest dopuszczalna",
      "spór rozwiązuj przez doprecyzowanie czasu, miejsca i kryterium",
    ],
  },
};

const chapterCheckpoints = {
  obserwacja: [
    {
      prompt: "Co należy zapisać, zanim po raz pierwszy użyjesz nazwy chmury?",
      answer:
        "Najpierw zapisz obserwowalne cechy: sylwetkę, skalę, cieniowanie, opad, zasięg i zmianę w czasie. Nazwa jest dopiero hipotezą zbudowaną na tym opisie.",
    },
    {
      prompt: "Dlaczego jeden efektowny fragment nieba może prowadzić do błędnej klasyfikacji?",
      answer:
        "Perspektywa i światło zmieniają wygląd elementów, a na niebie często współistnieje kilka poziomów. Pełny obrót pomaga oddzielić warstwy i ocenić zasięg struktury.",
    },
    {
      prompt: "Dlaczego zgodność kilku klas dowodu jest silniejsza niż jedna charakterystyczna cecha?",
      answer:
        "Pojedyncza cecha może występować w różnych rodzajach albo zostać zniekształcona przez perspektywę. Niezależne sygnały ograniczają liczbę wiarygodnych hipotez.",
    },
    {
      prompt: "Kiedy poprawnym wynikiem obserwacji jest brak rozstrzygnięcia?",
      answer:
        "Gdy nie widać cechy, która odróżnia prowadzące hipotezy. Wtedy zapisujesz obie możliwości oraz dowód potrzebny do ich rozdzielenia, zamiast udawać pewność.",
    },
  ],
  rodziny: [
    {
      prompt: "Dlaczego poziomy wysokie, średnie i niskie nie zastępują rodzaju chmury?",
      answer:
        "Granice pięter zmieniają się z szerokością geograficzną i sytuacją, a część rodzajów rozwija się przez kilka poziomów. Rodzaj opisuje formalną klasę obserwowanej budowy.",
    },
    {
      prompt: "Czy człon alto- oznacza najwyższe chmury? Uzasadnij odpowiedź.",
      answer:
        "Nie. Alto- prowadzi do poziomu średniego, natomiast cirro- do wysokiego. Drugi człon nazwy nadal musi opisać, czy obserwujesz warstwę, czy człony.",
    },
    {
      prompt: "Co mówi drugi człon nazwy w Cirrostratus i Altocumulus?",
      answer:
        "W Cirrostratus człon stratus wskazuje zasłonową organizację, a w Altocumulus człon cumulus wskazuje budowę członowaną. Pierwszy człon porządkuje poziom.",
    },
    {
      prompt: "Dlaczego sam deszcz nie wystarcza do rozpoznania Nimbostratus lub Cumulonimbus?",
      answer:
        "Opad może występować także z innych rodzajów. Trzeba ocenić rozległość, organizację warstwową albo konwekcyjną oraz charakter całego systemu.",
    },
    {
      prompt: "Jakie dwie osie pozwalają odtworzyć mapę dziesięciu rodzajów bez wkuwania listy?",
      answer:
        "Użyj poziomu oraz dominującej budowy: włóknistej, zasłonowej, członowanej, warstwowej, pionowej lub wielopoziomowej i opadowej.",
    },
  ],
  procesy: [
    {
      prompt: "Dlaczego punkt rosy nie jest po prostu wysokością podstawy chmury?",
      answer:
        "Punkt rosy jest temperaturą nasycenia dla danych warunków. Wysokość podstawy zależy dodatkowo od pionowego profilu, mieszania i sposobu unoszenia powietrza.",
    },
    {
      prompt: "Co wspólnego mają konwekcja, front, góry i turbulencja w procesie tworzenia chmur?",
      answer:
        "Wszystkie mogą unosić wilgotne powietrze do niższego ciśnienia, powodując rozszerzanie, ochładzanie i osiągnięcie nasycenia.",
    },
    {
      prompt: "Dlaczego ta sama wilgotność może dać warstwę albo wysoką wieżę Cumulus?",
      answer:
        "O kształcie decyduje stabilność pionowa. Stabilne środowisko ogranicza wyporność i sprzyja rozlewaniu, a niestabilne podtrzymuje przyspieszające unoszenie.",
    },
    {
      prompt: "Jak inwersja może jednocześnie sprzyjać niskiej chmurze i hamować jej wzrost?",
      answer:
        "Zatrzymuje wilgoć i mieszanie poniżej swojej podstawy, co pomaga nasycić warstwę, ale cieplejsze powietrze wyżej ogranicza dalszy rozwój pionowy.",
    },
    {
      prompt: "Dlaczego rozpoznanie rodzaju chmury nie wystarcza do oceny oblodzenia?",
      answer:
        "Potrzebne są faza wody, temperatura, zawartość przechłodzonej cieczy i dynamika. Ten sam rodzaj może mieć inną mikrofizykę oraz inny poziom zagrożenia.",
    },
  ],
  fronty: [
    {
      prompt: "Dlaczego linia frontu na mapie nie wyznacza granicy całego zachmurzenia?",
      answer:
        "Linia przedstawia uproszczony ślad strefy przy powierzchni, podczas gdy nachylona struktura i związane z nią chmury mogą rozciągać się setki kilometrów.",
    },
    {
      prompt: "Jakie dodatkowe zmiany wzmacniają hipotezę zbliżania się frontu ciepłego?",
      answer:
        "Systematyczne gęstnienie zasłony, blednięcie tarczy Słońca, spadek ciśnienia oraz zgodny kierunek napływu kolejnych, niższych warstw.",
    },
    {
      prompt: "Dlaczego brak burzy nie wyklucza przejścia frontu chłodnego?",
      answer:
        "W stabilnym lub suchym środowisku front może dać głównie warstwy, opad i zmianę wiatru. Silna konwekcja wymaga dodatkowo chwiejności oraz wilgoci.",
    },
    {
      prompt: "Jakich danych potrzebujesz, aby mówić o okluzji, a nie tylko o złożonym zachmurzeniu?",
      answer:
        "Potrzebny jest szerszy obraz synoptyczny: układ frontów i niżu, wiatr, ciśnienie, kolejność warstw oraz przebieg opadu, nie pojedynczy kadr.",
    },
    {
      prompt: "W jaki sposób pogoda po przejściu układu sprawdza wcześniejszą hipotezę?",
      answer:
        "Napływ chłodniejszej masy, zmiana wiatru, przejaśnienia i pola chmur kłębiastych powinny być spójne z zakładanym przejściem strefy frontowej.",
    },
  ],
  wiatr: [
    {
      prompt: "Element chmury płynie do północnego wschodu. Z którego kierunku wieje przybliżony wiatr?",
      answer:
        "Z południowego zachodu. Kierunek meteorologiczny mówi, skąd wiatr napływa, dlatego obserwowany wektor ruchu trzeba odwrócić o 180 stopni.",
    },
    {
      prompt: "Dlaczego rosnąca krawędź Cumulus jest słabszym znacznikiem wiatru niż mały fragment warstwy?",
      answer:
        "Jej położenie zmienia jednocześnie adwekcja i rozwój chmury. Trwały fragment warstwy łatwiej śledzić względem nieruchomego punktu odniesienia.",
    },
    {
      prompt: "Co oznaczają trzy warstwy chmur przemieszczające się w różnych kierunkach?",
      answer:
        "To jakościowy sygnał pionowego uskoku wiatru. Każdy kierunek należy przypisać do własnego poziomu, zamiast uśredniać je do jednego przepływu.",
    },
    {
      prompt: "Dlaczego nieruchomy Altocumulus lenticularis może świadczyć o silnym wietrze?",
      answer:
        "Kształt jest zakotwiczony w fali, ale powietrze stale przez niego przepływa: kondensuje po stronie wznoszącej i paruje po zawietrznej.",
    },
    {
      prompt: "Dlaczego nachylenia virga nie można bezpośrednio przeliczyć na kierunek i prędkość wiatru?",
      answer:
        "Smuga łączy poziome znoszenie z opadaniem hydrometeorów oraz parowaniem. Bez znajomości tych składowych nie daje jednoznacznego profilu przepływu.",
    },
    {
      prompt: "Dlaczego ruch całej burzy może różnić się od ruchu jej widocznych części?",
      answer:
        "Układ jest przenoszony przez przepływ, lecz jednocześnie nowe komórki powstają po jednej stronie, a stare zanikają po drugiej. To dodaje propagację do adwekcji.",
    },
  ],
  lotnictwo: [
    {
      prompt: "Jakie trzy rzeczy sprawdzasz przed rozwijaniem skrótów w depeszy?",
      answer:
        "Najpierw określ, czy to obserwacja METAR czy prognoza TAF, którego lotniska dotyczy produkt oraz jaki moment UTC opisuje lub obejmuje.",
    },
    {
      prompt: "Co dokładnie oznacza grupa SCT020?",
      answer:
        "Rozproszone zachmurzenie zajmuje 3–4 oktanty, a jego podstawa znajduje się około 2000 stóp nad poziomem lotniska, czyli AGL.",
    },
    {
      prompt: "W depeszy SCT015 BKN035 OVC080 jaka jest najniższa podstawa, a jaki pułap?",
      answer:
        "Najniższa raportowana podstawa to 1500 ft AGL, natomiast pułap tworzy pierwsze BKN, czyli 3500 ft AGL.",
    },
    {
      prompt: "Co oznacza VV002 i dlaczego ta grupa tworzy pułap?",
      answer:
        "Niebo jest zasłonięte, a widzialność pionowa wynosi około 200 ft. VV zastępuje możliwą do określenia podstawę i wchodzi do technicznej definicji pułapu.",
    },
    {
      prompt: "Dlaczego grup TAF nie wolno czytać jak niezależnej listy możliwości?",
      answer:
        "Każda grupa działa na określonym odcinku osi czasu i może zmieniać warunki bazowe albo opisywać przejściowe wahanie. Najpierw trzeba ustalić aktywny okres.",
    },
    {
      prompt: "Jak przybliżyć wysokość MSL podstawy podanej w METAR i czego ten rachunek nie dowodzi?",
      answer:
        "Dodaj elewację lotniska do wartości AGL. Wynik dotyczy punktu lotniska i nie dowodzi wysokości nad sąsiednim terenem ani ciągłości warstwy.",
    },
    {
      prompt: "Jakie dwa pytania powinny zakończyć odczyt każdej depeszy lotniczej?",
      answer:
        "Zapytaj, co produkt mówi wprost oraz jakich danych nadal brakuje. To chroni przed traktowaniem raportu punktowego lub TAF jako pełnego obrazu trasy.",
    },
  ],
  warstwy: [
    {
      prompt: "Punkt leży na 1500 m MSL nad terenem 1300 m MSL. Jaka jest jego wysokość AGL?",
      answer:
        "Około 200 m AGL. Wysokość nad gruntem otrzymujesz przez odjęcie lokalnej elewacji terenu od wysokości odniesionej do poziomu morza.",
    },
    {
      prompt: "Dlaczego poziom 850 hPa nie znajduje się wszędzie około 1500 metrów MSL?",
      answer:
        "Wysokość powierzchni ciśnienia zależy od temperatury i rozkładu masy całej kolumny. Powierzchnia faluje przestrzennie oraz zmienia się w czasie.",
    },
    {
      prompt: "Co może być nie tak z odczytem poziomu 850 hPa nad wysokim szczytem?",
      answer:
        "Poziom może przecinać modelowy teren albo zostać ekstrapolowany. Dodatkowo wygładzona wysokość komórki modelu może znacznie różnić się od rzeczywistego szczytu.",
    },
    {
      prompt: "Dlaczego mapa podstawy chmur i mapa wierzchołków mogą pokazywać pozornie sprzeczne liczby?",
      answer:
        "Mogą używać innych definicji, progów zachmurzenia, warstw, czasu i interpolacji. Najpierw trzeba sprawdzić opis obu produktów.",
    },
    {
      prompt: "Dlaczego temperatura na 700 hPa nie jest temperaturą na jednej stałej wysokości nad ziemią?",
      answer:
        "Powierzchnia 700 hPa ma zmienną wysokość MSL, a odległość od gruntu dodatkowo zależy od lokalnego terenu i struktury dolnej atmosfery.",
    },
    {
      prompt: "Jaka kolejność czynności chroni przed błędnym odczytem warstwy w aplikacji pogodowej?",
      answer:
        "Ustal miejsce i czas, pole, poziom, jednostkę i układ odniesienia; sprawdź teren oraz wysokość poziomu, porównaj sąsiednie warstwy i skonfrontuj model z obserwacją.",
    },
  ],
  zagrozenia: [
    {
      prompt: "Dlaczego sama nazwa chmury nie określa poziomu zagrożenia?",
      answer:
        "Nie podaje bezpośrednio fazy i zawartości wody, temperatury, prądów pionowych ani czasu ekspozycji. Te warunki trzeba połączyć z trasą i dodatkowymi danymi.",
    },
    {
      prompt: "Jakie dwa podstawowe warunki muszą współistnieć, aby możliwe było oblodzenie strukturalne?",
      answer:
        "Potrzebne są przechłodzone krople ciekłe oraz ujemna temperatura powierzchni, na którą uderzają. Kryształki lodu same w sobie nie tworzą identycznego mechanizmu akrecji.",
    },
    {
      prompt: "Który rodzaj turbulencji może wystąpić bez widocznej chmury i z czym jest związany?",
      answer:
        "Turbulencja w czystym powietrzu może wystąpić przy silnym uskoku i deformacji przepływu, często bez chmury wyznaczającej jej położenie.",
    },
    {
      prompt: "Dlaczego duże CAPE nie gwarantuje rozwoju burzy?",
      answer:
        "Potencjał wyporności musi zostać uruchomiony. Potrzebne są wilgoć, mechanizm unoszenia i możliwość pokonania warstwy hamującej lub inwersji.",
    },
    {
      prompt: "Dlaczego nie należy czekać na klasyczne kowadło, aby potraktować konwekcję poważnie?",
      answer:
        "Cumulonimbus calvus może już zawierać silne prądy, wodę i lód, wyładowania oraz turbulencję. Aktywna część układu może być też zasłonięta opadem.",
    },
    {
      prompt: "Co mówi wał arcus, a czego nie pozwala dokładnie wyznaczyć?",
      answer:
        "Wskazuje krawędź odpływu i wymuszone unoszenie, ale nie mierzy pełnej intensywności uskoku ani położenia całego niewidocznego przepływu zstępującego.",
    },
    {
      prompt: "Jakie trzy kolumny powinna mieć matryca analizy zagrożenia?",
      answer:
        "Zapisz: co już wiem, czego nadal nie wiem oraz z jakiego źródła uzyskam brakującą informację. To zapobiega dominacji jednego efektownego parametru.",
    },
  ],
  ekspert: [
    {
      prompt: "Dlaczego krótka nazwa może być bardziej ekspercka niż długa kombinacja łacińskich członów?",
      answer:
        "Dodatkowe człony stosuje się tylko wtedy, gdy obserwacja je uzasadnia i tabela WMO dopuszcza kombinację. Nadmiar niepotwierdzonych określeń zmniejsza precyzję.",
    },
    {
      prompt: "Co rozstrzyga przejście od Cumulus congestus do Cumulonimbus calvus?",
      answer:
        "Nie sama wysokość wieży, lecz utrata ostrych kalafiorowych konturów i wygładzanie górnej części związane z postępującym zlodzeniem.",
    },
    {
      prompt: "Czy odmiana może zmienić rodzaj chmury? Wyjaśnij na przykładzie.",
      answer:
        "Nie. Undulatus może opisać falowy układ w kilku dopuszczonych rodzajach, ale rodzaj nadal wynika z podstawowej budowy chmury.",
    },
    {
      prompt: "Czym różni się cecha dodatkowa virga od chmury towarzyszącej pannus?",
      answer:
        "Virga opisuje opad z chmury, który nie dociera do powierzchni. Pannus jest odrębną, postrzępioną chmurą związaną z głównym systemem.",
    },
    {
      prompt: "Dlaczego nie można dopisać genitus lub mutatus na podstawie pojedynczego zdjęcia?",
      answer:
        "Oba człony opisują historię przemiany. Trzeba obserwować chmurę macierzystą i wiedzieć, czy nadal istnieje, czy została w znacznym stopniu przekształcona.",
    },
    {
      prompt: "Jak klasyfikacja traktuje chmurę powstałą z działalności człowieka?",
      answer:
        "Nadal klasyfikuje jej rodzaj i budowę, a informację o pochodzeniu dodaje odpowiednim członem, na przykład homogenitus dla chmury antropogenicznej.",
    },
    {
      prompt: "Jak dwie różne nazwy tej samej sytuacji mogą być jednocześnie obronione?",
      answer:
        "Obserwatorzy mogą klasyfikować inną część układu, skalę lub moment przemiany. Trzeba najpierw uzgodnić obiekt, czas i dominujące kryterium.",
    },
  ],
};

for (const [lessonId, checkpoints] of Object.entries(chapterCheckpoints)) {
  const chapters = lessons[lessonId].chapters;
  if (checkpoints.length !== chapters.length) {
    throw new Error(`${lessonId}: liczba pytań rozdziałowych nie pasuje do liczby rozdziałów`);
  }
  chapters.forEach((chapter, index) => {
    chapter.checkpoint = checkpoints[index];
  });
}

export function lessonMinutes(lesson) {
  return lesson.timePlan.reduce((sum, item) => sum + item.minutes, 0);
}
