import assert from "node:assert/strict";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { clouds } from "../src/data/clouds.js";
import { loadJsx } from "./helpers/load-jsx.mjs";

const { HomePage } = await loadJsx(new URL("../src/App.jsx", import.meta.url), ["HomePage"]);

test("daily exercise does not reveal its answer through text or accessible labels", () => {
  const markup = renderToStaticMarkup(createElement(HomePage, { completed: [] }));
  const exercise = markup.match(/<section class="daily-sky"[\s\S]*?<\/section>/)?.[0];
  assert.ok(exercise, "The daily exercise is rendered");
  assert.match(exercise, /aria-expanded="false"/);
  // Resource filenames are not learner-facing labels; captions and alt text are.
  const learnerMarkup = exercise.replace(/\s(?:src|srcSet)="[^"]*"/g, "");
  for (const cloud of clouds) {
    assert.ok(!learnerMarkup.toLowerCase().includes(cloud.name.toLowerCase()),
      `Hidden exercise leaks ${cloud.name}`);
  }
  assert.doesNotMatch(exercise, /class="text-button"/,
    "Do not offer an answer-specific destination before explicit reveal");
});
