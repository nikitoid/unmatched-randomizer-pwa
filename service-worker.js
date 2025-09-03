// Имя кэша - версия увеличена для принудительного обновления
const CACHE_NAME = "unmatched-randomizer-v4";

// Файлы, которые нужно кэшировать. Путь '/' указывает на корневой index.html
const urlsToCache = [
  "/",
  "index.html",
  "style.css",
  "app.js",
  "manifest.json",
  "icons/icon-192.png",
  "icons/icon-512.png",
  "icons/icon-maskable-512.svg",
];

// Установка Service Worker и кэширование ресурсов
self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("Opened cache and caching files");
      return cache.addAll(urlsToCache);
    })
  );
});

// Активация Service Worker и удаление старого кэша
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((cacheName) => cacheName !== CACHE_NAME)
            .map((cacheName) => {
              console.log("Deleting old cache:", cacheName);
              return caches.delete(cacheName);
            })
        );
      })
      .then(() => self.clients.claim())
  );
});

// Обработка запросов (fetch) - стратегия "сначала кэш, потом сеть"
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((response) => {
      if (response) {
        return response; // Возвращаем из кэша, если найдено
      }
      return fetch(event.request); // Иначе идем в сеть
    })
  );
});
