# CHMURNIK V4: teksty rozpoznawania ze zdjęcia

Stan: 5 września 2026. Pełny zestaw dla tej ścieżki, łącznie z tekstami
pozostawionymi bez zmian. To materiał do przeglądu, nie potwierdzenie jakości
modelu ani gotowości wydania. Wariant wybranego fragmentu nie ma jeszcze
zatwierdzonej kalibracji, dlatego nie pokazuje nazwy jako pewnego wyniku.
Układ po ostatnich zmianach wymaga sprawdzenia na urządzeniach.

Teksty stron startowych i wprowadzeń do warsztatów są zebrane w
[poprzednim zestawie](copy-v4-entry-review.md). Atlas, pełne lekcje, METAR/TAF,
wiatr i pozostałe ekrany nadal wymagają osobnego, pełnego przeglądu. Ten plik
nie oznacza zakończenia redakcji całej aplikacji.

## 1. Początek

Etykieta: **Wersja eksperymentalna**

Tytuł: **Rozpoznawanie ze zdjęcia**

Prywatność:

> Zdjęcie zostaje na urządzeniu. Analiza działa lokalnie i nie wysyła fotografii na serwer.

Wprowadzenie: **Wybierz zdjęcie chmur**

> CHMURNIK zaproponuje fragmenty do sprawdzenia. Wybierzesz jeden z nich lub wskażesz chmurę samodzielnie. Najlepsze będzie wyraźne zdjęcie zrobione za dnia.

Przyciski:

- **Zrób zdjęcie**; po wybraniu fotografii: **Zrób nowe**.
- **Wybierz z biblioteki** na iPhonie i iPadzie.
- **Wybierz plik zdjęcia** na Macu, bez przycisku aparatu.
- Dostępna nazwa przycisku zamknięcia: **Zamknij rozpoznawanie**.

## 2. Wybór fragmentu

Zdjęcie ma opis dostępności: **Całe własne zdjęcie nieba, bez przycinania**.

Podczas szukania obszarów:

> Szukam obszarów chmur na zdjęciu. Zdjęcie nie opuszcza urządzenia.

Gdy są propozycje:

> Dotknij numeru, żeby zobaczyć proponowany fragment, albo wskaż inne miejsce na zdjęciu. Ramka pokazuje obszar analizy, nie dokładny obrys chmury.

Gdy model obszarów nie zwrócił propozycji:

> Nie udało się wyznaczyć osobnych obszarów. To nie znaczy, że nie ma chmur. Dotknij miejsca na zdjęciu, które chcesz sprawdzić.

Gdy automatyczny wybór jest niedostępny:

> Automatyczny wybór obszarów jest niedostępny. Dotknij miejsca na zdjęciu, które chcesz sprawdzić.

Przyciski wyboru: **Fragment 1**, **Fragment 2**, do **Fragment 5**.
Znaczniki mają dostępne nazwy **Zaznacz proponowany fragment 1** itd.
Powierzchnia zdjęcia: **Wskaż miejsce na zdjęciu; strzałki przesuwają wybór**.

Przy ręcznym wyborze można zmienić zasięg ramki:

- **Bliżej**
- **Fragment**
- **Więcej kontekstu**

Działania: **Sprawdź zaznaczony fragment** i **Usuń zaznaczenie**.

Podczas analizy:

> Analizuję zaznaczony fragment na urządzeniu…

Przycisk w trakcie pracy: **Analizuję fragment…**.

Po analizie:

> Wynik dotyczy zaznaczonego fragmentu. Całe zdjęcie pozostaje w obserwacji.

## 3. Wynik z propozycjami

Etykieta: **Wynik analizy**

Tytuł: **Nie udało się rozpoznać rodzaju chmury**

> Model nie potrafi wybrać jednej nazwy. Poniżej możesz porównać swoje zdjęcie z propozycjami z atlasu. Żadna z nich nie jest potwierdzonym rozpoznaniem.

Gdy nie ma żadnej propozycji:

> Model nie podał propozycji do porównania. Możesz zaznaczyć inny fragment zdjęcia, rozpoznać chmurę po jej cechach albo zapisać obserwację bez nazwy.

## 4. Niepewny wynik z przewagą „bezchmurnego nieba”

Tytuł: **Brak wiarygodnej podpowiedzi**

> Ten wynik nie wystarcza, żeby wskazać rodzaj chmury ani potwierdzić bezchmurne niebo. Jeśli widzisz chmurę, zaznacz ją na zdjęciu albo przejdź do rozpoznawania po cechach.

Nie pokazujemy słabych pozostałych wyników jako propozycji chmur. Nie zamieniamy
tego stanu w rozpoznanie bezchmurnego nieba. Dostępne działanie:
**Rozpoznaj po cechach chmury**. Zapis fotografii nadal pozostaje dostępny.

## 5. Stany zależne od wiarygodności modelu

Poniższe teksty należą do pełnego zestawu, ale ich istnienie w kodzie nie
oznacza, że nowy model lub ocena jakości zdjęcia zostały zatwierdzone.

### Hipoteza spełniająca kryteria modelu

Etykieta: **Wskazówka modelu**

Tytuł: **Najbardziej pasuje {nazwa chmury}**

> To hipoteza do sprawdzenia. {Krótki opis danej chmury z atlasu} Porównaj te cechy ze swoim zdjęciem poniżej.

To nie jest potwierdzenie przez autora obserwacji. Wariant wybranego fragmentu
ma obecnie zablokowane przyjmowanie nazw do czasu kalibracji.

