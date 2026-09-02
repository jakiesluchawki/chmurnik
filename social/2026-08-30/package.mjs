import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdtemp, readFile, copyFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const site = path.join(path.dirname(fileURLToPath(import.meta.url)), 'site');
const manifest = JSON.parse(await readFile(path.join(site, 'manifest.json'), 'utf8'));
const temporary = await mkdtemp(path.join(tmpdir(), 'chmurnik-social-'));
const archives = [
  { name: 'chmurnik-storki-pl-2026-09-02.zip', storiesOnly: true },
  { name: 'chmurnik-polska-2026-09-02.zip', storiesOnly: false },
];
for (const { name, storiesOnly } of archives) {
  const files = manifest.artworks.filter(item => !storiesOnly || item.format === 'story');
  assert.equal(files.length, storiesOnly ? 5 : 7);
  for (const file of files) {
    const actual = await readFile(path.join(site, file.file));
    assert.equal(createHash('sha256').update(actual).digest('hex'), file.sha256);
  }
  const archive = path.join(temporary, name);
  const entries = ['CZYTAJ-MNIE.txt', ...files.map(item => item.file), ...manifest.captions.filter(item => !storiesOnly || item.id === 'storki-linki').map(item => `teksty/${item.id}.txt`)];
  execFileSync('zip', ['-q', '-X', archive, ...entries], { cwd: site });
  execFileSync('unzip', ['-t', archive]);
  const contents = execFileSync('unzip', ['-Z1', archive], { encoding: 'utf8' }).trim().split('\n');
  assert.deepEqual(contents, entries);
  await copyFile(archive, path.join(site, name));
  console.log(`${name}: ${entries.length} files, archive integrity and exact file list verified`);
}
