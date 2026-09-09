# CHMURNIK: mobilna pracownia jednego zadania

Data: 2026-09-09. Zakres: research i specyfikacja UX dla początkujących; bez implementacji, CUA, sterowania przeglądarką, publikacji i commitów.

## Werdykt

Przebudować anatomię ćwiczenia, nie tylko zmniejszyć nagłówki. Pierwszy widok ma pokazywać cel kroku, scenę, istotny odczyt i dostępną kontrolkę. Usunąć piętrzenie wstępu, oczekiwania, instrukcji obsługi i równorzędnych przycisków. Zachować róż, oliwkę, fiolet, Romie/Roobert i filcowe obiekty. Zwięzłe zadanie nie oznacza strony zamkniętej w wysokości ekranu. Gęstość uzyskać przez usunięcie duplikatów i rozdzielenie faz, nie przez drobny tekst.

## Fakty i ograniczenia

- [LearningStudio.jsx:90][studio] układa kolejno breadcrumb, duży wstęp, przełącznik trybu, nagłówek przewodnika, scenę i kontrolki. Dalej dochodzą preset działania, informacja zwrotna, następny/poprzedni krok, kontynuacja i źródła. To rzeczywista kumulacja strukturalna, nie problem samego fontu.
- [learning/style.css:158][learning-css] ustawia mobilne H1 na `clamp(34px, 8vw, 46px)`, H2 przewodnika na 30px, padding nagłówka 23px/20px i scenę z `min-height:260px`, proporcją 1.16. Dla 390px i 320px H1 wynosi 34px, nie 46px. Pojedyncza scena zajmuje już co najmniej 46% wysokości 568px, zanim doliczymy resztę.
- Ta sama CSS ma szczególne układy: kompas 220px z marginesami, panel nazw minimum 340px na telefonie, zdjęcia do 440px. Sam globalny limit `.lab-scene` nie naprawi wszystkich typów ćwiczeń. Mobilne `display:contents`/`grid-row` przenosi `.lab-readout` pod kontrolki wizualnie, nie zmieniając kolejności DOM.
- [main.jsx:536][legacy] zawiera osobny starszy szkielet z wstępem, wyborem doświadczenia, trybami i przewodnikiem. [style.css:1717][legacy-css] już ogranicza jego scenę przez `clamp(190px, 32svh, 250px)` i wyłącza mobilne sticky; landscape ponownie nadaje jej 230px. Te poprawki nie obejmują nowego `.lab-scene`.
- Warto zachować: `visibleControls()` pokazujące jeden parametr przewodnika, obliczaną kompletność kroku, tap-preset, natywny range z etykietą/wartością i przyciskami +/- w [Slider.jsx][slider], pauzę/reduced-motion oraz powrót do lekcji.
- Obejrzałem trzy wskazane lokalne zrzuty katalogu: [mobile-wind-metar.png][cover-mobile], [desktop-tools.png][cover-tools], [desktop-hazards.png][cover-hazards]. Potwierdzają tożsamość wizualną, nie położenie kontrolek w działającym ćwiczeniu.
- Nowy, dostarczony w trakcie researchu [01-metar-before.png][metar-before] (390x700) obejrzałem lokalnie: zaznaczona „Samodzielna próba”, tytuł strony z leadem, wybór trybu i pauza, następnie drugi tytuł „Porównaj, co się zmienia” z instrukcją. Scena zaczyna się dopiero przy dolnej krawędzi kadru; kontrolki są niewidoczne. To potwierdza problem duplikacji również poza przewodnikiem.
- Pomiary przekazane przez wykonawcę głównego: początek kontrolek na y=972 względem viewportu, wysokość workbench 1443px. Oznacza to początek kontrolek 272px poniżej dolnej krawędzi i stanowisko wysokie na około 2,06 viewportu. Nie są to moje pomiary DOM; zrzut nie pozwala samodzielnie ustalić scrollY ani całej wysokości stanowiska.
- Implementacja przebudowy jeszcze nie powstała. Bez uruchamiania UI nie potwierdzam zachowania dotyku, focusu ani kontrastu renderu. Brak danych o częstości problemu i wynikach nauki; poniższa anatomia jest propozycją, nie zweryfikowanym wynikiem.

