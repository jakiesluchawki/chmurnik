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
   rozmiaru i klawiaturę. Przeciąganie korzysta z układu współrzędnych
   obrazu, nie z położenia okna ani orientacji urządzenia.
3. **Co dostaje model.** Miniatura pokazuje ten sam znormalizowany wycinek
   oryginału, z którego powstaje JPEG. Przejścia między propozycjami
   trwają 150 ms. Podczas gestu geometria podąża bez przejścia; przy
   ograniczeniu ruchu selektor nie stosuje animacji. Przy niemal czarnym
   wycinku można zmienić kadr lub zapisać zdjęcie bez przypisywania nazwy.
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
- **Zdjęcia na urządzeniach testowych:** na symulatorach iPhone’a Duo i iPada
  Pro 13″ oraz na Macu sprawdzono wybór zdjęcia, analizę prawdziwym modelem
  i zachowanie obserwacji po ponownym uruchomieniu. Na iPadzie włączono
  systemową redukcję ruchu; na Duo animacje były włączone.
- **Próba ręczna klawiatury iPada:** podczas iteracji nad uchwytem,
  po otwarciu zdjęcia z systemowej biblioteki,
  zaznaczono chmurę i wskazano róg ramki. Dwa naciśnięcia strzałki
  w lewo, bez dalszego dotykania zdjęcia, zmniejszyły szerokość ramki
  z 649 do 561 pikseli na natywnych zrzutach 2064 × 2752. Lewa
  krawędź pozostała na x = 651. Zmienił się też podgląd wycinka.
  Test regresji `test12PhotoKeyboard` najpierw sprawdza klawiaturę w zwykłym
  polu wyszukiwarki, a następnie mierzy, czy zmienia ona rozmiar wycinka,
  nie przesuwając jego lewego górnego rogu. **Otwarta usterka:** na końcowej
  kompilacji iPadOS 27.2 wyszukiwarka odebrała klawisze, ale po powrocie
  z systemowej biblioteki klawisz zwiększenia nie powiększył ramki w XCTest.
  Wynik ręczny nie zastępuje tego testu. Przed wysyłką 1.2.3 należy
  potwierdzić powtarzalne działanie na iPadzie z zewnętrzną klawiaturą.
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
