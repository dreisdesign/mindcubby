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
    caches.keys().then(keys => {
      console.log('[SW] Activation: Found caches:', keys);
      const toDelete = keys.filter(k => !keep.includes(k));
      console.log('[SW] Deleting old caches:', toDelete);
      return Promise.all(
        toDelete.map(k => {
          console.log('[SW] Deleting cache:', k);
          return caches.delete(k);
        })
      ).then(() => {
        console.log('[SW] Cache cleanup complete. Claiming clients.');
        return self.clients.claim();
      });
    })
  );
});

const CACHE_NAME = 'labs-static-v153';
const PRECACHE_URLS = [
  '/labs/',
  '/labs/index.html'
];

self.addEventListener('fetch', event => {
  const req = event.request;
  const url = new URL(req.url);
  const isSameOrigin = url.origin === self.location.origin;
  const isJS = req.destination === 'script' || url.pathname.endsWith('.js');
  const isCSS = req.destination === 'style' || url.pathname.endsWith('.css');

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

      // JavaScript and CSS: network-first to ensure fresh code/styles
      if (isSameOrigin && (isJS || isCSS)) {
        try {
          const resp = await fetch(req);
          if (resp && resp.ok) {
            const copy = resp.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(req, copy)).catch(() => { });
          }
          if (resp) return resp;
        } catch (e) {
          // Network failed, try cache
          const cached = await caches.match(req).catch(() => null);
          if (cached) return cached;
        }
        return new Response('Service unavailable', { status: 503 });
      }

      // For same-origin requests (non-JS/CSS), use cache-first for better offline behavior
      if (isSameOrigin) {
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
