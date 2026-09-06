import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {stories,updates,progressCaptions} from '../social/2026-09-07-niebo/copy.mjs';
import {stories as approved} from '../social/2026-09-03-full/copy.mjs';
import {packs} from '../social/library/catalog.mjs';
const base=new URL('../social/2026-09-07-niebo/site/',import.meta.url);
const m=JSON.parse(await readFile(new URL('manifest.json',base)));
test('new static pack preserves the entire approved ten-story text',()=>{
  assert.deepEqual(stories.slice(0,10),approved);assert.equal(updates.length,3);
  assert(stories[4].body.includes('METAR opisuje obserwację. TAF jest prognozą.'));
  assert.equal(m.document.pages,13);assert.equal(m.artworks.length,27);
});
test('model and Android updates make no premature release or accuracy claim',()=>{
  assert.match(updates[0].note,/nie jest wdrożony/);
  assert.match(updates[1].note,/jeszcze się nie odbyła/);
  assert.match(updates[2].body,/nie ma jej jeszcze w Google Play/);
  for(const c of Object.values(progressCaptions)){assert.doesNotMatch(c,/85[,.]4|95%/);assert(c.length<3000);}
});
test('twenty unique wallpaper motifs have originals and explicit enlarged exports',async()=>{
  assert.equal(m.wallpapers.length,40);assert.equal(new Set(m.wallpapers.map(w=>w.id)).size,20);
  const hashes=new Set();
  for(const w of m.wallpapers){
    assert.equal(w.upscaled,true);assert.equal(w.sourceWidth,w.original.width);assert.equal(w.sourceHeight,w.original.height);
    assert.deepEqual([w.width,w.height],w.orientation==='desktop'?[3840,2160]:[2160,3840]);
    for(const a of [w,w.original]){
      const b=await readFile(new URL(a.file,base));assert.equal(b.readUInt32BE(16),a.width);assert.equal(b.readUInt32BE(20),a.height);
      assert.equal(createHash('sha256').update(b).digest('hex'),a.sha256);hashes.add(a.sha256);
      assert(a.downloadUrl.startsWith('https://github.com/jakiesluchawki/chmurnik/releases/download/sm-niebo-20260907/'));
    }
  }
  assert.equal(hashes.size,80);
});
test('public library retains older campaigns and excludes consultation materials',async()=>{
  assert.equal(packs[0].id,'niebo');assert.equal(packs.length,5);
  const html=await readFile(new URL('index.html',base),'utf8');
  assert.doesNotMatch(html,/PRIVATE-KEY|drive\.google\.com|expert-review|R001/);
  assert.match(html,/bez powiększania/);assert.match(html,/powiększony/);
});
