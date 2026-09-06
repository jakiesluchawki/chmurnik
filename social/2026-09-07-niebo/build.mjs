import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile, writeFile, mkdir, copyFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import sharp from 'sharp';
import { writeDownloadZip } from '../2026-09-04-astra/zip-downloads.mjs';
import { stories, motifs, visuals, progressCaptions, title, canonical, hub } from './copy.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '../..');
const site = path.join(here, 'site');
const qa = path.join(root, 'build/niebo-social-qa');
const bundles = path.join(root, 'build/niebo-social-downloads');
const release = 'https://github.com/jakiesluchawki/chmurnik/releases/download/sm-niebo-20260907/';
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const escape = text => String(text).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
for (const dir of ['assets','tapety','oryginaly','previews/tapety','previews/stories','previews/karuzela','stories','karuzela','facebook','teksty']) await mkdir(path.join(site, dir), {recursive:true});
await mkdir(qa, {recursive:true}); await mkdir(bundles, {recursive:true});
for (const font of ['Romie-Regular.woff2','Roobert-Regular.woff2','Roobert-Bold.woff2']) await copyFile(path.join(root,'public/fonts',font),path.join(site,'assets',font));
await copyFile(path.join(root,'public/brand/chmurnik-wordmark.png'),path.join(site,'assets/wordmark.png'));
await copyFile(path.join(here,'gallery.css'),path.join(site,'gallery.css'));
await copyFile(path.join(root,'social/2026-09-03-full/site/ZRODLA-ZDJEC.txt'),path.join(site,'ZRODLA-ZDJEC.txt'));
const record = async (file, extra={}) => {const b=await readFile(path.join(site,file));return {...extra,file,bytes:b.length,sha256:hash(b)};};
const wallpapers = [];
for (const motif of motifs) {
  for (const orientation of ['desktop','phone']) {
    const source = path.join(root,'social/2026-09-05-wallpapers/art',`${motif.id}-${orientation}-source.png`);
    const meta = await sharp(source).metadata();
    assert(meta.width >= 900 && meta.height >= 900, `Source resolution too small: ${source}`);
    assert(orientation==='desktop' ? meta.width>meta.height : meta.height>meta.width, `Wrong source orientation: ${source}`);
    const original = `oryginaly/${motif.id}-${orientation}-${meta.width}x${meta.height}.png`;
    // Remove ancillary metadata; preserve original pixel dimensions without resampling.
    await sharp(source).flatten({background:'#f8e2ea'}).png({compressionLevel:9}).toFile(path.join(site,original));
    const [width,height] = orientation==='desktop' ? [3840,2160] : [2160,3840];
    const file = `tapety/${motif.id}-${width}x${height}.png`;
    await sharp(path.join(site,original)).resize(width,height,{fit:'cover',position:'centre',kernel:'lanczos3'}).png({compressionLevel:9}).toFile(path.join(site,file));
    const preview = `previews/tapety/${motif.id}-${orientation}.jpg`;
    await sharp(path.join(site,file)).resize(orientation==='desktop'?600:300,orientation==='desktop'?338:533,{fit:'inside'}).jpeg({quality:88}).toFile(path.join(site,preview));
    wallpapers.push(await record(file,{...motif,orientation,width,height,preview,downloadUrl:release+path.basename(file),sourceWidth:meta.width,sourceHeight:meta.height,
      sourceSHA256:hash(await readFile(source)),upscaled:meta.width<width||meta.height<height,
      original:await record(original,{width:meta.width,height:meta.height,downloadUrl:release+path.basename(original)})}));
    console.log(`Wallpaper ${motif.id}/${orientation}: original ${meta.width}x${meta.height}, export ${width}x${height}`);
  }
}
assert.equal(wallpapers.length,40); assert.equal(new Set(wallpapers.map(w=>w.sha256)).size,40);
const css = await readFile(path.join(here,'artwork.css'),'utf8');
function visual(index) {
  const [kind,id] = visuals[index];
  const src = kind==='art' ? `/social/2026-09-05-wallpapers/art/${id}-desktop-source.png` : `/social/2026-09-03-full/captures/${id}-poster.png`;
  return `<div class="visual ${kind}"><img src="${src}" alt=""></div>`;
}
function slide(s,format='carousel') {
  const note = s.note || (s.credit ? 'Fot. PiccoloNamek, Famartin i inni. Autorzy i licencje w galerii.' : '');
  return `<article class="slide ${format==='story'?'story':''} ${s.theme} slide-${String(s.number).padStart(2,'0')}"><header data-safe><div class="wordmark"></div><span>${escape(s.label)} / ${String(s.number).padStart(2,'0')}</span></header><h1 data-safe>${escape(s.lead)}</h1>${visual(s.number-1)}<p class="copy" data-safe>${escape(s.body)}</p><p class="note" data-safe><a href="${canonical}#zrodla">${escape(note)}</a></p><div class="sticker"></div><footer data-safe><a href="https://chmurnik.cloud/">chmurnik.cloud</a><a href="${s.storeUrl}">${escape(s.cta || 'Z ciekawości nieba')}</a></footer></article>`;
}
const document = body => `<!doctype html><html lang="pl"><head><meta charset="utf-8"><title>${escape(title)}</title><style>${css}</style></head><body>${body}</body></html>`;
const types = {'.png':'image/png','.jpg':'image/jpeg','.woff2':'font/woff2','.css':'text/css','.html':'text/html','.json':'application/json','.txt':'text/plain; charset=utf-8','.pdf':'application/pdf'};
const server = createServer(async(req,res)=>{
  try {
    const url = new URL(req.url,'http://localhost');
    if(url.pathname==='/artwork') {const s=stories[Number(url.searchParams.get('n'))-1];assert(s);res.setHeader('Content-Type','text/html');res.end(document(slide(s,url.searchParams.get('format'))));return;}
    if(url.pathname==='/document') {res.setHeader('Content-Type','text/html');res.end(document(stories.map(s=>slide(s)).join('')));return;}
    const file = path.resolve(root,'.'+decodeURIComponent(url.pathname));assert(file.startsWith(root+path.sep));
    res.setHeader('Content-Type',types[path.extname(file)]||'application/octet-stream');res.end(await readFile(file));
  }catch{res.writeHead(404);res.end();}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const playwrightPath = process.env.PLAYWRIGHT_MODULE || '/Users/mieszkomahboob/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
const {chromium} = await import(pathToFileURL(playwrightPath));
const browser = await chromium.launch({headless:true});
const artworks = [];
try {
  const page = await browser.newPage({deviceScaleFactor:1});
  const ready = () => page.evaluate(async()=>{await document.fonts.ready;await Promise.all([...document.images].map(i=>i.decode()));});
  for (const format of ['story','carousel']) {
    const height = format==='story'?1920:1350;
    await page.setViewportSize({width:1080,height});
    for(const s of stories) {
      await page.goto(`http://127.0.0.1:${server.address().port}/artwork?n=${s.number}&format=${format}`);await ready();
      const layout = await page.evaluate(()=>{
        const r=e=>{const a=e.getBoundingClientRect();return {x:a.x,y:a.y,right:a.right,bottom:a.bottom};};
        return {lead:document.querySelector('h1').textContent,body:document.querySelector('.copy').textContent,
          h1:r(document.querySelector('h1')),visual:r(document.querySelector('.visual')),copy:r(document.querySelector('.copy')),note:r(document.querySelector('.note')),
          safe:[...document.querySelectorAll('[data-safe]')].map(r),fonts:document.fonts.check('32px Roobert')&&document.fonts.check('75px Romie')};
      });
      assert.equal(layout.lead,s.lead);assert.equal(layout.body,s.body);assert(layout.fonts);
      assert(layout.h1.bottom<layout.visual.y-15,`Headline overlap: ${format}/${s.id}`);
      assert(layout.copy.y>layout.visual.bottom+25&&layout.copy.bottom<layout.note.y-12,`Copy collision: ${format}/${s.id}: ${JSON.stringify(layout)}`);
      assert(layout.safe.every(r=>r.x>=60&&r.right<=1020&&r.y>=(format==='story'?210:50)&&r.bottom<=(format==='story'?1730:1310)),`Safe area: ${format}/${s.id}`);
      const file = `${format==='story'?'stories':'karuzela'}/${s.id}.png`;
      await page.screenshot({path:path.join(site,file)});
      const preview=`previews/${format==='story'?'stories':'karuzela'}/${s.id}.jpg`;
      await sharp(path.join(site,file)).resize(324,format==='story'?576:405).jpeg({quality:89}).toFile(path.join(site,preview));
      artworks.push(await record(file,{id:s.id,format,width:1080,height,preview,lead:s.lead,body:s.body,link:s.storeUrl,sticker:s.stickerLabel}));
      await writeFile(path.join(qa,`${format}-${s.id}-layout.json`),JSON.stringify(layout,null,2));
      console.log(`Rendered ${format}/${s.id}`);
    }
  }
  await page.goto(`http://127.0.0.1:${server.address().port}/document`);await ready();
  await page.pdf({path:path.join(site,'CHMURNIK-NIEBO-LINKEDIN.pdf'),printBackground:true,preferCSSPageSize:true,tagged:true});
} finally {await browser.close();await new Promise(resolve=>server.close(resolve));}
const facebook='facebook/chmurnik-niebo.png';
await sharp(path.join(site,'karuzela/10-zaproszenie.png')).resize(1200,1500).png().toFile(path.join(site,facebook));
await sharp(path.join(site,facebook)).resize(432,540).jpeg({quality:89}).toFile(path.join(site,'previews/facebook.jpg'));
artworks.push(await record(facebook,{format:'facebook',width:1200,height:1500,preview:'previews/facebook.jpg',lead:stories[9].lead,body:stories[9].body}));
const captions=[];
for(const id of ['instagram','facebook','linkedin']) {
  const approvedText = await readFile(path.join(root,'social/2026-09-03-full/site/teksty',`${id}-post.txt`),'utf8');
  await writeFile(path.join(site,'teksty',`${id}-historia.txt`),approvedText);
  const text = progressCaptions[id];
  await writeFile(path.join(site,'teksty',`${id}-post.txt`),text);
  captions.push({id,text});
}
await writeFile(path.join(site,'TEKSTY-I-LINKI.txt'),stories.map(s=>`${s.number}. ${s.lead}\n${s.body}\n${s.cta||''}\n${s.note||''}\nNaklejka: ${s.stickerLabel}\n${s.storeUrl}\n`).join('\n'));
await writeFile(path.join(site,'PUBLIKACJA.txt'),`CHMURNIK / ${title}\nNowa oprawa statyczna, 7 września 2026. Opowieść 01-10 możesz opublikować samodzielnie; aktualizacje 11-13 również tworzą oddzielną krótką serię. Pierwsze 10 plansz zachowuje pełne zaakceptowane teksty. Plansze 11-13 i nowe podpisy opisują stan modelu oraz Androida, zgodnie z dodatkową dyspozycją właściciela. Starsze pełne podpisy zachowano w teksty/*-historia.txt. Nic nie zostało opublikowane automatycznie na kontach społecznościowych.\n\nSTORIES: 13 PNG 1080x1920 w kolejności 01-13. Dodaj własną muzykę oraz naklejkę z linkiem z TEKSTY-I-LINKI.txt, w pustym miejscu nad dolną linią.\nINSTAGRAM: 13 PNG 1080x1350 z karuzela i pełny opis z teksty/instagram-post.txt. Link w opisie nie jest klikalny.\nFACEBOOK: facebook/chmurnik-niebo.png i teksty/facebook-post.txt.\nLINKEDIN: CHMURNIK-NIEBO-LINKEDIN.pdf jako dokument i teksty/linkedin-post.txt. Tytuł dokumentu: ${title} W interfejsie właściciela opcja dokumentu była dostępna w aplikacji na telefonie.\n\nTAPETY: 20 nowych motywów x 2 osobno wygenerowane kompozycje (telefon/komputer) x 2 warianty pliku = 80 PNG. Folder oryginaly zachowuje rozdzielczość źródłową; usunięto dodatkowe metadane. Folder tapety zawiera eksporty 3840x2160 i 2160x3840. Mniejsze źródła są powiększone filtrem Lanczos; 4K nie oznacza natywnej rozdzielczości generatora ani nowych detali. Dokładne wymiary i pochodzenie zapisano w manifest.json.\n\nEkrany pochodzą z wcześniej przygotowanych, autentycznych ujęć interfejsu w izolowanej przeglądarce z września 2026. To nie nowy film ani aktualny zrzut fizycznego iPhone'a. Ilustracje i tapety są dekoracyjne, nie służą do rozpoznawania rodzajów chmur. Zachowaj ZRODLA-ZDJEC.txt.\n\nNarzędzia meteorologiczne służą do nauki, nie zastępują oficjalnego briefingu. Pracownia Windy jest niezależna, bez integracji z Windy. Telefon nie mierzy wiatru. Ten pakiet NIE ogłasza nowego modelu rozpoznawania.\n\nStała biblioteka: ${hub}\nTa seria: ${canonical}\nGaleria jest publiczna, bez logowania, z noindex. Można przekazać link dalej. Tapety do osobistego użytku jako tło ekranu.\n`);
const common=['PUBLIKACJA.txt','ZRODLA-ZDJEC.txt',...captions.map(c=>`teksty/${c.id}-historia.txt`)];
const archives=[
  ['CHMURNIK-NIEBO-STORIES.zip','Stories · 13 PNG',[...common,...artworks.filter(a=>a.format==='story').map(a=>a.file),'TEKSTY-I-LINKI.txt']],
  ['CHMURNIK-NIEBO-INSTAGRAM.zip','Instagram · karuzela i opis',[...common,...artworks.filter(a=>a.format==='carousel').map(a=>a.file),'teksty/instagram-post.txt']],
  ['CHMURNIK-NIEBO-FACEBOOK.zip','Facebook · grafika i post',[...common,facebook,'teksty/facebook-post.txt']],
  ['CHMURNIK-NIEBO-LINKEDIN.zip','LinkedIn · PDF i post',[...common,'CHMURNIK-NIEBO-LINKEDIN.pdf','teksty/linkedin-post.txt']],
  ['CHMURNIK-20-TAPET-4K.zip','20 motywów · 40 eksportów 4K',['PUBLIKACJA.txt',...wallpapers.map(w=>w.file)]],
  ['CHMURNIK-20-TAPET-ORYGINALY.zip','20 motywów · 40 oryginałów',['PUBLIKACJA.txt',...wallpapers.map(w=>w.original.file)]],
  ['CHMURNIK-NIEBO-CALOSC.zip','Całość · sociale i 80 PNG tapet',[...common,'TEKSTY-I-LINKI.txt',...artworks.map(a=>a.file),'CHMURNIK-NIEBO-LINKEDIN.pdf',...captions.map(c=>`teksty/${c.id}-post.txt`),...wallpapers.flatMap(w=>[w.file,w.original.file])]],
].map(([file,label,entries])=>({file,label,entries,url:release+file}));
for(const archive of archives) {
  const target=path.join(bundles,archive.file);await writeDownloadZip(site,target,archive.entries);
  execFileSync('unzip',['-t',target],{stdio:'pipe'});const bytes=await readFile(target);
  archive.bytes=bytes.length;archive.sha256=hash(bytes);
}
const manifest={title,date:'2026-09-07',canonical,hub,approvedCopySource:'social/2026-09-03-full/copy.mjs',approvedCopySHA256:hash(await readFile(path.join(root,'social/2026-09-03-full/copy.mjs'))),
  wallpaperGeneration:'Built-in image generation; separately composed landscape and portrait sources. Upscaling explicitly accepted by owner on September6.',
  wallpapers,artworks,captions,archives,document:await record('CHMURNIK-NIEBO-LINKEDIN.pdf',{pages:13})};
await writeFile(path.join(site,'manifest.json'),JSON.stringify(manifest,null,2));
const button=a=>`<a class="button primary" href="${a.url}" download>${escape(a.label)} <small>${Math.round(a.bytes/1048576)} MB ↓</small></a>`;
const gallery=(format)=>artworks.filter(a=>a.format===format).map(a=>`<article class="card ${format}"><a href="${a.file}" download><img loading="lazy" src="${a.preview}" alt="${escape(a.lead)}"></a><h3>${escape(a.lead)}</h3><a href="${a.file}" download>Pobierz PNG · ${a.width} × ${a.height}</a>${format==='story'?`<p class="note">Naklejka: ${escape(a.sticker)}</p><input readonly aria-label="Link do naklejki" value="${a.link}">`:''}</article>`).join('');
const wallpaperCards=motifs.map(m=>{
  const pair=wallpapers.filter(w=>w.id===m.id);
  return `<article class="card"><div class="pair">${pair.map(w=>`<a href="${w.downloadUrl}" download><img loading="lazy" src="${w.preview}" alt="${escape(m.title)} · ${w.orientation==='desktop'?'komputer':'telefon'}"></a>`).join('')}</div><h3>${m.id.slice(0,2)} / ${escape(m.title)}</h3>${pair.map(w=>`<p>${w.orientation==='desktop'?'Komputer':'Telefon'}</p><div class="files"><a href="${w.downloadUrl}" download>Eksport 4K<small>${w.width} × ${w.height}${w.upscaled?' · powiększony':''}</small></a><a href="${w.original.downloadUrl}" download>Oryginał<small>${w.sourceWidth} × ${w.sourceHeight} · bez powiększania</small></a></div>`).join('')}</article>`;
}).join('');
await writeFile(path.join(site,'index.html'),`<!doctype html><html lang="pl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>${escape(title)} · CHMURNIK</title><link rel="stylesheet" href="gallery.css"></head><body><header><a href="../../assetySM/"><img src="assets/wordmark.png" alt="CHMURNIK"></a><a href="../../assetySM/">Wszystkie materiały SM</a></header><main><p class="eyebrow">Nowa oprawa / 7 września 2026</p><h1>${escape(title)}</h1><p class="intro">Pełna, zaakceptowana opowieść w nowej, statycznej oprawie oraz trzy dodatkowe plansze o modelu i Androidzie. Stories, karuzela, Facebook i LinkedIn. Do tego 20 nowych motywów tapet: na telefon i komputer, jako oryginały i eksporty 4K.</p><div class="downloads">${button(archives.at(-1))}</div><p class="note">ZIP-y i tapety pobierzesz z GitHuba. Indywidualne PNG są niżej, bez rozpakowywania. Żaden post nie został opublikowany na Twoich kontach.</p><nav><a href="#tapety">20 tapet / 80 PNG</a><a href="#stories">Stories</a><a href="#instagram">Instagram</a><a href="#facebook">Facebook</a><a href="#linkedin">LinkedIn</a><a href="#zrodla">Źródła i instrukcja</a></nav><section class="section" id="tapety"><p class="eyebrow">Dodatek do pobrania</p><h2>Trochę nieba na co dzień.</h2><p>20 różnych motywów. Każdy ma dwie osobne kompozycje: poziomą i pionową. Do każdej wybierasz oryginał albo powiększony eksport 4K. Łącznie 80 PNG.</p><p class="note">Eksport 4K ma 3840 × 2160 lub 2160 × 3840 pikseli. Powiększenie nie dodaje nowych detali. Oryginały zachowują rozdzielczość źródłową; dokładne wymiary są przy każdym pliku. Tapety są ilustracjami, nie fotografiami do nauki rozpoznawania.</p><div class="downloads">${button(archives[4])}${button(archives[5])}</div><p><label>Link do samych tapet<input readonly value="${canonical}#tapety"></label></p><div class="grid">${wallpaperCards}</div></section><section class="section" id="stories"><h2>10 Stories i 3 aktualizacje.</h2><p>PNG 1080 × 1920. Cały zaakceptowany tekst pozostaje na planszy. Link dodaj jako naklejkę w Instagramie.</p>${button(archives[0])}<div class="story-grid">${gallery('story')}</div></section><section class="section" id="instagram"><h2>Instagram / karuzela.</h2>${button(archives[1])}<div class="story-grid">${gallery('carousel')}</div></section><section class="section" id="facebook"><h2>Facebook.</h2>${button(archives[2])}<div style="max-width:430px">${gallery('facebook')}</div></section><section class="section" id="linkedin"><h2>LinkedIn / dokument.</h2>${button(archives[3])}<p><a href="CHMURNIK-NIEBO-LINKEDIN.pdf" download>Pobierz sam PDF · 13 stron</a></p><p>Tytuł dokumentu: <strong>${escape(title)}</strong></p></section><section class="section" id="teksty"><h2>Pełne teksty do publikacji.</h2><p>Nowe podpisy opisują rzeczywisty etap prac nad modelem i Androidem, bez deklaracji nowej skuteczności. Pełne wcześniejsze podpisy opowieści również pozostają do pobrania.</p>${captions.map(c=>`<article class="copybox" id="post-${c.id}"><h3>${escape(c.id)}</h3><button type="button" data-copy="copy-${c.id}">Kopiuj cały tekst</button> <a href="teksty/${c.id}-post.txt" download>Pobierz aktualny TXT</a> · <a href="teksty/${c.id}-historia.txt" download>Wcześniejszy pełny tekst opowieści</a><pre id="copy-${c.id}">${escape(c.text)}</pre></article>`).join('')}</section><section class="section" id="zrodla"><h2>Źródła i instrukcja.</h2><p>Ujęcia interfejsu pochodzą z wcześniej przygotowanych materiałów z września 2026. Ilustracje są dekoracyjne. Pakiet nie ogłasza nowego modelu rozpoznawania.</p><a href="ZRODLA-ZDJEC.txt">Autorzy i licencje zdjęć</a> · <a href="PUBLIKACJA.txt">Instrukcja publikacji i formaty</a> · <a href="TEKSTY-I-LINKI.txt">Pełne teksty Stories i linki</a></section></main><footer><a href="${hub}">Stała biblioteka: assetySM</a><p>Publiczna galeria bez logowania. Możesz przekazać link zainteresowanym. Dotychczasowe pakiety pozostają dostępne.</p></footer><script src="gallery.js"></script></body></html>`);
await writeFile(path.join(site,'gallery.js'),`document.querySelectorAll('[data-copy]').forEach(button=>button.addEventListener('click',async()=>{try{await navigator.clipboard.writeText(document.getElementById(button.dataset.copy).textContent);button.textContent='Skopiowano';}catch{button.textContent='Użyj linku Pobierz TXT';}}));\n`);
const thumbs=await Promise.all(artworks.filter(a=>a.format==='story').map(a=>sharp(path.join(site,a.file)).resize(216,384).toBuffer()));
await sharp({create:{width:1120,height:1208,channels:3,background:'#e6ddd3'}}).composite(thumbs.map((input,i)=>({input,left:8+(i%5)*224,top:8+Math.floor(i/5)*400}))).png().toFile(path.join(qa,'stories-contact-sheet.png'));
console.log(`Ready: ${artworks.length} social PNG, 13-page PDF, ${wallpapers.length*2} wallpaper PNG, ${archives.length} verified ZIPs.`);
