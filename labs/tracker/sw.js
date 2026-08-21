// Tracker App Service Worker
// Network-first for HTML, cache-first for assets

const CACHE_NAME = 'tracker-v12';
const PRECACHE_URLS = [
    './js/main.js'
];

self.addEventListener('install', event => {
    self.skipWaiting();
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => cache.addAll(PRECACHE_URLS)).catch(() => { })
    );
});

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(keys => Promise.all(
            keys.map(k => {
                if (!k.startsWith('tracker-')) return caches.delete(k);
                return Promise.resolve();
            })
        )).then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', event => {
    const req = event.request;
    const url = new URL(req.url);

    event.respondWith((async () => {
        try {
            // Navigation requests (HTML): network-first, fallback to cache
            if (req.mode === 'navigate') {
                try {
                    const networkRes = await fetch(req);
                    if (networkRes && networkRes.ok) {
                        // Update cache with fresh content
                        const cache = await caches.open(CACHE_NAME);
                        cache.put(req, networkRes.clone());
                        return networkRes;
                    }
                } catch (e) {
                    // Network failed, try cache
                }
                const cached = await caches.match(req);
                if (cached) return cached;
                return new Response('Offline', { status: 503 });
            }

            // Same-origin assets: cache-first, fallback to network
            if (url.origin === self.location.origin) {
                const cached = await caches.match(req).catch(() => null);
                if (cached) return cached;
                try {
                    const resp = await fetch(req);
                    if (resp && resp.ok) {
                        const cache = await caches.open(CACHE_NAME);
                        cache.put(req, resp.clone());
                    }
                    return resp;
                } catch (e) {
                    return new Response('Offline', { status: 503 });
                }
            }

            // Cross-origin: network only
            return await fetch(req);
        } catch (error) {
            return new Response('Service unavailable', { status: 503 });
        }
    })());
});
