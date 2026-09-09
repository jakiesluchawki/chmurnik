# Warsztat odczytu sondażu

2026-09-09. Komponent gotowy do integracji przez prowadzącego, bez zmiany routingu i bez publikacji w tym zakresie. Nie jest to deklaracja przebudowy wszystkich modułów ani odbioru mobilnego.

## Pliki i integracja

- [SoundingWorkshop.jsx](/Volumes/Kingston-Codex/repos/Documents/Codex/2026-06-16/widzisz-jak-pracuj-niedawno-zrobili-my/chmurnik-v4/weather-preview/learning/SoundingWorkshop.jsx): eksport `SoundingWorkshop({ mainSite })`, przeznaczony dla `#sondaz`. Importuje własny CSS oraz istniejący `TransferTrial`.
- [sounding-workshop.css](/Volumes/Kingston-Codex/repos/Documents/Codex/2026-06-16/widzisz-jak-pracuj-niedawno-zrobili-my/chmurnik-v4/weather-preview/learning/sounding-workshop.css): selektory ograniczone do `sounding-*`, Romie/Roobert i dotychczasowa paleta. Dwie kolumny na szerokim ekranie, scena/dane/decyzja kolejno na telefonie; bez sticky i bez animacji danych.
- [sounding-workshop.mjs](/Volumes/Kingston-Codex/repos/Documents/Codex/2026-06-16/widzisz-jak-pracuj-niedawno-zrobili-my/chmurnik-v4/weather-preview/learning/sounding-workshop.mjs): etapy, źródła, geometria, czysty reduktor i zapis postępu.
- [sounding-workshop.test.mjs](/Volumes/Kingston-Codex/repos/Documents/Codex/2026-06-16/widzisz-jak-pracuj-niedawno-zrobili-my/chmurnik-v4/tests/sounding-workshop.test.mjs): testy danych, geometrii, decyzji/pomocy/pamięci i rzeczywistego markupu React przez Vite SSR.
- Ta notatka jest piątym i ostatnim plikiem mojego zakresu. Nie zmieniałem `main.jsx`, katalogu, wspólnych stylów, poprzedniego sondażu, `TransferTrial`, native ani skryptów wydania.

`mainSite` określa bazę powrotu do `#/learn/warstwy`; istniejący `returnLesson` zachowuje prawidłowy parametr `from`. Nie ma zakodowanej domeny Pages ani sprawdzania `window.location.origin`. `#pracownia` pozostaje odnośnikiem do katalogu prowadzącego. Obsługa źródeł zewnętrznych i tych hashy w hostach natywnych należy do integracji. Komponent można renderować przez SSR bez `window` i `document`.

## Co robi uczeń

To **interpretacja danych**, nie symulacja ogrzewania, lotu balonu ani burzy. Przewodnik używa istniejącego profilu `capped-warm-sector`, bez zmiany jego liczb. Nie wyświetla diagnostycznego tytułu profilu ani zapisanych w nim etykiet chmur jako odpowiedzi.

| Etap / obserwowalny wynik | Działanie i dowód | Zapisany wybór i kontrola |
| --- | --- | --- |
| 1. Powiązać ciśnienie z temperaturą | Dotknąć poziomu 850 hPa, odczytać jeden punkt T = 18°C; początkowo bez krzywych Td/porcji/wiatru | Wybrać temperaturę, zapisać ją, dopiero potem wskazać sposób odczytu osi |
| 2. Obliczyć odstępy T–Td | Odczytać 925 i 800 hPa; obie pary liczb pozostają obok sceny | Zatwierdzić parę 5°C / 12°C i zasadę porównania na tych samych poziomach |
| 3. Rozpoznać wzrost temperatury ku górze | Porównać 18°C na 850 hPa z 20°C na 800 hPa | Po zapisaniu odczytu i uzasadnienia pojawia się nazwa inwersji i podświetlenie badanego odcinka |
| 4. Porównać porcję z otoczeniem | 700 hPa: 8/9°C; 500 hPa: −7/−8°C | Wskazać poziom z cieplejszą porcją i porównanie przy tym samym ciśnieniu; nie utożsamiać wartości poniżej zera z ujemną różnicą |
| 5. Odczytać zmianę wiatru | Na 925 hPa: z 170°, 14 kt; na 700 hPa: z 225°, 34 kt | Osobno porównać prędkość i kierunek „z”; nie wyprowadzać wiatru z nachylenia T |
| 6. Ponownie odczytać punkt po zmianie osi | Zapisać przewidywanie na 500 hPa, odblokować i nacisnąć „Pochyl osie”, śledzić prowadnicę stałej T | Wniosek o zachowaniu danych dopiero po uzasadnieniu; pełniejszy zakres 1000–200 hPa pojawia się na końcu |

