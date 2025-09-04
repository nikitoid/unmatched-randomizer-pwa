// ИЗМЕНЕНО: Новая, более надежная версия сервис-воркера

const CACHE_NAME = "randomatched-cache-v4"; // Увеличиваем версию кэша для обновления
const FILES_TO_CACHE = [
  "/",
  "index.html",
  "style.css",
  "app.js",
  "manifest.json",
  "icons/apple-touch-icon.png",
  "icons/icon-192.png",
  "icons/icon-512.png",
  "https://cdn.tailwindcss.com",
  "https://unpkg.com/alpinejs", // Alpine.js теперь будет кэшироваться
  "https://code.jquery.com/jquery-3.6.0.min.js",
  "https://www.gstatic.com/firebasejs/9.6.10/firebase-app.js",
  "https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js",
];

self.addEventListener("install", (evt) => {
  evt.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("[ServiceWorker] Pre-caching offline files");
      return cache.addAll(FILES_TO_CACHE);
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", (evt) => {
  evt.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(
        keyList.map((key) => {
          if (key !== CACHE_NAME) {
            console.log("[ServiceWorker] Removing old cache", key);
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener("fetch", (evt) => {
  // Не кэшируем запросы к Firestore, у него свой оффлайн-механизм
  if (evt.request.url.includes("firestore.googleapis.com")) {
    return;
  }

  // Стратегия "Stale-While-Revalidate"
  // Сначала отдаем из кэша (для скорости), потом обновляем кэш из сети
  evt.respondWith(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.match(evt.request).then((cachedResponse) => {
        const fetchPromise = fetch(evt.request)
          .then((networkResponse) => {
            // Если получили хороший ответ, обновляем кэш
            if (networkResponse && networkResponse.status === 200) {
              cache.put(evt.request, networkResponse.clone());
            }
            return networkResponse;
          })
          .catch((err) => {
            // Если сеть не удалась, просто игнорируем ошибку (т.к. у нас уже есть ответ из кэша)
            console.warn(
              "[ServiceWorker] Fetch failed; returning cached response instead.",
              err
            );
          });

        // Возвращаем ответ из кэша немедленно, если он есть,
        // или ждем ответа от сети, если в кэше ничего нет.
        return cachedResponse || fetchPromise;
      });
    })
  );
});
