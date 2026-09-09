# CHMURNIK: od przewodnika do zastosowania wiedzy

2026-09-09. Dokument badawczo-projektowy, bez implementacji i badania skuteczności. Zakres: statyczny, działający offline podgląd React; język polski; bez prognozowania pogody i kwalifikowania lotu jako bezpiecznego.

## Diagnoza i cel

- Przeczytano projektowy `build-quality-lesson/SKILL.md` i `references/lesson-contract.md`: wymagają obserwowalnego działania, rozumowania, ukrywania odpowiedzi także w dostępności, informacji zwrotnej i powtórki. To projekt praktyki wewnątrz lekcji, nie zamiennik jej rozdziałów.
- W [LearningStudio.jsx](/Volumes/Kingston-Codex/repos/Documents/Codex/2026-06-16/widzisz-jak-pracuj-niedawno-zrobili-my/chmurnik-v4/weather-preview/learning/LearningStudio.jsx:88) „Samodzielna próba” zmienia `guide` i `done`, pozostawiając `state`; `visibleControls` odsłania kontrolki. Nie powstaje nowe zadanie ani zapis przewidywania. Obecny tryb należy nazwać „Swobodna eksploracja” i zachować poza oceną.
- [catalog.mjs](/Volumes/Kingston-Codex/repos/Documents/Codex/2026-06-16/widzisz-jak-pracuj-niedawno-zrobili-my/chmurnik-v4/weather-preview/learning/catalog.mjs:158) sprawdza zgodność całego stanu z celami przewodnika. Przycisk wykonuje zmianę za ucznia. To użyteczna kontrola wykonania pokazu, nie dowód rozumienia. Końcowy quiz ma czasem nowe dane, ale pojedynczy wybór nie sprawdza uzasadnienia.
- [Scenes.jsx](/Volumes/Kingston-Codex/repos/Documents/Codex/2026-06-16/widzisz-jak-pracuj-niedawno-zrobili-my/chmurnik-v4/weather-preview/learning/Scenes.jsx:85) ujawnia pułap w metryce i `aria-label`; scena oblodzenia ujawnia wynik rysunkiem i tekstem. Samo schowanie instrukcji nie tworzy ukrytej oceny.

Obserwowalne wyniki: uczeń (1) odróżnia najniższą podstawę od pułapu w nowym raporcie, (2) przewiduje skutek zmiany jednej grupy, (3) rozróżnia obecność, brak i nieznajomość warunków pokazanego mechanizmu oblodzenia, (4) uzasadnia decyzję danymi i zasadą oraz wskazuje granicę wniosku.
„Transfer” oznacza tutaj zastosowanie poznanej zasady do niewidzianych danych i innego zadania w tej samej dziedzinie. Nie deklarujemy dalekiego transferu ani kompetencji operacyjnej pilota.

## Sześć zasad: dowody i decyzje projektowe

