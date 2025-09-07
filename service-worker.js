const CACHE_NAME = 'common-app-pwa-v1';
const RUNTIME_CACHE = 'runtime-cache-v1';

// Конфигурация стратегий кеширования
const CACHE_CONFIG = {
  strategy: 'cache-first', // По умолчанию cache-first
  staticCacheFiles: [
    '/',
    '/index.html',
    '/manifest.json',
    '/css/styles.css',
    '/js/app.js',
    '/js/modules/pwa.js',
    '/js/modules/cache-strategy.js',
    '/favicon.ico',
    '/assets/icons/apple-touch-icon.png',
    '/assets/icons/icon-192.png',
    '/assets/icons/icon-512.png',
    'https://cdn.tailwindcss.com'
  ],
  networkTimeout: 3000, // 3 секунды таймаут для network-first
  maxEntries: 50, // Максимальное количество записей в runtime кеше
  maxAgeSeconds: 86400 // 24 часа
};

// Установка Service Worker
self.addEventListener('install', event => {
  console.log('Service Worker: Installing...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Service Worker: Caching static files');
        return cache.addAll(CACHE_CONFIG.staticCacheFiles);
      })
      .then(() => {
        console.log('Service Worker: Static files cached');
        return self.skipWaiting();
      })
      .catch(error => {
        console.error('Service Worker: Cache installation failed:', error);
      })
  );
});

// Активация Service Worker
self.addEventListener('activate', event => {
  console.log('Service Worker: Activating...');
  
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== CACHE_NAME && cacheName !== RUNTIME_CACHE) {
              console.log('Service Worker: Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('Service Worker: Activated');
        return self.clients.claim();
      })
  );
});

// Обработка сообщений для изменения стратегии кеширования
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'UPDATE_CACHE_STRATEGY') {
    CACHE_CONFIG.strategy = event.data.strategy;
    console.log('Service Worker: Cache strategy updated to:', event.data.strategy);
    
    // Отправляем подтверждение обратно
    event.ports[0].postMessage({
      type: 'STRATEGY_UPDATED',
      strategy: event.data.strategy
    });
  }
});

// Основной обработчик fetch запросов
self.addEventListener('fetch', event => {
  // Пропускаем запросы, которые не являются GET
  if (event.request.method !== 'GET') {
    return;
  }

  // Пропускаем chrome-extension запросы
  if (event.request.url.startsWith('chrome-extension://')) {
    return;
  }

  event.respondWith(
    handleFetchRequest(event.request)
  );
});

// Основная функция обработки запросов с разными стратегиями
async function handleFetchRequest(request) {
  const url = new URL(request.url);
  
  // Для статических файлов всегда используем cache-first
  if (CACHE_CONFIG.staticCacheFiles.some(file => url.pathname === file || request.url === file)) {
    return cacheFirst(request);
  }

  // Для остальных запросов используем выбранную стратегию
  switch (CACHE_CONFIG.strategy) {
    case 'network-first':
      return networkFirst(request);
    case 'stale-while-revalidate':
      return staleWhileRevalidate(request);
    case 'cache-first':
    default:
      return cacheFirst(request);
  }
}

// Стратегия Cache First
async function cacheFirst(request) {
  try {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      console.log('Service Worker: Serving from cache:', request.url);
      return cachedResponse;
    }

    console.log('Service Worker: Fetching from network:', request.url);
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(RUNTIME_CACHE);
      cache.put(request, networkResponse.clone());
      await cleanupCache(cache);
    }
    
    return networkResponse;
  } catch (error) {
    console.error('Service Worker: Cache first failed:', error);
    return new Response('Сеть недоступна', {
      status: 503,
      statusText: 'Service Unavailable'
    });
  }
}

// Стратегия Network First
async function networkFirst(request) {
  try {
    console.log('Service Worker: Trying network first:', request.url);
    
    const networkResponse = await Promise.race([
      fetch(request),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Network timeout')), CACHE_CONFIG.networkTimeout)
      )
    ]);
    
    if (networkResponse.ok) {
      const cache = await caches.open(RUNTIME_CACHE);
      cache.put(request, networkResponse.clone());
      await cleanupCache(cache);
    }
    
    return networkResponse;
  } catch (error) {
    console.log('Service Worker: Network failed, trying cache:', request.url);
    
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    return new Response('Контент недоступен', {
      status: 503,
      statusText: 'Service Unavailable'
    });
  }
}

// Стратегия Stale While Revalidate
async function staleWhileRevalidate(request) {
  const cache = await caches.open(RUNTIME_CACHE);
  const cachedResponse = await cache.match(request);
  
  // Асинхронно обновляем кеш
  const networkResponsePromise = fetch(request)
    .then(response => {
      if (response.ok) {
        cache.put(request, response.clone());
        cleanupCache(cache);
      }
      return response;
    })
    .catch(error => {
      console.log('Service Worker: Network update failed:', error);
    });

  // Возвращаем кешированную версию немедленно, если она есть
  if (cachedResponse) {
    console.log('Service Worker: Serving stale content, updating in background:', request.url);
    return cachedResponse;
  }

  // Если кеша нет, ждем сетевой ответ
  console.log('Service Worker: No cache, waiting for network:', request.url);
  return networkResponsePromise;
}

// Очистка кеша (ограничение количества записей)
async function cleanupCache(cache) {
  const requests = await cache.keys();
  
  if (requests.length > CACHE_CONFIG.maxEntries) {
    const oldRequests = requests.slice(0, requests.length - CACHE_CONFIG.maxEntries);
    await Promise.all(
      oldRequests.map(request => cache.delete(request))
    );
    console.log(`Service Worker: Cleaned up ${oldRequests.length} old cache entries`);
  }
}

// Background Sync для обработки офлайн действий
self.addEventListener('sync', event => {
  if (event.tag === 'background-sync') {
    console.log('Service Worker: Background sync triggered');
    event.waitUntil(doBackgroundSync());
  }
});

async function doBackgroundSync() {
  // Здесь можно добавить логику для синхронизации данных
  // когда устройство снова подключается к сети
  console.log('Service Worker: Performing background sync');
}

// Push уведомления
self.addEventListener('push', event => {
  if (event.data) {
    const data = event.data.json();
    console.log('Service Worker: Push received:', data);
    
    const options = {
      body: data.body || 'У вас новое уведомление',
      icon: '/assets/icons/icon-192.png',
      badge: '/assets/icons/icon-192.png',
      vibrate: [200, 100, 200],
      data: data.data || {},
      actions: [
        {
          action: 'open',
          title: 'Открыть'
        },
        {
          action: 'close',
          title: 'Закрыть'
        }
      ]
    };
    
    event.waitUntil(
      self.registration.showNotification(data.title || 'Common App PWA', options)
    );
  }
});

// Обработка нажатий на уведомления
self.addEventListener('notificationclick', event => {
  event.notification.close();
  
  if (event.action === 'open') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

console.log('Service Worker: Loaded with cache strategy:', CACHE_CONFIG.strategy);
