const range = (key, label, min, max, step, unit, icon) => ({ key, label, min, max, step, unit, icon });
const choice = (key, label, options) => ({ key, label, options });
const step = (key, target, title, action, expect, explanation) => ({ key, target, title, action, expect, explanation });
const moisture = choice("moisture", "Wilgotność początkowa", [["dry", "Suchsze powietrze"], ["wet", "Wilgotne powietrze"]]);
const stability = choice("stability", "Otoczenie unoszonej porcji", [["stable", "Stabilne"], ["unstable", "Chwiejne"]]);

export const sources = {
  observation: ["WMO · obserwacja chmur", "https://cloudatlas.wmo.int/en/observing-clouds.html"],
  classification: ["WMO · klasyfikacja", "https://cloudatlas.wmo.int/cloud-classification-summary.html"],
  metar: ["AWC · METAR i TAF", "https://aviationweather.gov/help/data/"],
  lifting: ["NWS · unoszenie i chwiejność", "https://www.weather.gov/spotterguide/ingredients"],
  fronts: ["NWS · fronty i unoszenie", "https://www.weather.gov/jkl/education"],
  icing: ["NWS · mechanizm oblodzenia", "https://www.weather.gov/source/zhu/ZHU_Training_Page/icing_stuff/icing/icing.htm"],
  turbulence: ["NWS · źródła turbulencji", "https://www.weather.gov/zme/safety_turb"],
  storms: ["NWS · rozwój burzy", "https://www.weather.gov/safety/lightning-thunderstorm-development"],
  sounding: ["NWS · Skew-T i jego ograniczenia", "https://www.weather.gov/source/zhu/ZHU_Training_Page/convective_parameters/skewt/skewtinfo.html"],
  handbook: ["FAA · Aviation Weather Handbook", "https://www.faa.gov/regulationspolicies/handbooksmanuals/aviation/faa-h-8083-28b-aviation-weather-handbook"],
};

