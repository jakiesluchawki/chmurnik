import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import vm from "node:vm";
import { createHash, webcrypto } from "node:crypto";

const workerSource = await readFile(new URL("../public/service-worker.js", import.meta.url), "utf8");

function createWorkerHarness({ base = "/chmurnik/", online = true, photoHashes = {}, failPut = false } = {}) {
  const origin = "https://example.test";
  const listeners = new Map();
  const stores = new Map();
  const messages = [];
  let connected = online;

  const key = (request) => {
    const value = typeof request === "string" ? request : request.url;
    return new URL(value, origin).pathname;
  };
  const content = (path) => path.endsWith(".js")
    ? new Response("export const ready = true", { headers: { "content-type": "text/javascript" } })
    : path.endsWith(".css")
      ? new Response("body { color: olive }", { headers: { "content-type": "text/css" } })
      : new Response(path === base ? "<main>CHMURNIK</main>" : path);

  const caches = {
    async open(name) {
      if (!stores.has(name)) stores.set(name, new Map());
      const store = stores.get(name);
      return {
        async addAll(paths) {
          for (const path of paths) {
            if (!connected) throw new Error("offline");
            store.set(key(path), content(key(path)));
          }
        },
        async put(request, response) {
          if (failPut) throw new Error("Cache write failed");
          store.set(key(request), response);
        },
        async match(request) {
          return store.get(key(request))?.clone();
        },
      };
    },
    async match(request) {
      for (const store of stores.values()) {
        if (store.has(key(request))) return store.get(key(request)).clone();
      }
      return undefined;
    },
    async keys() {
      return [...stores.keys()];
    },
    async delete(name) {
      return stores.delete(name);
    },
  };

  const self = {
    location: { href: `${origin}${base}service-worker.js`, origin },
    clients: { claim: async () => messages.push("claim") },
    skipWaiting: () => messages.push("skip-waiting"),
    addEventListener: (name, callback) => listeners.set(name, callback),
  };
  const source = workerSource
    .replace('"__CHMURNIK_BUILD_VERSION__"', '"test-build"')
    .replace(
      "/* __CHMURNIK_RUNTIME_ASSETS__ */ []",
      '["assets/app-test123.js","assets/app-test123.css"]',
    ).replace("/* __CHMURNIK_ATLAS_HASHES__ */ {}", JSON.stringify(photoHashes));
  vm.runInNewContext(source, {
    self,
    caches,
    URL,
    Response,
    crypto: webcrypto,
    Uint8Array,
    fetch: async (request) => {
      if (!connected) throw new Error("offline");
      return content(key(request));
    },
  });

  async function dispatch(name, fields = {}) {
    const pending = [];
    let response;
    const event = {
      ...fields,
      waitUntil: (promise) => pending.push(promise),
      respondWith: (promise) => { response = promise; },
    };
    listeners.get(name)?.(event);
    if (response) response = await response;
    await Promise.all(pending);
    return response;
  }

  return {
    stores,
    messages,
    dispatch,
    setOnline(value) { connected = value; },
  };
}

test("offline installation precaches the hashed JavaScript and CSS runtime", async () => {
  const worker = createWorkerHarness();
  await worker.dispatch("install");

  const stored = worker.stores.get("chmurnik-test-build");
  assert.ok(stored.has("/chmurnik/assets/app-test123.js"));
  assert.ok(stored.has("/chmurnik/assets/app-test123.css"));
  assert.ok(stored.has("/chmurnik/"));
  assert.ok(stored.has("/chmurnik/fonts/Roobert-RegularItalic.woff2"));
  assert.ok(stored.has("/chmurnik/brand/chmurnik-wordmark.png"));
  assert.equal([...stored.keys()].filter((path) => path.includes("/assets/clouds/")).length, 0);
});