1. **Wycofuj rozwiązanie, nie tylko instrukcję obsługi.**
   Dowód: [Atkinson, Renkl i Merrill, 2003, s. 774–783](https://mrbartonmaths.com/resourcesnew/8.%20Research/Making%20the%20most%20of%20examples/Fading%20out%20and%20Prompts.pdf), DOI `10.1037/0022-0663.95.4.774`: w dwóch eksperymentach z rachunkiem prawdopodobieństwa wycofywanie kroków połączone z pytaniami o zasadę wspierało bliski i dalszy transfer. Autorzy odróżniają to od wcześniejszych, niestabilnych wyników samego fadingu dla dalekiego transferu; procedura zawierała też feedback, więc nie izoluje działania samego pytania „dlaczego”.
   Projekt: pełny przykład → przykład z brakującym wnioskiem → nowe zadanie bez rozwiązanych kroków. Najpierw usuwać końcowy wniosek, potem podpowiedź, które dane wybrać; nie usuwać dostępnych danych ani wyjaśnień jednostek.

2. **Zbieraj przewidywanie przed pokazaniem skutku.**
   Dowód: [Butler, 2010, eksperymenty 1b, 2 i 3; podsumowanie s. 1128](https://andymatuschak.org/files/papers/Butler%20-%202010%20-%20Repeated%20Testing%20Produces%20Superior%20Transfer%20of%20Learning%20Relative%20to%20Repeated.pdf), DOI `10.1037/a0019902`: po nauce tekstów powtarzane odtwarzanie przewyższało ponowne studiowanie w nowych pytaniach wymagających wnioskowania po tygodniu. Samo przeformułowywanie pytań nie dawało przewagi nad powtarzaniem tych samych.
   Projekt: zapisać decyzję i powód przed animacją, dekodowaniem i feedbackiem. To zastosowanie zasady aktywnego odtwarzania, nie dowód, że dowolne przewidywanie przed suwakiem poprawia transfer. Nowe przypadki służą przede wszystkim uczciwemu sprawdzeniu zastosowania, nie obietnicy korzyści z losowości.

3. **Porównuj przypadki przez wspólną zasadę.**
   Dowód: [Gick i Holyoak, 1983, część II](https://reasoninglab.psych.ucla.edu/wp-content/uploads/sites/273/2021/04/Gick_Holyoak1983_SchemaInduction.pdf), DOI `10.1016/0010-0285(83)90002-6`: porównywanie dwóch analogicznych opowieści sprzyjało wydobyciu schematu; jakość schematu przewidywała późniejszy transfer. Badanie dotyczyło problemów analogicznych, nie meteorologii ani skuteczności generatora zadań.
   Projekt: po dwóch przykładach zapytać „Co pozostało rozstrzygające mimo zmiany liczb?”. W praktyce zestawiać różne dane wymagające tej samej reguły, a także kontrasty obalające skrót „najniższa chmura = pułap” lub „zimniej = więcej lodu”. Taki dobór kontrastów jest naszą decyzją, nie dosłownym protokołem badania.

4. **Wniosek i uzasadnienie to osobne wyniki.**
   Dowód: [IES/WWC, Organizing Instruction and Study…, 2007, zalecenia 2 i 7](https://ies.ed.gov/ncee/wwc/practiceguide/1): naprzemienne przykłady i zadania mają ocenę dowodów „moderate”, pytania wymagające głębokich wyjaśnień „strong”. To oceny rekomendacji przewodnika, nie walidacja naszej rubryki.
   Projekt: pytać „Które dane rozstrzygają i dlaczego?”, nie wymagać eseju. Trafny wybór z błędną regułą nie oznacza opanowania. Oddzielać błąd jednostki, wybór złej przesłanki i nieuprawnione uogólnienie.

5. **Po próbie wyjaśnij zależność, nie tylko pokaż klucz.**
   Dowód: [Butler, Godbole i Marsh, 2013, s. 290–298](https://www.ezyeducation.co.uk/images/New_User_Guide/ButlerGodboleMarsh2013_EdPsych.pdf), DOI `10.1037/a0031026`: w dwóch eksperymentach po nauce tekstów feedback wyjaśniający dawał lepszy wynik w nowych pytaniach inferencyjnych po dwóch dniach niż sama poprawna odpowiedź; wyniki pytań powtórzonych były podobne.
   Projekt: po zatwierdzeniu pokazać odpowiedź ucznia, rozstrzygające dane, mechanizm i jedno ograniczenie. Dodać krótką korektę własnego rozumowania oraz nowy przypadek. Nie przedstawiać wybranego momentu feedbacku ani długości komunikatu jako optimum ustalonego przez badanie.

6. **Oddziel ukończenie od późniejszego zastosowania.**
   Dowód: [IES/WWC, 2007, zalecenia 1 i 5b](https://ies.ed.gov/ncee/wwc/practiceguide/1): rozłożenie nauki w czasie ma ocenę „moderate”, ponowne wydobywanie treści w quizach „strong”; przewodnik zaleca też powrót do treści po dłuższym odroczeniu. Nie wyznacza harmonogramu dla CHMURNIKA.
   Projekt: osobno przechowywać wykonanie pokazu, próbę z pomocą, pierwszą odpowiedź na nowy przypadek i powrót po czasie. Zaproponować nowe zadanie przy kolejnym otwarciu po 2–7 dniach; przedział jest hipotezą projektową. Bez serii dni, XP, nagród za szybkość i „100% kompetencji”.

## Konkretny przebieg: trzy etapy na jedną zasadę

### 1. Zobacz tok rozumowania

- Cel i zakres przed kontrolką. METAR: „Wskażemy, która warstwa wyznacza pułap”; oblodzenie: „Sprawdzamy tylko osadzanie lodu z ciekłych kropli na zimnej powierzchni”. Wyjaśnić FEW/SCT/BKN/OVC, setki stóp nad lotniskiem oraz przechłodzoną wodę. METAR opisuje chwilę obserwacji, nie ustala przyszłego stanu. Brak danych o fazie nie oznacza braku kropli; ilustracja ekspozycji nie mierzy rzeczywistej intensywności oblodzenia.
- Zachować obecne proste pokazy: `SCT020 BKN060` → `BKN020 BKN060`; przy oblodzeniu zimne skrzydło bez kropli → ciekłe krople → suche kryształki. Dokładne wartości i przyciski ustawiające cel są tutaj dopuszczalne, jawnie jako pokaz.
- Przy każdym: dane → zastosowana zasada → skutek → ograniczenie; uczeń własnymi słowami wskazuje, dlaczego zmiana miała znaczenie. Przejście dalej po obejrzeniu i krótkiej odpowiedzi, oznaczenie wyłącznie „Pokaz ukończony”.

### 2. Dokończ z malejącą pomocą

- METAR, przykład częściowo rozwiązany: `FEW015 BKN035 OVC070`. Pokazać znaczenie kodów i przeliczenie podstaw, ale zostawić puste: „Pułap: …; wybieram tę warstwę, bo …”. Dopiero po odpowiedzi odsłonić wniosek. Następnie `SCT025 OVC055`: uczeń sam wybiera grupę i oblicza wynik, bez wyróżnienia właściwej warstwy.
- Oblodzenie: dwie nowe, niezależne próby przy -6°C dla powietrza i skrzydła, tej samej dodatniej ekspozycji, z ciekłymi kroplami albo bez kropli. Najpierw pozostawić widoczny krok „temperatura poniżej zera”, ale ukryć wniosek; następnie przy -13°C i suchych kryształkach usunąć również ten gotowy krok.
- Każda próba: przewidywanie + powód → zatwierdzenie → wynik i feedback. Pomoc na żądanie: pytanie o brakujący krok → przypomnienie zasady → pełne rozwiązanie. Każde użycie zapisać jako pomoc; pełne rozwiązanie kończy próbę jako przykład do nauki, nie zaliczenie.
- Do etapu 3 zaprosić po poprawnym dokończeniu nowego przykładu bez podpowiedzi; przy błędzie zaoferować celowany przykład i kolejny wariant. Nie blokować nauki ani wejścia na próbę na podstawie samooceny tekstu. Dwa przykłady i ten warunek przejścia są decyzjami prototypu.

### 3. Zastosuj samodzielnie

- Osobny `scenarioId`, dane niezależne od `activity.initial` i ostatnich suwaków. Pokaż problem i surowe przesłanki, bez wyróżnień poprawnych grup, rozwiązanej sceny czy gotowej reguły. Pola odpowiedzi puste; brak domyślnego wyboru.
- Uczeń podejmuje decyzję, podaje wymagane wartości/przewidywanie, wskazuje przesłanki i zapisuje 1–2 zdania uzasadnienia. „Nie wiem” jest poprawnym sposobem oddania próby, nie blokadą formularza. Dla wieloczęściowego przypadku zatwierdzić całość przed pierwszym feedbackiem.
- Po zatwierdzeniu zachować pierwszy zapis, odsłonić rubrykę z kluczem i wyjaśnienie. Potem „Przećwicz ten przypadek” albo „Nowy przypadek”. Eksploracja nie zastępuje próby. TAF prowadzić osobnym takim cyklem po METAR, bez mieszania nowej reguły czasu z oceną pułapu.

## Niewidziane przypadki do etapu 3

Poniższe zadania i klucze są autorskimi, syntetycznymi danymi szkoleniowymi, nie archiwalną ani aktualną pogodą. Klucze są dla implementatora; w interfejsie dostępne dopiero po zatwierdzeniu całej próby lub świadomej rezygnacji z samodzielnego rozwiązania.

### METAR M1: dwie różne odpowiedzi na dwa pytania

Raport A: `METAR EPPO 091100Z 23009KT 9999 FEW008 SCT024 BKN047 14/11 Q1016=`
Raport B: `METAR EPWR 091100Z 27007KT 9999 SCT015 BKN032 OVC075 13/10 Q1017=`
Polecenie: „W którym raporcie najniższa podstawa jest niżej, a w którym pułap? Podaj obie wysokości dla A i B oraz wskaż grupy, z których korzystasz. W hipotetycznym wariancie B zmieniono tylko `SCT015` na `SCT009`: przewidź, czy pułap się zmieni. Uzasadnij. Czy te raporty wystarczą, by podać pułap godzinę później?”.
Klucz: A: podstawa 800 ft, pułap 4700 ft; B: 1500 ft, 3200 ft, wszystkie nad danym lotniskiem. Niższa podstawa A, niższy pułap B. Wariant B: podstawa 900 ft, pułap nadal 3200 ft. FEW/SCT nie wyznaczają tu pułapu; rozstrzygają najniższe BKN, nie najwyższe OVC. Raporty obserwacyjne nie ustalają stanu za godzinę.
Nowość: odwrócona kolejność porównania podstaw i pułapów, trzy grupy, zmieniona wysokość nierozstrzygającej warstwy i granica wnioskowania w czasie. Wszystkie reguły muszą być już uczone; nie potrzeba rozpoznawania nowych kodów pogody ani znajomości lotnisk.
Podstawa klucza: [NWS, METAR, opis `BKN022`](https://www.weather.gov/asos/METAR.html) definiuje pułap przez najniższe BKN/OVC; [Met Office, „Cloud”](https://docs.mavis.metoffice.gov.uk/guidance/metar-decode/) podaje pokrycie i setki stóp nad lotniskiem; [AWC, METAR/TAF](https://aviationweather.gov/help/data/) rozróżnia obserwację od prognozy. Zakres M1 nie obejmuje VV, CAVOK ani brakujących wysokości; nie rozszerzać uproszczonej reguły na te przypadki bez nauczania wyjątków.

### Oblodzenie I1: rozstrzygnij mechanizm, nie „bezpieczeństwo”

Każdy wiersz to osobna próba na początkowo czystej powierzchni; temperatura powietrza i skrzydła są tutaj równe i stałe. Ekspozycja jest wyłącznie umownym parametrem ilustracji, nie minutami ani miarą ilości lodu.

| Próba | Temperatura | Co dociera do powierzchni | Ekspozycja |
| --- | --- | --- | --- |
| A | -7°C | Potwierdzone ciekłe krople | 35/100 |
| B | -18°C | Wyłącznie suche kryształki lodu, brak ciekłych kropli | 85/100 |
| C | -4°C | Cząstki chmurowe, fazy nie ustalono | 65/100 |

Polecenie: „Dla każdej próby wybierz: dane wspierają pokazany mechanizm / brak koniecznego warunku / za mało danych. Wskaż przesłanki i wyjaśnij. Jaką jedną informację o C sprawdzisz najpierw? Czy można z tych danych uszeregować rzeczywistą intensywność oblodzenia?”.
Klucz: A wspiera mechanizm kroplowy; B nie zawiera ciekłych kropli, więc samo większe zimno i dłuższa ekspozycja nie uruchamiają tego mechanizmu; C pozostaje nierozstrzygnięte, potrzebna informacja o obecności ciekłej wody. Nie da się ustalić rzeczywistej intensywności z tych pól. Nie wynika stąd brak innych zagrożeń w B ani C.
Nowość: wybór istotnych przesłanek mimo przeciwstawnego porządku temperatury i ekspozycji oraz decyzja o potrzebnej informacji. Nie wymaga odgadywania fazy z temperatury lub nazwy chmury. Dla C nie uruchamiać modelu z domyślnym `dry`.
Podstawa klucza: [NWS, „Icing”: definicja, necessary conditions, factors](https://www.weather.gov/source/zhu/ZHU_Training_Page/icing_stuff/icing/icing.htm) wiąże mechanizm z uderzaniem i zamarzaniem ciekłych cząstek oraz wskazuje m.in. wielkość i koncentrację kropli, prędkość i temperaturę powierzchni. [Hong Kong Observatory, ice-crystal icing](https://www.weather.gov.hk/en/education/aviation-and-marine/aviation/00501-ice-crystal-icing-a-threat-to-aircraft-engine.html) opisuje osobne zagrożenie silnikowe kryształkami. Równość temperatur i czysta powierzchnia są założeniami naszych zadań, nie ogólnym prawem.

## Rubryka i uczciwa ocena offline

Przed próbą pokazać tylko ogólne kryteria: trafność wniosku, przesłanki i związek przyczynowy, granice danych. Poniższe zakotwiczenia w odpowiedziach odsłonić dopiero po próbie. To rubryka projektowa, niewalidowana psychometrycznie.

| Wymiar | 0 | 1 | 2 |
| --- | --- | --- | --- |
| D: decyzja i przewidywanie | Brak poprawnego elementu lub brak odpowiedzi | Część, ale nie wszystkie elementy poprawne: np. trafne porównanie, błąd przeliczenia; albo jedna błędna klasyfikacja I1 | Wszystkie wymagane odczyty, wybory i przewidywania zgodne z kluczem |
| R: powód i przesłanki | Brak, tautologia albo błędna reguła | Trafna przesłanka bez wyjaśnienia związku lub niepełne rozumowanie | Konkretne dane + reguła + odrzucenie konkurencyjnego skrótu: M1 BKN/OVC kontra najniższa chmura; I1 ciekłe krople i zimna powierzchnia kontra samo zimno |
| G: granica wniosku | Nieuprawniona pewność/prognoza/bezpieczeństwo | Ostrożność bez wskazania brakującej informacji | M1: brak podstawy do prognozy za godzinę; I1: brak fazy C i danych do intensywności, bez deklaracji bezpieczeństwa |

- Statyczny React automatycznie sprawdza liczby, jawne wybory i oznaczone surowe przesłanki. Zachować wyniki częściowe, by odróżnić jednostkę od wyboru warstwy. Uzasadnienie pozostaje tekstem, nie jest oceniane regexem, liczbą znaków ani występowaniem słowa „krople”.
- D można ocenić automatycznie; R i sens wypowiedzi o granicach wymagają człowieka. W podglądzie wyświetlić zapis ucznia obok klucza i pozwolić na jawną samoocenę R/G. Brak samooceny = „nieocenione”, nie zero; nie sklejać jej z automatycznym wynikiem w certyfikat.
- Docelowe kryterium przeglądu: D=2, R=2 i G=2 na nowym przypadku bez pomocy; jest to decyzja projektowa, nie próg potwierdzonej kompetencji. W offline komunikat „Odczyty poprawne; uzasadnienie: Twoja samoocena”. Trafne D przy R=0 kieruje do przykładu wyjaśniającego.
- Feedback M1 po błędzie: „Wskazałeś 1500 ft. To podstawa SCT015. Pułap w B wyznacza BKN032: 3200 ft nad lotniskiem. Zmiana SCT nie zmienia tej warstwy”. Poprosić o korektę własnego powodu, nie o ponowne kliknięcie ujawnionej odpowiedzi.

## Nowy scenariusz, pomoc i powtórka

- Początkowo bank ręcznie sprawdzonych przypadków: rozłączne zestawy `worked`, `faded`, `independent`, `delayed`; minimum po trzy niezależne warianty na temat to zakres wdrożenia, nie naukowe minimum. Nie zastępować go losowaniem dowolnych liczb i kolejności przycisków.
- Równoważny retry M1: A `SCT013 BKN038 OVC072`, B `FEW006 SCT026 BKN054`; niższa podstawa B, niższy pułap A. Zmiana B `FEW006` → `FEW009` nie zmienia pułapu 5400 ft. To fragmenty grup chmur, nie pełne depesze. Kolejny typ zadania może pytać o zmianę FEW na BKN przy tej samej wysokości, bez nowych pojęć.
- Równoważny retry I1: A -16°C/suche kryształki/75; B -5°C/ciekłe krople/25; C -9°C/faza nieznana/45. Klucz odpowiednio: brak warunku, mechanizm wsparty, brak danych. Utrzymać jawne założenia z I1. Kolejny wariant może kontrastować krople z powierzchnią +3°C, ale nie dodawać nieuczonego chłodzenia aerodynamicznego.
- Wariant wybierać deterministycznie według tematu, wersji banku i historii użytych identyfikatorów; nie zmieniać go przy rerenderze, resize ani odświeżeniu. Odpowiedzi mają stabilne identyfikatory, nie klucz oparty na pozycji. Dane muszą być zgodne fizycznie i składniowo; nie usuwać danych koniecznych bez jawnej możliwości „za mało danych”.
- „Nowy przypadek” czyści wybory, powód, feedback, widok wyniku i pomoc, ale nie nadpisuje wcześniejszej próby. „Przećwicz ten przypadek” zachowuje dane, lecz zawsze ma status powtórki po ujawnieniu. Po wyczerpaniu banku powiedzieć to wprost; nie nazywać ponownej prezentacji nowym transferem.
- Pomoc lub przejście z aktywnej próby do przewodnika/eksploracji zmienia jej status na `assisted`; ujawnienie klucza na `revealed`. Nigdy nie wraca do `independent` przez reset ekranu. Przerwanie bez odpowiedzi pozostaje przerwaniem. Nową niezależną próbę rozpoczyna dopiero inny niewidziany przypadek.

## Kontrakt implementacyjny i sprawdzenie projektu

- Rozdzielić stan pokazu, eksploracji i próby. Rekord: `activityId`, `scenarioId`, `bankVersion`, niezmienne dane, status, odpowiedzi, tekst powodu, `hintCount`, pierwszy zapis, korekta, `revealedAt`, czas i osobna samoocena. `localStorage` w przestrzeni nazw podglądu, bez ruszania produkcyjnego postępu lekcji; przy braku zapisu jawny tryb tylko tej sesji. Po utracie historii nowość poza sesją jest nieznana; nie deklarować „nigdy wcześniej niewidziane”.
- Przed `submitted`/`revealed` nie montować komponentu wyniku: ani pułapu, lodu, dekodera, komentarza, `aria-label`, tooltipa, podpisu, koloru poprawności, wartości domyślnej, ani historii A/B ujawniającej rozwiązanie. Surowe dane i neutralna grafika są dostępne także czytnikowi ekranu. Przyciski „Zatwierdź”, „Pomoc”, „Nowy przypadek” nie zawierają odpowiedzi.
- Dla M1 użyć gotowych rekordów i kluczy, nie `skyReport`, który zakłada górne BKN060. Nieznanych warunków I1 nie przepuszczać przez helper normalizujący do znanej fazy. Ilustracja po odpowiedzi objaśnia model, nie jest empirycznym dowodem ani źródłem skali ryzyka.
- Wszystkie treści, dane i feedback w lokalnym bundle, bez API/LLM. Skróty źródłowe i założenia dostępne offline, z linkami do oryginałów na czas połączenia. W próbie założenia i neutralna bibliografia pozostają widoczne; otwarcie przypomnienia reguły lub materiału źródłowego liczy się jako pomoc. Klucza w statycznym JS nie da się ochronić przed świadomą inspekcją; wymagamy braku przecieków w zwykłej ścieżce UI, nie zabezpieczenia egzaminacyjnego.
- QA przed wdrożeniem: zgodność kluczy z danymi, puste odpowiedzi, wszystkie błędne ścieżki, ukryte i ujawnione stany DOM/dostępności, zmiana przypadku po feedbacku, restart/odświeżenie, brak powrotu `assisted` do niezależnej próby, bank bez powtórzeń do wyczerpania; ręcznie klawiatura i krótki ekran telefonu. To zalecane testy, nie wykonane sprawdzenia UI.
- Walidacja dydaktyczna: najpierw obserwacja początkujących i kontrola rozumienia poleceń. Następnie porównanie starej i nowej ścieżki przy podobnym czasie pracy, z równoważnymi niewidzianymi przypadkami od razu i po odroczeniu; losowy przydział, jeśli wykonalny. Oceniający uzasadnienia nie zna wariantu ścieżki; część prac oceniają dwie osoby dla kontroli zgodności rubryki.
- Raportować osobno pierwsze D/R/G, korzystanie z pomocy, rezygnacje i wynik odroczony, wraz z liczebnością i niepewnością. Ukończenia przewodnika, poprawki po kluczu i samooceny nie są dowodem skuteczności. Nie reklamować czasu ani wzrostu transferu przed pomiarem rzeczywistej pracy uczniów.
