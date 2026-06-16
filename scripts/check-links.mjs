import { clouds } from "../src/data/clouds.js";
import { sourceList } from "../src/data/sources.js";

const TIMEOUT_MS = 20_000;
const RETRIES = 2;
const ERROR_MARKERS = [
  /<title[^>]*>\s*(?:404|page not found|not found)/i,
  /<h1[^>]*>\s*(?:404|page not found|not found)/i,
  /the page or file you requested cannot be found/i,
];

const links = [
  ...sourceList.map((source) => ({
    label: `${source.organization}: ${source.title}`,
    url: source.url,
    expectedText: source.checkText,
  })),
  ...clouds.flatMap((cloud) => cloud.images.map((image) => ({
    label: `${cloud.name}: ${image.id} provenance`,
    url: image.page,
  }))),
];

function sleep(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function inspectLink(link) {
  let lastError;

  for (let attempt = 1; attempt <= RETRIES; attempt += 1) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
      const response = await fetch(link.url, {
        redirect: "follow",
        signal: controller.signal,
        headers: {
          accept: "text/html,application/xhtml+xml,application/pdf;q=0.9,*/*;q=0.8",
          "user-agent": "Chmurnik-Link-Monitor/1.0 (+https://github.com/jakiesluchawki/chmurnik)",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status} ${response.statusText}`.trim());
      }

      const contentType = response.headers.get("content-type") || "";
      if (contentType.includes("text/html")) {
        const body = await response.text();
        const marker = ERROR_MARKERS.find((pattern) => pattern.test(body));
        if (marker) throw new Error("the destination renders a not-found page");
        if (
          link.expectedText
          && !body.toLocaleLowerCase("en").includes(link.expectedText.toLocaleLowerCase("en"))
        ) {
          throw new Error(`expected content marker "${link.expectedText}" was not found`);
        }
      } else {
        await response.body?.cancel();
      }

      return {
        ...link,
        finalUrl: response.url,
        status: response.status,
      };
    } catch (error) {
      lastError = error;
      if (attempt < RETRIES) await sleep(800 * attempt);
    } finally {
      clearTimeout(timer);
    }
  }

  throw new Error(`${link.label} — ${link.url} — ${lastError?.message || "unknown error"}`);
}

const results = [];
const failures = [];

for (let index = 0; index < links.length; index += 4) {
  const batch = links.slice(index, index + 4);
  const settled = await Promise.allSettled(batch.map(inspectLink));

  for (const result of settled) {
    if (result.status === "fulfilled") results.push(result.value);
    else failures.push(result.reason.message);
  }
}

for (const result of results) {
  const redirect = result.finalUrl !== result.url ? ` -> ${result.finalUrl}` : "";
  console.log(`OK ${result.status} ${result.label}${redirect}`);
}

if (failures.length) {
  console.error(`\n${failures.length} external link(s) failed:\n`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exitCode = 1;
} else {
  console.log(`\nVerified ${results.length} external links.`);
}
