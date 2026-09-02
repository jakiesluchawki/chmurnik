import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { cp, mkdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { parseArgs } from 'node:util';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { preview } from 'vite';

const { values } = parseArgs({ options: { 'playwright-path': { type: 'string' }, 'browser-path': { type: 'string' }, base: { type: 'string' } } });
const { chromium } = await import(values['playwright-path'] ? pathToFileURL(values['playwright-path']).href : 'playwright');
const directory = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(directory, '../..');
const output = path.join(root, 'build/social-2026-09-03/qa');
const manifest = JSON.parse(await readFile(path.join(directory, 'site/manifest.json'), 'utf8'));
await mkdir(output, { recursive: true });
let server;
let browser;
try {
  if (!values.base) {
    await cp(path.join(root, 'social/2026-08-30/site'), path.join(root, 'dist/premiera'), { recursive: true });
    await cp(path.join(directory, 'site'), path.join(root, 'dist/premiera/2026-09-03'), { recursive: true });
    server = await preview({ base: '/chmurnik/', preview: { host: '127.0.0.1', port: 4181 } });
  }
  const base = values.base || `http://127.0.0.1:${server.httpServer.address().port}/chmurnik/premiera/2026-09-03/`;
  browser = await chromium.launch({ headless: true, executablePath: values['browser-path'] });
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, locale: 'pl-PL', reducedMotion: 'reduce', isMobile: true, hasTouch: true });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(base, { waitUntil: 'networkidle' });
  await page.locator('#story-grid .asset').first().waitFor();
  assert.equal(await page.locator('#story-grid .asset').count(), 5);
  assert.equal(await page.locator('#story-grid video').count(), 2);
  assert.equal(await page.locator('#store-link').inputValue(), manifest.storeUrl);
  await page.evaluate(() => document.fonts.ready);
  for (const card of await page.locator('#story-grid .asset').all()) {
    await card.scrollIntoViewIfNeeded();
    await card.locator('button:disabled').waitFor({ state: 'detached' });
  }
  await page.evaluate(async () => {
    for (const image of document.images) image.loading = 'eager';
    await Promise.all([...document.images].map(image => image.decode()));
    scrollTo({ top: 0, behavior: 'instant' });
  });
  for (const width of [320, 390, 1440]) {
    await page.setViewportSize({ width, height: 920 });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `${width}: horizontal overflow`);
    await page.screenshot({ path: path.join(output, `gallery-${width}.png`), fullPage: true });
    await page.screenshot({ path: path.join(output, `gallery-${width}-viewport.png`) });
  }
  for (const item of manifest.artworks) {
    for (const media of [item, ...(item.video ? [item.video] : [])]) {
      const response = await context.request.get(new URL(media.file, base).href);
      assert.equal(response.status(), 200);
      assert.ok(response.headers()['content-type'].startsWith(media.mime || 'image/jpeg'));
      assert.equal(createHash('sha256').update(await response.body()).digest('hex'), media.sha256);
    }
    if (!item.video) continue;
    const locator = page.locator(`video:has(source[src="./${item.video.file}"])`);
    await locator.scrollIntoViewIfNeeded();
    const metadata = await locator.evaluate(async node => {
      if (node.readyState < 2) await new Promise((resolve, reject) => {
        node.addEventListener('loadeddata', resolve, { once: true });
        node.addEventListener('error', () => reject(new Error('Video decode failed')), { once: true });
        node.preload = 'auto';
        node.load();
      });
      return { width: node.videoWidth, height: node.videoHeight, duration: node.duration, paused: node.paused, inline: node.playsInline };
    });
    assert.equal(metadata.width, 1080);
    assert.equal(metadata.height, 1920);
    assert.ok(Math.abs(metadata.duration - item.video.duration) < 0.1);
    assert.equal(metadata.paused, true);
    assert.equal(metadata.inline, true);
    const frames = [];
    for (const seconds of [0.2, 5, item.video.duration - 0.3]) {
      const pixels = await locator.evaluate(async (node, time) => {
        await new Promise(resolve => { node.addEventListener('seeked', resolve, { once: true }); node.currentTime = time; });
        const canvas = document.createElement('canvas');
        canvas.width = node.videoWidth;
        canvas.height = node.videoHeight;
        canvas.getContext('2d').drawImage(node, 0, 0);
        return canvas.toDataURL('image/png');
      }, seconds);
      frames.push(createHash('sha256').update(pixels).digest('hex'));
      await locator.screenshot({ path: path.join(output, `${item.demo}-${seconds}.png`) });
    }
    assert.equal(new Set(frames).size, 3, `${item.demo}: expected three visually distinct states`);
    await locator.evaluate(async node => { node.muted = true; await node.play(); });
    await page.waitForFunction(selector => document.querySelector(selector).ended, `video:has(source[src="./${item.video.file}"])`, { timeout: 10000 });
  }
  for (const caption of manifest.captions) {
    await page.getByText(caption.title, { exact: true }).click();
    assert.equal(await page.getByRole('textbox', { name: `Tekst: ${caption.title}`, exact: true }).inputValue(), caption.text);
  }
  await page.evaluate(() => Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async () => { throw new Error('Not permitted'); } } }));
  await page.locator('#copy-store-link').click();
  assert.ok(await page.locator('#store-link').evaluate(node => node.selectionStart === 0 && node.selectionEnd === node.value.length));
  await page.locator('#caption-list').getByRole('button', { name: 'Kopiuj tekst' }).first().click();
  assert.ok(await page.locator('#caption-list textarea').first().evaluate(node => node.selectionStart === 0 && node.selectionEnd === node.value.length));
  await page.evaluate(() => Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async text => { window.copiedText = text; } } }));
  for (const [index, item] of manifest.artworks.entries()) {
    const card = page.locator('#story-grid .asset').nth(index);
    assert.equal(await card.locator('.sticker-tools input').inputValue(), manifest.storeUrl);
    assert.ok((await card.locator('.sticker-tools p').innerText()).includes(item.stickerLabel));
    await card.getByRole('button', { name: 'Kopiuj link do storki', exact: true }).click();
    assert.equal(await page.evaluate(() => window.copiedText), manifest.storeUrl);
  }
  for (const zip of ['chmurnik-historia-2026-09-03.zip', 'chmurnik-storki-jpg-2026-09-03.zip']) {
    const response = await context.request.get(new URL(zip, base).href);
    assert.equal(response.status(), 200);
    assert.ok((await response.body()).equals(await readFile(path.join(directory, 'site', zip))));
    const downloading = page.waitForEvent('download');
    await page.locator(`a[download][href="./${zip}"]`).first().click();
    const download = await downloading;
    assert.equal(download.suggestedFilename(), zip);
    await download.saveAs(path.join(output, zip));
    assert.equal(await download.failure(), null);
  }
  assert.deepEqual(errors, []);
  await context.close();

  // Contract simulation only: a physical iPhone's share sheet is not automated.
  const sharedContext = await browser.newContext({ viewport: { width: 390, height: 844 } });
  await sharedContext.addInitScript(() => {
    window.sharedFiles = [];
    Object.defineProperty(navigator, 'canShare', { value: data => data.files?.every(file => ['image/jpeg', 'video/mp4'].includes(file.type)) });
    Object.defineProperty(navigator, 'share', { value: data => {
      window.sharedFiles = data.files.map(file => ({ name: file.name, size: file.size, type: file.type }));
      return Promise.resolve();
    } });
  });
  const sharedPage = await sharedContext.newPage();
  await sharedPage.goto(base);
  for (const [index, item] of manifest.artworks.entries()) {
    const card = sharedPage.locator('#story-grid .asset').nth(index);
    await card.scrollIntoViewIfNeeded();
    const button = card.getByRole('button', { name: item.video ? 'Zapisz film / udostępnij' : 'Zapisz / udostępnij', exact: true });
    await button.click();
    const media = item.video || item;
    assert.deepEqual(await sharedPage.evaluate(() => window.sharedFiles), [{ name: `${item.id}.${item.video ? 'mp4' : 'jpg'}`, size: media.bytes, type: item.video ? 'video/mp4' : 'image/jpeg' }]);
  }
  await sharedContext.close();
  console.log('Origin gallery PASS: 320/390/1440 layouts; 5 JPG + 2 MP4 hashes; video decoding, seeking and playback; both ZIP downloads; captions; clipboard fallback; 5 sticker links; simulated JPG/MP4 sharing.');
} finally {
  await browser?.close();
  await server?.close();
}
