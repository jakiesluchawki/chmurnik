export const date = '2026-09-14';
export const webUrl = 'https://chmurnik.cloud/';
export const title = 'Zaproszenie do wspólnego patrzenia w niebo.';
export const ps = 'PS. Chcę też poprawić model rozpoznawania chmur. Mam gotowy panel z 33 zdjęciami do niezależnej oceny. Jeśli masz doświadczenie w rozpoznawaniu chmur i zechcesz pomóc, napisz do mnie prywatnie. Udostępnię Ci dostęp do panelu.';

export const groups = [
  {
    id: 'ppl', name: 'PPL, SPL - licencja pilota (private pilot license worldwide).',
    url: 'https://www.facebook.com/groups/323986091578028/',
    visibility: 'Prywatna, widoczna', members: 'około 12,5 tys.',
    activity: '79 postów w ostatnim miesiącu, według sekcji Informacje.',
    status: 'Pierwszy wybór', post: 'ppl',
    fit: 'Kursanci i osoby zainteresowane licencją pilota. Najlepiej pasuje konkretny opis nauki METAR/TAF i rozpoznawania chmur.',
    rules: 'Regulamin dopuszcza ogłoszenia, ale ponawianie ich częściej niż raz w miesiącu traktuje jako spam. Nie wolno wyłączać komentarzy. Przed publikacją sprawdź, czy zasady się nie zmieniły.',
    evidence: 'Odczytano publicznie dostępne Informacje i regulamin grupy. Nie czytano prywatnej dyskusji ani nie dołączano do grupy.',
  },
  {
    id: 'szybownicy', name: 'SZYBOWNICY',
    url: 'https://www.facebook.com/groups/szybownicy/',
    visibility: 'Prywatna, widoczna', members: 'około 9 tys.',
    activity: '62 posty w ostatnim miesiącu, według sekcji Informacje.',
    status: 'Bardzo dobry temat; najpierw administrator', post: 'szybownicy',
    fit: 'Najbliższa genezie CHMURNIKA. Opis grupy mówi o termice i chmurach; tutaj ważniejsza będzie nauka obserwacji niż ogólna prezentacja aplikacji.',
    rules: 'Opis grupy wskazuje osobny kontakt do współpracy i reklamy. To nie jest potwierdzenie zgody na post autora aplikacji. Najpierw wyślij administratorowi krótki opis i zapytaj o zgodę.',
    evidence: 'Odczytano opis, widoczność, aktywność i dostępne zasady uprzejmej dyskusji. Zgoda na publikację nie została uzyskana.',
  },
  {
    id: 'zeglarze', name: 'Żeglarze',
    url: 'https://www.facebook.com/groups/287558007940267/',
    visibility: 'Publiczna', members: 'około 5,5 tys.',
    activity: 'Widoczne bieżące wpisy szkół żeglarstwa, materiały edukacyjne i oferty czarterów. Nie ustalono aktywności miesięcznej.',
    status: 'Druga grupa odbiorców; sprawdź regulamin', post: 'zeglarze',
    fit: 'Wiatr, bryza, mgła i czytanie map. W widocznym fragmencie dyskusji jest dużo ofert, więc post powinien zaczynać się od osobistego doświadczenia i konkretnej wartości edukacyjnej.',
    rules: 'Nie udało się dokończyć odczytu regulaminu. Obecność cudzych ofert nie daje automatycznie zgody na własną publikację. Sprawdź zasady po wejściu do grupy lub zapytaj administratora.',
    evidence: 'Potwierdzono nazwę, adres, publiczny status i liczbę członków na stronie grupy. Dalszy odczyt został zatrzymany przez kontrolę uprawnień narzędzia.',
  },
  {
    id: 'lotnictwo', name: 'lotnictwo.net.pl - dyskusyjna grupa miłośników lotnictwa',
    url: 'https://www.facebook.com/groups/512893772443109/',
    visibility: 'Publiczna według widocznego posta', members: 'niezweryfikowana',
    activity: 'Niezweryfikowana. Dostępny publiczny wpis nie wystarcza do oceny obecnej aktywności.',
    status: 'Rezerwa, po sprawdzeniu zasad', post: 'lotnictwo',
    fit: 'Szersze grono pasjonatów lotnictwa, nie tylko osoby w trakcie szkolenia. Mniej skrótów na początku, więcej o tym, co można samemu sprawdzić.',
    rules: 'Strona główna wymagała logowania; nie potwierdzono aktualnego regulaminu. Nie publikuj na podstawie samego dopasowania tematycznego.',
    evidence: 'Nazwa i odsyłacz do grupy oraz publiczny status były widoczne w jej poście: https://www.facebook.com/groups/lnetpl/posts/2574477656284700/ . Nie ustalono zasad ani aktualnej wielkości grupy.',
  },
];

