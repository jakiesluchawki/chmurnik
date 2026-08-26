# METAR I TAF: Obserwacja To Nie Prognoza

## Jak Sprawdzić

Otwórz `#/practice/metar`. Czytnik ma teraz tytuł **METAR i TAF bez
zgadywania** oraz pole **Wklej jeden METAR, SPECI lub TAF**.

1. Wklej raport KLVM z rozmowy, bez dopisywania słowa TAF.
2. Zobacz oznaczenie **Rozpoznano TAF · prognoza, nie obserwacja**.
3. Wybierz na osi wariant **30% · możliwy wariant**. Wiatr 25 kt i porywy
   40 kt należą do tego wariantu, nie do całego okresu prognozy.
4. Wybierz ostatnie FM: wracają przewidywane 8 kt i pułap 16000 ft.
5. Otwórz **METAR a TAF. Jak je odróżnić?**, potem **Przećwicz różnicę**.

## Zakres

- Automatyczne rozróżnianie METAR, SPECI i TAF także bez skopiowanego nagłówka.
- Czas wydania osobno od ważności; obsługa północy i przejścia miesiąca bez
  wymyślania roku, miesiąca ani aktualności.
- Oddzielne grupy bazowe, FM, BECMG, TEMPO, PROB30/40 i PROB z TEMPO.
- Wspólne, testowane dekodowanie wiatru, widzialności, chmur i zjawisk;
  dodatkowo NSW, TX/TN, uskok LLWS, AMD/COR oraz NIL/CNL.
- Jawne nieobsługiwane kody i nieprawidłowe okresy. Częściowych zmian nie
  składamy automatycznie w jeden pozornie pewny stan pogody.
- Cztery nowe ćwiczenia; łącznie osiem w pracowni METAR/TAF i szesnaście
  w trzech pracowniach. Istniejący postęp pozostaje zachowany.
- Raport KLVM jest oznaczony jako przykład przekazanego raportu, nie jako
  wymyślony pomiar ani zweryfikowana prognoza na żywo.

## Weryfikacja

154 testy przechodzą, w tym 23 nowe testy czytnika TAF. Sprawdzono dokładny
tekst użytkownika przez formularz, przełączanie grup, powrót do METAR,
błędy i anulowanie prognozy oraz powtórki ćwiczeń. Pełne przebiegi
przeglądarkowe obejmują WWW, układ iPhone'a oraz produkcyjne ścieżki `/`
i `/chmurnik/` z CSP. Dziewięć lekcji i 58 linków przechodzi kontrolę.

[Widok mobilny](qa/2026-08-26-taf/07-taf-probability-mobile.png) ·
[Oś prognozy na desktopie](qa/2026-08-26-taf/desktop-taf-timeline.png).

## Dystrybucja

Paczka Cyber_Folks: `release/chmurnik-cyberfolks-20260826-190511-taf.zip`.
ZIP ma poprawną integralność i płaską strukturę plików strony. SHA-256:
`c3b510a7c5dec48a3323676da65641723839ed31ff075db24c59e1c75524957e`.
Wgrać i rozpakować wyłącznie w `domains/chmurnik.cloud/public_html`.
Nie przesyłano plików na Cyber_Folks ani nie zmieniano DNS i innych domen.
Czytnik jest opublikowany na GitHub Pages. Poniższe wydanie iOS przygotowano
osobno po prośbie użytkownika o aktualizację aplikacji.

### iOS / TestFlight

26 sierpnia 2026 udostępniono `1.0 (20260826193304)` w istniejącej grupie
wewnętrznej. Apple: `VALID`, `IN_BETA_TESTING`; build
`25d947b1-bd46-4df2-a46a-782727067320`. Obecność właściciela w tej grupie
i powiązanie nowego builda potwierdzono przez API. Opis zmian zapisano
oddzielnie po polsku i angielsku. Grupa zewnętrzna nie została zmieniona.

Archiwum urządzeniowe i podpis przeszły weryfikację. Wszystkie 78 plików WWW
w archiwum jest identycznych z testowanym buildem root, bez prefiksu
`/chmurnik/`. SDK: iOS 26.5. Ponownie zaliczono 154 testy i dziewięć lekcji.
Wydzielony pęk podpisujący zablokowano ponownie po udanym uploadzie;
pulpit i pęk logowania pozostały bez zmian.

Nie jest to potwierdzenie testu na fizycznym telefonie. Kryteria urządzeniowe
zadania 0032 pozostają otwarte. Nie zgłoszono wydania do publicznego App Store;
[audyt gotowości](app-store-readiness-2026-08-26.md) opisuje braki w metadanych.

## Źródła

Definicje depesz i okresów: [NOAA AWC](https://aviationweather.gov/help/data/).
Semantyka FM, BECMG, TEMPO, PROB i LLWS:
[FAA AIM, Weather Formats](https://www.faa.gov/air_traffic/publications/aim_html/chap7_section_1.html).
To czytnik edukacyjny, nie oficjalny briefing ani decyzja o locie.
