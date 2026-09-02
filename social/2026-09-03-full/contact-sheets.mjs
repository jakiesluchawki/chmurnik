import { mkdir, readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const campaign = path.dirname(fileURLToPath(import.meta.url));
const output = path.resolve(campaign, '../../build/social-full');
const manifest = JSON.parse(await readFile(path.join(campaign, 'site/manifest.json'), 'utf8'));
await mkdir(path.join(output, 'sheets'), { recursive: true });

async function contactSheets(name, files, width, height, columns = 5) {
  for (let offset = 0; offset < files.length; offset += columns) {
    const batch = files.slice(offset, offset + columns);
    const layers = [];
    for (const [index, file] of batch.entries()) {
      layers.push({ input: await sharp(file).resize(width, height, { fit: 'contain', background: '#eee9e5' }).png().toBuffer(), left: index * (width + 12), top: 0 });
    }
    const target = path.join(output, 'sheets', `${name}-${offset + 1}.png`);
    await sharp({ create: { width: columns * (width + 12) - 12, height, channels: 3, background: '#eee9e5' } }).composite(layers).png().toFile(target);
    console.log(target);
  }
}

for (const format of ['story', 'carousel', 'facebook']) {
  await contactSheets(format, manifest.artworks.filter(item => item.format === format).map(item => path.join(campaign, 'site', item.file)), 360, format === 'story' ? 640 : 450);
}
const pdfPages = (await readdir(path.join(output, 'pdf'))).filter(file => /^page-\d+\.png$/.test(file)).sort();
await contactSheets('pdf', pdfPages.map(file => path.join(output, 'pdf', file)), 432, 540);
for (const item of manifest.artworks.filter(item => item.video?.kind === 'walkthrough')) {
  await contactSheets(`video-${item.id}`, [0, 1, 2].map(index => path.join(output, 'qa', `${item.id}-frame-${index}.png`)), 432, 768, 3);
}
