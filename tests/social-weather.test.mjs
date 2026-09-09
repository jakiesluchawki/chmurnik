import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {stories, posts, previewUrl, copyStatus} from '../social/2026-09-08-pogoda/copy.mjs';
import {packs} from '../social/library/catalog.mjs';
import {stories as releaseStories, posts as releasePosts, availability, copyStatus as releaseCopyStatus, workshopUrl} from '../social/2026-09-09-pracownie/copy.mjs';

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
  assert(packs.length>=7);
  for(const id of ['pogoda','niebo','astra']) assert(packs.some(pack=>pack.id===id));
  const old = packs.find(pack=>pack.id==='pogoda');
  assert.equal(old.archived,true);
  assert.match(old.status,/Archiwum/);
  assert.equal(packs[0].id,'pracownie');
  assert.match(packs[0].status,/akceptacji/);
});

test('workshop release pack preserves all ten texts and all platform posts',async()=>{
  const base=new URL('../social/2026-09-09-pracownie/site/',import.meta.url);
  const manifest=JSON.parse(await readFile(new URL('manifest.json',base)));
  assert.equal(releaseStories.length,10);
  assert.equal(releaseCopyStatus,'awaiting-owner-approval');
  assert.equal(manifest.renderedSocialAssets,false);
  assert.deepEqual(manifest.stories,releaseStories);
  assert.deepEqual(manifest.posts,releasePosts);
  const txt=await readFile(new URL('TEKSTY-I-LINKI.txt',base),'utf8');
  for(const story of releaseStories) assert(txt.includes(story.text));
  for(const [platform,post] of Object.entries(releasePosts)) {
    assert(txt.includes(post));
    assert.equal((await readFile(new URL(`teksty/${platform}-post.txt`,base),'utf8')).trim(),post);
  }
  assert(txt.includes(workshopUrl));
});

test('workshop release copy distinguishes submission, WWW and unchanged classifier',async()=>{
  assert.match(availability,/WAITING_FOR_REVIEW/);
  assert.match(availability,/nie oznacza to jeszcze dostępności/);
  assert.match(releasePosts.linkedin,/Nie ogłaszam nowego modelu rozpoznawania/);
  const html=await readFile(new URL('../social/2026-09-09-pracownie/site/index.html',import.meta.url),'utf8');
  assert.match(html,/Pełne teksty do akceptacji/);
  assert.match(html,/href="\.\.\/\.\.\/assetySM\/"/);
  assert.equal((html.match(/class="story"/g)||[]).length,10);
  assert.doesNotMatch(html,/expert-review|drive\.google\.com|R001|PRIVATE-KEY/);
});

test('owner-authored social copy uses a singular creator voice throughout',()=>{
  assert.match(releaseStories[0].text,/^Zamknąłem/);
  const text=[...releaseStories.map(s=>s.text),...Object.values(releasePosts)].join('\n');
  assert.doesNotMatch(text,/zamknęliśmy|oddajemy|przygotowaliśmy|wysłaliśmy|udostępniliśmy|rozwijamy|ogłaszamy|czekamy|nie wiemy/i);
  assert.match(releasePosts.facebook,/przygotowałem/);
  assert.match(releasePosts.linkedin,/udostępniłem/);
});
