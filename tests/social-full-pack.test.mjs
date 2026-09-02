import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import sharp from 'sharp';
import { stories, storeUrl, stickerArea, storyTranscript } from '../social/2026-09-03-full/copy.mjs';
import { captions } from '../social/2026-09-03-full/captions.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const site = path.join(root, 'social/2026-09-03-full/site');
const manifest = JSON.parse(await readFile(path.join(site, 'manifest.json'), 'utf8'));
const provenance = JSON.parse(await readFile(path.join(root, 'social/2026-09-03-full/captures/provenance.json'), 'utf8'));
const hash = bytes => createHash('sha256').update(bytes).digest('hex');

test('complete pack preserves all ten approved stories in both exports', () => {
  assert.equal(stories.length, 10);
  for (const format of ['story', 'carousel']) {
    const exports = manifest.artworks.filter(item => item.format === format);
    assert.equal(exports.length, 10);
    assert.deepEqual(exports.map(item => item.storyId), stories.map(item => item.id));
    for (const [index, item] of exports.entries()) {
      assert.equal(item.lead, stories[index].lead);
      assert.equal(item.body, stories[index].body);
      assert.equal(item.note, stories[index].note);
      assert.equal(item.cta, stories[index].cta);
    }
  }
  assert.match(stories[0].body, /Ostatnio do dziobu doczepił silnik i lata jeszcze dalej\./);
  assert.doesNotMatch(stories[0].body, /robi kurs PPL|Za chwilę/);
});

test('all 21 final JPGs match their geometry and hashes', async () => {
  assert.equal(manifest.artworks.length, 21);
  for (const item of manifest.artworks) {
    const bytes = await readFile(path.join(site, item.file));
    assert.equal(hash(bytes), item.sha256);
    assert.equal(bytes.length, item.bytes);
    const dimensions = await sharp(bytes).metadata();
    assert.equal(dimensions.format, 'jpeg');
    assert.equal(dimensions.width, 1080);
    assert.equal(dimensions.height, item.format === 'story' ? 1920 : 1350);
    assert.ok(!dimensions.hasAlpha);
    assert.equal((await sharp(path.join(site, item.thumbnail)).metadata()).width, 432);
  }
});

test('ten complete MP4s distinguish six walkthroughs from four reading cards', async () => {
  const movies = manifest.artworks.filter(item => item.video);
  assert.equal(movies.length, 10);
  assert.equal(movies.filter(item => item.video.kind === 'walkthrough').length, 6);
  assert.equal(movies.filter(item => item.video.kind === 'reading').length, 4);
  for (const item of movies) {
    const video = item.video;
    const bytes = await readFile(path.join(site, video.file));
    assert.equal(hash(bytes), video.sha256);
    assert.equal(bytes.length, video.bytes);
    assert.equal(bytes.subarray(4, 8).toString(), 'ftyp');
    assert.equal(video.width, 1080);
    assert.equal(video.height, 1920);
    assert.equal(video.fps, 30);
    assert.equal(video.codec, 'H.264');
    assert.equal(video.audio, false);
    assert.ok(video.duration >= 12 && video.duration < 60);
  }
  assert.deepEqual(manifest.publicationOrder, stories.map(item => `story-${item.id}.mp4`));
});

test('walkthrough evidence retains every approved sentence and actual gestures', async () => {
  assert.equal(provenance.captures.length, 6);
  for (const story of stories.filter(item => item.demo)) {
    const evidence = provenance.captures.find(item => item.id === story.demo);
    assert.ok(evidence);
    const copy = evidence.events.filter(event => event.type === 'copy');
    assert.deepEqual(copy.map(event => event.text), story.parts);
    for (const [index, segment] of copy.entries()) {
      const end = copy[index + 1]?.at ?? evidence.duration;
      assert.ok(end - segment.at >= segment.text.split(/\s+/).length / 3.5, `${story.id}: reading time`);
    }
    assert.ok(evidence.events.some(event => event.type === 'touch-drag'));
    if (!['wind'].includes(story.demo)) assert.ok(evidence.events.some(event => event.type === 'tap'));
    if (['height', 'wind'].includes(story.demo)) assert.ok(evidence.events.some(event => event.type === 'range-result' && event.after !== event.before));
    assert.equal(hash(await readFile(path.join(root, evidence.poster))), evidence.posterSHA256);
  }
  assert.match(provenance.method, /not a physical iPhone recording/);
  assert.match(provenance.method, /no course completion is claimed/i);
  const sailingEvents = provenance.captures.find(item => item.id === 'wind').events;
  const sailing = sailingEvents.find(event => event.type === 'final-state');
  assert.equal(sailing.windFrom, sailingEvents.find(event => event.type === 'initial-state').windFrom);
  assert.ok(Math.abs(sailing.heading - 135) <= 2);
  assert.ok(Math.abs(sailing.boatSpeed - 15) <= 1);
});

