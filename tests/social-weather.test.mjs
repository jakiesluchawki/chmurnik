import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {stories, posts, previewUrl, copyStatus} from '../social/2026-09-08-pogoda/copy.mjs';
import {packs} from '../social/library/catalog.mjs';

test('weather campaign retains full copy and does not claim an Apple release', async()=>{
  assert.equal(stories.length,5);
  assert.deepEqual(Object.keys(posts).sort(),['facebook','instagram','linkedin']);
  assert.equal(copyStatus,'awaiting-owner-approval');
  const base=new URL('../social/2026-09-08-pogoda/site/',import.meta.url);
  const manifest=JSON.parse(await readFile(new URL('manifest.json',base)));
  assert.equal(manifest.renderedSocialAssets,false);
  assert.deepEqual(manifest.stories,stories);
  assert.deepEqual(manifest.posts,posts);
  const txt=await readFile(new URL('TEKSTY-I-LINKI.txt',base),'utf8');
  for(const story of stories) assert(txt.includes(story.text));
  for(const post of Object.values(posts)) assert(txt.includes(post));
  assert(txt.includes(previewUrl));
  const html=await readFile(new URL('index.html',base),'utf8');
  assert.match(html,/Teksty do akceptacji/);
  assert.match(html,/href="style\.css\?v=[a-f0-9]{12}"/);
  assert.match(html,/nie ogłasza nowej funkcji w App Store/);
  assert.doesNotMatch(html,/expert-review|drive\.google\.com|R001|PRIVATE-KEY/);
  const css=await readFile(new URL('style.css',base),'utf8');
  assert.match(css,/\.post pre\{[^}]*overflow-wrap:anywhere/);
  assert.equal((css.match(/font-display:swap/g)||[]).length,3);
});

test('weather pack extends the permanent library without removing campaigns',()=>{
  assert.equal(packs[0].id,'pogoda');
  assert(packs.length>=6);
  for(const id of ['niebo','astra']) assert(packs.some(pack=>pack.id===id));
  assert.match(packs[0].status,/akceptacji/);
});
