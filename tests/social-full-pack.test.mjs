import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import sharp from 'sharp';
import { stories, storeUrl, stickerArea, storyTranscript } from '../social/2026-09-03-full/copy.mjs';
import { captions, packageRevision, websiteUrl } from '../social/2026-09-03-full/captions.mjs';
import { durationFor, edits, promoHtml, revision } from '../social/2026-09-03-full/promo.mjs';

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

test('ten brisk MP4s preserve complete copy without reading-time cards', async () => {
  const movies = manifest.artworks.filter(item => item.video);
  assert.equal(movies.length, 10);
  assert.equal(movies.filter(item => item.video.kind === 'walkthrough').length, 6);
  assert.equal(movies.filter(item => item.video.kind === 'montage').length, 4);
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
    const story = stories.find(story => story.id === item.storyId);
    assert.equal(video.duration, durationFor(story));
    assert.ok(video.duration >= 6 && video.duration <= 8);
    assert.equal(video.fullCopyAlwaysVisible, true);
    assert.equal(video.revision, revision);
    assert.equal(video.cuts, edits[story.id].length);
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

test('promo edit puts every full sentence in the persistent overlay and bounds every cut', async () => {
  const evidence = JSON.parse(await readFile(path.join(root, 'social/2026-09-03-full/captures/promo-edit.json'), 'utf8'));
  assert.equal(evidence.revision, revision);
  assert.equal(evidence.stories.length, 10);
  for (const story of stories) {
    const exported = evidence.stories.find(item => item.id === `story-${story.id}`);
    assert.equal(exported.copy.lead, story.lead);
    assert.equal(exported.copy.body, story.body);
    assert.equal(exported.copy.cta, story.cta);
    assert.equal(exported.fullCopyAlwaysVisible, true);
    assert.deepEqual(exported.geometry.parts.map(part => part.text), story.parts);
    for (const part of exported.geometry.parts) for (const rect of part.rects) {
      assert.ok(rect.x >= 69 && rect.x + rect.width <= 1011);
      assert.ok(rect.y + rect.height < exported.geometry.stage.y - 25);
    }
    assert.ok(exported.cuts.length >= 4);
    assert.ok(exported.cuts.every(cut => cut.duration <= 1.6));
    const html = promoHtml(story, '');
    for (const part of story.parts) assert.ok(html.includes(part));
    assert.doesNotMatch(html, /live-copy|display:none|visibility:hidden/);
  }
  assert.equal(stories[4].body, 'METAR opisuje obserwację. TAF jest prognozą. Wklejasz depeszę i rozczytujesz ją po kawałku. Skróty zaczynają nabierać znaczenia.');
});

test('complete texts are copyable and platform captions stay within practical lengths', async () => {
  assert.deepEqual(manifest.captions, captions);
  const transcript = captions.find(item => item.id === 'storki-pelny-tekst').text;
  for (const story of stories) assert.ok(transcript.includes(storyTranscript(story)));
  for (const caption of captions) assert.equal(await readFile(path.join(site, 'teksty', `${caption.id}.txt`), 'utf8'), caption.text + '\n');
  assert.ok(captions.find(item => item.id === 'instagram-post').text.length < 2200);
  assert.ok(captions.find(item => item.id === 'linkedin-post').text.length < 3000);
  for (const id of ['linkedin-post', 'facebook-post']) assert.ok(captions.find(item => item.id === id).text.includes(storeUrl));
});

test('WWW update promotes the domain in complete feed posts without changing the app Stories', () => {
  assert.equal(manifest.revision, packageRevision);
  assert.equal(manifest.websiteUrl, websiteUrl);
  for (const id of ['linkedin-post', 'facebook-post']) {
    const { text } = captions.find(item => item.id === id);
    assert.ok(text.includes(websiteUrl));
    assert.ok(text.indexOf(websiteUrl) < text.indexOf(storeUrl));
    for (const feature of ['atlas', 'lekcje', 'METAR', 'TAF', 'Windy', 'wiatr']) assert.ok(text.toLowerCase().includes(feature.toLowerCase()), feature);
    assert.match(text, /bez konta i instalacji|bez zakładania konta i instalowania/);
    assert.match(text, /symulacją, nie pomiarem/);
  }
  assert.doesNotMatch(captions.find(item => item.id === 'storki-pelny-tekst').text, /chmurnik\.cloud/);
  assert.doesNotMatch(captions.find(item => item.id === 'instagram-post').text, /chmurnik\.cloud/);
  assert.match(manifest.artworks.find(item => item.format === 'facebook').alt, /chmurnik\.cloud/);
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
    for (const id of ['linkedin-post', 'facebook-post']) {
      const entry = `teksty/${id}.txt`;
      if (entries.includes(entry)) assert.equal(execFileSync('unzip', ['-p', file, entry], { encoding: 'utf8' }), captions.find(item => item.id === id).text + '\n');
    }
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
