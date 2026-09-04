import assert from 'node:assert/strict';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createServer } from 'node:http';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import sharp from 'sharp';
import { stories, campaign } from './copy.mjs';
import { captions } from './captions.mjs';

const here=path.dirname(fileURLToPath(import.meta.url));
const root=path.resolve(here,'../..');
const site=path.join(here,'site');
const qa=path.join(root,'build/astra-platforms-qa');
const manifest=JSON.parse(await readFile(path.join(site,'platforms-manifest.json')));
const original=JSON.parse(await readFile(path.join(site,'manifest.json')));
const bonus=JSON.parse(await readFile(path.join(site,'wallpapers-manifest.json')));
const hash=b=>createHash('sha256').update(b).digest('hex');
// Chromium's PDF font map exposes the nonbreaking hyphen as its visible ASCII glyph.
const normalized=s=>s.normalize('NFC').replace(/[\u2010\u2011]/g,'-').replace(/\s+/g,'');
assert.equal(manifest.artworks.length,11);assert.equal(manifest.documents.length,1);
for (const [i,a] of manifest.artworks.entries()) {
  const bytes=await readFile(path.join(site,a.file));
  assert.equal(hash(bytes),a.sha256);
  const meta=await sharp(bytes).metadata();
  assert.equal(meta.width,a.width);assert.equal(meta.height,a.height);assert.equal(meta.format,'png');assert.equal(meta.hasAlpha,false);
  if(i<10){assert.equal(a.lead,stories[i].lead);assert.equal(a.body,stories[i].body);}
  const layout=JSON.parse(await readFile(path.join(qa,`${a.id}-layout.json`)));
  assert.equal(layout.lead,a.lead);assert.equal(layout.body,a.body);
  assert(layout.headline.bottom<layout.visual.y&&layout.copy.bottom<layout.footer.y);
}
for(const s of original.stories)assert.equal(hash(await readFile(path.join(site,s.file))),s.sha256);
for(const c of captions)assert.equal(await readFile(path.join(site,`teksty/${c.id}-post.txt`),'utf8'),c.text+'\n');
assert(captions.find(c=>c.id==='instagram').text.length<2200);
assert(captions.find(c=>c.id==='linkedin').text.length<3000);
for(const wallpaper of bonus.wallpapers){
  const bytes=await readFile(path.join(site,wallpaper.file)),meta=await sharp(bytes).metadata();
  assert.equal(hash(bytes),wallpaper.sha256);assert.equal(meta.width,wallpaper.width);assert.equal(meta.height,wallpaper.height);
  assert.equal(meta.format,'png');assert.equal(meta.hasAlpha,false);
}
for(const archive of [...manifest.archives,bonus.archive]){
  const file=path.join(site,archive.file);
  assert.equal(hash(await readFile(file)),archive.sha256);
  assert.deepEqual(execFileSync('unzip',['-Z1',file],{encoding:'utf8'}).trim().split('\n'),archive.entries);
  assert(!archive.entries.some(e=>/\.(mp4|mov|woff2|wav)$/i.test(e)||e.startsWith('art/')));
  execFileSync('unzip',['-t',file]);
  for(const entry of archive.entries)assert.equal(hash(execFileSync('unzip',['-p',file,entry],{maxBuffer:32*1024*1024})),hash(await readFile(path.join(site,entry))));
}

// Use the available bundled PDF.js renderer when Poppler is absent on the host.
const modules=process.env.PDF_QA_MODULES||'/Applications/ChatGPT.app/Contents/Resources/cua_node/lib/node_modules';
const pdfjs=await import(pathToFileURL(path.join(modules,'pdfjs-dist/legacy/build/pdf.mjs')));
const require=createRequire(import.meta.url);
const {createCanvas}=require(path.join(modules,'@napi-rs/canvas'));
const pdfBytes=await readFile(path.join(site,manifest.documents[0].file));
assert.equal(hash(pdfBytes),manifest.documents[0].sha256);
const pdf=await pdfjs.getDocument({data:new Uint8Array(pdfBytes),standardFontDataUrl:path.join(modules,'pdfjs-dist/standard_fonts/'),wasmUrl:path.join(modules,'pdfjs-dist/wasm/')}).promise;
assert.equal(pdf.numPages,10);
await mkdir(path.join(qa,'pdf'),{recursive:true});
const pdfChecks=[];
for(let number=1;number<=10;number++){
  const page=await pdf.getPage(number),viewport=page.getViewport({scale:1});
  assert(Math.abs(viewport.width-810)<1);assert(Math.abs(viewport.height-1012.5)<1);
  const content=await page.getTextContent();
  const text=normalized(content.items.map(i=>i.str||'').join(' '));
  const story=stories[number-1];
  assert(text.includes(normalized(story.lead)),`PDF page ${number}: missing headline`);
  assert(text.includes(normalized(story.body)),`PDF page ${number}: missing body`);
  const links=(await page.getAnnotations()).map(a=>a.url).filter(Boolean);
  assert(links.includes(campaign.webUrl));
  if(number===10)assert(links.includes(campaign.storeUrl));
  if([6,8,9].includes(number))assert(links.includes('https://commons.wikimedia.org/wiki/File:CirrusField-color.jpg'));
  const canvas=createCanvas(Math.ceil(viewport.width),Math.ceil(viewport.height));
  await page.render({canvasContext:canvas.getContext('2d'),viewport}).promise;
  await writeFile(path.join(qa,'pdf',`page-${String(number).padStart(2,'0')}.png`),canvas.toBuffer('image/png'));
  pdfChecks.push({page:number,fullApprovedText:true,links});
}
await pdf.destroy();
const pdfThumbs=[];
for(let number=1;number<=10;number++)pdfThumbs.push(await sharp(path.join(qa,'pdf',`page-${String(number).padStart(2,'0')}.png`)).resize(216,270).toBuffer());
await sharp({create:{width:1120,height:564,channels:3,background:'#ddd5cb'}}).composite(pdfThumbs.map((input,i)=>({input,left:8+(i%5)*224,top:8+Math.floor(i/5)*278}))).png().toFile(path.join(qa,'pdf-contact-sheet.png'));