export const posts = [
  {
    id: 'ppl', audience: 'Kursanci PPL i SPL', images: ['05', '02'],
    use: 'Do zweryfikowanej grupy PPL/SPL. Dwie plansze, w kolejności METAR i powstawanie chmury.',
    text: `Cześć, mam w rodzinie szybownika i od chęci pomocy mu w rozpoznawaniu chmur zaczął się CHMURNIK. Później doszedł trening METAR/TAF. Pomyślałem, że może przydać się również komuś, kto właśnie porządkuje sobie meteorologię podczas szkolenia.

Jestem autorem aplikacji. Przygotowałem atlas z prawdziwymi zdjęciami, lekcje oraz interaktywne ćwiczenia: można rozczytywać depesze po kawałku, porównać podstawę najniższej chmury z pułapem albo sprawdzić, co dzieje się z temperaturą unoszonego powietrza. Zależało mi na połączeniu skrótów i definicji z czymś, co da się zobaczyć i zrozumieć.

Wersja WWW jest bezpłatna i działa bez zakładania konta, także na telefonie z Androidem: ${webUrl}

To pomoc do nauki, nie zamiennik instruktora, oficjalnych materiałów ani briefingu przed lotem. Jeśli zajrzycie, chętnie przeczytam, co podczas nauki meteorologii było dla Was najmniej zrozumiałe. Takie uwagi bardzo pomagają mi rozwijać ten projekt.

${ps}`,
  },
  {
    id: 'szybownicy', audience: 'Szybownicy', images: ['04', '02', '06'],
    use: 'Po zgodzie administratora. Zacznij od planszy o chmurze falowej; dwie kolejne są opcjonalne.',
    text: `Cześć, CHMURNIK zaczął się od szybownika w mojej rodzinie. Chciałem przygotować dla niego wygodną pomoc w rozpoznawaniu chmur. Z czasem sam coraz bardziej wciągałem się w pytanie, dlaczego niebo wygląda właśnie tak, a nie inaczej.

Dziś jest tam atlas z prawdziwymi fotografiami, pełne lekcje i pracownie, w których można sprawdzić zależności: jak wilgotność wpływa na pojawienie się chmury przy unoszeniu powietrza, dlaczego chmura falowa może pozostawać w miejscu mimo przepływu oraz co pokazuje pionowy profil atmosfery.

Udostępniłem wersję przeglądarkową bezpłatnie, bez rejestracji: ${webUrl}

Nie traktuję tego jako narzędzia do wyboru warunków do lotu. To materiał do nauki i uważniejszej obserwacji. Będę wdzięczny za spojrzenie osób, dla których czytanie nieba jest częścią latania: co warto wytłumaczyć lepiej, a gdzie uproszczenie może wprowadzać w błąd? Mam nadzieję, że przyda się też komuś na początku tej drogi.

${ps}`,
  },
  {
    id: 'zeglarze', audience: 'Żeglarze', images: ['03', '04'],
    use: 'Po sprawdzeniu regulaminu grupy Żeglarze. Dwie plansze: wybrzeże i ruch powietrza.',
    text: `Cześć, podczas wyjazdu na żagle z kolegami przydał mi się moduł o wietrze, który wcześniej dobudowałem do własnej aplikacji. Tak CHMURNIK, początkowo pomyślany jako pomoc w rozpoznawaniu chmur dla szybownika w rodzinie, znalazł też swoje miejsce nad wodą.

Rozwijam go jako narzędzie do zrozumienia pogody. Można prześledzić powstawanie bryzy, zobaczyć związek między chłodzeniem wilgotnego powietrza a mgłą, poćwiczyć czytanie warstw map Windy i zajrzeć do atlasu prawdziwych chmur. W ćwiczeniach zmieniasz warunki i obserwujesz skutek, zamiast tylko czytać definicję.

Można korzystać bezpłatnie, bez konta i bez instalowania aplikacji: ${webUrl}

To nie serwis z prognozą ani podpowiedź, czy bezpiecznie wypływać. Chciałem zrobić coś, co pomaga lepiej rozumieć to, co widzimy nad wodą. Jeśli macie chwilę, zapraszam do zajrzenia. Ciekawi mnie też, które zjawiska najtrudniej było Wam połączyć z tym, czego uczyliście się o pogodzie.

${ps}`,
  },
  {
    id: 'lotnictwo', audience: 'Pasjonaci lotnictwa', images: ['02', '05'],
    use: 'Wariant rezerwowy dla lotnictwo.net.pl, po sprawdzeniu regulaminu. Nie publikuj jednocześnie we wszystkich grupach lotniczych.',
    text: `Cześć, chciałbym pokazać Wam mój poboczny projekt, który wyrósł z lotniczej historii w rodzinie. Mam bliską osobę latającą na szybowcach i chciałem pomóc jej w nauce rozpoznawania chmur. Tak powstał CHMURNIK.

Od atlasu doszedłem do lekcji i interaktywnych pracowni. Można w nich unosić porcję powietrza i obserwować, kiedy zaczyna tworzyć się chmura, porównywać wiatr na różnych wysokościach albo połączyć lotniczy raport pogodowy z obrazem nieba. Jest też pomoc w czytaniu METAR i TAF, czyli obserwacji pogody na lotnisku i prognozy lotniskowej.

Zależało mi, żeby pogoda przestała być tylko zestawem nazw i skrótów, a zaczęła układać się w zrozumiałą całość. Wersję WWW udostępniłem bezpłatnie i bez rejestracji: ${webUrl}

Zapraszam, jeśli macie ochotę sprawdzić. Nie jest to narzędzie do planowania lotu; to miejsce do nauki. Chętnie przyjmę uwagi, szczególnie o tym, co nadal jest niejasne dla osoby, która dopiero wchodzi w temat.

${ps}`,
  },
  {
    id: 'pogoda', audience: 'Obserwatorzy pogody i chmur', images: ['02', '06'],
    use: 'Wariant do grupy pogodowej, do której już należysz lub którą wskażesz. Nie przypisuję go do niezweryfikowanej grupy ani fanpage’a.',
    text: `Cześć, od pewnego czasu rozwijam CHMURNIK, autorską aplikację do poznawania chmur i procesów, które kształtują pogodę. Zaczęło się od chęci pomocy szybownikowi w rodzinie. Potem okazało się, że samo pytanie „co to za chmura?” otwiera sporo kolejnych: skąd się wzięła, co mówi o powietrzu i czego nie da się wywnioskować z jednego zdjęcia.

Przygotowałem atlas z prawdziwymi fotografiami, lekcje oraz interaktywne pracownie dotyczące między innymi kondensacji, mgły, bryzy, frontów i pionowego profilu atmosfery. Można zmieniać warunki, porównywać wyniki i sprawdzać własne rozumowanie. Przy ćwiczeniach są źródła i opis ich ograniczeń.

Całość w przeglądarce jest dostępna bezpłatnie, bez zakładania konta: ${webUrl}

Nie chcę udawać serwisu prognostycznego ani zastępować wiedzy obserwatorów. Chciałem ułatwić wejście w temat i zachęcić do uważniejszego patrzenia. Jeśli znajdziecie coś przydatnego, będzie mi miło; jeśli coś jest nieprecyzyjne, chętnie się temu przyjrzę.

${ps}`,
  },
];

