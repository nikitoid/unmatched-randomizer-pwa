const CACHE_NAME = "randomatched-cache-v2";
// Кешируем основные ресурсы
const urlsToCache = [
  "/",
  "/index.html",
  "/app.js",
  "/style.css",
  "/manifest.json",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/apple-touch-icon.png",
  "https://cdn.tailwindcss.com",
  "https://code.jquery.com/jquery-3.6.0.min.js",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("Кеш открыт");
      return cache.addAll(urlsToCache);
    })
  );
  self.skipWaiting(); // Активируем SW немедленно
});

self.addEventListener("activate", (event) => {
  // Удаляем старые кеши
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
});

self.addEventListener("fetch", (event) => {
  // Стратегия: "Cache then Network" (Cache First)
  event.respondWith(
    caches.match(event.request).then((response) => {
      // Если ресурс есть в кеше, возвращаем его
      if (response) {
        return response;
      }
      // Иначе, делаем запрос к сети
      return fetch(event.request);
    })
  );
});
