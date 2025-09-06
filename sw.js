// Увеличиваем версию кэша, чтобы гарантировать обновление у всех пользователей
const CACHE_NAME = "randomatched-cache-v7";
const urlsToCache = [
  "/",
  "/index.html",
  "/css/style.css",
  "/js/app.js",
  "/manifest.json",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/apple-touch-icon.png",
  "/js/modules/generator.js",
  "/js/modules/listManager.js",
  "/js/modules/modal.js",
  "/js/modules/results.js",
  "/js/modules/storage.js",
  "/js/modules/theme.js",
  "/js/modules/toast.js",
  "/js/modules/firebase.js",
  "/js/modules/auth.js",
];

self.addEventListener("install", (event) => {
  console.log("Service Worker: установка");
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("Кэш открыт");
      return cache.addAll(urlsToCache);
    })
  );
});

self.addEventListener("activate", (event) => {
  console.log("Service Worker: активация");
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log("Service Worker: удаление старого кэша", cacheName);
            return caches.delete(cacheName);
          }
        })
      ).then(() => {
        console.log("Service Worker: клиенты взяты под контроль");
        return self.clients.claim();
      });
    })
  );
});

// Слушатель для принудительной активации нового SW
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    console.log("Service Worker: получен сигнал SKIP_WAITING");
    self.skipWaiting();
  }
});

self.addEventListener("fetch", (event) => {
  // Используем стратегию "Cache First" для всех запросов
  event.respondWith(
    caches.match(event.request).then((response) => {
      return (
        response ||
        fetch(event.request).catch((error) => {
          console.error(`Fetch failed for: ${event.request.url}`, error);
          // В случае ошибки сети можно вернуть запасной ответ, если это необходимо
        })
      );
    })
  );
});
