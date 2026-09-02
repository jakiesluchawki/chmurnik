import assert from 'node:assert/strict';
import { parseArgs } from 'node:util';
import { pathToFileURL } from 'node:url';
import { createServer } from 'vite';
import sharp from 'sharp';

const { values } = parseArgs({ options: {
  'playwright-path': { type: 'string' },
  'browser-path': { type: 'string' },
} });
const { chromium } = await import(values['playwright-path'] ? pathToFileURL(values['playwright-path']).href : 'playwright');
const server = await createServer({ server: { host: '127.0.0.1', port: 0 } });
let browser;
try {
  await server.listen();
  browser = await chromium.launch({ headless: true, executablePath: values['browser-path'] });
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(`http://127.0.0.1:${server.httpServer.address().port}/design/web-share-20260903.html`);
  const bounds = await page.evaluate(async () => {
    await Promise.all([...document.fonts].map(font => font.load()));
    await document.fonts.ready;
    await Promise.all([...document.images].map(image => image.decode()));
    return [...document.querySelectorAll('[data-safe]')].map(node => ({
      text: node.textContent,
      rect: node.getBoundingClientRect().toJSON(),
      overflow: node.scrollWidth > node.clientWidth + 1,
    }));
  });
  for (const { text, rect, overflow } of bounds) {
    assert.equal(overflow, false, text);
    assert.ok(rect.x >= 50 && rect.x + rect.width <= 1150, text);
    assert.ok(rect.y >= 50 && rect.y + rect.height <= 580, text);
  }
  assert.deepEqual(errors, []);
  const file = 'public/brand/chmurnik-share-20260903.jpg';
  await page.screenshot({ path: file, type: 'jpeg', quality: 94 });
  const metadata = await sharp(file).metadata();
  assert.equal(metadata.width, 1200);
  assert.equal(metadata.height, 630);
  console.log(`${file}: 1200x630; original fonts and artwork; copy safe zones pass.`);
} finally {
  await browser?.close();
  await server.close();
}
