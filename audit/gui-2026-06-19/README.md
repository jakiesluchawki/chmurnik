# Audyt GUI Chmurnika

Data: 2026-06-19
Zakres: strona glowna, atlas, monografia, warstwy, nauka, dziennik i test rozpoznawania.

## Ocena ogolna

Chmurnik ma juz wyrazny, konsekwentny jezyk wizualny i dobra hierarchie tresci. Romie i Roobert laduja sie poprawnie, komponenty sa spojne, a trudna merytoryka jest dzielona na czytelne etapy. Nie ma potrzeby redesignu. Najwiekszy zwrot dadza male korekty kontrastu, mikrotekstu, poziomych paskow sterowania i rozmiaru zasobow.

## Przejscie przez produkt

1. **Start - bardzo dobry.** Jasne dwa wejscia, mocna hierarchia, rozpoznawalne ilustracje i logiczne przejscie od obietnicy do pracowni.
2. **Atlas - dobry, lekko gesty.** Wyszukiwarka, statystyki, filtry i karty sa zrozumiale, ale na waskim ekranie tworza dlugi blok zanim pojawi sie pierwsza chmura.
3. **Monografia - bardzo dobra.** Nazwa chmury pozostaje cala, galeria diagnostyczna prowadzi od obserwacji do analizy, a dlugi material ma sensowna strukture. Przy ponad 5000 px tresci przydalby sie lokalny spis sekcji.
4. **Warstwy - bardzo dobre.** Czytnik prowadzi od protokolu do interpretacji i sprawdzenia wiedzy. Paski zakladek oraz filtrow wymagaja tylko lepszego sygnalu, ze mozna je przesuwac.
5. **Nauka - dobra, ale dluga.** Dziewiec modulow i panel pamieci sa wartosciowe; na telefonie panel powtorek warto zwinac do podsumowania z opcja rozwiniecia.
6. **Dziennik i test - bardzo dobre.** Formularz jest prosty, komunikat o prywatnosci widoczny, odpowiedzi testowe maja duze pola dotyku, a dialogi maja pulapke fokusu, Escape i przywracanie fokusu.

## Korekty o najwyzszym zwrocie

### P1. Kontrast bez zmiany charakteru

- `#746b3c` na `#ffe1eb` ma kontrast ok. `4.40:1`, minimalnie ponizej AA dla zwyklego tekstu.
- `#9a68ff` na `#ffe1eb` ma ok. `2.97:1`; to za malo dla drobnych etykiet, przyciskow i obrysu fokusu.
- Wprowadzic ciemniejsze tokeny uzytkowe, np. `--ink-accessible: #6d6435` i `--violet-accessible: #7442d9`. Jasny fiolet zostawic dla duzych plaszczyzn i dekoracji.

### P1. Lzejszy start na telefonie

- Strona glowna pobiera ok. 7.6 MB samych glownych grafik PNG oraz ok. 1.4 MB fontow OTF.
- Przygotowac AVIF/WebP z `srcset`, dodac `loading="lazy"` do trzech kart pracowni i przekonwertowac fonty do WOFF2.
- Wymiary obrazow sa juz zadeklarowane, wiec ryzyko skakania ukladu jest male.

### P2. Mikrotekst

- Metadane i czesc etykiet schodza do ok. 11-12 px. W edukacyjnym narzedziu lepsza bedzie podloga 12 px dla metadanych i 14 px dla aktywnych kontrolek.
- Szczegolnie dotyczy zrodel, opisow filtrow, paskow zakladek, podpisow quizu i pomocniczych komunikatow formularza.

### P2. Paski przewijane

- Zakladki atlasu, zakladki warstw i filtry poziomu przewijaja sie poziomo, ale nie sygnalizuja tego wystarczajaco.
- Dodac delikatny gradient na prawej krawedzi, wiekszy koncowy padding i `scroll-snap`; aktywny element powinien automatycznie wejsc w widok.
- Przy ok. 742 px ostatni filtr atlasu dochodzi do samej krawedzi, co wyglada jak przypadkowe przyciecie.

### P2. Ujednolicenie breakpointow naglowka

- Nawigacja desktopowa znika przy 900 px, naglowek kompaktuje sie dopiero przy 720 px, a dolna nawigacja pojawia sie przy 640 px.
- Zakres 721-900 px ma hybrydowy uklad: duzy naglowek i hamburger. Warto kompaktowac naglowek juz razem ze zniknieciem nawigacji desktopowej.

### P3. Dlugie powierzchnie

- W monografii dodac dyskretny lokalny spis sekcji lub przycisk powrotu na gore.
- Na stronie nauki zwinac liste dziesieciu rodzajow w panelu powtorek do podsumowania z przyciskiem `Pokaz wszystkie`.
- W atlasie na telefonie mozna skompresowac cztery statystyki do jednego wiersza lub rozwijanej sekcji, aby szybciej pokazac pierwsze karty.

## Dostepnosc

Potwierdzone mocne strony: semantyczne naglowki, poprawne role zakladek i dialogow, etykiety formularzy, duze pola odpowiedzi, `prefers-reduced-motion`, pulapka fokusu, Escape i przywracanie fokusu.

Do poprawy: filtry poziomu atlasu oraz czesc przelacznikow opartych tylko na klasie `active` powinny dostac `aria-pressed`; ciemniejszy fiolet powinien byc uzywany dla fokusu i drobnego tekstu.

## Ograniczenia dowodowe

Audyt oparto na dzialajacej wersji `https://chmurnik.cloud`, pomiarach ukladu i stylow, sprawdzeniu interakcji oraz kodzie interfejsu. Zapis screenshotow z przegladarki Codexa przekraczal limit czasu, dlatego nie formuluje pelnego twierdzenia o zgodnosci z WCAG ani o wszystkich urzadzeniach.
