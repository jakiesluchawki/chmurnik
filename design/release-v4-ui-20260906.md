# CHMURNIK 1.2: Aktualizacja Interfejsu I Nauki

Stan: przygotowanie wydania na iPhone'a, iPada i Maca. Nie jest to informacja
o wysłaniu ani zatwierdzeniu aktualizacji przez Apple. Wersja 1.1 pozostaje
opublikowana na obu platformach; odczyt Apple z 6 września, 10:49 CEST.

## Co Nowego

W tej wersji łatwiej porównasz swoje zdjęcie z atlasem i znajdziesz wyjaśnienie,
którego potrzebujesz.

- Po wybraniu zdjęcia aplikacja proponuje obszary chmur. Możesz dotknąć jednego
  z nich albo samodzielnie wskazać fragment, który chcesz obejrzeć, bez suwaków
  do kadrowania.
- Wynik pokazuje, co warto sprawdzić na zdjęciu, i wyraźniej oddziela przypuszczenie
  modelu od potwierdzonej przez Ciebie obserwacji. Porównanie z atlasem zachowuje
  Twoje zdjęcie, a zapis w Moim niebie obejmuje cały kadr.
- Pełne lekcje, w tym moduł warstw atmosfery, są łatwiej dostępne. Czytanie można
  kontynuować od zapisanego rozdziału.
- Przeredagowaliśmy teksty atlasu, lekcji, METAR/TAF oraz narzędzi związanych
  z wiatrem i mapami. Instrukcje wyjaśniają, co możesz zrobić i jak odczytać wynik.
- Poprawiliśmy układ okna analizy zdjęcia oraz obsługę na małych i szerokich ekranach.

Rozpoznawanie pozostaje eksperymentalną pomocą w nauce. Ta aktualizacja nie
zastępuje modelu rozpoznawania rodzajów chmur i nie oznacza zwiększonej trafności.
Analiza zdjęć odbywa się na urządzeniu. Nie służy do podejmowania decyzji
o bezpieczeństwie lotu ani żeglugi.

## Informacje Dla TestFlight

Sprawdź wybór zdjęcia, proponowane obszary i ręczne wskazanie chmury. Porównaj
swój kadr ze zdjęciem atlasowym, zapisz obserwację z własną notatką, zamknij
aplikację i otwórz ją ponownie. Zdjęcie oraz notatka powinny pozostać w Moim niebie.
Hipoteza modelu nie powinna samoczynnie zmienić się w potwierdzone rozpoznanie.

W Nauka otwórz pełną lekcję warstw atmosfery, przejdź do kolejnego rozdziału
i sprawdź powrót do tego miejsca po ponownym uruchomieniu aplikacji. Na iPadzie
sprawdź obrót ekranu; na Macu zmianę szerokości okna i obsługę klawiaturą.

Model rodzajów chmur pozostaje dotychczasowy. Proponowanie obszarów oraz analiza
wybranego fragmentu są oznaczone jako eksperymentalne. Podczas testów nie oceniaj
samego wyglądu odpowiedzi jako dowodu poprawnego rozpoznania.

## Zakres I Ograniczenia

- Wydanie użytkowe i badania nad nowym klasyfikatorem są od tej chwili prowadzone
  osobno, zgodnie z poleceniem właściciela z 6 września.
- Zachowujemy istniejący zespół klasyfikatorów 3.0 i jego wagi. Wyniki dla wybranego
  obszaru nie uzyskały osobnej kalibracji, więc pozostają niepotwierdzonymi hipotezami.
- Model proponujący obszary nie jest nowym modelem rodzajów chmur. Obszary są
  pomocą w wyborze fragmentu zdjęcia, a nie granicami chmur potwierdzonymi przez eksperta.
- Opublikowany 5 września GitHub Pages zawiera już dużą część zmian tekstowych
  i edukacyjnych. Hosting chmurnik.cloud wymaga osobnego porównania z paczką;
  nie zakładamy, że aktualizacja Pages zmieniła ten hosting.
- Nie zmieniamy deklaracji prywatności, DSA, cen, praw do materiałów ani odbiorców
  TestFlight. Nowa wersja zachowuje dotychczasowy tryb publikacji po akceptacji Apple.
- Całość tekstów do wglądu: [Przegląd tekstów V4](copy-v4-review.md), wraz ze wszystkimi
  powiązanymi rozdziałami. Ten dokument nie zastępuje pełnej redakcji.

## Kontrola Wydania

- [x] Aktualne testy kodu i lekcji oraz build produkcyjny: 272/272 testy kodu,
  9 modułów lekcji, build Vite z `index-DRnTagjr.js` i `index-CNpHOjaI.css`.
  Powtórzona kontrola 6 września po zaliczonym teście Maca.
- [x] Zweryfikowana obsługa zdjęcia i trwałość zapisu na Macu: natywny test
  `test07IsolatedMacPhotoAndPersistence` zaliczony 6 września o 11:07 CEST,
  1 zaliczony, 0 błędów, 0 pominiętych. Import publicznego zdjęcia, lokalne
  propozycje i analiza, zapis całego kadru i dodatkowej notatki, odczyt po
  ponownym uruchomieniu. Osobna aplikacja QA, bez danych użytkownika.
- [ ] Rewizja bieżącego zakresu iPhone/iPad oraz pozostałych ograniczeń sprzętowych.
- [ ] Podpisane archiwa i porównanie zawartości z przetestowanym kandydatem.
- [ ] Kontrola podpisów SDK na Macu, bez powrotu błędu ITMS-91065.
- [ ] Wysłanie i odczyt statusów przetwarzania Apple.
- [ ] Informacje o wersji, właściwe buildy i zrzuty ekranu.
- [ ] Zgłoszenie wersji do recenzji i potwierdzenie rzeczywistego stanu.

Żaden powyższy punkt nie stanowi twierdzenia, że nowy klasyfikator został zatwierdzony.
