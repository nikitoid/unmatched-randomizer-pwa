// --- Service Worker ---

const CACHE_NAME = "randomatched-v5"; // Увеличена версия для финального исправления
// Кэшируем только основные локальные файлы ("app shell").
// Все остальное (CDN скрипты) будет закэшировано при первом обращении.
const URLS_TO_PRECACHE = [
  "/",
  "/index.html",
  "/style.css",
  "/app.js",
  "/manifest.json",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/apple-touch-icon.png",
];

// Установка: кэшируем только "app shell". Этот шаг должен быть максимально надежным.
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        console.log("[SW] Кэширование App Shell.");
        return cache.addAll(URLS_TO_PRECACHE);
      })
      .then(() => self.skipWaiting())
      .catch((err) => console.error("[SW] Ошибка кэширования App Shell: ", err))
  );
});

// Активация: удаляем старые кэши и захватываем контроль.
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

// Fetch: Стратегия "Cache first, falling back to network".
// Динамически кэшируем ресурсы при первом успешном запросе.
self.addEventListener("fetch", (event) => {
  const requestUrl = new URL(event.request.url);

  // Игнорируем все запросы к API Google, чтобы не мешать работе Firebase SDK.
  if (requestUrl.hostname.includes("googleapis.com")) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // Если ресурс есть в кэше, немедленно отдаем его.
      if (cachedResponse) {
        return cachedResponse;
      }

      // Если в кэше нет, идем в сеть.
      return fetch(event.request)
        .then((networkResponse) => {
          // Клонируем ответ, так как его можно прочитать только один раз.
          const responseToCache = networkResponse.clone();

          caches.open(CACHE_NAME).then((cache) => {
            // Сохраняем свежий ответ в кэш для будущих оффлайн-запусков.
            console.log("[SW] Динамическое кэширование:", event.request.url);
            cache.put(event.request, responseToCache);
          });

          // Возвращаем ответ браузеру.
          return networkResponse;
        })
        .catch((err) => {
          // Этот catch сработает, если мы оффлайн и ресурса нет в кэше.
          // Для JS/CSS это нормально, что будет ошибка.
          // Главное, что app shell загрузится.
        });
    })
  );
});
