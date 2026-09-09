# Niezależny przegląd dydaktyki CHMURNIKA

2026-09-09. HEAD `7def665` oraz zastane, równolegle zmieniane pliki robocze. Najpierw przeczytano `AGENTS.md`, sesję Lore i `research-didactics.md`; następnie `research-exercises.md`, kontrakt jakości lekcji i aktualną implementację. Ten raport obejmuje wykonane testy kodu, nie badanie skuteczności dydaktycznej.

## Wniosek końcowy

Brak otwartych, potwierdzonych usterek w sprawdzonym zakresie. Wszystkie opisane niżej regresje, w tym spóźniony zapis pierwszej odpowiedzi, przeniesienie odsłoniętej pomocy na nowy przypadek i uszkodzenie storage przy otwartym formularzu, przechodzą po poprawkach autora implementacji. Kryteria automatyczne tego przeglądu są spełnione; nie jest to deklaracja pełnej skuteczności dydaktycznej ani niezależnego browser QA.

## Wyniki testów

| Polecenie | Wynik |
| --- | --- |
| `node --test --test-reporter=spec tests/learning-transfer-state.test.mjs` | 266 testów: 266 PASS, 0 FAIL, bez skip/TODO |
| `npm test -- --test-reporter=spec` | 657 testów: 657 PASS, 0 FAIL, bez skip/TODO |
| `git diff --check` | PASS |

Oba ostatnie przebiegi zakończyły się kodem 0. Logi: [testy transferu](/tmp/chmurnik-transfer-review-tests.log), [pełny zestaw](/tmp/chmurnik-transfer-review-full-tests.log). Logi w `/tmp` są pomocnicze i nietrwałe; wynik oraz zakres pozostają zapisane tutaj.

Nowy plik [learning-transfer-state.test.mjs](/Volumes/Kingston-Codex/repos/Documents/Codex/2026-06-16/widzisz-jak-pracuj-niedawno-zrobili-my/chmurnik-v4/tests/learning-transfer-state.test.mjs) nie ogranicza się do szukania fragmentów źródła. Wykonuje reducer, walidację, odczyt/zapis, rzeczywisty render React oraz handlery komponentów.

| Sprawdzony kontrakt | Zakres i wynik |
| --- | --- |
| Bank i osiągalny klucz | 14 aktywności, 28 unikalnych przypadków; poprawne opcje istnieją, każdy dystraktor ma feedback. PASS |
| Brak odpowiedzi przed commit | Puste odpowiedzi, blokada niepełnego zatwierdzenia, pełny szkic nadal nie jest zatwierdzony. Wszystkie 28. PASS |
| Edycja i nawigacja | Zmiana wyborów, powrót, zachowanie pól, blokada pominięcia brakujących pól, odrzucanie niepoprawnych akcji. Wszystkie 28. PASS |
| Wynik częściowy | Każda opcja każdego pola wobec pozostałych poprawnych; trafna decyzja z błędną zasadą nie daje pełnego sukcesu. Wszystkie 28. PASS |
| Pomoc i reveal | Trwałe flagi; pomoc nie znika po edycji; reveal bez oceny; po zatwierdzeniu/reveal brak zmiany odpowiedzi. Wszystkie 28. PASS |
| Nowy przypadek i powtórka | Czyszczenie pól, kroku, pomocy i wyniku; brak powtórzeń do wyczerpania banku; później jawna etykieta powtórki. Wszystkie 14. PASS |
| Restore i historia | Uszkodzone rekordy, zła rewizja, niemożliwe flagi/kroki; świeży import modułu symuluje utratę pamięci przy reload; pierwsza odpowiedź pozostaje w historii w ramach limitu ostatnich 40. PASS |
| Storage niedostępny/pełny | Tryb sesyjny, aktualna pamięć po nieudanym zapisie, odblokowanie odczytu dysku po udanej ponownej próbie, komunikat w UI. PASS |
| Izolacja produkcji | Spy na storage i niezmienne rekordy postępu, pozycji lekcji, zdjęć, dziennika oraz dawnych prób A/B; zapisy wyłącznie do przestrzeni transferu. Wszystkie 14. PASS |
| Zdarzenia i cleanup | Pomoc dla właściwej aktywności, brak reakcji na inną aktywność, źródło i kolejna odpowiedź, oznaczenie aktualnej nieoddanej próby przy unmount; brak zapisu wyniku przy unmount zatwierdzonej próby. PASS |
| Nieaktualny zapis | Ochrona pierwszego zatwierdzenia, nowszej generacji i trwałej pomocy na granicy zapisu dla wszystkich 14; dwa formularze nie nadpisują pierwszego wyniku. PASS |
| Przejęcie nowego przypadku | Stary opis/źródło oraz spóźnione kliknięcie pomocy nie odsłaniają nowego zdjęcia ze statusem niezależnym. PASS |
| Uszkodzenie podczas pracy | Usunięty rekord oraz niepoprawny aktywny rekord przy otwartym formularzu nie powodują wyjątku przy następnej odpowiedzi. PASS |

