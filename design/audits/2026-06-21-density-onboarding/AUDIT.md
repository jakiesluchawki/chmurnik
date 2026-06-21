# CHMURNIK: audyt gęstości, onboardingu i ilustracji

Data: 2026-06-21

## Brief

Zachować obecną, wyrazistą tożsamość CHMURNIKA: Romie i Roobert, róż, oliwkę,
fiolet oraz studyjne, filcowe obiekty. Skrócić drogę od wejścia do działania,
dodać opcjonalne oprowadzenie dla nowych osób i wykorzystać ilustracje jako
narzędzie objaśniania procesów.

Twarda zasada wizualna:

- atlas, rozpoznawanie i dowody diagnostyczne używają wyłącznie prawdziwych zdjęć chmur;
- studyjne ilustracje służą pojęciom, procesom, orientacji i nawigacji;
- ilustracja nigdy nie udaje dowodu meteorologicznego.

## Materiał audytowy

1. `02-home-ios.png` - ekran startowy aplikacji iOS.
2. `03-layers-web-mobile.png` - początek Warstw w mobilnym WWW.
3. `04-observer-web-mobile.png` - wejście do Obserwatora terenowego.
4. `05-lesson-web-mobile.png` - początek pierwszej lekcji.
5. `06-home-web-tablet.png` - strona główna na szerokim układzie.
6. `07-layers-web-tablet.png` - Warstwy na szerokim układzie.

## Diagnoza

### Co już działa bardzo dobrze

- Tożsamość jest własna i rozpoznawalna. Nie wygląda jak kolejna aplikacja pogodowa.
- Romie i Roobert dobrze rozdzielają narrację od instrukcji.
- Filcowe sceny studyjne są najmocniejszym elementem marki i warto budować na nich system.
- Prawdziwe fotografie są konsekwentnie używane tam, gdzie trzeba rozpoznać chmurę.
- Nawigacja i nazwy działów są zrozumiałe, a duże pola dotykowe pomagają na telefonie.
- Układ tabletowy Warstw pokazuje, że treść może być gęstsza bez utraty elegancji.

### Najważniejszy problem

Interfejs zbyt często traktuje każdy ekran jak stronę otwierającą magazyn. Nagłówek,
lead, źródła i odstępy zajmują pierwszy widok, a właściwa czynność zaczyna się dopiero
niżej. Na telefonie dotyczy to szczególnie Warstw, Obserwatora i lekcji.

Dostępność nie wymaga ogromnych nagłówków ani pustych ekranów. Zachowujemy kontrast,
skalowanie tekstu i pola dotykowe minimum 44 px, ale kondensujemy kompozycję.

## Ustalenia ekran po ekranie

### 1. Start iOS - zdrowie: dobre wizualnie, słabe zadaniowo

Ekran jest piękny, lecz tytuł, dwa przyciski i ilustracja zużywają ponad dwa widoki.
Nowa osoba nie widzi od razu, czym różnią się Nauka, Atlas i Warstwy.

Zmiana:

- zmieścić tytuł, krótszy lead, jeden główny przycisk i fragment ilustracji w 85-90% wysokości ekranu;
- drugi wybór przenieść do krótkiego panelu pod głównym CTA;
- pod ilustracją pokazać trzy małe wejścia: rozpoznaj chmurę, zrozum warstwy, zacznij lekcję;
- po pierwszej wizycie zamienić ceremonialny hero na kompaktowe "Wróć do..." i ostatnią aktywność.

### 2. Start WWW - zdrowie: bardzo dobre, do skrócenia

Na szerokim ekranie kompozycja jest atrakcyjna i mieści kluczowy przekaz, ale nadal
dominuje nad dalszą zawartością. Dolna część zaczyna już kolejny duży manifest.

Zmiana:

- zachować obecny hero jako wizytówkę, lecz obniżyć go o około 20-25%;
- skrócić lead do dwóch linii;
- kolejną sekcję zacząć od konkretnej czynności, nie od następnego dużego hasła;
- wykorzystać filcową scenę jako mapę trzech ścieżek, z dyskretnymi punktami interakcji.

### 3. Warstwy mobile - zdrowie: treść dobra, wejście przeciążone

Pierwszy widok niemal w całości zajmuje branding, nazwa działu, lead i źródła.
Zakładki oraz właściwy Czytnik Windy pojawiają się dopiero na dole.

Zmiana:

- zastosować kompaktowy nagłówek roboczy: kicker, tytuł i jednozdaniowy opis w 180-240 px;
- przykleić zakładki pod nagłówkiem;
- umieścić pierwszą kontrolkę lub ćwiczenie powyżej linii zgięcia;
- źródła przenieść do ikony w belce działu;
- po pierwszym wejściu zapamiętywać ostatnią zakładkę.

### 4. Obserwator mobile - zdrowie: funkcja mocna, funkcja niewidoczna

Użytkownik wybiera Obserwatora, lecz widzi przede wszystkim ogólny nagłówek
"Encyklopedia chmur". Pytanie obserwacyjne znajduje się poza pierwszym ekranem.

Zmiana:

