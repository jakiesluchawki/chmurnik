# iPhone Duo: weryfikacja wydania 1.2.2

2 listopada 2026, iOS/iPadOS. Kompilacja `202611022235` została wysłana
do App Review. Po wysłaniu App Store Connect zwrócił `WAITING_FOR_REVIEW`
dla zgłoszenia i wersji. To nie jest potwierdzenie publikacji.

- Xcode 27.2, SDK iOS 27.2. Wszystkie 132 pliki webowe w podpisanym
  archiwum były zgodne z produkcyjnym buildem. Przeszło 937 testów Node.
- Na symulatorze iPhone Duo sprawdzono nawigację, zakrycie odpowiedzi dnia,
  zapamiętanie rozdziału, przejście lekcja–pracownia–lekcja oraz otwarcie
  i opuszczenie każdej z 14 pracowni. Przy składaniu i rozkładaniu telefonu
  ćwiczenie wiatru zachowało wybrany stan.
- Na symulatorze iPada Pro 13″ przeszły testy obrotu z zachowaniem karty
  atlasu, nawigacji oraz powrotu z pracowni do lekcji.
- Na obu symulatorach sprawdzono odmowę dostępu do aparatu, wybór dwóch
  zdjęć z biblioteki, lokalną analizę fragmentu, ręczny wybór i odczyt
  zapisanych obserwacji po ponownym uruchomieniu. Nie testowano fizycznego
  aparatu ani fizycznego Duo.
- Galerię QA należy zasilić oryginalnymi plikami
  `public/assets/clouds/{cumulus,stratocumulus}.jpg`, bez zmieniania EXIF.
  Wykorzystano izolowane biblioteki z sześcioma zdjęciami systemowymi.
- Apple przetworzył cztery zrzuty Duo (dwa na każdy ekran); zachowano
  istniejące zrzuty iPhone’a oraz iPada. Archiwum, dowody testów i
  potwierdzenia sklepu pozostają poza Git. Wydanie nie zmienia strony WWW
  ani wersji dla macOS.
