import { stories, storeUrl, storyTranscript } from './copy.mjs';

export const captions = [
  {
    id: 'instagram-post', platform: 'instagram', title: 'Instagram / opis karuzeli',
    text: `Zaczęło się od kogoś bliskiego.\n\nMam w rodzinie szybownika. Ostatnio do dziobu doczepił silnik i lata jeszcze dalej. Rozpoznawanie chmur może mu się przydać, więc zrobiłem dla niego aplikację.\n\nTak zaczął się CHMURNIK. Potem przyszła kolej na język pilotów: trening METAR i czytnik METAR/TAF. Dodałem też pracownię czytania Windy, bo chciałem rozumieć, co właściwie pokazują te wszystkie warstwy. A na żaglach z chłopakami przydał się moduł wiatru.\n\nW karuzeli pokazuję, co z tego wyrosło: prawdziwe zdjęcia w atlasie, fragment lekcji, czytnik i pracownie, w których można coś przesunąć, sprawdzić i zrozumieć.\n\nNie trzeba latać ani żeglować, żeby lubić patrzeć w niebo. Chciałbym, żeby po odłożeniu telefonu zostało z Tobą coś, co zauważysz podczas następnego spaceru.\n\nCHMURNIK jest bezpłatny na iPhone’a. W App Store szukaj: CHMURNIK. Link do pobrania znajdziesz też w relacjach.\n\nTo narzędzia edukacyjne, nie oficjalny briefing. Pracownia Windy jest niezależna i nie ma integracji z Windy. Telefon nie mierzy wiatru.\n\n#CHMURNIK #chmury #meteorologia #żeglarstwo #lotnictwo`,
  },
  {
    id: 'linkedin-post', platform: 'linkedin', title: 'LinkedIn / cały post',
    text: `Zaczęło się od kogoś bliskiego, nie od planu na produkt.\n\nMam w rodzinie szybownika. Ostatnio do dziobu doczepił silnik i lata jeszcze dalej. Chciałem pomóc mu rozpoznawać chmury, więc zacząłem robić CHMURNIKA.\n\nPotem przyszła kolej na język pilotów. Do atlasu dobudowałem trening METAR i czytnik METAR/TAF, żeby za ciągiem liter i cyfr zobaczyć wiatr, widzialność i chmury.\n\nAplikacja rosła. Dodałem niezależną pracownię czytania Windy: warstwy, jednostki, poziomy ciśnienia i różnicę między wysokością nad morzem a odległością od gruntu. Na żaglach z chłopakami przydał się z kolei moduł wiatru rzeczywistego i pozornego.\n\nDziś to atlas z prawdziwymi zdjęciami, lekcje z pytaniami i wyjaśnieniami oraz interaktywne narzędzia do nauki. W załączonym dokumencie pokazuję tę drogę i konkretne fragmenty aplikacji.\n\nZależało mi, żeby techniczny konkret nie odbierał przyjemności patrzenia w niebo. Żeby po odłożeniu telefonu zostało coś, co można zauważyć podczas następnego spaceru.\n\nUdostępniam CHMURNIKA bezpłatnie na iPhone’a:\n${storeUrl}\n\nNie trzeba latać ani żeglować. Wystarczy ciekawość.\n\nPracownie są edukacyjne i nie zastępują oficjalnego briefingu. Nie ma integracji z Windy, a telefon nie mierzy wiatru.\n\n#CHMURNIK #meteorologia #projektowanie`,
  },
  {
    id: 'facebook-post', platform: 'facebook', title: 'Facebook / cały post',
    text: `Mam w rodzinie szybownika. Ostatnio do dziobu doczepił silnik i lata jeszcze dalej. Rozpoznawanie chmur może mu się przydać, więc zrobiłem dla niego aplikację.\n\nTak zaczął się CHMURNIK, który urósł trochę bardziej, niż planowałem.\n\nJest atlas dziesięciu rodzajów chmur z prawdziwymi zdjęciami. Są lekcje, w których można zatrzymać się przy pytaniu i sprawdzić odpowiedź. Potem doszły trening METAR, czytnik METAR/TAF i niezależna pracownia czytania Windy. A kiedy pojechałem na żagle z chłopakami, przydał się moduł wiatru.\n\nMożesz zmienić kurs i prędkość jachtu, zobaczyć, jak zmienia się wiatr pozorny, albo sprawdzić na przekroju, dlaczego ten sam poziom ciśnienia nie oznacza tej samej wysokości nad ziemią.\n\nAle nie trzeba latać ani żeglować, żeby lubić patrzeć w niebo. Chciałbym, żeby po chwili z CHMURNIKIEM zostało z Tobą coś, co zauważysz podczas następnego spaceru.\n\nZrobiłem dla kogoś bliskiego. Teraz dzielę się z Tobą.\n\nBezpłatnie na iPhone’a:\n${storeUrl}\n\nTo narzędzia do nauki, nie oficjalny briefing. Pracownia Windy nie ma integracji z Windy. Telefon nie mierzy wiatru.`,
  },
  {
    id: 'storki-pelny-tekst', platform: 'stories', title: 'Stories / pełny zatwierdzony tekst 01–10',
    text: stories.map(storyTranscript).join('\n\n────────────────────\n\n'),
  },
  {
    id: 'linki-do-storek', platform: 'stories', title: 'Stories / wszystkie naklejki Link',
    text: stories.map(story => `${String(story.number).padStart(2, '0')} / ${story.label}\nTekst naklejki: ${story.stickerLabel}\n${storeUrl}`).join('\n\n'),
  },
  {
    id: 'instagram-bio-link', platform: 'instagram', title: 'Instagram / link do profilu lub naklejki',
    text: storeUrl,
  },
];
