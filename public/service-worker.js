const CACHE_PREFIX = "chmurnik-";
const BUILD_VERSION = "__CHMURNIK_BUILD_VERSION__";
const VERSION = `${CACHE_PREFIX}${BUILD_VERSION.includes("__CHMURNIK") ? "development" : BUILD_VERSION}`;
const BASE = new URL("./", self.location.href).pathname;
const RUNTIME_ASSETS = /* __CHMURNIK_RUNTIME_ASSETS__ */ [];
const ATLAS_HASHES = /* __CHMURNIK_ATLAS_HASHES__ */ {};
const CLOUD_PHOTOS = [
  "altocumulus-lenticularis-nyons.jpg",
  "altocumulus-mackerel.jpg",
  "altocumulus.jpg",
  "altostratus-sterling.jpg",
  "altostratus-undulatus-dulles.jpg",
  "altostratus.jpg",
  "cirrocumulus-bergsfjorden.jpg",
  "cirrocumulus-tallinn.jpg",
  "cirrocumulus.jpg",
  "cirrostratus-elko.jpg",
  "cirrostratus-faint-halo.jpg",
  "cirrostratus.jpg",
  "cirrus-elko.jpg",
  "cirrus-uncinus-new-jersey.jpg",
  "cirrus.jpg",
  "cumulonimbus-calvus.jpg",
  "cumulonimbus-incus-krakow.jpg",
  "cumulonimbus.jpg",
  "cumulus-humilis-schwarzwald.jpg",
  "cumulus-mediocris.jpg",
  "cumulus.jpg",
  "nimbostratus-hockenheim-1.jpg",
  "nimbostratus-hockenheim-2.jpg",
  "nimbostratus.jpg",
  "stratocumulus-ewing.jpg",
  "stratocumulus-jastrzebie.jpg",
  "stratocumulus.jpg",
  "stratus-sterling.jpg",
  "stratus-virga-elko.jpg",
  "stratus.jpg",
];
const APP_SHELL = [
  BASE,
  `${BASE}manifest.webmanifest`,
  `${BASE}assets/atmosphere-still-life-960.avif`,
  `${BASE}assets/observer-guide-still-life-720.avif`,
  `${BASE}assets/observer-guide-still-life-720.webp`,
  `${BASE}fonts/Roobert-Regular.woff2`,
  `${BASE}fonts/Roobert-Bold.woff2`,
  `${BASE}fonts/Roobert-RegularItalic.woff2`,
  `${BASE}fonts/Romie-Regular.woff2`,
  `${BASE}brand/chmurnik-wordmark.png`,
  `${BASE}icons/icon-192.png`,
  ...RUNTIME_ASSETS.map((file) => `${BASE}${file}`),
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(VERSION).then((cache) => cache.addAll(APP_SHELL)));
});

async function activateVersion() {
  const previous = [];
  for (const key of await caches.keys()) {
    if (!key.startsWith(CACHE_PREFIX) || key === VERSION) continue;
    const cache = await caches.open(key);
    if (await cache.match(BASE)) previous.push({ key, cache });
  }
  const current = await caches.open(VERSION);
  // Retain downloaded atlas photos only when their bytes match this release.
  // Complete every copy before deleting old caches, including on quota failure.
  for (const file of CLOUD_PHOTOS) {
    if (!ATLAS_HASHES[file]) continue;
    const url = `${BASE}assets/clouds/${file}`;
    for (const { cache } of previous) {
      const response = await cache.match(url);
      if (!response?.ok) continue;
      const digest = await crypto.subtle.digest("SHA-256", await response.clone().arrayBuffer());
      const hash = [...new Uint8Array(digest)].map(value => value.toString(16).padStart(2, "0")).join("");
      if (hash !== ATLAS_HASHES[file]) continue;
      await current.put(url, response);
      break;
    }
  }
  await Promise.all(previous.map(({ key }) => caches.delete(key)));
  await self.clients.claim();
}

self.addEventListener("activate", (event) => {
  event.waitUntil(activateVersion());
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") {
    self.skipWaiting();
    return;
  }
  if (event.data?.type !== "CACHE_ATLAS") return;

  event.waitUntil(
    caches.open(VERSION)
      .then((cache) => cache.addAll(CLOUD_PHOTOS.map((file) => `${BASE}assets/clouds/${file}`)))
      .then(() => event.source?.postMessage({ type: "CHMURNIK_ATLAS_CACHED" }))
      .catch(() => event.source?.postMessage({ type: "CHMURNIK_ATLAS_CACHE_FAILED" })),
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET" || new URL(event.request.url).origin !== self.location.origin) {
    return;
  }

  if (event.request.mode === "navigate") {
    event.respondWith(fetch(event.request).catch(() => caches.match(BASE)));
    return;
  }

  event.respondWith(caches.match(event.request).then((cached) => {
    if (cached) return cached;
    return fetch(event.request)
      .then((response) => {
        if (response.ok) {
          const copy = response.clone();
          event.waitUntil(caches.open(VERSION).then((cache) => cache.put(event.request, copy)));
        }
        return response;
      })
      .catch(() => Response.error());
  }));
});