Każdy etap ma jedno pytanie, cztery odpowiedzi, osobny krok uzasadnienia, dwie krótkie części objaśnienia i źródło. Podsumowanie po etapie 6 przypomina pięć zasad. Nie przypisano arbitralnego czasu trwania ani wyniku „opanowano temat”. Wartość kontrolki przygotowuje odczyt, ale sama nie zalicza etapu.

## Interakcja i geometria

Kliknięcie/dotknięcie pionowej pozycji na wykresie wybiera najbliższą dostępną próbkę. Równoważne są: lista ciśnień, przyciski wyżej/niżej, strzałki klawiatury, Home/End i PageUp/PageDown. Kontrolki alternatywne mają minimum 44 px wysokości. Wykres nie wymaga przeciągania i nie przechwytuje pionowego przewijania telefonu.

Siatka, krzywe, punkty, podświetlenie i obliczanie trafienia używają jednej funkcji współrzędnych. Wczesne etapy powiększają tylko dolny fragment profilu. Pion to logarytm ciśnienia, nie odległość w metrach. Pochylenie dodaje każdemu punktowi na tym samym ciśnieniu identyczne przesunięcie poziome; nie zmienia różnic temperatur. Etykiety nie określają położenia linii. Poza zakresem brak danych, bez ekstrapolacji; łączenie próbek nie udaje dodatkowego pomiaru.

Kolor nie jest jedynym rozróżnieniem: T ma linię ciągłą i kółko, Td krótkie kreski i kwadrat, porcja długie kreski i romb. Liczby są także w HTML i dostępnej nazwie wyboru poziomu. Nie dodano bitmapy udającej obserwację ani pełnej siatki adiabatycznej.

## Próby i pomoc

Przewodnik ma własny klucz `chmurnik:sounding-workshop:v1`. Zapisuje bieżący etap i szkic, pierwszy zatwierdzony odczyt, pierwsze uzasadnienie, dwa osobne statusy pomocy i późniejsze próby. Odczyt zostaje zablokowany przed pokazaniem opcji uzasadnienia. Pomoc otwarta później nie przepisuje wcześniejszego statusu odczytu. Pierwszy zapis pozostaje poza obrotową historią ostatnich 60 prób; niedokończonego pierwszego uzasadnienia nie zastępuje późniejsza powtórka. Pierwszy zapis można porównać po ukończeniu powtórki, nie przed jej odpowiedzią.

Swobodny odczyt jest bez oceny; wejście do niego zaznacza pomoc w otwartym kroku przewodnika. Tryb niezależny montuje **tylko** istniejący `TransferTrial activityId="sondaz"`, bez wykresu przewodnika i jego objaśnień. Zadania używają pierwszego profilu, z innymi liczbami. Powrót przyciskiem do przewodnika/eksploracji jawnie wywołuje `markTransferHelp("sondaz")`; odnośniki obsługuje istniejący kontrakt `TransferTrial`. Nie resetuję wcześniejszych niezależnych wyników użytkownika.

Błąd magazynu nie jest sukcesem zapisu: pokazuje komunikat o postępie dostępnym tylko w otwartym warsztacie. Nie testowano konfliktów równoległej edycji przewodnika w wielu kartach; nie deklaruję synchronizacji wielokartowej. Niezależne zadania zachowują własny, istniejący mechanizm pamięci i konfliktów.

## Podstawa źródłowa

Źródła sprawdzono 2026-09-09; są przypięte do odpowiednich etapów, dodatkowo dostępne w stopce. Liczby ćwiczeń pochodzą z lokalnego profilu syntetycznego, nie z NWS/FAA.

