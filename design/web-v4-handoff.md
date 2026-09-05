# CHMURNIK: paczki WWW V4

Przygotowane 5 września 2026 z commitu `face674`. To lokalne, przetestowane
paczki. Nie zostały wdrożone na chmurnik.cloud ani GitHub Pages. Nie są nową
wersją aplikacji w App Store i nie zawierają poprawionego klasyfikatora chmur.

## Pobieranie

- [Paczka Cyber_Folks, 22,8 MB](../build/CHMURNIK-WWW-V4-CYBERFOLKS-face674.zip).
- [Pełna paczka GitHub Pages z dotychczasowymi materiałami SM, 678,1 MB](../build/CHMURNIK-WWW-V4-GITHUB-PAGES-face674.zip).

Wersja dla domeny działa pod `/`, a GitHub Pages pod `/chmurnik/`.
Nie należy zamieniać tych paczek miejscami.

## Co Zawierają

- Poprawione teksty strony, atlasu, wszystkich dziewięciu lekcji i narzędzi.
- Bezpośredni dostęp do pełnej ścieżki nauki i modułu warstw.
- Poprawkę przełączania lekcji, która wcześniej mogła dawać pusty ekran.
- Dotychczasowe zdjęcia z atrybucjami, dziennik, METAR/TAF, wiatr i ćwiczenia.
- Poprawione nazwy chmur macierzystych i wyjaśnienia terminów.

Rozpoznawanie zdjęć przez lokalne modele pozostaje funkcją wersji Apple.
Nie przedstawiamy zmian WWW jako poprawy trafności tego modelu.

## Cyber_Folks

Przed wdrożeniem zachowaj kopię obecnego katalogu domeny. Rozpakuj zawartość
paczki bez dodatkowego katalogu nadrzędnego do
`domains/chmurnik.cloud/public_html`. `index.html` oraz `.htaccess` mają trafić
bezpośrednio do tego katalogu. Sprawdź, czy menedżer plików nie pomija plików
ukrytych.

Nie czyść całego `public_html`. Paczka aktualizuje aplikację WWW, ale nie
zawiera galerii `premiera` ani `assetySM`; istniejące galerie i inne pliki mają
pozostać. Stare pliki z nazwami zawierającymi hash również można zachować na
czas przejścia użytkowników między wersjami. Przy ręcznym przesyłaniu najpierw
wgraj zasoby, a na końcu `index.html` i `service-worker.js`.

Po wdrożeniu trzeba osobno sprawdzić publiczną domenę: nową sesję oraz sesję
z istniejącym service workerem, atlas, lekcje, zapisany postęp, dziennik,
dekoder METAR/TAF i linki do materiałów SM. Testy lokalne nie potwierdzają
konfiguracji Apache ani tego, że aktualizacja trafiła na hosting.

## GitHub Pages

Pełna paczka zawiera dotychczasowe galerie pod `premiera`,
`premiera/2026-09-03`, `premiera/historia`, `premiera/astra` oraz `assetySM`.
Wszystkie 255 plików galerii porównano bajt po bajcie ze źródłami. Nie dodano
nowych tapet, nie zmieniono opublikowanych tekstów, grafik, filmów ani PDF-a.
Paczka jest artefaktem do wdrożenia, nie archiwum kodu źródłowego.

## Weryfikacja

270 testów aplikacji i audyt dziewięciu lekcji przeszły. Wszystkie 61 linków
do źródeł i atrybucji odpowiedziało poprawnie. Oba warianty produkcyjne przeszły
po 42 kombinacje trasy i rozmiaru ekranu w izolowanym Chromium, z nagłówkami
bezpieczeństwa z `.htaccess`. Sprawdzono m.in. dziennik i kopię zapasową,
dekoder i oś czasu TAF, narzędzia wiatru, mapy oraz publiczne strony informacyjne.
Trzynaście plików/tras statycznych porównano także z odpowiedziami serwera.
Oba archiwa ZIP przeszły kontrolę CRC i struktury katalogów.

Build domeny: `index-Da02l6Kr.js`. Build Pages: `index-CP55UqG5.js`.
Wspólna treść naukowa: `cloud-knowledge-D6Z4Kt1b.js`.

SHA-256:

```text
Cyber_Folks
17ddcea2267e98f41f5d716ed502e1d08f8a29709a84b3d98e8550ba15bd6baf

GitHub Pages
a4334a11c94fe689847d60fe4da76688ef578b43950c54888763566e0bf8aece
```
