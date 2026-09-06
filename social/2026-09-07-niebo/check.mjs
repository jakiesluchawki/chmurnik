import assert from 'node:assert/strict';
import {readFile, writeFile, mkdir, stat} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {createServer} from 'node:http';
import path from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';
import sharp from 'sharp';
const here=path.dirname(fileURLToPath(import.meta.url));
const root=path.resolve(here,'../..'), site=path.join(here,'site'), qa=path.join(root,'build/niebo-social-qa');
const m=JSON.parse(await readFile(path.join(site,'manifest.json')));
await mkdir(qa,{recursive:true});
const hash=b=>createHash('sha256').update(b).digest('hex');
assert.equal(m.wallpapers.length,40);
for(const w of m.wallpapers){
  for(const a of [w,w.original]){
    const b=await readFile(path.join(site,a.file)); assert.equal(hash(b),a.sha256);
    const meta=await sharp(b).metadata(); assert.equal(meta.width,a.width);assert.equal(meta.height,a.height);
    assert.equal(meta.exif,undefined);assert.equal(meta.xmp,undefined);
  }
  const source=path.join(root,'social/2026-09-05-wallpapers/art',`${w.id}-${w.orientation}-source.png`);
  const a=await sharp(source).removeAlpha().raw().toBuffer();
  const b=await sharp(path.join(site,w.original.file)).removeAlpha().raw().toBuffer();
  assert(a.equals(b),`Original pixel preservation: ${w.id}/${w.orientation}`);
}
for(let sheet=0;sheet<2;sheet++){
  const tiles=[];
  for(let j=0;j<10;j++){
    const pair=m.wallpapers.slice((sheet*10+j)*2,(sheet*10+j)*2+2);
    const x=20+(j%2)*450,y=20+Math.floor(j/2)*220;
    for(let k=0;k<2;k++){
      const input=await sharp(path.join(site,pair[k].file)).resize(k?100:300,178,{fit:'contain',background:'#e6ddd3'}).png().toBuffer();
      tiles.push({input,left:x+(k?310:0),top:y});
    }
    const label=Buffer.from(`<svg width="410" height="28"><text x="0" y="20" font-family="sans-serif" font-size="15" fill="#333">${pair[0].id}</text></svg>`);
    tiles.push({input:label,left:x,top:y+180});
  }
  await sharp({create:{width:900,height:1120,channels:3,background:'#e6ddd3'}}).composite(tiles).png().toFile(path.join(qa,`wallpapers-${sheet+1}.png`));
}
const server=createServer(async(req,res)=>{
  try{
    const u=new URL(req.url,'http://localhost');
    const base=u.pathname.startsWith('/assetySM/')?path.join(root,'social/library/site'):site;
    const relative=u.pathname.replace(/^\/(assetySM|premiera\/niebo)\//,'')||'index.html';
    const p=path.resolve(base,relative); assert(p.startsWith(base+path.sep));
    const types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.jpg':'image/jpeg','.woff2':'font/woff2'};
    res.setHeader('Content-Type',types[path.extname(p)]||'application/octet-stream');res.end(await readFile(p));
  }catch{res.writeHead(404);res.end();}
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const {chromium}=await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE||'/Users/mieszkomahboob/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs'));
const browser=await chromium.launch({headless:true});
const errors=[],bad=[];
try{
  const page=await browser.newPage();page.on('pageerror',e=>errors.push(e.message));
  page.on('response',r=>{if(r.status()>=400&&!r.url().includes('favicon'))bad.push(r.url());});
  const base=`http://127.0.0.1:${server.address().port}`;
  for(const width of [320,390,768,1440]){
    await page.setViewportSize({width,height:900});await page.goto(base+'/premiera/niebo/');
    await page.evaluate(()=>document.fonts.ready);
    for(const section of ['tapety','stories','instagram','facebook','linkedin','teksty']){
      await page.locator('#'+section).scrollIntoViewIfNeeded();
      assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false,`${width}/${section} overflow`);
    }
    for(const img of await page.locator('img').all()){await img.scrollIntoViewIfNeeded();await img.evaluate(i=>i.decode());}
    assert.equal(await page.locator('#tapety .card').count(),20);
    assert.equal(await page.locator('#tapety .files a').count(),80);
    assert.equal(await page.locator('#stories .card').count(),13);
    assert.equal(await page.locator('#instagram .card').count(),13);
    await page.locator('#tapety .card').first().scrollIntoViewIfNeeded();
    await page.screenshot({path:path.join(qa,`gallery-${width}.png`)});
    const links=await page.locator('a[href]').evaluateAll(as=>as.map(a=>a.getAttribute('href')));
    for(const link of links.filter(l=>!l.startsWith('http')&&!l.startsWith('#')&&!l.startsWith('../'))){
      assert((await stat(path.join(site,link))).isFile(),`Broken local link ${link}`);
    }
  }
  // Inspect the hub without loading archived thumbnails through this focused server.
  await page.route('**/premiera/**',route=>route.request().url().includes('/niebo/')?route.continue():route.fulfill({status:200,contentType:'image/png',body:Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aAc8AAAAASUVORK5CYII=','base64')}));
  await page.goto(base+'/assetySM/');
  assert.equal(await page.locator('.pack').first().getAttribute('id'),'niebo');
  assert.equal(await page.locator('.pack').count(),5);
  await page.screenshot({path:path.join(qa,'hub.png')});
  assert.deepEqual(errors,[]);assert.deepEqual(bad,[]);
}finally{await browser.close();await new Promise(r=>server.close(r));}
await writeFile(path.join(qa,'verification.json'),JSON.stringify({wallpapers:80,originalPixelsPreserved:40,viewports:[320,390,768,1440],stories:13,carousel:13,errors,bad},null,2));
console.log('PASS: 80 PNG, 40 exact original pixel arrays, responsive gallery and complete links.');
