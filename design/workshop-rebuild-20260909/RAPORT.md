# Pracownie CHMURNIKA: poprawki po audycie

Data: 9 września 2026. Zakres: podgląd GitHub Pages. Bez publikacji na
chmurnik.cloud, bez buildów Apple i bez zmiany modelu rozpoznawania zdjęć.

## Co zmieniono

**Burza jest teraz odrębną pracownią o podtrzymywaniu unoszenia**, a nie trzema
przełącznikami warunków i ręcznym wybieraniem obrazka stadium burzy.

1. Użytkownik unosi porcję powietrza bezpośrednio na scenie. Dostępne są też
   przyciski i klawiatura. Widać wysokość, kondensację oraz obie temperatury.
2. Przed puszczeniem zapisuje przewidywany kierunek. Samo osiągnięcie wysokości
   nie zalicza ćwiczenia i nie pokazuje wyniku.
3. Widzi początkową reakcję, odczytuje dowód i dostaje wyjaśnienie. Błędne
   przewidywanie pozostaje zapisane; nie jest zamieniane na sukces.
4. Próby A/B zmieniają tylko wysokość uniesienia, A/C profil otoczenia.
   Zapisane odczyty pozwalają porównać wyniki, nie tylko pamiętać instrukcję.
5. Dwa nowe przypadki mają inne warunki i przeciwne wyniki. Pomoc przy
   przewidywaniu i przy późniejszym uzasadnieniu jest zapisywana osobno.

