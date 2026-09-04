import assert from 'node:assert/strict';
import { open, readFile } from 'node:fs/promises';
import { crc32 } from 'node:zlib';
import path from 'node:path';

// Store already-compressed PNG/PDF bytes with fixed headers, independent of
// checkout timestamps and host zip versions. Large downloads are rebuilt in CI.
export async function writeDownloadZip(root, target, entries) {
  assert(entries.length < 65535 && new Set(entries).size === entries.length);
  const output = await open(target, 'w');
  const directory = [];
  let offset = 0;
  const date = ((2026 - 1980) << 9) | (9 << 5) | 4;
  try {
    for (const entry of entries) {
      assert(/^[\x20-\x7e]+$/.test(entry) && !entry.includes('\\'));
      assert(!path.isAbsolute(entry) && !entry.split('/').includes('..'));
      const source = path.resolve(root, entry);
      assert(source.startsWith(path.resolve(root) + path.sep));
      const name = Buffer.from(entry), bytes = await readFile(source);
      assert(name.length <= 65535 && bytes.length < 0xffffffff);
      const crc = crc32(bytes);
      const local = Buffer.alloc(30);
      local.writeUInt32LE(0x04034b50, 0); local.writeUInt16LE(20, 4);
      local.writeUInt16LE(date, 12); local.writeUInt32LE(crc, 14);
      local.writeUInt32LE(bytes.length, 18); local.writeUInt32LE(bytes.length, 22);
      local.writeUInt16LE(name.length, 26);
      const central = Buffer.alloc(46);
      central.writeUInt32LE(0x02014b50, 0); central.writeUInt16LE(0x0314, 4);
      central.writeUInt16LE(20, 6); central.writeUInt16LE(date, 14);
      central.writeUInt32LE(crc, 16); central.writeUInt32LE(bytes.length, 20);
      central.writeUInt32LE(bytes.length, 24); central.writeUInt16LE(name.length, 28);
      central.writeUInt32LE(0o100644 * 65536, 38); central.writeUInt32LE(offset, 42);
      await output.writeFile(local); await output.writeFile(name); await output.writeFile(bytes);
      directory.push(central, name);
      offset += local.length + name.length + bytes.length;
      assert(offset < 0xffffffff);
    }
    const centralBytes = Buffer.concat(directory);
    await output.writeFile(centralBytes);
    const end = Buffer.alloc(22);
    end.writeUInt32LE(0x06054b50, 0);
    end.writeUInt16LE(entries.length, 8); end.writeUInt16LE(entries.length, 10);
    end.writeUInt32LE(centralBytes.length, 12); end.writeUInt32LE(offset, 16);
    await output.writeFile(end);
  } finally { await output.close(); }
}
