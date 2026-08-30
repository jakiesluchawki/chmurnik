const logo = '<img class="wordmark" src="/public/brand/chmurnik-wordmark.png" alt="CHMURNIK">';
const observer = '<img class="observer" src="/public/assets/observer-guide-still-life.png" alt="Filcowy obiekt w kształcie oka">';
const phone = (file, name) => `<div class="phone"><img src="/design/app-store/screenshots/${file}.png" alt="${name}"></div>`;
const credit = '<p class="credit" data-safe>Fot. PiccoloNamek · CC BY-SA 3.0 · kadr<br>jakiesluchawki.github.io/chmurnik/premiera/#credits</p>';

export const artworks = [
  {
    id: 'story-01-mamy-to', title: 'Mamy to', format: 'story', phase: 'now',
    alt: 'Różowa storka z filcowym okiem. Mamy to. Chmurnik zaakceptowany przez Apple. Polska i UE czekają na DSA.',
    content: `<header data-safe>${logo}<span>PREMIERA / 01</span></header>
      <h1 data-safe>Mamy to.</h1><p class="intro" data-safe>CHMURNIK zaakceptowany<br>przez Apple.</p>${observer}
      <div class="closing" data-safe><p class="large">Z ciekawości. Dla ciekawych.</p>
      <p>Polska i UE: czekamy jeszcze<br>na weryfikację DSA.</p></div>`,
  },
  {
    id: 'story-02-atlas', title: 'Spójrz w górę', format: 'story', phase: 'now',
    alt: 'Kremowa storka z prawdziwą fotografią Cirrus. Spójrz w górę. Atlas dziesięciu rodzajów chmur.',
    content: `<header data-safe>${logo}<span>ODKRYWAJ / 02</span></header>
      <h1 data-safe>Spójrz<br>w górę.</h1>
      <p class="intro" data-safe>Niebo ma więcej do powiedzenia,<br>niż myślisz.</p>
      <img class="cloud-photo" src="/public/assets/clouds/cirrus.jpg" alt="Prawdziwe chmury Cirrus nad łąką">
      <div class="closing" data-safe><p class="large">Atlas 10 rodzajów chmur.</p><p>Prawdziwe fotografie. Nowa perspektywa.</p></div>${credit}`,
  },
  {
    id: 'story-03-moje-niebo', title: 'Twoje własne niebo', format: 'story', phase: 'now',
    alt: 'Storka z autentycznym ekranem iOS. Twoje własne niebo. Zdjęcia, notatki i obserwacje w prywatnej kolekcji.',
    content: `<header data-safe>${logo}<span>ZACHOWUJ / 03</span></header>
      <h1 data-safe>Twoje<br>własne niebo.</h1>
      <p class="intro" data-safe>Zdjęcia. Notatki. Obserwacje.<br>Prywatna kolekcja na Twoim iPhonie.</p>
      ${phone('02-moje-niebo', 'Prawdziwy ekran Moje niebo z aplikacji iOS')}${credit}`,
  },
  {
    id: 'story-04-wiatr', title: 'Wiatr bez zgadywania', format: 'story', phase: 'now',
    alt: 'Oliwkowa storka z przestrzennym filcowym modelem wiatru. METAR, TAF, wiatr i czytanie map. Pracownie edukacyjne.',
    content: `<header data-safe>${logo}<span>ROZUMIEJ / 04</span></header>
      <h1 data-safe>Wiatr. Już nie<br>zagadka.</h1>
      <img class="wind-art" src="/public/assets/wind-profile-still-life.png" alt="Dekoracyjny model przepływu powietrza">
      <div class="closing" data-safe><p class="large">METAR. TAF. Wiatr.</p><p>Przesuwaj, sprawdzaj, ćwicz.<br>Ucz się czytać raporty i mapy.</p>
      <p class="note">Pracownie edukacyjne. Nie zastępują<br>oficjalnego briefingu ani pomiarów.</p></div>`,
  },
  {
    id: 'post-01-mamy-to', title: 'Ogłoszenie akceptacji', format: 'post', phase: 'now',
    alt: 'Kwadratowo-pionowy post z filcowym okiem. Mamy to. Chmurnik zaakceptowany przez Apple; Polska i UE czekają na DSA.',
    content: `<header data-safe>${logo}<span>NA IPHONE’A</span></header><h1 data-safe>Mamy to.</h1>
      <p class="intro" data-safe>CHMURNIK zaakceptowany przez Apple.</p>${observer}
      <div class="closing" data-safe><p>Polska i UE: czekamy jeszcze na DSA.<br>A ciekawość nieba? Już gotowa.</p></div>`,
  },
  {
    id: 'post-02-odkrywaj', title: 'Co potrafi Chmurnik', format: 'post', phase: 'now',
    alt: 'Oliwkowy post z autentycznym ekranem aplikacji. Zacznij od nieba. Atlas, prywatna kolekcja, METAR, TAF i wiatr.',
    content: `<header data-safe>${logo}<span>ODKRYWAJ</span></header><h1 data-safe>Zacznij<br>od nieba.</h1>
      <div class="features" data-safe><section><h2>Patrz uważniej.</h2><p>Atlas prawdziwych chmur.</p></section>
      <section><h2>Zachowuj odkrycia.</h2><p>Twoje zdjęcia i notatki.</p></section>
      <section><h2>Rozumiej więcej.</h2><p>METAR, TAF i nauka wiatru.</p></section></div>
      ${phone('02-moje-niebo', 'Autentyczny ekran iOS z prywatną kolekcją')}${credit}`,
  },
  {
    id: 'po-dsa-story-pobierz', title: 'Pobierz na iPhone’a', format: 'story', phase: 'after-dsa',
    alt: 'Wersja do użycia dopiero po uruchomieniu polskiego App Store. Chmurnik na iPhone’a. Pobierz bezpłatnie.',
    content: `<header data-safe>${logo}<span>JUŻ W APP STORE</span></header>
      <h1 data-safe>Niebo.<br>Zawsze z Tobą.</h1><p class="intro" data-safe>Poznaj CHMURNIKA na iPhone’a.</p>${observer}
      <div class="closing" data-safe><p class="large">Pobierz bezpłatnie.</p><p>Atlas chmur. Twoje obserwacje.<br>Nowa perspektywa.</p></div>`,
  },
  {
    id: 'po-dsa-post-pobierz', title: 'Premiera w polskim App Store', format: 'post', phase: 'after-dsa',
    alt: 'Wersja do użycia dopiero po uruchomieniu polskiego App Store. Niebo w Twojej kieszeni. Chmurnik do pobrania bezpłatnie.',
    content: `<header data-safe>${logo}<span>JUŻ W APP STORE</span></header><h1 data-safe>Niebo w Twojej<br>kieszeni.</h1>${observer}
      <div class="closing" data-safe><p class="large">CHMURNIK na iPhone’a.</p><p>Pobierz bezpłatnie w App Store.</p></div>`,
  },
];

export function artworkHtml(artwork, css) {
  const height = artwork.format === 'story' ? 1920 : 1350;
  return `<!doctype html><html lang="pl"><head><meta charset="utf-8"><title>${artwork.title}</title><style>${css}</style></head>
    <body><main id="artwork" class="${artwork.format} ${artwork.id}" style="height:${height}px">${artwork.content}</main></body></html>`;
}
