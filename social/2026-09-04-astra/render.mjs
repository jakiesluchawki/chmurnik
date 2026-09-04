import { createServer } from 'node:http';
import { readFile, writeFile, mkdir, copyFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import sharp from 'sharp';
import { campaign, stories } from './copy.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '../..');
const site = path.join(here, 'site');
const qa = path.join(root, 'build/astra-stories-qa');
const css = await readFile(path.join(here, 'artwork.css'), 'utf8');
const escape = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const num = story => String(story.number).padStart(2, '0');
const asset = file => '/' + file;
const captures = {
  mobile: ['social/2026-09-04-astra/captures/mobile-home.png', 'social/2026-09-04-astra/captures/mobile-atlas.png'],
  workshops: ['social/2026-09-04-astra/captures/mobile-metar.png', 'social/2026-09-04-astra/captures/mobile-wind.png'],
  ipad: ['social/2026-09-04-astra/captures/ipad-atlas.png'],
  mac: ['social/2026-09-04-astra/captures/mac-atlas.png'],
};
function visual(story) {
  if (story.art) return `<div class="visual"><img class="illustration" src="/social/2026-09-04-astra/art/${story.art}" alt=""></div>`;
  const imgs = captures[story.visual].map(file => `<img src="${asset(file)}" alt="">`);
  if (story.visual === 'mobile') return `<div class="visual product"><div class="mobile-primary">${imgs[0]}</div><div class="mobile-secondary">${imgs[1]}</div></div>`;
  if (story.visual === 'workshops') return `<div class="visual product workshops"><div class="workshop first">${imgs[0]}</div><div class="workshop second">${imgs[1]}</div><span class="screen-label">Przykłady do nauki · METAR / wiatr</span></div>`;
  if (story.visual === 'ipad') return `<div class="visual product ipad"><div class="tablet">${imgs[0]}</div><span class="screen-label">Atlas chmur · iPad</span></div>`;
  return `<div class="visual product mac"><div class="mac-window">${imgs[0]}</div></div>`;
}
function document(story) {
  const credit = ['mobile','ipad','mac'].includes(story.visual) ? '<div class="tiny-credit">Fot. Cirrus: PiccoloNamek / CC BY-SA 3.0 · źródła w galerii</div>' : '';
  return `<!doctype html><html lang="pl"><meta charset="utf-8"><title>${escape(story.lead)}</title><style>${css}</style><main class="${story.theme} story-${num(story)}"><div class="edge">${stories.map(s=>`<i class="${s.number===story.number?'current':''}"></i>`).join('')}</div><header data-safe><div class="wordmark"></div><div class="eyebrow">Z pomocą Astry <b>${num(story)} / 10</b></div></header><h1 data-safe data-exact="lead">${escape(story.lead)}</h1>${visual(story)}${credit}<p class="copy" data-safe data-exact="body">${escape(story.body)}</p><div class="sticker-space"></div><footer class="footer" data-safe><span>chmurnik.cloud</span><span>Z ciekawości nieba</span></footer><div class="bottom-orbit"></div></main></html>`;
}

for (const folder of [site, path.join(site,'png'), path.join(site,'previews'), path.join(site,'assets'), qa]) await mkdir(folder,{recursive:true});
const types={'.png':'image/png','.woff2':'font/woff2','.css':'text/css','.html':'text/html','.json':'application/json','.jpg':'image/jpeg','.zip':'application/zip','.txt':'text/plain; charset=utf-8'};
const server=createServer(async(req,res)=>{
  try {
    const url = new URL(req.url,'http://127.0.0.1');
    if(url.pathname==='/artwork') { const story=stories[Number(url.searchParams.get('n'))-1];if(!story)throw Error('Unknown story');res.setHeader('Content-Type','text/html; charset=utf-8');res.end(document(story));return; }
    const file=path.resolve(root,'.'+decodeURIComponent(url.pathname));
    if(!file.startsWith(root+path.sep))throw Error('Outside root');
    res.setHeader('Content-Type',types[path.extname(file)]||'application/octet-stream');res.end(await readFile(file));
  }catch{res.writeHead(404);res.end('Not found');}
});
await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',resolve);});
const base=`http://127.0.0.1:${server.address().port}`;
const {chromium}=await import(pathToFileURL(path.join(root,'.local/qa-tools/node_modules/playwright/index.mjs')));
let browser;
const records=[];
try {
  browser=await chromium.launch({headless:true});
  const page=await browser.newPage({viewport:{width:1080,height:1920},deviceScaleFactor:1});
  for(const story of stories){
    await page.goto(`${base}/artwork?n=${story.number}`);
    await page.evaluate(async()=>{await document.fonts.ready;await Promise.all([...document.images].map(i=>i.decode()));});
    const layout=await page.evaluate(()=>{
      const rect=e=>{const r=e.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height,bottom:r.bottom,right:r.right};};
      return {lead:document.querySelector('h1').textContent,body:document.querySelector('.copy').textContent,headline:rect(document.querySelector('h1')),copy:rect(document.querySelector('.copy')),visual:rect(document.querySelector('.visual')),safe:[...document.querySelectorAll('[data-safe]')].map(rect),fonts:[document.fonts.check('82px Romie'),document.fonts.check('38px Roobert')]};
    });
    if(layout.lead!==story.lead||layout.body!==story.body)throw Error(`Copy changed: ${story.id}`);
    if(layout.headline.bottom>568||layout.copy.bottom>1555)throw Error(`Content collision: ${story.id} ${JSON.stringify(layout)}`);
    if(layout.safe.some(r=>r.x<60||r.right>1020||r.y<210||r.bottom>1704)||layout.fonts.some(v=>!v))throw Error(`Safe area/font failure: ${story.id}`);
    const name=`chmurnik-astra-${story.id}.png`,file=path.join(site,'png',name);
    await page.screenshot({path:file,type:'png'});
    const metadata=await sharp(file).metadata();
    if(metadata.width!==1080||metadata.height!==1920||metadata.format!=='png')throw Error('Bad export dimensions');
    const preview=`previews/${story.id}.jpg`;
    await sharp(file).resize(432,768).jpeg({quality:90}).toFile(path.join(site,preview));
    const bytes=await readFile(file);
    records.push({id:story.id,number:story.number,file:`png/${name}`,preview,width:1080,height:1920,bytes:bytes.length,sha256:createHash('sha256').update(bytes).digest('hex'),lead:story.lead,body:story.body,link:story.link,sticker:story.sticker,alt:story.alt});
    await writeFile(path.join(qa,`${story.id}-layout.json`),JSON.stringify(layout,null,2));
    console.log(`Rendered ${name}: ${bytes.length} bytes, copy ends at ${Math.round(layout.copy.bottom)}px`);
  }
  await writeFile(path.join(qa,'ocr-checks.json'),JSON.stringify(stories.map((s,i)=>({id:s.id,file:path.join(site,records[i].file),expected:s.lead+' '+s.body})),null,2));
} finally {await browser?.close();await new Promise(resolve=>server.close(resolve));}

