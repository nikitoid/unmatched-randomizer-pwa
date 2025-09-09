// Service Worker для Randomatched PWA
// Версия кэша для обновления при изменении файлов
const CACHE_VERSION = 'v1.0.1';
const CACHE_NAME = `randomatched-cache-${CACHE_VERSION}`;

// Файлы для кэширования при установке
const STATIC_CACHE_URLS = [
  '/',
  '/index.html',
  '/style.css',
  '/manifest.json',
  '/favicon.ico',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/apple-touch-icon.png',
  // CDN ресурсы
  'https://cdn.tailwindcss.com',
  'https://unpkg.com/alpinejs@3.x.x/dist/cdn.min.js',
  'https://fonts.googleapis.com/icon?family=Material+Icons',
  'https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap'
];

// Файлы для кэширования при запросе (динамическое кэширование)
const DYNAMIC_CACHE_URLS = [
  // API endpoints (если будут добавлены)
  '/api/',
  // Другие страницы
  '/about',
  '/settings'
];

// Установка Service Worker
self.addEventListener('install', (event) => {
  console.log('[SW] Установка Service Worker');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Кэширование статических файлов');
        return cache.addAll(STATIC_CACHE_URLS);
      })
      .then(() => {
        console.log('[SW] Статические файлы закэшированы');
        // Принудительная активация нового SW
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('[SW] Ошибка при кэшировании:', error);
      })
  );
});

// Активация Service Worker
self.addEventListener('activate', (event) => {
  console.log('[SW] Активация Service Worker');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            // Удаляем старые кэши
            if (cacheName !== CACHE_NAME) {
              console.log('[SW] Удаление старого кэша:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('[SW] Service Worker активирован');
        // Принудительное управление всеми клиентами
        return self.clients.claim();
      })
  );
});

// Обработка запросов (Cache First стратегия)
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Пропускаем запросы к внешним доменам (кроме CDN)
  if (url.origin !== location.origin && !isCDNRequest(url)) {
    return;
  }
  
  event.respondWith(
    caches.match(request)
      .then((cachedResponse) => {
        // Если есть в кэше, возвращаем кэшированную версию
        if (cachedResponse) {
          console.log('[SW] Запрос из кэша:', request.url);
          return cachedResponse;
        }
        
        // Если нет в кэше, делаем запрос к сети
        console.log('[SW] Запрос к сети:', request.url);
        return fetch(request)
          .then((networkResponse) => {
            // Проверяем валидность ответа
            if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
              return networkResponse;
            }
            
            // Клонируем ответ для кэширования
            const responseToCache = networkResponse.clone();
            
            // Кэшируем только GET запросы
            if (request.method === 'GET') {
              caches.open(CACHE_NAME)
                .then((cache) => {
                  cache.put(request, responseToCache);
                  console.log('[SW] Добавлено в кэш:', request.url);
                });
            }
            
            return networkResponse;
          })
          .catch((error) => {
            console.error('[SW] Ошибка сети:', error);
            
            // Возвращаем офлайн страницу для HTML запросов
            if (request.headers.get('accept').includes('text/html')) {
              return caches.match('/index.html');
            }
            
            // Для других типов файлов возвращаем базовую ошибку
            return new Response('Офлайн режим', {
              status: 503,
              statusText: 'Service Unavailable',
              headers: new Headers({
                'Content-Type': 'text/plain; charset=utf-8'
              })
            });
          });
      })
  );
});

// Обработка push уведомлений (для будущего использования)
self.addEventListener('push', (event) => {
  console.log('[SW] Получено push уведомление');
  
  const options = {
    body: event.data ? event.data.text() : 'Новое уведомление от Randomatched',
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'Открыть приложение',
        icon: '/icons/icon-192.png'
      },
      {
        action: 'close',
        title: 'Закрыть',
        icon: '/icons/icon-192.png'
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification('Randomatched', options)
  );
});

// Обработка кликов по уведомлениям
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Клик по уведомлению:', event.action);
  
  event.notification.close();
  
  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// Обработка синхронизации в фоне (для будущего использования)
self.addEventListener('sync', (event) => {
  console.log('[SW] Фоновая синхронизация:', event.tag);
  
  if (event.tag === 'background-sync') {
    event.waitUntil(
      // Здесь можно добавить логику синхронизации данных
      Promise.resolve()
    );
  }
});

// Вспомогательная функция для определения CDN запросов
function isCDNRequest(url) {
  const cdnDomains = [
    'cdn.tailwindcss.com',
    'unpkg.com',
    'fonts.googleapis.com',
    'fonts.gstatic.com'
  ];
  
  return cdnDomains.some(domain => url.hostname.includes(domain));
}

// Обработка сообщений от клиента
self.addEventListener('message', (event) => {
  console.log('[SW] Получено сообщение:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: CACHE_VERSION });
  }
});

console.log('[SW] Service Worker загружен');
