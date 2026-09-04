import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile, writeFile, mkdir, mkdtemp, copyFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import sharp from 'sharp';
import { campaign, stories } from './copy.mjs';
import { captions, facebook } from './captions.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '../..');
const site = path.join(here, 'site');
const qa = path.join(root, 'build/astra-platforms-qa');
const css = await readFile(path.join(here, 'platforms.css'), 'utf8');
const escape = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const num = story => String(story.number).padStart(2, '0');
const asset = file => `/social/2026-09-04-astra/${file}`;
const capture = name => `<img src="${asset(`captures/${name}.png`)}" alt="">`;
const wordmark = theme => `<img class="wordmark" src="${asset(`site/assets/wordmark-${['violet','olive'].includes(theme)?'cream':'olive'}.png`)}" alt="CHMURNIK">`;
function visual(story) {
  if (story.art) return `<figure class="visual"><img class="illustration" src="${asset(`art/${story.art}`)}" alt=""></figure>`;
  if (story.visual === 'mobile') return `<figure class="visual mobile"><div class="phone">${capture('mobile-home')}</div><div class="detail">${capture('mobile-atlas')}</div></figure>`;
  if (story.visual === 'workshops') return `<figure class="visual workshops"><div class="workshop first">${capture('mobile-metar')}</div><div class="workshop second">${capture('mobile-wind')}</div><span class="screen-label">Przykłady do nauki · METAR / wiatr</span></figure>`;
  if (story.visual === 'ipad') return `<figure class="visual ipad"><div class="tablet">${capture('ipad-atlas')}</div><span class="screen-label">Atlas chmur · iPad</span></figure>`;
  return `<figure class="visual mac"><div class="mac-window">${capture('mac-atlas')}</div></figure>`;
}
const credit = '<div class="tiny-credit"><a href="https://commons.wikimedia.org/wiki/File:CirrusField-color.jpg">Fot. Cirrus: PiccoloNamek</a> / <a href="https://creativecommons.org/licenses/by-sa/3.0/">CC BY-SA 3.0</a> · źródła w galerii</div>';
function slide(story) {
  return `<article class="slide ${story.theme} slide-${num(story)}"><header data-safe>${wordmark(story.theme)}<div class="eyebrow">Z pomocą Astry <b>${num(story)} / 10</b></div></header><h1 data-safe>${escape(story.lead)}</h1>${visual(story)}${['mobile','ipad','mac'].includes(story.visual) ? credit : ''}<p class="copy" data-safe>${escape(story.body)}</p><footer data-safe><a href="${campaign.webUrl}">chmurnik.cloud</a><span>${story.number === 10 ? `<a href="${campaign.storeUrl}">iPhone / iPad · App Store ↗</a>` : story.number === 1 ? 'Przesuń i poznaj historię →' : 'Z ciekawości nieba'}</span></footer></article>`;
}
function facebookSlide() {
  return `<article class="slide facebook"><header data-safe>${wordmark('pink')}<div class="eyebrow">Z pomocą Astry</div></header><h1 data-safe>${escape(facebook.lead)}</h1>${visual(stories[0])}<p class="copy" data-safe>${escape(facebook.body)}</p><footer data-safe><span>${escape(facebook.cta)}</span><span>iPhone / iPad / WWW</span></footer></article>`;
}
const document = content => `<!doctype html><html lang="pl"><head><meta charset="utf-8"><title>CHMURNIK: w tym niebie jest trochę Astry</title><style>${css}</style></head><body>${content}</body></html>`;
for (const folder of ['karuzela','facebook','teksty','previews/karuzela']) await mkdir(path.join(site,folder),{recursive:true});
await mkdir(qa,{recursive:true});
const brand=await readFile(path.join(root,'public/brand/chmurnik-wordmark.png'));
for(const [name,color] of [['olive','#5b592d'],['cream','#fff7eb']])await sharp({create:{width:2100,height:360,channels:4,background:color}}).composite([{input:brand,blend:'dest-in'}]).png().toFile(path.join(site,'assets',`wordmark-${name}.png`));
const server = createServer(async (req,res) => {
  try {
    const url = new URL(req.url,'http://127.0.0.1');
    if (url.pathname === '/artwork') {
      res.setHeader('Content-Type','text/html; charset=utf-8');
      res.end(document(url.searchParams.has('facebook') ? facebookSlide() : slide(stories[Number(url.searchParams.get('n'))-1]))); return;
    }
    if (url.pathname === '/document') {res.setHeader('Content-Type','text/html; charset=utf-8');res.end(document(stories.map(slide).join('')));return;}
    const file = path.resolve(root,'.'+decodeURIComponent(url.pathname));
    assert(file.startsWith(root+path.sep));
    res.setHeader('Content-Type',({'.png':'image/png','.woff2':'font/woff2'})[path.extname(file)] || 'application/octet-stream');
    res.end(await readFile(file));
  } catch {res.writeHead(404);res.end();}
});
await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',resolve);});
const base = `http://127.0.0.1:${server.address().port}`;
const {chromium} = await import(pathToFileURL(path.join(root,'.local/qa-tools/node_modules/playwright/index.mjs')));
let browser;
const artworks = [];
const ready = page => page.evaluate(async()=>{await document.fonts.ready;await Promise.all([...document.images].map(i=>i.decode()));});
async function record(file,extra) {
  const bytes = await readFile(path.join(site,file));
  return {...extra,file,bytes:bytes.length,sha256:hash(bytes)};
}
const pdfFile = 'CHMURNIK-ASTRA-LINKEDIN.pdf';
try {
  browser = await chromium.launch({headless:true});
  const page = await browser.newPage({viewport:{width:1080,height:1350},deviceScaleFactor:1});
  for (const [i,item] of [...stories,facebook].entries()) {
    const isFacebook = i === 10;
    const id = isFacebook ? 'facebook' : item.id;
    const width = isFacebook ? 1200 : 1080, height = isFacebook ? 1500 : 1350;
    await page.setViewportSize({width,height});
    await page.goto(`${base}/artwork?${isFacebook ? 'facebook=1' : `n=${item.number}`}`); await ready(page);
    const layout = await page.evaluate(()=>{
      const rect = e => {const r=e.getBoundingClientRect();return{x:r.x,y:r.y,right:r.right,bottom:r.bottom};};
      return {lead:document.querySelector('h1').textContent,body:document.querySelector('.copy').textContent,headline:rect(document.querySelector('h1')),copy:rect(document.querySelector('.copy')),visual:rect(document.querySelector('.visual')),footer:rect(document.querySelector('footer')),safe:[...document.querySelectorAll('[data-safe]')].map(rect),fonts:[document.fonts.check('78px Romie'),document.fonts.check('35px Roobert')]};
    });
    assert.equal(layout.lead,item.lead);assert.equal(layout.body,item.body);
    assert(layout.headline.bottom <= layout.visual.y-10,`Headline overlaps visual: ${id}`);
    assert(layout.copy.y >= layout.visual.bottom+40 && layout.copy.bottom <= layout.footer.y-26,`Body overlaps visual/footer: ${id}`);
    assert(layout.safe.every(r=>r.x>=65&&r.right<=width-65&&r.y>=50&&r.bottom<=height-45),`Unsafe content: ${id}`);
    assert(layout.fonts.every(Boolean));
    const file = isFacebook ? 'facebook/chmurnik-astra-facebook.png' : `karuzela/chmurnik-astra-${item.id}.png`;
    await page.screenshot({path:path.join(site,file),type:'png'});
    const preview = isFacebook ? 'previews/facebook.jpg' : `previews/karuzela/${item.id}.jpg`;
    await sharp(path.join(site,file)).resize(432,540).jpeg({quality:90}).toFile(path.join(site,preview));
    artworks.push(await record(file,{id,format:isFacebook?'facebook':'carousel',width,height,preview,lead:item.lead,body:item.body,alt:item.alt}));
    await writeFile(path.join(qa,`${id}-layout.json`),JSON.stringify(layout,null,2));
    console.log(`Rendered ${file}; headline ${Math.round(layout.headline.bottom)}, body ${Math.round(layout.copy.bottom)}`);
  }
  await page.setViewportSize({width:1080,height:1350});
  await page.goto(`${base}/document`);await ready(page);
  assert.equal(await page.locator('.slide').count(),10);
  await page.pdf({path:path.join(site,pdfFile),printBackground:true,preferCSSPageSize:true,tagged:true,outline:true});
} finally {await browser?.close();await new Promise(resolve=>server.close(resolve));}

