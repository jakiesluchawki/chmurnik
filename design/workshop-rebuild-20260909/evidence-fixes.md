# Poprawki P1: geometria i widoczne dowody

2026-09-09, gałąź `codex/weather-preview`. Zakres: pięć istniejących scen, nie przebudowa ALL14. Bez przeglądarki, publikacji, commitów i push.

## Zmiany

- **Wysokość:** wspólna funkcja `heightScenePosition` służy terenowi, poziomowi i testom. Pozostaje w [Scenes.jsx](/Volumes/Kingston-Codex/repos/Documents/Codex/2026-06-16/widzisz-jak-pracuj-niedawno-zrobili-my/chmurnik-v4/weather-preview/learning/Scenes.jsx:16), bez nowego helpera. Kotwica linii ma zerową wysokość, kreska jest wycentrowanym pseudoelementem, podpis osobnym absolutnie pozycjonowanym elementem. Rozmiar podpisu nie przesuwa poziomu. Usunięto opóźnioną animację terenu i ikonę chmury bez danych. Teren ma płaski szczyt ze łagodnie zaokrąglonymi narożnikami. Rozróżnione są: nad gruntem, dokładnie na powierzchni (0 m AGL), pod terenem (np. 300 m), z zachowaniem `agl=null` modelu pod gruntem.
- **Front:** obie temperatury, wspólna wysokość uniesienia i ich porównanie są przed zwiniętym objaśnieniem. Różnica odpowiada wyświetlanym zaokrąglonym liczbom. Jawnie pozostaje wymuszone unoszenie; nie dodano modelu swobodnej wyporności ani automatycznego rozwoju chmury.
- **METAR:** bieżący raport, najniższa podstawa i pułap są widoczne bez otwierania odczytu. OVC zastępuje górną warstwę oznaczeniem „Powyżej OVC: brak danych”, nie pewnym pustym niebem. Osobny przykład TAF i jego przedziały pozostają bez zmiany.
- **Sondaż:** po wprowadzeniu wiatru jego kierunek „z” i prędkość są w widocznym panelu wybranego poziomu, razem z hPa i objaśnieniem kt. Zmiana poziomu lub projekcji nie odłącza wiatru od danych. Wcześniejsze kroki nadal nie pokazują wiatru przed jego wprowadzeniem.
- **Oblodzenie:** widoczne są temperatura powietrza i skrzydła, faza wody, umowna ekspozycja i informacja o osobnej próbie od czystej powierzchni. Zniknięcie osadu nie oznacza topnienia. Przy zerowej ekspozycji i spełnionych warunkach nie mylimy braku osadu z brakiem warunków akrecji. To nadal niezależne przeliczenia ustawień, nie narastanie lodu w rzeczywistym czasie ani nowy system zapisu prób.

Wspólny `Readout` nadal jest zamknięty. Wydzielono krótki blok bieżących dowodów tylko w zmienianych scenach. Nie zmieniono kolumn układu ani breakpointów; kompaktowe marginesy nowych bloków są zdefiniowane w [style.css](/Volumes/Kingston-Codex/repos/Documents/Codex/2026-06-16/widzisz-jak-pracuj-niedawno-zrobili-my/chmurnik-v4/weather-preview/learning/style.css:80).

## Weryfikacja

Nowy plik: [weather-evidence.test.mjs](/Volumes/Kingston-Codex/repos/Documents/Codex/2026-06-16/widzisz-jak-pracuj-niedawno-zrobili-my/chmurnik-v4/tests/weather-evidence.test.mjs). Testuje faktyczny markup React przez Vite SSR w trybie middleware, bez serwera HTTP/WebSocket. Dodatkowo analizuje CSS przez PostCSS. Testy sprawdzają tekst wartości przed pierwszym `details`, nie samo występowanie wartości w ARIA.

Końcowy przebieg testów scen i istniejących modeli, z katalogu repozytorium:

```sh
node --test tests/weather-evidence.test.mjs tests/learning-expansion.test.mjs
```

Wynik: **32/32 zaliczone**. Testy obejmują współrzędne terenu 0–2000 m, relację poziomów dla wysokości sceny 180/192/260/480 px, osobny podpis, stany nad/na/pod gruntem, widoczne T frontu i zgodność zaokrąglonego porównania, wszystkie pokrycia METAR, granice TAF, wiatr na dziewięciu poziomach i obu projekcjach oraz kombinacje temperatury/fazy/ekspozycji oblodzenia. Parametry wysokości sceny są sprawdzeniem matematycznym, nie pomiarem renderingu przeglądarki. `git diff --check` dla obu edytowanych plików aplikacji: bez błędów.

Szerszy przebieg z dodatkowym `tests/learning-transfer-cases.test.mjs` początkowo przeszedł 62/62, ale powtórzony po współbieżnych zmianach banku zadań dał **60/62**. Nie zgłaszam więc całego zestawu jako zielonego. Oba błędy są poza moim zakresem: test sondażu oczekuje poprzedniego sformułowania „idealizowanego profilu dydaktycznego” ([test:291](/Volumes/Kingston-Codex/repos/Documents/Codex/2026-06-16/widzisz-jak-pracuj-niedawno-zrobili-my/chmurnik-v4/tests/learning-transfer-cases.test.mjs:291)), a test burzy parsuje usunięte z tekstu oznaczenia „wariant …” ([test:330](/Volumes/Kingston-Codex/repos/Documents/Codex/2026-06-16/widzisz-jak-pracuj-niedawno-zrobili-my/chmurnik-v4/tests/learning-transfer-cases.test.mjs:330)). Potwierdzone w różnicy `transfer-cases.mjs`; bank i jego testy pozostawiłem drugiemu agentowi.

## Granice

- Główny agent prowadzi przeglądarkę. Nie wykonano tutaj nowego audytu wizualnego ani dotykowego; SSR nie dowodzi czytelności, braku kolizji i zmieszczenia całej czynności w viewport.
- Do sprawdzenia w tej sesji przeglądarki: wysokość 1300/1500/1800 m przy 320/390 px i powiększonym tekście; front przy zmianie 4→9°C/km; OVC z podstawą 500 i 4500 ft; zmiana poziomu wiatru; przełączenie krople→kryształki w oblodzeniu. Szczególnie ważne: bieżący dowód i kontrolka na krótkim telefonie oraz szeroki układ obok siebie.
- Nie uruchamiano pełnego builda ani pełnej baterii testów. Nie dodano nowych twierdzeń prognostycznych; zachowano istniejące modele i źródła ćwiczeń. To poprawki reprezentacji i dostępu do dowodu, nie potwierdzenie skuteczności uczenia.
- Moje zapisy obejmują tylko `Scenes.jsx`, `learning/style.css`, nowy test i tę notatkę. Nie zmieniałem burzy, katalogu, `LearningStudio`, oceniania, nawigacji ani wdrożenia. Współbieżne zmiany tych obszarów należą do innych uczestników i pozostają nietknięte.