test("offline navigation returns the app while missing scripts never receive HTML", async () => {
  const worker = createWorkerHarness();
  await worker.dispatch("install");
  worker.setOnline(false);

  const navigation = await worker.dispatch("fetch", {
    request: { url: "https://example.test/chmurnik/atlas", method: "GET", mode: "navigate" },
  });
  const runtime = await worker.dispatch("fetch", {
    request: { url: "https://example.test/chmurnik/assets/app-test123.js", method: "GET" },
  });
  const missing = await worker.dispatch("fetch", {
    request: { url: "https://example.test/chmurnik/assets/missing.js", method: "GET" },
  });

  assert.match(await navigation.text(), /CHMURNIK/);
  assert.match(await runtime.text(), /export const ready/);
  assert.equal(missing.type, "error");
});

test("complete atlas photographs download only after explicit consent", async () => {
  const worker = createWorkerHarness({ base: "/" });
  await worker.dispatch("install");
  await worker.dispatch("message", {
    data: { type: "CACHE_ATLAS" },
    source: { postMessage: (message) => worker.messages.push(message) },
  });

  const stored = worker.stores.get("chmurnik-test-build");
  assert.equal([...stored.keys()].filter((path) => path.includes("/assets/clouds/")).length, 30);
  assert.deepEqual(JSON.parse(JSON.stringify(worker.messages.at(-1))), {
    type: "CHMURNIK_ATLAS_CACHED",
  });
});

const photoHash = value => createHash("sha256").update(value).digest("hex");
function seedPrevious(worker, body = "unchanged atlas photo") {
  worker.stores.set("chmurnik-old", new Map([
    ["/chmurnik/", new Response("old shell")],
    ["/chmurnik/assets/clouds/cumulus.jpg", new Response(body)],
    ["/chmurnik/assets/old.js", new Response("old code")],
    ["/chmurnik/private-photo.jpg", new Response("must not migrate")],
  ]));
}

test("activation preserves only cached byte-identical atlas photos without downloading", async () => {
  const worker = createWorkerHarness({ photoHashes: { "cumulus.jpg": photoHash("unchanged atlas photo") } });
  await worker.dispatch("install");
  seedPrevious(worker);
  worker.stores.set("another-app", new Map([["/", new Response("unrelated")]]));
  worker.stores.set("chmurnik-other-scope", new Map([["/another/", new Response("different scope")]]));
  worker.setOnline(false);
  await worker.dispatch("activate");
  const current = worker.stores.get("chmurnik-test-build");
  assert.equal(await current.get("/chmurnik/assets/clouds/cumulus.jpg")?.text(), "unchanged atlas photo");
  assert.equal([...current.keys()].filter(key => key.includes("/assets/clouds/")).length, 1);
  assert.equal(current.has("/chmurnik/private-photo.jpg"), false);
  assert.equal(current.has("/chmurnik/assets/old.js"), false);
  assert.equal(worker.stores.has("chmurnik-old"), false);
  assert.equal(worker.stores.has("another-app"), true);
  assert.equal(worker.stores.has("chmurnik-other-scope"), true);
  assert.equal(worker.messages.at(-1), "claim");
});

test("changed or unmanifested atlas bytes are not carried into the new release", async () => {
  for (const photoHashes of [{ "cumulus.jpg": photoHash("new photograph") }, {}]) {
    const worker = createWorkerHarness({ photoHashes });
    await worker.dispatch("install");
    seedPrevious(worker);
    await worker.dispatch("activate");
    assert.equal(worker.stores.get("chmurnik-test-build").has("/chmurnik/assets/clouds/cumulus.jpg"), false);
  }
});

test("a failed atlas migration retains old caches and does not claim clients", async () => {
  const worker = createWorkerHarness({ photoHashes: { "cumulus.jpg": photoHash("unchanged atlas photo") }, failPut: true });
  await worker.dispatch("install");
  seedPrevious(worker);
  await assert.rejects(worker.dispatch("activate"), /Cache write failed/);
  assert.equal(worker.stores.has("chmurnik-old"), true);
  assert.equal(worker.messages.includes("claim"), false);
});
