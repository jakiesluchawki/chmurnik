import { readFile } from 'node:fs/promises';

export async function wallpaperBonus(){
  let manifest;
  try{manifest=JSON.parse(await readFile(new URL('./site/wallpapers-manifest.json',import.meta.url)));}catch(error){if(error.code==='ENOENT')return '';throw error;}
  const cards=[];
  for(const id of [...new Set(manifest.wallpapers.map(w=>w.id))]){
    const desktop=manifest.wallpapers.find(w=>w.id===id&&w.orientation==='desktop');
    const phone=manifest.wallpapers.find(w=>w.id===id&&w.orientation==='phone');
    cards.push(`<article class="wallpaper-card"><div class="wallpaper-preview"><a href="${desktop.file}" download><img loading="lazy" src="${desktop.preview}" width="640" height="360" alt="${desktop.alt}"></a><a class="phone-wallpaper" href="${phone.file}" download><img loading="lazy" src="${phone.preview}" width="360" height="640" alt="${phone.alt} Wersja pionowa."></a></div><div class="wallpaper-copy"><h3>${desktop.title}</h3><a class="button" href="${desktop.file}" download>Komputer · 3840 × 2160 <span>↓ PNG</span></a><a class="button secondary" href="${phone.file}" download>Telefon · 2160 × 3840 <span>↓ PNG</span></a></div></article>`);
  }
  return `<section id="tapety" class="platform-section"><p class="kicker">DODATEK / 10 MOTYWÓW / TAPETY 4K</p><h2>Trochę nieba na co dzień.</h2><p class="section-lede">Dziesięć różnych motywów, każdy w osobnej kompozycji na komputer i telefon. Łącznie 20 plików PNG bez napisów, z miejscem na ikony i zegar.</p><div class="download-row"><a class="button" href="${manifest.archive.file}" download>10 motywów · 20 PNG · ZIP <span>↓</span></a><button class="copy-post" data-target="wallpaper-share-link">Kopiuj link do tapet</button></div><p id="wallpaper-share-link" class="share-address" tabindex="0">https://jakiesluchawki.github.io/chmurnik/premiera/astra/#tapety</p><p class="hint">Pobierz PNG w pełnej rozdzielczości, nie podgląd. Tapety są też w pełnym pakiecie powyżej. Link możesz wysłać prywatnie, ale sama strona jest dostępna bez logowania.</p><div class="wallpaper-grid">${cards.join('')}</div><p class="hint">Do osobistego użytku. Ilustracje przeskalowane do 4K. Telefon może delikatnie przyciąć obraz do proporcji ekranu. <a href="tapety/CZYTAJ-MNIE.txt">Instrukcja i szczegóły</a>.</p></section>`;
}