## Co wynika ze źródeł

Normatywne są kryteria [WCAG 2.2][wcag]; strony Understanding objaśniają je, a APG podaje wzorce implementacji. Apple i Material to zalecenia platformowe, nie dodatkowe kryteria WCAG. Wszystkie niższe budżety pikseli są propozycją projektową.

| Podstawa | Ustalenie źródłowe i granica zastosowania |
| --- | --- |
| [W3C: Reflow, 1.4.10][reflow] | Treść pionowa ma działać przy szerokości 320 CSS px bez utraty informacji/funkcji i konieczności przewijania w dwóch osiach. Wyjątek dla niezbędnych układów 2D nie obejmuje automatycznie całej pracowni. Pionowe przewijanie jest dozwolone. |
| [W3C: Target Size, 2.5.8][targets] | AA: minimum 24 x 24 CSS px, z określonymi wyjątkami, m.in. odstępu. To dolna granica zgodności, nie rekomendowany rozmiar wygodnego przycisku. |
| [Apple: Hit Targets][apple-targets]; [Android/Material: API defaults][material] | Apple zaleca co najmniej 44 x 44 pt; Material 48dp. Dla tego webowego projektu proponuję 48 x 48 CSS px; pt, dp i CSS px nie są jedną normatywną jednostką. |
| [W3C: Dragging Movements, 2.5.7][drag] | Funkcję przeciągania trzeba udostępnić również pojedynczym wskaźnikiem bez przeciągania, poza wyjątkami. Sama obsługa klawiaturą nie zastępuje alternatywy dotykowej. |
| [W3C: Focus Not Obscured, 2.4.11][focus] | AA zabrania całkowitego zasłonięcia fokusowanego elementu przez treść autora. Cel CHMURNIKA jest mocniejszy: cały element i obrys widoczne; żaden dolny overlay nie przecina pracy. |
| [Apple: Layout][apple-layout] | Grupowanie związanych elementów, dostępność informacji podstawowej, stopniowe odsłanianie szczegółów i dostosowanie do safe areas/orientacji. Nie wynika stąd nakaz kopiowania pływających systemowych pasków do strony WWW. |
| [IES/WWC, 2007][learning-evidence] | Synteza badań ocenia łączenie grafiki z opisem oraz przeplatanie przykładów i samodzielnych problemów jako umiarkowanie poparte dowodami; pytania wstępne mają słabszą podstawę. Nie jest to badanie mobilnego CHMURNIKA ani dowód na konkretną wysokość sceny. |

## Siedem priorytetów

