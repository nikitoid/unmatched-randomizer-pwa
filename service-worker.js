// ИЗМЕНЕНО: Новая, более надежная версия сервис-воркера для оффлайн-запуска

const CACHE_NAME = "randomatched-cache-v3"; // Увеличиваем версию кэша для обновления
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
  "https://unpkg.com/alpinejs",
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

  // Стратегия "Сначала кэш, потом сеть" (Cache First).
  // Идеально для оффлайн-запуска.
  evt.respondWith(
    caches.match(evt.request).then((cachedResponse) => {
      // Если ресурс найден в кэше, немедленно возвращаем его.
      if (cachedResponse) {
        return cachedResponse;
      }
      // Если в кэше ничего нет, идем в сеть.
      return fetch(evt.request);
    })
  );
});
