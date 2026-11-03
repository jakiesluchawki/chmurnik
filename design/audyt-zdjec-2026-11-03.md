# CHMURNIK: od zdjęcia do wskazówki

3 listopada 2026. Podczas sprawdzenia publiczny sklep w Polsce udostępniał
1.2.1; zgłoszenie iOS 1.2.2 dla Duo miało status `WAITING_FOR_REVIEW`.
Poniższe zmiany nie należą do tej wysłanej kompilacji.

## Przebieg i poprawki

1. **Wybór zdjęcia.** Na iPhonie i iPadzie można wejść do biblioteki
   prosto z ekranu Dziś, bez otwierania aparatu. Wybrane zdjęcie nie znika
   po przypadkowym dotknięciu tła okna. Nadal można jawnie zamknąć okno.
2. **Wybór chmury.** Dotknięcie zdjęcia ustawia kwadrat; numer wybiera
   propozycję detektora. Wnętrze ramki można chwycić i przesunąć, a prawym
   dolnym rogiem zmienić rozmiar. Zachowano zwykłe dotknięcie, przyciski
   rozmiaru i klawiaturę. Dotknięcie innej chmury wewnątrz obecnej ramki
   zmienia środek kadru bez zmiany skali. Dotknięcie środkowego uchwytu
   tylko nadaje mu fokus. Przeciąganie korzysta z układu współrzędnych
   obrazu, nie z położenia okna ani orientacji urządzenia.
3. **Co dostaje model.** Miniatura pokazuje ten sam znormalizowany wycinek
   oryginału, z którego powstaje JPEG. Przejścia między propozycjami
   trwają 150 ms. Podczas gestu geometria podąża bez przejścia; przy
   ograniczeniu ruchu selektor nie stosuje animacji. Przy niemal czarnym
   wycinku można zmienić kadr lub zapisać zdjęcie bez przypisywania nazwy.
   Test przeglądarkowy odtwarza kadr z położenia widocznej ramki i porównuje
   piksele z gotowym JPEG-em w jego rzeczywistej rozdzielczości. Dla
   obu prób średnia bezwzględna różnica kanałów RGB była poniżej 4/255.
4. **Wynik i powrót.** W wersji wyjściowej zaznaczenie drugiego fragmentu
   nie usuwało wyniku pierwszego. Po poprawce zmiana usuwa wynik, jego
   współrzędne i ocenę wskazówki. Bez nowej analizy zapisuje się zdjęcie
   bez starej hipotezy. Dowolny rodzaj można porównać z atlasem obok
   własnego wycinka; ręczny wybór nie staje się wynikiem modelu.

## Co zmieniło się w rozpoznawaniu

Wykorzystano 30 istniejących fotografii atlasowych (po trzy na rodzaj),
detektor obszarów i oba klasyfikatory Core ML z aplikacji. Detektor
znalazł 68 propozycji na 29 zdjęciach. Korekta geometrii objęła większą
część proponowanego obszaru w **18 z 68** przypadków; w żadnym nie
zmniejszyła pola przecięcia z propozycją. To poprawa kadrowania, nie dowód
lepszej identyfikacji rodzaju.

Dla pierwszej propozycji z każdego zdjęcia policzono, czy etykieta całej
fotografii występuje wśród maksymalnie dwóch nazw do porównania.
**Przed: 20/29. Po: 20/29.** Wszystkie trzy zdjęcia Altostratus i wszystkie
trzy Stratocumulus były poza podpowiedziami po korekcie. Dla jednego zdjęcia
Cirrus nie było propozycji, ale nadal można wskazać obszar ręcznie.
Etykieta całego zdjęcia nie weryfikuje rodzaju każdej chmury w wycinku.
To porównanie na znanym atlasie, nie niezależny pomiar trafności w terenie.
Nie wymieniano wag ani nie obniżano progu akceptacji wycinków.
Sensowny kolejny sprawdzian to niezależne fotografie z zaznaczonymi przez
meteorologów obszarami. Oceniać należy ten sam wycinek przed i po zmianie,
osobno dla każdego rodzaju, dopuszczając odpowiedź „nie da się rozpoznać”.
Zdjęcia użyte do strojenia nie powinny trafić do końcowego pomiaru.

