# CHMURNIK: audyt wszystkich 14 pracowni

**9 września 2026. Werdykt: obecny podgląd nie spełnia wymagań pracowni lekcyjnych.**

Sprawdziłem publiczną stronę, nie tylko pliki projektu. Przeszedłem interakcje we wszystkich 14 ćwiczeniach, obejrzałem każde w układzie telefonicznym i desktopowym oraz zapisałem 39 świeżych zrzutów. Dwa niezależne przeglądy kodu objęły 49 kroków przewodników i 28 samodzielnych przypadków. W tej rundzie nie zmieniłem aplikacji ani niczego nie opublikowałem.

Najważniejszy błąd poprzedniej iteracji: uznałem działające kontrolki, nowe przypadki i krótszy ekran za wystarczające potwierdzenie jakości. To potwierdziło wykonanie instrukcji, nie to, że użytkownik rozumie doświadczenie. Nowe okładki nie naprawiły scen wewnątrz ćwiczeń.

## Najpilniejsze Ustalenia

P1 oznacza problem blokujący odbiór pracowni; P2 istotną poprawę. Nie jest to klasyfikacja bezpieczeństwa lotniczego.

### 1. P1: Burza jest przełączaną ilustracją, nie doświadczeniem

**Co miała wyjaśniać:** rolę wilgoci, chwiejności i wymuszonego uniesienia, a następnie różnice przepływów w stadiach komórki.

**Co użytkownik faktycznie robi:** wybiera wilgotne powietrze, chwiejne otoczenie i skuteczne wymuszenie. Dopiero komplet włącza stos trzech chmurek. Suwak wybiera gotowe stadium, do którego dochodzą strzałki i opad. Pierwsze dwa wybory nie pokazują różnic temperatury porcji i otoczenia, pokonywania hamowania ani procesu kondensacji. Brak zmiany może być poprawnym wynikiem doświadczenia, ale tutaj nie ma dostatecznie czytelnego dowodu, co ją hamuje.

Przełącznik „Wymuszenie pokonuje hamowanie” podaje wniosek, który uczeń powinien dopiero zbadać. W kodzie to koniunkcja trzech warunków, nie przebieg inicjacji ani rozwoju. [Mechanizm](/Volumes/Kingston-Codex/repos/Documents/Codex/2026-06-16/widzisz-jak-pracuj-niedawno-zrobili-my/chmurnik-v4/weather-preview/learning/science.mjs:63), [rysunek](/Volumes/Kingston-Codex/repos/Documents/Codex/2026-06-16/widzisz-jak-pracuj-niedawno-zrobili-my/chmurnik-v4/weather-preview/learning/Scenes.jsx:154).

**Skutek:** użytkownik może odtworzyć checklistę bez zrozumienia słów na przyciskach. To uzasadnia jego pytanie „o czym jest to ćwiczenie?”.

[Start telefonu](/Volumes/Kingston-Codex/repos/Documents/Codex/2026-06-16/widzisz-jak-pracuj-niedawno-zrobili-my/chmurnik-v4/design/workshop-audit-20260909/01-burza-mobile-start.png), [stadium na desktopie](/Volumes/Kingston-Codex/repos/Documents/Codex/2026-06-16/widzisz-jak-pracuj-niedawno-zrobili-my/chmurnik-v4/design/workshop-audit-20260909/05-burza-desktop.png), [samodzielny przypadek](/Volumes/Kingston-Codex/repos/Documents/Codex/2026-06-16/widzisz-jak-pracuj-niedawno-zrobili-my/chmurnik-v4/design/workshop-audit-20260909/06-burza-desktop-proba.png).

### 2. P1: obraz w Wysokości przeczy wartościom

Przy terenie **1800 m MSL** przerywana kreska **1500 m MSL** jest widoczna ponad jego górną krawędzią, mimo poprawnego tekstowego wyniku „pod terenem”.

