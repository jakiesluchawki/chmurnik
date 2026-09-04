import assert from 'node:assert/strict';
import { readdir, readFile, writeFile, mkdir, copyFile, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { packs } from './catalog.mjs';

const here=path.dirname(fileURLToPath(import.meta.url));
const social=path.dirname(here);
const root=path.dirname(social);
const site=path.join(here,'site');
const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const exists=async file=>{try{return (await stat(file)).isDirectory();}catch{return false;}};
const available=[];
for(const entry of await readdir(social,{withFileTypes:true}))if(entry.isDirectory()&&/^\d{4}-\d{2}-\d{2}/.test(entry.name)&&await exists(path.join(social,entry.name,'site')))available.push(entry.name);
assert.deepEqual([...new Set(packs.map(p=>p.source))].sort(),available.sort(),'Register every published campaign in social/library/catalog.mjs before publishing.');
for(const pack of packs){
  for(const file of ['index.html',pack.preview,...pack.downloads.map(d=>d[1])])assert((await stat(path.join(social,pack.source,'site',file))).isFile(),`Missing asset: ${pack.source}/${file}`);
}
await mkdir(path.join(site,'assets'),{recursive:true});
for(const f of ['Romie-Regular.woff2','Roobert-Regular.woff2','Roobert-Bold.woff2'])await copyFile(path.join(root,'public/fonts',f),path.join(site,'assets',f));
await copyFile(path.join(root,'public/brand/chmurnik-wordmark.png'),path.join(site,'assets/wordmark.png'));
await copyFile(path.join(here,'style.css'),path.join(site,'style.css'));
function card(pack,index){
  return `<article id="${pack.id}" class="pack ${index===0?'latest':''}"><a class="cover" href="${pack.base}"><img src="${pack.base+pack.preview}" alt="Okładka pakietu: ${escape(pack.title)}" width="432" height="768" loading="${index===0?'eager':'lazy'}"></a><div class="content"><div class="meta"><span>${escape(pack.status)}</span><time datetime="${pack.date}">${escape(pack.dateLabel)}</time></div><h2>${escape(pack.title)}</h2><p>${escape(pack.description)}</p><ul class="tags">${pack.formats.map(f=>`<li>${escape(f)}</li>`).join('')}</ul><a class="open" href="${pack.base}">Otwórz całą serię <span>↗</span></a><div class="downloads">${pack.downloads.map(([label,file,type])=>`<a href="${pack.base+file}" ${type==='zip'?'download':''}>${escape(label)}<span>${type.toUpperCase()} ↓</span></a>`).join('')}</div></div></article>`;
}
await writeFile(path.join(site,'index.html'),`<!doctype html><html lang="pl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><meta name="theme-color" content="#f8e2ea"><meta name="description" content="Stała biblioteka materiałów CHMURNIKA do social media: Stories, posty, karuzele, LinkedIn, Facebook i linki."><title>Wszystkie materiały SM · CHMURNIK</title><link rel="stylesheet" href="style.css"></head><body><header><a href="../"><img src="assets/wordmark.png" width="200" height="34" alt="CHMURNIK"></a><span>BIBLIOTEKA MATERIAŁÓW SM</span></header><main><div class="heading"><div><h1>Materiały do sociali.</h1><p>Jedna zakładka na wszystkie nasze paczki. Najnowsze zawsze na górze.</p></div><span class="updated">Ostatnia aktualizacja<br><strong>4 września 2026</strong></span></div><nav aria-label="Sekcje biblioteki"><a href="#astra">Najnowsze</a><a href="#historia">Historia i demo</a><a href="#premiera">Premiera</a><a href="#linki">Linki do aplikacji</a><a href="#archiwum">Archiwum</a></nav><section aria-label="Pakiety do publikacji">${packs.filter(p=>!p.archived).map(card).join('')}</section><section class="links" id="linki"><div><h2>Linki do aplikacji</h2><p>Do postów i naklejek używaj tych adresów, nie linku do biblioteki.</p></div><div><a href="https://apps.apple.com/pl/app/chmurnik/id6782159027">iPhone i iPad · App Store ↗</a><input aria-label="Link do App Store" readonly value="https://apps.apple.com/pl/app/chmurnik/id6782159027"><a href="https://chmurnik.cloud/">W przeglądarce · chmurnik.cloud ↗</a><input aria-label="Link do strony WWW" readonly value="https://chmurnik.cloud/"></div></section><section id="archiwum"><h2 class="section-title">Wcześniejsze wersje</h2><p class="archive-note">Zachowane materiały. Starsze teksty, dostępność i instrukcje mogą nie odpowiadać obecnemu stanowi aplikacji.</p>${packs.filter(p=>p.archived).map(p=>card(p,9)).join('')}<details class="legacy"><summary>Robocze paczki sprzed premiery</summary><p>Historyczne warianty komunikacji związane z ówczesną dostępnością i DSA. Nie używaj ich jako aktualnej informacji o publikacji aplikacji.</p><a href="../premiera/chmurnik-na-teraz.zip" download>Wariant „na teraz” · ZIP ↓</a><a href="../premiera/chmurnik-po-dsa.zip" download>Wariant „po DSA” · ZIP ↓</a></details></section><footer><strong>Stały adres tej biblioteki</strong><a href="https://jakiesluchawki.github.io/chmurnik/assetySM/">jakiesluchawki.github.io/chmurnik/assetySM/</a><p>Galerie i paczki pozostają pod swoimi adresami. Tutaj znajdziesz ich aktualny, wspólny katalog. Autorstwo fotografii i instrukcje publikacji są dołączone do każdej serii.</p></footer></main></body></html>`);
await writeFile(path.join(site,'catalog.json'),JSON.stringify({updatedOn:'2026-09-04',canonicalUrl:'https://jakiesluchawki.github.io/chmurnik/assetySM/',packs},null,2));
console.log(`Media library ready: ${packs.length} campaigns, ${packs.reduce((n,p)=>n+p.downloads.length,0)} direct downloads, 2 legacy ZIPs.`);
