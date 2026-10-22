# iPhone Duo: stan przygotowania

Data: 22 października 2026. Ten dokument opisuje gałąź roboczą, nie nowe
wydanie App Store ani wdrożenie strony.

## Wymagania Apple

- Wydany CHMURNIK 1.2.1 zbudowano z iOS SDK 26.5. Według Apple taka
  aplikacja uruchomi się na iPhone Duo, ale na wewnętrznym ekranie pozostanie
  w ograniczonym oknie.
- iOS SDK 27 umożliwia dynamiczną zmianę rozmiaru, a SDK 27.1 pozwala
  wykorzystać cały ekran. Należy sprawdzić niesymetryczne obszary bezpieczne,
  różne pozycje urządzenia oraz zmianę rozmiaru w trakcie pracy.
- Od kwietnia 2027 Apple wymaga zrzutów iPhone Duo przy zgłaszaniu aplikacji.

Źródła: [przygotowanie aplikacji](https://developer.apple.com/iphone-duo/prepare/),
[wymagania publikacji i zrzutów](https://developer.apple.com/news/?id=kkphp5qo),
[omówienie testów i układu](https://developer.apple.com/videos/play/tech-talks/111461/).

## Wykonane

- Przywrócono cztery przyciski nawigacji natywnej przy szerokościach 641–900 px.
- Utrzymano dostępność planu lekcji i aktualnie czytanego rozdziału podczas
  zmiany szerokości. Dodano obsługę bocznych obszarów bezpiecznych.
- Przeszło 937 testów Node, audyt 9 lekcji, build produkcyjny oraz testy
  responsywności i przejść w Chromium i WebKit. Boczne insety w tych testach
  były symulowane, nie zmierzone na iPhone Duo.
- Zaktualizowano Xcode do 27.1. Niepodpisane kompilacje na urządzenie i na
  symulator użyły SDK 27.1; pliki webowe w obu pakietach są identyczne
  z testowanym buildem. Nie są to instalowalne wydania App Store.

## Przed wydaniem

- Instalacja systemowych składników Xcode oczekuje na autoryzację. Obecny
  CoreSimulator jest zbyt stary dla Xcode 27.1; runtime iOS 27.1 nie jest
  zainstalowany. Nie wykonano testów symulatora Duo ani zrzutów Duo.
- Zweryfikować w Device Hub widok zamknięty, rozłożony, obrócony, częściowo
  złożony i Split View. Sprawdzić faktyczne safe areas, zgięcie, klawiaturę,
  aparat, arkusz udostępniania, wtyczkę StatusBar i powroty do lekcji.
- Telefon ma obecnie deklarację tylko pionowej orientacji na zewnętrznym
  ekranie. Nie potwierdzono zachowania we wszystkich pozycjach Duo.
- Przed przesłaniem wymagana jest pełna weryfikacja natywna, poprawny podpis
  właściciela i weryfikacja pakietu. Nic z tej aktualizacji nie zostało
  wysłane do App Store ani na chmurnik.cloud.
