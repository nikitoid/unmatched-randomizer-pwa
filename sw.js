const CACHE_NAME = "randomatched-v1.0.0";
const urlsToCache = [
  "/",
  "/index.html",
  "/css/style.css",
  "/js/app.js",
  "/manifest.json",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/apple-touch-icon.png",
  "https://cdn.tailwindcss.com",
  "https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/cdn.min.js",
];

// Install Event - кэшируем файлы
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        console.log("Opened cache");
        return cache.addAll(urlsToCache);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate Event - очищаем старый кэш
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log("Deleting old cache:", cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => self.clients.claim())
  );
});

// Fetch Event - стратегия Cache First с фоновым обновлением
self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      // Возвращаем кэшированную версию если есть
      if (response) {
        // Фоновое обновление кэша
        fetchAndCache(event.request);
        return response;
      }

      // Если нет в кэше, загружаем из сети
      return fetch(event.request)
        .then((response) => {
          // Проверяем валидность ответа
          if (
            !response ||
            response.status !== 200 ||
            response.type !== "basic"
          ) {
            return response;
          }

          // Клонируем ответ для кэша
          const responseToCache = response.clone();

          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });

          return response;
        })
        .catch(() => {
          // Офлайн fallback
          if (event.request.destination === "document") {
            return caches.match("/index.html");
          }
        });
    })
  );
});

// Функция для фонового обновления кэша
function fetchAndCache(request) {
  return fetch(request)
    .then((response) => {
      if (response && response.status === 200) {
        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(request, responseToCache);
        });
      }
    })
    .catch(() => {
      console.log("Background update failed for:", request.url);
    });
}

// Обработка push-уведомлений (для будущего использования)
self.addEventListener("push", (event) => {
  const options = {
    body: event.data ? event.data.text() : "Новое обновление!",
    icon: "/icons/icon-192.png",
    badge: "/icons/icon-192.png",
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1,
    },
  };

  event.waitUntil(self.registration.showNotification("Randomatched", options));
});