for (const caption of captions) await writeFile(path.join(site,'teksty',`${caption.id}-post.txt`),caption.text+'\n');
await writeFile(path.join(site,'teksty/instagram-linki-profil.txt'),`CHMURNIK · strona WWW\n${campaign.webUrl}\n\nCHMURNIK · pobierz na iPhone’a i iPada\n${campaign.storeUrl}\n`);
await writeFile(path.join(site,'teksty/alt-teksty.txt'),artworks.map(a=>`${a.id}\n${a.alt}\n${a.lead}\n${a.body}\n`).join('\n'));
await writeFile(path.join(site,'PUBLIKACJA.txt'),`CHMURNIK / ASTRA / PEŁNY PAKIET / 4 WRZEŚNIA 2026

1. INSTAGRAM POST
Wybierz 10 PNG z folderu karuzela w kolejności 01-10. Każda plansza ma 1080 x 1350 (4:5), z pełnym tekstem zatwierdzonej historii. Zachowaj cały kadr. Opis: teksty/instagram-post.txt. Przed publikacją dodaj linki z teksty/instagram-linki-profil.txt do profilu, bo opis odsyła do nich. Adres napisany na PNG lub w opisie nie jest klikalnym przyciskiem. Opcjonalne opisy dostępności: teksty/alt-teksty.txt.

2. FACEBOOK
Dodaj facebook/chmurnik-astra-facebook.png (1200 x 1500, 4:5) i cały tekst z teksty/facebook-post.txt. Post zawiera link do chmurnik.cloud oraz App Store. Nie trzeba niczego składać z fragmentów.

3. LINKEDIN
Dodaj CHMURNIK-ASTRA-LINKEDIN.pdf jako Dokument. Tytuł: ${captions.find(c=>c.id==='linkedin').documentTitle}. Wklej teksty/linkedin-post.txt. PDF ma 10 stron z pełną historią, zaznaczalnym tekstem, linkiem do WWW na każdej stronie i linkiem do App Store na ostatniej. Źródła fotografii również są klikalne.

4. STORIES
Bez zmian: folder png, 10 plików 1080 x 1920. Linki do naklejek i pełne teksty: TEKSTY-I-LINKI.txt. Instrukcja Stories: CZYTAJ-MNIE.txt. Nowe PNG z folderu karuzela są do posta, nie są zamiennikiem pionowych Stories.

5. GRANICE I ŹRÓDŁA
Stan opowieści: 4 września 2026. iPhone i iPad są dostępne; macOS pozostaje w recenzji według ostatniego potwierdzenia. Przed publikacją tej planszy w późniejszym terminie sprawdź status Maca. Astra pomagała w tworzeniu aplikacji, nie analizuje zdjęć użytkowników. Rozpoznawanie na iPhonie/iPadzie działa lokalnie. Wyniki i narzędzia pogodowe są edukacyjne, nie zastępują oficjalnego briefingu.
Zachowaj autorstwo fotografii i plik ZRODLA-ZDJEC.txt. Ekrany są autentyczne, ramki i ilustracje dekoracyjne. Materiały nie są reklamą zatwierdzoną przez OpenAI. Żadne posty nie zostały opublikowane automatycznie.

Stała biblioteka: https://jakiesluchawki.github.io/chmurnik/assetySM/
Ta kampania: ${campaign.galleryUrl}
`);
const storyManifest = JSON.parse(await readFile(path.join(site,'manifest.json'),'utf8'));
const documents = [await record(pdfFile,{title:captions.find(c=>c.id==='linkedin').documentTitle,pages:10,width:1080,height:1350})];
const common = ['PUBLIKACJA.txt','ZRODLA-ZDJEC.txt'];
const archives = [
  {file:'CHMURNIK-ASTRA-INSTAGRAM.zip',title:'Instagram · karuzela i opis',entries:[...common,...artworks.filter(a=>a.format==='carousel').map(a=>a.file),'teksty/instagram-post.txt','teksty/instagram-linki-profil.txt','teksty/alt-teksty.txt']},
  {file:'CHMURNIK-ASTRA-FACEBOOK.zip',title:'Facebook · grafika i post',entries:[...common,artworks[10].file,'teksty/facebook-post.txt']},
  {file:'CHMURNIK-ASTRA-LINKEDIN.zip',title:'LinkedIn · PDF i post',entries:[...common,pdfFile,'teksty/linkedin-post.txt']},
  {file:'CHMURNIK-ASTRA-PELNY-PAKIET.zip',title:'Pełny pakiet · wszystkie platformy',entries:[...common,...artworks.map(a=>a.file),pdfFile,...captions.map(c=>`teksty/${c.id}-post.txt`),'teksty/instagram-linki-profil.txt','teksty/alt-teksty.txt',...storyManifest.stories.map(s=>s.file),'TEKSTY-I-LINKI.txt','CZYTAJ-MNIE.txt']},
];
const temporary = await mkdtemp(path.join(tmpdir(),'chmurnik-astra-platforms-'));
try {
  for (const archive of archives) {
    assert.equal(new Set(archive.entries).size,archive.entries.length);
    const target = path.join(temporary,archive.file);
    execFileSync('zip',['-q','-X',target,...archive.entries],{cwd:site});
    execFileSync('unzip',['-t',target]);
    assert.deepEqual(execFileSync('unzip',['-Z1',target],{encoding:'utf8'}).trim().split('\n'),archive.entries);
    await copyFile(target,path.join(site,archive.file));
    Object.assign(archive,await record(archive.file,{}));
    console.log(`${archive.file}: ${archive.entries.length} entries`);
  }
} finally {await rm(temporary,{recursive:true,force:true});}
await writeFile(path.join(site,'platforms-manifest.json'),JSON.stringify({title:campaign.title,date:campaign.approvedOn,artworks,documents,captions,archives},null,2));
await writeFile(path.join(qa,'ocr-checks.json'),JSON.stringify(artworks.map(a=>({id:a.id,file:path.join(site,a.file),expected:a.lead+' '+a.body})),null,2));
const thumbs=[];
for (const artwork of artworks.slice(0,10)) thumbs.push(await sharp(path.join(site,artwork.file)).resize(216,270).toBuffer());
await sharp({create:{width:1120,height:564,channels:3,background:'#ddd5cb'}}).composite(thumbs.map((input,i)=>({input,left:8+(i%5)*224,top:8+Math.floor(i/5)*278}))).png().toFile(path.join(qa,'carousel-contact-sheet.png'));
const { buildGallery } = await import('./gallery.mjs');
await buildGallery();
console.log('Platform exports and gallery ready.');