1. **P0: Oddzielić katalog od stanowiska pracy.** Duże pytania i okładki zostają w katalogu. W ćwiczeniu: jedna kompaktowa belka z powrotem, wordmarkiem i pauzą, potem tylko aktualny krok. Pełny tytuł/opis pod „O ćwiczeniu”; nie wycinać celu ani koniecznej instrukcji. W samodzielnej próbie zamiast obu bloków ze zrzutu: np. „Zmień podstawę chmur” + „Obserwuj zapis w METAR”, gdy ten parametr jest aktywny. Uzasadnienie: [Apple Layout][apple-layout].
2. **P0: Połączyć scenę, odczyt i działanie.** Celować w 204px sceny przy 390x700 i 160px przy 320x568; zaraz pod nią odczyt bieżącego parametru i jedna kontrolka. Nie przenosić całej interpretacji pod długi panel interakcji. To rekomendacja wynikająca z problemu użytkownika, wsparta zasadą grupowania, nie norma „wszystko na ekranie”.
3. **P0: Rozdzielić stany zamiast dokładać karty.** Jedna dominująca akcja na stan. Guide nie potrzebuje dodatkowej bramki „Zacznij”. Predict zastępuje instrukcję pytaniem, a feedback zastępuje obszar zadania wyjaśnieniem po świadomym odsłonięciu. Nie pokazywać jednocześnie rozbudowanej oczekiwanej odpowiedzi, wyniku i ponowionej instrukcji obsługi.
4. **P0: Zachować przewijanie i stabilny focus.** Jeden pionowo przewijany dokument, CTA w normalnym układzie bez dolnego overlaya. Brak `height:100vh/100dvh` z ukrytą resztą, automatycznego snapowania i wewnętrznych przewijanych kart. Usunąć clipping z kontenerów zawierających tekst/focus; przycinanie dotyczy wyłącznie dekoracyjnej warstwy grafiki. [Reflow][reflow], [Focus][focus].
5. **P1: Zapewnić pełną obsługę tapem.** Zachować +/- i podpisane wartości range; trafienia 48px oraz około 8px odstępu jako cel projektu. Preset celu może być pomocniczą opcją, ale nie jedyną alternatywą dla całego zakresu suwaka. Nie mnożyć trzech równorzędnych sposobów wykonania tej samej zmiany. [Dragging][drag], [Material][material].
6. **P1: Odsłaniać szczegóły bez ukrywania podstaw.** „Więcej” rozwija w miejscu: tryby, „O ćwiczeniu”, źródła i pełne narzędzie. „Jak czytać wynik?” rozwija wyjaśnienie, nie otwiera bottom sheet. Pauza pozostaje bezpośrednio dostępna podczas ruchu; krótka etykieta „Schemat edukacyjny” i istotne jednostki są zawsze widoczne. [Apple Layout][apple-layout], [W3C Disclosure][disclosure].
7. **P1: Zmniejszyć opakowanie, zachować charakter.** Pozostawić `#ffe1eb`, `#6d6435`, `#7442d9`, `#fff7f1`, filc i istniejące fonty; jeden spokojny panel zamiast wielokrotnie zagnieżdżonych kart. Romie w tytule kroku, Roobert w instrukcji i kontrolkach. To decyzja marki; kontrast faktycznie użytych par/stadiów wymaga pomiaru, nie oceny „wygląda czytelnie”.

## Anatomia: 390x700 i 320x568

Wymiary oznaczają viewport strony w CSS px, nie fizyczny ekran. Poniżej bazowy guide/action: 100% tekstu, krótkie polskie etykiety, brak dodatkowych insetów. Wiersze zawierają swoje odstępy; współrzędne są budżetem do sprawdzenia, nie sztywnymi wysokościami tekstu.

| Element w kolejności DOM | 390x700: y / wysokość | 320x568: y / wysokość | Zawartość |
| --- | --- | --- | --- |
| Belka | 0-56 / 56 | 0-48 / 48 | Powrót 48px, wordmark ok. 112px, pauza 48px podczas ruchu; bez drugiego rzędu promocyjnego. |
| Krok | 56-132 / 76 | 48-120 / 72 | „Krok 1/3 · Wiatr”, np. „Ustaw wiatr zachodni”, „Obserwuj zwrot strzałki”; bez osobnej karty oczekiwań. |
| Scena | 132-336 / 204 | 120-280 / 160 | Jedna istotna reprezentacja; nie dekoracyjna okładka udająca stan symulacji. |
| Odczyt | 336-376 / 40 | 280-320 / 40 | Wartość z jednostką i krótki status; interpretacja odpowiedzi ukryta w predict. |
| Kontrolka | 376-492 / 116 | 320-424 / 104 | Etykieta, wartość, range z +/- albo krótki wybór; bez kolejnego dużego obramowania. |
| Główna akcja | 492-552 / 60 | 424-480 / 56 | Przycisk minimum 48px + odstęp; „Zobacz wniosek” lub stanowe CTA. |
| Drugorzędne | 552-612 / 60 | 480-528 / 48 | „Wstecz” i „Więcej” obok siebie; rozwinięcie zwiększa wysokość dokumentu. |
| Rezerwa | 612-700 / 88 | 528-568 / 40 | Miejsce na zawijanie, insets, krótki status; nie obowiązkowy pusty blok ani footer. |

