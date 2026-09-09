# Turbulencja: trzy kontrolowane porównania

2026-09-09. Komponent gotowy do integracji jako `#turbulencja`: named export `TurbulenceWorkshop({ mainSite })` z `weather-preview/learning/TurbulenceWorkshop.jsx`. Router, wspólne pliki, integracja natywna i wydanie pozostają po stronie zadania głównego. Nie wykonywano commitu, push, publikacji ani buildu aplikacji.

## Co Robi Uczeń

1. **Przeszkoda:** wysuwa podłoże bez zmiany napływu i ogrzewania. Przesuwa uchwyt bezpośrednio na scenie, używa strzałek klawiatury albo przycisku „Wysuń przeszkodę”. Najpierw przewiduje miejsce dodatkowych zawirowań; później porównuje szary tor A nad gładkim podłożem i fioletowy tor B nad przeszkodą oraz za nią.
2. **Ogrzewanie:** dotyka słońca nad płaskim poletkiem. Najpierw wskazuje spodziewane miejsce unoszenia; dopiero po zapisie odsłania prąd nad ogrzewanym fragmentem i ruch kompensujący obok. W eksploracji przenosi ogrzewanie na drugie poletko i sprawdza, czy miejsce unoszenia się przesuwa.
3. **Dwie warstwy:** zachowuje 10 kt na obu poziomach i obraca górny wiatr. Może przeciągnąć uchwyt wektora, użyć klawiatury, zakresu kierunku albo przycisku „Wiatr górą z północy”. Po zapisie porównuje dwa kierunki i różnicę wektorów. W eksploracji zmienia także prędkość, porównując uskok prędkościowy z kierunkowym.
4. **Nowe dane:** przechodzi do istniejącego `TransferTrial activityId="turbulencja"`. Dwa osobne przypadki wymagają rozpoznania mechanizmu i ograniczeń wnioskowania, nie odtworzenia ustawienia przewodnika. Bank, identyfikatory i API oceniania pozostały bez zmian.

Obserwowalne wyniki: lokalizacja wpływu przeszkody; wskazanie cieplnego źródła ruchu; porównanie kierunku i prędkości osobno; odmowa wyciągania prognozy intensywności z niepełnych danych. To interaktywny warsztat, nie nowa pełna lekcja z zadeklarowanym czasem czy certyfikatem opanowania tematu.

## Kolejność I Zapis

- Trzy oddzielne tryby: przewodnik, eksploracja, niezależne przypadki. Przewodnik pokazuje jeden eksperyment i jeden bieżący krok.
- „Zapisz przewidywanie” zapisuje warunki i wybór, ale **nie odsłania wyniku**. Dopiero osobne „Porównaj A i B” pokazuje tory lub różnicę wektorów i pytanie o dowód. Wyjaśnienie pojawia się po zapisaniu dowodu.
- Po zapisie nie można zmieniać warunków ani przewidywania. Blokada działa w stanie, nie tylko przez wyłączone kontrolki. Błędne przewidywanie pozostaje widoczne po poprawnym wyborze dowodu.
- Każde przewidywanie tworzy osobny rekord. Dowód i jego status pomocy są dopisywane raz; niedokończony oryginał nie staje się ukończony przez późniejszą powtórkę. Podsumowanie pokazuje pierwszy rekord każdego eksperymentu.
- `predictionHelped` i `evidenceHelped` są oddzielne. Podpowiedź po przewidywaniu nie zmienia jego wcześniejszego statusu. Powtórki są oznaczone; eksploracja oznacza odsłonięcie zasady dla oglądanego mechanizmu.
- Wspólne podsumowanie i źródła oznaczają odsłonięcie wszystkich trzech zasad. Zmiana trasy lub otwarcie linku oznacza pomoc dla bieżącej próby. Sam cleanup/powtórzenie efektu nie dopisuje pomocy; nasłuchy są odpinane.
- Wyjście z `Sprawdź się` do przewodnika/eksploracji oraz pomoc w źródłach wywołują istniejące `markTransferHelp("turbulencja")`.
- Osobny klucz `chmurnik:turbulence-workshop:v1`. Brak dostępu do zapisów fotografii i lekcji. Stan odczytywany jest przed mutacją; nieaktualny widok nie może nadpisać już zapisanej odpowiedzi. Błąd localStorage pozostawia kopię w pamięci karty i widoczne ostrzeżenie.

## Mechanika I Źródła