test('complete texts are copyable and platform captions stay within practical lengths', async () => {
  assert.equal(manifest.captions.length, captions.length);
  const transcript = captions.find(item => item.id === 'storki-pelny-tekst').text;
  for (const story of stories) assert.ok(transcript.includes(storyTranscript(story)));
  for (const caption of captions) assert.equal(await readFile(path.join(site, 'teksty', `${caption.id}.txt`), 'utf8'), caption.text + '\n');
  assert.ok(captions.find(item => item.id === 'instagram-post').text.length < 2200);
  assert.ok(captions.find(item => item.id === 'linkedin-post').text.length < 3000);
  for (const id of ['linkedin-post', 'facebook-post']) assert.ok(captions.find(item => item.id === id).text.includes(storeUrl));
});

test('LinkedIn document is included as a distinct ten-page PDF', async () => {
  assert.equal(manifest.documents.length, 1);
  const pdf = manifest.documents[0];
  const bytes = await readFile(path.join(site, pdf.file));
  assert.equal(pdf.pages, 10);
  assert.equal(pdf.platform, 'linkedin');
  assert.equal(pdf.mime, 'application/pdf');
  assert.equal(bytes.subarray(0, 5).toString(), '%PDF-');
  assert.equal(hash(bytes), pdf.sha256);
  assert.ok(bytes.length < 100_000_000);
});

test('all six download ZIPs contain exactly the public files described', async () => {
  assert.equal(manifest.archives.length, 6);
  for (const archive of manifest.archives) {
    const file = path.join(site, archive.file);
    const bytes = await readFile(file);
    assert.equal(hash(bytes), archive.sha256);
    const entries = execFileSync('unzip', ['-Z1', file], { encoding: 'utf8' }).trim().split('\n');
    assert.deepEqual(entries, archive.entries);
    assert.ok(entries.includes('CZYTAJ-MNIE.txt'));
    assert.ok(entries.includes('ZRODLA-ZDJEC.txt'));
    assert.ok(entries.every(name => /\.(jpg|mp4|pdf|txt)$/.test(name)));
    assert.ok(entries.every(name => !/token|analytics|\.env|\.woff|frames\/|private|build\//i.test(name)));
  }
});

test('direct store links, legal notes and photo credits remain present', () => {
  assert.equal(manifest.storeUrl, storeUrl);
  for (const item of manifest.artworks.filter(item => item.format === 'story')) {
    assert.equal(item.storeUrl, storeUrl);
    assert.ok(item.stickerLabel);
    assert.deepEqual(item.stickerArea, stickerArea);
  }
  for (const number of [6, 7, 8]) assert.match(stories[number - 1].note, /Bez integracji z Windy/);
  assert.match(stories[8].note, /Telefon nie mierzy wiatru/);
  assert.match(stories[4].note, /nie aktualna pogoda/);
  const cirrus = manifest.photoCredits.find(item => item.id === 'cirrus-field');
  assert.equal(cirrus.author, 'PiccoloNamek');
  assert.equal(cirrus.license, 'CC BY-SA 3.0');
  assert.equal(cirrus.licenseUrl, 'https://creativecommons.org/licenses/by-sa/3.0/');
});

test('all platforms and preserved older packs are linked from the gallery', async () => {
  const html = await readFile(path.join(site, 'index.html'), 'utf8');
  for (const id of ['stories', 'instagram', 'linkedin', 'facebook', 'texts', 'links']) assert.ok(html.includes(`id="${id}"`));
  for (const file of [...manifest.archives, ...manifest.documents]) assert.ok(html.includes(`./${file.file}`));
  assert.match(html, /Nic z tego pakietu nie zostało automatycznie opublikowane/);
  assert.match(html, /\.\.\/2026-09-03\//);
  assert.match(await readFile(path.join(root, 'social/2026-08-30/site/index.html'), 'utf8'), /\.\/historia\//);
});