export const activities = {
  obserwacja: {
    lesson: "obserwacja", group: "Obserwuj", short: "Opis przed nazwą", title: "Co naprawdę widzisz na zdjęciu?",
    lead: "Zanim odsłonisz nazwę, zapisz kształt i granice tego, co można wywnioskować z jednego kadru.",
    initial: { feature: "", altitude: "", reveal: "hidden" },
    controls: [choice("feature", "Budowa widocznych chmur", [["fibres", "Cienkie włókna"], ["rolls", "Szerokie, połączone wały"], ["tower", "Osobna wysoka wieża"]]),
      choice("altitude", "Co wiesz o wysokości?", [["exact", "Znam dokładną wysokość w metrach"], ["unknown", "Kadr nie daje pomiaru wysokości"]]),
      choice("reveal", "Porównanie z atlasem", [["hidden", "Jeszcze bez nazwy"], ["shown", "Odsłoń porównanie"]])],
    steps: [step("feature", "rolls", "Zacznij od budowy", "Wskaż połączone wały", "Przyjrzyj się szerokim członom w górnej części zdjęcia. Nie próbujemy jeszcze nazywać chmury.", "Opis budowy daje punkt porównania z atlasem. Sam kolor nie wystarcza: oświetlenie zachodzącego słońca silnie zmienia wygląd chmur."),
      step("altitude", "unknown", "Oddziel widok od pomiaru", "Zaznacz brak pomiaru wysokości", "Horyzont pomaga ocenić perspektywę, ale nie daje sam w sobie wysokości podstawy w metrach.", "Wysokość pozostaje nieznana bez dodatkowych danych. Można zapisać cechy i hipotezę piętra, ale nie udawać pomiaru."),
      step("reveal", "shown", "Dopiero teraz porównaj", "Odsłoń porównanie", "Zobacz nazwę oraz cechy opisane w atlasie. Sprawdź, które rzeczywiście wskazałeś na zdjęciu.", "To ćwiczenie odczytu konkretnej fotografii, nie wynik modelu rozpoznawania. Zachowujemy pełny kadr i jego autorstwo.")],
    check: { question: "Czego nie można uczciwie podać na podstawie samego tego zdjęcia?", options: ["Czy widać połączone człony", "Dokładnej wysokości podstawy w metrach", "Czy w kadrze jest horyzont", "Czy występuje cieniowanie"], correct: 1, explanation: "Perspektywa pomaga w obserwacji, ale zdjęcie bez danych pomiarowych nie daje dokładnej wysokości." }, sources: ["observation"],
  },
  rodziny: {
    lesson: "rodziny", group: "Obserwuj", short: "Mapa rodzajów", title: "Poziom i budowa to dwa różne pytania",
    lead: "Wybierz rodzaj i porównaj prawdziwe zdjęcia. Nazwy są tutaj objaśnieniem, nie ukrytą odpowiedzią w quizie.",
    initial: { genus: "cumulus" },
    controls: [choice("genus", "Rodzaj chmury", ["cirrus", "cirrocumulus", "cirrostratus", "altocumulus", "altostratus", "nimbostratus", "stratocumulus", "stratus", "cumulus", "cumulonimbus"].map(id => [id, id[0].toUpperCase() + id.slice(1)]))],
    steps: [step("genus", "cirrus", "Poszukaj włókien", "Pokaż Cirrus", "Spójrz na delikatną strukturę. To inna organizacja niż kłęby widoczne w Cumulus.", "Cirrus należy do wysokich rodzajów. Włóknista budowa jest wskazówką, którą łączymy z innymi cechami, a nie z samym kolorem."),
      step("genus", "altostratus", "Zmień budowę, nie tylko piętro", "Pokaż Altostratus", "Porównaj zasłonę z poprzednimi włóknami.", "Alto- wskazuje grupę średnią, a stratus budowę warstwową. Granice pięter są orientacyjne i zależą od regionu."),
      step("genus", "stratocumulus", "Zobacz połączenie warstwy i członów", "Pokaż Stratocumulus", "Znajdź większe połączone elementy, które razem tworzą warstwę.", "Nie każdy rodzaj daje się sprowadzić do jednej cechy. Stratocumulus łączy członowaną budowę z warstwową organizacją.")],
    check: { question: "Czy samo piętro rozstrzyga rodzaj chmury?", options: ["Tak, każda wysoka chmura to Cirrus", "Tak, wystarczy wysokość w kilometrach", "Nie, potrzebna jest także budowa i inne cechy", "Nie, rodzaj zależy wyłącznie od koloru"], correct: 2, explanation: "Na jednym piętrze występuje kilka rodzajów o różnej budowie. Rozpoznanie wymaga zestawu cech." }, sources: ["classification", "observation"],
  },
  front: {
    lesson: "fronty", group: "Wyjaśnij", short: "Front i wymuszone unoszenie", title: "Co unosi powietrze przy froncie?",
    lead: "Przesuń chłodniejszą masę pod cieplejszą porcję powietrza. Potem porównaj wilgotność i stabilność otoczenia.",
    initial: { progress: 0, moisture: "wet", stability: "stable", mechanism: "front" },
    controls: [range("progress", "Wymuszone uniesienie", 0, 100, 1, "%", "height"), moisture,
      choice("stability", "Spadek temperatury otoczenia z wysokością", [["stable", "4°C/km · stabilne"], ["unstable", "9°C/km · chwiejne warunkowo"]]),
      choice("mechanism", "Przyczyna unoszenia", [["front", "Front chłodny"], ["mountain", "Przepływ nad zboczem"]])],
    steps: [step("progress", 70, "Unieś wilgotną porcję", "Unieś do 70% drogi", "Porcja ochładza się podczas unoszenia. Po przejściu poziomu kondensacji pojawia się chmura.", "W tym doświadczeniu ruch jest wymuszony. Nawet stabilne otoczenie nie wyklucza chmury, gdy działa unoszenie."),
      step("moisture", "dry", "Sprawdź suchsze powietrze", "Porównaj suchsze powietrze", "Wysokość nie zmienia się. Sprawdź, czy ta porcja osiągnie nasycenie.", "Suchsza porcja potrzebuje większego ochłodzenia. Obecność frontu nie gwarantuje nawet chmury, a tym bardziej burzy."),
      step("moisture", "wet", "Wróć do wilgotnej porcji", "Przywróć wilgotne powietrze", "Chmura wraca na tej samej wysokości.", "Oddzielamy skutki wilgotności od działania mechanizmu unoszenia."),
      step("stability", "unstable", "Porównaj temperaturę z otoczeniem", "Wybierz spadek 9°C/km", "Porównaj temperaturę porcji z otoczeniem na tej samej wysokości. Cieplejsza porcja ma w tym uproszczeniu tendencję do dalszego unoszenia.", "To chwiejność warunkowa: sucha porcja nie musi być cieplejsza od otoczenia. Wynik zależy też od osiągnięcia nasycenia. Nie obliczamy tu głębokości konwekcji ani wystąpienia burzy.")],
    check: { question: "Co wynika z samego przejścia frontu chłodnego?", options: ["Zawsze rozwinie się burza", "Każda porcja osiągnie nasycenie", "Wiatr na każdym poziomie będzie identyczny", "To mechanizm unoszenia; wynik zależy także od wilgoci i stabilności"], correct: 3, explanation: "Front dostarcza wymuszenia. Wilgotność i profil temperatury wpływają na kondensację oraz dalszy rozwój." }, sources: ["fronts", "lifting"],
  },
  wiatr: {
    lesson: "wiatr", group: "Odczytaj", short: "Chmury w ruchu", title: "Chmura płynie dokąd, wiatr wieje skąd?",
    lead: "To widok z góry na schemat ruchu. Śledzisz kierunek dryfu, a nie prędkość rzeczywistej chmury.",
    initial: { direction: 0, upper: 0, layers: "one" },
    controls: [range("direction", "Ruch dolnej chmury w kierunku", 0, 315, 45, "°", "wind"),
      choice("layers", "Porównanie warstw", [["one", "Jedna warstwa"], ["two", "Dwie warstwy"]]),
      range("upper", "Ruch górnej chmury w kierunku", 0, 315, 45, "°", "wind")],
    steps: [step("direction", 90, "Przenieś chmurę na wschód", "Ustaw ruch do 90°", "Chmura płynie w stronę E. Sprawdź odczyt kierunku, z którego napływa.", "Ruch do 90° odpowiada w tym prostym dryfie wiatrowi z 270°. Odwracamy tylko kierunek „do”, nie gotowy meteorologiczny zapis „z”."),
      step("layers", "two", "Dodaj drugi poziom", "Pokaż dwie warstwy", "Porównaj tory dwóch chmur. Druga zaczyna z ruchem na północ.", "Nie uśredniaj różnych warstw do jednego wiatru. Ten widok rozdziela poziomy; nie przypisuje im dokładnych wysokości."),
      step("upper", 225, "Zmień ruch wyższej chmury", "Ustaw górną do 225°", "Drugi tor zmienia kierunek, a dolny pozostaje taki sam.", "Zmiana kierunku wiatru z wysokością jest uskokiem kierunkowym. Sama obserwacja nie mierzy jego siły ani turbulencji. Chmura falowa może stać w miejscu mimo przepływu.")],
    check: { question: "Fragment chmury dryfuje do 45°. Jaki kierunek „z” przybliżasz?", options: ["45°", "90°", "225°", "Nie ma żadnego wiatru"], correct: 2, explanation: "45° + 180° = 225°. To przybliżenie dla tej warstwy przy założeniu prostego dryfu." }, sources: ["observation", "handbook"],
  },
  metar: {
    lesson: "lotnictwo", group: "Odczytaj", short: "Niebo zapisane w METAR", title: "Zmień warstwę, odczytaj depeszę",
    lead: "Zbuduj prosty szkoleniowy raport. Zobacz różnicę między podstawą najniższej chmury a pułapem, a potem przejdź do czasu w TAF.",
    initial: { cover: "SCT", base: 20, product: "metar", hour: 12 },
    controls: [choice("cover", "Pokrycie niższej warstwy", [["FEW", "FEW · 1–2/8"], ["SCT", "SCT · 3–4/8"], ["BKN", "BKN · 5–7/8"], ["OVC", "OVC · 8/8"]]),
      range("base", "Podstawa niższej warstwy", 5, 45, 5, "×100 ft AGL", "height"),
      choice("product", "Rodzaj depeszy", [["metar", "METAR · obserwacja"], ["taf", "TAF · prognoza"]]),
      range("hour", "Godzina prognozy UTC", 12, 18, 1, ":00 UTC", "cooling")],
    steps: [step("cover", "BKN", "Zwiększ pokrycie niższej warstwy", "Zmień SCT na BKN", "Podstawa nadal wynosi 2000 ft AGL. Zobacz, która warstwa tworzy teraz pułap.", "BKN tworzy pułap. W SCT020 BKN060 pułap wynosił 6000 ft; po zmianie na BKN020 wynosi 2000 ft."),
      step("base", 10, "Obniż tylko podstawę", "Ustaw podstawę na 1000 ft", "Na schemacie niższa warstwa przesunie się w dół. W kodzie pojawi się 010.", "Liczba po BKN jest zapisem setek stóp nad lotniskiem. Nie podaje wysokości wierzchołka ani wysokości nad sąsiednim wzgórzem."),
      step("product", "taf", "Oddziel prognozę od obserwacji", "Otwórz przykład TAF", "Zaczynamy osobny, stały przykład prognozy na dzień 8, od 12:00 do 18:00 UTC. Poprzednie suwaki nie zmieniają tego TAF-u.", "TAF opisuje oczekiwane warunki w okresie ważności. Nie jest późniejszym zdjęciem tego samego nieba ani pomiarem."),
      step("hour", 14, "Sprawdź przejściowe warunki", "Przejdź do 14:00 UTC", "Oprócz warunków bazowych zobaczysz aktywną grupę TEMPO.", "TEMPO opisuje przejściowe wahania w podanym oknie, a nie ciągłe warunki przez całą godzinę. Od 16:00 grupa FM ustanawia nowy stan bazowy.")],
    check: { question: "W raporcie FEW010 SCT020 BKN050 jaka warstwa tworzy pułap?", options: ["FEW010", "SCT020", "BKN050", "Średnia wszystkich podstaw"], correct: 2, explanation: "W tym raporcie najniższą warstwą tworzącą pułap jest BKN050: 5000 ft AGL. Niższe FEW i SCT nie tworzą ceiling." }, sources: ["metar"],
  },
  wysokosc: {
    lesson: "warstwy", group: "Odczytaj", short: "Nad morzem czy nad ziemią?", title: "Ta sama wysokość, inna odległość od gruntu",
    lead: "Przekrój używa metrów. Poziom 1500 m MSL pozostaje stały, a Ty zmieniasz wysokość terenu pod nim.",
    initial: { terrain: 100 }, controls: [range("terrain", "Wysokość terenu MSL", 0, 2000, 100, "m MSL", "height")],
    steps: [step("terrain", 1300, "Przenieś się nad przełęcz", "Ustaw teren na 1300 m", "Sprawdź odstęp między gruntem a poziomem 1500 m MSL.", "1500 − 1300 = 200 m AGL. Ta sama wysokość nad morzem oznacza mniejszą odległość od wyżej położonego gruntu."),
      step("terrain", 1800, "Sprawdź teren powyżej poziomu", "Ustaw teren na 1800 m", "Poziom 1500 m MSL znajdzie się pod powierzchnią terenu.", "Nie pokazujemy tu ujemnej wysokości jako dostępnej warstwy powietrza. Także poziom ciśnienia może przeciąć teren; trzeba sprawdzić, co wtedy robi produkt modelowy."),
      step("terrain", 100, "Wróć nad nizinę", "Ustaw teren na 100 m", "Odstęp od ziemi znowu będzie większy, choć poziom MSL się nie zmienił.", "To rachunek układów odniesienia, nie przelicznik hPa na stałą wysokość. Wysokość powierzchni ciśnienia zmienia się z warunkami atmosferycznymi.")],
    check: { question: "Czy 850 hPa zawsze oznacza 1500 m nad lokalnym gruntem?", options: ["Tak, niezależnie od miejsca", "Nie: to powierzchnia ciśnienia o zmiennej wysokości", "Tak, ale tylko nocą", "Tak, jeśli widać chmury"], correct: 1, explanation: "Potrzebujesz wysokości poziomu i terenu. Ciśnienie nie wyznacza stałej odległości nad każdym miejscem." }, sources: ["handbook"],
  },
  sondaz: {
    lesson: "warstwy", group: "Odczytaj", short: "Sondaż bez zgadywania", title: "Najpierw odczytaj jeden poziom",
    lead: "Sondaż to zestaw pomiarów na kolejnych wysokościach. Tutaj używamy danych szkoleniowych, nie pomiaru ani prognozy. Zaczynamy od dwóch liczb.",
    initial: { level: 0, detail: "temperature", projection: "straight" },
    controls: [range("level", "Kolejny poziom profilu", 0, 8, 1, "", "height"),
      choice("detail", "Co czytasz", [["temperature", "Temperatura"], ["moisture", "Temperatura i punkt rosy"], ["parcel", "Dodaj unoszoną porcję"], ["wind", "Dodaj wiatr"]]),
      choice("projection", "Sposób rysowania temperatury", [["straight", "Proste osie"], ["skew", "Osie Skew-T"]])],
    steps: [step("level", 2, "Sprawdź, czy wyżej jest chłodniej", "Odczytaj poziom 925 hPa", "Na 1000 hPa było 7°C. Porównaj tę wartość z temperaturą na 925 hPa.", "Temperatura wzrosła do 9°C: to inwersja. Wyżej nie zawsze znaczy chłodniej. hPa opisuje ciśnienie, które maleje podczas wznoszenia."),
      step("detail", "moisture", "Dodaj punkt rosy", "Pokaż temperaturę i punkt rosy", "Porównaj 9°C z punktem rosy 7°C na tym samym poziomie.", "Mały odstęp oznacza powietrze bliższe nasyceniu niż przy dużym odstępie. Nie jest pomiarem grubości chmury ani gwarancją, że ją zobaczysz."),
      step("detail", "parcel", "Porównaj unoszoną porcję z otoczeniem", "Dodaj unoszoną porcję", "Porcja w tym przykładzie ma na 925 hPa około 1°C, otoczenie 9°C.", "Chłodniejsza porcja ma tendencję do hamowania unoszenia. To uproszczone porównanie temperatur, bez pełnego rachunku temperatury wirtualnej, mieszania i wyporności."),
      step("projection", "skew", "Dopiero teraz przechyl osie", "Przełącz na osie Skew-T", "Liczby pozostają identyczne. Zmienia się tylko sposób rysowania osi temperatury.", "Na Skew-T linie stałej temperatury są ukośne, a ciśnienie ma skalę logarytmiczną. Temperatury porównuj na tym samym poziomie ciśnienia, nie po samym nachyleniu krzywej."),
      step("detail", "wind", "Na końcu dołóż wiatr", "Pokaż także wiatr", "Odczytaj kierunek „z” i prędkość na wybranym poziomie. Potem porównaj sąsiedni poziom.", "Profil opisuje zmianę warunków w pionie. Nie wyznacza sam czasu i miejsca burzy. Pełny warsztat z innymi profilami jest dostępny pod doświadczeniem.")],
    check: { question: "Co oznacza odsunięcie krzywej temperatury od punktu rosy na tym samym poziomie?", options: ["Większą odległość od nasycenia", "Dokładną grubość chmury", "Silniejszy wiatr", "Pewną burzę"], correct: 0, explanation: "Porównujesz temperaturę z punktem rosy, czyli wskazówkę wilgotności. Nie odczytasz z samego odstępu prędkości wiatru ani grubości chmury." }, sources: ["sounding"],
  },
  oblodzenie: {
    lesson: "zagrozenia", group: "Rozpoznaj mechanizm", short: "Jak narasta lód?", title: "Mróz to dopiero część warunków",
    lead: "Badamy osadzanie lodu z przechłodzonych kropli na zimnym skrzydle. To jeden mechanizm oblodzenia, nie ocena zagrożenia dla samolotu.",
    initial: { temperature: -10, phase: "dry", exposure: 0 },
    controls: [range("temperature", "Temperatura powietrza i skrzydła", -25, 5, 1, "°C", "temperature"),
      choice("phase", "Co uderza w skrzydło", [["dry", "Bez kropli"], ["liquid", "Krople ciekłej wody"], ["ice", "Tylko suche kryształki lodu"]]),
      range("exposure", "Umowny czas ekspozycji", 0, 100, 5, "%", "cooling")],
    steps: [step("exposure", 50, "Samo zimno nie wystarczy", "Ustaw ekspozycję na 50%", "Powietrze i skrzydło mają −10°C, ale brak kropli. Obserwuj krawędź skrzydła.", "Nie pokazujemy akrecji z kropli, których tutaj nie ma. Nie oznacza to wykluczenia szronu ani innych mechanizmów poza zakresem sceny."),
      step("phase", "liquid", "Dodaj ciekłą wodę poniżej zera", "Wybierz krople ciekłej wody", "Na przedniej krawędzi pojawi się symbol osadzającego się lodu.", "Ciekła woda może pozostawać przechłodzona. Uderzające krople mogą zamarzać na zimnej powierzchni. Skala rysunku nie oznacza milimetrów ani tempa narastania."),
      step("phase", "ice", "Porównaj fazę wody", "Zamień krople na suche kryształki", "Obserwujesz nową próbę, więc poprzedni osad jest zerowany. Sprawdź, czy działa ten sam mechanizm.", "Same suche kryształki nie są przechłodzonymi kroplami. Inne zagrożenia lodowe, zwłaszcza związane z silnikami, pozostają poza tym uproszczeniem.")],
    check: { question: "Który zestaw sprzyja pokazanemu mechanizmowi osadzania lodu?", options: ["Samo −10°C w suchym powietrzu", "Zimna powierzchnia i przechłodzone krople", "Dowolna chmura niezależnie od fazy wody", "Sam wysoki wynik CAPE"], correct: 1, explanation: "Ten schemat dotyczy kropli zamarzających na zimnej powierzchni. Intensywność wymagałaby jeszcze innych danych." }, sources: ["icing"],
  },
  turbulencja: {
    lesson: "zagrozenia", group: "Rozpoznaj mechanizm", short: "Skąd biorą się nierówne podmuchy?", title: "Trzy drogi do nieregularnego przepływu",
    lead: "Zmieniaj przyczynę zaburzenia i śledź znaczniki powietrza. Tory są ilustracją procesu, nie obliczeniem turbulencji ani ruchu samolotu.",
    initial: { mechanism: "mechanical", strength: 0 },
    controls: [choice("mechanism", "Źródło zaburzenia", [["mechanical", "Przeszkoda w przepływie"], ["thermal", "Nierówne ogrzewanie"], ["shear", "Różne prędkości warstw"]]),
      range("strength", "Natężenie pokazanego wymuszenia", 0, 100, 5, "%", "wind")],
    steps: [step("strength", 70, "Zwiększ zaburzenie za przeszkodą", "Ustaw wymuszenie na 70%", "Za przeszkodą tory zaczynają się odchylać. Nie musisz widzieć chmury, żeby przepływ był zaburzony.", "Przeszkody i szorstkość podłoża zaburzają wiatr. To schemat turbulencji mechanicznej, nie mapa stref bezpiecznych i niebezpiecznych."),
      step("mechanism", "thermal", "Zmień przyczynę ruchu pionowego", "Porównaj nierówne ogrzewanie", "Zamiast przeszkody źródłem pionowego ruchu jest ogrzewane podłoże.", "Nierówne nagrzewanie może wywoływać prądy konwekcyjne. Wilgotność decyduje, czy część takiego unoszenia stanie się widoczna jako chmura."),
      step("mechanism", "shear", "Porównaj dwie warstwy", "Pokaż różne prędkości warstw", "Znaczniki na dwóch poziomach poruszają się różnie. Zaburzenia pokazujemy przy ich granicy.", "Uskok to zmiana wektora wiatru w przestrzeni. Może sprzyjać turbulencji, ale sam nie daje jej pewnej intensywności; znaczenie ma także stabilność.")],
    check: { question: "Czy bezchmurne niebo wyklucza turbulencję?", options: ["Tak, bo nie ma kropli", "Tak, jeśli nie ma deszczu", "Nie, zaburzenia mogą wynikać z przeszkód lub uskoku", "Tak, poza godziną południową"], correct: 2, explanation: "Chmury nie są koniecznym warunkiem turbulencji. Potrzebne są dane o przepływie i jego otoczeniu." }, sources: ["turbulence"],
  },
  burza: {
    lesson: "zagrozenia", group: "Rozpoznaj mechanizm", short: "Co pozwala rozwinąć się burzy?", title: "Sam potencjał to nie początek burzy",
    lead: "Złóż trzy warunki sprzyjające głębokiej konwekcji, a potem zobacz umowny cykl komórki. Nie wyliczamy prawdopodobieństwa burzy.",
    initial: { moisture: "dry", stability: "stable", trigger: "none", phase: 0 },
    controls: [moisture, stability, choice("trigger", "Początek unoszenia", [["none", "Brak wymuszenia"], ["lift", "Wymuszenie pokonuje hamowanie"]]),
      range("phase", "Etap przykładowej komórki", 0, 2, 1, "", "height")],
    steps: [step("moisture", "wet", "Zapewnij wilgoć", "Wybierz wilgotne powietrze", "Nie pojawia się jeszcze rozwinięta komórka. Sprawdź pozostałe warunki.", "Wilgoć umożliwia kondensację, ale sama nie wystarcza do głębokiego rozwoju."),
      step("stability", "unstable", "Dodaj potencjał unoszenia", "Wybierz chwiejne otoczenie", "Nadal brakuje uruchomienia unoszenia i pokonania hamowania.", "Także duża energia potencjalnie dostępna konwekcji nie jest gwarancją inicjacji."),
      step("trigger", "lift", "Uruchom unoszenie", "Dodaj wymuszenie", "Schemat pokazuje możliwość rozwoju komórki, nie pewną burzę w określonym miejscu.", "Wilgoć, chwiejność i skuteczne unoszenie trzeba rozpatrywać łącznie. Rzeczywisty profil jest bardziej złożony niż te trzy przełączniki."),
      step("phase", 1, "Prześledź stadium dojrzałe", "Pokaż stadium dojrzałe", "Pojawią się prądy wstępujący i zstępujący oraz oznaczenia opadu.", "To umowny cykl pojedynczej komórki. W stadium zaniku dominuje prąd zstępujący; zorganizowane burze mogą ewoluować inaczej.")],
    check: { question: "Co możesz wywnioskować z dużego CAPE bez informacji o hamowaniu i inicjacji?", options: ["Dokładną godzinę burzy", "Brak zagrożeń poza chmurą", "Gwarancję silnego gradu", "Potencjał, który może pozostać niewykorzystany"], correct: 3, explanation: "CAPE opisuje dostępny potencjał wybranej porcji, nie miejsce, czas ani pewność rozwoju burzy." }, sources: ["storms", "lifting", "fronts"],
  },
  nazwy: {
    lesson: "ekspert", group: "Obserwuj", short: "Nazwa z uzasadnieniem", title: "Nie dopisuj tego, czego nie zaobserwowałeś",
    lead: "Pracujesz z opisem szkoleniowym: osobne wysokie kłęby o ostrych wypukłościach, opad dochodzi do ziemi. Nie znasz historii ich powstania.",
    initial: { species: "", feature: "", history: "" },
    controls: [choice("species", "Gatunek dla opisanego Cumulus", [["humilis", "humilis · mała rozciągłość pionowa"], ["congestus", "congestus · silny rozwój pionowy"], ["calvus", "calvus · inny rodzaj"]]),
      choice("feature", "Cecha opadu", [["virga", "virga · zanika nad ziemią"], ["praecipitatio", "praecipitatio · dochodzi do ziemi"]]),
      choice("history", "Pochodzenie chmury", [["invent", "Dopisuję pochodzenie z wyglądu"], ["unknown", "Nie dopisuję: brak obserwacji rozwoju"]])],
    steps: [step("species", "congestus", "Wybierz gatunek zgodny z opisem", "Wybierz congestus", "Porównaj rozwój pionowy oraz zachowane ostre wypukłości.", "Congestus jest gatunkiem Cumulus. Calvus należy do Cumulonimbus; nie dopisujemy go do Cumulus."),
      step("feature", "praecipitatio", "Nazwij to, co robi opad", "Wybierz praecipitatio", "W opisie opad dociera do powierzchni, a nie zanika po drodze.", "Praecipitatio jest cechą dodatkową. Nie zastępuje rodzaju ani gatunku. Virga dotyczyłaby opadu zanikającego przed ziemią."),
      step("history", "unknown", "Zostaw miejsce na niewiadomą", "Pozostaw pochodzenie nieznane", "Nazwa pozostaje krótka. Nie dodajemy członu z historii, której nie obserwowaliśmy.", "Złożysz Cumulus congestus praecipitatio. To rozwiązanie opisu szkoleniowego, nie automatyczna klasyfikacja dowolnego zdjęcia.")],
    check: { question: "Co jest potrzebne do uzasadnienia członu genitus lub mutatus?", options: ["Sama długość nazwy", "Wyłącznie ciemny kolor", "Obserwacja pochodzenia lub przemiany", "Dowolne zdjęcie po deszczu"], correct: 2, explanation: "Te człony opisują historię powstania lub przemiany. Nie należy jej dopowiadać z samego podobieństwa." }, sources: ["classification", "observation"],
  },
};

export function lessonStateAt(id, index) {
  const activity = activities[id];
  const state = { ...activity.initial };
  for (const item of activity.steps.slice(0, Math.max(0, index))) state[item.key] = item.target;
  return state;
}
export function lessonStepComplete(id, index, state) {
  const item = activities[id]?.steps[index];
  if (!item) return false;
  const target = { ...lessonStateAt(id, index), [item.key]: item.target };
  return Object.entries(target).every(([key, value]) => state[key] === value);
}
