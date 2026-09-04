import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { campaign, stories } from '../social/2026-09-04-astra/copy.mjs';
import { captions } from '../social/2026-09-04-astra/captions.mjs';
import { packs } from '../social/library/catalog.mjs';
import { rebuildDownloads } from '../social/2026-09-04-astra/rebuild-downloads.mjs';

await rebuildDownloads({quiet:true});

const site=new URL('../social/2026-09-04-astra/site/',import.meta.url);
const read=file=>readFile(new URL(file,site));
const manifest=JSON.parse(await read('platforms-manifest.json'));
const original=JSON.parse(await read('manifest.json'));
const bonus=JSON.parse(await read('wallpapers-manifest.json'));
const hash=b=>createHash('sha256').update(b).digest('hex');

test('Astra carousel preserves all ten approved headlines and paragraphs',()=>{
  const carousel=manifest.artworks.filter(a=>a.format==='carousel');
  assert.equal(carousel.length,10);
  for(const [i,a]of carousel.entries()){
    assert.equal(a.lead,stories[i].lead);assert.equal(a.body,stories[i].body);
    assert.equal(a.id,stories[i].id);assert.equal(a.width,1080);assert.equal(a.height,1350);
  }
});

test('Astra static exports have verified PNG geometry, hashes and no raw art metadata',async()=>{
  for(const a of [...manifest.artworks,...original.stories]){
    const bytes=await read(a.file);
    assert.equal(bytes.subarray(1,4).toString(),'PNG');
    assert.equal(bytes.readUInt32BE(16),a.width);assert.equal(bytes.readUInt32BE(20),a.height);
    assert.equal(bytes[25],2);assert.equal(hash(bytes),a.sha256);
    for(let offset=8;offset<bytes.length;){
      const length=bytes.readUInt32BE(offset),type=bytes.subarray(offset+4,offset+8).toString();
      assert.notEqual(type,'caBX');offset+=12+length;
    }
  }
});

test('Astra platform posts are complete, consistent and within caption limits',async()=>{
  assert.equal(captions.length,3);
  assert.deepEqual(manifest.captions,captions);
  for(const c of captions){
    assert.equal((await read(`teksty/${c.id}-post.txt`)).toString(),c.text+'\n');
    assert(c.text.includes('Astra')||c.text.includes('Astry'));
    assert(c.text.includes('chmurnik.cloud'));
    if(c.id!=='instagram'){assert(c.text.includes(campaign.webUrl));assert(c.text.includes(campaign.storeUrl));}
  }
  assert(captions.find(c=>c.id==='instagram').text.length<2200);
  assert(captions.find(c=>c.id==='linkedin').text.length<3000);
  assert(captions.find(c=>c.id==='facebook').text.includes('METAR opisuje obserwację. TAF jest prognozą. Wklejasz depeszę i rozczytujesz ją po kawałku. Skróty zaczynają nabierać znaczenia.'));
});

test('Astra PDF and all platform bundles match their published manifest',async()=>{
  assert.equal(manifest.documents.length,1);assert.equal(manifest.documents[0].pages,10);
  assert.equal(manifest.archives.length,4);
  for(const asset of [...manifest.documents,...manifest.archives]){
    const bytes=await read(asset.file);assert.equal(bytes.length,asset.bytes);assert.equal(hash(bytes),asset.sha256);
    if(asset.file.endsWith('.pdf'))assert.equal(bytes.subarray(0,5).toString(),'%PDF-');
    else{
      assert.equal(bytes.subarray(0,2).toString(),'PK');assert.equal(new Set(asset.entries).size,asset.entries.length);
      assert(asset.entries.includes('ZRODLA-ZDJEC.txt'));assert(asset.entries.includes('PUBLIKACJA.txt'));
      for(const entry of asset.entries){assert(!entry.startsWith('art/'));assert(!/\.(mov|mp4|woff2)$/i.test(entry));assert((await read(entry)).length>0);}
    }
  }
  assert.equal(manifest.archives.find(a=>a.file.includes('PELNY')).entries.filter(e=>e.endsWith('.png')).length,41);
});

test('Astra gallery and permanent library expose every platform without replacing Stories',async()=>{
  const html=(await read('index.html')).toString();
  for(const id of ['instagram','facebook','linkedin','stories','tapety'])assert(html.includes(`id="${id}"`));
  for(const c of captions)assert(html.includes(`id="post-${c.id}"`));
  assert(html.includes('../../assetySM/'));assert(html.includes('CHMURNIK-ASTRA-10-STORIES-PNG.zip'));
  const pack=packs.find(p=>p.id==='astra');
  for(const archive of manifest.archives)assert(pack.downloads.some(d=>d[1]===archive.file));
  assert(pack.downloads.some(d=>d[1]==='CHMURNIK-ASTRA-10-STORIES-PNG.zip'));
  assert(pack.downloads.some(d=>d[1]===bonus.archive.file));
});

test('Astra wallpaper bonus contains ten distinct motifs, each in two clean 4K exports',async()=>{
  assert.equal(bonus.wallpapers.length,20);
  assert.equal(new Set(bonus.wallpapers.map(w=>w.id)).size,10);
  assert.equal(new Set(bonus.wallpapers.map(w=>w.sha256)).size,20);
  assert.equal(bonus.archive.entries.length,21);
  for(const id of new Set(bonus.wallpapers.map(w=>w.id)))assert.deepEqual(bonus.wallpapers.filter(w=>w.id===id).map(w=>w.orientation).sort(),['desktop','phone']);
  assert.equal(hash(await read(bonus.archive.file)),bonus.archive.sha256);
  const full=manifest.archives.find(a=>a.file.includes('PELNY'));
  for(const w of bonus.wallpapers){
    const bytes=await read(w.file);assert.equal(hash(bytes),w.sha256);
    assert.equal(bytes.readUInt32BE(16),w.orientation==='desktop'?3840:2160);
    assert.equal(bytes.readUInt32BE(20),w.orientation==='desktop'?2160:3840);
    assert.equal(bytes[25],2);assert(full.entries.includes(w.file));
    for(let offset=8;offset<bytes.length;){
      const length=bytes.readUInt32BE(offset),type=bytes.subarray(offset+4,offset+8).toString();
      assert(['IHDR','IDAT','IEND','pHYs'].includes(type),`Unexpected export metadata: ${type}`);offset+=12+length;
    }
  }
});