await mkdir(path.join(qa,'swift-cache'),{recursive:true});
execFileSync('xcrun',['swift','-module-cache-path',path.join(qa,'swift-cache'),path.join(root,'social/2026-09-03-full/read-copy.swift'),path.join(qa,'ocr-checks.json'),path.join(qa,'ocr-results.json')],{stdio:'inherit'});
const norm=s=>s.normalize('NFD').replace(/\p{M}/gu,'').toLowerCase().replaceAll('ł','l').replaceAll('і','i').replace(/[^a-z0-9]/g,'');
function coverage(expected,actual){const a=norm(expected),b=norm(actual),row=new Uint16Array(b.length+1);for(const c of a){let previous=0;for(let j=1;j<=b.length;j++){const old=row[j];row[j]=c===b[j-1]?previous+1:Math.max(row[j],row[j-1]);previous=old;}}return row[b.length]/a.length;}
const ocr=JSON.parse(await readFile(path.join(qa,'ocr-results.json'))).map(r=>({id:r.id,coverage:coverage(r.expected,r.recognized)}));
assert(ocr.every(r=>r.coverage>=.985),JSON.stringify(ocr));

const server=createServer(async(req,res)=>{
  try{
    const url=new URL(req.url,'http://127.0.0.1');
    const file=path.resolve(site,'.'+decodeURIComponent(url.pathname==='/'?'/index.html':url.pathname));assert(file.startsWith(site+path.sep));
    res.setHeader('Content-Type',({'.html':'text/html; charset=utf-8','.css':'text/css','.js':'text/javascript','.jpg':'image/jpeg','.png':'image/png','.woff2':'font/woff2','.pdf':'application/pdf','.txt':'text/plain; charset=utf-8','.zip':'application/zip'})[path.extname(file)]||'application/octet-stream');res.end(await readFile(file));
  }catch{res.writeHead(404);res.end();}
});
await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',resolve);});
const base=`http://127.0.0.1:${server.address().port}`;
const {chromium}=await import(pathToFileURL(path.join(root,'.local/qa-tools/node_modules/playwright/index.mjs')));
let browser;const viewports=[];
try{
  browser=await chromium.launch({headless:true});
  const context=await browser.newContext({permissions:['clipboard-read','clipboard-write']});const page=await context.newPage();
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  for(const width of [390,768,1440]){
    await page.setViewportSize({width,height:1000});await page.goto(base);await page.evaluate(()=>document.fonts.ready);
    const metrics=await page.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth,carousel:document.querySelectorAll('.carousel-card').length,stories:document.querySelectorAll('.stories article').length}));
    assert.equal(metrics.width,metrics.scroll);assert.equal(metrics.carousel,10);assert.equal(metrics.stories,10);viewports.push(metrics);
    await page.screenshot({path:path.join(qa,`gallery-${width}.png`)});
    assert.equal(await page.locator('.wallpaper-card').count(),3);
    await page.locator('#tapety').screenshot({path:path.join(qa,`wallpapers-gallery-${width}.png`)});
  }
  for(const c of captions){
    await page.locator(`.copy-post[data-target="post-${c.id}"]`).click();
    assert.equal(await page.evaluate(()=>navigator.clipboard.readText()),c.text);
  }
  await page.locator('.copy-post[data-target="wallpaper-share-link"]').click();
  assert.equal(await page.evaluate(()=>navigator.clipboard.readText()),campaign.galleryUrl+'#tapety');
  const downloads=[...manifest.archives,manifest.documents[0],manifest.artworks[0],manifest.artworks[10],bonus.archive,...bonus.wallpapers.slice(0,2)];
  for(const file of downloads){
    const pending=page.waitForEvent('download');await page.locator(`a[download][href="${file.file}"]`).first().click();const result=await pending;
    assert.equal(hash(await readFile(await result.path())),file.sha256);
  }
  for(const file of await page.locator('[src],[href]').evaluateAll(nodes=>nodes.map(n=>n.getAttribute('src')||n.getAttribute('href')).filter(v=>v&&!v.startsWith('http')&&!v.startsWith('../')&&!v.startsWith('#'))))assert((await page.request.get(new URL(file,base).href)).ok(),`Broken route: ${file}`);
  assert.deepEqual(errors,[]);
}finally{await browser?.close();await new Promise(resolve=>server.close(resolve));}
const report={checkedAt:new Date().toISOString(),pngCount:11,preservedStories:10,wallpapers:6,archives:[...manifest.archives,bonus.archive].map(a=>({file:a.file,entries:a.entries.length})),pdfChecks,ocr,viewports,clipboardPosts:3,wallpaperLinkCopied:true,verifiedBrowserDownloads:10};
await writeFile(path.join(qa,'verification.json'),JSON.stringify(report,null,2));
console.log(JSON.stringify(report,null,2));
