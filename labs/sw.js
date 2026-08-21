// sw.js - Minimal Service Worker for Labs PWA
self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(PRECACHE_URLS)).catch(() => { })
  );
});

self.addEventListener('activate', event => {
  const keep = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.map(k => { if (!keep.includes(k)) return caches.delete(k); return Promise.resolve(); })
    )).then(() => self.clients.claim())
  );
});

const CACHE_NAME = 'labs-static-v2';
const PRECACHE_URLS = [
  '/labs/',
  '/labs/index.html',
  '/design-system/iframe.html',
  '/design-system/main.css',
  '/design-system/storybook-theme-fixes.css'
];

self.addEventListener('fetch', event => {
  const req = event.request;

  // Always respondWith a promise that resolves to a Response.
  event.respondWith((async () => {
    try {
      // Navigation requests: network-first then fallback to cached index
      if (req.mode === 'navigate') {
        try {
          const networkRes = await fetch(req);
          if (networkRes) return networkRes;
        } catch (e) {
          // fall through to cache fallback
        }
        const cachedIndex = await caches.match('/labs/index.html').catch(() => null);
        if (cachedIndex) return cachedIndex;
        const cachedRoot = await caches.match('/labs/').catch(() => null);
        if (cachedRoot) return cachedRoot;
        return new Response('<!doctype html><title>Offline</title><h1>Offline</h1>', { headers: { 'Content-Type': 'text/html' }, status: 503 });
      }

      // For same-origin requests, use cache-first for better offline behavior
      if (new URL(req.url).origin === self.location.origin) {
        const cached = await caches.match(req).catch(() => null);
        if (cached) return cached;
        try {
          const resp = await fetch(req);
          // Only attempt to cache successful responses
          if (resp && resp.ok) {
            const copy = resp.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(req, copy)).catch(() => { });
          }
          if (resp) return resp;
        } catch (e) {
          // fall through to fallback below
        }
        const fallback = await caches.match('/labs/index.html').catch(() => null);
        if (fallback) return fallback;
        return new Response('Service unavailable', { status: 503 });
      }

      // Cross-origin or other requests: proxy to network (do not try to cache opaque responses)
      try {
        const networkResp = await fetch(req);
        return networkResp;
      } catch (e) {
        // Last resort fallback
        const fallback = await caches.match('/labs/index.html').catch(() => null);
        if (fallback) return fallback;
        return new Response('Service unavailable', { status: 503 });
      }
    } catch (err) {
      // Ensure we always resolve with a Response
      const fallback = await caches.match('/labs/index.html').catch(() => null);
      if (fallback) return fallback;
      return new Response('Service unavailable', { status: 503 });
    }
  })());
});
