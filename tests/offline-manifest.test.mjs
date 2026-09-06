import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import vm from "node:vm";
import { completeOfflineManifest } from "../vite.config.mjs";
import { clouds } from "../src/data/clouds.js";

const source = await readFile(new URL("../public/service-worker.js", import.meta.url), "utf8");
const hash = bytes => createHash("sha256").update(bytes).digest("hex");
async function fixture(t) {
  const dir = await mkdtemp(path.join(os.tmpdir(), "chmurnik-offline-manifest-"));
  t.after(() => rm(dir, { recursive: true, force: true }));
  await mkdir(path.join(dir, "assets/clouds"), { recursive: true });
  const expected = {};
  for (const image of clouds.flatMap(cloud => cloud.images)) {
    const file = image.src.replace(/^\//, "");
    const body = Buffer.from(`fixture:${file}`);
    await writeFile(path.join(dir, file), body);
    expected[path.basename(file)] = hash(body);
  }
  const build = async (worker = source) => {
    await writeFile(path.join(dir, "service-worker.js"), worker);
    await completeOfflineManifest().writeBundle({ dir }, { "assets/app-123.js": {}, "assets/app-456.css": {} });
    const text = await readFile(path.join(dir, "service-worker.js"), "utf8");
    const context = { URL, self: { location: { href: "https://example.test/chmurnik/service-worker.js" }, addEventListener() {} } };
    vm.runInNewContext(`${text}\nthis.result = {version: VERSION, hashes: ATLAS_HASHES, names: CLOUD_PHOTOS, runtime: RUNTIME_ASSETS};`, context);
    return JSON.parse(JSON.stringify(context.result));
  };
  return { dir, build, expected };
}

test("offline manifest binds every atlas photograph and runtime asset to the generated worker", async t => {
  const { build, expected } = await fixture(t);
  const result = await build();
  assert.deepEqual(result.hashes, expected);
  assert.deepEqual(result.names.toSorted(), Object.keys(expected).toSorted());
  assert.equal(result.names.length, 30);
  assert.deepEqual(result.runtime, ["assets/app-123.js", "assets/app-456.css"]);
  assert.match(result.version, /^chmurnik-[a-f0-9]{12}$/);
  assert.deepEqual(await build(), result, "Identical inputs produce an identical cache version");
});

test("changing only worker source or atlas bytes changes the cache version", async t => {
  const { dir, build } = await fixture(t);
  const before = await build();
  assert.notEqual((await build(`${source}\n// worker update`)).version, before.version);
  await writeFile(path.join(dir, "assets/clouds/cumulus.jpg"), "replacement fixture");
  const after = await build();
  assert.notEqual(after.version, before.version);
  assert.equal(after.hashes["cumulus.jpg"], hash("replacement fixture"));
  assert.equal(after.hashes["cirrus.jpg"], before.hashes["cirrus.jpg"]);
});

test("incomplete offline templates fail the build instead of disabling photo migration", async t => {
  const { build } = await fixture(t);
  await assert.rejects(build(source.replace("/* __CHMURNIK_ATLAS_HASHES__ */ {}", "{}")), /Missing offline build marker/);
});
