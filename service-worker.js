// service-worker.js - Упрощенная версия для работы с Firebase

// Мы используем v2, чтобы Service Worker гарантированно обновился
const CACHE_NAME = "unmatched-randomizer-v1";
const URLS_TO_CACHE = [
  "/",
  "/index.html",
  "/style.css",
  "/app.js", // Важно кэшировать основной скрипт приложения
  "https://code.jquery.com/jquery-3.6.0.min.js",
  "https://cdn.tailwindcss.com",
  "//unpkg.com/alpinejs",
  "/manifest.json",
  "/icons/apple-touch-icon.png",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
];

// Установка: кэшируем основные файлы приложения (app shell)
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        console.log("Opened cache for app shell");
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
              console.log("Deleting old cache:", cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => self.clients.claim())
  );
});

// Fetch: используем стратегию "Cache first" для всех запросов.
// Firebase сам управляет своим сетевым соединением и оффлайн-кэшем.
self.addEventListener("fetch", (event) => {
  // Игнорируем запросы к Firebase, чтобы не мешать его оффлайн-механизму
  if (event.request.url.includes("firestore.googleapis.com")) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