- po wyborze zakładki nagłówek ma opisywać aktywną pracownię, nie cały Atlas;
- pierwszy krok obserwacji musi pojawić się od razu pod zakładkami;
- ogólny opis encyklopedii pokazywać tylko w zakładce Rodzaje;
- zachować prawdziwe zdjęcia dopiero w wynikach i porównaniach, gdzie są dowodem.

### 5. Lekcja mobile - zdrowie: piękna redakcja, zbyt długi próg wejścia

Numer, metadane, tytuł i wprowadzenie są czytelne, ale zajmują cały ekran. Użytkownik
nie widzi pierwszego rozdziału ani konkretnego zadania.

Zmiana:

- tytuł lekcji zmniejszyć do zakresu 48-64 px na telefonie;
- lead zwinąć do 2-3 linii z opcją "Dlaczego to ważne?";
- plan 12 minut pokazać jako cztery kompaktowe segmenty;
- utrzymać jeden aktywny rozdział naraz i przykleić nawigację rozdziałów;
- na dole ekranu stale pokazywać "Dalej" zamiast wymagać długiego przewijania.

### 6. Warstwy tablet - zdrowie: dobre

Na szerokim ekranie czynność jest widoczna i układ kart działa. Nadal można skrócić
górny pas, ale nie potrzeba przebudowy całej sekcji.

Zmiana:

- zmniejszyć górny nagłówek o około 25%;
- zachować siatkę i czytelne zakładki;
- użyć nowej ilustracji jako kompaktowego objaśnienia modelu warstw, nie jako pełnoekranowego hero.

## Rekomendowany pakiet zmian

### A. System gęstości

1. Jeden duży hero tylko na stronie Start.
2. Wszystkie podstrony otrzymują kompaktowy `workbench header`.
3. Pierwsza interakcja ma być widoczna bez przewijania na typowym iPhonie.
4. Sekcje edukacyjne przechodzą z długiego dokumentu na rozdziały, zakładki i progresywne rozwijanie.
5. Dolna nawigacja zostaje z pięcioma głównymi pozycjami. Test staje się kontekstowym przyciskiem, a nie szóstą równorzędną zakładką.

### B. Onboarding "Pierwszy raz?"

Oprowadzanie jest opcjonalne, możliwe do pominięcia i zapisywane lokalnie.

1. **Patrz** - pokaż, że Atlas i Test zawsze opierają się na prawdziwych zdjęciach.
2. **Zrozum** - pokaż Warstwy i filcową ilustrację atmosfery.
3. **Ćwicz** - pokaż krótkie lekcje oraz Obserwatora terenowego.
4. **Wracaj** - pokaż Dziennik i zapamiętany postęp.

Na iOS onboarding działa jako cztery pełnoekranowe, krótkie karty. Na WWW jako
lekki panel z podświetleniem realnych elementów strony. Po zakończeniu pojawia się
mały przycisk `?`, który pozwala uruchomić oprowadzanie ponownie.

### C. Nowa rodzina ilustracji studyjnych

Do wygenerowania w tym samym materiale, świetle i palecie:

1. pionowa kolumna atmosfery z warstwami ciśnienia;
2. wiatr z wysokością jako wstęgi przechodzące przez pionowy maszt;
3. kierunek ruchu chmur i kierunek wiatru jako dwa rozdzielone układy;
4. proces konwekcji w trzech stanach: start, rozwój, kowadło;
5. warsztat obserwatora: rama kadru, skala, światło i notatka;
6. dziennik terenowy jako studyjny flat lay;
7. cztery miniaturowe dioramy do onboardingu.

Zasada produkcyjna: żadna z tych ilustracji nie trafia do kart atlasu, testów
rozpoznawania, galerii diagnostycznych ani porównań chmur.

### D. Automatyczne publikowanie

Po zmianach wspólny pipeline powinien:

1. uruchomić testy i audyt lekcji;
2. zbudować wersję `/` dla Cyber_Folks i `/chmurnik/` dla GitHub Pages;
3. opublikować GitHub Pages;
4. wysłać główny build do izolowanego `domains/chmurnik.cloud/public_html`;
5. zachować poprzednie wydanie do szybkiego wycofania.

Preferowany transport to SSH i `rsync` po włączeniu SSH w Cyber_Folks. FTPS jest
możliwy bez SSH, ale daje słabsze wdrożenie atomowe i trudniejszy rollback.
Sekrety pozostają wyłącznie w GitHub Actions.

## Kolejność wdrożenia po akceptacji

1. Kondensacja nagłówków, lekcji i Warstw bez zmiany treści.
2. Onboarding i możliwość ponownego uruchomienia pomocy.
3. Trzy kierunki wizualne nowych ilustracji, wybór jednego, potem komplet assetów.
4. QA WWW i iOS na małym oraz dużym iPhonie.
5. Publikacja WWW, automatyzacja Cyber_Folks i nowy build TestFlight.

## Ryzyka i granice audytu

- Zrzuty potwierdzają widoczną hierarchię i gęstość, ale nie dowodzą pełnej zgodności z WCAG.
- Przed wdrożeniem trzeba dodatkowo sprawdzić VoiceOver, Dynamic Type, fokus klawiatury i reduced motion.
- Audyt nie proponuje usunięcia treści merytorycznej; zmienia kolejność ujawniania i długość drogi do interakcji.
