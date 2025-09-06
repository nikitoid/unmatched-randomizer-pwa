// Меняем версию кэша, чтобы спровоцировать обновление
const CACHE_NAME = "randomatched-cache-v4"; // Версия изменена
const urlsToCache = [
  "/",
  "/index.html",
  "/css/style.css",
  "/js/app.js",
  "/manifest.json",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/apple-touch-icon.png",
  // --- Добавленные модули для кэширования ---
  "/js/modules/generator.js",
  "/js/modules/listManager.js",
  "/js/modules/modal.js",
  "/js/modules/results.js",
  "/js/modules/storage.js",
  "/js/modules/theme.js",
  "/js/modules/toast.js",
  "/js/modules/firebase.js", // --- Новый файл ---
  "/js/modules/auth.js", // --- Новый файл ---
];

// Установка Service Worker и кэширование статических файлов
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        console.log("Кэш открыт");
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log(
          "Service Worker: пропуск ожидания и немедленная активация."
        );
        return self.skipWaiting();
      })
  );
  console.log("Service Worker: установлен");
});

// Активация Service Worker и удаление старых кэшей
self.addEventListener("activate", (event) => {
  console.log("Service Worker: активирован");
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
  return self.clients.claim();
});

// Обработка запросов (стратегия "Cache First")
self.addEventListener("fetch", (event) => {
  // Игнорируем запросы к Firebase, чтобы они всегда шли в сеть
  if (event.request.url.includes("firebase")) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
