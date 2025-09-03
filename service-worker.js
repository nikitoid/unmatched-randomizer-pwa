const CACHE_NAME = "unmatched-randomizer-shell-v1";
const API_CACHE_NAME = "unmatched-randomizer-api-v1";
const URLS_TO_CACHE = [
  "/",
  "/index.html",
  "/style.css",
  "/app.js",
  "https://code.jquery.com/jquery-3.6.0.min.js",
  "https://cdn.tailwindcss.com",
  "//unpkg.com/alpinejs",
  "/manifest.json",
  "/icons/apple-touch-icon.png",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
];

// Установка Service Worker и кэширование статичных ресурсов
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("Opened cache for app shell");
      return cache.addAll(URLS_TO_CACHE);
    })
  );
});

// Активация Service Worker и очистка старых кэшей
self.addEventListener("activate", (event) => {
  const cacheWhitelist = [CACHE_NAME, API_CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log("Deleting old cache:", cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

// Перехват сетевых запросов
self.addEventListener("fetch", (event) => {
  const requestUrl = new URL(event.request.url);

  // Стратегия "Network first, falling back to cache" для API запросов
  if (requestUrl.pathname.startsWith("/api/")) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Если запрос успешен, клонируем ответ, кэшируем и возвращаем
          const responseToCache = response.clone();
          caches.open(API_CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
          return response;
        })
        .catch((error) => {
          // Если сеть недоступна, пытаемся отдать из кэша
          console.log(
            "Network request failed. Serving API from cache for:",
            event.request.url
          );
          return caches.match(event.request);
        })
    );
  } else {
    // Стратегия "Cache first, falling back to network" для всех остальных ресурсов
    event.respondWith(
      caches.match(event.request).then((response) => {
        return response || fetch(event.request);
      })
    );
  }
});