- Budżet proporcji: belka + instrukcja 19%/21%; scena 29%/28%; odczyt + kontrolka + CTA 31%/35%; pozostałe 21%/16%. To punkt startowy, nie algorytm ściskania zawartości.
- Marginesy boczne: 16px przy 390 (358px treści), 12px przy 320 (296px treści). Nie odejmować kolejnych dwóch warstw paddingu 20px. Główne teksty 16px/24px; tytuł kroku Romie 22px/26px lub 20px/24px; metadane 14px/20px. Rozmiary zapisać skalowalnie, np. w rem; nie uzyskiwać wyniku przez zamianę instrukcji na tekst 11-13px.
- Krótki tekst jest redagowany, nie ukrywany przez line-clamp. Długi tytuł, odpowiedź albo jednostka powiększa wiersz i dokument; nie zmniejszać fontu, by odzyskać wysokość.
- Warunek bazowy QA: przy obu viewportach kontrolka oraz całe CTA mieszczą się przed dolną krawędzią, a istotny stan sceny pozostaje widoczny. To nie dotyczy wymuszonego większego tekstu, rozwinięć ani scen wymagających większej reprezentacji.

## Stany i odsłanianie

| Stan | Co pozostaje / co się zmienia | Akcja i warunek przejścia |
| --- | --- | --- |
| Guide | Krótka instrukcja i wskazanie obserwacji; scena oraz jedna kontrolka są od razu gotowe. Nie jest to dodatkowy ekran wprowadzający. | Pierwsza zmiana rozpoczyna action bez przeskoku układu. Domyślny przewodnik nadal uczy, nie staje się obowiązkowym quizem. |
| Predict | Osobne „Sprawdź się”: neutralny stan początkowy, pytanie, 2-3 odpowiedzi. Brak oczekiwanego wyniku, rozwiązania w alt/aria, opisie ani akcji preset. | Jawne „Sprawdź przewidywanie” po wyborze. Zaznaczenie odpowiedzi samo nie uruchamia sceny ani nie przenosi focusu. |
| Action | Scena, bezpośredni odczyt, jeden parametr. W przewodniku można podpowiedzieć gdzie patrzeć; w sprawdzianie nie zdradzać wniosku. | „Zobacz wniosek” dostępne po spełnieniu warunku modelu, nie po dowolnym tapie. Brak automatycznego przejścia po osiągnięciu progu. |
| Feedback | Zachować stan sceny i odczyt; zamiast kontrolki: 1-2 zdania „co się zmieniło i dlaczego”, w sprawdzianie także odniesienie do przewidywania. Dłuższe wyjaśnienie rozwijane. | „Następny krok” / końcowe sprawdzenie; „Zmień ustawienie” wraca do action. Wniosek nie udaje oceny bezpieczeństwa. |

