// Имя кэша
const CACHE_NAME = "unmatched-randomizer-v1";

// Файлы, которые нужно кэшировать (основные ресурсы)
const urlsToCache = [
  "/",
  "/index.html",
  "/style.css",
  "/app.js",
  "/manifest.json",
  "/icons/icon-192.svg",
  "/icons/icon-512.svg",
];

// Установка Service Worker и кэширование ресурсов
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("Opened cache");
      return cache.addAll(urlsToCache);
    })
  );
});

// Активация Service Worker и удаление старого кэша
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => cacheName !== CACHE_NAME)
          .map((cacheName) => caches.delete(cacheName))
      );
    })
  );
});

// Обработка запросов (fetch)
// Стратегия: "Cache first, falling back to network"
// Сначала ищем ресурс в кэше, если его там нет - идем в сеть.
self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      // Если ресурс найден в кэше, возвращаем его
      if (response) {
        return response;
      }

      // Если нет, делаем запрос к сети
      return fetch(event.request)
        .then((networkResponse) => {
          // Опционально: можно кэшировать новые запросы "на лету"
          // Но для простого приложения это может быть избыточно
          return networkResponse;
        })
        .catch((error) => {
          // Обработка ошибок сети, можно вернуть оффлайн-страницу
          console.error("Fetching failed:", error);
          throw error;
        });
    })
  );
});
