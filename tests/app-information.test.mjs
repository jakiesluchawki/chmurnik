import assert from "node:assert/strict";
import test from "node:test";
import { applicationInformation } from "../src/data/app-information.js";
import {
  publicInformationPages,
  renderInformationPage,
} from "../scripts/public-info-pages.mjs";

test("help and privacy are complete, shared between app and public documents", () => {
  for (const [key, page] of Object.entries(applicationInformation.pages)) {
    const html = renderInformationPage(key);
    assert.ok(page.sections.length >= 5);
    assert.match(html, /<html lang="pl">/);
    assert.match(html, /charset="utf-8"/);
    assert.match(html, /href="privacy.html"/);
    assert.match(html, /href="support.html"/);
    assert.doesNotMatch(html, /<script|https?:\/\/.*\.js|__CHMURNIK_|TODO/);
    for (const section of page.sections) {
      assert.ok(section.paragraphs.length);
      assert.ok(html.includes(section.title));
    }
  }
  assert.throws(() => renderInformationPage("not-a-page"));
});

test("privacy discloses backups, local recovery copies and no remote AI", () => {
  const text = JSON.stringify(applicationInformation.pages.privacy);
  for (const required of [
    "EXIF",
    "GPS",
    "iCloud",
    "odzyskiwania",
    "IndexedDB",
    "localStorage",
    "GitHub",
    "cyber_Folks",
    "zewnętrznej usługi AI",
    "źródłowe metadane EXIF",
    "techniczne informacje o rozmiarze i kolorze",
  ]) {
    assert.ok(text.includes(required), required);
  }
});

test("build emits both standalone pages without root-only links", () => {
  const assets = [];
  publicInformationPages().generateBundle.call({
    emitFile: (asset) => assets.push(asset),
  });
  assert.deepEqual(assets.map((asset) => asset.fileName).sort(), [
    "privacy.html",
    "support.html",
  ]);
  for (const asset of assets) {
    assert.equal(asset.type, "asset");
    assert.doesNotMatch(asset.source, /(?:href|src)="\//);
  }
});

test("standalone pages escape content instead of interpreting it as markup", () => {
  const page = applicationInformation.pages.support;
  const original = page.intro;
  try {
    page.intro = '<img src=x onerror="alert(1)">&';
    assert.ok(
      renderInformationPage("support").includes(
        "&lt;img src=x onerror=&quot;alert(1)&quot;&gt;&amp;",
      ),
    );
    assert.ok(!renderInformationPage("support").includes("<img src=x"));
  } finally {
    page.intro = original;
  }
});
