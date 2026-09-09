import test from "node:test";
import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import { extname } from "node:path";
import { createHash } from "node:crypto";
import vm from "node:vm";
import ts from "typescript";
import postcss from "postcss";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { activities } from "../weather-preview/learning/catalog.mjs";
import { catalogArtwork } from "../weather-preview/learning/artwork.mjs";
import { foundationWorkshops } from "../weather-preview/learning/foundation-workshop.mjs";
import { transferCases } from "../weather-preview/learning/transfer-cases.mjs";
import { clouds } from "../src/data/clouds.js";
import { lessons } from "../src/data/lessons.js";
import { returnLesson } from "../weather-preview/tutorial.mjs";
import { weatherLessonLinks, weatherWorkshopCatalog } from "../src/lib/weather-lesson-links.js";

const read = file => readFile(new URL(`../${file}`, import.meta.url), "utf8");
const ids = ["bryza", "burza", "chmura", "front", "metar", "mgla", "nazwy", "oblodzenie", "obserwacja", "rodziny", "sondaz", "turbulencja", "wiatr", "wysokosc"];
const deployments = [
  { name: "web root", base: "/", app: "https://chmurnik.cloud/" },
  { name: "Pages", base: "/chmurnik/", app: "https://jakiesluchawki.github.io/chmurnik/" },
  { name: "Capacitor", base: "/", app: "capacitor://localhost/" },
  { name: "Capacitor explicit root", base: "./", app: "capacitor://localhost/index.html" },
  { name: "web subdirectory", base: "/app/", app: "https://example.test/app/index.html" },
];
const parse = (file, source) => ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, /jsx$/.test(file) ? ts.ScriptKind.JSX : ts.ScriptKind.JS);
const main = parse("main.jsx", await read("weather-preview/main.jsx"));
const studio = parse("LearningStudio.jsx", await read("weather-preview/learning/LearningStudio.jsx"));
function nodes(root, predicate) {
  const found = [];
  function visit(node) { if (predicate(node)) found.push(node); ts.forEachChild(node, visit); }
  visit(root);
  return found;
}
function declaration(root, name) {
  const found = nodes(root, node => (ts.isVariableDeclaration(node) || ts.isFunctionDeclaration(node)) && node.name?.getText(root) === name);
  assert.equal(found.length, 1, name);
  return found[0];
}
const mainSiteExpression = declaration(main, "mainSite").initializer.getText(main);
const mainSiteAt = url => vm.runInNewContext(mainSiteExpression, { location: new URL(url), URL });
const evaluate = (expression, context) => vm.runInNewContext(expression, { URL, URLSearchParams, ...context });
function functionsFrom(root, names, context) {
  const code = names.map(name => {
    const node = declaration(root, name);
    return ts.isVariableDeclaration(node) ? `const ${node.getText(root)};` : node.getText(root);
  }).join("\n");
  const transpiled = ts.transpileModule(code, { compilerOptions: { jsx: ts.JsxEmit.React, target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS } });
  return evaluate(`${transpiled.outputText}\n${names.at(-1)}`, { exports: {}, ...context });
}
function routeAt(url) {
  const components = ["LearningCatalog", "FoundationWorkshop", "StormWorkshop", "WindWorkshop", "SoundingWorkshop", "TurbulenceWorkshop", "LearningStudio"];
  const router = functionsFrom(main, ["PreviewRouter"], {
    React: { createElement: (type, props) => ({ type, props }) }, activities,
    location: new URL(url), mainSite: mainSiteAt(url),
    useState: initial => [typeof initial === "function" ? initial() : initial, () => {}], useEffect() {},
    ...Object.fromEntries(components.map(name => [name, name])),
  });
  return router();
}
function sameHost(actual, expected) {
  // URL.origin is "null" for custom schemes, so it cannot distinguish native hosts.
  assert.equal(actual.protocol, expected.protocol);
  assert.equal(actual.host, expected.host);
}
const defaultLesson = id => foundationWorkshops[id]?.lesson ?? activities[id].lesson;
const entryAt = deployment => new URL(weatherWorkshopCatalog(deployment.base), deployment.app);