- Oś ciśnienia, izotermy, odrębność krzywej otoczenia i porcji oraz ograniczenia przestrzenno-czasowe: [NWS, Skew-T Parameters](https://www.weather.gov/source/zhu/ZHU_Training_Page/convective_parameters/skewt/skewtinfo.html). Nie przenoszono operacyjnych progów ani reguł gwarantujących wystąpienie burzy z dalszych części tej strony.
- Relacja T–Td i charakter danych radiosondy: [NOAA JetStream, Skew-T Plots](https://www.noaa.gov/jetstream/upperair/skew-t-plots). Treść sprawdzona w indeksowanej kopii oficjalnego serwisu NOAA; bezpośrednie pobranie głównej domeny zwróciło 403. Prowadzący powinien zweryfikować otwieranie tego odnośnika w docelowym hoście.
- Wzrost temperatury z wysokością i ograniczenie mieszania: [NWS, Marine Layer Information](https://www.weather.gov/source/zhu/ZHU_Training_Page/clouds/stratus_form_dissipate/Marine_Layer.html).
- Kierunek określa napływ, nie odpływ: [NWS, Wind / Wind Direction](https://forecast.weather.gov/glossary.php?word=WIND).
- Dalsza lektura lotnicza: [FAA-H-8083-28B, Aviation Weather Handbook](https://www.faa.gov/regulationspolicies/handbooksmanuals/aviation/faa-h-8083-28b-aviation-weather-handbook). Zweryfikowana oficjalna strona wydania z kwietnia 2026. Narzędzie odmówiło pobrania pełnego PDF ze względu na rozmiar; nie twierdzę, że przeczytałem jego rozdziały ani nie przypisuję mu niezweryfikowanych cytatów.

## Weryfikacja

Nowy zestaw: **22/22**. Rozszerzony przebieg po poprawkach: **354/354**.

```sh
node --test tests/sounding-workshop.test.mjs tests/learning-expansion.test.mjs tests/learning-transfer-cases.test.mjs tests/learning-transfer-state.test.mjs tests/layers-workshops.test.mjs tests/weather-evidence.test.mjs
```

Weryfikacja obejmuje niezmienione dane i stare API sondażu, wszystkie sześć decyzji, logarytmiczne odstępy, trafienia/klawiaturę, brak danych poza zakresem, niezmienniki pochylenia, blokady, błędną pierwszą odpowiedź, późniejszą pomoc, powtórkę i odtworzenie zapisu. SSR sprawdza faktyczny DOM każdej fazy: widoczne liczby przed `details`, brak wniosków i opcji uzasadnienia przed odczytem, blokadę pochylenia, pojedynczy punkt na starcie i brak danych przewodnika w niezależnym zadaniu. PostCSS sprawdza ograniczenie selektorów do nowego warsztatu.

Nie wykonywałem browser QA, pomiarów layoutu, testów fizycznego dotyku, VoiceOver ani sprawdzania iOS/macOS. Nie uruchamiałem buildów wydaniowych, nie robiłem commitów/push, ZIP ani zgłoszenia sklepowego. Rozszerzona zgoda właściciela na dalsze wydania nie zmienia podziału pracy: te czynności prowadzi agent integrujący.

## Kontrola integracyjna prowadzącego

Przejść sześć etapów przy 320/390 px i na szerokim ekranie, także z błędną odpowiedzią. Sprawdzić kliknięcie wykresu oraz listę poziomów, klawiaturę, focus po zapisie i przejściu kroku, powiększony tekst, pochylenie 500 hPa i powrót. Zweryfikować bliskość sceny/danych/akcji na krótkim telefonie, małe odległości dolnych próbek na pełnej skali i brak kolizji legendy. Sprawdzić reload między odczytem a uzasadnieniem, pomoc po odczycie, porównanie pierwszej próby po powtórce oraz wyjście z otwartego `TransferTrial` do przewodnika. Kontrola odnośników i trwałości WebView należy do testów hosta. Zaliczone testy kodu nie zastępują tej ścieżki ani obserwacji początkującego ucznia.
