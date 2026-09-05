import assert from "node:assert/strict";
import { mkdir, readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { parseArgs } from "node:util";

const { values } = parseArgs({ options: {
  pack: { type: "string" }, "playwright-path": { type: "string" }, "browser-path": { type: "string" },
  output: { type: "string", default: "build/expert-review-qa" },
} });
assert.ok(values.pack, "Pass the reviewer directory, never the private key directory");
const pack = resolve(values.pack);
const root = pathToFileURL(`${pack}/`).href;
const manifest = JSON.parse(await readFile(resolve(pack, "images.json"), "utf8"));
assert.ok(manifest.items.length > 0);
const { chromium } = await import(values["playwright-path"] ? pathToFileURL(values["playwright-path"]).href : "playwright");
const output = resolve(values.output);
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ headless: true, executablePath: values["browser-path"] });
const errors = [];
const remoteRequests = [];
try {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, reducedMotion: "reduce" });
  page.on("pageerror", (error) => errors.push(error.message));
  await page.route(/^https?:/, (route) => {
    remoteRequests.push(route.request().url());
    return route.abort();
  });
  for (const width of [320, 390, 1100]) {
    await page.setViewportSize({ width, height: 844 });
    await page.goto(new URL("index.html", root).href);
    await page.getByRole("heading", { name: "Niezależna ocena zdjęć nieba" }).waitFor();
    await page.screenshot({ path: resolve(output, `${width}-instructions.png`) });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false, `${width}: horizontal overflow`);
    assert.equal(await page.locator("figure").count(), manifest.items.length);
    assert.equal(await page.getByRole("link", { name: "ocena.csv", exact: true }).getAttribute("href"), "ocena.csv");
    await page.locator("details summary").click();
    const images = page.locator("figure img");
    for (const [index, item] of manifest.items.entries()) {
      const image = images.nth(index);
      assert.equal(await image.getAttribute("alt"), `Zdjęcie ${item.photo_id}`);
      assert.equal(await image.getAttribute("src"), item.image_file);
      assert.equal(await page.locator("figcaption").nth(index).textContent(), item.photo_id);
      await image.scrollIntoViewIfNeeded();
      const decoded = await image.evaluate(async (element) => {
        await element.decode();
        return { width: element.naturalWidth, height: element.naturalHeight, fit: getComputedStyle(element).objectFit };
      });
      assert.ok(decoded.width > 0 && decoded.height > 0);
      assert.equal(decoded.fit, "contain", "Reviewer sees the complete frame");
      assert.equal(await image.locator("..").getAttribute("href"), item.image_file);
    }
    await images.first().scrollIntoViewIfNeeded();
    await page.screenshot({ path: resolve(output, `${width}-photos.png`) });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false, `${width}: photo overflow`);
    await images.first().click();
    assert.equal(page.url(), new URL(manifest.items[0].image_file, root).href);
  }
  assert.deepEqual(errors, []);
  assert.deepEqual(remoteRequests, [], "Offline reviewer must make no network requests");
  console.log(`PASS: ${manifest.items.length} complete photos at 320/390/1100px, neutral IDs, original-image links, CSV link and offline operation.`);
} finally {
  await browser.close();
}
