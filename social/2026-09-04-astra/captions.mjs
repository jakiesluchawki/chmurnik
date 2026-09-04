import { campaign } from './copy.mjs';

export const captions = [
  {
    id: 'instagram', title: 'Instagram · opis karuzeli',
    text: `W tym niebie jest trochę Astry.

Od pewnego czasu pracuję z Astrą, nowym modelem OpenAI. Dziś mogę pokazać, co z tej pracy zostało w CHMURNIKU.

Zaczynałem z GPT‑5.5. Później aplikacja rosła, a największą pomoc Astry poczułem przy dopracowywaniu tego, co sprawia, że chce się do niej wracać: rozpoznawania chmur, nawigacji i układu ekranów. Z jej pomocą przygotowałem też wersję na iPada.

Pod miękkimi kolorami jest konkret: atlas z prawdziwymi zdjęciami, lekcje, METAR, TAF i ćwiczenia z wiatrem. A przy rozpoznawaniu chmur jest również miejsce na wątpliwość. Zdjęcie nie mówi wszystkiego, więc aplikacja podpowiada, na co spojrzeć, zamiast obiecywać nieomylność.

I ważne: Astra pomogła mi zbudować ten mechanizm, ale nie ogląda Waszych zdjęć. Ich rozpoznawanie działa lokalnie na iPhonie i iPadzie.

Przesuń karuzelę. Opowiadam w niej, co się zmieniło i dlaczego.

CHMURNIK jest już na iPhone’a i iPada. Możesz też zajrzeć na chmurnik.cloud. Linki do pobrania i WWW dodaję w profilu.

Najbardziej zależy mi na tym, co zauważysz już po odłożeniu telefonu.

#CHMURNIK #Astra #OpenAI #Chmury #Meteorologia`,
  },
  {
    id: 'facebook', title: 'Facebook · cały post',
    text: `W tym niebie jest trochę Astry.

CHMURNIK dostał ostatnio sporo zmian. Część widać od razu, inne schowały się pod miękkimi kolorami. Pomagała mi przy nich Astra, nowy model OpenAI, z którym pracuję już od pewnego czasu.

Zaczynałem budować tę aplikację z GPT‑5.5. Z pomocą Astry przebudowałem silnik rozpoznawania chmur, dopracowałem nawigację i przygotowałem wersję na iPada. Chciałem, żeby między zdjęciem, atlasem i ćwiczeniami można było przechodzić swobodnie. Żeby aplikacja pomagała poznawać niebo, zamiast wymagać poznawania samej aplikacji.

W atlasie czekają prawdziwe zdjęcia chmur, w lekcjach można sprawdzić, co już się rozumie. METAR opisuje obserwację. TAF jest prognozą. Wklejasz depeszę i rozczytujesz ją po kawałku. Skróty zaczynają nabierać znaczenia. Są też ćwiczenia z wiatrem i pracownia Windy, która pomaga zrozumieć to, co oglądamy na mapach pogody.

Nie musisz zaczynać od instalacji. Jest wersja WWW, pod adresem, który nadal bardzo mnie cieszy:
${campaign.webUrl}

A jeśli wolisz mieć CHMURNIKA w kieszeni albo na iPadzie:
${campaign.storeUrl}

Rozpoznawanie zdjęć na iPhonie i iPadzie odbywa się na urządzeniu. Astra pomogła mi je zbudować, ale nie ogląda zdjęć użytkowników. A wyniki są podpowiedziami, nie wyrokiem: nie każde niebo mieści się w jednej odpowiedzi.

Zajrzyj do atlasu, przejdź fragment lekcji, a potem spójrz przez okno. Ciekaw jestem, co zauważysz.`,
  },
  {
    id: 'linkedin', title: 'LinkedIn · cały post',
    documentTitle: 'CHMURNIK: w tym niebie jest trochę Astry',
    text: `Największą pomoc Astry poczułem nie wtedy, gdy CHMURNIK zaczął lepiej wyglądać, ale gdy zaczął lepiej służyć.

Od pewnego czasu pracuję z Astrą, nowym modelem OpenAI. Dziś mogę opowiedzieć o konkretnym efekcie: aplikacji do poznawania chmur i pogody, którą rozwijam pod nazwą CHMURNIK.

Projekt zaczął się jeszcze przy GPT‑5.5. Z pomocą Astry przebudowałem silnik rozpoznawania chmur, dopracowałem nawigację i układ ekranów oraz przygotowałem wersję na iPada.

Najciekawsza była dla mnie praca nad granicami odpowiedzi. Zdjęcie nie mówi wszystkiego, rozpoznanie może być błędne, a na jednym niebie można zobaczyć więcej niż jeden rodzaj chmur. Dlatego aplikacja pokazuje możliwe rozpoznania i cechy, którym warto się przyjrzeć. Ma pomagać uczyć się obserwacji, nie udawać nieomylność.

Jest tu też ważne rozróżnienie: używałem Astry przy tworzeniu aplikacji, ale model nie analizuje zdjęć jej użytkowników. Rozpoznawanie na iPhonie i iPadzie działa lokalnie, bez wysyłania fotografii na serwer.

Obok niego są atlas z prawdziwymi zdjęciami, lekcje, METAR, TAF, ćwiczenia z wiatrem i pracownia Windy. Miękka forma, konkretna treść. Dużo pracy poszło w to, żeby techniczne szczegóły nie stawały się przeszkodą w korzystaniu.

W załączonej karuzeli pokazuję tę opowieść w dziesięciu planszach. Samą aplikację można poznawać również w przeglądarce:
${campaign.webUrl}

Wersja na iPhone’a i iPada:
${campaign.storeUrl}

Dla mnie to ciekawy etap pracy z AI: mniej skupienia na samym generowaniu, więcej na dopracowywaniu produktu, z którego ktoś naprawdę będzie korzystał.

A w przypadku CHMURNIKA także na tym, co zauważy po odłożeniu telefonu.

#CHMURNIK #Astra #OpenAI #ProductDesign`,
  },
];

export const facebook = {
  lead: 'W tym niebie jest trochę Astry.',
  body: 'Z jej pomocą dopracowałem CHMURNIKA.\nAtlas chmur, nauka pogody i więcej miejsca\nna uważne patrzenie.',
  cta: 'Poznaj na chmurnik.cloud',
  alt: 'Różowa plansza CHMURNIKA. Miękka biała chmura na tle fioletowej gwiazdy. Nagłówek: W tym niebie jest trochę Astry. Podpis o dopracowaniu aplikacji oraz adres chmurnik.cloud.',
};
