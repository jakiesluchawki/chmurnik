import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const directory = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(directory, '../..');
const site = path.join(directory, 'site');
const output = path.join(root, 'build/social-2026-09-03');
const manifest = JSON.parse(await readFile(path.join(site, 'manifest.json'), 'utf8'));
const { demos } = JSON.parse(await readFile(path.join(output, 'demos.json'), 'utf8'));
await mkdir(path.join(site, 'videos'), { recursive: true });
const jobs = manifest.artworks.filter(item => item.demo).map(item => {
  const demo = demos.find(candidate => candidate.id === item.demo);
  assert.ok(demo && item.videoArea);
  return { output: path.join(site, 'videos', `${item.id}.mp4`), background: path.join(site, item.file), area: item.videoArea, frames: demo.frames, fps: demo.fps, preview: path.join(output, `${item.demo}-decoded.png`) };
});
assert.equal(jobs.length, 2);
const plan = path.join(output, 'video-jobs.json');
await writeFile(plan, JSON.stringify({ jobs }, null, 2) + '\n');
execFileSync('xcrun', ['swift', '-module-cache-path', path.join(output, 'swift-cache'), path.join(directory, 'encode.swift'), plan], { stdio: 'inherit' });
for (const item of manifest.artworks.filter(artwork => artwork.demo)) {
  const file = `videos/${item.id}.mp4`;
  const bytes = await readFile(path.join(site, file));
  const demo = demos.find(candidate => candidate.id === item.demo);
  item.video = { file, mime: 'video/mp4', codec: 'H.264', width: 1080, height: 1920, fps: demo.fps, duration: demo.duration, audio: false, bytes: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex') };
}
await writeFile(path.join(site, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
