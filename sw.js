// --- Service Worker ---

const CACHE_NAME = "randomatched-v3"; // Увеличиваем версию, чтобы SW обновился
const URLS_TO_CACHE = [
  // Локальные ассеты
  "/",
  "/index.html",
  "/style.css",
  "/app.js",
  "/manifest.json",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/apple-touch-icon.png",
  // Внешние CDN ассеты (будут кэшироваться при первом запросе)
];

const CDN_ORIGINS = [
  "https://code.jquery.com",
  "https://cdn.tailwindcss.com",
  "https://cdnjs.cloudflare.com",
  "https://www.gstatic.com",
];

// Установка: кэшируем только локальные файлы приложения
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        console.log("[SW] Opened cache. Caching app shell.");
        return cache.addAll(URLS_TO_CACHE);
      })
      .then(() => self.skipWaiting()) // Активируем новый SW сразу
  );
});

// Активация: удаляем старые кэши
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log("[SW] Deleting old cache:", cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => self.clients.claim())
  );
});

// Fetch: применяем разные стратегии
self.addEventListener("fetch", (event) => {
  const requestUrl = new URL(event.request.url);

  // Для CDN используем стратегию Stale-While-Revalidate
  if (CDN_ORIGINS.includes(requestUrl.origin)) {
    event.respondWith(
      caches.open(CACHE_NAME).then((cache) => {
        return cache.match(event.request).then((cachedResponse) => {
          const fetchPromise = fetch(event.request).then((networkResponse) => {
            // Клонируем ответ, так как его можно прочитать только один раз
            cache.put(event.request, networkResponse.clone());
            return networkResponse;
          });
          // Возвращаем из кэша немедленно, если есть, или ждем ответа от сети
          return cachedResponse || fetchPromise;
        });
      })
    );
    return;
  }

  // Для всех остальных (локальных) запросов используем Cache First
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
