// --- Service Worker ---

const CACHE_NAME = "randomatched-v6"; // Увеличиваем версию для форсирования обновления
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
        console.log(
          "[SW] Открыт кэш. Кэширование всех ресурсов для оффлайн-режима."
        );
        return cache.addAll(URLS_TO_CACHE);
      })
      .then(() => {
        console.log(
          "[SW] Все ресурсы успешно закэшированы. Активация немедленно."
        );
        return self.skipWaiting(); // Принудительно активируем новый SW
      })
      .catch((err) => {
        console.error("[SW] Ошибка кэширования при установке: ", err);
      })
  );
});

// Активация: удаляем старые кэши и захватываем контроль
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
      .then(() => {
        console.log(
          "[SW] Новый Service Worker активирован и контролирует страницу."
        );
        return self.clients.claim(); // Захватываем контроль над открытыми страницами
      })
  );
});

// Fetch: Стратегия "Cache falling back to network"
self.addEventListener("fetch", (event) => {
  if (event.request.url.includes("firestore.googleapis.com")) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      return cachedResponse || fetch(event.request);
    })
  );
});
