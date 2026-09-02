import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { stories } from './copy.mjs';
import { palettes } from './promo.mjs';
import sharp from 'sharp';

const directory = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(directory, '../..');
const output = path.join(root, 'build/social-full/promo');
const { jobs } = JSON.parse(await readFile(path.join(output, 'jobs.json'), 'utf8'));
const manifest = JSON.parse(await readFile(path.join(directory, 'site/manifest.json'), 'utf8'));
const checks = jobs.flatMap(job => job.cuts.map((cut, index) => ({
  id: `${job.id}-shot-${index}`, file: `${job.previews}-shot-${index}.png`,
  expected: `${job.expected.lead} ${job.expected.body}${job.expected.cta ? ` ${job.expected.cta}` : ''}`,
})));
for (const job of jobs) {
  const story = stories.find(story => `story-${story.id}` === job.id);
  const expected = palettes[story.theme].background.slice(1).match(/../g).map(value => parseInt(value, 16));
  const pixel = await sharp(`${job.previews}-shot-0.png`).extract({ left: 0, top: 0, width: 1, height: 1 }).raw().toBuffer();
  assert.ok(expected.every((component, index) => Math.abs(component - pixel[index]) <= 5), `${job.id}: video color transfer changed the brand palette`);
}
for (const item of manifest.artworks.filter(item => ['story', 'carousel'].includes(item.format))) {
  const story = stories.find(story => story.id === item.storyId);
  checks.push({ id: item.id, file: path.join(directory, 'site', item.file), expected: `${story.lead} ${story.body}${story.cta ? ` ${story.cta}` : ''}` });
}
const facebook = manifest.artworks.find(item => item.format === 'facebook');
checks.push({ id: facebook.id, file: path.join(directory, 'site', facebook.file),
  expected: `${stories[9].lead} Atlas chmur i lekcje. METAR i TAF. Pracownie Windy i wiatru. chmurnik.cloud Bezpłatnie w przeglądarce i na iPhone’a.` });
const input = path.join(output, 'copy-checks.json');
const resultsFile = path.join(output, 'ocr-results.json');
await writeFile(input, JSON.stringify(checks, null, 2) + '\n');
execFileSync('xcrun', ['swift', '-module-cache-path', path.join(output, 'swift-cache'), path.join(directory, 'read-copy.swift'), input, resultsFile], { stdio: 'inherit' });
// Vision can return Cyrillic U+0456 for the visibly Latin "i" in Polish copy.
const words = text => text.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().replaceAll('ł', 'l').replaceAll('\u0456', 'i').match(/[\p{L}\p{N}]+/gu) || [];
const lcs = (expected, actual) => {
  const row = new Uint16Array(actual.length + 1);
  for (const word of expected) {
    let previous = 0;
    for (let index = 1; index <= actual.length; index++) {
      const saved = row[index];
      row[index] = word === actual[index - 1] ? previous + 1 : Math.max(row[index], row[index - 1]);
      previous = saved;
    }
  }
  return row[actual.length] / expected.length;
};
const results = JSON.parse(await readFile(resultsFile, 'utf8')).map(result => ({ ...result,
  wordCoverage: lcs(words(result.expected), words(result.recognized)),
  // OCR sometimes joins adjacent words under an underline, e.g. "Żebyza".
  continuousCharacters: words(result.recognized).join('').includes(words(result.expected).join('')),
}));
await writeFile(path.join(output, 'copy-audit.json'), JSON.stringify(results, null, 2) + '\n');
for (const result of results) console.log(`${result.id}: ${(result.wordCoverage * 100).toFixed(1)}% ordered word recognition`);
const low = results.filter(result => result.wordCoverage < 0.95 && !result.continuousCharacters);
assert.deepEqual(low.map(result => result.id), [], 'Inspect any low OCR result against the exact DOM copy and decoded frame; never silently drop sentences.');
console.log(`${results.length} actual decoded shots and JPG/carousel exports checked. OCR complements, not replaces, exact-copy and visual checks.`);
