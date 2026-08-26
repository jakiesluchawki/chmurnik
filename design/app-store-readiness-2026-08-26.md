# CHMURNIK 1.0: Gotowość Do App Store

## Wniosek

Zakres produktu wystarcza na wartościowe 1.0: prawdziwy atlas chmur,
prywatna kolekcja obserwacji, lokalny asystent zdjęć i praktyczne lekcje
METAR/TAF, wiatru oraz map. Nie potrzebujemy kolejnego dużego modułu przed
premierą. Nie jesteśmy jeszcze gotowi do wysłania tej wersji do App Review.

Wniosek dotyczy gotowości wydania, nie przewiduje decyzji Apple. Aparat,
lokalne pliki kolekcji, analiza Core ML i systemowe udostępnianie nadają
aplikacji funkcje wykraczające poza samą witrynę; nie gwarantuje to akceptacji.

## Stan Sprawdzony W App Store Connect

Odczyt API: 26 sierpnia 2026, 19:37 UTC. Aplikacja `6782159027`,
`cloud.chmurnik.app`. Nie zmieniano ustawień publikacji ani karty sklepowej.

| Element | Wynik |
| --- | --- |
| Wersja sklepowa | 1.0, `PREPARE_FOR_SUBMISSION` |
| Język podstawowy | Polski |
| Build przypięty do wersji sklepowej | Brak |
| Opis | Pusty |
| Zrzuty ekranu | 0 |
| URL wsparcia | Brak |
| URL polityki prywatności | Brak |
| Kategoria główna | Brak |
| Kwestionariusz wieku | Odpowiedzi nieuzupełnione |
| Deklaracja praw do treści | Brak |
| Copyright | Brak |
| Informacje dla App Review | Brak kontaktu i instrukcji w wersji sklepowej |
| Tryb publikacji | `AFTER_APPROVAL`; niczego nie zgłoszono |

Podtytuł, słowa kluczowe i opcjonalny adres marketingowy także są puste.
Istnieje rekord harmonogramu ceny, ale jego obecność nie potwierdza ceny
ani terytoriów. Odczyt dostępności zwrócił 404. Opublikowane odpowiedzi
App Privacy, bieżące umowy konta i status przedsiębiorcy w UE nie zostały
potwierdzone w tym audycie. Nie oznacza to automatycznie, że są niepoprawne.

## Otwarta Bramka Jakości

154 testy automatyczne i kontrola dziewięciu lekcji przechodzą. TAF został
sprawdzony w przeglądarce, również w układzie telefonu i z produkcyjnym CSP.
Podpisane archiwum `1.0 (20260826193304)` zawiera dokładnie te same 78 plików
WWW co testowany build root; używa SDK iOS 26.5. Upload do Apple powiódł się.
To nie jest dowód przetestowania aparatu ani kolekcji na fizycznym iPhonie.

Przed oficjalnym wydaniem trzeba zamknąć test urządzeniowy zadania 0032:

1. Wykonać kopię dziennika przed aktualizacją ze starszej wersji, sprawdzić
   migrację i liczbę zachowanych obserwacji.
2. Kilka razy wykonać i anulować zdjęcie, wybrać zdjęcie z biblioteki,
   zapisać obserwację, zamknąć aplikację i ponownie otworzyć kolekcję.
3. Sprawdzić odmowę i zmianę uprawnień, powrót z tła, pracę offline,
   eksport/przywrócenie i błędy przy ograniczonym miejscu.
4. Sprawdzić VoiceOver, większy tekst i czytelność; zweryfikować działanie
   na deklarowanych wspieranych wersjach iOS, nie tylko w najnowszym SDK.
5. Wkleić rzeczywisty przykład KLVM: TAF ma osobne FM i PROB30, bez
   pozornej obserwacji bieżącej. Następnie sprawdzić METAR i rundę ćwiczeń.

## Przygotowanie Publikacji

- Robocze polskie teksty: `app-store-metadata-pl-draft.json`. Nie są jeszcze
  wysłane do App Store Connect. Nie obiecują pomiarów na żywo ani pewnego AI.
- Wykonać aktualne zrzuty rzeczywistej aplikacji, nie makiety, dla wymaganych
  rozmiarów. Pokazać atlas, kolekcję i użyteczne pracownie.
- Przygotować prawdziwą politykę prywatności i stronę wsparcia; udostępnić
  politykę także wewnątrz aplikacji. W odczytanym kodzie nie znaleziono jej
  dedykowanego odnośnika. Nie zastępować jej samym komunikatem o lokalnym AI.
- Sprawdzić rzeczywisty przepływ danych: zdjęcia i inferencja lokalnie,
  systemowe kopie, świadomy eksport, pobierane materiały atlasu oraz otwierane
  serwisy zewnętrzne. Na tej podstawie uzupełnić App Privacy, nie zgadywać.
- Potwierdzić atrybucje fotografii i licencje osadzanych fontów Romie/Roobert.
  W katalogu fontów nie ma dokumentu licencji; to brak dowodu w repozytorium,
  nie stwierdzenie naruszenia praw.
- Uzupełnić kategorię, kwestionariusz wieku, copyright, prawa do treści,
  kontakt dla recenzenta, cenę i kraje dystrybucji. Potwierdzić umowy oraz
  status wymagany do dystrybucji w UE z właścicielem konta.
- Po przyjęciu testu urządzeniowego przypiąć właściwy build i zgłosić
  wydanie do App Review. Przed zgłoszeniem świadomie wybrać publikację
  ręczną albo automatyczną po akceptacji; obecny domyślny tryb jest automatyczny.

Pozostałe prace zapisano w zadaniu 0033, zależnym od przyjęcia 0032.
Nie uruchomiono automatycznej publikacji ani zewnętrznej promocji bety.

## Źródła Apple

- [Kompletność, funkcje aplikacji i prywatność: 2.1, 4.2, 5.1.1](https://developer.apple.com/app-store/review/guidelines/).
- [Wymagane dane i wybór builda przed zgłoszeniem](https://developer.apple.com/help/app-store-connect/manage-submissions-to-app-review/submit-an-app/).
- [Polityka prywatności i odpowiedzi App Privacy](https://developer.apple.com/help/app-store-connect/manage-app-information/manage-app-privacy/).
- [Aktualne wymagania SDK](https://developer.apple.com/app-store/submitting/).
