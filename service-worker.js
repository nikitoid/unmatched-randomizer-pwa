// ИЗМЕНЕНО: Финальная, надежная версия сервис-воркера

const CACHE_NAME = "randomatched-cache-v4"; // Увеличиваем версию кэша для обновления
// Добавляем точные URL библиотек, чтобы избежать редиректов
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
  "https://unpkg.com/alpinejs@3.13.10/dist/cdn.min.js",
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
    return; // Позволяем запросу идти напрямую в сеть
  }

  // Стратегия "Stale-While-Revalidate"
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
            // Если сеть недоступна, а в кэше ничего нет, запрос провалится.
            // Это нормально, т.к. cachedResponse будет возвращен, если он есть.
          });

        // Возвращаем ответ из кэша немедленно (если он есть),
        // и позволяем фоновому запросу обновить кэш на будущее.
        return cachedResponse || fetchPromise;
      });
    })
  );
});