await writeFile(path.join(site,'manifest.json'),JSON.stringify({title:campaign.title,date:campaign.approvedOn,format:'PNG',width:1080,height:1920,stories:records},null,2));
await writeFile(path.join(site,'TEKSTY-I-LINKI.txt'),`${campaign.title}\n10 statycznych Stories / PNG 1080 x 1920\n\n${stories.map(s=>`${num(s)}. ${s.lead}\n${s.body}\nNaklejka: ${s.sticker}\nLink: ${s.link}\n`).join('\n')}`);
await writeFile(path.join(site,'CZYTAJ-MNIE.txt'),'CHMURNIK / Z POMOCĄ ASTRY\n\n10 gotowych, statycznych PNG 1080 x 1920. Wgrywaj w kolejności 01-10.\nPełny zaakceptowany tekst znajduje się na każdej planszy. Bez filmów i bez muzyki.\n\nNaklejkę z linkiem dodaj samodzielnie w Instagramie, w wolnym miejscu między tekstem a dolną linią. Sugerowany środek: x=540, y=1612 na planszy 1080 x 1920. Linki i etykiety: TEKSTY-I-LINKI.txt. Na planszy 09 link prowadzi do WWW, bo wersja Mac jest w recenzji Apple.\n\nPNG nie zawiera klikalnego linku. Otwierając galerię na telefonie, użyj Pobierz PNG lub Udostępnij PNG, a następnie zachowaj obraz. ZIP zawiera wszystkie 10 oryginałów, teksty, linki i źródła.\n\nAutentyczność: ilustracje są dekoracyjne, a nie materiałem do rozpoznawania gatunków chmur. Ekrany 06-07 przedstawiają rzeczywisty interfejs w układzie mobilnym, uchwycony w izolowanej przeglądarce; nie są fotografią fizycznego telefonu. Ekran 08 pochodzi z symulatora iPada, ekran 09 z natywnej aplikacji na Macu. Ramy urządzeń są dekoracyjne. Ekrany skalowano i obracano, bez podmieniania danych ani retuszu zdjęć.\n\nPrzykłady meteorologiczne służą do nauki, nie zastępują oficjalnego briefingu. Status macOS potwierdzony 4 września 2026. Zachowaj podpisy autorów fotografii oraz ZRODLA-ZDJEC.txt.\n');
await writeFile(path.join(site,'ZRODLA-ZDJEC.txt'),'Fotografia Cirrus w ekranach aplikacji na planszach 06, 08, 09:\nAutor: PiccoloNamek\nTytuł: CirrusField-color.jpg\nŹródło: https://commons.wikimedia.org/wiki/File:CirrusField-color.jpg\nLicencja: CC BY-SA 3.0\nhttps://creativecommons.org/licenses/by-sa/3.0/\n\nFotografia została pokazana wewnątrz prawdziwego interfejsu CHMURNIKA. Zrzuty skalowano, kadrowano w granicach ramek i obracano na potrzeby kompozycji; bez retuszu zdjęcia. Ewentualne opracowanie fotografii jest udostępniane na tej samej licencji. Autor fotografii nie jest związany z promocją CHMURNIKA.\n\nIlustracje na planszach 01-05 oraz 10 mają charakter dekoracyjny. Nie przedstawiają materiału obserwacyjnego z atlasu.\n');
for(const file of ['Romie-Regular.woff2','Roobert-Regular.woff2','Roobert-Bold.woff2'])await copyFile(path.join(root,'public/fonts',file),path.join(site,'assets',file));
await copyFile(path.join(root,'public/brand/chmurnik-wordmark.png'),path.join(site,'assets/wordmark.png'));
const zipName='CHMURNIK-ASTRA-10-STORIES-PNG.zip';
execFileSync('zip',['-q','-j',path.join(site,zipName),...records.map(r=>path.join(site,r.file)),...['TEKSTY-I-LINKI.txt','CZYTAJ-MNIE.txt','ZRODLA-ZDJEC.txt'].map(f=>path.join(site,f))]);
const thumbs=await Promise.all(records.map(r=>sharp(path.join(site,r.file)).resize(216,384).toBuffer()));
await sharp({create:{width:1120,height:806,channels:3,background:'#ddd5cb'}}).composite(thumbs.map((input,i)=>({input,left:8+(i%5)*224,top:8+Math.floor(i/5)*398}))).png().toFile(path.join(qa,'contact-sheet.png'));
console.log(`Gallery and ZIP ready: ${site}`);
const { buildGallery } = await import('./gallery.mjs');
await buildGallery();
