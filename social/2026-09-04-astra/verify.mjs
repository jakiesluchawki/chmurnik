import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile, writeFile, readdir, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import sharp from 'sharp';
import { stories } from './copy.mjs';

const here=path.dirname(fileURLToPath(import.meta.url));
const root=path.resolve(here,'../..');
const site=path.join(here,'site');
const qa=path.join(root,'build/astra-stories-qa');
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const manifest=JSON.parse(await readFile(path.join(site,'manifest.json')));
const zip=path.join(site,'CHMURNIK-ASTRA-10-STORIES-PNG.zip');
assert.equal(manifest.stories.length,10);
assert.equal((await readdir(path.join(site,'png'))).length,10);
const entries=execFileSync('unzip',['-Z1',zip],{encoding:'utf8'}).trim().split('\n');
assert.equal(entries.length,13);
assert.equal(entries.filter(e=>e.endsWith('.png')).length,10);
assert(!entries.some(e=>/\.(mov|mp4|m4v|mp3|wav)$/i.test(e)));
execFileSync('unzip',['-t',zip]);
for(const [i,record] of manifest.stories.entries()){
  const story=stories[i];
  assert.equal(record.lead,story.lead);assert.equal(record.body,story.body);assert.equal(record.link,story.link);
  const bytes=await readFile(path.join(site,record.file));
  const meta=await sharp(bytes).metadata();
  assert.equal(meta.width,1080);assert.equal(meta.height,1920);assert.equal(meta.format,'png');assert.equal(meta.hasAlpha,false);
  assert.equal(hash(bytes),record.sha256);
  assert.equal(hash(execFileSync('unzip',['-p',zip,path.basename(record.file)])),record.sha256);
  const layout=JSON.parse(await readFile(path.join(qa,`${story.id}-layout.json`)));
  assert.equal(layout.lead,story.lead);assert.equal(layout.body,story.body);
  assert(layout.headline.bottom<=568);assert(layout.copy.bottom<=1555);
  assert(layout.safe.every(r=>r.x>=60&&r.right<=1020&&r.y>=210&&r.bottom<=1704));
}
await mkdir(path.join(qa,'swift-cache'),{recursive:true});
execFileSync('xcrun',['swift','-module-cache-path',path.join(qa,'swift-cache'),path.join(root,'social/2026-09-03-full/read-copy.swift'),path.join(qa,'ocr-checks.json'),path.join(qa,'ocr-results.json')],{stdio:'inherit'});
const norm=s=>s.normalize('NFD').replace(/\p{M}/gu,'').toLowerCase().replaceAll('ł','l').replaceAll('і','i').replace(/[^a-z0-9]/g,'');
function coverage(expected,actual){
  const a=norm(expected),b=norm(actual),row=new Uint16Array(b.length+1);
  for(const c of a){let previous=0;for(let j=1;j<=b.length;j++){const old=row[j];row[j]=c===b[j-1]?previous+1:Math.max(row[j],row[j-1]);previous=old;}}
  return row[b.length]/a.length;
}
const ocr=JSON.parse(await readFile(path.join(qa,'ocr-results.json')));
const ocrScores=ocr.map(r=>({id:r.id,coverage:coverage(r.expected,r.recognized)}));
assert(ocrScores.every(r=>r.coverage>=.985),JSON.stringify(ocrScores));

const server=createServer(async(req,res)=>{
  try{
    const url=new URL(req.url,'http://127.0.0.1');
    const file=path.resolve(site,'.'+decodeURIComponent(url.pathname==='/'?'/index.html':url.pathname));
    if(!file.startsWith(site+path.sep))throw Error('Outside gallery');
    const types={'.html':'text/html; charset=utf-8','.css':'text/css','.js':'text/javascript','.jpg':'image/jpeg','.png':'image/png','.woff2':'font/woff2','.zip':'application/zip','.txt':'text/plain; charset=utf-8'};
    res.setHeader('Content-Type',types[path.extname(file)]||'application/octet-stream');res.end(await readFile(file));
  }catch{res.writeHead(404);res.end();}
});
await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',resolve);});
const base=`http://127.0.0.1:${server.address().port}`;
const {chromium}=await import(pathToFileURL(path.join(root,'.local/qa-tools/node_modules/playwright/index.mjs')));
let browser;
const viewportChecks=[];
try{
  browser=await chromium.launch({headless:true});
  const context=await browser.newContext({viewport:{width:390,height:844},permissions:['clipboard-read','clipboard-write']});
  const page=await context.newPage();
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  for(const width of [390,768,1440]){
    await page.setViewportSize({width,height:1000});
    await page.goto(base);await page.evaluate(()=>document.fonts.ready);
    const metrics=await page.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth,articles:document.querySelectorAll('article').length,downloads:[...document.querySelectorAll('a[download]')].length}));
    assert.equal(metrics.width,metrics.scroll);assert.equal(metrics.articles,10);assert.equal(metrics.downloads,21);
    viewportChecks.push(metrics);
    if(width===390||width===1440)await page.screenshot({path:path.join(qa,`gallery-${width}.png`)});
  }
  const shown=await page.locator('article').evaluateAll(nodes=>nodes.map(n=>({lead:n.querySelector('h2').textContent,body:n.querySelector('.card-copy>p').textContent})));
  for(const [i,r]of shown.entries()){assert.equal(r.lead,stories[i].lead);assert.equal(r.body,stories[i].body);}
  await page.getByRole('button',{name:'Kopiuj link',exact:true}).first().click();
  assert.equal(await page.evaluate(()=>navigator.clipboard.readText()),stories[0].link);
  const downloadPromise=page.waitForEvent('download');
  await page.locator('article .button').first().click();
  const download=await downloadPromise;
  assert.equal(hash(await readFile(await download.path())),manifest.stories[0].sha256);
  const zipPromise=page.waitForEvent('download');
  await page.locator('.button.big').click();
  const zipDownload=await zipPromise;
  assert.equal(hash(await readFile(await zipDownload.path())),hash(await readFile(zip)));
  for(const file of await page.locator('[src],[href]').evaluateAll(nodes=>nodes.map(n=>n.getAttribute('src')||n.getAttribute('href')).filter(v=>v&&!v.startsWith('http')&&!v.startsWith('../')))){
    const response=await page.request.get(new URL(file,base).href);assert(response.ok(),`Broken link: ${file}`);
  }
  assert.deepEqual(errors,[]);
}finally{await browser?.close();await new Promise(resolve=>server.close(resolve));}
const result={checkedAt:new Date().toISOString(),pngCount:10,dimensions:'1080x1920',exactDomCopy:true,zipEntries:entries,ocrScores,viewportChecks,downloadSha256Verified:true,clipboardVerified:true,publicSiteHasNoVideo:true};
await writeFile(path.join(qa,'verification.json'),JSON.stringify(result,null,2));
console.log(JSON.stringify(result,null,2));
