import assert from 'node:assert/strict';
import {readFile, readdir, writeFile, mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import path from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const site=path.join(root,'social/2026-09-07-niebo/site');
const qa=path.join(root,'build/niebo-social-qa');
await mkdir(qa,{recursive:true});
const digest=b=>createHash('sha256').update(b).digest('hex');
const release=JSON.parse(execFileSync('gh',['release','view','sm-niebo-20260907','--repo','jakiesluchawki/chmurnik','--json','assets,isDraft,targetCommitish,url'],{encoding:'utf8',maxBuffer:2e6}));
const expected=[];
for(const folder of ['tapety','oryginaly']){
  for(const name of await readdir(path.join(site,folder))) expected.push(path.join(site,folder,name));
}
const zipFolder=path.join(root,'build/niebo-social-downloads');
for(const name of await readdir(zipFolder)) if(name.endsWith('.zip')) expected.push(path.join(zipFolder,name));
assert.equal(expected.length,87);
assert.equal(release.assets.length,87,'Incomplete release upload');
for(const file of expected){
  const asset=release.assets.find(a=>a.name===path.basename(file));
  assert(asset,`Missing ${file}`);const bytes=await readFile(file);
  assert.equal(asset.state,'uploaded');assert.equal(asset.size,bytes.length);
  assert.equal(asset.digest,'sha256:'+digest(bytes),`Remote digest: ${asset.name}`);
}
await writeFile(path.join(qa,'release-verification.json'),JSON.stringify({checkedAt:new Date().toISOString(),assets:87,release},null,2));
console.log(`PASS: all 87 release assets match local sizes and SHA256; draft=${release.isDraft}`);

if(process.argv.includes('--live')){
  assert.equal(release.isDraft,false);
  const base='https://jakiesluchawki.github.io/chmurnik/';
  let checked=0;
  for(const asset of release.assets){
    const r=await fetch(asset.url,{method:'HEAD',signal:AbortSignal.timeout(60000)});
    assert.equal(r.status,200,`Public download: ${asset.name}`);
    assert.equal(Number(r.headers.get('content-length')),asset.size,`Public size: ${asset.name}`);
  }
  async function verifyTree(folder,prefix){
    for(const item of await readdir(folder,{withFileTypes:true})){
      if(folder===site&&['tapety','oryginaly'].includes(item.name)) continue;
      const file=path.join(folder,item.name),url=new URL(prefix+item.name,base);
      if(item.isDirectory()){await verifyTree(file,prefix+item.name+'/');continue;}
      const response=await fetch(url,{signal:AbortSignal.timeout(60000)});
      assert.equal(response.status,200,String(url));
      assert.equal(digest(Buffer.from(await response.arrayBuffer())),digest(await readFile(file)),`Public bytes: ${url}`);checked++;
    }
  }
  await verifyTree(site,'premiera/niebo/');
  // Hub build can recreate ZIP timestamps, so compare its stable index/catalog only.
  for(const name of ['index.html','catalog.json']){
    const r=await fetch(new URL('assetySM/'+name,base));assert.equal(r.status,200);
    assert.equal(digest(Buffer.from(await r.arrayBuffer())),digest(await readFile(path.join(root,'social/library/site',name))));checked++;
  }
  const {chromium}=await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE||'/Users/mieszkomahboob/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs'));
  const browser=await chromium.launch({headless:true});const errors=[],bad=[];
  try{
    const page=await browser.newPage();page.on('pageerror',e=>errors.push(e.message));
    page.on('response',r=>{if(r.status()>=400&&!r.url().includes('favicon'))bad.push(r.url());});
    for(const width of [320,1440]){
      await page.setViewportSize({width,height:900});await page.goto(base+'premiera/niebo/');await page.evaluate(()=>document.fonts.ready);
      for(const img of await page.locator('img').all()){await img.scrollIntoViewIfNeeded();await img.evaluate(i=>i.decode());}
      assert.equal(await page.locator('#tapety .card').count(),20);
      assert.equal(await page.locator('#tapety .files a').count(),80);
      assert.equal(await page.locator('#stories .card').count(),13);
      assert.equal(await page.locator('#instagram .card').count(),13);
      assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false);
      await page.locator('#tapety .card').first().scrollIntoViewIfNeeded();await page.screenshot({path:path.join(qa,`public-${width}.png`)});
    }
    await page.goto(base+'assetySM/');assert.equal(await page.locator('.pack').first().getAttribute('id'),'niebo');
    assert.equal(await page.locator('.pack').count(),5);await page.screenshot({path:path.join(qa,'public-hub.png')});
    assert.deepEqual(errors,[]);assert.deepEqual(bad,[]);
  }finally{await browser.close();}
  await writeFile(path.join(qa,'public-verification.json'),JSON.stringify({checkedAt:new Date().toISOString(),checkedFiles:checked,releaseAssets:87,publicDownloads:87,viewports:[320,1440],errors,bad},null,2));
  console.log(`PASS: ${checked} public files byte-identical; live gallery and hub passed`);
}
