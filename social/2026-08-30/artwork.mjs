export const storeUrl = 'https://apps.apple.com/pl/app/chmurnik/id6782159027';
export const stickerArea = { x: 240, y: 1510, width: 600, height: 120 };
const logo = '<img class="wordmark" src="/public/brand/chmurnik-wordmark.png" alt="CHMURNIK">';
const observer = '<img class="observer" src="/public/assets/observer-guide-still-life.png" alt="Filcowy obiekt w kształcie oka">';
const phone = '<div class="phone"><img src="/design/app-store/screenshots/02-moje-niebo.png" alt="Autentyczny ekran Moje niebo z aplikacji iOS"></div>';
const credit = '<p class="credit" data-safe>Fot. PiccoloNamek · CC BY-SA 3.0 · kadr<br>jakiesluchawki.github.io/chmurnik/premiera/#credits</p>';
const header = label => `<header data-safe>${logo}<span>${label}</span></header>`;

export const artworks = [
  {
    id: 'pl-story-01-mamy-to', title: '01 / Mamy to', format: 'story', stickerLabel: 'Pobierz za darmo',
    alt: 'Różowa storka z filcowym okiem. Mamy to. Chmurnik już w polskim App Store, bezpłatnie na iPhone’a.',
    sources: ['public/brand/chmurnik-wordmark.png', 'public/assets/observer-guide-still-life.png'],
    content: `${header('POLSKA PREMIERA / 01')}<h1 data-safe>Mamy to.</h1>
      <p class="intro" data-safe>CHMURNIK już w polskim<br>App Store.</p>${observer}
      <div class="closing" data-safe><p>Bezpłatnie na iPhone’a.</p></div>`,
  },
  {
    id: 'pl-story-02-atlas', title: '02 / Spójrz w górę', format: 'story', stickerLabel: 'Odkryj CHMURNIK',
    alt: 'Kremowa storka z prawdziwą fotografią Cirrus. Spójrz w górę. Atlas dziesięciu rodzajów chmur w bezpłatnej aplikacji na iPhone’a.',
    sources: ['public/brand/chmurnik-wordmark.png', 'public/assets/clouds/cirrus.jpg'],
    content: `${header('ODKRYWAJ / 02')}<h1 data-safe>Spójrz<br>w górę.</h1>
      <p class="intro" data-safe>Niebo nie jest tylko tłem.</p>
      <img class="cloud-photo" src="/public/assets/clouds/cirrus.jpg" alt="Prawdziwe chmury Cirrus nad łąką">
      <div class="closing" data-safe><p>Atlas 10 rodzajów chmur.</p><p class="small">Prawdziwe zdjęcia. Bezpłatnie na iPhone’a.</p></div>${credit}`,
  },
  {
    id: 'pl-story-03-moje-niebo', title: '03 / Twoje własne niebo', format: 'story', stickerLabel: 'Zacznij swoją kolekcję',
    alt: 'Storka z autentycznym ekranem iOS. Twoje własne niebo. Zdjęcia, notatki i prywatna kolekcja na iPhonie. Pobierz bezpłatnie.',
    sources: ['public/brand/chmurnik-wordmark.png', 'design/app-store/screenshots/02-moje-niebo.png'],
    content: `${header('ZACHOWUJ / 03')}<h1 data-safe>Twoje<br>własne<br>niebo.</h1>
      <p class="intro" data-safe>Zdjęcia.<br>Notatki.<br>Małe odkrycia.</p>${phone}
      <div class="description" data-safe>Prywatna kolekcja<br>na Twoim iPhonie.</div>
      <div class="closing" data-safe><p>Pobierz bezpłatnie.</p></div>${credit}`,
  },
  {
    id: 'pl-story-04-wiatr', title: '04 / Wiatr już nie zagadka', format: 'story', stickerLabel: 'Pobierz CHMURNIK',
    alt: 'Oliwkowa storka z filcowym modelem wiatru. Wiatr już nie zagadka. Edukacyjne pracownie METAR, TAF i wiatru. Bezpłatnie na iPhone’a.',
    sources: ['public/brand/chmurnik-wordmark.png', 'public/assets/wind-profile-still-life.png'],
    content: `${header('ROZUMIEJ / 04')}<h1 data-safe>Wiatr. Już nie<br>zagadka.</h1>
      <p class="intro" data-safe>METAR. TAF. Wiatr.</p>
      <img class="wind-art" src="/public/assets/wind-profile-still-life.png" alt="Dekoracyjny filcowy model przepływu powietrza">
      <div class="closing" data-safe><p>Przesuwaj. Sprawdzaj. Ćwicz.</p><p class="small">Bezpłatne pracownie na iPhone’a.</p></div>
      <p class="note" data-safe>Do nauki. Nie zastępuje oficjalnego briefingu.</p>`,
  },
  {
    id: 'pl-story-05-pobierz', title: '05 / Z ciekawości nieba', format: 'story', stickerLabel: 'Pobierz za darmo',
    alt: 'Fioletowa storka typograficzna. Trochę zachwytu. Trochę nauki. Chmurnik na iPhone’a: bezpłatnie, bez reklam i bez konta.',
    sources: ['public/brand/chmurnik-wordmark.png'],
    content: `${header('Z CIEKAWOŚCI NIEBA / 05')}<h1 data-safe>Trochę<br>zachwytu.<br>Trochę nauki.</h1>
      <p class="intro" data-safe>Nie potrzebujesz planu.<br>Wystarczy kawałek nieba.</p>
      <p class="promise" data-safe>BEZPŁATNIE · BEZ REKLAM · BEZ KONTA</p>
      <div class="closing" data-safe><p>CHMURNIK na iPhone’a.</p></div>`,
  },
  {
    id: 'pl-post-01-mamy-to', title: 'Post / Premiera w Polsce', format: 'post',
    alt: 'Różowy post z filcowym okiem. Mamy to. Chmurnik już w polskim App Store. Pobierz bezpłatnie na iPhone’a.',
    sources: ['public/brand/chmurnik-wordmark.png', 'public/assets/observer-guide-still-life.png'],
    content: `${header('JUŻ W APP STORE')}<h1 data-safe>Mamy to.</h1>
      <p class="intro" data-safe>CHMURNIK już w polskim App Store.</p>${observer}
      <div class="closing" data-safe><p>Pobierz bezpłatnie na iPhone’a.</p></div>`,
  },
  {
    id: 'pl-post-02-odkrywaj', title: 'Post / Zacznij od nieba', format: 'post',
    alt: 'Oliwkowy post z autentycznym ekranem iOS. Zacznij od nieba. Atlas, prywatna kolekcja, METAR, TAF i nauka wiatru. Bezpłatnie w App Store.',
    sources: ['public/brand/chmurnik-wordmark.png', 'design/app-store/screenshots/02-moje-niebo.png'],
    content: `${header('JUŻ NA IPHONE’A')}<h1 data-safe>Zacznij<br>od nieba.</h1>
      <div class="features" data-safe><section><h2>Patrz uważniej.</h2><p>Atlas prawdziwych chmur.</p></section>
      <section><h2>Zachowuj odkrycia.</h2><p>Twoje zdjęcia i notatki.</p></section>
      <section><h2>Rozumiej więcej.</h2><p>METAR, TAF i nauka wiatru.</p></section>
      <p class="free">Bezpłatnie w App Store.</p></div>${phone}${credit}`,
  },
].map(artwork => ({ ...artwork, storeUrl, ...(artwork.format === 'story' ? { stickerArea } : {}) }));

export function artworkHtml(artwork, css) {
  const height = artwork.format === 'story' ? 1920 : 1350;
  const zone = artwork.format === 'story' ? '<div class="sticker-area" aria-hidden="true"></div>' : '';
  return `<!doctype html><html lang="pl"><head><meta charset="utf-8"><title>${artwork.title}</title><style>${css}</style></head>
    <body><main id="artwork" class="${artwork.format} ${artwork.id}" style="height:${height}px">${artwork.content}${zone}</main></body></html>`;
}