export const adminMessage = `Dzień dobry, jestem autorem CHMURNIKA, aplikacji do nauki o chmurach i pogodzie. Projekt zaczął się od chęci pomocy szybownikowi w rodzinie; wersja WWW jest bezpłatna i nie wymaga konta: ${webUrl}

Czy mogę zamieścić w grupie jeden krótki post z dwiema planszami, opisem przydatnych dla jej członków funkcji i zaproszeniem do korzystania? Na końcu chciałbym dodać PS z prośbą o kontakt do osób doświadczonych w rozpoznawaniu chmur, które mogłyby ocenić 33 zdjęcia w gotowym panelu.

Nie planuję ponawiania wpisu ani zbierania kontaktów do newslettera. Jeśli taki post nie pasuje do zasad grupy, uszanuję to.`;

export const guidance = [
  'Zacznij od jednej grupy lotniczej: PPL/SPL. SZYBOWNICY i lotnictwo.net.pl to alternatywy lub późniejszy etap, nie trzy publikacje tego samego dnia do podobnych osób.',
  'Po kilku dniach, kiedy będziesz mieć czas na rozmowę w komentarzach, spróbuj grupy Żeglarze. Najpierw potwierdź regulamin. Terminy są propozycją, nie obietnicą większego zasięgu.',
  'Dołącz dwie plansze dobrane do tematu. Wariant dla szybowników ma trzecią opcjonalną. To ilustracje z istniejącej, zaakceptowanej serii, nie zdjęcia obserwacyjne ani zrzuty działającego interfejsu.',
  'Pisz z własnego profilu i ujawniaj autorstwo. Bez stwierdzenia „to nie reklama”, sztucznych rekomendacji, hashtagów w każdym zdaniu i prośby „admin usuń, jeśli nie wolno”. Bezpłatny projekt nadal może podlegać zasadom autopromocji.',
  'Wklej jeden link do chmurnik.cloud. Nie ukrywaj go w komentarzu, żeby obejść regulamin. Nie wysyłaj nieproszonych wiadomości do członków grupy.',
  'Odpowiadaj na konkretne pytania i uwagi. Jeżeli ktoś prosi o diagnozę chmury lub decyzję o locie, nie przedstawiaj wyniku aplikacji jako pewnej oceny ani zgody na lot.',
  'Nie ponawiaj tego samego wpisu tylko dlatego, że nie zebrał reakcji. Zapisz link do własnego posta i rzeczowe uwagi. Porównuj jakość rozmów; bez osobnego pomiaru nie przypisuj pobrań aplikacji konkretnej grupie.',
  'PS jest zaproszeniem do dobrowolnej oceny 33 zdjęć. Dostęp do panelu udostępniaj prywatnie osobom, które same się zgłoszą. Nigdy nie wklejaj kont ani haseł w poście.',
];
