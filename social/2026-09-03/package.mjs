import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { copyFile, mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const site = path.join(path.dirname(fileURLToPath(import.meta.url)), 'site');
const manifest = JSON.parse(await readFile(path.join(site, 'manifest.json'), 'utf8'));
const videos = manifest.artworks.flatMap(item => item.video ? [item.video] : []);
assert.equal(manifest.artworks.length, 5);
assert.equal(videos.length, 2);
for (const file of [...manifest.artworks, ...videos]) {
  const actual = await readFile(path.join(site, file.file));
  assert.equal(actual.length, file.bytes);
  assert.equal(createHash('sha256').update(actual).digest('hex'), file.sha256);
}
const temporary = await mkdtemp(path.join(tmpdir(), 'chmurnik-origin-'));
try {
  for (const withVideos of [true, false]) {
    const name = withVideos ? 'chmurnik-historia-2026-09-03.zip' : 'chmurnik-storki-jpg-2026-09-03.zip';
    const entries = ['CZYTAJ-MNIE.txt', ...manifest.artworks.map(item => item.file),
      ...(withVideos ? videos.map(item => item.file) : []),
      ...manifest.captions.map(item => `teksty/${item.id}.txt`)];
    const archive = path.join(temporary, name);
    execFileSync('zip', ['-q', '-X', archive, ...entries], { cwd: site });
    execFileSync('unzip', ['-t', archive]);
    assert.deepEqual(execFileSync('unzip', ['-Z1', archive], { encoding: 'utf8' }).trim().split('\n'), entries);
    await copyFile(archive, path.join(site, name));
    console.log(`${name}: ${entries.length} files; hashes, ZIP integrity and exact entries verified`);
  }
} finally {
  await rm(temporary, { recursive: true, force: true });
}
