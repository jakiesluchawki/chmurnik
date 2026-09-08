import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { parseArgs } from "node:util";
import { createServer } from "vite";

const { values } = parseArgs({ options: {
  "playwright-path": { type: "string" }, "browser-path": { type: "string" },
  output: { type: "string", default: "build/apple-workspace-qa" },
  browser: { type: "string", default: "chromium" },
} });
assert(["chromium", "webkit"].includes(values.browser));
const browsers = await import(values["playwright-path"] ? pathToFileURL(values["playwright-path"]).href : "playwright");
const output = resolve(values.output);
await mkdir(output, { recursive: true });
const server = await createServer({ server: { host: "127.0.0.1", port: 4181 }, define: {
  "import.meta.env.VITE_QA_NATIVE_LAYOUT": '"1"', "import.meta.env.VITE_QA_NO_ONBOARDING": '"1"',
} });
let browser;
try {
  await server.listen();
  browser = await browsers[values.browser].launch({ headless: true, executablePath: values["browser-path"] });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, reducedMotion: "no-preference" });
  page.setDefaultNavigationTimeout(90000);
  page.setDefaultTimeout(30000);
  await page.addInitScript(() => { window.__CHMURNIK_NATIVE_DEVICE__ = "mac"; });
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  const base = `http://127.0.0.1:${server.httpServer.address().port}`;
  const navigate = async (route) => {
    await page.goto(`${base}/#/${route}`);
    await page.locator("h1").first().waitFor();
    await page.evaluate(() => document.fonts.ready);
  };
  for (const width of [390, 440, 760, 820, 1024, 1100, 1366, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    for (const route of ["home", "atlas", "learn", "practice/metar", "practice/wind", "journal", "layers", "practice/maps"]) {
      await navigate(route);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false, `${width}: ${route} overflow`);
      const clipped = await page.locator("main button, main input, main textarea, main select").evaluateAll((nodes) => nodes
        .filter((node) => node.getClientRects().length)
        .filter((node) => {
          // Atlas tabs/filter chips intentionally scroll horizontally on compact screens.
          for (let parent = node.parentElement; parent && parent !== document.body; parent = parent.parentElement) {
            if (/auto|scroll/.test(getComputedStyle(parent).overflowX) && parent.scrollWidth > parent.clientWidth) return false;
          }
          return true;
        })
        .filter((node) => { const r = node.getBoundingClientRect(); return r.left < -1 || r.right > innerWidth + 1; })
        .map((node) => node.textContent || node.getAttribute("aria-label")));
      if (clipped.length) await page.screenshot({ path: resolve(output, "clipped-controls.png") });
      assert.deepEqual(clipped, [], `${width}: ${route} clipped controls`);
      if (route === "layers") {
        const overlaps = await page.locator(".workbench-heading").evaluate((heading) => {
          const source = heading.querySelector(":scope > .source-button").getBoundingClientRect();
          return [...heading.querySelectorAll("h1,p,.eyebrow")].filter((node) => {
            const range = document.createRange();
            range.selectNodeContents(node);
            return [...range.getClientRects()].some((rect) =>
              Math.min(source.right, rect.right) > Math.max(source.left, rect.left)
              && Math.min(source.bottom, rect.bottom) > Math.max(source.top, rect.top));
          }).map((node) => node.tagName);
        });
        assert.deepEqual(overlaps, [], `${width}: source button overlaps the workshop heading`);
      }
      if ([820, 1366].includes(width)) await page.screenshot({ path: resolve(output, `${width}-${route.replaceAll("/", "-")}.png`) });
    }
    assert.equal(await page.locator(".native-workspace-sidebar").isVisible(), width >= 1100);
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await navigate("home");
  const bottom = page.locator(".bottom-nav");
  assert.deepEqual(await bottom.locator("button").allTextContents(), ["Dziś", "Moje niebo", "Atlas", "Warstwy"]);
  const daily = page.locator(".field-daily");
  const hidden = async () => {
    assert.equal(await daily.locator("h3").count(), 0);
    assert.equal(await daily.getByRole("button", { name: "Ćwicz rozpoznawanie" }).count(), 0);
    assert.equal(await daily.locator("a").count(), 0);
    assert.equal(await daily.locator("img").getAttribute("alt"), "Zdjęcie z atlasu wybrane do dzisiejszego ćwiczenia");
  };
  await hidden();
  await daily.getByRole("button", { name: "Odsłoń odpowiedź" }).click();
  await daily.locator("h3").waitFor();
  assert(await daily.getByRole("button", { name: "Ćwicz rozpoznawanie" }).isVisible());
  await daily.getByRole("button", { name: "Ukryj odpowiedź" }).click();
  await hidden();
  await daily.scrollIntoViewIfNeeded();
  await page.screenshot({ path: resolve(output, "iphone-daily-hidden.png") });
  await daily.getByRole("button", { name: "Odsłoń odpowiedź" }).click();
  await page.clock.install();
  const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate()+1);
  await page.clock.setSystemTime(tomorrow);
  await page.evaluate(() => window.dispatchEvent(new Event("pageshow")));
  await daily.getByRole("button", { name: "Odsłoń odpowiedź" }).waitFor();
  await hidden();
  for (const [label,route] of [["Rozczytaj depeszę","practice/metar"],["Oblicz składowe wiatru","practice/wind"],["Zrozum warstwy mapy","practice/maps"]]) {
    await bottom.getByRole("button", { name: "Warstwy", exact: true }).click();
    await page.locator(".native-layer-shortcuts").getByRole("button", { name: new RegExp(label) }).click();
    await page.waitForURL(`**/#/${route}`);
    assert.equal(await bottom.locator('[aria-current="page"]').innerText(), "Warstwy");
  }
  await bottom.getByRole("button", { name: "Warstwy", exact: true }).click();
  await page.screenshot({ path: resolve(output, "iphone-layers.png") });
  await page.locator(".native-layer-shortcuts").getByRole("button", { name: "Pełne lekcje", exact: true }).click();
  await page.waitForURL("**/#/learn");
  await bottom.getByRole("button", { name: "Atlas", exact: true }).click();
  assert.equal(await page.locator(".native-layer-shortcuts,.native-atlas-shortcuts").count(), 0);
  await page.setViewportSize({ width: 1440, height: 1000 });
  await navigate("home");
  await page.getByRole("button", { name: "Wybierz zdjęcie nieba", exact: true }).waitFor();
  await page.keyboard.press("Meta+5");
  await page.waitForURL("**/#/practice/metar");
  const input = page.locator(".field-metar-reader textarea");
  await input.focus();
  await page.keyboard.press("Meta+3");
  assert.match(page.url(), /practice\/metar$/);
  await input.blur();
  await page.keyboard.press("Meta+3");
  await page.waitForURL("**/#/atlas");
  await page.locator(".native-workspace-sidebar").getByRole("button", { name: "Lekcje", exact: true }).click();
  await page.waitForURL("**/#/learn");
  assert.deepEqual(errors, []);
  console.log(`PASS (${values.browser}): 64 native-layout viewport/route combinations, four mobile tabs, direct tools, daily conceal/reveal/date reset, sidebar and Mac shortcuts.`);
} finally {
  await browser?.close();
  await server.close();
}
