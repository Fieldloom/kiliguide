const CACHE_NAME = "kiliguide-v2";
const STATIC_ASSETS = [
  "/",
  "/manifest.webmanifest",
  "/logo.png",
  "/dekut_logo.png",
  "/think_logo.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => console.warn("PWA pre-cache warning:", err));
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Only handle same-origin GET requests
  if (req.method !== "GET" || url.origin !== self.location.origin) {
    return;
  }

  // Next.js static assets & images: Cache-first with network fallback
  if (url.pathname.startsWith("/_next/static/") || url.pathname.match(/\.(png|jpg|jpeg|svg|gif|ico|css|js)$/)) {
    event.respondWith(
      caches.match(req).then((cached) => {
        if (cached) return cached;
        return fetch(req).then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, clone));
          }
          return response;
        }).catch(() => caches.match("/"));
      })
    );
    return;
  }

  // HTML pages & routes: Network-first with cache fallback for smooth offline browsing
  event.respondWith(
    fetch(req)
      .then((response) => {
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, clone));
        }
        return response;
      })
      .catch(() => {
        return caches.match(req).then((cached) => {
          if (cached) return cached;
          // Fallback to cached root/shell
          return caches.match("/");
        });
      })
  );
});

self.addEventListener("push", (event) => {
  const data = event.data ? event.data.json() : {};
  event.waitUntil(
    self.registration.showNotification(data.title || "KiliGuide", {
      body: data.body || "You have a campus update.",
      icon: "/logo.png",
      badge: "/logo.png",
      data: { url: data.url || "/portal/student" },
      tag: data.tag || "kiliguide-update",
      renotify: true,
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clients) => {
        const targetUrl = event.notification.data?.url || "/portal/student";
        const existing = clients.find((client) => client.url.includes(targetUrl));
        return existing ? existing.focus() : self.clients.openWindow(targetUrl);
      })
  );
});