- W predict można przesunąć budżet z dekoracyjnej części sceny: 390px -> scena 112px, odpowiedzi 208px; 320px -> scena 96px, odpowiedzi 168px. Przy trzech krótkich odpowiedziach 48px i dwóch przerwach 8px potrzeba minimum 160px. Jeśli scena jest materiałem niezbędnym do odpowiedzi lub tekst się zawija, zachować czytelność i pozwolić przewijać.
- Feedback wykorzystuje 116/104px po kontrolce jako orientacyjny budżet, nigdy limit wysokości. Wyjaśnienie pojawia się dopiero po jawnej akcji, więc kontrolka nie znika podczas przeciągania ani gdy ma focus.
- Słownik stanów jest propozycją UX: obecne `main.jsx mode="guided"` oznacza sprawdzian (`predict/experiment/explain`), a `tutorial` przewodnik. W `LearningStudio` `guide` i `done` mają inny kontrakt. Nie łączyć ich mechanicznie ani nie zmieniać modeli/warunków zaliczenia przy porządkowaniu layoutu.
- Swobodna próba pozostaje osobnym wyborem; domyślnie jeden rozwinięty parametr i lista pozostałych z bieżącymi wartościami. Nie resetować postępu przewodnika przy samym przełączeniu trybu; „Od początku” musi być osobną, nazwaną akcją.
- Źródła i ograniczenia mogą być zwinięte, lecz krótka informacja o charakterze dydaktycznym oraz autor/źródło prawdziwej fotografii pozostają dostępne przy materiale. Filcowe okładki nie są dowodem obserwacyjnym.

## Scroll, focus i dotyk

- Kolejność DOM ma oddawać sens: krok -> scena -> kluczowy odczyt -> kontrolka -> CTA -> szczegóły. Nie naprawiać jej samym CSS `order/grid-row`, szczególnie gdy scena lub odczyt zawiera linki/kontrolki. [W3C Focus Order][focus-order].
- Zmiana suwaka, +/- i wybór opcji zachowują focus i pozycję przewinięcia. Sukces ogłaszać raz jako krótki `role="status"`, nie czytać całej sceny przy każdej wartości. Wartość range ma etykietę, jednostkę i dostępny odczyt. [W3C Status Messages][status].
- Po jawnym „Dalej”/odsłonięciu nowej fazy: focus na jej nagłówek `tabIndex=-1` z `preventScroll`; przewinąć tylko jeśli niewidoczny, najkrótszym koniecznym ruchem. Nie wracać zawsze do hero, `#root` ani początku workbench. Zachować obrys focusu.
- Rozwinięcie szczegółów zachowuje focus na przycisku/summary; obsługuje Enter/Space i komunikuje stan. Przed programowym zwinięciem sekcji zawierającej focus wrócić do jej wyzwalacza. Nie wymagać hoveru. [W3C Disclosure][disclosure].
- Po powrocie z lekcji/ćwiczenia odtworzyć pozycję i postęp odpowiedniego miejsca; zmiana kroku nie powinna dopisywać kolejnych ekranów do dokumentu. Nie stosować ogólnego `scrollTo(0,0)` do każdego hashchange bez rozróżnienia nawigacji i powrotu.
- `env(safe-area-inset-*)` uwzględnić w paddingu krawędzi, nie jako stałe „34px dla iPhone'a”. Nie doliczać insetu podwójnie w kontenerze i CTA. Rezerwa może je przyjąć; po jej wyczerpaniu dokument rośnie. Inset nie zastępuje testu pasków przeglądarki. [WebKit: safe areas][webkit].
- Native range i +/- mają obsłużyć także skrajne wartości; dodatkowy preset nie może przeciekać odpowiedzi w predict. Draggable-looking obiekt albo reaguje, albo jednoznacznie wskazuje podpisaną kontrolkę. Pionowy gest poza uchwytem przewija stronę; nie blokować dotyku na całej scenie.

## Landscape i większy tekst

