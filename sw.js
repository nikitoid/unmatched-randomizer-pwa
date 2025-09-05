const CACHE_NAME = "randomatched-cache-v3"; // Обновляем версию кэша
const urlsToCache = [
  "/",
  "/index.html",
  "/css/style.css",
  "/js/app.js",
  "/manifest.json",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/apple-touch-icon.png",
  "/js/modules/app.js",
  "/js/modules/auth.js",
  "/js/modules/firebase.js",
  "/js/modules/generator.js",
  "/js/modules/listManager.js",
  "/js/modules/modal.js",
  "/js/modules/results.js",
  "/js/modules/storage.js",
  "/js/modules/theme.js",
  "/js/modules/toast.js",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        console.log("Кэш открыт");
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        // Сообщаем клиентам, что кэширование завершено
        return self.clients.matchAll().then((clients) => {
          clients.forEach((client) =>
            client.postMessage({ type: "CACHE_UPDATED" })
          );
        });
      })
  );
  console.log("Service Worker: установлен");
});

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

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      if (response) {
        return response;
      }
      return fetch(event.request);
    })
  );
});
