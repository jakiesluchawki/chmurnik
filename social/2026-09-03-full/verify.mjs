import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { cp, mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { parseArgs } from 'node:util';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { preview } from 'vite';

const { values } = parseArgs({ options: { 'playwright-path': { type: 'string' }, 'browser-path': { type: 'string' }, base: { type: 'string' } } });
const { chromium } = await import(values['playwright-path'] ? pathToFileURL(values['playwright-path']).href : 'playwright');
const directory = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(directory, '../..');
const site = path.join(directory, 'site');
const output = path.join(root, `build/social-full/qa${values.base ? '-live' : ''}`);
await mkdir(output, { recursive: true });
const manifest = JSON.parse(await readFile(path.join(site, 'manifest.json'), 'utf8'));
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const mediaSource = file => `./${file}?v=${encodeURIComponent(manifest.revision)}`;
let server;
let browser;
try {
  if (!values.base) {
    await cp(path.join(root, 'social/2026-08-30/site'), path.join(root, 'dist/premiera'), { recursive: true });
    await cp(path.join(root, 'social/2026-09-03/site'), path.join(root, 'dist/premiera/2026-09-03'), { recursive: true });
    await cp(site, path.join(root, 'dist/premiera/historia'), { recursive: true });
    server = await preview({ base: '/chmurnik/', preview: { host: '127.0.0.1', port: 4182 } });
  }
  const base = values.base || `http://127.0.0.1:${server.httpServer.address().port}/chmurnik/premiera/historia/`;
  browser = await chromium.launch({ headless: true, executablePath: values['browser-path'] });
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, locale: 'pl-PL', reducedMotion: 'reduce' });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(base, { waitUntil: 'networkidle' });
  await page.locator('#story-grid .asset').first().waitFor();
  assert.equal(await page.locator('body').getAttribute('data-media-revision'), manifest.revision);
  assert.equal(await page.locator('#story-grid .asset').count(), 10);
  assert.equal(await page.locator('#story-grid video').count(), 10);
  assert.equal(await page.locator('#carousel-grid .asset').count(), 10);
  assert.equal(await page.locator('#facebook-grid .asset').count(), 1);
  assert.equal(await page.locator('details.caption').count(), 6);
  assert.equal(await page.locator('#store-link').inputValue(), manifest.storeUrl);
  await page.evaluate(async () => {
    for (const font of document.fonts) await font.load();
    for (const image of document.images) image.loading = 'eager';
    await Promise.all([...document.images].map(image => image.decode()));
  });
  for (const width of [320, 390, 1440]) {
    await page.setViewportSize({ width, height: 920 });
    await page.evaluate(() => scrollTo({ top: 0, behavior: 'instant' }));
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `${width}: horizontal overflow`);
    await page.screenshot({ path: path.join(output, `gallery-${width}.png`), fullPage: true });
    await page.screenshot({ path: path.join(output, `gallery-${width}-viewport.png`) });
  }
  await page.setViewportSize({ width: 390, height: 844 });
  for (const section of ['stories', 'instagram', 'linkedin', 'facebook']) {
    await page.locator(`#${section}`).scrollIntoViewIfNeeded();
    await page.screenshot({ path: path.join(output, `section-${section}.png`) });
  }

  const files = [...manifest.artworks, ...manifest.artworks.flatMap(item => item.video ? [item.video] : []), ...manifest.documents, ...manifest.archives];
  for (const file of files) {
    const response = await context.request.get(new URL(mediaSource(file.file), base).href);
    assert.equal(response.status(), 200, file.file);
    assert.equal(hash(await response.body()), file.sha256, file.file);
  }
  console.log(`${files.length} public images, videos, PDF and ZIPs match their hashes.`);
  for (const item of manifest.artworks.filter(item => item.video)) {
    const selector = `video:has(source[src="${mediaSource(item.video.file)}"])`;
    const video = page.locator(selector);
    await video.scrollIntoViewIfNeeded();
    const metadata = await video.evaluate(async node => {
      if (node.readyState < 2) await new Promise((resolve, reject) => {
        node.addEventListener('loadeddata', resolve, { once: true });
        node.addEventListener('error', () => reject(new Error('Video decode failed')), { once: true });
        node.preload = 'auto'; node.load();
      });
      return { width: node.videoWidth, height: node.videoHeight, duration: node.duration, paused: node.paused, inline: node.playsInline };
    });
    assert.equal(metadata.width, 1080);
    assert.equal(metadata.height, 1920);
    assert.equal(metadata.paused, true);
    assert.equal(metadata.inline, true);
    assert.ok(Math.abs(metadata.duration - item.video.duration) < 0.1);
    const hashes = [];
    for (const [index, time] of [0.2, item.video.duration / 2, item.video.duration - 0.3].entries()) {
      const pixels = await video.evaluate(async (node, seconds) => {
        await new Promise(resolve => { node.addEventListener('seeked', resolve, { once: true }); node.currentTime = seconds; });
        const canvas = document.createElement('canvas');
        canvas.width = node.videoWidth; canvas.height = node.videoHeight;
        canvas.getContext('2d').drawImage(node, 0, 0);
        return canvas.toDataURL('image/png').split(',')[1];
      }, time);
      const bytes = Buffer.from(pixels, 'base64');
      hashes.push(hash(bytes));
      await writeFile(path.join(output, `${item.id}-frame-${index}.png`), bytes);
    }
    assert.equal(new Set(hashes).size, 3, `${item.id}: every promo must have changing frames`);
    await video.evaluate(async node => { node.muted = true; await node.play(); });
    await page.waitForFunction(selector => document.querySelector(selector).ended, selector, { timeout: 10000 });
    console.log(`${item.id}: decode, three seeks, inline/no-autoplay and playback to end PASS`);
  }

  await page.evaluate(() => Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async text => { window.copiedText = text; } } }));
  for (const item of manifest.captions) {
    await page.getByText(item.title, { exact: true }).click();
    const textarea = page.getByRole('textbox', { name: `Tekst: ${item.title}`, exact: true });
    assert.equal(await textarea.inputValue(), item.text);
    await textarea.locator('..').getByRole('button', { name: 'Kopiuj tekst', exact: true }).click();
    assert.equal(await page.evaluate(() => window.copiedText), item.text);
    const response = await context.request.get(new URL(`teksty/${item.id}.txt`, base).href);
    assert.equal(await response.text(), item.text + '\n');
  }
  for (const [index, story] of manifest.artworks.filter(item => item.format === 'story').entries()) {
    const card = page.locator('#story-grid .asset').nth(index);
    assert.equal(await card.locator('.sticker-tools input').inputValue(), manifest.storeUrl);
    assert.ok((await card.locator('.sticker-tools p').innerText()).includes(story.stickerLabel));
    await card.getByRole('button', { name: 'Kopiuj link do storki', exact: true }).click();
    assert.equal(await page.evaluate(() => window.copiedText), manifest.storeUrl);
  }
  await page.evaluate(() => Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async () => { throw new Error('Not permitted'); } } }));
  await page.locator('#copy-store-link').click();
  assert.ok(await page.locator('#store-link').evaluate(node => node.selectionStart === 0 && node.selectionEnd === node.value.length));
  await page.locator('details.caption button').first().click();
  assert.ok(await page.locator('details.caption textarea').first().evaluate(node => node.selectionStart === 0 && node.selectionEnd === node.value.length));
  for (const file of [...manifest.archives, ...manifest.documents]) {
    const downloadEvent = page.waitForEvent('download');
    await page.locator(`a[download][href*="/${file.file}"]`).first().click();
    const download = await downloadEvent;
    assert.equal(download.suggestedFilename(), file.file);
    await download.saveAs(path.join(output, file.file));
    assert.equal(await download.failure(), null);
  }
  assert.deepEqual(errors, []);
  await context.close();

  const shareContext = await browser.newContext({ viewport: { width: 390, height: 844 } });
  await shareContext.addInitScript(() => {
    window.sharedFiles = [];
    Object.defineProperty(navigator, 'canShare', { value: data => data.files?.every(file => ['image/jpeg', 'video/mp4'].includes(file.type)) });
    Object.defineProperty(navigator, 'share', { value: data => { window.sharedFiles = data.files.map(file => ({ name: file.name, size: file.size, type: file.type })); return Promise.resolve(); } });
  });
  const sharePage = await shareContext.newPage();
  await sharePage.goto(base);
  for (const [index, item] of manifest.artworks.entries()) {
    const card = sharePage.locator('.asset').nth(index);
    await card.scrollIntoViewIfNeeded();
    await card.getByRole('button', { name: item.video ? 'Zapisz film / udostępnij' : 'Zapisz / udostępnij', exact: true }).click();
    const media = item.video || item;
    assert.deepEqual(await sharePage.evaluate(() => window.sharedFiles), [{ name: `${item.id}.${item.video ? 'mp4' : 'jpg'}`, size: media.bytes, type: item.video ? 'video/mp4' : 'image/jpeg' }]);
  }
  await shareContext.close();
  console.log('Full pack PASS: 320/390/1440; 21 JPG + 10 MP4 + PDF + 6 ZIP hashes/downloads; complete copy; 10 sticker links; clipboard fallback; simulated JPG/MP4 file sharing. Physical iPhone/Instagram upload is not claimed.');
} finally {
  await browser?.close();
  await server?.close();
}
