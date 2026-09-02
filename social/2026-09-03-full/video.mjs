import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { createServer } from 'node:http';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { parseArgs } from 'node:util';
import { stories } from './copy.mjs';
import { durationFor, edits, fps, palettes, promoHtml, revision, sourceArea } from './promo.mjs';

const { values } = parseArgs({ options: { 'playwright-path': { type: 'string' }, 'browser-path': { type: 'string' }, only: { type: 'string' }, 'prepare-only': { type: 'boolean' } } });
const { chromium } = await import(values['playwright-path'] ? pathToFileURL(values['playwright-path']).href : 'playwright');
const directory = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(directory, '../..');
const site = path.join(directory, 'site');
const output = path.join(root, 'build/social-full/promo');
await mkdir(output, { recursive: true });
const manifest = JSON.parse(await readFile(path.join(site, 'manifest.json'), 'utf8'));
const { demos } = JSON.parse(await readFile(path.join(root, 'build/social-full/demos.json'), 'utf8'));
const css = await readFile(path.join(directory, 'promo.css'), 'utf8');
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const selected = stories.filter(story => !values.only || values.only.split(',').includes(story.id));
const expanded = new Map(demos.map(demo => [demo.id, demo.frames.flatMap(frame => Array(frame.holdFrames).fill(frame.file))]));
const server = createServer(async (request, response) => {
  try {
    const url = new URL(request.url, 'http://localhost');
    if (url.pathname === '/promo') {
      const story = stories.find(item => item.id === url.searchParams.get('story'));
      assert.ok(story);
      response.setHeader('Content-Type', 'text/html; charset=utf-8');
      response.end(promoHtml(story, css));
      return;
    }
    const file = path.resolve(root, `.${decodeURIComponent(url.pathname)}`);
    assert.ok(file.startsWith(root + path.sep));
    response.setHeader('Content-Type', ({ '.png': 'image/png', '.woff2': 'font/woff2' })[path.extname(file)] || 'application/octet-stream');
    response.end(await readFile(file));
  } catch { response.writeHead(404); response.end(); }
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
let browser;
const jobs = [];
try {
  browser = await chromium.launch({ headless: true, executablePath: values['browser-path'] });
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
  for (const story of selected) {
    const palette = palettes[story.theme];
    await page.goto(`http://127.0.0.1:${server.address().port}/promo?story=${story.id}`);
    await page.evaluate(async () => {
      for (const font of document.fonts) await font.load();
      await Promise.all([...document.images].map(image => image.decode()));
    });
    const geometry = await page.evaluate(({ lead, body, cta }) => {
      const title = document.querySelector('h1');
      const copy = document.querySelector('[data-copy="body"]');
      const panel = document.querySelector('.copy-panel');
      if (lead.length > 42) title.style.fontSize = '70px';
      for (let size = 38; panel.getBoundingClientRect().bottom > 812 && size >= 34; size--) copy.style.fontSize = `${size}px`;
      const rect = element => {
        const box = element.getBoundingClientRect();
        return { x: box.x, y: box.y, width: box.width, height: box.height };
      };
      const parts = [...document.querySelectorAll('[data-part]')].map(node => {
        const range = document.createRange(); range.selectNodeContents(node);
        return { text: node.textContent, rects: [...range.getClientRects()].map(box => ({ x: box.x, y: box.y, width: box.width, height: box.height })) };
      });
      const visibleText = { lead: title.textContent, body: copy.textContent, cta: document.querySelector('.cta')?.textContent };
      if (visibleText.lead !== lead || visibleText.body !== body || visibleText.cta !== cta) throw new Error('Visible copy changed');
      const top = Math.max(696, Math.ceil(panel.getBoundingClientRect().bottom) + 38);
      return { text: visibleText, parts, title: rect(title), body: rect(copy), stage: { x: 70, y: top, width: 940, height: (cta ? 1400 : 1474) - top }, fontSize: getComputedStyle(copy).fontSize };
    }, { lead: story.lead, body: story.body, cta: story.cta });
    assert.ok(geometry.stage.height >= 545, `${story.id}: too little room for the demonstration`);
    for (const part of geometry.parts) for (const rect of part.rects) {
      assert.ok(rect.x >= 69 && rect.x + rect.width <= 1011 && rect.y + rect.height < geometry.stage.y - 25, `${story.id}: copy clipping`);
    }
    const overlays = [];
    for (let active = 0; active < story.parts.length; active++) {
      await page.evaluate(index => document.querySelectorAll('[data-part]').forEach((node, i) => node.classList.toggle('active', i === index)), active);
      const file = path.join(output, `${story.id}-copy-${active}.png`);
      await page.screenshot({ path: file, omitBackground: true });
      overlays.push(file);
    }
    await page.evaluate(background => document.body.style.background = background, palette.background);
    await page.screenshot({ path: path.join(output, `${story.id}-copy-proof.png`) });
    const frames = [];
    const cuts = [];
    for (const [shotIndex, shot] of edits[story.id].entries()) {
      const count = Math.round(shot.seconds * fps);
      const start = frames.length / fps;
      const demo = shot.demo && demos.find(candidate => candidate.id === shot.demo);
      if (demo) assert.ok(shot.from >= 0 && shot.to <= demo.duration);
      for (let index = 0; index < count; index++) {
        const progress = index / Math.max(1, count - 1);
        const sourceTime = shot.demo ? shot.from + (shot.to - shot.from) * progress : 0;
        const file = shot.demo ? expanded.get(shot.demo)[Math.min(Math.floor(sourceTime * fps), expanded.get(shot.demo).length - 1)] : path.join(root, shot.image);
        assert.ok(file);
        frames.push({ file, sourceArea: shot.demo ? sourceArea : null, shot: shotIndex, progress, focus: shot.focus,
          zoom: shot.zoom, overlay: Math.min(story.parts.length - 1, Math.floor(frames.length / (durationFor(story) * fps) * story.parts.length)) });
      }
      cuts.push({ ...shot, at: start, duration: count / fps });
    }
    const item = manifest.artworks.find(item => item.id === `story-${story.id}`);
    jobs.push({ id: item.id, output: path.join(site, 'videos', `${item.id}.mp4`), fps, frames, overlays,
      palette, stage: geometry.stage, previews: path.join(output, item.id), geometry, cuts,
      expected: { lead: story.lead, body: story.body, cta: story.cta }, kind: story.demo ? 'walkthrough' : 'montage' });
    console.log(`${story.id}: full copy always visible; ${cuts.length} cuts; ${durationFor(story).toFixed(2)}s; ${geometry.fontSize} body`);
  }
} finally {
  await browser?.close();
  await new Promise(resolve => server.close(resolve));
}
const plan = path.join(output, 'jobs.json');
await writeFile(plan, JSON.stringify({ jobs }, null, 2) + '\n');
if (!values['prepare-only']) {
  execFileSync('xcrun', ['swift', '-module-cache-path', path.join(output, 'swift-cache'), path.join(directory, 'promo.swift'), plan], { stdio: 'inherit' });
  let evidence = { revision, stories: [] };
  try { evidence = JSON.parse(await readFile(path.join(directory, 'captures/promo-edit.json'), 'utf8')); } catch {}
  for (const job of jobs) {
    const item = manifest.artworks.find(item => item.id === job.id);
    const bytes = await readFile(job.output);
    item.video = { file: `videos/${job.id}.mp4`, mime: 'video/mp4', codec: 'H.264', width: 1080, height: 1920, fps,
      duration: job.frames.length / fps, kind: job.kind, audio: false, bytes: bytes.length, sha256: hash(bytes),
      revision, fullCopyAlwaysVisible: true, cuts: job.cuts.length };
    const record = { id: job.id, duration: job.frames.length / fps, cuts: job.cuts, copy: job.expected,
      fullCopyAlwaysVisible: true, geometry: job.geometry,
      overlays: await Promise.all(job.overlays.map(async file => ({ file: path.relative(root, file), sha256: hash(await readFile(file)) }))) };
    evidence.stories = [...evidence.stories.filter(story => story.id !== job.id), record];
  }
  manifest.revision = revision;
  evidence.method = 'Fast edit of existing genuine app capture frames, with jump cuts, short push-ins and pointer traces retained. Whole approved copy is composited above every frame, including all lead/body/CTA sentences. No reading-time holds. Sources and readouts are not redrawn. Music is intentionally absent. Not a physical iPhone capture.';
  await writeFile(path.join(directory, 'captures/promo-edit.json'), JSON.stringify(evidence, null, 2) + '\n');
  await writeFile(path.join(site, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
}
