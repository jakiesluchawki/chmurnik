# CHMURNIK V4: czytnik depesz i narzędzia terenowe

Pełny zestaw tego etapu, razem z niezmienionymi przykładami i pytaniami.
Obliczenia i dekodowanie pozostają bez zmian. Wprowadzenia do trzech pracowni
znajdują się również w pierwszej części dokumentu zbiorczego.

## Czytnik METAR, SPECI i TAF

**Czytnik depesz na urządzeniu**

Wklej depeszę, a potem wybieraj jej fragmenty, żeby przeczytać wyjaśnienia.
Czytnik działa bez internetu i nie pobiera aktualnej pogody.

### Czym różni się METAR od TAF?

**METAR / SPECI: Co zaobserwowano?**

METAR opisuje pogodę zaobserwowaną w określonej chwili. SPECI to obserwacja
specjalna. Do METAR może być dołączona krótka prognoza zmian, nazywana trendem.
Pokazujemy ją osobno od obserwacji.

**TAF: Czego się spodziewamy?**

Prognoza dla lotniska w przedziale czasu, np. `2618/2718`. `FM262300` rozpoczyna
nowe warunki od konkretnej chwili. Skopiowany TAF może nie mieć nagłówka.

Samo `TEMPO` nie rozstrzyga: występuje też w trendzie METAR. Czytamy strukturę
całej depeszy, nie tylko jeden skrót.

Przycisk: **Przećwicz różnicę**.

Pole: **Wklej jeden METAR, SPECI lub TAF**. Przycisk: **Wyjaśnij depeszę**.
Lista: **Przykłady do ćwiczeń · nie aktualna pogoda**.

### Wynik i pochodzenie

- METAR/SPECI: **Obserwacja: dzień [dzień], [czas UTC]**.
- TAF: **Wydano: dzień [dzień], [czas] UTC**.
- **Przykład szkoleniowy** albo **Przykładowa depesza, nie bieżąca pogoda**.
- Dla własnego tekstu: **Wklejona depesza, bez sprawdzania aktualności**.
- **Rozpoznano TAF · prognoza, nie obserwacja** albo **METAR / SPECI · obserwacja, nie prognoza TAF**.

Dane wymyślone do ćwiczeń, nie opisują obecnej pogody.

Dla pozostałych depesz: Nie sprawdziliśmy źródła ani aktualności. Depesza nie
zawiera miesiąca i roku. Zweryfikuj datę i pełny oryginał w oficjalnym serwisie.

### Obserwacja

Poniżej odczyt pomiaru. Ewentualny trend pokazujemy osobno i nie podmieniamy nim
obserwacji.

Pola: **Widzialność**, **Raportowany pułap**, **Temperatura / punkt rosy**,
**Nastawa wysokościomierza**. Brakujące dane nie stają się zerem.

Warianty pułapu: **Brak danych o niebie**, **Nieznany / niepełny**,
**[wysokość] ft nad lotniskiem**, **Brak określonego pułapu**.

**Wybierz fragment depeszy, żeby zobaczyć wyjaśnienie**.
Nieobsługiwane fragmenty pozostają widoczne jako **Nieodczytane grupy**.

**Trend, oddzielony od obserwacji**:

- NOSIG: nie przewiduje się istotnych zmian w okresie trendu. To nie gwarancja niezmiennych warunków.
- Nie wliczamy tych grup do bieżącego pułapu ani widzialności. Interpretację trendów przećwicz w module METAR / TAF.

**RMK: uwagi w oryginale**: Ta wersja czytnika nie dekoduje uwag. Nie traktuj
ich jako nieistotnych.

**NIL: brak obserwacji.**

**VRB: kierunek wiatru jest zmienny. Bez jednego kierunku nie obliczamy składowej bocznej.**

### Prognoza TAF

**Okres ważności prognozy**. Grupa ważności to przedział czasu, a grupa wydania
to osobna informacja.

