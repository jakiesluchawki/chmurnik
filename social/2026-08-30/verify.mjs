import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { cp, readFile, mkdir } from 'node:fs/promises';
import { preview } from 'vite';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { parseArgs } from 'node:util';

const { values } = parseArgs({ options: { 'playwright-path': { type: 'string' }, base: { type: 'string' } } });
const { chromium, webkit } = await import(values['playwright-path'] ? pathToFileURL(values['playwright-path']).href : 'playwright');
const directory = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(directory, '../..');
const output = path.join(root, 'build/social-qa');
const manifest = JSON.parse(await readFile(path.join(directory, 'site/manifest.json'), 'utf8'));
await mkdir(output, { recursive: true });
let server;
try {
  if (!values.base) {
    await cp(path.join(directory, 'site'), path.join(root, 'dist/premiera'), { recursive: true });
    server = await preview({ base: '/chmurnik/', preview: { host: '127.0.0.1', port: 4179 } });
  }
  const base = values.base || `http://127.0.0.1:${server.httpServer.address().port}/chmurnik/premiera/`;
  for (const [engineName, engine] of [['chromium', chromium], ['webkit', webkit]]) {
    const browser = await engine.launch({ headless: true });
    try {
      const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, locale: 'pl-PL', reducedMotion: 'reduce', isMobile: true, hasTouch: true });
      const page = await context.newPage();
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      await page.goto(base, { waitUntil: 'networkidle' });
      await page.locator('#story-grid .asset').first().waitFor();
      assert.equal(await page.locator('#story-grid .asset').count(), 5);
      assert.equal(await page.locator('#post-grid .asset').count(), 2);
      assert.equal(await page.locator('#after-dsa').count(), 0);
      assert.equal(await page.locator('#store-link').inputValue(), manifest.storeUrl);
      assert.equal(await page.locator('.sticker-tools').count(), 5);
      await page.evaluate(() => document.fonts.ready);
      for (const width of [320, 390, 1440]) {
        await page.setViewportSize({ width, height: 920 });
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth), false, `${engineName} ${width}: horizontal overflow`);
        await page.screenshot({ path: path.join(output, `${engineName}-${width}.png`) });
      }
      for (const item of manifest.artworks) {
        const response = await context.request.get(new URL(item.file, base).href);
        assert.equal(response.status(), 200);
        assert.match(response.headers()['content-type'], /image\/jpeg/);
        assert.equal(createHash('sha256').update(await response.body()).digest('hex'), item.sha256);
      }
      await page.getByText('Instagram / Facebook', { exact: true }).click();
      const textarea = page.getByRole('textbox', { name: 'Tekst: Instagram / Facebook', exact: true });
      assert.equal(await textarea.inputValue(), manifest.captions.find(item => item.id === 'instagram').text);
      await page.evaluate(() => Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async () => { throw new Error('Clipboard not permitted'); } } }));
      await page.locator('#caption-list').getByRole('button', { name: 'Kopiuj tekst' }).first().click();
      assert.ok(await textarea.evaluate(node => node.selectionEnd === node.value.length && node.selectionStart === 0));
      assert.match(await page.locator('#notice').innerText(), /Zaznaczyłem tekst/);
      await page.locator('#copy-store-link').click();
      assert.ok(await page.locator('#store-link').evaluate(node => node.selectionStart === 0 && node.selectionEnd === node.value.length));
      await page.evaluate(() => Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async text => { window.copiedText = text; } } }));
      for (const [index, item] of manifest.artworks.filter(item => item.format === 'story').entries()) {
        const card = page.locator('#story-grid .asset').nth(index);
        assert.equal(await card.locator('.sticker-tools input').inputValue(), manifest.storeUrl);
        assert.match(await card.locator('.sticker-tools p').innerText(), new RegExp(item.stickerLabel));
        await card.getByRole('button', { name: 'Kopiuj link do storki', exact: true }).click();
        assert.equal(await page.evaluate(() => window.copiedText), manifest.storeUrl);
      }
      for (const zip of ['chmurnik-storki-pl-2026-09-02.zip', 'chmurnik-polska-2026-09-02.zip']) {
        const response = await context.request.get(new URL(zip, base).href);
        assert.equal(response.status(), 200);
        const expected = await readFile(path.join(directory, 'site', zip));
        assert.ok((await response.body()).equals(expected), `${zip}: downloaded archive differs`);
      }
      const downloadPromise = page.waitForEvent('download');
      await page.getByRole('link', { name: 'Pobierz 5 storek · ZIP', exact: true }).click();
      const download = await downloadPromise;
      assert.equal(download.suggestedFilename(), 'chmurnik-storki-pl-2026-09-02.zip');
      await download.saveAs(path.join(output, `${engineName}-download.zip`));
      assert.equal(await download.failure(), null);
      assert.deepEqual(errors, []);
      await context.close();

      // This tests the share contract, not a physical iPhone's native sheet.
      const shareContext = await browser.newContext({ viewport: { width: 390, height: 844 } });
      await shareContext.addInitScript(() => {
        window.sharedFiles = [];
        Object.defineProperty(navigator, 'canShare', { value: data => data.files?.every(file => file.type === 'image/jpeg') });
        Object.defineProperty(navigator, 'share', { value: data => {
          window.sharedFiles = data.files.map(file => ({ name: file.name, size: file.size, type: file.type }));
          return Promise.resolve();
        } });
      });
      const sharePage = await shareContext.newPage();
      await sharePage.goto(base);
      const share = sharePage.locator('#story-grid .asset').first().getByRole('button', { name: 'Zapisz / udostępnij', exact: true });
      await sharePage.locator('#story-grid .asset').first().scrollIntoViewIfNeeded();
      await share.waitFor({ state: 'visible' });
      await share.click();
      const shared = await sharePage.evaluate(() => window.sharedFiles);
      assert.deepEqual(shared, [{ name: 'pl-story-01-mamy-to.jpg', size: manifest.artworks[0].bytes, type: 'image/jpeg' }]);
      await shareContext.close();
      console.log(`${engineName}: responsive layouts, 7 images, ZIP downloads, caption/link fallback, all 5 sticker links and simulated file-share contract PASS`);
    } finally {
      await browser.close();
    }
  }
} finally {
  await server?.close();
}