const catalog = functionsFrom(studio, ["legacy", "workshopSummaries", "CatalogCover", "Header", "LearningCatalog"], {
  React, activities, catalogArtwork, useEffect() {}, ArrowLeft: () => null, ArrowRight: () => null, BookOpen: () => null,
});
function attributes(html, tags) {
  const records = [];
  for (const tag of html.matchAll(/<([\w-]+)\b([^>]*)>/g)) {
    if (!tags.includes(tag[1])) continue;
    const attrs = Object.fromEntries([...tag[2].matchAll(/([\w-]+)="([^"]*)"/g)].map(match => [match[1], match[2].replaceAll("&amp;", "&")]));
    records.push({ tag: tag[1], ...attrs });
  }
  return records;
}

for (const deployment of deployments) {
  test(`${deployment.name}: actual catalog links retain the workshop HTML, all 14 routes and their return lesson`, () => {
    const entry = entryAt(deployment), mainSite = mainSiteAt(entry.href);
    const html = renderToStaticMarkup(React.createElement(catalog, { mainSite }));
    const tiles = attributes(html, ["a"]).filter(a => a.class === "learning-tile");
    assert.equal(tiles.length, 14);
    assert.deepEqual(tiles.map(a => new URL(a.href, entry).hash.slice(1)).sort(), ids);
    for (const tile of tiles) {
      const target = new URL(tile.href, entry), id = target.hash.slice(1);
      sameHost(target, entry);
      assert.equal(target.pathname, entry.pathname, tile.href);
      assert.ok(target.pathname.endsWith("/pogoda-preview/index.html"));
      assert.equal(target.searchParams.get("from"), defaultLesson(id));
      assert.equal(returnLesson(target.search, "invalid"), defaultLesson(id));
      const route = routeAt(target.href);
      const special = { burza: "StormWorkshop", wiatr: "WindWorkshop", sondaz: "SoundingWorkshop", turbulencja: "TurbulenceWorkshop" };
      assert.equal(route.type, special[id] ?? (foundationWorkshops[id] ? "FoundationWorkshop" : "LearningStudio"), id);
      assert.equal(route.props.mainSite, mainSite);
      if (route.type === "FoundationWorkshop" || route.type === "LearningStudio") assert.equal(route.props.id, id);
      const back = new URL(`${route.props.mainSite}#/learn/${returnLesson(target.search, "invalid")}`);
      sameHost(back, new URL(deployment.app));
      assert.equal(back.pathname, new URL("./", deployment.app).pathname);
      assert.equal(back.hash, `#/learn/${defaultLesson(id)}`);
      const catalogReturn = new URL("#pracownia", target);
      assert.equal(catalogReturn.pathname, entry.pathname);
      assert.equal(routeAt(catalogReturn.href).type, "LearningCatalog");
    }
    for (const lesson of Object.keys(lessons)) for (const link of weatherLessonLinks(lesson, deployment.base)) {
      assert.notEqual(routeAt(new URL(link.href, deployment.app).href).type, "LearningCatalog");
    }
  });
}

const componentFiles = {
  ...Object.fromEntries(Object.keys(activities).map(id => [id, "LearningStudio.jsx"])),
  ...Object.fromEntries(Object.keys(foundationWorkshops).map(id => [id, "FoundationWorkshop.jsx"])),
  burza: "StormWorkshop.jsx", wiatr: "WindWorkshop.jsx", sondaz: "SoundingWorkshop.jsx", turbulencja: "TurbulenceWorkshop.jsx",
};
const parsedComponents = new Map();
for (const file of new Set(Object.values(componentFiles))) parsedComponents.set(file, parse(file, await read(`weather-preview/learning/${file}`)));
function internalAnchors(root, context) {
  const result = [];
  for (const node of nodes(root, node => (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) && node.tagName.getText(root) === "a")) {
    const href = node.attributes.properties.find(attr => ts.isJsxAttribute(attr) && attr.name.text === "href")?.initializer;
    if (!href) continue;
    if (ts.isStringLiteral(href)) {
      if (/^[#?.]/.test(href.text)) result.push(href.text);
    } else if (ts.isJsxExpression(href) && href.expression) {
      const expression = href.expression.getText(root);
      if (/\b(?:mainSite|lessonLink|lessonHref)\b/.test(expression)) result.push(evaluate(expression, context));
    }
  }
  return result;
}

for (const id of ids) {
  test(`${id}: component anchor expressions return locally and reject external from parameters`, () => {
    const root = parsedComponents.get(componentFiles[id]);
    const lessonCall = nodes(root, node => ts.isCallExpression(node) && node.expression.getText(root) === "returnLesson");
    assert.equal(lessonCall.length, 1, componentFiles[id]);
    for (const deployment of deployments) for (const from of ["", ...Object.keys(lessons), "https://evil.test/", "//evil.test/", "javascript:alert(1)", "../evil", "constructor"]) {
      const url = entryAt(deployment);
      url.hash = id;
      if (from) url.searchParams.set("from", from);
      const mainSite = mainSiteAt(url.href);
      const context = { id, mainSite, returnLesson, location: url, globalThis: { location: url }, window: { location: url },
        workshop: foundationWorkshops[id], activity: activities[id] };
      const lesson = evaluate(lessonCall[0].getText(root), context);
      assert.equal(lesson, Object.hasOwn(lessons, from) ? from : defaultLesson(id));
      Object.assign(context, { lesson, lessonLink: `${mainSite}#/learn/${lesson}`, lessonHref: `${mainSite}#/learn/${lesson}`, fullTool: undefined });
      const fullTool = nodes(root, node => ts.isVariableDeclaration(node) && node.name.getText(root) === "fullTool")[0];
      if (fullTool) context.fullTool = evaluate(`(${fullTool.initializer.getText(root)})`, context);
      const anchors = internalAnchors(root, context).filter(href => !href.includes("undefined"));
      assert.ok(anchors.some(href => href === `${mainSite}#/learn/${lesson}`));
      assert.ok(anchors.includes("#pracownia"));
      for (const href of anchors) {
        const target = new URL(href, url);
        sameHost(target, url);
        if (target.hash === "" && target.pathname === new URL(mainSite).pathname) {
          assert.equal(target.search, "", "the app-logo return must not retain a workshop query");
        } else if (target.hash.startsWith("#/")) {
          assert.equal(target.pathname, new URL(mainSite).pathname, href);
          assert.ok(/^#\/(?:learn(?:\/[^/]+)?|layers(?:\/(?:metar|lab|wind|hazards|sounding))?)$/.test(target.hash), href);
        } else {
          assert.equal(target.pathname, url.pathname, href);
          assert.ok(target.hash === "#pracownia" || ids.includes(target.hash.slice(1)), href);
        }
      }
    }
  });
}

test("Wind's actual crosslink retains index.html on Capacitor; directory query links would not", async () => {
  const wind = parsedComponents.get("WindWorkshop.jsx");
  const link = internalAnchors(wind, { mainSite: "../", lesson: "wiatr" }).find(href => new URL(href, "https://example.test/index.html").hash === "#bryza");
  assert.ok(link, "the completed Wind case must offer the breeze continuation");
  for (const deployment of deployments) {
    const start = entryAt(deployment);
    start.search = "?from=zagrozenia"; start.hash = "wiatr";
    const target = new URL(link, start);
    assert.equal(target.pathname, start.pathname);
    assert.equal(target.search, "?from=wiatr");
    assert.equal(routeAt(target.href).type, "FoundationWorkshop");
    assert.equal(routeAt(target.href).props.id, "bryza");
    assert.equal(returnLesson(target.search, "procesy"), "wiatr");
  }
  const handler = await read("node_modules/@capacitor/ios/Capacitor/Capacitor/WebViewAssetHandler.swift");
  const router = await read("node_modules/@capacitor/ios/Capacitor/Capacitor/Router.swift");
  assert.match(handler, /let stringToLoad = url\.path/);
  assert.match(handler, /router\.route\(for: stringToLoad\)/);
  assert.match(router, /if pathUrl\.pathExtension\.isEmpty\s*\{\s*return basePath \+ "\/index.html"/);
  assert.match(router, /return basePath \+ path/);
  const capacitorPath = url => extname(url.pathname) ? url.pathname : "/index.html";
  const start = new URL("capacitor://localhost/pogoda-preview/index.html?from=wiatr#wiatr");
  assert.equal(capacitorPath(new URL(link, start)), "/pogoda-preview/index.html");
  assert.equal(capacitorPath(new URL("./?from=wiatr#bryza", start)), "/index.html");
  assert.equal(capacitorPath(new URL("../#/learn/wiatr", start)), "/index.html");
});

test("standalone preview has an explicit external Pages return; bundled native returns stay local", async () => {
  assert.equal(mainSiteAt("http://localhost:4199/index.html?from=wiatr#bryza"), "https://jakiesluchawki.github.io/chmurnik/");
  assert.equal(mainSiteAt("capacitor://localhost/pogoda-preview/index.html?from=wiatr#bryza"), "capacitor://localhost/");
  const delegation = await read("node_modules/@capacitor/ios/Capacitor/Capacitor/WebViewDelegationHandler.swift");
  assert.match(delegation, /navURL\.absoluteString\.starts\(with: bridge\.config\.localURL\.absoluteString\)/);
  assert.match(delegation, /if !isApplicationNavigation, toplevelNavigation/);
  assert.match(delegation, /UIApplication\.shared\.open\(navURL/);
  const config = await read("capacitor.config.ts");
  assert.doesNotMatch(config, /allowNavigation|server\s*:/);
});

async function tree(directory, prefix = "") {
  const files = new Map();
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      for (const [name, bytes] of await tree(new URL(`${entry.name}/`, directory), `${prefix}${entry.name}/`)) files.set(name, bytes);
    } else if (entry.isFile()) files.set(`${prefix}${entry.name}`, await readFile(new URL(entry.name, directory)));
  }
  return files;
}
const sourceAssets = new Map([...await tree(new URL("../weather-preview/public/", import.meta.url))].map(([file, bytes]) => [`./${file}`, bytes]));
sourceAssets.set("./wordmark.png", await readFile(new URL("../public/brand/chmurnik-wordmark.png", import.meta.url)));
for (const cloud of clouds) {
  const image = cloud.images[0];
  sourceAssets.set(`./photos/${image.src.split("/").pop()}`, await readFile(new URL(`../public/${image.src}`, import.meta.url)));
}
sourceAssets.set("./photos/observation.jpg", await readFile(new URL("../public/assets/clouds/stratocumulus-jastrzebie.jpg", import.meta.url)));
const originals = new Map(clouds.flatMap(cloud => cloud.images.map(image => [image.page, image.src])));
for (const task of Object.values(transferCases).flat()) for (const image of task.images ?? (task.image ? [task.image] : [])) {
  sourceAssets.set(image.src, await readFile(new URL(`../public/${originals.get(image.sourceUrl)}`, import.meta.url)));
}

test("all covers, shared diagram images and transfer photos resolve within the workshop directory", async () => {
  assert.deepEqual(Object.keys(catalogArtwork).sort(), ids);
  for (const art of Object.values(catalogArtwork)) assert.ok(sourceAssets.has(art.src), art.src);
  for (const file of ["Scenes.jsx", ...new Set(Object.values(componentFiles))]) {
    const source = parsedComponents.get(file) ?? parse(file, await read(`weather-preview/learning/${file}`));
    for (const literal of nodes(source, ts.isStringLiteralLike)) {
      if (!/\.(?:webp|png|jpg)$/.test(literal.text) || /^https?:/.test(literal.text)) continue;
      assert.ok(sourceAssets.has(literal.text), `${file}: ${literal.text}`);
    }
  }
  for (const deployment of deployments) for (const asset of sourceAssets.keys()) {
    const entry = entryAt(deployment), resource = new URL(asset, entry);
    sameHost(resource, entry);
    assert.ok(resource.pathname.startsWith(new URL("./", entry).pathname));
    assert.equal(resource.search, ""); assert.equal(resource.hash, "");
    assert.notEqual(extname(resource.pathname), "", "native assets must not hit the extensionless app fallback");
  }
  const previewConfig = await read("weather-preview/vite.config.mjs");
  assert.match(previewConfig, /base:\s*"\.\/"/);
  assert.doesNotMatch(await read("weather-preview/index.html"), /<base\b/i);
});

for (const folder of ["build/weather-bundle", "dist/pogoda-preview", "ios/App/App/public/pogoda-preview"]) {
  test(`${folder}: existing packaged HTML, lazy chunks, CSS/font URLs and art have local files (read-only)`, async t => {
    const directory = new URL(`../${folder}/`, import.meta.url);
    let files;
    try { files = await tree(directory); } catch (error) { if (error.code === "ENOENT") return t.skip("No existing package; this audit never builds one."); throw error; }
    const html = files.get("index.html")?.toString();
    assert.ok(html, "explicit workshop HTML is required");
    assert.doesNotMatch(html, /<base\b/i);
    for (const [path, expected] of sourceAssets) {
      assert.ok(files.has(path.slice(2)), `${folder}/${path}`);
      assert.ok(files.get(path.slice(2)).equals(expected), `copied source differs: ${folder}/${path}`);
    }
    const relativeReferences = [];
    for (const element of attributes(html, ["link", "script"])) {
      const href = element.src ?? element.href;
      if (href) relativeReferences.push({ href, owner: "index.html" });
    }
    for (const [file, bytes] of files) {
      if (file.endsWith(".css")) postcss.parse(bytes.toString(), { from: file }).walkDecls(declaration => {
        for (const match of declaration.value.matchAll(/url\(\s*["']?([^\s"')]+)["']?\s*\)/g)) {
          if (!/^(?:data:|#)/.test(match[1])) relativeReferences.push({ href: match[1], owner: file });
        }
      });
      if (file.endsWith(".js")) for (const literal of nodes(parse(file, bytes.toString()), ts.isStringLiteralLike)) {
        if (/^(?:\.\/|\.\.\/|\/|https?:\/\/).+\.(?:js|css)$/.test(literal.text)) relativeReferences.push({ href: literal.text, owner: file });
        if (/^(?:\.\/|\.\.\/|\/).+\.(?:webp|png|jpg|svg|avif)$/.test(literal.text)) relativeReferences.push({ href: literal.text, owner: "index.html" });
      }
    }
    assert.ok(relativeReferences.some(({ href }) => /\.woff2$/.test(href)), "compiled font references must be inspected");
    assert.ok(relativeReferences.some(({ href }) => /WindWorkshop.+\.js$/.test(href)), "the lazy Wind chunk must be inspected");
    for (const deployment of deployments) {
      const entry = entryAt(deployment), packageRoot = new URL("./", entry);
      for (const { href, owner } of relativeReferences) {
        assert.ok(!/^[/]|^[a-z]+:/i.test(href), `${owner} contains a non-relative runtime asset: ${href}`);
        const target = new URL(href, new URL(owner, packageRoot));
        sameHost(target, entry);
        assert.ok(target.pathname.startsWith(packageRoot.pathname), `${owner}: ${href}`);
        const file = decodeURIComponent(target.pathname.slice(packageRoot.pathname.length));
        assert.ok(files.has(file), `${folder}/${owner} -> ${href} -> missing ${file}`);
      }
    }
    if (files.has("bundle-manifest.json")) {
      const manifest = JSON.parse(files.get("bundle-manifest.json"));
      assert.equal(manifest.entry, "index.html");
      for (const [file, digest] of Object.entries(manifest.files)) {
        assert.ok(files.has(file), file);
        assert.equal(createHash("sha256").update(files.get(file)).digest("hex"), digest, file);
      }
    }
    t.diagnostic(`${files.size} existing files; ${sourceAssets.size} copied artwork/photo files; ${relativeReferences.length} HTML/module/CSS/image references checked. index.html SHA256: ${createHash("sha256").update(files.get("index.html")).digest("hex")}`);
  });
}