**Warunki w kolejnych godzinach**

Wybierz przedział czasu. Może on pokrywać się z innym przedziałem: PROB opisuje
możliwy wariant, a TEMPO warunki przejściowe. Pokazujemy je osobno od podstawowych
warunków prognozy.

Pola: **Przewidywany wiatr**, **Przewidywana widzialność**, **Pułap w tej grupie
prognozy**, **Przewidywane zjawiska**.

Warianty: **Nie odczytano · sprawdź oryginał**, **Bez zmiany w tej grupie**,
**Brak danych w grupie**, **Wysokość nieznana / niepełna**, **Nie wskazano warstwy
wyznaczającej pułap**, **Brak istotnych zjawisk według kodu**, **Nie wymieniono
istotnych zjawisk**.

Pokazujemy tylko elementy zapisane w tej grupie. „Bez zmiany” odsyła do tła
prognozy, nie oznacza ciszy, bezchmurnego nieba ani wartości zero.

**Warstwy**: kod zachmurzenia i wysokość w stopach nad lotniskiem. Przy braku
wysokości: **wysokość nieznana**.

**Uskok wiatru LLWS**: na podanej wysokości wiatr z podanego kierunku o podanej
prędkości. Nie myl go z wiatrem przy powierzchni.

**Nieodczytane elementy tej grupy** pozostają w oryginale.

**Temperatura w prognozie**: **Maksimum** i **Minimum** z terminem.
TX/TN to prognozowane ekstremum, nie temperatura ani punkt rosy zmierzone teraz.

**RMK: uwagi w oryginale**: Nie dekodujemy uwag automatycznie. Nie pomijaj ich
w pełnym raporcie.

- CNL: prognoza została odwołana. Nie używaj wcześniejszych warunków jako nadal obowiązującej prognozy.
- NIL: prognoza nie jest dostępna. Nie oznacza to dobrej pogody.

### Wszystkie przykłady i ich wyjaśnienia

<!-- FIELD_REPORT_EXAMPLES -->

## Symulator wiatru

Tryby: **Na pokładzie**, **Na drodze startowej**.

### Wiatr na pokładzie

Ustaw wiatr, kierunek dziobu i prędkość jachtu. Zobaczysz wiatr pozorny, czyli
wiatr odczuwany przez poruszającą się załogę. Zmieniaj jedno ustawienie naraz
i porównuj wynik.

### Wiatr względem drogi startowej

Ustaw wiatr i geograficzny kierunek drogi startowej. Wynik pokaże składową
boczną oraz czołową lub tylną. Te obliczenia nie określają dopuszczalnych limitów
dla samolotu.

W czytniku depesz: Wiatr pochodzi z wklejonej depeszy. Ustaw geograficzny kierunek
drogi startowej, żeby obliczyć składową boczną oraz czołową lub tylną. Nie są to
dopuszczalne limity dla samolotu.

Kierunki °T odnoszą się do północy geograficznej. Prędkości podajemy w węzłach
(kt). To obliczenia z podanych ustawień, nie pomiar telefonem.

Pola: **Kierunek, z którego wieje wiatr**, **Prędkość wiatru rzeczywistego**,
**Kierunek dziobu** / **Geograficzny kierunek drogi startowej**, **Prędkość jachtu**.

Wynik na jachcie: **wiatr pozorny** oraz kąt **od dziobu**, **od rufy**,
**od prawej burty, licząc od dziobu** lub **od lewej burty, licząc od dziobu**.
Przy zerowej prędkości wiatru pozornego: **brak kierunku przy ciszy**.

Wynik na pasie: **brak składowej bocznej**, **boczny z prawej** / **boczny z lewej**,
**składowa czołowa** / **składowa tylna**.

Przy raportowanym porywie podajemy osobno składową boczną, zakładając ten sam kierunek.

### Co zakładamy i czego to nie mierzy?

