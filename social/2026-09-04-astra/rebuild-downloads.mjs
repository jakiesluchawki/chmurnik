import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { writeDownloadZip } from './zip-downloads.mjs';

const site = fileURLToPath(new URL('./site/', import.meta.url));
export async function rebuildDownloads({ quiet = false } = {}) {
  const platform = JSON.parse(await readFile(path.join(site, 'platforms-manifest.json')));
  const bonus = JSON.parse(await readFile(path.join(site, 'wallpapers-manifest.json')));
  for (const archive of [platform.archives.find(a => a.file.includes('PELNY')), bonus.archive]) {
    const target = path.join(site, archive.file);
    await writeDownloadZip(site, target, archive.entries);
    const bytes = await readFile(target);
    assert.equal(bytes.length, archive.bytes, archive.file);
    assert.equal(createHash('sha256').update(bytes).digest('hex'), archive.sha256, archive.file);
    if (!quiet) console.log(`Rebuilt and verified: ${archive.file}`);
  }
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await rebuildDownloads();
