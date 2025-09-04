// --- Service Worker ---

const CACHE_NAME = "randomatched-v2"; // Увеличиваем версию, чтобы SW обновился
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
  // Внешние CDN ассеты
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
        console.log("[SW] Opened cache. Caching assets...");

        const cachePromises = URLS_TO_CACHE.map((url) => {
          // Для внешних ресурсов (CDN) делаем запрос в режиме 'no-cors'
          if (url.startsWith("http")) {
            const request = new Request(url, { mode: "no-cors" });
            return fetch(request).then((response) =>
              cache.put(request, response)
            );
          }
          // Локальные ресурсы добавляем как обычно
          return cache.add(url);
        });

        return Promise.all(cachePromises);
      })
      .then(() => self.skipWaiting()) // Активируем новый SW сразу
      .catch((err) => {
        console.error("[SW] Caching failed during install:", err);
      })
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
