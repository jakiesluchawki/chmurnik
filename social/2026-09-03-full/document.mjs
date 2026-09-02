import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { createServer } from 'node:http';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { parseArgs } from 'node:util';
import { artworks } from './artwork.mjs';

const { values } = parseArgs({ options: { 'playwright-path': { type: 'string' }, 'browser-path': { type: 'string' } } });
const { chromium } = await import(values['playwright-path'] ? pathToFileURL(values['playwright-path']).href : 'playwright');
const directory = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(directory, '../..');
const site = path.join(directory, 'site');
const css = await readFile(path.join(directory, 'artwork.css'), 'utf8');
const pages = artworks.filter(item => item.format === 'carousel');
assert.equal(pages.length, 10);
const server = createServer(async (request, response) => {
  try {
    const url = new URL(request.url, 'http://localhost');
    if (url.pathname === '/document') {
      response.setHeader('Content-Type', 'text/html; charset=utf-8');
      response.end(`<!doctype html><html lang="pl"><head><meta charset="utf-8"><title>CHMURNIK: zaczęło się od kogoś bliskiego</title><style>${css}</style></head><body>${pages.map(item => `<article class="artwork carousel ${item.theme} ${item.id}">${item.content}</article>`).join('')}</body></html>`);
      return;
    }
    const file = path.resolve(root, `.${decodeURIComponent(url.pathname)}`);
    assert.ok(file.startsWith(root + path.sep));
    const bytes = await readFile(file);
    response.setHeader('Content-Type', ({ '.png': 'image/png', '.woff2': 'font/woff2' })[path.extname(file)] || 'application/octet-stream');
    response.end(bytes);
  } catch { response.writeHead(404); response.end('Not found'); }
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
let browser;
try {
  browser = await chromium.launch({ headless: true, executablePath: values['browser-path'] });
  const page = await browser.newPage({ viewport: { width: 1080, height: 1350 } });
  await page.goto(`http://127.0.0.1:${server.address().port}/document`);
  await page.evaluate(async () => {
    for (const font of document.fonts) await font.load();
    await document.fonts.ready;
    await Promise.all([...document.images].map(image => image.decode()));
  });
  assert.equal(await page.locator('.artwork').count(), 10);
  const file = 'chmurnik-historia-linkedin.pdf';
  await page.pdf({ path: path.join(site, file), printBackground: true, preferCSSPageSize: true, tagged: true, outline: true });
  const bytes = await readFile(path.join(site, file));
  assert.equal(bytes.subarray(0, 5).toString(), '%PDF-');
  const manifest = JSON.parse(await readFile(path.join(site, 'manifest.json'), 'utf8'));
  manifest.documents = [{ file, title: 'CHMURNIK: zaczęło się od kogoś bliskiego', platform: 'linkedin', pages: 10, mime: 'application/pdf', bytes: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex'), source: 'Ten complete carousel compositions, original embedded fonts, selectable Polish text and real screenshots. No animation is implied in the PDF.' }];
  await writeFile(path.join(site, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
  console.log(`LinkedIn PDF: ${pages.length} source pages, ${Math.round(bytes.length / 1024)} KB; original typography and text retained.`);
} finally {
  await browser?.close();
  await new Promise(resolve => server.close(resolve));
}
