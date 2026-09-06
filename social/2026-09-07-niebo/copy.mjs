import { stories as approved } from '../2026-09-03-full/copy.mjs';

export const title = 'Żeby niebo stawało się znajome.';
export const canonical = 'https://jakiesluchawki.github.io/chmurnik/premiera/niebo/';
export const hub = 'https://jakiesluchawki.github.io/chmurnik/assetySM/';
// The first ten stories retain the complete approved copy. The owner separately
// authorized the three factual progress updates through MIGRACJA KINGSTON.
export const updates = [
  {
    id: '11-rozpoznawanie', label: 'Rozpoznawanie', theme: 'cream',
    lead: 'Nie każda chmura daje się łatwo nazwać.',
    body: 'Rozpoznawanie w CHMURNIKU nadal wymaga poprawy. Sprawdziłem kolejne modele, ale żaden nie dał podstaw, żeby ogłosić gotową, wiarygodniejszą wersję. Dlatego obecnego modelu nie zastępuję nowym tylko po to, żeby napisać o aktualizacji.',
    note: 'Nowy model nie jest wdrożony.', stickerLabel: 'Poznaj CHMURNIK',
  },
  {
    id: '12-konsultacja', label: 'Kolejny etap', theme: 'olive',
    lead: 'Teraz potrzebujemy uważnego spojrzenia.',
    body: 'Przygotowuję zdjęcia i wyniki do konsultacji meteorologicznej. Chcę sprawdzić, gdzie myli się model, a gdzie samo zdjęcie albo jego opis nie pozwala na jednoznaczną odpowiedź. Dalsze prace nad modelem czekają na niezależną ocenę i lepsze dane.',
    note: 'Ocena specjalisty jeszcze się nie odbyła.', stickerLabel: 'Zajrzyj do atlasu',
  },
  {
    id: '13-android', label: 'Android', theme: 'pink',
    lead: 'Na Androidzie też chcę pokazać Ci niebo.',
    body: 'Wersja na Androida jest przygotowywana, ale nie ma jej jeszcze w Google Play. Przed nami formalności konta i wymagane testy. Nie podaję daty premiery, której nie mogę obiecać. Tymczasem z CHMURNIKA możesz korzystać w przeglądarce pod chmurnik.cloud.',
    note: 'Android: prace przed publikacją, nie premiera.', stickerLabel: 'Otwórz chmurnik.cloud',
  },
].map((story, index) => ({...story, number:index+11, storeUrl:'https://chmurnik.cloud/'}));
export const stories = [...approved.map(story => ({ ...story })), ...updates];
export const progressCaptions = {
  linkedin: 'CHMURNIK rośnie, ale nie każdą zmianę chcę nazywać przełomem.\n\nPrzy rozpoznawaniu chmur sprawdziłem kolejne modele i sposoby przygotowania zdjęć. Wyniki nie dały podstaw do wdrożenia nowego, wiarygodniejszego modelu. Obecna aplikacja nie dostała więc wymiany silnika pod pozorem poprawy.\n\nZamykam ten etap eksperymentów i przygotowuję materiał do konsultacji meteorologicznej. Potrzebujemy niezależnej oceny zdjęć i lepszych danych. Konsultacja jeszcze się nie odbyła i nie jest obietnicą konkretnego wyniku.\n\nRównolegle powstaje wersja na Androida. Nie jest jeszcze dostępna w Google Play: pozostają formalności konta oraz wymagane testy. Na razie bez daty premiery.\n\nA niebo można poznawać już teraz: atlas, lekcje, METAR i TAF oraz narzędzia do nauki wiatru są dostępne w CHMURNIKU. W przeglądarce: https://chmurnik.cloud\n\nDo tej opowieści przygotowałem też 20 nowych motywów tapet. Trochę nieba, które można zabrać na swój ekran.',
  facebook: 'Do CHMURNIKA wracam z kolejną porcją nieba i małym raportem z prac.\n\nRozpoznawanie chmur wciąż wymaga poprawy. Przetestowałem kolejne pomysły, ale nie mam jeszcze nowego modelu, który mógłbym uczciwie polecić jako gotowe ulepszenie. Dlatego nie podmieniam obecnego silnika. Przygotowuję zdjęcia do konsultacji meteorologicznej; kolejny etap będzie potrzebował niezależnej oceny i lepszych danych.\n\nJest też Android, na razie w przygotowaniu. Nie znajdziesz jeszcze CHMURNIKA w Google Play, bo przed nami formalności i wymagane testy. Datę podam, kiedy będzie miała oparcie w rzeczywistości.\n\nNie trzeba jednak czekać, żeby zajrzeć do atlasu chmur, przeczytać lekcję albo rozczytać METAR. CHMURNIK działa w przeglądarce: https://chmurnik.cloud\n\nA dla tych, którzy po prostu lubią mieć niebo blisko, mam 20 nowych motywów tapet na telefon i komputer. Są oryginały i wyraźnie oznaczone powiększenia 4K. Napisz, a podeślę link.',
  instagram: 'Trochę nieba i uczciwie o tym, co dalej z CHMURNIKIEM.\n\nRozpoznawanie chmur wymaga jeszcze pracy. Nowy model nie jest wdrożony: dotychczasowe próby nie dały podstaw, żeby ogłosić wiarygodniejsze rozpoznawanie. Przygotowuję materiał do konsultacji meteorologicznej, a dalszy etap będzie zależał od niezależnej oceny i lepszych danych.\n\nAndroid jest w przygotowaniu, nie w Google Play. Zostały formalności i wymagane testy, więc jeszcze bez daty premiery.\n\nTymczasem atlas, lekcje, METAR, TAF i nauka wiatru czekają w CHMURNIKU. Wersja przeglądarkowa: chmurnik.cloud.\n\nDo pobrania przygotowałem też 20 nowych motywów tapet, każdy na telefon i komputer, w oryginale i powiększonym eksporcie 4K. Napisz po link.\n\n#CHMURNIK #chmury #meteorologia #nauka #Android',
};
export const motifs = [
  ['11-zagle', 'Pod żaglami'], ['12-latawiec', 'Na końcu nitki'],
  ['13-szybowiec', 'Jeszcze kawałek nieba'], ['14-latarnia', 'Światło na brzegu'],
  ['15-kropla', 'Niebo w kropli'], ['16-dolina', 'Mgła w dolinie'],
  ['17-zagiel-chmur', 'Żagiel z powietrza'], ['18-ksiezyc', 'Kiedy robi się cicho'],
  ['19-barometr', 'Czułość na pogodę'], ['20-kompas', 'Kierunek: niebo'],
  ['21-przeswit', 'Przez prześwit'], ['22-horyzont', 'Daleki horyzont'],
  ['23-kamienie', 'Równowaga'], ['24-parasol', 'Miejsce na deszcz'],
  ['25-wstega', 'Z nurtem powietrza'], ['26-zorza', 'Światło w ruchu'],
  ['27-luneta', 'Z bliska'], ['28-wir', 'Łagodny obrót'],
  ['29-poranek', 'Zanim zacznie się dzień'], ['30-notatnik', 'Zapisane pod chmurą'],
].map(([id, title]) => ({ id, title }));

export const visuals = [
  ['art', '13-szybowiec'], ['screen', 'atlas'], ['screen', 'lesson'],
  ['screen', 'reader'], ['screen', 'reader'], ['screen', 'layers'],
  ['screen', 'layers'], ['screen', 'height'], ['screen', 'wind'], ['art', '30-notatnik'],
  ['art', '21-przeswit'], ['art', '27-luneta'], ['art', '12-latawiec'],
];
