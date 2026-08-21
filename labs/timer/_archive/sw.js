const CACHE_NAME = "focus-timer-v2.4.0";
const urlsToCache = [
  "./",
  "./index.html",
  "./styles.css",
  "./favicon.svg",
  "./assets/focus-drums-25.mp3",
  "./assets/click-1.mp3",
  "./assets/click-2.mp3",
];

// Install event - cache resources
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        console.log("Opened cache");
        return cache.addAll(urlsToCache);
      })
      .catch((error) => {
        console.error("Failed to cache resources:", error);
      }),
  );
});

// Fetch event - serve from cache when offline
self.addEventListener("fetch", (event) => {
  event.respondWith((async () => {
    try {
      const cached = await caches.match(event.request);
      if (cached) return cached;
      const networkResp = await fetch(event.request);
      return networkResp;
    } catch (e) {
      if (event.request.destination === "document") {
        const fallback = await caches.match("./index.html").catch(() => null);
        if (fallback) return fallback;
      }
      return new Response('Service unavailable', { status: 503 });
    }
  })());
});

// Activate event - clean up old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log("Deleting old cache:", cacheName);
            return caches.delete(cacheName);
          }
        }),
      );
    }),
  );
});

// Handle background sync for timer state persistence (future enhancement)
self.addEventListener("sync", (event) => {
  if (event.tag === "timer-sync") {
    // Could implement timer state sync here
    console.log("Background sync triggered");
  }
});

// Handle push notifications (future enhancement)
self.addEventListener("push", (event) => {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body || "Timer notification",
      icon: "./favicon.svg",
      badge: "./favicon.svg",
      vibrate: [200, 100, 200],
      data: data.data || {},
      actions: [
        {
          action: "view",
          title: "View Timer",
        },
      ],
    };

    event.waitUntil(
      self.registration.showNotification(data.title || "Focus Timer", options),
    );
  }
});

// Handle notification clicks
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  if (event.action === "view" || !event.action) {
    event.waitUntil(clients.openWindow("./"));
  }
});
