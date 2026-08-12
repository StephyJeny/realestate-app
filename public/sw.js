const CACHE_NAME = "estatevue-v1";
const STATIC_ASSETS = [
    "/",
    "/offline",
    "/manifest.json",
];

// Install: Cache essential static assets
self.addEventListener("install", (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(STATIC_ASSETS);
        })
    );
    self.skipWaiting();
});

// Activate: Clean up old caches
self.addEventListener("activate", (event) => {
    event.waitUntil(
        caches.keys().then((keys) =>
            Promise.all(
                keys
                    .filter((key) => key !== CACHE_NAME)
                    .map((key) => caches.delete(key))
            )
        )
    );
    self.clients.claim();
});

// Fetch: Network-first with cache fallback
self.addEventListener("fetch", (event) => {
    const { request } = event;

    // Skip non-GET requests
    if (request.method !== "GET") return;

    // Skip API calls and Firebase requests
    if (
        request.url.includes("/api/") ||
        request.url.includes("firestore.googleapis.com") ||
        request.url.includes("firebase") ||
        request.url.includes("googleapis.com") ||
        request.url.includes("emailjs.com")
    ) {
        return;
    }

    // For navigation requests (HTML pages)
    if (request.mode === "navigate") {
        event.respondWith(
            fetch(request)
                .then((response) => {
                    // Cache the page for offline use
                    const clone = response.clone();
                    caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
                    return response;
                })
                .catch(() => {
                    // If offline, try cache first, then show offline page
                    return caches.match(request).then((cached) => {
                        return cached || caches.match("/offline");
                    });
                })
        );
        return;
    }

    // For static assets (CSS, JS, images): Cache-first strategy
    if (
        request.url.match(/\.(css|js|png|jpg|jpeg|webp|avif|svg|woff2?)$/) ||
        request.url.includes("/_next/static/")
    ) {
        event.respondWith(
            caches.match(request).then((cached) => {
                if (cached) return cached;
                return fetch(request).then((response) => {
                    const clone = response.clone();
                    caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
                    return response;
                });
            })
        );
        return;
    }

    // Default: Network first, cache fallback
    event.respondWith(
        fetch(request)
            .then((response) => {
                const clone = response.clone();
                caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
                return response;
            })
            .catch(() => caches.match(request))
    );
});