Przyczyna została ustalona: pozycja `bottom` kotwiczy dół całego bloku podpisu, podczas gdy kreska jest jego górnym obramowaniem. Wysokość tekstu przesuwa kreskę. Na niskiej scenie mobilnej odwraca to relację poziomów. Nie jest to ograniczenie zakresu danych. [Komponent](/Volumes/Kingston-Codex/repos/Documents/Codex/2026-06-16/widzisz-jak-pracuj-niedawno-zrobili-my/chmurnik-v4/weather-preview/learning/Scenes.jsx:97), [CSS](/Volumes/Kingston-Codex/repos/Documents/Codex/2026-06-16/widzisz-jak-pracuj-niedawno-zrobili-my/chmurnik-v4/weather-preview/learning/style.css:119).

**Naprawa:** wspólny układ współrzędnych dla terenu, poziomu morza i kreski; podpis pozycjonowany niezależnie od kreski. Odbiór musi obejmować 1300, 1500 i 1800 m, różne wysokości sceny i powiększony tekst.

![Rysunek przedstawia poziom 1500 m ponad terenem 1800 m](/Volumes/Kingston-Codex/repos/Documents/Codex/2026-06-16/widzisz-jak-pracuj-niedawno-zrobili-my/chmurnik-v4/design/workshop-audit-20260909/21-wysokosc-mobile-pod-terenem.png)

### 3. P1: potrzebne dowody zostały schowane

- **Front:** polecenie „Porównaj temperaturę z otoczeniem”, ale obie temperatury są w zwiniętym odczycie. Zmiana gradientu nie zmienia toru ani wysokości porcji.
- **METAR:** sama depesza, najniższa podstawa i pułap są w zwiniętym odczycie, chociaż ich powiązanie jest celem.
- **Sondaż:** „dodaj wiatr” dodaje tekst w odczycie, nie widoczny wektor na wykresie. Wcześniej wykres jest zwinięty; po odsłonięciu duży blok liczb odsuwa go od sterowania.
- **Oblodzenie:** faza wody i temperatura początkowa nie są widocznym, stałym nagłówkiem próby. Zmiana fazy zeruje ilustrację osadu; objaśnienie, że to osobna próba, nie jest dostatecznie widoczne.

To nie uzasadnia rozwinięcia wszystkich akapitów. **Dane potrzebne do bieżącej decyzji muszą być przy obiekcie; objaśnienia dodatkowe mogą pozostać zwinięte.** [Wspólny Readout](/Volumes/Kingston-Codex/repos/Documents/Codex/2026-06-16/widzisz-jak-pracuj-niedawno-zrobili-my/chmurnik-v4/weather-preview/learning/Scenes.jsx:12), [Front](/Volumes/Kingston-Codex/repos/Documents/Codex/2026-06-16/widzisz-jak-pracuj-niedawno-zrobili-my/chmurnik-v4/weather-preview/learning/Scenes.jsx:48), [METAR](/Volumes/Kingston-Codex/repos/Documents/Codex/2026-06-16/widzisz-jak-pracuj-niedawno-zrobili-my/chmurnik-v4/weather-preview/learning/Scenes.jsx:88), [Sondaż](/Volumes/Kingston-Codex/repos/Documents/Codex/2026-06-16/widzisz-jak-pracuj-niedawno-zrobili-my/chmurnik-v4/weather-preview/learning/Scenes.jsx:104).

[Front: ukryte temperatury](/Volumes/Kingston-Codex/repos/Documents/Codex/2026-06-16/widzisz-jak-pracuj-niedawno-zrobili-my/chmurnik-v4/design/workshop-audit-20260909/12-front-desktop-ukryte-temperatury.png), [METAR bez widocznego kodu](/Volumes/Kingston-Codex/repos/Documents/Codex/2026-06-16/widzisz-jak-pracuj-niedawno-zrobili-my/chmurnik-v4/design/workshop-audit-20260909/16-metar-mobile-start.png), [Sondaż po odsłonięciu](/Volumes/Kingston-Codex/repos/Documents/Codex/2026-06-16/widzisz-jak-pracuj-niedawno-zrobili-my/chmurnik-v4/design/workshop-audit-20260909/14-sondaz-mobile-skew.png).

