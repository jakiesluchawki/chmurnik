import assert from "node:assert/strict";
import { mkdir, readFile } from "node:fs/promises";
import path from "node:path";
import { parseArgs } from "node:util";
import { pathToFileURL } from "node:url";
import { clouds } from "../src/data/clouds.js";
import { practiceCases, tafExamples } from "../src/data/field-practice.js";
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
      assert.equal(
        values.capture,
        false,
        "Capture fixtures require the isolated QA build.",
      );
      const apache = await readFile("public/.htaccess", "utf8");
      const headers = Object.fromEntries(
        [...apache.matchAll(/^\s*Header always set ([\w-]+) "([^"]+)"/gm)].map(
          (match) => [match[1], match[2]],
        ),
      );
      server = await preview({
        base: values["path-prefix"],
        preview: { host: "127.0.0.1", port: 4177, headers },
      });
    } else {
      server = await createServer({
        server: { host: "127.0.0.1", port: 4177 },
        define: {
          "import.meta.env.VITE_QA_NATIVE_LAYOUT": JSON.stringify(
            values.native ? "1" : "0",
          ),
          "import.meta.env.VITE_QA_NO_ONBOARDING": '"1"',
          "import.meta.env.VITE_QA_PHOTO_RECOGNITION": JSON.stringify(
            values.capture ? "result" : "",
          ),
        },
      });
      await server.listen();
    }
  }
  const base =
    values.base ||
    `http://127.0.0.1:${server.httpServer.address().port}${server.config.base}`;
  // A fresh temporary profile only. Never connect to the user's browser session.
  browser = await chromium.launch({
    headless: true,
    executablePath: values["browser-path"],
  });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 1,
    locale: "pl-PL",
    reducedMotion: "reduce",
  });
  page = await context.newPage();
  await page.exposeFunction("recordPolicyViolation", (violation) =>
    policyViolations.push(violation),
  );
  await page.addInitScript(() => {
    document.addEventListener("securitypolicyviolation", (event) => {
      window.recordPolicyViolation(
        `${event.effectiveDirective}: ${event.blockedURI}`,
      );
    });
  });
  page.setDefaultTimeout(15000);
  page.setDefaultNavigationTimeout(90000);
  page.on("pageerror", (error) => errors.push(error.message));
  const navigate = async (route) => {
    console.log(`Checking route: ${route}`);
    const url = new URL(base);
    url.hash = `/${route}`;
    url.searchParams.set("qa-route", route);
    await page.goto(url.href);
    await page.locator("h1").first().waitFor({ timeout: 45000 });
    // The production onboarding opens on an animation frame after the first render.
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
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
      if (
        !(await page
          .getByRole("dialog", { name: "Rozpoznawanie chmur ze zdjęcia" })
          .isVisible())
      ) {
        await page
          .getByRole("button", { name: "Zrób zdjęcie", exact: true })
          .click();
      }
      await page
        .getByRole("button", { name: "Zapisz w Moim niebie" })
        .waitFor();
      const picker = page.getByRole("region", { name: "Wybór obszaru nieba" });
      const marker = picker.getByRole("button", { name: `Zaznacz proponowany fragment ${attempt + 1}`, exact: true });
      await marker.click();
      assert.equal(await marker.getAttribute("aria-pressed"), "true");
      assert.equal(await picker.getByRole("slider").count(), 0, "No mandatory crop sliders");
      const bounds = async () => picker.locator(".photo-region-selection").evaluate((element) => ({
        x: parseFloat(element.style.left), y: parseFloat(element.style.top),
        width: parseFloat(element.style.width), height: parseFloat(element.style.height),
      }));
      const proposed = await bounds();
      assert.ok(proposed.width > 0 && proposed.height > 0);
      if (attempt === 1) {
        const surface = picker.getByRole("button", { name: "Wskaż miejsce na zdjęciu; strzałki przesuwają wybór", exact: true });
        await surface.focus();
        await surface.press("ArrowLeft");
        const moved = await bounds();
        assert.equal(moved.width, proposed.width, "Keyboard retains proposal width");
        assert.equal(moved.height, proposed.height, "Keyboard retains proposal height");
        assert.ok(moved.x < proposed.x, "Keyboard moves the existing selection");
        await picker.getByRole("button", { name: "Więcej kontekstu", exact: true }).click();
        assert.ok((await bounds()).width > moved.width);
      }
      await screenshot(`capture-${attempt + 1}-selection`);
      await picker.getByRole("button", { name: "Sprawdź zaznaczony fragment", exact: true }).click();
      await page.getByText("Wynik dotyczy zaznaczonego fragmentu. Całe zdjęcie pozostaje w obserwacji.", { exact: true }).waitFor();
      await page.getByRole("region", { name: "Porównanie własnego zdjęcia z atlasem" }).waitFor();
      const imageSizes = await page.locator(".photo-region-image img, .photo-evidence-images img").evaluateAll((images) =>
        Promise.all(images.map(async (image) => {
          await image.decode();
          return { width: image.naturalWidth, height: image.naturalHeight, src: image.src };
        })));
      assert.equal(imageSizes.length, 3, "Full photo, selected crop and atlas reference are retained");
      assert.equal(imageSizes[1].width, imageSizes[1].height, "Analyzed selection is the shown square");
      assert.notEqual(imageSizes[1].src, imageSizes[2].src, "Own photo is distinct from atlas evidence");
      await screenshot(`capture-${attempt + 1}-frame`);
      await page.getByRole("button", { name: "Zapisz w Moim niebie" }).click();
      await page.getByRole("combobox", { name: /Moje rozpoznanie/ }).waitFor();
      assert.equal(
        await page
          .getByRole("combobox", { name: /Moje rozpoznanie/ })
          .inputValue(),
        "",
      );
      assert.match(
        await page.locator(".sky-hypothesis").textContent(),
        /qa-fixture/,
      );
      observationRoutes.add(new URL(page.url()).hash);
      await page.reload();
      await page.getByRole("button", { name: "Zamknij rozpoznawanie" }).click();
      await page.waitForFunction(
        () => document.querySelector("img.sky-detail-photo")?.naturalWidth > 0,
      );
      const savedSize = await page.locator("img.sky-detail-photo").evaluate((image) => ({ width: image.naturalWidth, height: image.naturalHeight }));
      const scaledHeight = savedSize.width * imageSizes[0].height / imageSizes[0].width;
      assert.ok(Math.abs(savedSize.height - scaledHeight) <= 1, "Saved full photo retains its aspect ratio within one resize pixel");
      assert.match(
        await page.locator(".sky-hypothesis").textContent(),
        /qa-fixture/,
      );
      assert.equal(
        await page
          .getByRole("combobox", { name: /Moje rozpoznanie/ })
          .inputValue(),
        "",
      );
      await screenshot(`capture-${attempt + 1}-saved`);
      await page
        .getByRole("button", { name: "Usuń obserwację…", exact: true })
        .click();
      await page
        .getByRole("button", { name: "Usuń tę obserwację", exact: true })
        .click();
      await page
        .getByRole("heading", { name: "Tu pojawią się Twoje obserwacje" })
        .waitFor();
    }
    assert.equal(observationRoutes.size, 2);
    console.log(
      "PASS: repeated fixture-photo framing, save, persistence, unconfirmed model hypothesis, and delete. This does not test physical camera hardware or model accuracy.",
    );
  } else {
    await navigate("home");
    if (values.native)
      assert.equal(await page.locator("h1").textContent(), "Poznaj chmury nad sobą");
    if (!values.native) {
      const store = page.getByRole("link", { name: "Bezpłatnie w App Store" });
      assert.equal(await store.getAttribute("href"), "https://apps.apple.com/pl/app/chmurnik/id6782159027");
      assert.equal(await page.locator('meta[property="og:url"]').getAttribute("content"), "https://chmurnik.cloud/");
      assert.ok(await page.locator(".web-app-note").isVisible());
    } else {
      assert.equal(await page.locator(".web-app-note").count(), 0);
    }
    await screenshot("01-home-mobile");

    await navigate("journal");
    await page
      .getByRole("heading", { name: "Tu pojawią się Twoje obserwacje" })
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
      .getByText("Zmiany zapisane.", { exact: true })
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
    assert.equal(
      await page.getByLabel("Ulubiona obserwacja").isChecked(),
      true,
    );
    assert.match(
      await page.getByRole("textbox", { name: /^Notatka/ }).inputValue(),
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
      .getByRole("heading", { name: "Tu pojawią się Twoje obserwacje" })
      .waitFor();
    await page.locator(".sky-backups summary").click();
    await page.locator('.sky-backups input[type="file"]').setInputFiles({
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
      .getByLabel("Wklej jeden METAR, SPECI lub TAF")
      .fill("METAR EPGD 261200Z VRB04KT CAVOK 22/13 Q1015 NOSIG=");
    await page.getByRole("button", { name: "Wyjaśnij depeszę" }).click();
    await page
      .getByText("Wklejona depesza, bez sprawdzania aktualności", { exact: true })
      .waitFor();
    await page.getByRole("button", { name: "CAVOK", exact: true }).click();
    assert.equal(await page.locator(".field-wind-workbench").count(), 0);
    assert.match(
      await page.locator(".field-metar-result").textContent(),
      /VRB: kierunek wiatru jest zmienny/,
    );
    const readReport = async (report) => {
      await page.getByLabel("Wklej jeden METAR, SPECI lub TAF").fill(report);
      await page.getByRole("button", { name: "Wyjaśnij depeszę" }).click();
    };
    await readReport(tafExamples[0].report);
    await page
      .getByText("Rozpoznano TAF · prognoza, nie obserwacja", { exact: true })
      .waitFor();
    assert.equal(await page.locator(".field-taf-timeline button").count(), 4);
    assert.match(
      await page.locator(".field-taf-window").textContent(),
      /dzień 26, 18:00 UTC.*dzień 27, 18:00 UTC/,
    );
    assert.equal(
      await page.getByText("Temperatura / punkt rosy", { exact: true }).count(),
      0,
    );
    assert.equal(
      await page.getByText("Nastawa wysokościomierza", { exact: true }).count(),
      0,
    );
    await page
      .locator(".field-taf-timeline")
      .getByRole("button", { name: /30%/ })
      .click();
    assert.match(
      await page.locator(".field-taf-period").textContent(),
      /Kierunek zmienny · 25 kt, porywy 40 kt/,
    );
    assert.match(
      await page.locator(".field-taf-period").textContent(),
      /8000 ft nad lotniskiem/,
    );
    assert.equal(await page.locator(".field-wind-workbench").count(), 0);
    await screenshot("07-taf-mobile");
    await page.locator(".field-taf-period-heading").scrollIntoViewIfNeeded();
    await page.screenshot({
      path: path.join(output, "07-taf-probability-mobile.png"),
    });
    await page.getByRole("button", { name: "2618/2718", exact: true }).click();
    assert.match(
      await page.locator(".field-token-detail").textContent(),
      /Okres ważności prognozy/,
    );
    await page.locator(".field-taf-timeline button").nth(3).click();
    assert.match(
      await page.locator(".field-taf-period").textContent(),
      /Z 300°T · 8 kt/,
    );
    assert.match(
      await page.locator(".field-taf-period").textContent(),
      /16000 ft nad lotniskiem/,
    );
    await page
      .getByRole("button", { name: "TAF: BECMG i TEMPO", exact: true })
      .click();
    await page
      .locator(".field-taf-timeline")
      .getByRole("button", { name: /40%/ })
      .click();
    assert.match(
      await page.locator(".field-taf-period").textContent(),
      /Bez zmiany w tej grupie/,
    );
    assert.match(
      await page.locator(".field-taf-period").textContent(),
      /każdy krótszy niż godzina/,
    );
    await page
      .getByRole("button", { name: "TAF: północ i uskok wiatru", exact: true })
      .click();
    assert.match(
      await page.locator(".field-taf-period").textContent(),
      /Uskok wiatru LLWS/,
    );
    await readReport("TAF EPWA 261130Z 2612/2712 CNL");
    assert.equal(await page.locator(".field-taf-timeline").count(), 0);
    assert.match(
      await page.locator(".field-metar-result").textContent(),
      /CNL: prognoza została odwołana/,
    );
    await readReport(`METAR ${tafExamples[0].report}`);
    await page.getByRole("alert").waitFor();
    assert.equal(await page.locator(".field-metar-result").count(), 0);
    await readReport(
      "METAR EPGD 261200Z 24010KT 9999 SCT030 20/10 Q1015 TEMPO 3000 RA BKN008",
    );
    assert.equal(await page.locator(".field-taf-timeline").count(), 0);
    assert.match(
      await page.locator(".field-report-type").textContent(),
      /METAR · obserwacja/,
    );
    assert.match(
      await page.locator(".field-metar-summary").textContent(),
      /co najmniej 10 km/,
    );
    await page.locator(".field-report-guide summary").click();
    await page.getByRole("button", { name: "Przećwicz różnicę" }).click();
    const metarCases = practiceCases.filter((item) => item.track === "metar");
    await page.getByRole("heading", { name: "Raport bez tytułu" }).waitFor();
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
    await page
      .locator(".field-answers button")
      .nth(metarCases[0].answer)
      .click();
    await page
      .getByRole("button", { name: "Podsumowanie", exact: true })
      .click();
    assert.match(
      await page.locator(".field-round-summary").textContent(),
      /1 z 1/,
    );

    await navigate("practice/wind");
    await screenshot("05-wind-sailing-mobile");
    const method = page.locator("details.field-disclosure").first();
    await method.locator("summary").click();
    const methodColors = await method.evaluate((element) => ({
      background: getComputedStyle(element).backgroundColor,
      summary: getComputedStyle(element.querySelector("summary")).color,
      paragraph: getComputedStyle(element.querySelector("p")).color,
    }));
    assert.equal(methodColors.background, "rgba(0, 0, 0, 0)");
    assert.equal(methodColors.summary, methodColors.paragraph);
    await method.locator("summary").click();
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
    await page.getByRole("slider", { name: /Za ile godzin/ }).press("End");
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
    for (const route of [
      "home",
      "journal",
      "practice/metar",
      "practice/wind",
      "practice/maps",
    ]) {
      await navigate(route);
      await screenshot(`compact-${route.replaceAll("/", "-")}`);
      if (route === "practice/metar") {
        await readReport(tafExamples[0].report);
        await page
          .locator(".field-taf-timeline")
          .getByRole("button", { name: /30%/ })
          .click();
        await screenshot("compact-taf");
      }
      const clippedControls = await page
        .locator("main button, main input, main textarea, main select")
        .evaluateAll((controls) =>
          controls
            .filter((control) => control.getClientRects().length)
            .filter((control) => {
              const rect = control.getBoundingClientRect();
              return rect.left < -1 || rect.right > innerWidth + 1;
            })
            .map(
              (control) =>
                control.getAttribute("aria-label") || control.textContent,
            ),
        );
      assert.deepEqual(
        clippedControls,
        [],
        `Clipped controls at 320px: ${route}`,
      );
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
      if (route === "practice/metar") {
        await readReport(tafExamples[0].report);
        await page
          .locator(".field-taf-timeline")
          .getByRole("button", { name: /30%/ })
          .click();
        await screenshot("desktop-taf");
        await page.locator(".field-taf-timeline").scrollIntoViewIfNeeded();
        await page.screenshot({
          path: path.join(output, "desktop-taf-timeline.png"),
        });
      }
    }
  }
  if (!values.capture) {
    for (const route of ["support", "privacy"]) {
      for (const width of [320, 390, 1440]) {
        await page.setViewportSize({ width, height: 844 });
        await navigate(route);
        await page.getByRole("navigation", { name: "Informacje o aplikacji" }).waitFor();
        await screenshot(`information-${route}-${width}`);
      }
      const response = await page.goto(new URL(`${route}.html`, base).href);
      assert.equal(response.status(), 200);
      await page.getByRole("heading", { name: route === "privacy" ? "Prywatność" : "Pomoc", exact: true }).waitFor();
      assert.ok((await page.locator("main").innerText()).includes("Mieszko Mahboob"));
      await screenshot(`public-${route}`);
    }
  }
  assert.deepEqual(errors, [], "No uncaught browser errors");
  assert.deepEqual(
    policyViolations,
    [],
    "No Content Security Policy violations",
  );
  if (!values.capture)
    console.log(
      "PASS: persistent photo collection, edit, postcard, delete, backup round trip, METAR/TAF detection, KLVM forecast timeline, PROB/BECMG/TEMPO, cancellation/error recovery, scenario replay, wind vectors, map controls, mobile/desktop route rendering",
    );
  console.log(`Screenshots: ${output}`);
} catch (error) {
  console.error("QA failure:", error);
  console.error("Browser errors:", errors);
  if (page) {
    console.error((await page.locator("body").innerText({ timeout: 3000 }).catch(() => "Page body unavailable")).slice(0, 5000));
    await page
      .screenshot({ path: path.join(output, "failure.png"), fullPage: true })
      .catch(() => {});
  }
  throw error;
} finally {
  await browser?.close();
  if (server?.close) await server.close();
  else if (server?.httpServer)
    await new Promise((resolve) => server.httpServer.close(resolve));
}