## SSR i izolacja trybów

- Vite SSR uruchomiono z `middlewareMode: true`, `ws: false`, `hmr: false`, `watch: null`; bez `listen()`, portu HTTP/WebSocket, CUA i nowych zależności. JSX/CSS ładuje istniejący Vite; HTML generuje rzeczywisty `react-dom/server`.
- Wszystkie 28 przypadków wyrenderowano jako puste, po edycjach na każdym kroku, z błędnym powodem, poprawnie zatwierdzone, z pomocą, ujawnione i po przejściu do następnego przypadku. Przed zatwierdzeniem brak komponentu feedbacku, wyjaśnienia, feedbacku opcji, podpowiedzi, oceniającego ARIA, źródłowego URL zdjęcia i opisu zastępczego. Opcje odpowiedzi i neutralne dane są celowo dostępne.
- W końcowym feedbacku błędny powód ma otwarte `details`, poprawne odpowiedzi pozostają zwinięte; reveal rozwija wszystkie omówienia. Zamknięte `details` po zatwierdzeniu nie jest uznawane za przeciek. Nowe zadanie nie dziedziczy wcześniejszego feedbacku, zaznaczeń, źródła zdjęcia, opisu ani podpowiedzi.
- [LearningStudio](/Volumes/Kingston-Codex/repos/Documents/Codex/2026-06-16/widzisz-jak-pracuj-niedawno-zrobili-my/chmurnik-v4/weather-preview/learning/LearningStudio.jsx:69) zachowuje oddzielne `guidedState` i `exploreState`. Testy handlerów wszystkich 11 aktywności potwierdzają zachowanie ustawień przy zmianie trybu; w assessment montowany jest tylko właściwy `TransferTrial` z `key={id}`, bez `ActivityScene`, kontrolek ani feedbacku przewodnika. W pełnym zestawie przechodzą także zastane testy trzech starszych doświadczeń.
- Testy handlerów kompilują aktualne funkcje komponentów przez istniejący TypeScript i dostarczają deterministyczne hooki/zdarzenia. Nie są przeglądarką ani implementacją współbieżnego schedulera React. Rzeczywisty SSR sprawdzany jest osobno, bez tych hooków.

## Usterki poprawione podczas przeglądu

Zmiany wykonał autor implementacji, nie ten przegląd.

