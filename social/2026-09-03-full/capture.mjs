import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { createServer as createHttpServer } from 'node:http';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { parseArgs } from 'node:util';
import { createServer } from 'vite';
import { stories } from './copy.mjs';
import { recordingHtml } from './artwork.mjs';
import { metarExamples } from '../../src/data/field-practice.js';

const { values } = parseArgs({ options: { 'playwright-path': { type: 'string' }, 'browser-path': { type: 'string' }, only: { type: 'string' }, probe: { type: 'boolean' } } });
const { chromium } = await import(values['playwright-path'] ? pathToFileURL(values['playwright-path']).href : 'playwright');
const directory = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(directory, '../..');
const output = path.join(root, 'build/social-full');
const captures = path.join(directory, 'captures');
await mkdir(output, { recursive: true });
await mkdir(captures, { recursive: true });
const css = await readFile(path.join(directory, 'artwork.css'), 'utf8');
const routes = { atlas: 'atlas', lesson: 'learn', reader: 'practice/metar', layers: 'layers', height: 'layers', wind: 'practice/wind' };
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
const vite = await createServer({ server: { host: '127.0.0.1', port: 0 }, define: { 'import.meta.env.VITE_QA_NATIVE_LAYOUT': '"1"', 'import.meta.env.VITE_QA_NO_ONBOARDING': '"1"' } });
await vite.listen();
const appBase = `http://127.0.0.1:${vite.httpServer.address().port}`;
const server = createHttpServer(async (request, response) => {
  try {
    const url = new URL(request.url, 'http://localhost');
    if (url.pathname === '/record') {
      const story = stories.find(item => item.demo === url.searchParams.get('demo'));
      assert.ok(story);
      response.setHeader('Content-Type', 'text/html; charset=utf-8');
      response.end(recordingHtml(story, css, `${appBase}/#/${routes[story.demo]}`));
      return;
    }
    const file = path.resolve(root, `.${decodeURIComponent(url.pathname)}`);
    assert.ok(file.startsWith(root + path.sep));
    const data = await readFile(file);
    response.setHeader('Content-Type', ({ '.png': 'image/png', '.jpg': 'image/jpeg', '.woff2': 'font/woff2' })[path.extname(file)] || 'application/octet-stream');
    response.end(data);
  } catch { response.writeHead(404); response.end('Not found'); }
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
let browser;
let allDemos = [];
try { allDemos = JSON.parse(await readFile(path.join(output, 'demos.json'), 'utf8')).demos; } catch {}
try {
  browser = await chromium.launch({ headless: true, executablePath: values['browser-path'] });
  for (const story of stories.filter(item => item.demo && (!values.only || values.only.split(',').includes(item.demo)))) {
    const context = await browser.newContext({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1, hasTouch: true, locale: 'pl-PL', reducedMotion: 'reduce' });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(`http://127.0.0.1:${server.address().port}/record?demo=${story.demo}`);
    const frame = page.frame({ name: 'app-demo' });
    assert.ok(frame);
    await frame.waitForSelector('main');
    for (const surface of [page, frame]) await surface.evaluate(async () => { for (const font of document.fonts) await font.load(); await document.fonts.ready; });
    const cdp = await context.newCDPSession(page);
    const events = [];
    let t0 = 0;
    const recordEvent = (type, detail) => events.push({ at: +(Math.max(0, performance.now() - t0) / 1000).toFixed(3), type, ...detail });
    const point = async (x, y, visible) => page.evaluate(({ x, y, visible }) => {
      const node = document.querySelector('.touch-indicator');
      node.style.left = `${x}px`; node.style.top = `${y}px`; node.style.opacity = visible ? '1' : '0';
    }, { x, y, visible });
    const gesture = async (from, to, milliseconds = 650) => {
      await point(from.x, from.y, true);
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: from.x, y: from.y }] });
      for (let index = 1; index <= 18; index++) {
        const fraction = index / 18;
        const x = from.x + (to.x - from.x) * fraction;
        const y = from.y + (to.y - from.y) * fraction;
        await point(x, y, true);
        await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x, y }] });
        await delay(milliseconds / 18);
      }
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
      await delay(150);
      await point(to.x, to.y, false);
      recordEvent('touch-drag', { from, to });
      await delay(280);
    };
    const swipe = async (direction = 'down', pixels = 455) => {
      // Stay in the viewport gutter so vertical swipes cannot move a range thumb.
      const x = 916;
      const fromY = direction === 'down' ? 1360 : 865;
      await gesture({ x, y: fromY }, { x, y: fromY + (direction === 'down' ? -pixels : pixels) });
    };
    const ensure = async (locator, { top = 770, bottom = 1375, max = 24 } = {}) => {
      await locator.waitFor({ state: 'attached' });
      for (let index = 0; index < max; index++) {
        const box = await locator.boundingBox();
        if (box && box.y >= top && box.y + Math.min(box.height, 230) <= bottom) {
          const center = box.x + box.width / 2;
          if (box.width <= 780 && (center < 190 || center > 890)) {
            const y = box.y + box.height / 2;
            await gesture({ x: center > 890 ? 845 : 230, y }, { x: center > 890 ? 230 : 845, y });
            continue;
          }
          return box;
        }
        const above = box && box.y < top;
        await swipe(above ? 'up' : 'down', Math.min(495, Math.max(130, Math.abs((box?.y ?? bottom + 400) - (top + 90)))));
      }
      throw new Error(`Could not reach ${await locator.textContent()} with genuine swipes`);
    };
    const tap = async locator => {
      const box = await ensure(locator);
      const label = (await locator.textContent()).trim().slice(0, 180);
      const x = box.x + box.width / 2;
      const y = box.y + box.height / 2;
      await point(x, y, true);
      await page.touchscreen.tap(x, y);
      await delay(320);
      await point(x, y, false);
      recordEvent('tap', { label, x, y });
      await delay(420);
    };
    const moveRange = async (locator, desired) => {
      const box = await ensure(locator);
      const range = await locator.evaluate(node => ({ min: Number(node.min), max: Number(node.max), value: Number(node.value) }));
      const inset = 17;
      const x = value => box.x + inset + (value - range.min) / (range.max - range.min) * (box.width - 2 * inset);
      await gesture({ x: x(range.value), y: box.y + box.height / 2 }, { x: x(desired), y: box.y + box.height / 2 }, 1150);
      const after = Number(await locator.inputValue());
      assert.notEqual(after, range.value, 'A touch drag must change the real application value');
      assert.ok(Math.abs(after - desired) <= 2, 'The real slider must reach the demonstrated target');
      recordEvent('range-result', { before: range.value, after, intended: desired });
    };
    const poster = async () => {
      await point(0, 0, false);
      await page.locator('iframe').screenshot({ path: path.join(captures, `${story.demo}-poster.png`) });
      recordEvent('poster', {});
    };
    const prepare = async locator => {
      await locator.evaluate(node => node.scrollIntoView({ block: 'start', behavior: 'instant' }));
      await delay(500);
    };

    if (story.demo === 'atlas') await prepare(frame.getByRole('heading', { name: 'Atlas chmur', exact: true }));
    if (story.demo === 'lesson') await prepare(frame.locator('.learning-card').first());
    if (story.demo === 'reader') await prepare(frame.locator('.field-report-guide'));
    if (story.demo === 'layers') await prepare(frame.locator('.decoder-layer-picker'));
    if (story.demo === 'height') await prepare(frame.locator('.layers-tabs'));
    if (story.demo === 'wind') await prepare(frame.getByRole('heading', { name: 'Wiatr na pokładzie', exact: true }));
    if (values.probe) {
      await page.screenshot({ path: path.join(output, `${story.demo}-probe.png`) });
      await writeFile(path.join(output, `${story.demo}-probe.txt`), await frame.locator('body').innerText());
      console.log(`${story.demo}: probe saved`);
      await context.close();
      continue;
    }

    const framesDirectory = path.join(output, 'frames', story.demo);
    await mkdir(framesDirectory, { recursive: true });
    const rawFrames = [];
    let writes = Promise.resolve();
    let accepting = true;
    const initialFile = path.join(framesDirectory, '00000.jpg');
    await page.screenshot({ path: initialFile, type: 'jpeg', quality: 94 });
    t0 = performance.now();
    rawFrames.push({ file: initialFile, milliseconds: 0 });
    const handler = event => {
      void cdp.send('Page.screencastFrameAck', { sessionId: event.sessionId }).catch(() => {});
      if (!accepting) return;
      const file = path.join(framesDirectory, `${String(rawFrames.length).padStart(5, '0')}.jpg`);
      rawFrames.push({ file, milliseconds: performance.now() - t0 });
      writes = writes.then(() => writeFile(file, Buffer.from(event.data, 'base64')));
    };
    cdp.on('Page.screencastFrame', handler);
    await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 92, maxWidth: 1080, maxHeight: 1920, everyNthFrame: 1 });
    const segment = async (index, action) => {
      const text = story.parts[index];
      await page.locator('.live-copy').evaluate((node, copy) => { node.textContent = copy; }, text);
      const bounds = await page.locator('.live-copy').evaluate(node => ({ height: node.scrollHeight, top: node.getBoundingClientRect().top, bottom: node.getBoundingClientRect().top + node.scrollHeight }));
      assert.ok(bounds.bottom < 653, `${story.demo}: caption would overlap the UI: ${bounds.bottom}`);
      const start = performance.now();
      recordEvent('copy', { index, text });
      await action();
      await delay(Math.max(950, text.split(/\s+/).length / 2.7 * 1000 + 800 - (performance.now() - start)));
    };
    try {
      if (story.demo === 'atlas') {
        await segment(0, async () => {
          await delay(1200);
          await tap(frame.locator('.cloud-card').first());
          await frame.getByRole('dialog', { name: 'Monografia Cirrus' }).waitFor();
          await delay(1300);
          await poster();
        });
        await segment(1, async () => {
          await ensure(frame.locator('.detail-lead'));
          await delay(1800);
          await swipe('down', 320);
        });
        await segment(2, async () => {
          await ensure(frame.getByRole('heading', { name: 'Na co patrzeć', exact: true }));
          await delay(1200);
        });
      } else if (story.demo === 'lesson') {
        await segment(0, async () => {
          await tap(frame.locator('.learning-card').first());
          await frame.locator('.lesson-page').waitFor();
          await ensure(frame.locator('.lesson-hero h1'));
        });
        await segment(1, async () => {
          await ensure(frame.locator('.lesson-chapter.is-active .lesson-chapter-body > p').first());
          await delay(1800);
          await ensure(frame.locator('.lesson-chapter.is-active .chapter-checkpoint h3'));
          await delay(1700);
          await tap(frame.locator('.lesson-chapter.is-active .chapter-checkpoint').getByRole('button', { name: 'Sprawdź odpowiedź', exact: true }));
        });
        await segment(2, async () => {
          await ensure(frame.locator('.lesson-chapter.is-active .chapter-checkpoint h3'));
          assert.equal(await frame.locator('.lesson-chapter.is-active .chapter-checkpoint button').getAttribute('aria-expanded'), 'true');
          await swipe('down', 200);
          await poster();
        });
      } else if (story.demo === 'reader') {
        await segment(0, async () => {
          await tap(frame.locator('.field-report-guide summary'));
          await ensure(frame.getByRole('heading', { name: 'Co zaobserwowano?', exact: true }));
          await delay(1800);
        });
        await segment(1, async () => {
          await tap(frame.locator('.field-report-guide summary'));
          await tap(frame.locator('#raw-metar'));
          await frame.locator('#raw-metar').fill(metarExamples[0].report);
          recordEvent('paste', { text: metarExamples[0].report, source: 'src/data/field-practice.js' });
          await delay(1000);
          await tap(frame.getByRole('button', { name: 'Rozczytaj raport' }));
        });
        await segment(2, async () => {
          await ensure(frame.locator('.field-metar-summary'));
          await delay(1900);
          await ensure(frame.locator('.field-metar-tokens'));
          await tap(frame.locator('.field-metar-tokens').getByRole('button', { name: '24015G25KT', exact: true }));
          await ensure(frame.locator('.field-token-detail'));
          await poster();
          assert.match(await frame.locator('.field-report-type').innerText(), /METAR · obserwacja/);
        });
      } else if (story.demo === 'layers') {
        await segment(0, async () => {
          await tap(frame.locator('.decoder-layer-picker').getByRole('button', { name: 'Podstawa', exact: true }));
          await ensure(frame.locator('.decoder-reader h2'));
          await delay(1600);
          await poster();
          await ensure(frame.locator('.decoder-definitions'));
          await delay(1600);
        });
        await segment(1, async () => {
          await ensure(frame.locator('.decoder-check h2'));
          await delay(1500);
          await tap(frame.locator('.decoder-check button').nth(1));
        });
        await segment(2, async () => {
          await ensure(frame.locator('.decoder-feedback'));
          assert.match(await frame.locator('.decoder-feedback').innerText(), /Dobrze|dobrze|Tak|tak/);
        });
      } else if (story.demo === 'height') {
        await segment(0, async () => {
          await tap(frame.locator('.layers-tabs').getByRole('button', { name: 'Wysokość', exact: true }));
          await ensure(frame.locator('.pressure-line'), { top: 960, bottom: 1190 });
          await delay(1800);
        });
        await segment(1, async () => {
          await moveRange(frame.getByRole('slider', { name: /Wysokość terenu/ }), 1000);
          await delay(1700);
          await ensure(frame.locator('.pressure-line'), { top: 960, bottom: 1190 });
          await poster();
        });
        await segment(2, async () => {
          assert.match(await frame.locator('.atmosphere-visual').innerText(), /850/);
          const pressure = await frame.locator('.pressure-line').boundingBox();
          const terrain = await frame.locator('.terrain-line').boundingBox();
          assert.ok(pressure.y > 850 && terrain.y < 1340, 'The actual pressure surface and ground must both be visible');
          await delay(2200);
        });
      } else if (story.demo === 'wind') {
        const initialWindFrom = Number(await frame.getByRole('slider', { name: /Wiatr przychodzi z/ }).inputValue());
        recordEvent('initial-state', { windFrom: initialWindFrom });
        await segment(0, async () => {
          await ensure(frame.locator('.field-wind-picture'));
          await delay(1600);
        });
        await segment(1, async () => {
          await ensure(frame.getByRole('slider', { name: /Kierunek dziobu/ }));
          await delay(1400);
        });
        await segment(2, async () => {
          await moveRange(frame.getByRole('slider', { name: /Prędkość jachtu/ }), 15);
          await moveRange(frame.getByRole('slider', { name: /Kierunek dziobu/ }), 135);
          await ensure(frame.locator('.field-readouts'));
          await delay(1600);
        });
        await segment(3, async () => {
          await ensure(frame.locator('.field-wind-picture'));
          await poster();
          const state = {
            windFrom: Number(await frame.getByRole('slider', { name: /Wiatr przychodzi z/ }).inputValue()),
            boatSpeed: Number(await frame.getByRole('slider', { name: /Prędkość jachtu/ }).inputValue()),
            heading: Number(await frame.getByRole('slider', { name: /Kierunek dziobu/ }).inputValue()),
            readouts: await frame.locator('.field-readouts').innerText(),
          };
          assert.equal(state.windFrom, initialWindFrom, 'Scrolling must not change the true wind');
          assert.ok(Math.abs(state.boatSpeed - 15) <= 1);
          assert.ok(Math.abs(state.heading - 135) <= 2, 'Keep the demonstrated heading in the final shot');
          recordEvent('final-state', state);
        });
      }
      await delay(1000);
      const duration = Math.ceil((performance.now() - t0) / 1000 * 30) / 30;
      await cdp.send('Page.stopScreencast');
      accepting = false;
      await writes;
      const frames = [];
      let cursor = 0;
      for (let index = 0; index < Math.round(duration * 30); index++) {
        while (cursor + 1 < rawFrames.length && rawFrames[cursor + 1].milliseconds <= index / 30 * 1000) cursor++;
        const file = rawFrames[cursor].file;
        if (frames.at(-1)?.file === file) frames.at(-1).holdFrames++;
        else frames.push({ file, holdFrames: 1 });
      }
      assert.deepEqual(errors, []);
      assert.deepEqual(events.filter(event => event.type === 'copy').map(event => event.text), story.parts);
      assert.ok(events.some(event => event.type === 'touch-drag'));
      const posterBytes = await readFile(path.join(captures, `${story.demo}-poster.png`));
      const demo = { id: story.demo, storyId: story.id, route: routes[story.demo], fps: 30, duration, frames, events, poster: `social/2026-09-03-full/captures/${story.demo}-poster.png`, posterSHA256: createHash('sha256').update(posterBytes).digest('hex') };
      allDemos = [...allDemos.filter(item => item.id !== demo.id), demo];
      await writeFile(path.join(output, 'demos.json'), JSON.stringify({ demos: allDemos }, null, 2) + '\n');
      await writeFile(path.join(captures, 'provenance.json'), JSON.stringify({
        capturedOn: '2026-09-02', viewport: { width: 390, height: 414, displayScale: 2 },
        method: 'Continuous isolated-browser screencast of genuine mobile React UI. Actual touch taps and swipes, actual form input and range changes. Native-layout presentation, not a physical iPhone recording. Touch indicator and approved narrative sit outside the unmodified application. No invented UI, edited readouts or personal data. METAR scenario is synthetic. Only a fragment of the unchanged first lesson is shown; no course completion is claimed.',
        captures: allDemos.map(({ frames, ...item }) => item),
      }, null, 2) + '\n');
      console.log(`${story.demo}: ${frames.length} continuous paint frames, ${duration.toFixed(2)}s; full approved copy, ${events.filter(event => event.type === 'tap').length} taps, ${events.filter(event => event.type === 'touch-drag').length} swipes/drags; real controls verified.`);
    } catch (error) {
      await page.screenshot({ path: path.join(output, `${story.demo}-error.png`) });
      await writeFile(path.join(output, `${story.demo}-error.txt`), await frame.locator('body').innerText());
      accepting = false;
      await cdp.send('Page.stopScreencast').catch(() => {});
      await writes;
      throw error;
    } finally { await context.close(); }
  }
} finally {
  await browser?.close();
  await new Promise(resolve => server.close(resolve));
  await vite.close();
}
