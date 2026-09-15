import assert from 'node:assert/strict';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

const here = fileURLToPath(new URL('.', import.meta.url));
const base = 'https://jakiesluchawki.github.io/chmurnik/premiera/niebo-i-woda/';
const library = 'https://jakiesluchawki.github.io/chmurnik/assetySM/';
const manifest = JSON.parse(await readFile(resolve(here, 'site/manifest.json')));
const exports = JSON.parse(await readFile(resolve(here, 'site/exports-manifest.json')));
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const checks = [];

async function check(url, method = 'HEAD', expectedHash) {
  const response = await fetch(url, { method, signal: AbortSignal.timeout(30_000) });
  assert.equal(response.status, 200, `${method} ${url}`);
  if (expectedHash) {
    assert.equal(hash(Buffer.from(await response.arrayBuffer())), expectedHash, url);
  } else if (method === 'GET') {
    await response.arrayBuffer();
  }
  checks.push({ url, method, status: response.status, exactBytes: Boolean(expectedHash) });
}

for (const file of ['index.html', 'manifest.json', 'exports-manifest.json', 'style.css', 'copy.js', 'PUBLIKACJA.txt', 'TEKSTY-I-LINKI.txt', 'ZRODLA.txt']) {
  await check(base + file, 'GET', hash(await readFile(resolve(here, 'site', file))));
}
const assets = new Set(exports.artworks.flatMap(a => [a.file, a.preview]));
for (const document of exports.documents) assets.add(document.file);
for (const theme of manifest.themes) assets.add(theme.id + '/siatka/podglad.jpg');
assets.add('siatka-6-postow.jpg');
for (const file of assets) await check(base + file);
for (const archive of manifest.archives) await check(archive.url);
await check(library, 'GET');
const response = await fetch(library + 'catalog.json', { signal: AbortSignal.timeout(30_000) });
assert.equal(response.status, 200);
const catalog = await response.json();
const packs = Array.isArray(catalog) ? catalog : catalog.packs;
assert.equal(packs[0].id, 'niebo-i-woda');
for (const id of ['grupy', 'pracownie', 'niebo', 'astra', 'historia', 'premiera']) {
  assert(packs.some(pack => pack.id === id), `Retain older pack ${id}`);
}
const result = { checkedAt: new Date().toISOString(), checks, libraryPacks: packs.length, archives: manifest.archives.length };
const qa = resolve(here, '../../build/social-niebo-woda-qa');
await mkdir(qa, { recursive: true });
await writeFile(resolve(qa, 'public-verification.json'), JSON.stringify(result, null, 2) + '\n');
console.log(JSON.stringify({ publicChecks: checks.length, completeCopy: true, libraryPacks: packs.length, archives: manifest.archives.length }));