### Zaakceptowany wynik bezchmurnego nieba

Tytuł: **Bez wyraźnych chmur**

> Model wskazuje głównie niebo bez chmur. Cienkie pasma mogą jednak umknąć analizie. Jeśli je widzisz, wskaż ten fragment.

### Ograniczenie przez oświetlenie

Tytuł: **Za mało światła na rozpoznanie**

> Na tym zdjęciu trudno odczytać strukturę chmur. Możesz zachować obserwację bez rozpoznania albo spróbować wyraźniejszego ujęcia zrobionego za dnia.

Obecny kod obsługuje taki komunikat, ale nie ma jeszcze podłączonego,
zweryfikowanego detektora słabego oświetlenia. Nie reklamujemy go jako funkcji.

## 6. Porównanie z atlasem

Nagłówek: **Sprawdź podobieństwa**

Wybór fotografii: łacińska nazwa i polski opis każdej proponowanej chmury.

Podpisy zdjęć:

- **Twój wybrany fragment** albo **Twoje zdjęcie**.
- **Atlas · {nazwa chmury}**.

Pod fotografiami pozostaje opis cech widocznych na konkretnym przykładzie
atlasowym. Pochodzenie materiału:

> Fotografia atlasowa: {autor} · {licencja}. Źródło i licencja

> Podstawa opisu: {tytuły źródeł z linkami}

Działania:

- **Otwórz opisy w atlasie**
- **Sprawdź cechy krok po kroku**

Fotografie porównawcze pozostają prawdziwe, z dotychczasową atrybucją.

## 7. Szczegóły

Rozwijany nagłówek: **Szczegóły analizy i jej ograniczenia**

> To względne wyniki modelu, nie gwarancja poprawnego rozpoznania. Jedno zdjęcie może pokazywać kilka rodzajów chmur. Światło, perspektywa i kadr zmieniają wynik.

Tabela zawiera trzy najwyższe wyniki: nazwę klasy i procentowy wynik modelu.
Klasa `clear_sky` jest podpisana **Bezchmurne niebo**. Tabela pozostaje w
szczegółach także wtedy, gdy propozycje nie są pokazywane w głównej odpowiedzi.

> Model: {wersja}. Analiza lokalna, bez wysyłania zdjęcia. Wynik nie służy do podejmowania decyzji o bezpieczeństwie lotu ani żeglugi.

## 8. Zapis i ocena

Przycisk: **Zapisz w Moim niebie**; w trakcie: **Zapisuję zdjęcie…**.

> Zapiszesz całe zdjęcie wraz z dostępnym wynikiem analizy.

Niepewna obserwacja ma tytuł **Rodzaj chmury nierozstrzygnięty**, także gdy model
najwyżej ocenił klasę bezchmurnego nieba. Automatyczny zapis nie oznacza
potwierdzenia rodzaju chmury przez użytkownika.

Pytanie: **Czy wskazówka była pomocna?**

Przyciski: **Tak**, **Nie**, **Usuń**. Dostępna nazwa ostatniego:
**Usuń zapisane lokalnie oceny**.

> Oceny zostają na tym urządzeniu i nie trenują modelu.

Komunikaty:

- **Pomocna wskazówka zapisana lokalnie.**
- **Niepewny wynik zaznaczony lokalnie.**
- **Wszystkie lokalne oceny zostały usunięte.**
- **Nie udało się zachować oceny w pamięci urządzenia.**
- **Nie udało się usunąć ocen z pamięci urządzenia.**

## 9. Błędy

Zapis:

> Nie udało się zachować obserwacji. Zdjęcie nadal jest tutaj. Sprawdź wolne miejsce i spróbuj ponownie.

Analiza fragmentu:

> Nie udało się przeanalizować fragmentu. Spróbuj ponownie lub zapisz samo zdjęcie.

Przy ramce:

> Nie udało się odczytać fragmentu. Całe zdjęcie pozostaje bez zmian.

Odczyt danych:

- **Nie udało się odczytać danych zdjęcia.**
- **Aparat nie zwrócił pliku zdjęcia.**

Komunikaty uprawnień i aparatu:

- **CHMURNIK nie ma dostępu do aparatu. Włącz Aparat w Ustawieniach urządzenia. [0003]**
- **CHMURNIK nie ma dostępu do biblioteki zdjęć. Zmień dostęp w Ustawieniach urządzenia. [0005]**
- **Urządzenie nie udostępniło aparatu tej aplikacji. [0007]**
- **Aparat nie zdołał zapisać zdjęcia. Spróbuj zrobić je ponownie. [0010]**
- **Nie udało się przygotować zdjęcia do analizy. [kod]** dla błędów 0012 i 0019.
- **Nie udało się odczytać tego zdjęcia. [kod, jeśli dostępny]** dla pozostałych błędów.

Anulowanie wyboru zdjęcia nie jest wyświetlane jako awaria.

## Do sprawdzenia przed wydaniem

- Czytelność całej ścieżki na iPhonie, iPadzie i Macu.
- Dotyk, klawiatura, VoiceOver i powrót do zaznaczonego fragmentu.
- Dokładna zgodność ramki ze zdjęciem analizowanym przez model.
- Zapis i ponowne otwarcie obserwacji bez nadawania niepotwierdzonej nazwy.
- Sprawdzenie komunikatów uprawnień w rzeczywistych ustawieniach systemów.
- Kalibracja i kryteria jakości modelu. Redakcja tekstu ich nie zastępuje.