To uproszczone porównanie termiczne przy tym samym ciśnieniu. Nie modelujemy
całej burzy, prędkości, rzeczywistego toru porcji, CAPE/CIN ani bezpieczeństwa
lotu. Krótkie przesunięcie i widoczność kropelek są ilustracją. Źródło mechanizmu:
[NWS: składniki konwekcji i hamowanie](https://www.weather.gov/spotterguide/ingredients).
Zachowano istniejące filcowe zasoby, Romie/Roobert oraz róż, oliwkę i fiolet.
Nie wygenerowano w tej poprawce nowego pakietu ilustracji.

**Poprawki pozostałych ćwiczeń:**

- Wysokość: kreska ma dokładną współrzędną niezależną od podpisu. Rozróżniamy
  poziom nad ziemią, na powierzchni i pod terenem. Usunięto nieuzasadnioną chmurę.
- Front: porównywane temperatury i wspólna wysokość są stale widoczne.
- METAR: raport, najniższa podstawa i pułap nie są schowane w objaśnieniu.
  Powyżej OVC pokazujemy brak danych, a nie pewność bezchmurnego nieba.
- Sondaż: po wprowadzeniu wiatru jego kierunek i prędkość są przy wybranym poziomie.
- Oblodzenie: widoczne warunki i informacja, że zmiana rozpoczyna osobną próbę,
  a zniknięcie osadu nie jest symulacją topnienia.
- Wspólne zadania: poprawione dystraktory i kolejność opcji. Decyzje blokują się
  przed odsłonięciem zasad; powrót służy podglądowi, a zmiana wymaga powtórki.
  Zachowane identyfikatory odpowiedzi i stare wyniki nie udają nowego pomiaru.

## Weryfikacja

Główny agent wykonał cały nowy przebieg A/B/C oraz dwa przypadki końcowe,
w tym celowo błędne przewidywanie, pomoc dopiero przy uzasadnieniu, zapis
wyników, klawiaturę i przeciąganie. Sprawdzono układy 320×700, 390×700
i 1365×900 w przeglądarce aplikacji Codex.

Gotowy build otwiera wszystkie 14 tras przy 390×700 bez brakujących obrazów
i poziomego przepełnienia. Są to kontrole tras, nie 14 pełnych nowych audytów
dydaktycznych. Oddzielnie wykonano czynności w pięciu naprawionych scenach:
wysokości 1800/1500 m, front 1540 m, OVC020, wiatr w sondażu, krople i kryształki.
Pomiar geometrii potwierdza linię poniżej terenu oraz dokładną równość poziomów.
Przetestowano też blokadę odpowiedzi po odsłonięciu zasad w zadaniu o oblodzeniu.

Rozwojowy serwer Vite nie kopiuje zdjęć i logo przygotowywanych przy buildzie.
Dlatego pierwsze kontrole tego serwera wykazały brak tych zasobów, a kontrola
gotowego builda została wykonana ponownie. Wyniki są zapisane osobno.
Wczesne nieudane buildy/testy podczas współbieżnych edycji nie są zaliczeniami.
Końcowe wyniki testów i wdrożenia są dopisywane po ich faktycznym zakończeniu.

Końcowo lokalnie: **715/715 testów**, zero pominiętych; audyt dziewięciu lekcji,
build produkcyjny, build Pages i osobny build pracowni zakończone poprawnie.
Sprawdzono także pominięcie animacji w gotowym buildzie oraz opuszczenie zadania
i powrót: pomoc jest oznaczona, a pierwotna błędna decyzja pozostaje zablokowana.
Końcowy pakiet podglądu: `index-I8vpNQpc.js`, `index-B3ltBLlx.css`.
Testy nie zmierzyły skuteczności nauczania.

Oddzielne drzewo publikacyjne: **710/710 testów** oraz poprawny build pracowni,
z identycznymi nazwami obu pakietów. Różnica pięciu testów wynika z pozostawienia
testów natywnego ekranu głównego i prywatnego panelu ocen w drzewie rozwojowym;
nie usunięto ich w ramach tej poprawki. Kod: `530a421` lokalnie, `65b23c1` w
izolowanym drzewie publikacyjnym.

## Publikacja

[Otwórz nową Burzę](https://jakiesluchawki.github.io/chmurnik/pogoda-preview/?from=zagrozenia#burza).
Wdrożenie `65b23c1` zakończyło się powodzeniem w
[przebiegu 34324140302](https://github.com/jakiesluchawki/chmurnik/actions/runs/34324140302).
Końcowa korekta podpisu odsyłacza z lekcji to `110507b` (lokalnie `72724ee`);
[przebieg 34324534917](https://github.com/jakiesluchawki/chmurnik/actions/runs/34324534917)
również zakończył się powodzeniem. Ponowne lokalne testy: 715/715.

Na publicznej stronie przy 390×700 sprawdzono uniesienie na 1500 m, blokadę
puszczenia przed przewidywaniem, błędną hipotezę „zacznie się unosić”, faktyczny
wynik „zacznie opadać”, wybór dowodu i odblokowanie następnego doświadczenia.
Temperatury przy puszczeniu: 14,2°C i 18,8°C. Brak uszkodzonych obrazów,
poziomego przepełnienia i nowych błędów konsoli z publicznego adresu.
Przejście do lekcji i powrót przez nowy odsyłacz działa. Nazwy zasobów pracowni
zgadzają się z lokalnym buildem wskazanym wyżej.

Nie publikowano na CyberFolks ani do Apple. HTML chmurnik.cloud jest identyczny
przed publikacją i po niej: SHA256
`4c44955a6c159492fb67de3bbaeef204242000aecd8dcd430877c0d3511bfd57`.
To porównanie HTML, nie audyt każdego pliku na serwerze. Lokalny serwer testowy
został zatrzymany, a testowy rozmiar okna przeglądarki przywrócony.

## Uczestnicy

**3 agentów łącznie:**

- Główny agent: nowa Burza, integracja, testy przeglądarkowe, raport i publikacja.
- Bernoulli: geometria i dostęp do danych w pięciu scenach; niezależny przegląd
  nowego modelu i przebiegu Burzy. Wykrył dwie poprawione usterki animacji/pomocy.
- Kierkegaard: jakość pytań i dystraktorów, blokowanie decyzji, historia odpowiedzi
  i regresje wspólnego oceniania.

## Czego ten etap nie oznacza

Nie przebudowano wszystkich 14 ćwiczeń w nowym standardzie. Turbulencja i sondaż
nadal wymagają głębszej zmiany interakcji, a pozostałe pracownie pracy dobranej
do ich tematu. Nowa Burza jest pierwszym pełnym wzorcem do oceny przez właściciela.
Nie przeprowadzono testu na fizycznym Samsungu/iPhonie, formalnego audytu WCAG
ani badania, czy użytkownicy rzeczywiście lepiej rozumieją meteorologię.
Testy renderowania i poprawności obliczeń nie zastępują tych ocen.