- Landscape 700x390: po belce i krótkim celu proponuję dwa sąsiednie obszary, scena około 45%, działanie 55%, gap 16px. Bez sticky i stałego minimum 230px. Kolumny tylko gdy każda zachowuje czytelność; dokument nadal przewijany.
- Landscape 568x320: domyślnie jedna kolumna; scena orientacyjnie 120-144px tylko jeśli zachowuje sens, inaczej większa i zwykłe przewijanie. Nie wymagać obrotu urządzenia; przewodnik nie jest wyjątkiem „orientacja niezbędna”. [W3C Orientation][orientation].
- Przy 200% tekstu porzucić cel „CTA w pierwszym ekranie”: automatyczne wysokości, jedna kolumna, pionowe odpowiedzi, wartości pod etykietą, zawijane przyciski. Nie skalować całej strony transformem ani wyłączać zoomu. [W3C Resize Text][resize].
- Przy zmianach odstępów tekstu nic nie może znikać lub nachodzić na sąsiadów. Szczególnie sprawdzić legendy, tekst w SVG i absolutnie pozycjonowane podpisy scen. [W3C Text Spacing][spacing].
- Sceny potrzebują adaptacji semantycznej: wiatr z jedną/dwiema czytelnymi warstwami bez dwóch wysokich kompasów; sondaż z bieżącym poziomem przed pełnym profilem; METAR z istotną grupą obok kontrolki; zdjęcia bez obcięcia cech diagnostycznych. Pełny wykres/powiększenie jako jawny widok, nie pomniejszony do nieczytelności obraz.

## QA dla wykonawcy

- [ ] Dla 390x700 i 320x568: wejście z katalogu i lekcji, pierwszy/środkowy/ostatni krok, predict, action, poprawny/błędny feedback, samodzielna próba. Zrzuty viewportu i pełnej strony; zapisać prostokąty sceny, kontrolki i CTA, nie tylko brak poziomego overflow.
- [ ] Przy standardowym tekście bazowe krótkie zadanie spełnia budżet; użytkownik widzi co zmienić i gdzie obserwować wynik bez szukania kontrolek pod wstępem. Dłuższa treść ma ciąg dalszy, nie clipping. [Reflow][reflow].
- [ ] Faktyczny Safari/iPhone i Chrome/Android: paski otwarte/zamknięte, oba landscape, safe areas i ewentualna klawiatura ekranowa. Emulacja viewportu nie jest testem fizycznego dotyku.
- [ ] Przejść całe zadanie wyłącznie tapem, potem klawiaturą: +/- do obu końców zakresu, preset, wybory, pauza, poprzedni/dalej. Rozmiary trafień mierzyć, nie wnioskować z rozmiaru ikony. [Dragging][drag], [Targets][targets].
- [ ] Tab/Shift+Tab i czytnik ekranu: logiczna kolejność, widoczny focus, dostępne wartości, jedno ogłoszenie wyniku; brak skoku na suwaku, utraty focusu po odsłonięciu i pułapki w szczegółach. [Focus Order][focus-order], [Status][status].
- [ ] Odpowiedź ukryta również w DOM dostępności, alt, aria-label, podpisach i presetach przed próbą; po restarcie nie pozostają odsłonięte objaśnienia. Zmiana parametru nie zalicza kroku bez warunku modelu.
- [ ] Tekst 200%; osobno reflow przy 1280px i zoomie 400% (= 320 CSS px); osobno line-height 1.5, odstęp akapitów 2em, liter .12em i słów .16em. Pełna funkcjonalność bez poziomego przewijania zwykłej treści. [Resize][resize], [Reflow][reflow], [Spacing][spacing].
- [ ] Kontrast: zwykły tekst 4.5:1, duży tekst 3:1, wymagane wskaźniki kontrolek 3:1; stan nie tylko kolorem. Zmierzyć także tekst na zdjęciach, focus i zaznaczenia. [WCAG 1.4.1/1.4.3/1.4.11][wcag].
- [ ] Pauza/reduced-motion: wynik zrozumiały bez ruchu, brak automatycznego przewijania i przejścia po animacji; ilustracje nie przesłaniają trafień ani focusu. Zachowane granice fizyczne modelu.
- [ ] Powrót do źródłowej lekcji zachowuje rozdział; poprzedni krok/próba odtwarza właściwe ustawienia. Brak regresji zapisanych prób, nieplanowanego resetu i zmian produkcji/native.

