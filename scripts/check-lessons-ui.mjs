import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { parseArgs } from "node:util";
import { createServer } from "vite";
import { learningModules, moduleChecks } from "../src/data/learning.js";
import { lessons } from "../src/data/lessons.js";

const { values } = parseArgs({ options: {
  "playwright-path": { type: "string" }, "browser-path": { type: "string" },
  native: { type: "boolean", default: false }, output: { type: "string", default: "build/lessons-ui-qa" },
} });
const { chromium } = await import(values["playwright-path"] ? pathToFileURL(values["playwright-path"]).href : "playwright");
const output = resolve(values.output);
await mkdir(output, { recursive: true });
let server;
let browser;
let page;
const errors = [];
let checkedChapters = 0;
try {
  server = await createServer({ server: { host: "127.0.0.1", port: 4178 }, define: {
    "import.meta.env.VITE_QA_NATIVE_LAYOUT": JSON.stringify(values.native ? "1" : "0"),
    "import.meta.env.VITE_QA_NO_ONBOARDING": '"1"',
  } });
  await server.listen();
  const base = `http://127.0.0.1:${server.httpServer.address().port}${server.config.base}`;
  // Isolated temporary profile; lesson completion never touches user records.
  browser = await chromium.launch({ headless: true, executablePath: values["browser-path"] });
  page = await browser.newPage({ viewport: { width: 390, height: 844 }, reducedMotion: "reduce", locale: "pl-PL" });
  page.on("pageerror", (error) => errors.push(error.message));
  const noOverflow = async (label) => assert.equal(
    await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false, label,
  );
  for (const width of [320, 390, 1100]) {
    await page.setViewportSize({ width, height: 844 });
    for (const module of learningModules) {
      console.log(`Lesson ${module.id}: ${width}px`);
      const lesson = lessons[module.id];
      const check = moduleChecks[module.id];
      await page.goto(`${base}#/learn/${module.id}`);
      await page.getByRole("heading", { name: module.title, exact: true }).waitFor();
      await page.evaluate(() => document.fonts.ready);
      const contents = page.getByRole("navigation", { name: "Spis rozdziałów lekcji" });
      assert.equal(await contents.getByRole("button").count(), lesson.chapters.length);
      for (const [index, chapter] of lesson.chapters.entries()) {
        await contents.getByRole("button").nth(index).click();
        const article = page.locator(`#chapter-${module.id}-${chapter.number}.is-active`);
        await article.waitFor();
        assert.equal(await page.locator(".lesson-chapter:visible").count(), width <= 640 ? 1 : lesson.chapters.length);
        for (const paragraph of chapter.paragraphs) assert.ok((await article.textContent()).includes(paragraph));
        const recall = article.locator(".chapter-checkpoint");
        assert.equal(await recall.locator(":scope > p").count(), 0);
        await recall.getByRole("button", { name: "Sprawdź odpowiedź" }).click();
        assert.equal(await recall.getByRole("button").getAttribute("aria-expanded"), "true");
        assert.equal(await recall.locator(":scope > p").textContent(), chapter.checkpoint.answer);
        await noOverflow(`${module.id}/${chapter.number} at ${width}px`);
        if (index === 0 || index === lesson.chapters.length - 1) {
          await article.evaluate((element) => element.scrollIntoView({ block: "start", behavior: "instant" }));
          await page.screenshot({ path: resolve(output, `${width}-${module.id}-${chapter.number}.png`) });
        }
        await recall.getByRole("button", { name: "Ukryj odpowiedź" }).click();
        if (index === 0) {
          await article.locator(".source-button").click();
          await page.getByRole("dialog", { name: "Źródła" }).waitFor();
          assert.ok(await page.getByRole("dialog").getByRole("link").count() > 0);
          await page.keyboard.press("Escape");
        }
        checkedChapters++;
      }
      const finalChapter = `#chapter-${module.id}-${lesson.chapters.at(-1).number}.is-active`;
      await page.reload();
      await page.locator(finalChapter).waitFor();
      const options = page.locator(".lesson-check-options button");
      await options.nth((check.correct + 1) % 4).click();
      assert.match(await page.locator(".lesson-check-feedback").textContent(), /Zaznaczona odpowiedź nie jest poprawna/);
      assert.equal(await page.locator(".lesson-check-options button.correct").textContent(), `${String.fromCharCode(65 + check.correct)}${check.options[check.correct]}`);
      await page.reload();
      await page.locator(finalChapter).waitFor();
      await options.nth(check.correct).click();
      assert.match(await page.locator(".lesson-check-feedback").textContent(), /Poprawna odpowiedź/);
      assert.ok((await page.locator(".lesson-check-feedback").textContent()).includes(check.explanation));
      const complete = page.getByRole("button", { name: "Oznacz jako ukończone", exact: true });
      if (!(await complete.isVisible())) await page.getByRole("button", { name: "Ukończono", exact: true }).click();
      await complete.click();
      await page.reload();
      await page.getByRole("button", { name: "Ukończono", exact: true }).waitFor();
    }
  }
  assert.deepEqual(errors, []);
  console.log(`PASS: ${checkedChapters} chapter/viewport checks, full text, concealed recall, source drawers, resume and completion, correct/incorrect feedback.`);
} catch (error) {
  console.error("Browser errors:", errors);
  console.error("URL:", page?.url());
  console.error(await page?.locator("body").innerText({ timeout: 1000 }).catch(() => "Page body unavailable"));
  await page?.screenshot({ path: resolve(output, "failure.png"), fullPage: true }).catch(() => {});
  throw error;
} finally {
  await browser?.close();
  await server?.close();
}
