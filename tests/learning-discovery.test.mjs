import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("both home surfaces show full learning alongside short practice modules", async () => {
  const app = await read("src/App.jsx");
  const home = await read("src/components/FieldHome.jsx");
  assert.match(home, /<PracticeLinks navigate=\{navigate\} \/>\s*<FullLearningLinks/);
  assert.match(app, /web-field-shortcuts.*<FullLearningLinks/);
});

test("full learning has direct unlocked routes and is not hidden behind completion", async () => {
  const component = await read("src/components/FieldPractice.jsx");
  const links = component.slice(component.indexOf("export function FullLearningLinks"), component.indexOf("function SourceLink"));
  assert.match(links, /navigate\("layers"\)/);
  assert.match(links, /navigate\("learn"\)/);
  assert.doesNotMatch(links, /disabled|completed|localStorage/);
  assert.match(component, /field-full-workshop/);
});

test("inside the full layers workspace the six real tabs precede the content", async () => {
  const app = await read("src/App.jsx");
  const section = app.slice(app.indexOf("function LayersPage("), app.indexOf('className="segmented-control layers-tabs"'));
  assert.doesNotMatch(section, /<PracticeLinks/);
});
