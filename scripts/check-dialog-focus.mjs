import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { parseArgs } from "node:util";
import { createServer } from "vite";

const { values } = parseArgs({ options: {
  "playwright-path": { type: "string" },
  "browser-path": { type: "string" },
  engine: { type: "string", default: "chromium" },
  output: { type: "string", default: "build/dialog-focus-qa" },
} });
const engines = await import(values["playwright-path"]
  ? pathToFileURL(values["playwright-path"]).href : "playwright");
assert(["chromium", "webkit"].includes(values.engine));
const output = resolve(values.output);
await mkdir(output, { recursive: true });
const results = [];
const browser = await engines[values.engine].launch({
  headless: true, executablePath: values["browser-path"],
});

try {
  for (const variant of ["onboarding", "photo"]) {
    const server = await createServer({ server: { host: "127.0.0.1", port: 0 }, define: {
      "import.meta.env.VITE_QA_NATIVE_LAYOUT": JSON.stringify(variant === "photo" ? "1" : "0"),
      "import.meta.env.VITE_QA_NO_ONBOARDING": JSON.stringify(variant === "photo" ? "1" : "0"),
      "import.meta.env.VITE_QA_PHOTO_RECOGNITION": JSON.stringify(variant === "photo" ? "result" : ""),
    } });
    try {
      await server.listen();
      for (const width of [390, 1440]) {
        const context = await browser.newContext({
          viewport: { width, height: 900 }, locale: "pl-PL", reducedMotion: "reduce",
        });
        const page = await context.newPage();
        page.setDefaultTimeout(30000);
        const errors = [];
        page.on("pageerror", error => errors.push(error.message));
        const selector = variant === "photo" ? ".photo-recognition-modal" : ".onboarding-modal";
        const dialog = page.locator(selector);
        const checks = [];
        const check = async (name, action) => {
          try { await action(); checks.push({ name, passed: true }); }
          catch (error) {
            checks.push({ name, passed: false, error: error.message });
            await page.screenshot({ path: resolve(output, `${variant}-${width}-${name}-failure.png`) });
          }
        };
        try {
          await page.goto(`http://127.0.0.1:${server.httpServer.address().port}/#/home`);
          await dialog.waitFor();
          if (variant === "photo") await page.getByRole("button", { name: "Zapisz w Moim niebie" }).waitFor();
          await page.waitForFunction(selector => document.activeElement === document.querySelector(selector), selector);
          await page.evaluate(() => document.fonts.ready);
          const contained = () => dialog.evaluate(node => node.contains(document.activeElement));
          // Read the actual rendered controls, including native details/summary stops.
          const ends = async () => dialog.evaluate(node => {
            const controls = [...node.querySelectorAll("a[href],button,input,select,textarea,summary,[tabindex]")]
              .filter(el => el.tabIndex >= 0 && !el.matches(":disabled") && el.getClientRects().length
                && !["hidden", "collapse"].includes(getComputedStyle(el).visibility) && !el.closest("[inert]"));
            controls.forEach(el => el.removeAttribute("data-qa-focus-end"));
            controls[0]?.setAttribute("data-qa-focus-end", "first");
            controls.at(-1)?.setAttribute("data-qa-focus-end", "last");
            return controls.length;
          });
          assert((await ends()) >= 2);
          const first = dialog.locator('[data-qa-focus-end="first"]');
          const last = dialog.locator('[data-qa-focus-end="last"]');
          const focused = locator => locator.evaluate(node => node === document.activeElement);
          await check("initial-backward", async () => {
            await page.keyboard.press("Shift+Tab");
            assert(await contained(), "Shift+Tab escaped the newly opened dialog");
            assert(await focused(last), "Shift+Tab from the dialog must reach its last control");
            await page.screenshot({ path: resolve(output, `${variant}-${width}-backward.png`) });
          });
          await check("initial-forward", async () => {
            await dialog.focus();
            await page.keyboard.press("Tab");
            assert(await focused(first), "Tab from the dialog must reach its first control");
          });
          await check("wrap-backward", async () => {
            await first.focus();
            await page.keyboard.press("Shift+Tab");
            assert(await focused(last), "Backward wrap must stay in the dialog");
          });
          await check("wrap-forward", async () => {
            await last.focus();
            await page.keyboard.press("Tab");
            assert(await focused(first), "Forward wrap must stay in the dialog");
          });
          await check("outside-recovery", async () => {
            await page.locator("body").evaluate(node => { node.tabIndex = -1; node.focus(); });
            await page.keyboard.press("Tab");
            assert(await focused(first), "Lost focus must return to the active dialog");
            await page.locator("body").evaluate(node => node.focus());
            await page.keyboard.press("Shift+Tab");
            assert(await focused(last), "Lost focus must also recover in reverse order");
          });
          await check("escape-and-return", async () => {
            await dialog.focus();
            await page.keyboard.press("Escape");
            await dialog.waitFor({ state: "detached" });
            const trigger = variant === "onboarding" ? page.locator(".home-tour-card")
              : page.getByRole("button", { name: "Zrób zdjęcie", exact: true });
            await trigger.focus();
            await page.keyboard.press("Enter");
            await dialog.waitFor();
            await page.waitForFunction(selector => document.activeElement === document.querySelector(selector), selector);
            await page.keyboard.press("Escape");
            await dialog.waitFor({ state: "detached" });
            assert(await focused(trigger), "Closing the dialog must restore its trigger");
          });
          await check("nested-sources", async () => {
            const overflow = await page.evaluate(() => document.body.style.overflow);
            await page.evaluate(() => { location.hash = "/atlas/compare/cumulus"; });
            const card = page.getByRole("dialog", { name: "Monografia Cumulus", exact: true });
            await card.waitFor();
            const trigger = card.locator(".source-button");
            await trigger.focus();
            await page.keyboard.press("Enter");
            const sources = page.getByRole("dialog", { name: "Źródła", exact: true });
            await sources.waitFor();
            await page.waitForFunction(() => {
              const dialogs = [...document.querySelectorAll('[role="dialog"]')];
              return dialogs.at(-1)?.contains(document.activeElement);
            });
            await page.keyboard.press("Shift+Tab");
            assert(await sources.evaluate(node => node.contains(document.activeElement)), "Nested wrap must stay in sources");
            await page.keyboard.press("Tab");
            assert(await sources.evaluate(node => node.contains(document.activeElement)), "Nested forward wrap must stay in sources");
            await page.keyboard.press("Escape");
            await sources.waitFor({ state: "detached" });
            assert(await card.isVisible(), "Escape must close only the top dialog");
            assert(await focused(trigger), "Sources must restore focus to the parent card");
            assert.equal(await page.evaluate(() => document.body.style.overflow), "hidden");
            await page.keyboard.press("Escape");
            await card.waitFor({ state: "detached" });
            assert.equal(await page.evaluate(() => document.body.style.overflow), overflow, "Last dialog restores body scrolling");
          });
          await page.screenshot({ path: resolve(output, `${variant}-${width}-after.png`) });
          assert.deepEqual(errors, [], "No browser errors");
          results.push({ variant, width, checks, errors });
          console.log(JSON.stringify(results.at(-1)));
        } finally { await context.close(); }
      }
    } finally { await server.close(); }
  }
} finally {
  await browser.close();
  await writeFile(resolve(output, "results.json"), JSON.stringify({
    checkedAt: new Date().toISOString(), engine: values.engine, results,
  }, null, 2) + "\n");
}
assert.equal(results.length, 4);
assert.equal(results.flatMap(r => r.checks).filter(c => !c.passed).length, 0, "Dialog focus checks failed");
console.log(`PASS: ${values.engine}, 28 dialog focus checks across two entry flows and two widths, including nested sources.`);