### 4. P1: samodzielna próba ma rozpoznawalny klucz odpowiedzi

Niezależny przegląd i mój odczyt danych potwierdziły:

- W **28/28** pytaniach o zasadę poprawna opcja jest jednoznacznie najdłuższa.
- W pierwszym pytaniu przypadku A dla **14/14** ćwiczeń poprawna jest druga opcja.
- Kolejność opcji nie jest tasowana. Część błędnych odpowiedzi jest absurdalna zamiast odzwierciedlać wiarygodną pomyłkę początkującego.
- Ostatnie pytanie pokazuje gotowe zasady, a przed wspólnym zatwierdzeniem można wrócić do wcześniejszych decyzji.

Nie oznacza to, że dowiedliśmy korzystania ze skrótu przez uczniów ani że sam wybór najdłuższej opcji zalicza wszystkie pytania. Oznacza, że wynik nie jest wiarygodnym dowodem rozumienia. Samo tasowanie kolejności nie usuwa podpowiedzi językowych. [Dane](/Volumes/Kingston-Codex/repos/Documents/Codex/2026-06-16/widzisz-jak-pracuj-niedawno-zrobili-my/chmurnik-v4/weather-preview/learning/transfer-cases.mjs:25), [renderowanie](/Volumes/Kingston-Codex/repos/Documents/Codex/2026-06-16/widzisz-jak-pracuj-niedawno-zrobili-my/chmurnik-v4/weather-preview/learning/TransferTrial.jsx:79).

### 5. P1: omówienie Burzy mówi językiem implementacji

Po zatwierdzeniu przeczytałem na publicznej stronie: „Dla dry/unstable/lift helper daje possible=false”. To nie jest objaśnienie dla ucznia. Pojawiają się również `wet`, `true` i `false`. Jest to bezpośredni błąd redakcyjny, nie subiektywna ocena stylu.

Omówienie powinno wskazywać obserwację i brakujący warunek zwykłą polszczyzną. Nazwy zmiennych mogą istnieć w raporcie technicznym, nigdy w lekcji dla początkującego. [Przypadek](/Volumes/Kingston-Codex/repos/Documents/Codex/2026-06-16/widzisz-jak-pracuj-niedawno-zrobili-my/chmurnik-v4/weather-preview/learning/transfer-cases.mjs:569).

![Publiczne omówienie Burzy z nazwami zmiennych i słowem helper](/Volumes/Kingston-Codex/repos/Documents/Codex/2026-06-16/widzisz-jak-pracuj-niedawno-zrobili-my/chmurnik-v4/design/workshop-audit-20260909/39-burza-omowienie-jezyk-programisty.png)

### 6. P2: jeden formularz narzuca wszystkim tematom tę samą pracę

Jedenaście nowszych ćwiczeń stosuje schemat: kontrolka, rysunek, przycisk ustawiający odpowiedź, gotowe wyjaśnienie. Sceny są wyjściem formularza. Nie zaznacza się fragmentu zdjęcia, grupy METAR ani odcinka wykresu. Starsza kondensacja ma rzeczywistą kontrolkę porcji na scenie.

„Porównaj i wyjaśnij” odsłania gotowe akapity; nie zbiera własnego wyjaśnienia. Istnieje końcowe pytanie wyboru w nowszych przewodnikach, ale nie zmienia to warunku ukończenia wcześniejszych kroków: zgodności ustawień z receptą. [Sterowanie](/Volumes/Kingston-Codex/repos/Documents/Codex/2026-06-16/widzisz-jak-pracuj-niedawno-zrobili-my/chmurnik-v4/weather-preview/learning/LearningStudio.jsx:119), [warunek kroku](/Volumes/Kingston-Codex/repos/Documents/Codex/2026-06-16/widzisz-jak-pracuj-niedawno-zrobili-my/chmurnik-v4/weather-preview/learning/catalog.mjs:160).

