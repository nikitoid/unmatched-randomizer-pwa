const CACHE_NAME = 'randomatched-cache-v1';
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/css/style.css',
    '/js/app.js',
    '/manifest.json',
    '/assets/icons/icon-192.png',
    '/assets/icons/icon-512.png',
    '/assets/icons/apple-touch-icon.png'
];

// Install: Cache all static assets
self.addEventListener('install', event => {
    console.log('[SW] Install');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('[SW] Caching all: app shell and content');
                return cache.addAll(STATIC_ASSETS);
            })
            .then(() => self.skipWaiting())
    );
});

// Activate: Clean up old caches
self.addEventListener('activate', event => {
    console.log('[SW] Activate');
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cache => {
                    if (cache !== CACHE_NAME) {
                        console.log('[SW] Deleting old cache:', cache);
                        return caches.delete(cache);
                    }
                })
            );
        })
    );
    return self.clients.claim();
});

// Fetch: Serve from cache first (Cache-First strategy)
self.addEventListener('fetch', event => {
    // We only want to cache GET requests
    if (event.request.method !== 'GET') {
        return;
    }

    event.respondWith(
        caches.open(CACHE_NAME).then(cache => {
            return cache.match(event.request).then(response => {
                // If the resource is in the cache, serve it from there
                if (response) {
                    // In the background, fetch a fresh version from the network and update the cache
                    const fetchPromise = fetch(event.request).then(networkResponse => {
                        cache.put(event.request, networkResponse.clone());
                        return networkResponse;
                    });
                    // Return the cached response immediately
                    return response;
                }

                // If the resource is not in the cache, fetch it from the network
                return fetch(event.request).then(networkResponse => {
                    // Cache the new resource for future use
                    cache.put(event.request, networkResponse.clone());
                    return networkResponse;
                }).catch(error => {
                    console.log('[SW] Fetch failed; returning offline page instead.', error);
                    // Optionally, return a fallback offline page
                    // return caches.match('/offline.html');
                });
            });
        })
    );
});
