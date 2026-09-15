import assert from 'node:assert/strict';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import sharp from 'sharp';
import { themes, title, copyStatus } from './copy.mjs';

const here = fileURLToPath(new URL('.', import.meta.url));
const root = resolve(here, '../..');
const site = resolve(here, 'site');
const qa = resolve(root, 'build/social-niebo-woda-qa');
const local = createRequire(resolve(root, '.local/social-export-tools/package.json'));
const fontkit = local('fontkit');
const { Resvg } = local('@resvg/resvg-js');
const PDFDocument = local('pdfkit');
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
assert.equal(copyStatus, 'owner-delegated-production');
assert.equal(themes.length, 2);
const fonts = Object.fromEntries(['Romie-Regular', 'Roobert-Regular', 'Roobert-Bold'].map(name => [name, fontkit.openSync(resolve(root, 'public/fonts', name + '.otf'))]));
const measure = (text, font, size) => fonts[font].layout(text).positions.reduce((sum, p) => sum + p.xAdvance, 0) * size / fonts[font].unitsPerEm;
const num = n => String(n).padStart(2, '0');
function wrap(text, font, size, width) {
  const lines = []; let line = '';
  for (const word of text.split(/\s+/)) {
    const next = line ? line + ' ' + word : word;
    if (line && measure(next, font, size) > width) { lines.push(line); line = word; }
    else line = next;
  }
  if (line) lines.push(line);
  assert(lines.every(s => measure(s, font, size) <= width + .1));
  assert.equal(lines.join(' '), text);
  return lines;
}
function textSvg(op) {
  const f = fonts[op.font], run = f.layout(op.text), scale = op.size / f.unitsPerEm;
  let x = op.x;
  return run.glyphs.map((glyph, i) => {
    const p = run.positions[i];
    const part = '<path fill="' + op.color + '" d="' + glyph.path.toSVG() + '" transform="translate(' + (x + p.xOffset * scale) + ' ' + (op.y + f.ascent * scale - p.yOffset * scale) + ') scale(' + scale + ' ' + -scale + ')"/>';
    x += p.xAdvance * scale; return part;
  }).join('');
}
const tx = (text, x, y, font, size, color) => ({ type: 'text', text, x, y, font, size, color });
const im = (bytes, x, y, width, height, radius = 0) => ({ type: 'image', bytes, x, y, width, height, radius });
function svgFor(c) {
  return '<svg xmlns="http://www.w3.org/2000/svg" width="' + c.width + '" height="' + c.height + '"><rect width="100%" height="100%" fill="' + c.background + '"/>' + c.ops.map((op, n) => {
    if (op.type === 'text') return textSvg(op);
    if (op.type === 'rect') return '<rect x="' + op.x + '" y="' + op.y + '" width="' + op.width + '" height="' + op.height + '" rx="' + op.radius + '" fill="' + op.color + '" fill-opacity="' + op.opacity + '"/>';
    if (op.type === 'line') return '<path d="M' + op.x + ' ' + op.y + 'h' + op.width + '" stroke="' + op.color + '" stroke-opacity=".35"/>';
    const clip = op.radius ? '<defs><clipPath id="c' + n + '"><rect x="' + op.x + '" y="' + op.y + '" width="' + op.width + '" height="' + op.height + '" rx="' + op.radius + '"/></clipPath></defs>' : '';
    return clip + '<image x="' + op.x + '" y="' + op.y + '" width="' + op.width + '" height="' + op.height + '" ' + (op.radius ? 'clip-path="url(#c' + n + ')" ' : '') + 'href="data:image/png;base64,' + op.bytes.toString('base64') + '"/>';
  }).join('') + '</svg>';
}
const artworks = [], documents = [], sourceArtwork = [], mosaics = [];
await mkdir(qa, { recursive: true });
await mkdir(resolve(site, 'assets/art'), { recursive: true });
const brand = await readFile(resolve(root, 'public/brand/chmurnik-wordmark.png'));
const brandMeta = await sharp(brand).metadata();
async function logo(color, width) {
  const colored = await sharp({ create: { width: brandMeta.width, height: brandMeta.height, channels: 4, background: color } }).composite([{ input: brand, blend: 'dest-in' }]).png().toBuffer();
  return sharp(colored).resize(width).png().toBuffer();
}
async function record(file, extra) {
  const bytes = await readFile(resolve(site, file)); return { ...extra, file, bytes: bytes.length, sha256: hash(bytes) };
}
async function exportComposition(c, file, extra) {
  await mkdir(resolve(site, file, '..'), { recursive: true });
  const bytes = Buffer.from(new Resvg(svgFor(c)).render().asPng());
  await writeFile(resolve(site, file), bytes);
  const preview = 'previews/' + file.replace(/\.png$/, '.jpg');
  await mkdir(resolve(site, preview, '..'), { recursive: true });
  await sharp(bytes).resize(432).jpeg({ quality: 90 }).toFile(resolve(site, preview));
  artworks.push(await record(file, { ...extra, width: c.width, height: c.height, preview }));
  return bytes;
}
async function pdfExport(compositions, theme) {
  const file = theme.id + '/CHMURNIK-' + theme.id.toUpperCase() + '-LINKEDIN.pdf';
  const pdf = new PDFDocument({ autoFirstPage: false, compress: true, info: { Title: theme.title, Author: 'Mieszko Mahboob', Subject: 'CHMURNIK: ' + theme.label } });
  const chunks = []; pdf.on('data', c => chunks.push(c));
  const done = new Promise((ok, fail) => { pdf.on('end', ok); pdf.on('error', fail); });
  for (const name of Object.keys(fonts)) pdf.registerFont(name, resolve(root, 'public/fonts', name + '.otf'));
  for (const c of compositions) {
    pdf.addPage({ size: [c.width, c.height], margin: 0 }); pdf.rect(0, 0, c.width, c.height).fill(c.background);
    for (const op of c.ops) {
      if (op.type === 'text') pdf.fillColor(op.color).font(op.font).fontSize(op.size).text(op.text, op.x, op.y, { lineBreak: false, features: ['kern', 'liga'] });
      else if (op.type === 'line') pdf.save().strokeOpacity(.35).strokeColor(op.color).lineWidth(1).moveTo(op.x, op.y).lineTo(op.x + op.width, op.y).stroke().restore();
      else { pdf.save(); if (op.radius) pdf.roundedRect(op.x, op.y, op.width, op.height, op.radius).clip(); pdf.image(op.bytes, op.x, op.y, { width: op.width, height: op.height }); pdf.restore(); }
    }
    pdf.link(72, 1330, 940, 65, theme.link);
  }
  pdf.end(); await done; await writeFile(resolve(site, file), Buffer.concat(chunks));
  documents.push(await record(file, { theme: theme.id, pages: 10, width: 1080, height: 1440, title: theme.title, selectableText: true, link: theme.link }));
}
for (const theme of themes) {
  assert.equal(theme.stories.length, 10); assert.equal(theme.parts.length, 3);
  const artBytes = {};
  for (const id of new Set(theme.art)) {
    const bytes = await readFile(resolve(here, 'art', id + '.png'));
    const meta = await sharp(bytes).metadata(); assert(meta.width >= 1024 && meta.height >= 768, id);
    artBytes[id] = bytes;
    sourceArtwork.push({ id, file: 'art/' + id + '.png', width: meta.width, height: meta.height, sha256: hash(bytes), type: 'generated-editorial-illustration' });
    await sharp(bytes).resize(1200, 800, { fit: 'inside', withoutEnlargement: true }).webp({ quality: 90 }).toFile(resolve(site, 'assets/art', id + '.webp'));
  }
  const compositions = [];
  for (let i = 0; i < theme.stories.length; i++) {
    const story = theme.stories[i];
    for (const format of ['stories', 'karuzela', ...(i === 0 ? ['facebook'] : [])]) {
      const tall = format === 'stories', width = 1080, height = tall ? 1920 : 1440;
      const light = i % 3 === 1 || (theme.id === 'woda' && i === 5);
      const [background, ink, accent] = light ? ['#fff7ed', '#665f30', '#743cdd'] : theme.palette;
      const margin = 72, cw = 936;
      const size = tall ? 41 : 33, leading = tall ? 54 : 44;
      const bodyLines = wrap(story.text, 'Roobert-Regular', size, cw);
      const bodyBottom = tall ? 1570 : 1295;
      const bodyTop = bodyBottom - bodyLines.length * leading;
      const hs = tall ? 86 : 72, hl = tall ? 92 : 78, ht = tall ? 316 : 173;
      const headlineLines = wrap(story.title, 'Romie-Regular', hs, cw);
      const artY = ht + headlineLines.length * hl + 32;
      const artH = Math.floor(bodyTop - artY - 40);
      assert(artH >= (tall ? 350 : 285), format + ' ' + theme.id + ' ' + i + ': ' + artH);
      const detail = (theme.id === 'chmury' && i === 5) ? [.4, 0, .6, .78] : (i === 9 ? [.12, .20, .78, .78] : null);
      const original = artBytes[theme.art[i]];
      const meta = await sharp(original).metadata();
      const extracted = detail ? await sharp(original).extract({ left: Math.floor(meta.width * detail[0]), top: Math.floor(meta.height * detail[1]), width: Math.floor(meta.width * detail[2]), height: Math.floor(meta.height * detail[3]) }).png().toBuffer() : original;
      const bytes = await sharp(extracted).resize(cw, artH, { fit: 'cover', position: i % 2 === 0 ? 'centre' : 'attention' }).png().toBuffer();
      const lw = tall ? 342 : 290, lh = Math.round(lw * brandMeta.height / brandMeta.width);
      const ops = [im(await logo(ink, lw), margin, tall ? 192 : 62, lw, lh), tx(num(i + 1) + ' / 10', 918, tall ? 208 : 75, 'Roobert-Regular', tall ? 25 : 22, ink), tx(theme.label, margin, tall ? 272 : 138, 'Roobert-Bold', tall ? 22 : 19, accent)];
      headlineLines.forEach((s, n) => ops.push(tx(s, margin, ht + n * hl, 'Romie-Regular', hs, ink)));
      ops.push(im(bytes, margin, artY, cw, artH, 26));
      bodyLines.forEach((s, n) => ops.push(tx(s, margin, bodyTop + n * leading, 'Roobert-Regular', size, ink)));
      ops.push({ type: 'line', x: margin, y: tall ? 1608 : 1326, width: cw, color: accent });
      ops.push(tx('chmurnik.cloud', margin, tall ? 1634 : 1348, 'Roobert-Bold', tall ? 30 : 26, ink));
      const foot = 'Odkryj w pracowni';
      ops.push(tx(foot, 1008 - measure(foot, 'Roobert-Regular', tall ? 25 : 22), tall ? 1638 : 1352, 'Roobert-Regular', tall ? 25 : 22, ink));
      const c = { width, height, background, ops };
      await exportComposition(c, theme.id + '/' + format + '/' + num(i + 1) + '.png', { theme: theme.id, format, number: i + 1, title: story.title, text: story.text, alt: 'Stylizowana ilustracja edukacyjna, nie fotografia obserwacyjna. ' + story.title + ' ' + story.text, layout: { headlineLines, bodyLines, bodyFontSize: size, artY, artH, bodyTop, bodyBottom, safe: { top: tall ? 180 : 60, bottom: tall ? 1680 : 1390, left: 72, right: 1008 } } });
      if (format === 'karuzela') compositions.push(c);
    }
  }
  await pdfExport(compositions, theme);

  // Crop all covers from ONE composed canvas; shared pixels cannot drift.
  const masterWidth = 3240, masterHeight = 1440;
  const panoId = theme.id === 'chmury' ? 'chmury-panorama' : 'woda-panorama';
  const pano = await sharp(artBytes[panoId]).resize(masterWidth, masterHeight, { fit: 'cover' }).png().toBuffer();
  const panoOps = [im(pano, 0, 0, masterWidth, masterHeight)];
  const coverInk = '#514a28';
  for (let x = 0; x < 3; x++) {
    const origin = x * 1080;
    const lines = wrap(theme.coverTitles[x], 'Romie-Regular', 79, 904);
    panoOps.push(im(await logo(coverInk, 272), origin + 88, 78, 272, Math.round(272 * brandMeta.height / brandMeta.width)));
    panoOps.push(tx(theme.label, origin + 88, 176, 'Roobert-Bold', 22, coverInk));
    lines.forEach((s, n) => panoOps.push(tx(s, origin + 88, 224 + n * 87, 'Romie-Regular', 79, coverInk)));
    panoOps.push({ type: 'rect', x: origin + 64, y: 1205, width: 600, height: 195, radius: 22, color: '#fff7ed', opacity: .96 });
    panoOps.push(tx('CZĘŚĆ ' + (x + 1) + ' / 3', origin + 88, 1230, 'Roobert-Bold', 24, coverInk));
    panoOps.push(tx('Przesuń, żeby czytać', origin + 88, 1278, 'Roobert-Regular', 28, coverInk));
    panoOps.push(tx('chmurnik.cloud', origin + 88, 1340, 'Roobert-Bold', 27, coverInk));
  }
  const canvas = Buffer.from(new Resvg(svgFor({ width: masterWidth, height: masterHeight, background: '#ffe2ec', ops: panoOps })).render().asPng());
  const masterFile = theme.id + '/siatka/panorama-3240x1440.png';
  await mkdir(resolve(site, theme.id, 'siatka'), { recursive: true });
  await writeFile(resolve(site, masterFile), canvas);
  const tiles = [];
  for (let x = 0; x < 3; x++) {
    const order = 3 - x;
    const part = theme.parts[x];
    const coverFile = theme.id + '/instagram/0' + order + '-post/00-okladka.png';
    await mkdir(resolve(site, theme.id, 'instagram', '0' + order + '-post'), { recursive: true });
    const cover = await sharp(canvas).extract({ left: x * 1080, top: 0, width: 1080, height: 1440 }).png().toBuffer();
    await writeFile(resolve(site, coverFile), cover);
    const preview = 'previews/' + theme.id + '/okladka-' + order + '.jpg';
    await mkdir(resolve(site, preview, '..'), { recursive: true });
    await sharp(cover).resize(432).jpeg({ quality: 92 }).toFile(resolve(site, preview));
    tiles.push({ input: cover, left: x * 1080, top: 0 });
    artworks.push(await record(coverFile, { theme: theme.id, format: 'okladka', part: x + 1, publicationOrder: order, gridColumn: x + 1, width: 1080, height: 1440, preview, title: part.title, alt: 'Fragment ' + (x + 1) + ' jednej ciągłej panoramy. ' + theme.coverTitles[x] }));
    for (let j = 0; j < part.numbers.length; j++) {
      const src = await readFile(resolve(site, theme.id, 'karuzela', num(part.numbers[j]) + '.png'));
      await writeFile(resolve(site, theme.id, 'instagram', '0' + order + '-post', num(j + 1) + '-slajd-' + num(part.numbers[j]) + '.png'), src);
    }
  }
  const rejoined = await sharp({ create: { width: masterWidth, height: masterHeight, channels: 4, background: '#ffffff' } }).composite(tiles).raw().toBuffer();
  const original = await sharp(canvas).ensureAlpha().raw().toBuffer();
  assert.equal(hash(rejoined), hash(original), 'Panorama reconstruction must be pixel-identical');
  const gridPreview = theme.id + '/siatka/podglad.jpg';
  await sharp(canvas).resize(1296).jpeg({ quality: 92 }).toFile(resolve(site, gridPreview));
  mosaics.push(await record(masterFile, { theme: theme.id, width: masterWidth, height: masterHeight, preview: gridPreview, gridRatio: '3:4', pieces: 3, pixelIdenticalReconstruction: true, nativeArtworkDimensions: sourceArtwork.find(a => a.id === panoId), note: 'Composed panorama export is enlarged from the native artwork; Instagram account cropping remains unverified.' }));
  const contactTiles = [];
  for (const a of artworks.filter(a => a.theme === theme.id && a.format === 'stories')) contactTiles.push(await sharp(resolve(site, a.file)).resize(216).toBuffer());
  await sharp({ create: { width: 1120, height: 804, channels: 3, background: '#d9d0c5' } }).composite(contactTiles.map((input, i) => ({ input, left: 8 + i % 5 * 224, top: 8 + Math.floor(i / 5) * 394 }))).png().toFile(resolve(qa, theme.id + '-stories.png'));
}
const gridTiles = [];
for (const [row, theme] of themes.slice().reverse().entries()) {
  const covers = artworks.filter(a => a.theme === theme.id && a.format === 'okladka').sort((a, b) => a.gridColumn - b.gridColumn);
  for (const [column, cover] of covers.entries()) gridTiles.push({ input: await sharp(resolve(site, cover.file)).resize(426, 568).toBuffer(), left: column * 435, top: row * 577 });
}
await sharp({ create: { width: 1296, height: 1145, channels: 3, background: '#fff7ed' } }).composite(gridTiles).jpeg({ quality: 92 }).toFile(resolve(site, 'siatka-6-postow.jpg'));
await writeFile(resolve(site, 'exports-manifest.json'), JSON.stringify({ date: '2026-09-15', title, copyStatus, copyHash: hash(JSON.stringify(themes)), sourceArtwork, artworks, documents, mosaics, method: 'Built-in ImageGen art; deterministic Romie/Roobert glyph paths; two triptychs cut from single shared canvases; selectable PDF text.' }, null, 2) + '\n');
console.log('Exported 20 Stories, 20 standalone carousel slides, 6 mosaic covers, 2 Facebook images, 2 ten-page PDFs and exact panorama previews.');
