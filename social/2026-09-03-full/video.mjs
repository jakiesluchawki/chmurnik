import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const directory = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(directory, '../..');
const site = path.join(directory, 'site');
const output = path.join(root, 'build/social-full');
const manifest = JSON.parse(await readFile(path.join(site, 'manifest.json'), 'utf8'));
const { demos } = JSON.parse(await readFile(path.join(output, 'demos.json'), 'utf8'));
await mkdir(path.join(site, 'videos'), { recursive: true });
const movies = manifest.artworks.filter(item => item.format === 'story');
assert.equal(movies.length, 10);
assert.equal(demos.length, 6);
const recording = item => {
  if (item.demo) {
    const demo = demos.find(candidate => candidate.id === item.demo);
    assert.ok(demo);
    return { ...demo, kind: 'walkthrough' };
  }
  const duration = Math.max(12, Math.ceil(`${item.lead} ${item.body} ${item.cta || ''}`.split(/\s+/).length / 2.7 + 2));
  return { fps: 30, duration, kind: 'reading', frames: [{ file: path.join(site, item.file), holdFrames: duration * 30 }] };
};
const jobs = movies.map(item => {
  const demo = recording(item);
  return { output: path.join(site, 'videos', `${item.id}.mp4`), background: demo.frames[0].file,
    area: { x: 0, y: 0, width: 1080, height: 1920 }, fullFrame: true, frames: demo.frames,
    fps: demo.fps, preview: path.join(output, `${item.id}-decoded.png`) };
});
const plan = path.join(output, 'video-jobs.json');
await writeFile(plan, JSON.stringify({ jobs }, null, 2) + '\n');
execFileSync('xcrun', ['swift', '-module-cache-path', path.join(output, 'swift-cache'), path.join(root, 'social/2026-09-03/encode.swift'), plan], { stdio: 'inherit' });
for (const item of movies) {
  const file = `videos/${item.id}.mp4`;
  const bytes = await readFile(path.join(site, file));
  const demo = recording(item);
  item.video = { file, mime: 'video/mp4', codec: 'H.264', width: 1080, height: 1920, fps: demo.fps,
    duration: demo.duration, kind: demo.kind, audio: false, bytes: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex') };
}
await writeFile(path.join(site, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