Kryterium decyzji: wdrażać najpierw P0 we wspólnej anatomii obu silników ćwiczeń, następnie adaptacje scen i P1. Odbiór po pełnym cyklu „wiem co zrobić -> zmieniam -> widzę skutek -> rozumiem -> idę dalej”, nie po samym atrakcyjnym pierwszym zrzucie. Zalecenia nie stanowią potwierdzenia zgodności WCAG ani udowodnionej poprawy skuteczności nauki.

[studio]: /Volumes/Kingston-Codex/repos/Documents/Codex/2026-06-16/widzisz-jak-pracuj-niedawno-zrobili-my/chmurnik-v4/weather-preview/learning/LearningStudio.jsx:90
[learning-css]: /Volumes/Kingston-Codex/repos/Documents/Codex/2026-06-16/widzisz-jak-pracuj-niedawno-zrobili-my/chmurnik-v4/weather-preview/learning/style.css:158
[legacy]: /Volumes/Kingston-Codex/repos/Documents/Codex/2026-06-16/widzisz-jak-pracuj-niedawno-zrobili-my/chmurnik-v4/weather-preview/main.jsx:536
[legacy-css]: /Volumes/Kingston-Codex/repos/Documents/Codex/2026-06-16/widzisz-jak-pracuj-niedawno-zrobili-my/chmurnik-v4/weather-preview/style.css:1717
[slider]: /Volumes/Kingston-Codex/repos/Documents/Codex/2026-06-16/widzisz-jak-pracuj-niedawno-zrobili-my/chmurnik-v4/weather-preview/Slider.jsx
[cover-mobile]: /Volumes/Kingston-Codex/repos/Documents/Codex/2026-06-16/widzisz-jak-pracuj-niedawno-zrobili-my/chmurnik-v4/design/learning-covers-20260909/mobile-wind-metar.png
[cover-tools]: /Volumes/Kingston-Codex/repos/Documents/Codex/2026-06-16/widzisz-jak-pracuj-niedawno-zrobili-my/chmurnik-v4/design/learning-covers-20260909/desktop-tools.png
[cover-hazards]: /Volumes/Kingston-Codex/repos/Documents/Codex/2026-06-16/widzisz-jak-pracuj-niedawno-zrobili-my/chmurnik-v4/design/learning-covers-20260909/desktop-hazards.png
[metar-before]: /Volumes/Kingston-Codex/repos/Documents/Codex/2026-06-16/widzisz-jak-pracuj-niedawno-zrobili-my/chmurnik-v4/design/learning-transfer-20260909/01-metar-before.png
[wcag]: https://www.w3.org/TR/WCAG22/
[reflow]: https://www.w3.org/WAI/WCAG22/Understanding/reflow.html
[targets]: https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html
[drag]: https://www.w3.org/WAI/WCAG22/Understanding/dragging-movements.html
[focus]: https://www.w3.org/WAI/WCAG22/Understanding/focus-not-obscured-minimum.html
[focus-order]: https://www.w3.org/WAI/WCAG22/Understanding/focus-order.html
[status]: https://www.w3.org/WAI/WCAG22/Understanding/status-messages.html
[disclosure]: https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/
[orientation]: https://www.w3.org/WAI/WCAG22/Understanding/orientation.html
[resize]: https://www.w3.org/WAI/WCAG22/Understanding/resize-text.html
[spacing]: https://www.w3.org/WAI/WCAG22/Understanding/text-spacing.html
[apple-layout]: https://developer.apple.com/design/human-interface-guidelines/layout?changes=_____7&language=objc
[apple-targets]: https://developer.apple.com/design/tips/
[material]: https://developer.android.com/develop/ui/compose/accessibility/api-defaults
[webkit]: https://webkit.org/blog/7929/designing-websites-for-iphone-x/
[learning-evidence]: https://ies.ed.gov/ncee/wwc/practiceguide/1
