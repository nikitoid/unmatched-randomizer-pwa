// --- Service Worker ---

const CACHE_NAME = "randomatched-v6"; // Увеличена версия для финального исправления
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
  "https://cdnjs.cloudflare.com/ajax/libs/crypto-js/4.2.0/crypto-js.min.js",
  "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js",
  "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js",
  "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js",
];

// Установка: кэшируем все необходимые ресурсы
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        console.log("[SW] Кэширование основных ресурсов.");
        // Используем no-cors для внешних ресурсов, чтобы избежать ошибок при установке
        const requests = URLS_TO_CACHE.map(
          (url) => new Request(url, { mode: "no-cors" })
        );
        return cache.addAll(requests);
      })
      .then(() => self.skipWaiting())
      .catch((err) =>
        console.error("[SW] Ошибка кэширования при установке: ", err)
      )
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
  const requestUrl = new URL(event.request.url);

  // Игнорируем все запросы к API Google, чтобы не мешать работе Firebase SDK
  if (requestUrl.hostname.includes("googleapis.com")) {
    return;
  }

  // Для всех остальных запросов используем стратегию "Cache first, falling back to network"
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // Если ресурс есть в кэше, отдаем его
      if (cachedResponse) {
        return cachedResponse;
      }

      // Если в кэше нет, идем в сеть
      return fetch(event.request).catch(() => {
        // Если сеть недоступна, можем вернуть какой-то запасной вариант,
        // но для JS/CSS файлов это приведет к ошибке, что мы и видим
        // Главное, что основные файлы уже должны быть в кэше.
      });
    })
  );
});