## Wszystkie 14 Ćwiczeń

**Zachować rdzeń** nie znaczy „gotowe”. **Dopracować** oznacza zachowanie sensownej zależności, ale zmianę czynności ucznia lub prezentacji. **Przebudować** oznacza zmianę głównej mechaniki.

| # | Pracownia | Co jest teraz | Werdykt i właściwa czynność ucznia |
| --- | --- | --- | --- |
| 1 | **Bryza** | Termometry i obieg reagują na kontrast nagrzewania i godzinę. Przewodnik podaje docelowe 70% i 02:00. | **Zachować rdzeń.** Z dwóch temperatur przewidzieć napływ, ułożyć strzałkę, uruchomić obieg i porównać dzień z nocą. Nie zastępować odczytu temperatur hasłem „dzień/noc”. |
| 2 | **Powstaje chmura** | Porcję można poruszać; wysokość, temperatura i kondensacja są sprzężone. Próg i zadane wysokości wyprzedzają szukanie wyniku. | **Dopracować.** Najpierw zaznaczyć przewidywany początek chmury, potem unieść porcję i porównać z drugą, o innej wilgotności. Zachować ślad obu prób. |
| 3 | **Mgła** | Ochładzanie podnosi RH, po nasyceniu stopniowo zmienia wygląd mgły. Nacisk pada na odtworzenie 3/6°C. | **Dopracować.** Porównać dwa wieczory o tej samej końcowej temperaturze, ale różnym punkcie rosy; przewidzieć i wskazać różnicę. Nie wyliczać widzialności z opacity. |
| 4 | **Obserwacja** | Autentyczny pełny kadr, wybór cechy i odsłonięcie porównania. Przycisk od razu wskazuje „połączone wały”. | **Zachować rdzeń.** Zaznaczyć cechę na zdjęciu i oddzielić „widzę” od „mam pomiar”. Potem odsłonić opis i porównać inny kadr. Brak symulacji jest tutaj właściwy. |
| 5 | **Rodzaje** | Lista nazw podmienia jedną fotografię; porównanie z poprzednią odbywa się z pamięci. Start „poszukaj włókien” pokazuje jeszcze Cumulus. | **Dopracować.** Przypiąć dwa pełne zdjęcia, zaznaczyć cechę wspólną i różnicę, dopiero potem nazwać rodzaje. Dołożyć zmienność wyglądu tego samego rodzaju. |
| 6 | **Front i unoszenie** | Rachunek porcji reaguje na wilgoć i profil, ale gradient nie daje czytelnej zmiany sceny. | **Dopracować; pilnie odsłonić temperatury.** Przesuwać klin pod porcję, porównywać ją z otoczeniem, zatrzymać wymuszenie i sprawdzić dalszą reakcję w dwóch profilach. To wymaga jawnego modelu, nie samej animacji. |
| 7 | **Wiatr z ruchu chmur** | Dwa kompasy pokazują „do” i „z”, ale uczeń wpisuje kierunek, który ma obserwować. | **Dopracować.** Obejrzeć niepodpisany dryf, zaznaczyć tor i ustawić wektor „skąd”. Obracany kompas z dotykowym wyborem zamiast liniowego zakresu 0–315°. |
| 8 | **METAR i TAF** | Pokrycie i podstawa zmieniają raport, który jest schowany. Oś TAF ma lepszy, widoczny kontrast czasu. | **Dopracować; pilnie odsłonić raport.** Łączyć grupę kodu z warstwą, samemu zaznaczyć pułap. TAF jako osobny krótki warsztat układania grup na osi i odczytu granic czasu. |
| 9 | **Wysokość MSL/AGL** | Odejmowanie jest poprawne, geometria kreski błędna na krótkiej scenie. | **Dopracować; najpierw naprawić błąd.** Przemieszczać punkt nad przekrojem terenu i zaznaczać odstęp do stałego poziomu. Oba odniesienia muszą być widoczne razem. |
| 10 | **Sondaż / Skew-T** | Użytkownik wybiera gotowy poziom i odsłania kolejne liczby/krzywe. Próba podaje dane tego samego profilu w zdaniach. | **Przebudować główną pracę.** Połączyć wysokość w atmosferze z punktem profilu, przypiąć dwa odczyty i zaznaczyć inwersję; następnie czytać inny wykres. Zachować stopniowe dodawanie Td, porcji i osi. |
| 11 | **Oblodzenie** | Wybór fazy wody i „ekspozycji %” włącza symbole lodu, nie narastanie obrysu. | **Dopracować dydaktykę, przebudować scenę.** Uruchomić osobne próby na czystej powierzchni, śledzić trafienia kropli i jakościową zmianę krawędzi, zatrzymać dopływ, porównać A/B. Reset tylko jawny. |
| 12 | **Turbulencja** | Procent steruje odchyleniem animowanych strzałek; lista wybiera nazwany mechanizm. | **Przebudować.** Trzy krótkie doświadczenia: wstaw przeszkodę, ogrzej fragment podłoża, zmień przepływ dwóch warstw. Najpierw wskaż przewidywany obszar zaburzeń, potem porównaj tory. |
| 13 | **Burza** | Trzy flagi włączają ilustrację, suwak wybiera stadium. | **Przebudować.** Zbadać, dlaczego jedna uniesiona porcja jest hamowana, a druga może rozwijać ruch dalej. Cykl komórki wydzielić jako osobne rozpoznawanie przepływów. |
| 14 | **Nazwy chmur** | Stały akapit i wybieranie wskazanych członów nazwy. | **Dopracować.** Łączyć każdy człon nazwy z konkretną cechą zdjęcia, fragmentem opisu lub sekwencją rozwoju. Zmiana jednego dowodu powinna zmieniać jeden człon, nie całą nazwę. |

