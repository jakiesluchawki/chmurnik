# Ocenianie: poprawki po audycie

2026-09-09, gałąź `codex/weather-preview`. Zakres obejmuje bank 28 przypadków, wspólny `TransferTrial`, zapis prób i testy. Bez zmian scen, stylów, katalogu, nawigacji ani nowego StormWorkshop. Bez commitu, push, buildu i publikacji wykonywanych przez autora tej poprawki.

## Co Zmienia Się Dla Ucznia

1. Uczeń wybiera decyzje dotyczące danych zadania. Przed przejściem do zasad widzi informację, że decyzje zostaną zapisane.
2. Wejście do pytania o zasadę zapisuje komplet decyzji i blokuje ich zmianę. „Wstecz” pozwala je obejrzeć; blokada działa również w reducerze, nie tylko przez wyłączenie kontrolek.
3. „Zmień decyzje w powtórce z pomocą” rozpoczyna osobną próbę tego samego przypadku. Pierwszy zapis zostaje zachowany, nawet jeżeli nie zawierał jeszcze zasady i nie był ukończony. Powtórka jest jawnie oznaczona jako wspomagana i znana.
4. Wskazówka, opis zdjęcia, odsłonięcie źródła i jawny podgląd rozwiązania oznaczają pomoc. Sam powrót do wcześniejszego pytania, odmontowanie komponentu lub powtórzenie efektu React nie oznaczają pomocy. Istniejące wywołania `markTransferHelp` przy dostępie do przewodnika/źródeł pozostają obsługiwane.
5. Pomoc po zapisaniu decyzji nie zmienia ich wcześniejszego statusu: wynik rozróżnia decyzje zapisane samodzielnie od wspomaganej dalszej części próby. Sam zapis decyzji nigdy nie ustawia `submitted`.

## Treść I Kolejność

- Przeredagowano wszystkie 14 zestawów zasad używanych w 28 przypadkach. Alternatywy opisują konkretne błędy: wnioskowanie z pory dnia, ignorowanie Td, mylenie pokrycia z podstawą, kierunku „do” z „z”, geometrii wykresu z danymi, składników inicjacji ze stadium komórki. Nie dopisano pustych fraz tylko w celu wyrównania długości.
- Poprawiono również szczególnie słabe alternatywy w odczycie prędkości wiatru, projekcji sondażu, tempie oblodzenia i Burzy. Usunięto z tekstów ucznia `helper`, `dry/wet`, `unstable/lift`, `possible=false`, `belowGround`, `agl=null`, `accretion` i `amount`. Pojęcia meteorologiczne oraz ograniczenia modelu pozostały.
- Identyfikatory przypadków, pól i opcji oraz wszystkie klucze poprawności są zachowane. Nie zmieniano danych liczbowych, fotografii ani adresów źródeł. Historyczne opcje mogą mieć obecnie inne brzmienie; stary wynik jawnie informuje o tym zamiast prezentować nowy tekst jako dosłowny zapis dawnej odpowiedzi.
- `orderedOptions` sortuje kopię opcji według deterministycznego skrótu identyfikatorów przypadku, pola i opcji, z jednoznacznym rozstrzyganiem kolizji. Nie używa poprawności, tekstu odpowiedzi ani wyboru ucznia. Kolejność jest taka sama po przeładowaniu oraz niezależna od kolejności wejściowej tablicy.
- Kontrola redakcyjna: poprawna zasada jest jednoznacznie najdłuższa w **8/28**, a najkrótsza w **10/28** pytań, zamiast poprzedniego 28/28 dla najdłuższej. W każdym zestawie stosunek długości najdłuższej do najkrótszej opcji nie przekracza 1,3. Pozycje poprawnych zasad mają rozkład **6/13/9**; pierwsze odpowiedzi przypadków A mają rozkład **6/6/2**, zamiast 14 odpowiedzi na pozycji drugiej. Nie jest to idealnie równy rozkład ani dowód jakości psychometrycznej.

## Zapis I Zgodność

- Pozostają dotychczasowy klucz `chmurnik:weather-transfer:v1` oraz główna rewizja zapisu 1. Nowe próby mają `qualityRevision: 2`, kopię `decisionResponse` oraz status `decisionAssisted` z chwili zapisu decyzji.
- Zamknięte stare próby zachowują odpowiedzi i status. Nie są automatycznie awansowane do potwierdzonej samodzielności według nowych reguł. Nieukończone stare próby zachowują odpowiedzi i `submitted: false`; ponieważ wcześniej mogły już odsłonić zasady, kontynuacja jest konserwatywnie oznaczona jako wcześniejsza wersja z niepotwierdzoną samodzielnością.
- `firstAttempts` przechowuje pierwsze próby niezależnie od dotychczasowej rotacji ostatnich 40 wpisów historii. Nieukończona pierwsza próba nie staje się ukończona po udanej powtórce. Nie odtwarzamy utraconej historii: jeżeli zachowały się tylko stare powtórki, żadnej nie uznajemy za brakującą pierwszą próbę.
- Równoległy, nieaktualny zapis nie może odblokować decyzji, zastąpić ich innymi wartościami ani usunąć informacji o pomocy. Zachowano ochronę zatwierdzonych odpowiedzi, generacji prób i zapis do pamięci karty przy błędzie localStorage.

## Weryfikacja