Powtórzenie na Macu z Xcode, w katalogu projektu:

```sh
node scripts/check-photo-model.mjs /ścieżka/do/App.app /prywatny/katalog/wynik.json
```

## Zakres audytu

- **Kompilacja kontrolna iOS/iPadOS:** 1.2.3 (202611031202), niewysłana do sklepu.
  Wszystkie 941 testów Node przeszło. W paczkach iOS/iPadOS i macOS
  sprawdzono zgodność 132 plików interfejsu z tym samym buildem WWW.
- **Zdjęcia na iOS i iPadOS:** `test03PhotoLibraryAndPersistentObservation`
  przeszedł na symulatorach iPhone’a Duo i iPada Pro 13″ (M5), oba z systemem
  27.2. Na każdym wybrano dwa różne zdjęcia z biblioteki, wykonano analizę
  lokalnym modelem i odczytano zapisane obserwacje po restarcie aplikacji.
  Na iPadzie włączono systemową redukcję ruchu; na Duo animacje były włączone.
- **Mac Catalyst:** test importu, analizy i zapisu przeszedł na wcześniejszej
  kompilacji. W dwóch próbach na ostatniej kompilacji XCTest nie odnalazł
  systemowego okna wyboru pliku (`open-panel`). Nie potwierdzono na niej
  importu zdjęcia ani dalszych kroków. Sam wynik nie rozstrzyga, czy przyczyna
  leży w aplikacji, czy w sposobie odnajdywania okna przez test.
- **Klawiatura po zamknięciu systemowego wybieraka zdjęć:** na iPadOS 27.2
  WebKit po dotknięciu rogu przenosił fokus na całe okno. Samo przywrócenie
  fokusu w HTML nie wystarczało. Aplikacja przywraca teraz fokus zaznaczonego
  uchwytu i obsługuje klawisze przez UIKit tylko, gdy aktywny jest ten uchwyt.
  W teście `test12PhotoKeyboard` jedno naciśnięcie zwiększa bok dokładnie
  o 4% krótszego boku zdjęcia, bez przesunięcia zakotwiczonego narożnika;
  strzałka cofa zmianę. Po dotknięciu środka strzałka przesuwa ramkę
  o 5% szerokości zdjęcia bez skalowania. Po zamknięciu zdjęcia znak
  `=` trafia ponownie do wyszukiwarki atlasu. Na końcowej kompilacji
  ten sam test przeszedł po dwóch uruchomieniach aplikacji: z redukcją
  ruchu i bez niej. To próba w symulatorze
  z rzeczywistym wybierakiem i syntetyzowanymi klawiszami, nie test
  fizycznej klawiatury Bluetooth.
- **Atlas:** 177 sprawdzeń kart, terminów, podpisów, źródeł i rozmiarów ekranu.
- **Nauka:** 9 lekcji, 156 sprawdzeń rozdziałów i szerokości oraz otwieranie
  i opuszczanie wszystkich 14 pracowni na Duo.
- **Obserwacje i narzędzia:** zapis, modyfikacja, odczyt po restarcie,
  pocztówka, usuwanie, kopia i przywrócenie; ścieżki METAR/TAF, wiatr,
  mapy, źródła, pomoc i prywatność. Zweryfikowano 61 adresów źródłowych.
- **Dostępność:** sprawdzono klawiaturę i ograniczenie ruchu oraz
  28 przypadków obsługi fokusu w oknach. Naprawiono link „Przejdź do treści”,
  który wchodził w konflikt z nawigacją opartą na fragmencie adresu URL.
  Nie jest to certyfikacja WCAG ani próba z użytkownikami VoiceOver.
- **Granice:** testy mobilne korzystają z symulatorów oraz dwóch prawdziwych
  zdjęć z izolowanej biblioteki; nie obejmują optyki fizycznego aparatu.
  Fotografia użyta w demonstracji: [GoldenMedows, PiccoloNamek](https://commons.wikimedia.org/wiki/File:GoldenMedows.jpg),
  [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0/); prezentacja
  obejmuje kadrowanie i nakładkę interfejsu.
