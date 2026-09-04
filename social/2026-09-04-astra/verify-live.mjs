import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { packs } from '../library/catalog.mjs';

const root='https://jakiesluchawki.github.io/chmurnik/';
const library=new URL('assetySM/',root);
const gallery=new URL('premiera/astra/',root);
const hash=b=>createHash('sha256').update(b).digest('hex');
async function response(url,method='GET'){
  const r=await fetch(url,{method,signal:AbortSignal.timeout(30000)});
  assert.equal(r.status,200,`${method} ${url}: ${r.status}`);return r;
}
const home=await (await response(library)).text();
assert(home.includes('Materiały do sociali.'));
const catalog=await (await response(new URL('catalog.json',library))).json();
assert.deepEqual(catalog.packs.map(p=>p.id),packs.map(p=>p.id));
let checkedLinks=0;
for(const p of packs){
  for(const f of ['',p.preview,...p.downloads.map(d=>d[1])]){
    await response(new URL(p.base+f,library),'HEAD');checkedLinks++;
  }
}
for(const f of ['premiera/chmurnik-na-teraz.zip','premiera/chmurnik-po-dsa.zip']){await response(new URL(f,root),'HEAD');checkedLinks++;}
const manifest=JSON.parse(await readFile(new URL('./site/manifest.json',import.meta.url)));
for(const story of manifest.stories){
  const r=await response(new URL(story.file,gallery));
  assert(r.headers.get('content-type').includes('image/png'));
  assert.equal(hash(Buffer.from(await r.arrayBuffer())),story.sha256);
}
const zipName='CHMURNIK-ASTRA-10-STORIES-PNG.zip';
const zip=await response(new URL(zipName,gallery));
assert.equal(hash(Buffer.from(await zip.arrayBuffer())),hash(await readFile(new URL('./site/'+zipName,import.meta.url))));
console.log(JSON.stringify({checkedAt:new Date().toISOString(),library:library.href,gallery:gallery.href,campaigns:packs.length,checkedLinks,pngHashes:10,zipHash:true},null,2));
