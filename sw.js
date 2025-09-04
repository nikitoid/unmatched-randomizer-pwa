// --- Service Worker ---

const CACHE_NAME = "randomatched-v1"; // Меняйте версию при обновлении файлов
const URLS_TO_CACHE = [
  "/",
  "/index.html",
  "/style.css",
  "/app.js",
  "/manifest.json",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/apple-touch-icon.png",
  "https://code.jquery.com/jquery-3.7.1.min.js",
  "https://cdn.tailwindcss.com",
  "https://cdnjs.cloudflare.com/ajax/libs/crypto-js/4.2.0/crypto-js.min.js",
  "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js",
  "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js",
  "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js",
];

// Установка: кэшируем основные файлы приложения
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        console.log("[SW] Opened cache");
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
              console.log("[SW] Deleting old cache:", cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => self.clients.claim())
  );
});

// Fetch: используем стратегию "Cache first".
// Firebase сам управляет своим сетевым соединением.
self.addEventListener("fetch", (event) => {
  // Игнорируем запросы к Firebase, чтобы не мешать его оффлайн-механизму
  if (
    event.request.url.includes("firestore.googleapis.com") ||
    event.request.url.includes("firebaseapp.com")
  ) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((response) => {
      // Если ресурс есть в кэше, возвращаем его.
      // Иначе делаем запрос к сети.
      return response || fetch(event.request);
    })
  );
});
