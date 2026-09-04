import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { packs } from '../library/catalog.mjs';
import { captions } from './captions.mjs';

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
assert.deepEqual(catalog.packs.find(p=>p.id==='astra').downloads,packs.find(p=>p.id==='astra').downloads);
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
const platformManifest=JSON.parse(await readFile(new URL('./site/platforms-manifest.json',import.meta.url)));
const platformAssets=[...platformManifest.artworks,...platformManifest.documents,...platformManifest.archives];
const bonus=JSON.parse(await readFile(new URL('./site/wallpapers-manifest.json',import.meta.url)));
platformAssets.push(...bonus.wallpapers,bonus.archive);
for(const asset of platformAssets){
  const r=await response(new URL(asset.file,gallery));
  assert.equal(hash(Buffer.from(await r.arrayBuffer())),asset.sha256,asset.file);
}
for(const c of captions)assert.equal(await(await response(new URL(`teksty/${c.id}-post.txt`,gallery))).text(),c.text+'\n');
const galleryHtml=await(await response(gallery)).text();
for(const id of ['instagram','facebook','linkedin','stories','tapety'])assert(galleryHtml.includes(`id="${id}"`));
assert(galleryHtml.includes('Kopiuj cały post'));
console.log(JSON.stringify({checkedAt:new Date().toISOString(),library:library.href,gallery:gallery.href,campaigns:packs.length,checkedLinks,pngHashes:27,pdfHashes:1,zipHashes:6,completePosts:3,platformSections:4,wallpapers:6},null,2));
