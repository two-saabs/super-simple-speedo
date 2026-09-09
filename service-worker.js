const CACHE_VERSION = "frenano-v__APP_VERSION__-rebrand-20260909-v1";
const APP_SHELL = [
  "/app/",
  "/manifest.webmanifest",
  "/images/frenano-website-icon-512.png",
  "/images/frenano-hero-background.jpg",
  "/images/frenano-feature-free.svg",
  "/images/frenano-feature-simple.svg",
  "/images/frenano-feature-private.svg",
  "/images/frenano-feature-switzerland.svg"
];

self.addEventListener("install", event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_VERSION)
      .then(cache => cache.addAll(APP_SHELL))
      .catch(() => undefined)
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys
          .filter(key => (key.startsWith("super-simple-speedo-") || key.startsWith("frenano-")) && key !== CACHE_VERSION)
          .map(key => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("message", event => {
  if (event.data?.type === "SKIP_WAITING") self.skipWaiting();
});

self.addEventListener("fetch", event => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);

  // Never cache location-bearing or cross-origin API requests.
  if (url.origin !== self.location.origin || url.hostname === "api.geoapify.com" || url.hostname === "transport.opendata.ch") return;

  // Brand and website imagery are network-first so releases cannot be trapped behind old assets.
  if (url.pathname.startsWith("/images/")) {
    event.respondWith(
      fetch(request, { cache: "no-store" })
        .then(response => {
          if (response.ok && response.type === "basic") {
            const copy = response.clone();
            caches.open(CACHE_VERSION).then(cache => cache.put(request, copy));
          }
          return response;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  // Navigation is network-first. Cache each actual destination separately so / and /app/ cannot overwrite each other.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request, { cache: "no-store" })
        .then(response => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(CACHE_VERSION).then(cache => cache.put(request, copy));
          }
          return response;
        })
        .catch(() => caches.match(request).then(cached => cached || caches.match(url.pathname === "/app/" ? "/app/" : "/")))
    );
    return;
  }

  event.respondWith(
    caches.match(request).then(cached => cached || fetch(request).then(response => {
      if (response.ok && response.type === "basic") {
        const copy = response.clone();
        caches.open(CACHE_VERSION).then(cache => cache.put(request, copy));
      }
      return response;
    }))
  );
});
