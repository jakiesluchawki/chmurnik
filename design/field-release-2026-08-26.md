# CHMURNIK: Własne Niebo I Praktyka

## Zakres

- **Dziś / Moje niebo / Atlas** to nowa nawigacja na iOS. WWW zachowuje pięć
  dotychczasowych działów. Pełne lekcje i dawne pracownie nadal są dostępne.
- **Obserwuj niebo** prowadzi do istniejącego aparatu. Po analizie jeden
  przycisk zapisuje cały kadr, czas, wersję modelu i jego niepewną hipotezę.
  Opcjonalna ramka pozwala analizować fragment bez przycinania zapisywanego kadru.
- **Moje niebo** to siatka własnych zdjęć, ulubione, filtr daty i rodzaju,
  porównanie dwóch obserwacji i dziesięć rodzajów do samodzielnego potwierdzenia.
  Wskazówka modelu nie wypełnia kolekcji jako potwierdzone rozpoznanie.
- **Pocztówka** pokazuje podgląd przed udostępnieniem. Nie zawiera miejsca,
  prywatnych notatek ani źródłowych danych EXIF. Pełna kopia zapasowa jest
  osobną, świadomą czynnością i obejmuje własne notatki oraz wpisane miejsce.
- **METAR** odczytuje jeden wklejony raport i wyjaśnia jego grupy. Obsługuje
  m.in. VRB, porywy, CAVOK, widzialność w milach, nieznaną wysokość VV,
  temperaturę i ciśnienie. Dane brakujące i nieobsługiwane są jawne. Raport
  nie jest pobierany na żywo; aplikacja nie zgaduje jego miesiąca ani aktualności.
- **Wiatr** ma tryb pokładu oraz drogi startowej: interaktywne wektory,
  wiatr pozorny, składową czołową/boczną, wspólny kierunek północy i opis założeń.
- **Windy i mapy** uczy zmiany poziomu, godziny i modelu na jawnie syntetycznych
  danych oraz prowadzi do rzeczywistego Windy i pełnego dekodera map.
- Każda pracownia ma **cztery scenariusze**, wyjaśnienie odpowiedzi i powtórkę
  tylko tych, które wymagały poprawy. Postęp zostaje lokalnie.

## Co Pozostało Bez Zmian

Prawdziwe fotografie chmur i ich atrybucja, Romie/Roobert, róż, oliwka,
fiolet i filcowe objaśnienia. Nie dodano mikrofonu, śledzenia lokalizacji,
transmisji zdjęć do AI ani płatnych usług. Nie trenowano nowych wag modelu.
Pracownie nie zastępują odprawy lotniczej, prognozy morskiej ani decyzji pilota
lub prowadzącego jacht.

## Weryfikacja

- 131/131 testów Node, w tym migracja, błędy zapisu, limity, prywatność,
  dekoder METAR i obliczenia wektorów.
- Testy rzeczywistego kodu `ObservationVaultStore.swift`: atomowe zapisy,
  rollback, zachowanie zdjęcia przy edycji, błędny indeks, kopie i usuwanie.
- Dziewięć pełnych lekcji spełnia kontrakt jakości; 57 odnośników źródłowych
  sprawdzono w aktualnej sesji.
- Przejścia przeglądarkowe przy szerokości 320, 390 i 1440 px: kolekcja,
  zdjęcie, edycja, pocztówka, eksport, usunięcie i przywrócenie, pracownie,
  powtórki oraz dotychczasowe trasy. Zbudowane warianty `/` i `/chmurnik/`
  przeszły test z produkcyjnymi nagłówkami bezpieczeństwa, bez naruszeń CSP.
- Dwa kolejne cykle zdjęcie kontrolne -> fragment -> zapis -> ponowne
  otwarcie -> usunięcie przeszły w izolowanym środowisku QA. Ten test nie
  uruchamia fizycznego aparatu i nie mierzy jakości modelu.
- Pełna kompilacja iOS Simulator oraz podpisane archiwum urządzeniowe
  `1.0 (20260826154430)`. Podpis archiwum zweryfikowany przez system.

Mac użytkownika pozostawał zablokowany. Testy przeglądarkowe używały osobnego
profilu headless, bez prywatnych kart i sesji użytkownika. Do podpisu użyto
istniejącego wydzielonego pęku kluczy; nie odblokowano pulpitu ani pęku logowania.

## Granica Bety

Apple przyjęło `1.0 (20260826154430)`: `VALID`, wewnętrznie
`IN_BETA_TESTING`. Build jest przypisany do istniejącej grupy wewnętrznej;
obecność konta właściciela potwierdzono przez API. Opis testów zapisano dla
języków `pl` i `en-US`. Grupa zewnętrzna nie została zmieniona.

Nie wykonano jeszcze dla tego wydania testu fizycznego aparatu iPhone'a,
zmian uprawnień, powrotu z tła, rzeczywistego braku miejsca, VoiceOver,
dużego tekstu ani czytelności w słońcu. Pozostają otwartą bramką zadania 0032.
Nie należy oznaczać ich jako zaliczone na podstawie samej kompilacji.
Najpierw wewnętrzny TestFlight, dopiero po sprawdzeniu telefonu promocja
do zewnętrznej grupy testerów. Poprzedni działający build pozostaje dostępny.

Przed instalacją: wykonać kopię dotychczasowego dziennika. Migracja zachowuje
stary lokalny dziennik jako kopię ratunkową. Nowe zdjęcia trafiają na iOS do
plików aplikacji, a na WWW do IndexedDB; nie rosną w `localStorage`.
Systemowa kopia iPhone'a może obejmować pliki kolekcji.

## WWW

Paczka: `release/chmurnik-cyberfolks-20260826-154430.zip`.
Archiwum ZIP sprawdzone bez błędów; SHA-256:
`a46d0e3a83cdbcd21311f8843a7752a5aba832c3b3121ce140027a9c9c8620e9`.
Wgrywać i rozpakowywać wyłącznie w `domains/chmurnik.cloud/public_html`.
Nie zmieniać DNS ani katalogu `zgrywastudio.com`. Stary ZIP pozostawiono
lokalnie jako poprzednie wydanie. Samo przygotowanie paczki nie oznacza,
że pliki zostały przesłane do Cyber_Folksa.

## Zrzuty

- [Dziś](qa/2026-08-26-field-companion/01-home-mobile-viewport.png)
- [Moje niebo](qa/2026-08-26-field-companion/03-collection-mobile-viewport.png)
- [METAR](qa/2026-08-26-field-companion/04-metar-mobile-viewport.png)
- [Wiatr](qa/2026-08-26-field-companion/05-wind-sailing-mobile-viewport.png)
- [Mapy](qa/2026-08-26-field-companion/06-maps-mobile-viewport.png)
- [Zapisana obserwacja kontrolna](qa/2026-08-26-field-companion/capture-1-saved-viewport.png)

To zrzuty webowego interfejsu w układzie iOS, nie zdjęcia z fizycznego telefonu.
