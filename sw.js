// --- Service Worker ---

const CACHE_NAME = "randomatched-v4"; // Увеличиваем версию для чистого обновления
const URLS_TO_CACHE = [
  // Локальные ассеты
  "/",
  "/index.html",
  "/style.css",
  "/app.js",
  "/manifest.json",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/apple-touch-icon.png",
  // Внешние CDN ассеты, необходимые для оффлайн-работы
  "https://code.jquery.com/jquery-3.7.1.min.js",
  "https://cdn.tailwindcss.com",
  "https://cdnjs.cloudflare.com/ajax/libs/crypto-js/4.2.0/crypto-js.min.js",
  "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js",
  "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js",
  "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js",
];

// Установка: кэшируем все необходимые ресурсы для оффлайн-работы
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        console.log("[SW] Opened cache. Caching all assets for offline use.");
        return cache.addAll(URLS_TO_CACHE);
      })
      .then(() => self.skipWaiting()) // Принудительно активируем новый SW
      .catch((err) => {
        console.error("[SW] Asset caching failed during install: ", err);
      })
  );
});

// Активация: удаляем старые кэши, чтобы освободить место
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

// Fetch: Стратегия "Cache falling back to network" (Кэш, затем сеть)
self.addEventListener("fetch", (event) => {
  // Игнорируем запросы к Firestore API, так как у него свой оффлайн-механизм
  if (event.request.url.includes("firestore.googleapis.com")) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // Если ресурс есть в кэше, возвращаем его.
      // Иначе — делаем запрос в сеть. Это важно для случаев, когда
      // пользователь переходит на страницу, которой нет в кэше (хотя в нашем приложении таких нет).
      return cachedResponse || fetch(event.request);
    })
  );
});
