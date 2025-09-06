// Service Worker для Randomatched PWA
const CACHE_NAME = 'randomatched-v1.0.2';
const STATIC_CACHE_NAME = 'randomatched-static-v1.0.0';
const DYNAMIC_CACHE_NAME = 'randomatched-dynamic-v1.0.0';

// Файлы для кеширования при установке
const STATIC_FILES = [
    '/',
    '/index.html',
    '/css/style.css',
    '/js/app.js',
    '/manifest.json',
    '/icons/icon-192.png',
    '/icons/icon-512.png',
    '/icons/apple-touch-icon.png',
    '/favicon.ico',
    // Внешние ресурсы
    'https://cdn.tailwindcss.com'
];

// Файлы для кеширования при первом запросе
const DYNAMIC_FILES = [
    '/js/modules/',
    '/_headers'
];

// Установка Service Worker
self.addEventListener('install', (event) => {
    console.log('[SW] Installing Service Worker...');
    
    event.waitUntil(
        caches.open(STATIC_CACHE_NAME)
            .then((cache) => {
                console.log('[SW] Caching static files...');
                return cache.addAll(STATIC_FILES);
            })
            .then(() => {
                console.log('[SW] Static files cached successfully');
                return self.skipWaiting();
            })
            .catch((error) => {
                console.error('[SW] Error caching static files:', error);
            })
    );
});

// Активация Service Worker
self.addEventListener('activate', (event) => {
    console.log('[SW] Activating Service Worker...');
    
    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames.map((cacheName) => {
                        if (cacheName !== STATIC_CACHE_NAME && 
                            cacheName !== DYNAMIC_CACHE_NAME) {
                            console.log('[SW] Deleting old cache:', cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                );
            })
            .then(() => {
                console.log('[SW] Service Worker activated');
                return self.clients.claim();
            })
    );
});

// Обработка запросов
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);
    
    // Пропускаем запросы к внешним API и аналитике
    if (url.origin !== location.origin && 
        !url.hostname.includes('cdn.tailwindcss.com')) {
        return;
    }
    
    // Стратегия кеширования для разных типов ресурсов
    if (request.method === 'GET') {
        if (isStaticFile(request.url)) {
            // Cache First для статических файлов
            event.respondWith(cacheFirst(request));
        } else if (isAPIRequest(request.url)) {
            // Network First для API запросов
            event.respondWith(networkFirst(request));
        } else {
            // Stale While Revalidate для остальных запросов
            event.respondWith(staleWhileRevalidate(request));
        }
    }
});

// Проверка, является ли файл статическим
function isStaticFile(url) {
    return url.includes('.css') || 
           url.includes('.js') || 
           url.includes('.png') || 
           url.includes('.jpg') || 
           url.includes('.jpeg') || 
           url.includes('.gif') || 
           url.includes('.svg') || 
           url.includes('.ico') || 
           url.includes('.woff') || 
           url.includes('.woff2') || 
           url.includes('.ttf') || 
           url.includes('.eot') ||
           url === location.origin + '/' ||
           url === location.origin + '/index.html';
}

// Проверка, является ли запрос API запросом
function isAPIRequest(url) {
    return url.includes('/api/') || 
           url.includes('heroes') || 
           url.includes('random');
}

// Стратегия Cache First
async function cacheFirst(request) {
    try {
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }
        
        const networkResponse = await fetch(request);
        if (networkResponse.ok) {
            const cache = await caches.open(STATIC_CACHE_NAME);
            cache.put(request, networkResponse.clone());
        }
        return networkResponse;
    } catch (error) {
        console.error('[SW] Cache First error:', error);
        return new Response('Offline content not available', {
            status: 503,
            statusText: 'Service Unavailable'
        });
    }
}

// Стратегия Network First
async function networkFirst(request) {
    try {
        const networkResponse = await fetch(request);
        if (networkResponse.ok) {
            const cache = await caches.open(DYNAMIC_CACHE_NAME);
            cache.put(request, networkResponse.clone());
        }
        return networkResponse;
    } catch (error) {
        console.log('[SW] Network failed, trying cache...');
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }
        
        // Возвращаем оффлайн страницу для навигационных запросов
        if (request.mode === 'navigate') {
            return caches.match('/index.html');
        }
        
        return new Response('Offline content not available', {
            status: 503,
            statusText: 'Service Unavailable'
        });
    }
}

// Стратегия Stale While Revalidate
async function staleWhileRevalidate(request) {
    const cache = await caches.open(DYNAMIC_CACHE_NAME);
    const cachedResponse = await cache.match(request);
    
    const fetchPromise = fetch(request).then((networkResponse) => {
        if (networkResponse.ok) {
            cache.put(request, networkResponse.clone());
        }
        return networkResponse;
    }).catch(() => {
        // Если сеть недоступна, возвращаем кешированный ответ
        return cachedResponse;
    });
    
    return cachedResponse || fetchPromise;
}

// Обработка сообщений от основного потока
self.addEventListener('message', (event) => {
    const { type, payload } = event.data;
    
    switch (type) {
        case 'SKIP_WAITING':
            self.skipWaiting();
            break;
            
        case 'GET_VERSION':
            event.ports[0].postMessage({
                version: CACHE_NAME
            });
            break;
            
        case 'CLEAR_CACHE':
            clearAllCaches().then(() => {
                event.ports[0].postMessage({
                    success: true
                });
            });
            break;
            
        case 'CACHE_URLS':
            cacheUrls(payload.urls).then(() => {
                event.ports[0].postMessage({
                    success: true
                });
            });
            break;
    }
});

// Очистка всех кешей
async function clearAllCaches() {
    const cacheNames = await caches.keys();
    await Promise.all(
        cacheNames.map(cacheName => caches.delete(cacheName))
    );
}

// Кеширование списка URL
async function cacheUrls(urls) {
    const cache = await caches.open(DYNAMIC_CACHE_NAME);
    await Promise.all(
        urls.map(async (url) => {
            try {
                const response = await fetch(url);
                if (response.ok) {
                    await cache.put(url, response);
                }
            } catch (error) {
                console.error(`[SW] Failed to cache ${url}:`, error);
            }
        })
    );
}

// Обработка push уведомлений (для будущего использования)
self.addEventListener('push', (event) => {
    if (event.data) {
        const data = event.data.json();
        const options = {
            body: data.body,
            icon: '/icons/icon-192.png',
            badge: '/icons/icon-192.png',
            vibrate: [100, 50, 100],
            data: {
                dateOfArrival: Date.now(),
                primaryKey: data.primaryKey
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
            self.registration.showNotification(data.title, options)
        );
    }
});

// Обработка кликов по уведомлениям
self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    
    if (event.action === 'explore') {
        event.waitUntil(
            clients.openWindow('/')
        );
    }
});

// Периодическая синхронизация (для будущего использования)
self.addEventListener('sync', (event) => {
    if (event.tag === 'background-sync') {
        event.waitUntil(doBackgroundSync());
    }
});

async function doBackgroundSync() {
    // Здесь можно добавить логику синхронизации данных
    console.log('[SW] Background sync triggered');
}