1. Otwarcie źródła aktualizowało tylko storage, przez co następna odpowiedź mogła wyczyścić pomoc w nadal zamontowanym formularzu. `CustomEvent` i subskrypcja aktualizują teraz formularz; test przechodzi.
2. Po błędzie `setItem` odczyt wybierał starszy rekord z dysku i gubił pomoc mimo nowszej kopii w pamięci. `pendingWrites` zachowuje aktualną kopię; wszystkie 14 testów oraz test odzyskania zapisu przechodzą.
3. Historia przyjmowała m.in. `hint:true/assisted:false`, `revealed:true/submitted:false` i ujemny krok. Wspólne `validAttempt` odrzuca je również w historii; regresja przechodzi.
4. **P1: utrata pierwszego wyniku przez spóźniony szkic.** Dwa formularze tego samego METAR; pierwszy zatwierdza komplet, drugi zapisuje starą odpowiedź i przywracał `submitted:false`. `saveTransfer` chroni teraz zatwierdzoną próbę i wyższą `serial`, zachowuje pomoc, a komponent odczytuje rekord aktualny i odrzuca akcję dotyczącą starego przypadku. Test dwóch instancji oraz 14 testów granicy zapisu przechodzą. Scenariusze przygotowania danych testowych skorygowano, by nie oczekiwały wyzerowania pomocy ze starego snapshotu; nie osłabiono blokady pierwszej odpowiedzi.
5. **P1: odsłonięta pomoc przenoszona na nowy przypadek.** Przy A→B w drugiej instancji stary formularz mógł pokazać opis lub źródło zdjęcia B przy `assisted:false`; sam zapis był już chroniony. Lokalne flagi źródła/opisu są teraz związane z `serial:caseId`. Przechodzą zarówno test wcześniej otwartego opisu, jak i spóźnionego kliknięcia źródła.
6. **P2: wyjątek po usunięciu/uszkodzeniu storage.** Po otwarciu formularza usunąć rekord albo zapisać aktywny rekord z `step:-1`, następnie wybrać opcję. Odczyt `caseId` z `null` przerywał render. Obsługa brakującej próby odtwarza teraz przypadek, zachowuje znane ID i generację oraz odrzuca starą akcję; oba testy przechodzą.

## Pozostałe granice i ryzyka

- Limit ostatnich 40 rekordów jest decyzją wykonawczą przyjętą w implementacji. Nie oznacza bezterminowego przechowywania każdej pierwszej odpowiedzi; test jawnie sprawdza przycinanie i nie traktuje go jako usterki.
- Inicjalizator `useState` i updater nadal wykonują zapis, a cleanup oznacza pomoc. Ponawianie renderu/efektów, np. pod przyszłym `StrictMode`, wymaga osobnego sprawdzenia idempotencji; nie potwierdzono błędu obecnej produkcyjnej ścieżki z tego powodu. Aktualny entry point nie używa `StrictMode`.
- Test dwóch instancji odtwarza deterministyczną kolejność spóźnionych zapisów. Nie dowodzi atomowości rzeczywiście jednoczesnych operacji kilku procesów przeglądarki; `localStorage` nie dostarcza transakcji obejmującej osobny odczyt i zapis. Przegląd zakończono po końcowym zielonym przebiegu.
- Nie ma pełnego protokołu z `research-didactics.md`: banku worked/faded/independent/delayed, pomiaru odroczenia, swobodnego uzasadnienia i osobnej samooceny R/G. Obecne dwa przypadki i wybór zasady realizują węższy kontrakt `research-exercises.md`. Przejście tych testów nie jest dowodem skuteczności transferu ani opanowania całego tematu.
- Osiągalność i punktowanie kluczy to nie niezależna meteorologiczna walidacja wszystkich danych i fotografii. W tym przeglądzie nie wykonano pomiarów układu mobilnego, fokusu, czytnika ekranu, realnego browser history, dwóch kart ani fizycznych urządzeń. Browser QA wykonane przez autora implementacji opisuje osobny REVIEW.md.
- Zmiany ograniczono do testu i tego raportu. Bez modyfikacji UI/state/data, nowych zależności, buildu, commitów, publikacji i sesji CUA.

## Identyfikacja sprawdzonego kodu

Skróty SHA-256 były identyczne przed i po ostatnim pełnym przebiegu; kolejne edycje wymagają ponownego testu.

| Plik | Początek SHA-256 |
| --- | --- |
| `weather-preview/learning/transfer-state.mjs` | `9677b78e5fa645d3` |
| `weather-preview/learning/TransferTrial.jsx` | `dea81880a9b6fd20` |
| `weather-preview/learning/LearningStudio.jsx` | `7e9764cf6e6b36d1` |
| `weather-preview/learning/transfer-cases.mjs` | `3aee186a877f81c5` |
| `weather-preview/main.jsx` | `192b4747e9065426` |
| `tests/learning-transfer-state.test.mjs` | `05653c9cedc4ad1a` |
