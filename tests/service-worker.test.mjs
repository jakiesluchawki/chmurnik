import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import vm from "node:vm";

const workerSource = await readFile(new URL("../public/service-worker.js", import.meta.url), "utf8");

function createWorkerHarness({ base = "/chmurnik/", online = true } = {}) {
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
          store.set(key(request), response);
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
    clients: { claim: async () => {} },
    skipWaiting: () => messages.push("skip-waiting"),
    addEventListener: (name, callback) => listeners.set(name, callback),
  };
  const source = workerSource
    .replace('"__CHMURNIK_BUILD_VERSION__"', '"test-build"')
    .replace(
      "/* __CHMURNIK_RUNTIME_ASSETS__ */ []",
      '["assets/app-test123.js","assets/app-test123.css"]',
    );
  vm.runInNewContext(source, {
    self,
    caches,
    URL,
    Response,
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