- Bezpośredni import obu modułów i transpilacja `TransferTrial.jsx`: poprawne. Próbne zatwierdzenie i odtworzenie zapisu: 14/14 aktywności.
- Nowy `tests/weather-assessment-quality.test.mjs`: **39/39**. Obejmuje wszystkie 28 kluczy, stabilną kolejność/unikalne ID, rozkłady długości i pozycji, brak żargonu w tekstach, blokadę przed zasadami, podgląd wstecz, jawny restart z pomocą, zachowanie nieukończonego oryginału, migrację starych zapisów, utraconą pierwszą próbę, rotację historii i nieaktualne zapisy.
- Testy handlerów rzeczywistego komponentu sprawdzają nieobecność zasad przed zapisem decyzji, blokadę kontrolek po powrocie, stan powtórki, wskazówki/źródła i brak fałszywej pomocy po powtórzeniu efektu. To deterministyczny harness, nie fizyczna przeglądarka ani pełny scheduler React.
- Po rozszerzeniu zakresu poprawiono trzy stare asercje w dwóch istniejących plikach. Sondaż nadal porównuje dokładne wartości z profilem i rozdziela dane od projekcji. Burza nadal sprawdza oba zestawy warunków przez model, zgodność polskich faktów i rozdzielenie inicjacji od zaniku. Test odmontowania nadal chroni szkic, realną pomoc, zatwierdzoną odpowiedź i historię, ale nie wymaga już fikcyjnego zdarzenia pomocy.
- `node --test --test-reporter=dot tests/weather-assessment-quality.test.mjs tests/learning-transfer-cases.test.mjs tests/learning-transfer-state.test.mjs`: **335/335**.
- Końcowe `npm test`: **711/711**, 0 błędów, 0 pominiętych, kod wyjścia 0. Wykonane po aktualizacji wszystkich trzech starych asercji, na współdzielonym repozytorium zawierającym również zmiany głównego agenta.
- Build i rzeczywiste QA nowego StormWorkshop należą do głównego agenta; nie przypisuję ich tej poprawce. Nie wykonywano publikacji.

## Ograniczenia

Uzupełnienie integracyjne głównego agenta: końcowe **715/715** obejmuje również
dwie regresje realnej nawigacji. Pomoc jest oznaczana przy zmianie hash/historii
i wejściu w link poza próbą, nie przez sam cleanup efektu. W przeglądarce
sprawdzono wyjście do katalogu i powrót: status zmienił się na „Próba z pomocą”,
pierwsza błędna decyzja pozostała zapisana i zablokowana. Zatwierdzone wyniki
nie są nadpisywane. Szczegóły screenshotów w `22-assessment-return-help`.

To naprawa jakości oceniania, nie przebudowa wszystkich doświadczeń. Nadal są dwa stałe przypadki na aktywność, a poprawne odpowiedzi na część pytań o brak danych powtarzają się. Samo przetasowanie opcji nie zapobiega zapamiętywaniu banku; powtórki pozostają oznaczone. Nowe dystraktory wymagają obserwacji początkujących uczniów, nie tylko kontroli długości. Nie przeprowadzono nowego niezależnego przeglądu meteorologicznego; zachowano dotychczasowe klucze i źródła. Brak deklaracji zmierzonego transferu wiedzy, opanowania tematu lub przygotowania do lotu/żeglugi.

## Zmienione Pliki

- [transfer-cases.mjs](/Volumes/Kingston-Codex/repos/Documents/Codex/2026-06-16/widzisz-jak-pracuj-niedawno-zrobili-my/chmurnik-v4/weather-preview/learning/transfer-cases.mjs:25): treści i deterministyczna kolejność opcji.
- [TransferTrial.jsx](/Volumes/Kingston-Codex/repos/Documents/Codex/2026-06-16/widzisz-jak-pracuj-niedawno-zrobili-my/chmurnik-v4/weather-preview/learning/TransferTrial.jsx:23): blokada, restart z pomocą, obsługa starszych wyników.
- [transfer-state.mjs](/Volumes/Kingston-Codex/repos/Documents/Codex/2026-06-16/widzisz-jak-pracuj-niedawno-zrobili-my/chmurnik-v4/weather-preview/learning/transfer-state.mjs:68): trwały zapis decyzji, pierwsze próby i zgodność.
- [weather-assessment-quality.test.mjs](/Volumes/Kingston-Codex/repos/Documents/Codex/2026-06-16/widzisz-jak-pracuj-niedawno-zrobili-my/chmurnik-v4/tests/weather-assessment-quality.test.mjs): nowe regresje.
- [learning-transfer-cases.test.mjs](/Volumes/Kingston-Codex/repos/Documents/Codex/2026-06-16/widzisz-jak-pracuj-niedawno-zrobili-my/chmurnik-v4/tests/learning-transfer-cases.test.mjs:269): aktualizacja asercji Sondażu i Burzy.
- [learning-transfer-state.test.mjs](/Volumes/Kingston-Codex/repos/Documents/Codex/2026-06-16/widzisz-jak-pracuj-niedawno-zrobili-my/chmurnik-v4/tests/learning-transfer-state.test.mjs:595): odmontowanie i rzeczywiste zdarzenia pomocy.
- Ten dokument: `design/workshop-rebuild-20260909/assessment-fixes.md`.
