import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { themes, copyStatus } from '../social/2026-09-15-dwie-opowiesci/copy.mjs';
import { packs } from '../social/library/catalog.mjs';

const base = new URL('../social/2026-09-15-dwie-opowiesci/site/', import.meta.url);
const read = file => readFile(new URL(file, base));
const hash = bytes => createHash('sha256').update(bytes).digest('hex');

test('two social themes retain twenty complete stories and all singular-author captions', async () => {
  assert.equal(themes.length, 2);
  assert.equal(copyStatus, 'owner-delegated-production');
  const txt = (await read('TEKSTY-I-LINKI.txt')).toString();
  const html = (await read('index.html')).toString();
  for (const theme of themes) {
    assert.equal(theme.stories.length, 10);
    assert.deepEqual(theme.parts.flatMap(p => p.numbers), [1,2,3,4,5,6,7,8,9,10]);
    for (const story of theme.stories) assert(txt.includes(story.text));
    for (const part of theme.parts) assert(txt.includes(part.caption));
    for (const [platform, caption] of Object.entries(theme.posts)) {
      assert(txt.includes(caption));
      assert.equal((await read(theme.id + '/teksty/' + platform + '-post.txt')).toString().trim(), caption);
      assert.doesNotMatch(caption, /przygotowaliśmy|zrobiliśmy|zamknęliśmy|udostępniliśmy|nowy model|85[,.]4|APPROVED|WAITING_FOR_REVIEW/i);
    }
  }
  assert.equal((html.match(/class="story-card"/g) || []).length, 20);
  assert.match(html, /nie zrzut Twojego profilu/);
  assert.match(html, /automatyczna kontrola dostępu/);
});

test('mosaic covers reconstruct both shared panoramas without drifting or separate crops', async () => {
  const manifest = JSON.parse(await read('exports-manifest.json'));
  assert.equal(manifest.mosaics.length, 2);
  for (const mosaic of manifest.mosaics) {
    const covers = manifest.artworks.filter(a => a.theme === mosaic.theme && a.format === 'okladka').sort((a,b) => a.gridColumn - b.gridColumn);
    assert.deepEqual(covers.map(a => a.publicationOrder), [3,2,1]);
    assert.deepEqual(covers.map(a => a.part), [1,2,3]);
    const canvas = await sharp({create:{width:3240,height:1440,channels:4,background:'#fff'}}).composite(await Promise.all(covers.map(async (a,x) => ({input: await read(a.file),left:x*1080,top:0})))).raw().toBuffer();
    const original = await sharp(await read(mosaic.file)).ensureAlpha().raw().toBuffer();
    assert.equal(hash(canvas), hash(original));
  }
});

test('publish-ready PNGs retain exact copy, dimensions and accessible source separation', async () => {
  const manifest = JSON.parse(await read('exports-manifest.json'));
  assert.equal(manifest.artworks.length, 48);
  assert.equal(new Set(manifest.sourceArtwork.map(a => a.sha256)).size, 12);
  for (const a of manifest.artworks) {
    const bytes = await read(a.file);
    assert.equal(hash(bytes), a.sha256);
    assert.equal(bytes.readUInt32BE(16), 1080);
    assert.equal(bytes.readUInt32BE(20), a.format === 'stories' ? 1920 : 1440);
    if (a.format !== 'okladka') {
      const story = themes.find(t => t.id === a.theme).stories[a.number - 1];
      assert.equal(a.layout.bodyLines.join(' '), story.text);
      assert.equal(a.layout.headlineLines.join(' '), story.title);
      assert(a.layout.bodyFontSize >= 33);
      assert(a.layout.bodyTop > a.layout.artY + a.layout.artH);
      assert.match(a.alt, /nie fotografia obserwacyjna/);
    }
  }
});

test('Instagram publication folders contain their covers and exact complete interior slides', async () => {
  for (const theme of themes) for (let x = 0; x < 3; x++) {
    const part = theme.parts[x], dir = theme.id + '/instagram/0' + (3 - x) + '-post/';
    assert((await stat(new URL(dir + '00-okladka.png', base))).isFile());
    assert.equal((await read(dir + 'opis-instagram.txt')).toString().trim(), part.caption);
    for (let j = 0; j < part.numbers.length; j++) {
      const source = String(part.numbers[j]).padStart(2,'0');
      const target = String(j + 1).padStart(2,'0') + '-slajd-' + source + '.png';
      assert.equal(hash(await read(dir + target)), hash(await read(theme.id + '/karuzela/' + source + '.png')));
    }
  }
});

test('all eleven download archives are valid, complete and registered in the permanent library', async () => {
  const manifest = JSON.parse(await read('manifest.json'));
  assert.equal(manifest.archives.length, 11);
  assert.equal(manifest.counts.themes, 2);
  assert.equal(manifest.profileInspected, false);
  for (const a of manifest.archives) {
    assert.equal(a.url, 'https://github.com/jakiesluchawki/chmurnik/releases/download/sm-niebo-woda-20260915/' + a.file);
    const path = fileURLToPath(new URL(a.file, base));
    assert.equal(hash(await read(a.file)), a.sha256);
    assert.deepEqual(execFileSync('unzip',['-Z1',path],{encoding:'utf8'}).trim().split('\n'), a.entries);
    assert.equal(execFileSync('unzip',['-p',path,'TEKSTY-I-LINKI.txt'],{encoding:'utf8'}), (await read('TEKSTY-I-LINKI.txt')).toString());
  }
  assert.equal(packs[0].id, 'niebo-i-woda');
  for (const id of ['grupy','pracownie','niebo','astra','historia','premiera']) assert(packs.some(p => p.id === id));
});
