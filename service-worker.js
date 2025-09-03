const CACHE_NAME = "unmatched-randomizer-cache-v1";
const urlsToCache = [
  "/",
  "/index.html",
  "/style.css",
  "/app.js",
  "/manifest.json",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "https://code.jquery.com/jquery-3.7.1.min.js",
];

// Установка Service Worker и кэширование статических ресурсов
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("Кэш открыт");
      return cache.addAll(urlsToCache);
    })
  );
});

// Активация Service Worker и удаление старых кэшей
self.addEventListener("activate", (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Перехват сетевых запросов
self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      // Если ресурс найден в кэше, возвращаем его
      if (response) {
        return response;
      }

      // В противном случае, делаем запрос к сети
      return fetch(event.request);
    })
  );
});
