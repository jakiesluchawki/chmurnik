import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { access, readFile, readdir } from 'node:fs/promises';
import { test } from 'node:test';
import sharp from 'sharp';
import { artworks, storeUrl } from '../social/2026-09-03/artwork.mjs';

const base = new URL('../social/2026-09-03/site/', import.meta.url);
const manifest = JSON.parse(await readFile(new URL('manifest.json', base), 'utf8'));

test('origin-story series contains five source-backed 9:16 exports in publishing order', async () => {
  assert.equal(manifest.publishOn, '2026-09-03');
  assert.equal(manifest.artworks.length, 5);
  assert.deepEqual(manifest.artworks.map(item => item.id), artworks.map(item => item.id));
  for (const item of manifest.artworks) {
    const data = await readFile(new URL(item.file, base));
    const metadata = await sharp(data).metadata();
    assert.equal(metadata.format, 'jpeg');
    assert.equal(metadata.width, 1080);
    assert.equal(metadata.height, 1920);
    assert.equal(data.length, item.bytes);
    assert.equal(createHash('sha256').update(data).digest('hex'), item.sha256);
    assert.equal(item.format, 'story');
    assert.equal(item.storeUrl, storeUrl);
    assert.deepEqual(item.stickerArea, { x: 240, y: 1510, width: 600, height: 120 });
    assert.ok(item.stickerLabel.length > 5);
    assert.ok(item.alt.length > 30);
    assert.ok(item.sources.includes('owner-origin-story-2026-09-02'));
    await access(new URL(item.thumbnail, base));
  }
});

test('two silent demo alternatives retain their provenance and verified MP4 hashes', async () => {
  const demos = manifest.artworks.filter(item => item.video);
  assert.deepEqual(demos.map(item => item.demo), ['windy', 'wind']);
  assert.deepEqual((await readdir(new URL('videos/', base))).sort(), demos.map(item => item.video.file.split('/').at(-1)).sort());
  const provenance = JSON.parse(await readFile(new URL('../social/2026-09-03/captures/provenance.json', import.meta.url), 'utf8'));
  for (const item of demos) {
    const source = provenance.captures.find(capture => capture.id === item.demo);
    assert.equal(item.video.duration, source.duration);
    assert.equal(item.video.mime, 'video/mp4');
    assert.equal(item.video.codec, 'H.264');
    assert.equal(item.video.fps, 30);
    assert.equal(item.video.width, 1080);
    assert.equal(item.video.height, 1920);
    assert.equal(item.video.audio, false);
    assert.ok(item.videoArea.bottom < item.stickerArea.y);
    const data = await readFile(new URL(item.video.file, base));
    assert.equal(data.subarray(4, 8).toString(), 'ftyp');
    assert.equal(data.length, item.video.bytes);
    assert.equal(createHash('sha256').update(data).digest('hex'), item.video.sha256);
    const poster = await readFile(new URL(`../${source.poster}`, import.meta.url));
    assert.equal(createHash('sha256').update(poster).digest('hex'), source.posterSHA256);
  }
});

test('origin story and downloads preserve owner facts, licensing and educational limits', async () => {
  for (const item of manifest.captions) {
    assert.equal((await readFile(new URL(`teksty/${item.id}.txt`, base), 'utf8')).trim(), item.text);
    assert.ok(item.text.includes(storeUrl));
  }
  const history = manifest.captions.find(item => item.id === 'historia').text;
  assert.match(history, /szybownikiem.*kurs PPL/);
  assert.match(history, /żaglach z chłopakami/);
  assert.match(history, /nie integracją z Windy/);
  assert.match(history, /nie mierzy wiatru/);
  const readme = await readFile(new URL('CZYTAJ-MNIE.txt', base), 'utf8');
  assert.match(readme, /nadal pięć Stories, nie siedem/);
  assert.match(readme, /fizycznego iPhone/);
  assert.match(readme, /PiccoloNamek/);
  assert.match(readme, /creativecommons.org\/licenses\/by-sa\/3.0/);
  assert.match(readme, /nie mają wbudowanego klikalnego linku/);
});

test('new pack stays outside the iOS bundle and keeps the published launch gallery', async () => {
  await assert.rejects(access(new URL('../public/premiera/', import.meta.url)));
  const html = await readFile(new URL('index.html', base), 'utf8');
  assert.match(html, /chmurnik-historia-2026-09-03.zip/);
  assert.match(html, /chmurnik-storki-jpg-2026-09-03.zip/);
  assert.match(html, /href="\.\.\/#stories"/);
  assert.match(html, /id="credits"/);
  const previous = await readFile(new URL('../social/2026-08-30/site/index.html', import.meta.url), 'utf8');
  assert.match(previous, /href="\.\/2026-09-03\/"/);
  assert.match(previous, /chmurnik-storki-pl-2026-09-02.zip/);
});