- [NWS Memphis: Turbulence](https://www.weather.gov/zme/safety_turb): przeszkody, ogrzewanie i różne wektory wiatru jako przyczyny zaburzeń przepływu.
- [NWS ZHU: Turbulence](https://www.weather.gov/source/zhu/ZHU_Training_Page/turbulence_stuff/turbulence/turbulence.htm): opływ przeszkód, zawietrzna strona, rola podłoża i stabilności. Nie przenoszono do warsztatu progów operacyjnych ani klas intensywności.
- [FAA Aviation Weather Handbook, 2022, rozdział 19.2](https://www.faa.gov/documentLibrary/media/Order/FAA-H-8083-28_Order_8083.28.pdf): unoszenie nad ogrzewanym podłożem, ruch kompensujący, konwekcja bez chmur. Podstawą były wyszukiwalne fragmenty oficjalnego dokumentu; pełny PDF przekracza limit odczytu narzędzia. Nie deklaruję przeglądu całego podręcznika ani aktualizacji procedur operacyjnych.

Wektor prędkości liczony jest z meteorologicznego kierunku **skąd**: składowa wschodnia `-v sin(kąt)`, północna `-v cos(kąt)`. Strzałki wskazują **dokąd** płynie powietrze, w widoku z góry. Dół 200 m i góra 600 m to zadane poziomy. Różnica wektorów jest ich różnicą w kt, nie gradientem, prędkością animacji ani skalą turbulencji. Przykłady: jednakowe wektory 0 kt; 10/20 kt z zachodu daje 10 kt; 10 kt z zachodu i północy daje około 14,1 kt.

Wysunięcie przeszkody 0–100 jest skalą rysunku, nie wysokością w metrach ani aerodynamiczną długością szorstkości. Ogrzewanie 0–3 to ustawienia, nie temperatura, moc ani czas. Parametryzowane tory ilustrują zależność; nie są rozwiązaniem równań przepływu. Nie generujemy wirów ani prognozy intensywności z samego uskoku. Brak dodatkowego wymuszenia w scenie nie oznacza braku wszystkich innych ruchów atmosfery.

## Dostępność I Przenośność

- Uchwyty na scenie: min. 44 px; jawne etykiety i semantyka zakresów. Podłoże i wektor korzystają z pointer capture, anulowanie gestu przywraca warunki sprzed przeciągania. Wszystkie działania mają odpowiedniki dotykowe i klawiaturowe.
- Natywne zakresy pozostają dostępne. SVG wektorów ma wspólną skalę, a odczyty liczbowe i opis kierunków są poza grafiką.
- Krótkie kroki, jedna kolumna na telefonie, bez przyklejania ilustracji. Po przejściu fokus i przewijanie kierują do porównania albo informacji zwrotnej.
- Ograniczony ruch i niewidoczna karta zatrzymują znaczniki. Tory, strzałki, dane i tekst wyniku pozostają czytelne. Uczeń może również ręcznie zatrzymać umowny ruch.
- Styl ograniczony do klas `turb-*`, z istniejącą paletą róż/oliwka/fiolet, Romie/Roobert i miękkimi materialnymi uchwytami. Bez nowych zasobów obrazowych, usług sieciowych, audio i zależności.
- Kod renderuje się bez `window` w SSR. Link do lekcji uwzględnia `mainSite` i dozwolone `?from=`; domyślnie wraca do `zagrozenia`.

## Weryfikacja

**Potwierdzone automatycznie:**

- `node --test tests/turbulence-workshop.test.mjs`: **16/16**.
- Nowy plik plus `weather-assessment-quality`, `learning-transfer-cases`, `learning-transfer-state`: **353/353**, 0 błędów, kod wyjścia 0.
- Zakres: ciągłość i ograniczenia geometrii; lokalizacja ruchu termicznego; znane kierunki, różnice wektorów i konwersja wskaźnika; blokady kolejności; błędne pierwsze wybory; pomoc; 45 powtórek; odtworzenie; uszkodzone dane; brak nadpisania przez nieaktualny widok; awaria localStorage.
- Testy rzeczywistych handlerów: pełna ścieżka trzech doświadczeń, ukrycie wyniku i dowodu przed odpowiednim krokiem, wskazówki, tryby, przekazanie do `TransferTrial`, dotyk/klawiatura/anulowanie przeciągania, nawigacja i cleanup.
- SSR przez Vite bez serwera HTTP: pełny komponent i wszystkie sceny, konfiguracja, zapisane przewidywanie, obserwacja, zapisany dowód, wersja ruchoma i nieruchoma. Bez `NaN`, `Infinity`, przecieku wyjaśnienia przed dowodem.

**Do weryfikacji przez zadanie główne:** pełna ścieżka w zintegrowanej przeglądarce, ekran 320/390 px i desktop, rzeczywisty dotyk iOS oraz macOS, finalne fonty/fokus/pozycja po przewinięciu, build i wydanie. Test handlerów nie jest testem sprzętowego dotyku ani pełnego schedulera React. Zapis lokalny nie jest atomową synchronizacją między równocześnie zapisującymi kartami; nie obiecujemy odzyskania po ręcznym usunięciu danych ani utracie karty przy awarii pamięci trwałej.

Nie przeprowadzono badania z początkującymi uczniami, oceny skuteczności nauczania ani niezależnego przeglądu meteorologicznego nowego warsztatu. Nie jest to stwierdzenie gotowości całego wydania.

## Pliki

1. `weather-preview/learning/TurbulenceWorkshop.jsx`: komponent i trzy bezpośrednio sterowane sceny.
2. `weather-preview/learning/turbulence-workshop.css`: wyłącznie styl tego modułu.
3. `weather-preview/learning/turbulence-workshop.mjs`: dane dydaktyczne, geometria, wektory i lokalny zapis prób.
4. `tests/turbulence-workshop.test.mjs`: 16 testów modelu, zachowania, kontraktu i SSR.
5. `design/workshop-expansion-20260909/turbulence.md`: ten raport.
