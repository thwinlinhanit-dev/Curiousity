// Offline cache for Curiousity. Bump CACHE when the build output changes.
const CACHE = "curiousity-v2";
const SHELL = "./";
const CORE = [SHELL, "./index.html", "./manifest.webmanifest"];

self.addEventListener("install", (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    await cache.addAll(CORE).catch(() => undefined);
    // Precache the hashed bundle and the classic vendor scripts by reading
    // them from the document — the first page load happens before we control
    // the page, so those requests are otherwise never cached.
    try {
      const res = await fetch("./index.html");
      const html = await res.text();
      const urls = [...html.matchAll(/(?:src|href)="([^"]+\.(?:js|css))"/g)]
        .map((m) => m[1].replace(/^\//, "./"))
        .filter((u) => u.startsWith("./"));
      await Promise.allSettled([...new Set(urls)].map((u) => cache.add(u)));
    } catch { /* offline install: the core shell still works */ }
    await self.skipWaiting();
  })());
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((k) => k.startsWith("curiousity-") && k !== CACHE).map((k) => caches.delete(k)));
    await self.clients.claim();
  })());
});

// The Offline tool posts a list of explicit section URLs to cache.
self.addEventListener("message", (event) => {
  const urls = event.data && event.data.urls;
  if (!Array.isArray(urls) || urls.length === 0) return;
  event.waitUntil(caches.open(CACHE).then((c) => Promise.allSettled(urls.map((u) => c.add(u)))));
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  const isNavigation = req.mode === "navigate";
  const isContent = url.pathname.endsWith(".json") || url.pathname.includes("/content/");

  if (isNavigation || isContent) {
    // Network-first: fresh content and fresh HTML, with an offline fallback.
    event.respondWith(fetch(req).then((res) => {
      if (res && res.status === 200) {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => undefined);
      }
      return res;
    }).catch(async () => (await caches.match(req)) || (isNavigation ? caches.match(SHELL) : Response.error())));
    return;
  }

  // Fingerprinted assets and vendor scripts are immutable: cache-first.
  event.respondWith(caches.match(req).then((hit) => hit || fetch(req).then((res) => {
    if (res && res.status === 200) {
      const copy = res.clone();
      caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => undefined);
    }
    return res;
  })));
});
