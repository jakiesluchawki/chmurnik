import test from "node:test";
import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { assertMatchingPublicBundles } from "../scripts/prepare-macos-qa.mjs";

function fixture(t) {
  const root = mkdtempSync(join(tmpdir(), "chmurnik-mac-qa-bundle-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const staged = join(root, "staged"), current = join(root, "current");
  const assets = {
    "index.html": "unchanged main document",
    "pogoda-preview/index.html": "workshop document",
    "pogoda-preview/assets/workshop.js": "export const version = 1;",
    "pogoda-preview/assets/workshop.css": "body { color: black; }",
    "pogoda-preview/photos/cloud.jpg": Buffer.from([0xff, 0x00, 0x80]),
    "pogoda-preview/assets/font.woff2": Buffer.from([0x00, 0x81, 0xff]),
    ".public-metadata": "included, not silently skipped",
  };
  for (const base of [staged, current]) for (const [file, bytes] of Object.entries(assets)) {
    mkdirSync(dirname(join(base, file)), { recursive: true });
    writeFileSync(join(base, file), bytes);
  }
  return { root, staged, current, assets };
}

test("Mac QA accepts byte-identical recursive public bundles without modifying them", t => {
  const { staged, current, assets } = fixture(t);
  assert.doesNotThrow(() => assertMatchingPublicBundles(staged, current));
  for (const base of [staged, current]) for (const [file, bytes] of Object.entries(assets)) {
    assert.deepEqual(readFileSync(join(base, file)), Buffer.from(bytes));
  }
});

for (const file of ["pogoda-preview/assets/workshop.js", "pogoda-preview/assets/workshop.css",
  "pogoda-preview/photos/cloud.jpg", "pogoda-preview/assets/font.woff2", ".public-metadata"]) {
  test(`Mac QA rejects changed ${file} even when main index.html is unchanged`, t => {
    const { staged, current } = fixture(t);
    const bytes = readFileSync(join(staged, file));
    bytes[0] ^= 1;
    writeFileSync(join(staged, file), bytes);
    assert.deepEqual(readFileSync(join(staged, "index.html")), readFileSync(join(current, "index.html")));
    assert.throws(() => assertMatchingPublicBundles(staged, current), error =>
      error.message.includes("changed public asset") && error.message.includes(file));
  });
}

test("Mac QA rejects missing nested assets and obsolete extra assets", t => {
  const { staged, current } = fixture(t);
  const missing = join(staged, "pogoda-preview/assets/workshop.js");
  const bytes = readFileSync(missing);
  rmSync(missing);
  assert.throws(() => assertMatchingPublicBundles(staged, current), /public file lists differ/);
  writeFileSync(missing, bytes);
  writeFileSync(join(staged, "pogoda-preview/assets/obsolete.js"), "old chunk");
  assert.throws(() => assertMatchingPublicBundles(staged, current), /public file lists differ/);
});

test("Mac QA does not accept missing directories or two empty public bundles", t => {
  const { root, staged, current } = fixture(t);
  assert.throws(() => assertMatchingPublicBundles(join(root, "missing"), current), /ENOENT/);
  assert.throws(() => assertMatchingPublicBundles(staged, join(root, "missing")), /ENOENT/);
  for (const base of [staged, current]) {
    rmSync(base, { recursive: true });
    mkdirSync(base);
  }
  assert.throws(() => assertMatchingPublicBundles(staged, current), /missing index.html/);
});

test("Mac QA rejects file, directory and root symlinks on either side", t => {
  const { root, staged, current } = fixture(t);
  for (const base of [staged, current]) {
    for (const target of [join(base, "index.html"), join(base, "pogoda-preview")]) {
      const link = join(base, "alias");
      symlinkSync(target, link);
      assert.throws(() => assertMatchingPublicBundles(staged, current), /public bundle symlink/);
      rmSync(link);
    }
    const alias = join(root, "alias-root");
    symlinkSync(base, alias);
    assert.throws(() => assertMatchingPublicBundles(base === staged ? alias : staged, base === current ? alias : current), /real directory/);
    rmSync(alias);
  }
});

test("Mac QA checks the entire bundle before staging mutations; import cannot start preparation", () => {
  const source = readFileSync(new URL("../scripts/prepare-macos-qa.mjs", import.meta.url), "utf8");
  const main = source.slice(source.indexOf("function prepareMacosQA()"));
  const gate = main.indexOf('assertMatchingPublicBundles(resolve(source, "App/public"), resolve(root, "ios/App/App/public"))');
  assert.ok(gate >= 0);
  assert.ok(gate < main.indexOf("rmSync("));
  assert.ok(gate < main.indexOf("cpSync("));
  assert.ok(gate < main.indexOf('run("xcodebuild"'));
  assert.match(main, /if \(process.argv\[1\] && import.meta.url === pathToFileURL\(resolve\(process.argv\[1\]\)\).href\) prepareMacosQA\(\);/);
});
