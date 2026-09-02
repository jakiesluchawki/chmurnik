import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { copyFile, mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { parseArgs } from 'node:util';
import { createServer } from 'vite';

const { values } = parseArgs({ options: { 'playwright-path': { type: 'string' }, 'browser-path': { type: 'string' } } });
const { chromium } = await import(values['playwright-path'] ? pathToFileURL(values['playwright-path']).href : 'playwright');
const directory = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(directory, '../..');
const output = path.join(root, 'build/social-2026-09-03');
await mkdir(path.join(directory, 'captures'), { recursive: true });
await mkdir(path.join(output, 'frames'), { recursive: true });
const server = await createServer({
  server: { host: '127.0.0.1', port: 0 },
  define: { 'import.meta.env.VITE_QA_NATIVE_LAYOUT': '"1"', 'import.meta.env.VITE_QA_NO_ONBOARDING': '"1"' },
});
let browser;
try {
  await server.listen();
  browser = await chromium.launch({ headless: true, executablePath: values['browser-path'] });
  const page = await browser.newPage({ viewport: { width: 760, height: 1200 }, deviceScaleFactor: 2, locale: 'pl-PL', reducedMotion: 'reduce' });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  const base = `http://127.0.0.1:${server.httpServer.address().port}/`;
  const demos = [];
  for (const [id, route, selector] of [
    ['wind', 'practice/wind', '.field-wind-layout'],
    ['windy', 'practice/maps', '.field-map-grid'],
  ]) {
    await page.goto(`${base}#/${route}`);
    await page.locator(selector).waitFor();
    await page.evaluate(async () => { for (const font of document.fonts) await font.load(); await document.fonts.ready; });
    const frames = [];
    const capture = async (holdFrames = 6) => {
      const file = path.join(output, 'frames', `${id}-${String(frames.length).padStart(3, '0')}.png`);
      await page.locator(selector).screenshot({ path: file });
      frames.push({ file, holdFrames });
    };
    await capture(60);
    const poster = path.join(directory, 'captures', `${id}.png`);
    await copyFile(frames[0].file, poster);
    if (id === 'wind') {
      const boat = page.getByRole('slider', { name: /Prędkość jachtu/ });
      await boat.focus();
      for (let step = 0; step < 10; step++) { await boat.press('ArrowRight'); await capture(); }
      await capture(45);
      const heading = page.getByRole('slider', { name: /Kierunek dziobu/ });
      await heading.focus();
      for (let step = 0; step < 18; step++) {
        for (let increment = 0; increment < 5; increment++) await heading.press('ArrowRight');
        await capture();
      }
      await capture(45);
      assert.match(await page.locator('.field-readouts').innerText(), /27/);
      assert.equal(await boat.inputValue(), '15');
      assert.equal(await heading.inputValue(), '90');
    } else {
      await page.getByRole('combobox', { name: /^Poziom/ }).selectOption('upper');
      await capture(75);
      assert.match(await page.locator('.field-map-readout').innerText(), /30/);
      await page.getByRole('combobox', { name: 'Model szkoleniowy' }).selectOption('B');
      await capture(75);
      assert.match(await page.locator('.field-map-readout').innerText(), /32/);
      await page.getByRole('slider', { name: /Horyzont prognozy/ }).press('ArrowRight');
      await capture(75);
      assert.match(await page.locator('.field-map-readout').innerText(), /39/);
      await page.getByRole('slider', { name: /Horyzont prognozy/ }).press('ArrowRight');
      await capture(75);
      assert.match(await page.locator('.field-map-readout').innerText(), /45/);
      assert.match(await page.locator('.field-map-workbench').innerText(), /fikcyjne dane/i);
    }
    const bytes = await readFile(poster);
    demos.push({ id, route, selector, fps: 30, duration: frames.reduce((sum, frame) => sum + frame.holdFrames, 0) / 30, frames, poster: path.relative(root, poster), posterSHA256: createHash('sha256').update(bytes).digest('hex') });
    console.log(`${id}: ${frames.length} genuine UI captures, ${demos.at(-1).duration}s, controls and readouts verified`);
  }
  assert.deepEqual(errors, []);
  await writeFile(path.join(output, 'demos.json'), JSON.stringify({ demos }, null, 2) + '\n');
  await writeFile(path.join(directory, 'captures/provenance.json'), JSON.stringify({
    capturedOn: '2026-09-02', viewport: { width: 760, height: 1200, scale: 2 },
    method: 'Genuine React application components, native-layout presentation, isolated browser. Real controls exercised; no altered readouts, weather injection, image-model fixtures, or personal data. Educational scenarios are synthetic. This is not a physical iPhone recording.',
    captures: demos.map(({ frames, ...demo }) => demo),
  }, null, 2) + '\n');
} finally {
  await browser?.close();
  await server.close();
}
