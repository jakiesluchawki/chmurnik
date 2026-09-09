import test from "node:test";
import assert from "node:assert/strict";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { loadJsx } from "./helpers/load-jsx.mjs";
import { readFile } from "node:fs/promises";

test("a failed workshop renders recovery without erasing answers or exposing raw errors", async () => {
  const { WorkshopBoundary } = await loadJsx(new URL("../weather-preview/WorkshopBoundary.jsx", import.meta.url));
  const child = createElement("p", null, "A working lesson");
  const boundary = new WorkshopBoundary({ children: child, mainSite: "capacitor://localhost/" });
  assert.equal(boundary.render(), child);
  boundary.state = WorkshopBoundary.getDerivedStateFromError(new Error("private debug details"));
  const html = renderToStaticMarkup(boundary.render());
  assert.match(html, /role="alert"/);
  assert.match(html, /Odśwież pracownię/);
  assert.match(html, /href="capacitor:\/\/localhost\/"/);
  assert.doesNotMatch(html, /private debug details/);
  const source = await readFile(new URL("../weather-preview/WorkshopBoundary.jsx", import.meta.url), "utf8");
  assert.doesNotMatch(source, /localStorage|sessionStorage|removeItem|clear\(/);
  assert.match(source, /onClick=\{\(\) => location\.reload\(\)\}/);
});
