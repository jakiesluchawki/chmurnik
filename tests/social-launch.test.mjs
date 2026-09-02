import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, access } from 'node:fs/promises';
import { test } from 'node:test';
import sharp from 'sharp';

const base = new URL('../social/2026-08-30/site/', import.meta.url);
const manifest = JSON.parse(await readFile(new URL('manifest.json', base), 'utf8'));

test('Polish launch exports have exact dimensions, hashes and clear sticker areas', async () => {
  assert.equal(manifest.artworks.length, 7);
  assert.equal(manifest.artworks.filter(item => item.format === 'story').length, 5);
  assert.equal(manifest.artworks.filter(item => item.format === 'post').length, 2);
  assert.equal(new Set(manifest.artworks.map(item => item.id)).size, 7);
  for (const item of manifest.artworks) {
    const data = await readFile(new URL(item.file, base));
    const meta = await sharp(data).metadata();
    assert.equal(meta.format, 'jpeg');
    assert.equal(meta.width, 1080);
    assert.equal(meta.height, item.format === 'story' ? 1920 : 1350);
    assert.equal(data.length, item.bytes);
    assert.equal(createHash('sha256').update(data).digest('hex'), item.sha256);
    assert.ok(item.alt.length > 30);
    assert.equal(item.storeUrl, 'https://apps.apple.com/pl/app/chmurnik/id6782159027');
    assert.ok(item.sources.length > 0);
    if (item.format === 'story') {
      assert.deepEqual(item.stickerArea, { x: 240, y: 1510, width: 600, height: 120 });
      assert.ok(item.stickerLabel.length > 5);
    }
    await access(new URL(item.thumbnail, base));
  }
});

test('launch captions match downloads and preserve honest Polish availability', async () => {
  for (const item of manifest.captions) {
    assert.equal((await readFile(new URL(`teksty/${item.id}.txt`, base), 'utf8')).trim(), item.text);
    assert.ok(item.text.includes('https://apps.apple.com/pl/app/chmurnik/id6782159027'));
    assert.doesNotMatch(item.text, /czekamy.*DSA/i);
  }
  assert.ok(manifest.captions.find(item => item.id === 'instagram').text.length < 2200);
  assert.ok(manifest.captions.find(item => item.id === 'threads').text.length < 500);
  const readme = await readFile(new URL('CZYTAJ-MNIE.txt', base), 'utf8');
  assert.match(readme, /CC BY-SA 3\.0/);
  assert.match(readme, /PiccoloNamek/);
  assert.match(readme, /nie dostarcza danych live/);
  assert.match(readme, /JPG sam nie zawiera klikalnego linku/);
});

test('launch gallery remains separate from the bundled application', async () => {
  await assert.rejects(access(new URL('../public/premiera/', import.meta.url)));
  const html = await readFile(new URL('index.html', base), 'utf8');
  assert.doesNotMatch(html, /id="after-dsa"/);
  assert.match(html, /Już w polskim App Store/);
  assert.match(html, /id="credits"/);
  assert.match(html, /chmurnik-storki-pl-2026-09-02\.zip/);
  assert.match(html, /chmurnik-polska-2026-09-02\.zip/);
});
