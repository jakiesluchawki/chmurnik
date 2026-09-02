export const storeUrl = 'https://apps.apple.com/pl/app/chmurnik/id6782159027';
export const galleryUrl = 'https://jakiesluchawki.github.io/chmurnik/premiera/historia/';
export const stickerArea = { x: 240, y: 1510, width: 600, height: 120 };
export const campaign = {
  title: 'Zaczęło się od kogoś bliskiego',
  publishOn: '2026-09-03',
  approvedOn: '2026-09-02',
  originSource: 'Owner-provided first-person account and exact ten-story copy approved in the conversation. The latest correction says the relative recently started powered flying. No relationship degree, location, credential or commercial outcome is inferred.',
};

const windyNote = 'Niezależna pracownia edukacyjna. Bez integracji z Windy.';
export const stories = [
  {
    id: '01-geneza', label: 'Geneza', theme: 'pink', visual: 'observer',
    lead: 'Zaczęło się od kogoś bliskiego.',
    parts: [
      'Mam w rodzinie szybownika. Ostatnio do dziobu doczepił silnik i lata jeszcze dalej.',
      'Rozpoznawanie chmur może mu się przydać, więc zrobiłem dla niego aplikację.',
      'Tak zaczął się CHMURNIK, który z czasem urósł trochę bardziej, niż planowałem.',
    ],
    stickerLabel: 'Poznaj CHMURNIK',
  },
  {
    id: '02-atlas', label: 'Atlas', theme: 'cream', demo: 'atlas',
    lead: 'Żeby niebo stawało się znajome.',
    parts: [
      'Otwórz atlas i wybierz chmurę, którą chcesz poznać.',
      'Zdjęcia są prawdziwe, a opisy podpowiedzą Ci, na co patrzeć i jak odróżnić ją od innych.',
      'Jest dziesięć rodzajów do poznania, ale najprzyjemniejszy moment przychodzi później, kiedy rozpoznajesz któryś z nich nad własną głową.',
    ],
    stickerLabel: 'Otwórz atlas chmur',
    credit: 'Fot. PiccoloNamek, Famartin i inni. Autorzy i licencje:\njakiesluchawki.github.io/chmurnik/premiera/historia/#credits',
  },
  {
    id: '03-lekcja', label: 'Lekcja', theme: 'pink', demo: 'lesson',
    lead: 'Najpierw patrz, potem nazywaj.',
    parts: [
      'To tytuł pierwszej lekcji.',
      'Przeczytaj fragment, zatrzymaj się przy pytaniu i sprawdź odpowiedź.',
      'Przyglądamy się kształtom, warstwom i światłu, żeby nazwa chmury kojarzyła się z czymś, co naprawdę widzisz, a nie tylko z hasłem do zapamiętania.',
    ],
    stickerLabel: 'Zajrzyj do lekcji',
    demoLabel: 'Fragment lekcji · prawdziwy interfejs',
  },
  {
    id: '04-metar', label: 'METAR', theme: 'violet', visual: 'metar',
    lead: 'Potem przyszła kolej na język pilotów.',
    parts: [
      'Do rozpoznawania chmur dobudowałem trening METAR.',
      'Żeby za ciągiem liter i cyfr zobaczyć to, o czym mówią: wiatr, widzialność, chmury.',
    ],
    stickerLabel: 'Poznaj trening METAR',
    note: 'Przykład do nauki, nie aktualna pogoda.',
  },
  {
    id: '05-czytnik', label: 'Czytnik', theme: 'cream', demo: 'reader',
    lead: 'Kilka znaków. Tyle pogody.',
    parts: [
      'METAR opisuje obserwację. TAF jest prognozą.',
      'Wklejasz depeszę i rozczytujesz ją po kawałku.',
      'Skróty zaczynają nabierać znaczenia.',
    ],
    stickerLabel: 'Wypróbuj czytnik',
    note: 'Przykład do nauki, nie aktualna pogoda.',
  },
  {
    id: '06-windy', label: 'Windy', theme: 'olive', visual: 'windy',
    lead: 'Mapa przyciąga wzrok. Chciałem rozumieć więcej.',
    parts: [
      'Aplikacja rosła.',
      'Dodałem pracownię czytania Windy: co oznaczają warstwy, na jakim poziomie patrzymy i czego z samego koloru jeszcze nie wiemy.',
    ],
    stickerLabel: 'Poznaj pracownię Windy', note: windyNote,
  },
  {
    id: '07-warstwy', label: 'Warstwy', theme: 'violet', demo: 'layers',
    lead: 'Kolor to dopiero początek.',
    parts: [
      'Wybierasz warstwę. Sprawdzasz, co przedstawia, w jakich jednostkach i względem czego.',
      'Potem odpowiadasz na pytanie i poznajesz wyjaśnienie.',
      'Tak ćwiczysz czytanie mapy.',
    ],
    stickerLabel: 'Przećwicz warstwy', note: windyNote,
  },
  {
    id: '08-wysokosc', label: 'Wysokość', theme: 'cream', demo: 'height',
    lead: 'Ten sam poziom. Ziemia coraz bliżej.',
    parts: [
      'Przesuwasz teren pod wybraną powierzchnią ciśnienia.',
      'Na przekroju widzisz różnicę między wysokością nad morzem a odległością od gruntu.',
      'hPa, MSL i AGL przestają być tylko skrótami.',
    ],
    stickerLabel: 'Zobacz różnicę wysokości', note: windyNote,
  },
  {
    id: '09-zagle', label: 'Żagle', theme: 'olive', demo: 'wind',
    lead: 'A potem popłynęliśmy.',
    parts: [
      'Na żagle z chłopakami zabrałem też CHMURNIKA.',
      'Przydał się moduł wiatru, bo ten, który czujesz na twarzy, zależy również od ruchu łodzi.',
      'Zmień w aplikacji kurs i prędkość jachtu, a zobaczysz, jak zmienia się wiatr pozorny.',
      'Trochę fizyki, którą na wodzie czujesz na własnej skórze.',
    ],
    stickerLabel: 'Poznaj wiatr na pokładzie', note: 'Model szkoleniowy. Telefon nie mierzy wiatru.',
  },
  {
    id: '10-zaproszenie', label: 'Zaproszenie', theme: 'pink', visual: 'observer',
    lead: 'Zrobiłem dla kogoś bliskiego. Teraz dzielę się z Tobą.',
    parts: [
      'Nie trzeba latać ani żeglować, żeby lubić patrzeć w niebo.',
      'CHMURNIK jest po to, żeby obok zachwytu znalazło się trochę zrozumienia.',
      'Chciałbym, żeby po odłożeniu telefonu zostało z Tobą coś, co zauważysz podczas następnego spaceru.',
    ],
    cta: 'CHMURNIK. Bezpłatnie na iPhone’a.',
    stickerLabel: 'Pobierz CHMURNIK',
  },
].map((story, index) => ({ ...story, number: index + 1, body: story.parts.join(' '), storeUrl, stickerArea }));

export function storyTranscript(story) {
  return `${String(story.number).padStart(2, '0')} / ${story.label}\n${story.lead}\n\n${story.body}${story.cta ? `\n\n${story.cta}` : ''}${story.note ? `\n\nMały podpis: ${story.note}` : ''}`;
}
