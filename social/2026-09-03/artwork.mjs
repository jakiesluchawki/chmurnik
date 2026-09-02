export const storeUrl = 'https://apps.apple.com/pl/app/chmurnik/id6782159027';
export const stickerArea = { x: 240, y: 1510, width: 600, height: 120 };
export const campaign = { publishOn: '2026-09-03', title: 'Skąd się wziął CHMURNIK', originSource: 'First-person account supplied by the owner on 2026-09-02. No name, relation degree, flight credential, or location was inferred.' };
const logo = '<img class="wordmark" src="/public/brand/chmurnik-wordmark.png" alt="CHMURNIK">';
const header = (label, number) => `<header data-safe>${logo}<span>${label} / 0${number}</span></header>`;
const credit = '<p class="credit" data-safe>Fot. PiccoloNamek · CC BY-SA 3.0<br>Źródło i licencja: chmurnik.cloud → Atlas → Cirrus</p>';
const screen = (file, label) => `<figure class="phone"><img src="/design/app-store/screenshots/${file}" alt="${label}"></figure>`;

export const artworks = [
  {
    id: 'jutro-01-geneza', title: '01 / Pilot w rodzinie', stickerLabel: 'Poznaj CHMURNIK',
    alt: 'Różowa storka. Najpierw był pilot w rodzinie: szybownik, który robi teraz kurs PPL. Chmurnik powstał, żeby pomóc mu rozpoznawać chmury. Autentyczny ekran atlasu iOS.',
    sources: ['owner-origin-story-2026-09-02', 'public/brand/chmurnik-wordmark.png', 'design/app-store/screenshots/03-atlas.png'],
    content: `${header('OD TEGO SIĘ ZACZĘŁO', 1)}<h1 data-safe>Najpierw był<br>pilot w rodzinie.</h1>
      <div class="story-copy" data-safe><p>Szybownik.<br>Teraz robi kurs PPL.</p><p>Chciałem mu pomóc<br>rozpoznawać chmury.</p></div>
      ${screen('03-atlas.png', 'Prawdziwy ekran atlasu Cirrus w aplikacji iOS')}
      <p class="closing" data-safe>Tak zaczął się CHMURNIK.</p>${credit}`,
  },
  {
    id: 'jutro-02-metar', title: '02 / Z chmur do METAR-u', stickerLabel: 'Zajrzyj do pracowni',
    alt: 'Kremowa storka o rozwoju aplikacji. Potem doszedł trening METAR. Czytnik METAR i TAF oraz ćwiczenia pomagają oddzielić obserwację od prognozy. Prawdziwy ekran czytnika TAF z przykładem, nie aktualną pogodą.',
    sources: ['owner-origin-story-2026-09-02', 'public/brand/chmurnik-wordmark.png', 'design/app-store/screenshots/05-taf.png', 'src/components/FieldPractice.jsx'],
    content: `${header('JEDEN POMYSŁ WIĘCEJ', 2)}<h1 data-safe>Potem doszedł<br>trening METAR.</h1>
      <div class="story-copy" data-safe><p>Bo chmury to<br>dopiero początek.</p><p class="detail">Czytnik METAR i TAF.<br>Obserwacja a prognoza.<br>Ćwiczenia z wyjaśnieniem.</p><p class="aside">Tak wygląda<br>czytnik TAF obok.</p></div>
      ${screen('05-taf.png', 'Prawdziwy ekran czytnika TAF z aplikacji iOS')}
      <p class="closing" data-safe>Mniej zgadywania. Więcej rozumienia.</p>
      <p class="note" data-safe>Przykład do nauki, nie aktualna pogoda.<br>Nie zastępuje oficjalnego briefingu.</p>`,
  },
  {
    id: 'jutro-03-windy', title: '03 / A potem Windy', stickerLabel: 'Naucz się czytać mapy', demo: 'windy',
    alt: 'Fioletowa storka o pracowni czytania Windy. Aplikacja wyszła fajnie, więc doszła nauka warstw, modeli i czasu. Demo prawdziwego laboratorium CHMURNIKA z fikcyjnymi danymi, nie integracja ani dane Windy.',
    sources: ['owner-origin-story-2026-09-02', 'public/brand/chmurnik-wordmark.png', 'social/2026-09-03/captures/windy.png', 'src/components/FieldPractice.jsx'],
    content: `${header('SKORO JUŻ DZIAŁA…', 3)}<h1 data-safe>A potem<br>dołączyło Windy.</h1>
      <p class="intro" data-safe>Apka wyszła fajnie. Dobudowałem więc<br>pracownię czytania warstw i modeli.</p>
      <p class="demo-label" data-safe>POZIOM · MODEL · CZAS</p>
      <div class="demo-frame"><img src="/social/2026-09-03/captures/windy.png" alt="Prawdziwy panel szkoleniowy CHMURNIKA: poziom, model i czas"></div>
      <p class="closing" data-safe>Ta sama pinezka. Inna odpowiedź.</p>
      <p class="note" data-safe>Niezależna pracownia. Fikcyjne dane do ćwiczeń.<br>To nie mapa ani dane z Windy.</p>`,
  },
  {
    id: 'jutro-04-zagle', title: '04 / Wiatr przydał się na żaglach', stickerLabel: 'Sprawdź pracownię wiatru', demo: 'wind',
    alt: 'Oliwkowa storka. A potem pojechałem na żagle. Podczas wyjazdu z chłopakami przydał się moduł wiatru. Prawdziwe demo zmian kierunku dziobu i prędkości jachtu w szkoleniowym modelu wiatru pozornego.',
    sources: ['owner-origin-story-2026-09-02', 'public/brand/chmurnik-wordmark.png', 'social/2026-09-03/captures/wind.png', 'src/components/FieldPractice.jsx'],
    content: `${header('SPRAWDZONE Z CIEKAWOŚCI', 4)}<h1 data-safe>A potem<br>pojechałem na żagle.</h1>
      <p class="intro" data-safe>Na wyjeździe z chłopakami<br>przydał się moduł wiatru.</p>
      <p class="demo-label" data-safe>ZMIENIASZ KURS. WIDZISZ RÓŻNICĘ.</p>
      <div class="demo-frame"><img src="/social/2026-09-03/captures/wind.png" alt="Autentyczna pracownia wiatru z kierunkiem dziobu, prędkością jachtu i wiatrem pozornym"></div>
      <p class="closing" data-safe>Wiatr rzeczywisty i pozorny. W ruchu.</p>
      <p class="note" data-safe>Model szkoleniowy. Telefon nie mierzy tu wiatru.<br>Nie zastępuje oficjalnego briefingu.</p>`,
  },
  {
    id: 'jutro-05-dla-was', title: '05 / Zrobiony dla bliskich. Dostępny dla Was.', stickerLabel: 'Pobierz CHMURNIK za darmo',
    alt: 'Kremowa storka z filcowym okiem CHMURNIKA. Zrobiłem dla kogoś bliskiego. Udostępniam Wam. Atlas, zdjęcia i obserwacje, METAR, TAF, Windy i wiatr. Bezpłatnie na iPhone’a, bez reklam i konta.',
    sources: ['owner-origin-story-2026-09-02', 'public/brand/chmurnik-wordmark.png', 'public/assets/observer-guide-still-life.png', 'src/data/app-information.js'],
    content: `${header('TERAZ WASZA KOLEJ', 5)}<h1 data-safe>Zrobiłem dla<br>kogoś bliskiego.<br>Udostępniam Wam.</h1>
      <img class="observer" src="/public/assets/observer-guide-still-life.png" alt="Dekoracyjny filcowy obiekt CHMURNIKA w kształcie oka">
      <p class="feature-list" data-safe>Atlas. Twoje zdjęcia i obserwacje.<br>METAR / TAF. Windy. Wiatr.</p>
      <p class="closing" data-safe>Bezpłatnie na iPhone’a.</p>
      <p class="note" data-safe>Bez reklam. Bez zakładania konta.<br>Z ciekawości, dla ciekawych.</p>`,
  },
].map(item => ({ ...item, format: 'story', storeUrl, stickerArea }));

export function artworkHtml(artwork, css) {
  return `<!doctype html><html lang="pl"><head><meta charset="utf-8"><title>${artwork.title}</title><style>${css}</style></head><body><main id="artwork" class="story ${artwork.id}">${artwork.content}<div class="sticker-area" aria-hidden="true"></div></main></body></html>`;
}
