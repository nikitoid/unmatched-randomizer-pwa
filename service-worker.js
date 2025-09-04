const CACHE_NAME = "randomatched-cache-v2";
// ИЗМЕНЕНО: Добавляем все необходимые для оффлайн-работы файлы, включая внешние
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
  // Удаляем старые кэши, чтобы приложение всегда использовало актуальную версию
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
  // Мы не кэшируем запросы к Firestore, так как у него свой оффлайн-механизм
  if (evt.request.url.includes("firestore.googleapis.com")) {
    return;
  }

  // Стратегия "Сначала кэш, потом сеть" для всех остальных запросов
  evt.respondWith(
    caches.match(evt.request).then((response) => {
      // Если ресурс найден в кэше, возвращаем его
      if (response) {
        return response;
      }
      // Иначе, идем в сеть
      return fetch(evt.request);
    })
  );
});
