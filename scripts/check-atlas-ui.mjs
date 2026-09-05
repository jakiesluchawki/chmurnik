import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { parseArgs } from "node:util";
import { createServer } from "vite";
import { clouds } from "../src/data/clouds.js";
import { cloudProfiles, taxonomyTerms } from "../src/data/encyclopedia.js";
import { getNomenclatureOrigins } from "../src/lib/nomenclature.js";

const { values } = parseArgs({ options: {
  "playwright-path": { type: "string" }, "browser-path": { type: "string" },
  native: { type: "boolean", default: false }, output: { type: "string", default: "build/atlas-ui-qa" },
} });
const { chromium } = await import(values["playwright-path"] ? pathToFileURL(values["playwright-path"]).href : "playwright");
const output = resolve(values.output);
await mkdir(output, { recursive: true });
let server;
let browser;
let page;
const errors = [];
let checked = 0;
try {
  server = await createServer({ server: { host: "127.0.0.1", port: 4179 }, define: {
    "import.meta.env.VITE_QA_NATIVE_LAYOUT": JSON.stringify(values.native ? "1" : "0"),
    "import.meta.env.VITE_QA_NO_ONBOARDING": '"1"',
  } });
  await server.listen();
  const base = `http://127.0.0.1:${server.httpServer.address().port}${server.config.base}`;
  browser = await chromium.launch({ headless: true, executablePath: values["browser-path"] });
  page = await browser.newPage({ viewport: { width: 390, height: 844 }, reducedMotion: "reduce", locale: "pl-PL" });
  page.on("pageerror", (error) => errors.push(error.message));
  const checkOverflow = async (dialog, label) => {
    assert.equal(await dialog.evaluate((element) => element.scrollWidth > element.clientWidth + 1), false, label);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false, label);
  };
  for (const width of [320, 390, 1100]) {
    await page.setViewportSize({ width, height: 844 });
    for (const cloud of clouds) {
      await page.goto(`${base}#/atlas/compare/${cloud.id}`);
      const dialog = page.getByRole("dialog", { name: `Monografia ${cloud.name}`, exact: true });
      await dialog.waitFor();
      await page.evaluate(() => document.fonts.ready);
      const profile = cloudProfiles[cloud.id];
      const text = await dialog.textContent();
      for (const value of [cloud.headline, cloud.trap, profile.essence, profile.composition, ...profile.aviation]) {
        assert.ok(text.includes(value), `${cloud.id}: ${value}`);
      }
      for (const [index, photo] of cloud.images.entries()) {
        await dialog.getByRole("button", { name: `Pokaż kadr ${index + 1} z ${cloud.images.length}: ${photo.note}`, exact: true }).click();
        const reveal = dialog.getByRole("button", { name: "Pokaż opis zdjęcia", exact: true });
        await reveal.waitFor();
        assert.equal(await reveal.getAttribute("aria-expanded"), "false");
        assert.equal(await dialog.getByRole("heading", { name: photo.diagnostic, exact: true }).count(), 0);
        await reveal.click();
        await dialog.getByRole("heading", { name: photo.diagnostic, exact: true }).waitFor();
        assert.ok((await dialog.textContent()).includes(photo.note));
        assert.equal(await dialog.getByRole("button", { name: "Ukryj opis zdjęcia", exact: true }).getAttribute("aria-expanded"), "true");
        await dialog.locator("img").evaluateAll((images) => Promise.all(images.map((image) => image.decode())));
      }
      await checkOverflow(dialog, `${cloud.id}/${width}`);
      if (["stratus", "cirrocumulus"].includes(cloud.id)) {
        await dialog.getByRole("heading", { name: "Genitus i mutatus", exact: true }).scrollIntoViewIfNeeded();
        await page.screenshot({ path: resolve(output, `${width}-${cloud.id}-origins.png`) });
      }
      await dialog.locator(".source-button").click();
      await page.getByRole("dialog", { name: "Źródła", exact: true }).waitFor();
      assert.ok(await page.getByRole("dialog", { name: "Źródła", exact: true }).getByRole("link").count() > 0);
      await page.keyboard.press("Escape");
      assert.equal(await dialog.isVisible(), true, "Closing sources preserves the cloud card");
      await page.keyboard.press("Escape");
      checked++;
    }
    await page.goto(`${base}#/atlas`);
    await page.getByRole("tab", { name: "Indeks · 49", exact: true }).click();
    await page.getByRole("heading", { name: "Sprawdź, jak połączyć nazwy chmur", exact: true }).waitFor();
    for (const cloud of clouds) {
      await page.locator(".nomenclature-step--genus button").filter({ has: page.getByText(cloud.name, { exact: true }) }).click();
      const origins = await page.locator('.nomenclature-step--origin optgroup[label="Chmura macierzysta"] option').evaluateAll((items) => items.map((item) => item.value));
      assert.deepEqual(origins, getNomenclatureOrigins(cloud.id).filter((item) => item.type === "mother").map((item) => item.id));
    }
    await page.getByRole("button", { name: /Historia przemiany/ }).click();
    await page.getByText("Potwierdź, skąd znasz pochodzenie", { exact: true }).waitFor();
    await page.getByRole("checkbox", { name: /Mam podstawę do opisania pochodzenia/ }).check();
    await page.locator(".nomenclature-result.is-valid").waitFor();
    await page.getByRole("button", { name: /Znajdź sprzeczność/ }).click();
    await page.locator(".nomenclature-result.is-conflict").waitFor();
    const search = page.locator(".encyclopedia-tools input");
    for (const term of taxonomyTerms) {
      await search.fill(term.name);
      await page.locator(".term-card-main").filter({ has: page.getByText(term.name, { exact: true }) }).click();
      const dialog = page.getByRole("dialog", { name: `Hasło ${term.name}`, exact: true });
      await dialog.waitFor();
      const text = await dialog.textContent();
      for (const value of [term.definition, term.diagnostic]) assert.ok(text.includes(value), term.id);
      await checkOverflow(dialog, `${term.id}/${width}`);
      if (["virga", "tuba"].includes(term.id)) await page.screenshot({ path: resolve(output, `${width}-${term.id}.png`) });
      await page.keyboard.press("Escape");
      checked++;
    }
    console.log(`Atlas checked: ${width}px`);
  }
  assert.deepEqual(errors, []);
  console.log(`PASS: ${checked} cloud/term/viewport checks, all photo captions, sources and canonical name choices.`);
} catch (error) {
  console.error("Browser errors:", errors);
  console.error("URL:", page?.url());
  await page?.screenshot({ path: resolve(output, "failure.png"), fullPage: true }).catch(() => {});
  throw error;
} finally {
  await browser?.close();
  await server?.close();
}