W ocenie dydaktycznej: **2 rdzenie do zachowania, 9 do dopracowania, 3 do przebudowy głównej czynności**. Nie jest to ranking pilności usterek: Wysokość wymaga naprawy przed użyciem, mimo sensownej koncepcji.

## Jak Powinna Działać Burza

To propozycja przebudowy, nie opis istniejącej funkcji.

**Pytanie otwierające:** „Dlaczego ta porcja powietrza zatrzymała się, choć zaczęła tworzyć chmurę?”

1. Uczeń widzi przekrój atmosfery, porcję i dwa porównywalne odczyty temperatury na tej samej wysokości. Pierwszy krok wyjaśnia, co reprezentuje porcja; nie wymaga znajomości CAPE ani CIN.
2. Przewiduje dalszy ruch, a następnie sam unosi porcję do wskazanej warstwy. Chmura pojawia się dopiero po dojściu do nasycenia; ruch nie jest mylony z gotową burzą.
3. Zwalnia wymuszenie. Jawnie uproszczona demonstracja pokazuje hamowanie lub dalsze unoszenie. Zapisany ślad i odczyty pozwalają wskazać dowód, nie tylko przeczytać etykietę „chwiejnie”.
4. Uruchamia oddzielną próbę B z jedną zmienioną przyczyną. Przed ruchem zaznacza przewidywanie, po nim porównuje A/B. Zmiana profilu nie może być ukryta za przyciskiem „skuteczne”.
5. W samodzielnym przypadku otrzymuje inny profil i sam wskazuje, gdzie oraz dlaczego przewiduje hamowanie. Pomoc można włączyć, ale pierwsza decyzja pozostaje zapisana.
6. **Osobny epilog o życiu komórki:** ogląda niepodpisane przepływy i opad, rozpoznaje stadium oraz wskazuje dowód. Nie wybiera najpierw nazwy stadium, by zobaczyć jej ilustrację.

