const CACHE_NAME = "randomatched-cache-v8";
const urlsToCache = [
  "/",
  "/index.html",
  "/css/style.css",
  "/js/app.js",
  "/manifest.json",
  "/icons/icon-192.png", // Убедитесь, что у вас есть эти файлы
  "/icons/icon-512.png",
  "/icons/apple-touch-icon.png",
];

// Установка Service Worker и кэширование статических файлов
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("Кэш открыт");
      return cache.addAll(urlsToCache);
    })
  );
  console.log("Service Worker: установлен");
});

// Активация Service Worker и удаление старых кэшей
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log("Service Worker: удаление старого кэша", cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  console.log("Service Worker: активирован");
  return self.clients.claim();
});

// Обработка запросов (стратегия "Cache First")
self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      // Если ресурс есть в кэше, возвращаем его
      if (response) {
        return response;
      }

      // В противном случае, делаем запрос к сети
      return fetch(event.request).then((networkResponse) => {
        // Проверяем, что ответ корректный
        if (
          !networkResponse ||
          networkResponse.status !== 200 ||
          networkResponse.type !== "basic"
        ) {
          return networkResponse;
        }

        // Клонируем ответ, так как его можно использовать только один раз
        const responseToCache = networkResponse.clone();

        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });

        return networkResponse;
      });
    })
  );
});
