const CACHE_PREFIX = "chmurnik-";
const VERSION = `${CACHE_PREFIX}v7`;
const BASE = new URL("./", self.location.href).pathname;
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
  `${BASE}assets/upper-atmosphere/nacreous-clouds-antarctica.jpg`,
  `${BASE}assets/upper-atmosphere/noctilucent-clouds-laboe.jpg`,
  `${BASE}assets/upper-atmosphere/polar-stratospheric-cloud-type-i.jpg`,
  `${BASE}icons/icon-192.png`,
  `${BASE}icons/icon-512.png`,
  ...CLOUD_PHOTOS.map((file) => `${BASE}assets/clouds/${file}`),
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(VERSION).then((cache) => cache.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(
        keys
          .filter((key) => key.startsWith(CACHE_PREFIX) && key !== VERSION)
          .map((key) => caches.delete(key)),
      )),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET" || new URL(event.request.url).origin !== self.location.origin) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      const network = fetch(event.request)
        .then((response) => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(VERSION).then((cache) => cache.put(event.request, copy));
          }
          return response;
        })
        .catch(() => cached || caches.match(BASE));

      return cached || network;
    }),
  );
});
