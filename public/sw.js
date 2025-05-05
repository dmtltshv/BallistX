import * as serviceWorkerRegistration from './serviceWorkerRegistration';

const CACHE_NAME = "ballistic-calculator-v3";
const OFFLINE_URL = "/offline.html";
const PRECACHE_ASSETS = [
  "/",
  "/index.html",
  "/static/js/bundle.js",
  "/static/css/main.css",
  "/icons/icon-192.png",
  OFFLINE_URL,
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => name !== CACHE_NAME)
            .map((name) => caches.delete(name))
        );
      })
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  event.respondWith(
    (async () => {
      try {
        const networkResponse = await fetch(event.request);
        const responseClone = networkResponse.clone();

        if (networkResponse.ok && new URL(event.request.url).origin === location.origin) {
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone));
        }

        return networkResponse;
      } catch (error) {
        const cachedResponse = await caches.match(event.request);
        if (cachedResponse) return cachedResponse;

        if (event.request.headers.get("accept").includes("text/html")) {
          return caches.match(OFFLINE_URL);
        }

        return new Response("", {
          status: 408,
          statusText: "Network error",
        });
      }
    })()
  );
});