Model wektorowy bez prądu i dryfu: kurs jest równy kierunkowi dziobu, a obie
prędkości mają wspólny układ odniesienia. Wiatr pozorny to ruch powietrza minus
ruch jachtu. Telefon nie mierzy tu wiatru.

Wszystkie kierunki są względem północy geograficznej (T), jak kierunek w METAR.
Nie wpisuj numeru pasa ani kierunku magnetycznego bez właściwego przeliczenia.
Boczny = prędkość × sin(różnicy kierunków), czołowy = prędkość × cos(różnicy).
To nie ocena możliwości statku powietrznego ani zgoda na lot.

Odczyt skali Beauforta dotyczy zaokrąglonych węzłów. To nie prognoza wysokości
fali: znaczenie mają też czas, rozbieg, prąd i osłona akwenu.

Przy zmienności kierunku w depeszy: wynik dotyczy kierunku średniego, nie
największej możliwej składowej.

## Ćwiczenie odczytu mapy

**Co zmienia odczyt na mapie?**

Wybierz poziom atmosfery, termin i model A lub B. Porównasz prędkości wiatru
w jednym punkcie. Wszystkie liczby są wymyślone do ćwiczenia; modele A i B nie
są prawdziwymi modelami pogody ani danymi Windy.

**Punkt ćwiczeniowy**, wynik w **kt**, **10 m przy powierzchni** albo **850 hPa,
poziom ciśnienia**. Pod wynikiem model A/B i czas za 0/3/6 h.

Pola: **Poziom**, **Model szkoleniowy**, **Za ile godzin**.
Warianty poziomu: **10 m · przy powierzchni**, **850 hPa · powierzchnia ciśnienia**.

Drugi model dla tego samego czasu i poziomu: [wynik] kt. Różnica nie mówi,
który model ma rację.

W rzeczywistym Windy sprawdź model, poziom, legendę, czas ważności i czas
aktualizacji. Powierzchnia 850 hPa nie leży zawsze na stałej wysokości; w górach
może przecinać teren.

Przycisk: **Otwórz Windy w przeglądarce**.

## Trening w trzech pracowniach

**Ćwiczenia na wymyślonych sytuacjach**. Licznik: **[wynik]/[liczba pytań]
ostatnio poprawnych**; dotyczy ostatnich odpowiedzi, nie opanowania tematu.

Po wyborze: **Poprawna odpowiedź** albo **Zaznaczona odpowiedź nie jest poprawna**.
Poprawny wariant jest wyróżniony, a pod nim pozostają pełne wyjaśnienie, wniosek
i źródła.

Przyciski: **Kolejny przypadek**, **Podsumowanie**, **Powtórz trudniejsze ([liczba])**,
**Jeszcze jedna runda**.

W tej rundzie: [wynik] z [liczba pytań] poprawnych odpowiedzi za pierwszym razem.
Możesz wrócić do trudniejszych pytań i przeczytać ich wyjaśnienia.

Przy braku zapisu: Wynik działa w tej sesji, ale nie udało się go zapisać na później.

<!-- FIELD_PRACTICE_CASES -->

## Pełna pracownia i ograniczenia

**Poznaj pełną pracownię atmosfery**

Znajdziesz w niej opisy warstw Windy, trening depesz, ćwiczenia porównywania
raportów ze stacji i sondaże pokazujące zmiany pogody wraz z wysokością.

Przycisk: **Pełna pracownia**.

Narzędzia edukacyjne. Nie zastępują oficjalnego briefingu, ostrzeżeń, aktualnych
pomiarów ani ograniczeń statku powietrznego, jachtu i załogi.

Źródła przy narzędziach pozostają dostępne: AWC i FAA przy depeszach; ORC oraz
Met Office przy wietrze na jachcie; Windy i ECMWF przy mapach. Przy każdym
przypadku szkoleniowym są źródła dotyczące jego treści.
