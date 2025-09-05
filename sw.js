// --- Service Worker ---

const CACHE_NAME = "randomatched-v1"; // Увеличена версия для финального исправления
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
  // Внешние CDN ассеты, необходимые для оффлайн-работы (кроме Tailwind)
  "https://code.jquery.com/jquery-3.7.1.min.js",
  "https://cdnjs.cloudflare.com/ajax/libs/crypto-js/4.2.0/crypto-js.min.js",
  "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js",
  "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js",
  "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js",
];

// Установка: кэшируем все основные ассеты, кроме проблемного CDN
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        console.log("[SW] Кэширование основных ресурсов.");
        return cache.addAll(URLS_TO_CACHE);
      })
      .then(() => self.skipWaiting())
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
              console.log("[SW] Удаление старого кэша:", cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => self.clients.claim())
  );
});

// Fetch: обрабатываем запросы
self.addEventListener("fetch", (event) => {
  // Используем стратегию "Cache first, then network"
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // Если ответ есть в кэше, возвращаем его
      if (cachedResponse) {
        return cachedResponse;
      }

      // Если в кэше нет, идем в сеть
      return fetch(event.request).then((networkResponse) => {
        // Для Tailwind CDN (и других ресурсов, не кэшированных при установке),
        // мы сохраняем ответ в кэш "на лету" для будущих оффлайн-запросов.
        if (event.request.url.includes("cdn.tailwindcss.com")) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            console.log("[SW] Кэширование Tailwind CSS для оффлайн-доступа.");
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      });
    })
  );
});
