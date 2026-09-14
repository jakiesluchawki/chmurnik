import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {posts,groups,ps,adminMessage} from '../social/2026-09-14-grupy/copy.mjs';
import {packs} from '../social/library/catalog.mjs';

const base=new URL('../social/2026-09-14-grupy/site/',import.meta.url);
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
test('group outreach keeps five complete singular-author posts with the 33-photo PS',async()=>{
  const text=await readFile(new URL('PELNE-POSTY.txt',base),'utf8');
  const html=await readFile(new URL('index.html',base),'utf8');
  assert.equal(posts.length,5);
  for(const post of posts){
    assert(post.text.endsWith(ps));
    assert.match(post.text,/33 zdjęciami/);
    assert.match(post.text,/prywatnie/);
    assert.doesNotMatch(post.text,/zrobiliśmy|przygotowaliśmy|nasz zespół|to nie reklama|85[,.]4|nowy model|APPROVED|WAITING_FOR_REVIEW/i);
    assert.equal((post.text.match(/https:\/\//g)||[]).length,1);
    assert(text.includes(post.text));
    assert.equal((await readFile(new URL(`teksty/${post.id}.txt`,base),'utf8')).trim(),post.text);
    assert(html.includes(`id="text-${post.id}"`));
    assert.equal(post.images.length>=2,true);
  }
  assert(text.includes(adminMessage));
  assert.doesNotMatch(html,/PRIVATE.KEY|reviewer_password|password_hash|AuthKey|R001/);
});
test('group evidence does not invent permission, members or a verified weather audience',()=>{
  assert.equal(groups.length,4);
  assert.match(groups.find(g=>g.id==='ppl').rules,/miesiącu/);
  assert.match(groups.find(g=>g.id==='zeglarze').rules,/Nie udało/);
  assert.match(groups.find(g=>g.id==='lotnictwo').members,/niezweryfikowana/);
  assert.match(posts.find(p=>p.id==='pogoda').use,/niezweryfikowanej/);
  assert.equal(packs[0].id,'grupy');
  for(const id of ['pracownie','astra','historia','premiera']) assert(packs.some(p=>p.id===id));
});
test('group downloads contain exact existing approved PNG and complete captions',async()=>{
  const manifest=JSON.parse(await readFile(new URL('manifest.json',base)));
  assert.deepEqual(manifest.posts,posts);
  assert.equal(manifest.newGeneratedImages,0);
  assert.equal(manifest.facebookPostsPublished,0);
  assert.equal(manifest.images.length,5);
  for(const image of manifest.images){
    const bytes=await readFile(new URL(image.file,base));
    assert.equal(hash(bytes),image.sha256);
    assert.equal(bytes.readUInt32BE(16),1080);
    assert.equal(bytes.readUInt32BE(20),1350);
    const original=await readFile(new URL(`../social/2026-09-09-pracownie/site/karuzela/chmurnik-pracownie-${image.number}.png`,import.meta.url));
    assert.equal(hash(bytes),hash(original));
  }
  assert.equal(manifest.archives.length,6);
  for(const archive of manifest.archives){
    const file=fileURLToPath(new URL(archive.file,base));
    assert.equal(hash(await readFile(file)),archive.sha256);
    assert.deepEqual(execFileSync('unzip',['-Z1',file],{encoding:'utf8'}).trim().split('\n'),archive.entries);
    const post=posts.find(p=>p.id===archive.id);
    if(post) assert.equal(execFileSync('unzip',['-p',file,`teksty/${post.id}.txt`],{encoding:'utf8'}).trim(),post.text);
  }
});
