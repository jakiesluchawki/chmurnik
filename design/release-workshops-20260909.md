# CHMURNIK 1.2.1: Pracownie Pogody

## Co Nowego

Poznawaj pogodę przez obserwację, porównywanie i własne decyzje. Dodaliśmy 14 pracowni połączonych z pełnymi lekcjami o chmurach i atmosferze.

- Sprawdź, kiedy unoszone powietrze tworzy chmurę, jak powstają mgła i bryza oraz co zmienia się przy froncie.
- Śledź ruch chmur na różnych poziomach i odkryj, dlaczego nieruchoma chmura nie zawsze oznacza brak wiatru.
- Czytaj sondaż atmosfery krok po kroku, porównuj temperaturę z punktem rosy i poznaj wykres Skew-T.
- Rozróżniaj podstawę chmur i pułap w METAR oraz obserwację i prognozę w METAR/TAF.
- Porównuj warunki powstawania oblodzenia, turbulencji i unoszenia powietrza.
- Najpierw zapisz przewidywanie, potem sprawdź obserwację i uzasadnij odpowiedź. Samodzielne próby przedstawiają inne przypadki niż przewodnik; pierwsze odpowiedzi i skorzystanie z pomocy pozostają zapisane.

Warstwy są dostępne bezpośrednio w nawigacji, wraz z wiatrem, METAR/TAF, mapami i pełnymi lekcjami. W codziennej zagadce nazwa chmury oraz powiązane podpowiedzi pozostają ukryte do odsłonięcia odpowiedzi. Poprawiliśmy obsługę na małych ekranach i powrót z pracowni do lekcji.

To aktualizacja nauki i obsługi, nie nowy model rozpoznawania chmur. Pracownie wykorzystują uproszczone przykłady szkoleniowe; nie są prognozą ani oceną bezpieczeństwa lotu lub żeglugi.

## Review Notes

CHMURNIK is a free Polish-language educational application. No login, payment or demo account is required. This release adds fourteen bundled weather-learning workshops linked both from the full lessons and back to the relevant lesson. They work locally without an external AI service. The existing on-device genus classifier is unchanged; no increased recognition accuracy is claimed.

Review the learning flow from Dzis > Pelne lekcje > Dlaczego chmura powstaje > Kiedy pojawi sie chmura? The guide asks for a prediction, lets the learner lift a parcel and observe its temperature, then asks for an evidence-based explanation. Sprawdz sie presents new cases. Saved first attempts, help and repeats are distinguished. Pracownia opens the fourteen-workshop catalogue; Lekcja returns to the associated full lesson. Compact phones preserve the lesson chapter; wide tablet/Mac layouts show all chapters.

Wind uses three observations rather than a direction-only slider: track cloud displacement, compare layers, and distinguish a stationary wave-cloud outline from air passing through it. Sounding introduces one pressure level at a time, T/Td, inversion, parcel comparison and the tilted temperature axis. METAR/TAF separates observation, forecast, base and ceiling. Hazard workshops show mechanisms and explicit limits; they do not give operational flight or sailing clearance.

The compact app navigation has Dzis, Moje niebo, Atlas and Warstwy. The daily cloud exercise conceals the answer and answer-specific actions until Odslon odpowiedz; Ukryj odpowiedz conceals them again. Existing photo import, local area proposals/inference, whole-photo saving, notes and persistence remain available. Photos and learning records stay on the device. No new data collection, paid API, accounts or permissions were added.

## Verification Limits

Release status, test results and four-agent roles are recorded separately in
workshop-expansion-20260909/verification.md. Preparing this text is not an
Apple upload, submission or approval. Screenshot dimensions were checked
against https://developer.apple.com/help/app-store-connect/reference/app-information/screenshot-specifications/.
