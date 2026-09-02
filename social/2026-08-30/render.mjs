import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { createServer } from 'node:http';
import { readFile, writeFile, mkdir, copyFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { parseArgs } from 'node:util';
import sharp from 'sharp';

const { values } = parseArgs({ options: { 'playwright-path': { type: 'string' }, 'browser-path': { type: 'string' }, campaign: { type: 'string' }, only: { type: 'string' } } });
const { chromium } = await import(values['playwright-path'] ? pathToFileURL(values['playwright-path']).href : 'playwright');
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const directory = values.campaign ? path.resolve(root, values.campaign) : path.dirname(fileURLToPath(import.meta.url));
assert.ok(directory.startsWith(path.join(root, 'social') + path.sep));
const { artworks, artworkHtml, storeUrl, campaign = {} } = await import(pathToFileURL(path.join(directory, 'artwork.mjs')).href);
const { captions } = await import(pathToFileURL(path.join(directory, 'captions.mjs')).href);
const output = path.join(directory, 'site');
const selected = values.only ? artworks.filter(item => item.id === values.only) : artworks;
assert.ok(selected.length, `Unknown artwork: ${values.only}`);
const previous = values.only ? JSON.parse(await readFile(path.join(output, 'manifest.json'), 'utf8')) : null;
if (previous) assert.deepEqual(previous.artworks.map(item => item.id), artworks.map(item => item.id));
const css = await readFile(path.join(directory, 'artwork.css'), 'utf8');
const mime = { '.png': 'image/png', '.jpg': 'image/jpeg', '.woff2': 'font/woff2', '.css': 'text/css', '.js': 'text/javascript', '.json': 'application/json', '.html': 'text/html' };
const server = createServer(async (request, response) => {
  try {
    const url = new URL(request.url, 'http://localhost');
    if (url.pathname === '/artwork') {
      const artwork = artworks.find(item => item.id === url.searchParams.get('id'));
      if (!artwork) throw new Error('Unknown artwork');
      response.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      response.end(artworkHtml(artwork, css));
      return;
    }
    const file = path.resolve(root, `.${decodeURIComponent(url.pathname)}`);
    assert.ok(file.startsWith(`${root}${path.sep}`));
    const data = await readFile(file);
    response.writeHead(200, { 'Content-Type': mime[path.extname(file)] || 'application/octet-stream' });
    response.end(data);
  } catch {
    response.writeHead(404);
    response.end('Not found');
  }
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
let browser;
try {
  await mkdir(path.join(output, 'images'), { recursive: true });
  await mkdir(path.join(output, 'teksty'), { recursive: true });
  browser = await chromium.launch({ headless: true, executablePath: values['browser-path'] });
  const page = await browser.newPage({ deviceScaleFactor: 1 });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  const manifest = [];
  for (const artwork of selected) {
    const height = artwork.format === 'story' ? 1920 : 1350;
    await page.setViewportSize({ width: 1080, height });
    await page.goto(`http://127.0.0.1:${server.address().port}/artwork?id=${artwork.id}`);
    await page.evaluate(async () => {
      for (const font of document.fonts) await font.load();
      await document.fonts.ready;
      await Promise.all([...document.images].map(img => img.decode()));
    });
    const audit = await page.evaluate(() => {
      const canvas = document.querySelector('#artwork');
      const safe = [...document.querySelectorAll('[data-safe]')].map(element => {
        const { x, y, width, height } = element.getBoundingClientRect();
        return { text: element.innerText, x, y, width, height, overflow: element.scrollWidth > element.clientWidth + 1 };
      });
      const sticker = document.querySelector('.sticker-area')?.getBoundingClientRect().toJSON();
      const visual = [...document.querySelectorAll('.phone, .observer, .cloud-photo, .wind-art, .demo-frame')].map(node => node.getBoundingClientRect().toJSON());
      const videoArea = document.querySelector('.demo-frame')?.getBoundingClientRect().toJSON();
      return { width: canvas.offsetWidth, height: canvas.offsetHeight, safe, sticker, visual, videoArea, fonts: [...document.fonts].map(font => ({ name: font.family, status: font.status })) };
    });
    assert.equal(audit.width, 1080);
    assert.equal(audit.height, height);
    assert.ok(audit.fonts.every(font => font.status === 'loaded'), 'All original fonts must load');
    for (const box of audit.safe) {
      assert.ok(!box.overflow, `${artwork.id}: text overflow ${box.text}`);
      assert.ok(box.x >= 60 && box.x + box.width <= 1020, `${artwork.id}: horizontal safe zone`);
      assert.ok(box.y >= (height === 1920 ? 220 : 60), `${artwork.id}: top safe zone`);
      assert.ok(box.y + box.height <= (height === 1920 ? 1704 : 1290), `${artwork.id}: bottom safe zone ${box.text}`);
    }
    if (artwork.stickerArea) {
      const { x, y, width, height } = audit.sticker;
      assert.deepEqual({ x, y, width, height }, artwork.stickerArea);
      for (const box of [...audit.safe, ...audit.visual]) {
        const overlaps = box.x < x + width && box.x + box.width > x && box.y < y + height && box.y + box.height > y;
        assert.ok(!overlaps, `${artwork.id}: sticker would cover text or artwork`);
      }
    }
    const file = `images/${artwork.id}.jpg`;
    const target = path.join(output, file);
    await page.screenshot({ path: target, type: 'jpeg', quality: 96, fullPage: false });
    const data = await readFile(target);
    const metadata = await sharp(data).metadata();
    assert.equal(metadata.width, 1080);
    assert.equal(metadata.height, height);
    const thumbnail = `images/${artwork.id}-preview.jpg`;
    await sharp(data).resize({ width: 432 }).jpeg({ quality: 86 }).toFile(path.join(output, thumbnail));
    const { content, ...description } = artwork;
    manifest.push({ ...description, file, thumbnail, width: 1080, height, bytes: data.length, sha256: createHash('sha256').update(data).digest('hex'), ...(audit.videoArea ? { videoArea: audit.videoArea } : {}) });
    console.log(`${artwork.id}: ${1080}x${height}, ${Math.round(data.length / 1024)} KB, safe zones and fonts OK`);
  }
  assert.deepEqual(errors, []);
  for (const caption of captions) await writeFile(path.join(output, 'teksty', `${caption.id}.txt`), `${caption.text}\n`);
  await copyFile(path.join(root, 'public/brand/chmurnik-wordmark.png'), path.join(output, 'wordmark.png'));
  const exports = previous ? previous.artworks.map(item => ({ ...item, ...manifest.find(update => update.id === item.id) })) : manifest;
  await writeFile(path.join(output, 'manifest.json'), `${JSON.stringify({ generatedOn: '2026-09-02', availability: 'Available in Poland; verified 2026-09-02 at 08:30 Europe/Warsaw. Account trader review is separate.', ...previous, ...campaign, storeUrl, artworks: exports, captions }, null, 2)}\n`);
} finally {
  await browser?.close();
  await new Promise(resolve => server.close(resolve));
}