Ten kierunek odpowiada rozróżnieniu wilgoci, wymuszenia i stabilności opisanemu przez [NWS](https://www.weather.gov/spotterguide/ingredients). Nie daje podstaw do prognozowania realnej burzy, jej czasu, intensywności ani bezpieczeństwa lotu. Model ruchu trzeba zdefiniować i zweryfikować przed animowaniem; obraz nie może udawać obliczenia, którego nie wykonujemy.

## Piękna Pracownia, Nie Formularz

**Zachować tożsamość CHMURNIKA:** róż, krem, oliwka i fiolet, miękkie ilustracje, prawdziwe fotografie w atlasie. Problem nie wymaga nowego brandingu.

**Zróżnicować narzędzia, nie tylko okładki:**

- **Laboratorium zjawiska:** bryza, kondensacja, mgła, front, burza. Manipulacja przyczyną i widoczny skutek, porównanie A/B, ślad czasu.
- **Stół obserwatora:** zdjęcia, rodzaje i nazwy. Powiększenie kadru, zaznaczanie dowodu, przypięte porównania; żadnych dekoracyjnych suwaków.
- **Biurko danych:** METAR, TAF, sondaż, wysokość i kierunek wiatru. Dotknięcie łączy kod, oś, wektor i odczyt. Uczeń pracuje na danych, nie ogląda kartki z ich opisem.
- **Stanowisko mechanizmu:** oblodzenie i turbulencja. Osobny obiekt i geometria zjawiska, umowne znaczniki, wyraźnie oznaczona nowa próba.

Ilustracja musi odpowiadać tematowi: przekrój frontu, widoczna krawędź skrzydła, profil terenu, różne przepływy. Ta sama zatoka i ten sam kłąb w każdej scenie nie tworzą pięknej pracowni. Element pomiarowy ma być precyzyjny nawet wtedy, gdy otoczenie jest miękkie i ilustracyjne. Nie dodawać tekstur, cieni ani animacji kosztem czytelności dowodu.

**Telefon:** jedno krótkie pytanie, scena, bieżące dane i jedna główna czynność jako spójne stanowisko. Szczegóły poniżej, bez zasłaniania sceny przyklejonymi panelami. Nie należy ściskać wszystkich treści w jeden ekran; trzeba zachować razem to, co uczeń porównuje. W trybie danych można powiększyć wykres do dedykowanego widoku. Fotografie pozostają pełne, z możliwością zbliżenia, bez niejawnego usuwania gruntu.

**Duży ekran:** dodatkową szerokość przeznaczyć na próbę A/B i dowód, nie na powiększanie pustego tła. Duże karty nie rekompensują małego lub nieaktywnego obiektu.

**Dostępność:** przeciąganie musi mieć równoważne wybieranie dotknięciem/przyciskami, niezależnie od obsługi klawiatury. To nie sprzeczność z piękną kontrolką; [W3C opisuje tę zasadę w SC 2.5.7](https://www.w3.org/WAI/WCAG22/Understanding/dragging-movements.html). Zachować widoczny, wycentrowany fokus i pauzę ruchu. Nie ogłaszam zgodności WCAG na podstawie tego audytu.

## Kolejność Prac

1. **Najpierw usunąć błędne dowody:** geometria wysokości, ukryte dane potrzebne do zadania, język programisty i podpowiedzi w banku odpowiedzi.
2. **Zaprojektować jeden kompletny wzorzec na Burzy:** cel, działanie, dowód, błędna hipoteza, próba A/B i nowy przypadek. Ocenić zarówno wygląd, jak i rzeczywistą czynność na telefonie. Nie rozmnażać niezaakceptowanego szablonu na 14 tematów.
3. **Osobny wzorzec pracy na danych:** METAR i sondaż; następnie fotografia. Nie wtłaczać ich w symulator porcji.
4. Przenieść zatwierdzone wzorce na pozostałe ćwiczenia i sprawdzić przejścia lekcja–pracownia–lekcja bez gubienia postępu.
5. Nadal **tylko GitHub Pages do przeglądu**. Produkcyjny chmurnik.cloud, nawigacja aplikacji, iOS i macOS pozostają poza wdrożeniem do akceptacji użytkownika. Materiały SM dopiero po zaakceptowaniu działającej pracowni.

## Kryteria Odbioru

- Użytkownik umie nazwać pytanie ćwiczenia przed pierwszym ruchem.
- Jego działanie zmienia konkretną przyczynę albo wskazuje konkretny dowód. Nie musi zawsze zmieniać świata; w obserwacji i danych zmienia własną interpretację.
- Może porównać stan przed/po lub A/B bez pamiętania liczb z poprzedniego ekranu.
- Własny wybór poprzedza ujawnienie interpretacji. Gotowy przycisk ustawiający wartość pozostaje pomocą w obsłudze, nie dowodem zrozumienia.
- Samodzielna próba wymaga tej samej umiejętności na innym materiale; nie wprowadza nieprzećwiczonego rachunku.
- Zasłonięcie danych i wybieranie po długości/stylu/pozycji odpowiedzi nie pozwala odzyskać klucza.
- Liczby, osie, warstwy i ruch zgadzają się w całym zakresie; rozmiar podpisu nie zmienia fizycznej geometrii.
- Na małym ekranie bieżąca czynność i potrzebny dowód pozostają czytelne. Test obejmuje obsługę, przewijanie, błędną odpowiedź, powrót, powiększony tekst i ograniczony ruch, nie tylko brak poziomego overflow.
- Pilotaż z początkującymi powinien sprawdzać wyjaśnienie własnymi słowami i nowe przypadki. Propozycja robocza: 4 z 5 osób wykonuje to bez podpowiedzi moderatora. To bramka użyteczności, nie statystyczny dowód skuteczności nauczania.

## Zakres Weryfikacji

Publiczny podgląd: [pogoda-preview](https://jakiesluchawki.github.io/chmurnik/pogoda-preview/?from=zagrozenia#burza). W tej rundzie rozpoznano zasoby `index-Cnn3f-O5.js` / `index-DEHk9hO0.css`. Odczyt kodu: lokalny HEAD `270dfcf`. Raport nie zastępuje porównania wszystkich bajtów wdrożenia z lokalnym repozytorium.

**Przeglądarka:** aktualne narzędzia CUA, in-app browser. Wszystkie 14 ćwiczeń obejrzane przy 390×700 i 1365×900; dodatkowo Burza przy 320×700. Każde otrzymało co najmniej jedną rzeczywistą zmianę przez UI. Burza, Front, Sondaż, Wiatr, Wysokość, Obserwacja, Oblodzenie i Turbulencja: sprawdzone działania wszystkich kroków przewodnika, nie wszystkie końcowe pytania. Pozostałe: reprezentatywne kroki opisane niżej. Jedna pełna próba Burzy zatwierdzona do omówienia; widoczny status „z pomocą” zachowany. Nie kasowano zapisu ani nie przedstawiano tej próby jako niezależnego testu ucznia.

| Ćwiczenie | Wykonane działanie w tej rundzie | Dowody obrazowe |
| --- | --- | --- |
| Burza | Wilgoć, chwiejność, wymuszenie, dojrzałość; eksploracja; odpowiedzi i zatwierdzenie próby | 01–06, 37–39 |
| Oblodzenie | Ekspozycja 50%, ciecz, suche kryształki; wejście do eksploracji | 07–08, 35 |
| Turbulencja | 70%, przeszkoda, ogrzewanie, uskok | 09–10 |
| Front | 70%, sucho, wilgotno, gradient 9°C/km | 11–12 |
| Sondaż | 925 hPa, Td, porcja, Skew-T, wiatr | 13–15 |
| METAR/TAF | SCT→BKN, podstawa 1000 ft, TAF, 12→13 UTC klawiaturą | 16–17 |
| Wiatr | 90°, dwie warstwy, górna 225° | 18–19, 34 |
| Wysokość | Teren 1300, 1800, ponownie 100 m | 20–21, 33 |
| Obserwacja | Budowa, brak pomiaru, odsłonięcie porównania | 22, 36 |
| Rodzaje | Cumulus→Cirrus, zmiana fotografii i podpisu | 23–24 |
| Nazwy | Wybór congestus i zmiana złożonej nazwy | 25–26 |
| Bryza | 0→70%, 14→02, odwrócenie obiegu | 27–28 |
| Chmura | Klawiatura na kontrolce porcji, 500→1500 m i kondensacja | 29–30 |
| Mgła | Ochłodzenie 3→6°C i nasycenie | 31–32 |

Zrzuty 01–39 oraz towarzyszące snapshoty są w tym katalogu; przebiegi od części Oblodzenia dalej zapisuje [browser-events.json](/Volumes/Kingston-Codex/repos/Documents/Codex/2026-06-16/widzisz-jak-pracuj-niedawno-zrobili-my/chmurnik-v4/design/workshop-audit-20260909/browser-events.json). Obrazy pokazują różne pozycje przewinięcia. Automatyczne dosunięcie elementu do kliknięcia nie jest samo w sobie błędem scrollowania aplikacji. Krótkie różnice między nastawą a odczytem w snapshotach Bryzy/Chmury/Mgły były stanami animowanego przejścia, nie ustalonymi rozbieżnościami danych.

**Ograniczenia:** to nie test na fizycznym iPhonie lub Samsungu, nie pełny audyt WCAG, nie badanie z uczniami i nie ponowna walidacja meteorologiczna wszystkich uproszczeń. Odczyt kodu objął wszystkie 28 przypadków, ale w przeglądarce nie rozwiązywano wszystkich. Nie uruchamiano nowego zestawu testów jednostkowych ani buildów, bo zmiany dotyczą raportu. Wcześniejsze zielone testy nie służą tu jako argument za użytecznością.

## Agenci I Odpowiedzialność

**W tej rundzie uczestniczyło 3 agentów łącznie: prowadzący i 2 delegowanych.**

| Agent | Rzeczywista rola | Wynik |
| --- | --- | --- |
| Prowadzący | Publiczny audyt UI, działania i zrzuty wszystkich 14 ćwiczeń, kontrola klucza odpowiedzi, synteza i priorytety | Ten raport i 39 zrzutów |
| Bernoulli | Zależności wejście–model–rysunek, przyczyny usterek, analiza wszystkich 49 etapów; bez własnego sterowania przeglądarką | [Audyt mechanik](/Volumes/Kingston-Codex/repos/Documents/Codex/2026-06-16/widzisz-jak-pracuj-niedawno-zrobili-my/chmurnik-v4/design/workshop-audit-20260909/interaction-audit.md) |
| Kierkegaard | Przewodnik→samodzielna próba, 28 przypadków, podpowiedzi, transfer umiejętności i kryteria odbioru | [Audyt dydaktyczny](/Volumes/Kingston-Codex/repos/Documents/Codex/2026-06-16/widzisz-jak-pracuj-niedawno-zrobili-my/chmurnik-v4/design/workshop-audit-20260909/learning-audit.md) |

Obaj agenci zakończyli pracę. Nie doliczam agentów poprzedniej iteracji do tego audytu. Odpowiedzialność za końcowy wniosek i dalszą jakość pozostaje po stronie prowadzącego.
