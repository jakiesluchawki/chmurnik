import test from "node:test";
import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
import { createHash } from "node:crypto";
import { activities } from "../weather-preview/learning/catalog.mjs";
import { catalogArtwork } from "../weather-preview/learning/artwork.mjs";

test("all fourteen activities have distinct catalog covers", () => {
  const ids = [...Object.keys(activities), "bryza", "chmura", "mgla"].sort();
  assert.deepEqual(Object.keys(catalogArtwork).sort(), ids);
  assert.equal(new Set(Object.values(catalogArtwork).map(art => art.src)).size, 14);
  for (const id of ["obserwacja", "rodziny", "nazwy"]) {
    assert.equal(catalogArtwork[id].photograph, true);
    assert.equal(catalogArtwork[id].generated, undefined);
  }
  assert.equal(catalogArtwork.obserwacja.src, "./photos/observation.jpg");
});

test("generated covers are distinct optimized WebP files, not renamed copies", async () => {
  const covers = Object.values(catalogArtwork).filter(art => art.generated);
  assert.equal(covers.length, 8);
  const hashes = new Set();
  let total = 0;
  for (const art of covers) {
    const path = new URL(`../weather-preview/public/${art.src}`, import.meta.url);
    const data = await readFile(path);
    const { size } = await stat(path);
    assert.equal(data.toString("ascii", 8, 12), "WEBP");
    assert.ok(size > 1000 && size < 350_000, `${art.src}: unreasonable cover size`);
    hashes.add(createHash("sha256").update(data).digest("hex"));
    total += size;
  }
  assert.equal(hashes.size, 8);
  assert.ok(total < 2_000_000, "cover collection should stay economical on mobile");
});

test("covers remain decorative navigation art, separate from live experiment scenes", async () => {
  const catalog = await readFile(new URL("../weather-preview/learning/LearningStudio.jsx", import.meta.url), "utf8");
  const scenes = await readFile(new URL("../weather-preview/learning/Scenes.jsx", import.meta.url), "utf8");
  assert.match(catalog, /src=\{art.src\} alt="" loading="lazy" decoding="async"/);
  assert.doesNotMatch(scenes, /catalogArtwork|covers\//);
});
