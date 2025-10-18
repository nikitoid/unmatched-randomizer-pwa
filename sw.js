const APP_SHELL_CACHE_NAME = "app-shell-v2";
const DATA_CACHE_NAME = "data-cache-v1";

// Список всех локальных ресурсов, составляющих "оболочку" приложения (App Shell)
const appShellFiles = [
  "/",
  "/index.html",
  "/manifest.json",
  "/favicon.ico",
  "/css/style.css",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/apple-touch-icon.png",
  "/js/app.js",
  "/js/firebase-config.js",
  "/js/modules/firebase.js",
  "/js/modules/generator.js",
  "/js/modules/listManager.js",
  "/js/modules/modal.js",
  "/js/modules/results.js",
  "/js/modules/storage.js",
  "/js/modules/theme.js",
  "/js/modules/toast.js",
];

// 1. Установка Service Worker: кэширование App Shell
self.addEventListener("install", (event) => {
  console.log("[SW] Установка");
  event.waitUntil(
    (async () => {
      const cache = await caches.open(APP_SHELL_CACHE_NAME);
      console.log("[SW] Кэширование App Shell:", appShellFiles);
      await cache.addAll(appShellFiles);
      // Принудительно активируем новый SW сразу после успешной установки
      await self.skipWaiting();
      console.log("[SW] skipWaiting() вызван, SW должен активироваться.");
    })()
  );
});

// 2. Активация Service Worker: очистка старых кэшей
self.addEventListener("activate", (event) => {
  console.log("[SW] Активация");
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (
            cacheName !== APP_SHELL_CACHE_NAME &&
            cacheName !== DATA_CACHE_NAME
          ) {
            console.log("[SW] Удаление старого кэша:", cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  // Применяем новый SW ко всем открытым клиентам
  return self.clients.claim();
});

// 3. Обработка запросов: применение различных стратегий кэширования
self.addEventListener("fetch", (event) => {
  const requestUrl = new URL(event.request.url);

  // Игнорируем все, что не является GET-запросом
  if (event.request.method !== "GET") {
    return;
  }

  // Стратегия "Network First, falling back to Cache" для API Firebase
  if (requestUrl.hostname === "firestore.googleapis.com") {
    event.respondWith(
      caches.open(DATA_CACHE_NAME).then((cache) => {
        return fetch(event.request)
          .then((networkResponse) => {
            // Если запрос успешен, кэшируем его и возвращаем
            cache.put(event.request, networkResponse.clone());
            return networkResponse;
          })
          .catch(() => {
            // Если сеть недоступна, пытаемся отдать из кэша
            console.log(
              `[SW] Сеть недоступна для ${event.request.url}. Поиск в кэше данных.`
            );
            return cache.match(event.request);
          });
      })
    );
  }
  // Стратегия "Cache First, falling back to Network" для всего остального
  else {
    event.respondWith(
      caches.match(event.request).then((response) => {
        // Если ресурс есть в кэше, отдаем его
        if (response) {
          return response;
        }

        // Если ресурса в кэше нет, идем в сеть
        // Если ресурса в кэше нет, идем в сеть
        return fetch(event.request)
          .then((networkResponse) => {
            // Проверяем, что ответ корректный, перед кэшированием
            if (
              !networkResponse ||
              networkResponse.status !== 200 ||
              networkResponse.type !== "basic"
            ) {
              // Не кэшируем некорректные или сторонние ответы, которые не хотим сохранять
              return networkResponse;
            }

            // Открываем кэш App Shell для кэширования статики
            return caches.open(APP_SHELL_CACHE_NAME).then((cache) => {
              cache.put(event.request, networkResponse.clone());
              return networkResponse;
            });
          })
          .catch(() => {
            // Если fetch не удался (например, нет сети), просто ничего не возвращаем.
            // Браузер обработает это как стандартную сетевую ошибку.
            // Это предотвращает ошибку "Uncaught (in promise) TypeError: Failed to fetch".
            console.warn(
              `[SW] Не удалось загрузить из сети: ${event.request.url}`
            );
            // Возвращаем пустой ответ или можно вернуть специальную оффлайн-страницу
            // return new Response("<h1>Вы оффлайн</h1>", { headers: { "Content-Type": "text/html" } });
          });
      })
    );
  }
});
