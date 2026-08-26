import assert from "node:assert/strict";
import { mkdir, readFile } from "node:fs/promises";
import path from "node:path";
import { parseArgs } from "node:util";
import { pathToFileURL } from "node:url";
import { clouds } from "../src/data/clouds.js";
import { practiceCases } from "../src/data/field-practice.js";
import { learningModules } from "../src/data/learning.js";
import { parseObservationBackup } from "../src/lib/observations.js";
import { createServer, preview } from "vite";

const { values } = parseArgs({
  options: {
    "playwright-path": { type: "string" },
    "browser-path": { type: "string" },
    base: { type: "string" },
    output: { type: "string", default: "build/field-ui-qa" },
    native: { type: "boolean", default: false },
    preview: { type: "boolean", default: false },
    capture: { type: "boolean", default: false },
    "path-prefix": { type: "string", default: "/" },
  },
});
const { chromium } = await import(
  values["playwright-path"]
    ? pathToFileURL(values["playwright-path"]).href
    : "playwright"
);
const output = path.resolve(values.output);
await mkdir(output, { recursive: true });
let server;
let browser;
const errors = [];
const policyViolations = [];
let page;
try {
  if (!values.base) {
    if (values.preview) {
      assert.equal(values.capture, false, "Capture fixtures require the isolated QA build.");
      const apache = await readFile("public/.htaccess", "utf8");
      const headers = Object.fromEntries(
        [...apache.matchAll(/^\s*Header always set ([\w-]+) "([^"]+)"/gm)]
          .map((match) => [match[1], match[2]]),
      );
      server = await preview({ base: values["path-prefix"], preview: { host: "127.0.0.1", port: 4177, headers } });
    } else {
      server = await createServer({
      server: { host: "127.0.0.1", port: 4177 },
      define: {
        "import.meta.env.VITE_QA_NATIVE_LAYOUT": JSON.stringify(values.native ? "1" : "0"),
        "import.meta.env.VITE_QA_NO_ONBOARDING": '"1"',
        "import.meta.env.VITE_QA_PHOTO_RECOGNITION": JSON.stringify(values.capture ? "result" : ""),
      },
    });
    await server.listen();
    }
  }
  const base = values.base || `http://127.0.0.1:${server.httpServer.address().port}${server.config.base}`;
  // A fresh temporary profile only. Never connect to the user's browser session.
  browser = await chromium.launch({ headless: true, executablePath: values["browser-path"] });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 1,
    locale: "pl-PL",
    reducedMotion: "reduce",
  });
  page = await context.newPage();
  await page.exposeFunction("recordPolicyViolation", (violation) => policyViolations.push(violation));
  await page.addInitScript(() => {
    document.addEventListener("securitypolicyviolation", (event) => {
      window.recordPolicyViolation(`${event.effectiveDirective}: ${event.blockedURI}`);
    });
  });
  page.setDefaultTimeout(15000);
  page.on("pageerror", (error) => errors.push(error.message));
  const navigate = async (route) => {
    const url = new URL(base);
    url.hash = `/${route}`;
    url.searchParams.set("qa-route", route);
    await page.goto(url.href);
    await page.locator("h1").first().waitFor();
    const skip = page.getByRole("button", { name: "Pomiń", exact: true });
    if (await skip.isVisible()) await skip.click();
    await page.evaluate(() => document.fonts.ready);
  };
  const screenshot = async (name) => {
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
    await page.screenshot({ path: path.join(output, `${name}-viewport.png`) });
    await page.screenshot({
      path: path.join(output, `${name}.png`),
      fullPage: true,
    });
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth + 1,
    );
    assert.equal(overflow, false, `Horizontal overflow: ${name}`);
  };
  if (values.capture) {
    const observationRoutes = new Set();
    for (let attempt = 0; attempt < 2; attempt += 1) {
      await navigate("home");
      if (!await page.getByRole("dialog", { name: "Rozpoznawanie chmur ze zdjęcia" }).isVisible()) {
        await page.getByRole("button", { name: "Obserwuj niebo", exact: true }).click();
      }
      await page.getByRole("button", { name: "Zapisz w Moim niebie" }).waitFor();
      await page.locator(".photo-frame summary").click();
      await page.getByRole("slider", { name: "Powiększenie" }).press("End");
      await page.getByRole("button", { name: "Sprawdź ten fragment" }).click();
      await page.getByText(/Hipoteza dotyczy fragmentu kadru:/).waitFor();
      await screenshot(`capture-${attempt + 1}-frame`);
      await page.getByRole("button", { name: "Zapisz w Moim niebie" }).click();
      await page.getByRole("combobox", { name: /Moje rozpoznanie/ }).waitFor();
      assert.equal(await page.getByRole("combobox", { name: /Moje rozpoznanie/ }).inputValue(), "");
      assert.match(await page.locator(".sky-hypothesis").textContent(), /qa-fixture/);
      observationRoutes.add(new URL(page.url()).hash);
      await page.reload();
      await page.getByRole("button", { name: "Zamknij rozpoznawanie" }).click();
      await page.waitForFunction(() => document.querySelector("img.sky-detail-photo")?.naturalWidth > 0);
      assert.match(await page.locator(".sky-hypothesis").textContent(), /qa-fixture/);
      assert.equal(await page.getByRole("combobox", { name: /Moje rozpoznanie/ }).inputValue(), "");
      await screenshot(`capture-${attempt + 1}-saved`);
      await page.getByRole("button", { name: "Usuń obserwację…", exact: true }).click();
      await page.getByRole("button", { name: "Usuń tę obserwację", exact: true }).click();
      await page.getByRole("heading", { name: "Pierwsze niebo jest blisko." }).waitFor();
    }
    assert.equal(observationRoutes.size, 2);
    console.log("PASS: repeated fixture-photo framing, save, persistence, unconfirmed model hypothesis, and delete. This does not test physical camera hardware or model accuracy.");
  } else {
  await navigate("home");
  if (values.native)
    assert.equal(await page.locator("h1").textContent(), "Zauważ niebo.");
  await screenshot("01-home-mobile");

  await navigate("journal");
  await page
    .getByRole("heading", { name: "Pierwsze niebo jest blisko." })
    .waitFor();
  await page.getByRole("button", { name: "Dodaj wpis", exact: true }).click();
  await page
    .getByLabel("Zdjęcie nieba (opcjonalnie)")
    .setInputFiles(
      path.resolve(
        "public",
        clouds.find((cloud) => cloud.id === "cumulus").images[0].src,
      ),
    );
  await page
    .getByLabel("Notatka", { exact: true })
    .fill("QA: obserwacja zachowana po ponownym otwarciu.");
  await page.getByLabel("Własne rozpoznanie").selectOption("cumulus");
  await page.getByAltText("Zdjęcie do zapisania", { exact: true }).waitFor();
  await page
    .getByRole("button", { name: "Zapisz obserwację", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Zapisz zmiany", exact: true })
    .waitFor();
  await page.getByLabel("Ulubiona obserwacja").check();
  await page
    .getByRole("button", { name: "Zapisz zmiany", exact: true })
    .click();
  await page
    .getByText("Zmiany zapisane. Hipoteza modelu pozostała osobno.")
    .waitFor();
  await page.getByRole("button", { name: "Zobacz pocztówkę" }).click();
  const card = page.getByAltText("Podgląd pocztówki przed udostępnieniem");
  await card.waitFor();
  await page.waitForFunction(
    () => document.querySelector(".sky-share img")?.naturalWidth === 1080,
  );
  await screenshot("02-observation-and-postcard");
  await page.reload();
  await page.getByLabel("Ulubiona obserwacja").waitFor();
  assert.equal(await page.getByLabel("Ulubiona obserwacja").isChecked(), true);
  assert.match(
    await page.getByLabel("Notatka i cechy").inputValue(),
    /QA: obserwacja/,
  );

  await navigate("journal");
  await page.locator(".sky-card").waitFor();
  await screenshot("03-collection-mobile");
  await page.locator(".sky-backups summary").click();
  await page.getByRole("button", { name: "Eksportuj kopię" }).click();
  const downloaded = page.waitForEvent("download");
  await page.getByRole("button", { name: /Pobierz część 1\/1/ }).click();
  const backup = await downloaded;
  const backupText = await readFile(await backup.path(), "utf8");
  assert.equal(
    parseObservationBackup(backupText)[0].confirmedCloudId,
    "cumulus",
  );
  await page.locator(".sky-card-main").click();
  await page
    .getByRole("button", { name: "Usuń obserwację…", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Usuń tę obserwację", exact: true })
    .click();
  await page
    .getByRole("heading", { name: "Pierwsze niebo jest blisko." })
    .waitFor();
  await page.locator(".sky-backups summary").click();
  await page
    .locator('.sky-backups input[type="file"]')
    .setInputFiles({
      name: "backup.json",
      mimeType: "application/json",
      buffer: Buffer.from(backupText),
    });
  await page
    .getByText("Kopia przywrócona. Istniejące wpisy nie zostały nadpisane.")
    .waitFor();
  assert.equal(await page.locator(".sky-card").count(), 1);

  await navigate("practice/metar");
  await screenshot("04-metar-mobile");
  await page
    .getByLabel("Wklej jeden METAR lub SPECI")
    .fill("METAR EPGD 261200Z VRB04KT CAVOK 22/13 Q1015 NOSIG=");
  await page.getByRole("button", { name: "Rozczytaj raport" }).click();
  await page.getByText("Wklejony raport · nie live", { exact: true }).waitFor();
  await page.getByRole("button", { name: "CAVOK", exact: true }).click();
  assert.equal(await page.locator(".field-wind-workbench").count(), 0);
  assert.match(
    await page.locator(".field-metar-result").textContent(),
    /VRB: brak jednego kierunku/,
  );
  const metarCases = practiceCases.filter((item) => item.track === "metar");
  await page.getByRole("button", { name: "Trening · 4 sytuacje" }).click();
  for (const [index, item] of metarCases.entries()) {
    await page
      .locator(".field-answers button")
      .nth(index === 0 ? (item.answer + 1) % 4 : item.answer)
      .click();
    await page.locator(".field-explanation").waitFor();
    await page
      .getByRole("button", {
        name:
          index === metarCases.length - 1
            ? "Podsumowanie"
            : "Kolejny przypadek",
        exact: true,
      })
      .click();
  }
  await page.getByRole("button", { name: "Powtórz trudniejsze (1)" }).click();
  assert.equal(await page.locator(".field-case-progress i").count(), 1);
  await page.locator(".field-answers button").nth(metarCases[0].answer).click();
  await page.getByRole("button", { name: "Podsumowanie", exact: true }).click();
  assert.match(
    await page.locator(".field-round-summary").textContent(),
    /1 z 1/,
  );

  await navigate("practice/wind");
  await screenshot("05-wind-sailing-mobile");
  await page.getByRole("slider", { name: /Prędkość jachtu/ }).press("End");
  assert.match(await page.locator(".field-readouts").textContent(), /27,7/);
  await page
    .getByRole("button", { name: "Na drodze startowej", exact: true })
    .click();
  assert.match(
    await page.locator(".field-readouts").textContent(),
    /12.*boczny z prawej/,
  );
  await page
    .locator(".field-wind-workbench")
    .getByRole("button", { name: "Źródła i metoda" })
    .click();
  await page.getByRole("dialog").waitFor();
  await page.keyboard.press("Escape");

  await navigate("practice/maps");
  await page.getByRole("combobox", { name: /^Poziom/ }).selectOption("upper");
  await page.getByLabel("Model szkoleniowy").selectOption("B");
  await page.getByRole("slider", { name: /Horyzont prognozy/ }).press("End");
  assert.match(
    await page.locator(".field-map-readout").textContent(),
    /45.*850.*za 6 h/,
  );
  await screenshot("06-maps-mobile");

  for (const route of [
    "atlas",
    "learn",
    "layers/metar",
    "layers/decoder",
    "layers/wind",
    "layers/sounding",
    "layers/lab",
    "layers/hazards",
    "atlas/observer",
    "atlas/compare/cumulus,cumulonimbus",
    "sources",
    ...learningModules.map((module) => `learn/${module.id}`),
  ]) {
    await navigate(route);
    await screenshot(`route-${route.replaceAll("/", "-")}`);
  }
  await page.setViewportSize({ width: 320, height: 740 });
  for (const route of ["home", "journal", "practice/metar", "practice/wind", "practice/maps"]) {
    await navigate(route);
    await screenshot(`compact-${route.replaceAll("/", "-")}`);
    const clippedControls = await page.locator("main button, main input, main textarea, main select").evaluateAll((controls) => controls
      .filter((control) => control.getClientRects().length)
      .filter((control) => {
        const rect = control.getBoundingClientRect();
        return rect.left < -1 || rect.right > innerWidth + 1;
      }).map((control) => control.getAttribute("aria-label") || control.textContent));
    assert.deepEqual(clippedControls, [], `Clipped controls at 320px: ${route}`);
  }
  await page.setViewportSize({ width: 1440, height: 1000 });
  for (const route of [
    "home",
    "journal",
    "practice/metar",
    "practice/wind",
    "practice/maps",
  ]) {
    await navigate(route);
    await screenshot(`desktop-${route.replaceAll("/", "-")}`);
  }
  }
  assert.deepEqual(errors, [], "No uncaught browser errors");
  assert.deepEqual(policyViolations, [], "No Content Security Policy violations");
  if (!values.capture)
  console.log(
    "PASS: persistent photo collection, edit, postcard, delete, backup round trip, METAR decoding, scenario replay, wind vectors, map controls, mobile/desktop route rendering",
  );
  console.log(`Screenshots: ${output}`);
} catch (error) {
  console.error("Browser errors:", errors);
  if (page) {
    console.error((await page.locator("body").innerText()).slice(0, 5000));
    await page
      .screenshot({ path: path.join(output, "failure.png"), fullPage: true })
      .catch(() => {});
  }
  throw error;
} finally {
  await browser?.close();
  if (server?.close) await server.close();
  else if (server?.httpServer) await new Promise((resolve) => server.httpServer.close(resolve));
}
