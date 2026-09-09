import assert from 'node:assert/strict';
import { readFile, writeFile, mkdir, access } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import sharp from 'sharp';
import { stories, posts, title, copyStatus, workshopUrl, webUrl } from './copy.mjs';

const here = fileURLToPath(new URL('.', import.meta.url));
const root = resolve(here, '../..');
const site = resolve(here, 'site');
const local = createRequire(resolve(root, '.local/social-export-tools/package.json'));
const fontkit = local('fontkit');
const { Resvg } = local('@resvg/resvg-js');
const PDFDocument = local('pdfkit');
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const copyHash = hash(JSON.stringify({ stories, posts }));
assert.equal(copyStatus, 'approved', 'Final visual production requires approved copy');
const fonts = Object.fromEntries(['Romie-Regular', 'Roobert-Regular', 'Roobert-Bold'].map(name => [name, fontkit.openSync(resolve(root, 'public/fonts', `${name}.otf`))]));
const artIds = ['01-nebo', '02-chmura', '03-zatoka', '04-fala', '05-depesza', '06-sondaz', '07-front', '08-proba', '09-sciezki', '10-pytanie'];
const alts = [
  'Otwarte okno prowadzi do miniaturowego krajobrazu i chmur w świetle poranka.',
  'Unosząca się porcja powietrza nad wzgórzem przechodzi w chmurę.',
  'Zatoka o zmierzchu, księżyc i niska mgła nad brzegiem.',
  'Chmura falowa nad grzbietem górskim i pasma przepływającego powietrza.',
  'Papier depeszy, chmury na różnych poziomach i mały rękaw wiatrowy.',
  'Balon meteorologiczny, radiosonda i dwie linie profilu atmosfery.',
  'Chłodne powietrze wsuwa się pod ciepłe i unosi je w stronę rozbudowanej chmury.',
  'Dwie miniaturowe pracownie z różnymi chmurami zachęcają do porównania przypadków.',
  'Ścieżka łączy otwartą książkę, chmurę, wiatr i warstwy krajobrazu.',
  'Otwarte fioletowe drzwi na nadmorskim wzgórzu prowadzą wzrok ku niebu.',
];
const themes = [
  ['#ffe2ec', '#665f30', '#743cdd'], ['#fff7ed', '#665f30', '#743cdd'],
  ['#193f48', '#fff7ed', '#d4c5fa'], ['#e9e4d6', '#55562f', '#743cdd'],
  ['#eee5fb', '#5d5334', '#743cdd'], ['#ffe2ec', '#665f30', '#743cdd'],
  ['#292d48', '#fff7ed', '#dbc6f8'], ['#fff7ed', '#665f30', '#743cdd'],
  ['#e8e6d8', '#575630', '#743cdd'], ['#743cdd', '#fff7ed', '#ffe2ec'],
];
const measure = (text, font, size) => fonts[font].layout(text).positions.reduce((sum, p) => sum + p.xAdvance, 0) * size / fonts[font].unitsPerEm;
function wrap(text, font, size, width) {
  const lines = [];
  let line = '';
  for (const word of text.split(/\s+/)) {
    const next = line ? `${line} ${word}` : word;
    if (line && measure(next, font, size) > width) { lines.push(line); line = word; }
    else line = next;
  }
  if (line) lines.push(line);
  assert(lines.every(s => measure(s, font, size) <= width + 0.1));
  return lines;
}
function textSvg(op) {
  const f = fonts[op.font];
  const run = f.layout(op.text);
  const scale = op.size / f.unitsPerEm;
  let x = op.x;
  return run.glyphs.map((glyph, i) => {
    const p = run.positions[i];
    const part = `<path fill="${op.color}" d="${glyph.path.toSVG()}" transform="translate(${x + p.xOffset * scale} ${op.y + f.ascent * scale - p.yOffset * scale}) scale(${scale} ${-scale})"/>`;
    x += p.xAdvance * scale;
    return part;
  }).join('');
}
const num = i => String(i + 1).padStart(2, '0');
async function record(file, extra) {
  const bytes = await readFile(resolve(site, file));
  return { ...extra, file, bytes: bytes.length, sha256: hash(bytes) };
}
await mkdir(resolve(root, 'build/social-pracownie-qa'), { recursive: true });
for (const dir of ['stories', 'karuzela', 'facebook', 'previews/stories', 'previews/karuzela', 'assets/art']) await mkdir(resolve(site, dir), { recursive: true });
const brand = await readFile(resolve(root, 'public/brand/chmurnik-wordmark.png'));
const brandMeta = await sharp(brand).metadata();
const compositions = [];
const artworks = [];
const sourceArtwork = [];
for (let i = 0; i < stories.length; i++) {
  const artPath = resolve(here, 'art', `${artIds[i]}.png`);
  await access(artPath);
  const bytes = await readFile(artPath);
  const meta = await sharp(bytes).metadata();
  assert(meta.width >= 1024 && meta.height >= 768, `Artwork too small: ${artIds[i]}`);
  sourceArtwork.push({ id: artIds[i], file: `art/${artIds[i]}.png`, width: meta.width, height: meta.height, sha256: hash(bytes), type: 'generated-editorial-illustration', alt: alts[i] });
  await sharp(bytes).resize(1200, 800, { fit: 'inside', withoutEnlargement: true }).webp({ quality: 88 }).toFile(resolve(site, 'assets/art', `${artIds[i]}.webp`));
  for (const format of ['stories', 'karuzela', ...(i === 0 ? ['facebook'] : [])]) {
    const story = stories[i];
    const tall = format === 'stories';
    const width = 1080, height = tall ? 1920 : 1350;
    const [background, ink, accent] = themes[i];
    const margin = 72, contentWidth = width - 2 * margin;
    const size = tall ? 41 : 32;
    const leading = tall ? 54 : 42;
    const bodyLines = wrap(story.text, 'Roobert-Regular', size, contentWidth);
    const bodyBottom = tall ? 1570 : 1217;
    const bodyTop = bodyBottom - bodyLines.length * leading;
    const headlineSize = tall ? 90 : 75;
    const headlineLeading = tall ? 96 : 78;
    const headlineTop = tall ? 321 : 177;
    const headlineLines = wrap(story.title, 'Romie-Regular', headlineSize, contentWidth);
    const headlineBottom = headlineTop + headlineLines.length * headlineLeading;
    const artY = headlineBottom + (tall ? 36 : 28);
    const artH = bodyTop - artY - (tall ? 46 : 35);
    assert(artH >= (tall ? 390 : 285), `Too little room for artwork on ${format} ${i + 1}: ${artH}`);
    const art = await sharp(bytes).resize(contentWidth, Math.round(artH), { fit: 'cover', position: 'centre' }).png().toBuffer();
    const logoWidth = tall ? 350 : 292;
    const logoHeight = Math.round(logoWidth * brandMeta.height / brandMeta.width);
    const coloredLogo = await sharp({ create: { width: brandMeta.width, height: brandMeta.height, channels: 4, background: ink } }).composite([{ input: brand, blend: 'dest-in' }]).png().toBuffer();
    const logo = await sharp(coloredLogo).resize(logoWidth, logoHeight).png().toBuffer();
    const ops = [];
    const text = (value, x, y, font, fontSize, color) => ops.push({ type: 'text', text: value, x, y, font, size: fontSize, color });
    ops.push({ type: 'image', bytes: logo, x: margin, y: tall ? 195 : 66, width: logoWidth, height: logoHeight });
    text(`${num(i)} / 10`, width - 160, tall ? 210 : 76, 'Roobert-Regular', tall ? 25 : 22, ink);
    text('PRACOWNIE POGODY', margin, tall ? 274 : 140, 'Roobert-Bold', tall ? 22 : 18, accent);
    headlineLines.forEach((line, n) => text(line, margin, headlineTop + n * headlineLeading, 'Romie-Regular', headlineSize, ink));
    ops.push({ type: 'image', bytes: art, x: margin, y: artY, width: contentWidth, height: Math.round(artH), radius: 28 });
    bodyLines.forEach((line, n) => text(line, margin, bodyTop + n * leading, 'Roobert-Regular', size, ink));
    ops.push({ type: 'line', x: margin, y: tall ? 1606 : 1252, width: contentWidth, color: accent });
    text('chmurnik.cloud', margin, tall ? 1634 : 1270, 'Roobert-Bold', tall ? 30 : 25, ink);
    const footer = i === 9 ? 'Zacznij od ciekawości' : '14 pracowni + pełne lekcje';
    text(footer, width - margin - measure(footer, 'Roobert-Regular', tall ? 25 : 21), tall ? 1637 : 1273, 'Roobert-Regular', tall ? 25 : 21, ink);
    const content = ops.map((op, n) => {
      if (op.type === 'text') return textSvg(op);
      if (op.type === 'line') return `<path d="M${op.x} ${op.y}h${op.width}" stroke="${op.color}" stroke-opacity=".45"/>`;
      const clip = op.radius ? `<defs><clipPath id="clip${n}"><rect x="${op.x}" y="${op.y}" width="${op.width}" height="${op.height}" rx="${op.radius}"/></clipPath></defs>` : '';
      return `${clip}<image x="${op.x}" y="${op.y}" width="${op.width}" height="${op.height}" ${op.radius ? `clip-path="url(#clip${n})"` : ''} href="data:image/png;base64,${op.bytes.toString('base64')}"/>`;
    }).join('');
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><rect width="${width}" height="${height}" fill="${background}"/>${content}</svg>`;
    const file = `${format}/${format === 'facebook' ? 'chmurnik-pracownie-facebook' : `chmurnik-pracownie-${num(i)}`}.png`;
    const output = Buffer.from(new Resvg(svg).render().asPng());
    await writeFile(resolve(site, file), output);
    const preview = format === 'facebook' ? 'previews/facebook.jpg' : `previews/${format}/${num(i)}.jpg`;
    await sharp(output).resize(432).jpeg({ quality: 90 }).toFile(resolve(site, preview));
    const layout = { width, height, headlineTop, headlineBottom, artY, artH, bodyTop, bodyBottom, bodyLines, headlineLines, bodyFontSize: size, copy: story.text, headline: story.title, safe: { top: tall ? 180 : 60, bottom: tall ? 1680 : 1310, left: 72, right: 1008 } };
    assert.equal(bodyLines.join(' '), story.text);
    assert.equal(headlineLines.join(' '), story.title);
    artworks.push(await record(file, { format, number: i + 1, width, height, preview, title: story.title, text: story.text, alt: `Stylizowana ilustracja, nie fotografia obserwacyjna. ${alts[i]} ${story.title} ${story.text}`, layout }));
    if (format === 'karuzela') compositions.push({ width, height, background, ops });
    console.log(`Rendered ${file}; art ${Math.round(artH)}px, body ${bodyLines.length} lines at ${size}px`);
  }
}

const pdfFile = 'CHMURNIK-PRACOWNIE-LINKEDIN.pdf';
const pdf = new PDFDocument({ autoFirstPage: false, compress: true, info: { Title: title, Author: 'Mieszko Mahboob', Subject: 'CHMURNIK: 14 pracowni pogody i pełne lekcje' } });
const chunks = [];
pdf.on('data', chunk => chunks.push(chunk));
const done = new Promise((resolve, reject) => { pdf.on('end', resolve); pdf.on('error', reject); });
for (const name of Object.keys(fonts)) pdf.registerFont(name, resolve(root, 'public/fonts', `${name}.otf`));
for (const composition of compositions) {
  const { width, height, background, ops } = composition;
  pdf.addPage({ size: [width, height], margin: 0 });
  pdf.rect(0, 0, width, height).fill(background);
  for (const op of ops) {
    if (op.type === 'text') pdf.fillColor(op.color).font(op.font).fontSize(op.size).text(op.text, op.x, op.y, { lineBreak: false, features: ['kern', 'liga'] });
    else if (op.type === 'line') pdf.save().strokeOpacity(.45).strokeColor(op.color).lineWidth(1).moveTo(op.x, op.y).lineTo(op.x + op.width, op.y).stroke().restore();
    else { pdf.save(); if (op.radius) pdf.roundedRect(op.x, op.y, op.width, op.height, op.radius).clip(); pdf.image(op.bytes, op.x, op.y, { width: op.width, height: op.height }); pdf.restore(); }
  }
  pdf.link(72, 1265, 940, 55, workshopUrl);
}
pdf.end(); await done;
await writeFile(resolve(site, pdfFile), Buffer.concat(chunks));
const documents = [await record(pdfFile, { pages: 10, width: 1080, height: 1350, title, selectableText: true, link: workshopUrl })];
await writeFile(resolve(site, 'teksty/alt-teksty.txt'), artworks.filter(a => a.format === 'karuzela').map(a => `${num(a.number - 1)}\n${a.alt}\n`).join('\n'));
await writeFile(resolve(site, 'exports-manifest.json'), JSON.stringify({ approvedOn: '2026-09-09', generatedOn: new Date().toISOString(), copyHash, method: 'Native ImageGen illustrations; deterministic OTF typography and PNG/PDF exports', sourceArtwork, artworks, documents, webUrl, workshopUrl }, null, 2) + '\n');
for (const format of ['stories', 'karuzela']) {
  const tiles = [];
  for (const artwork of artworks.filter(a => a.format === format)) tiles.push(await sharp(resolve(site, artwork.file)).resize(216).toBuffer());
  const tileH = format === 'stories' ? 384 : 270;
  await sharp({ create: { width: 1120, height: (tileH + 12) * 2 + 12, channels: 3, background: '#d9d0c5' } }).composite(tiles.map((input, i) => ({ input, left: 12 + i % 5 * 222, top: 12 + Math.floor(i / 5) * (tileH + 12) }))).png().toFile(resolve(root, 'build/social-pracownie-qa', `${format}-contact-sheet.png`));
}
console.log('21 PNG and 10-page selectable-text PDF exported; complete approved copy retained.');
