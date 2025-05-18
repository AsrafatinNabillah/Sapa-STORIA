const CACHE_NAME = 'story-app-cache-v2';
const API_CACHE_NAME = 'story-api-cache-v1';
const FILES_TO_CACHE = [
  '/Sapa-STORIA/',
  '/Sapa-STORIA/index.html',
  '/Sapa-STORIA/main.css',
  '/Sapa-STORIA/bundle.js',
  '/Sapa-STORIA/S.ico',
  '/Sapa-STORIA/manifest.json',
  '/Sapa-STORIA/ScreenshotDesktop.png',
  '/Sapa-STORIA/ScreenshotMobile.png',
  '/Sapa-STORIA/S-96.png',
  '/Sapa-STORIA/S-192.png',
  '/Sapa-STORIA/S-512.png'
];

const API_ENDPOINTS = [
  /^https:\/\/story-api\.dicoding\.dev\/v1\/stories(\?.*)?$/
];

// Install Service Worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(FILES_TO_CACHE);
      })
      .catch((err) => {
        console.error('Cache installation failed:', err);
      })
  );
  self.skipWaiting();
});

// Activate Service Worker
self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME, API_CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (!cacheWhitelist.includes(cacheName)) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch Handling Strategy
self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Handle API requests with network-first strategy
  if (API_ENDPOINTS.some(regex => regex.test(url.href))) {
    event.respondWith(
      fetchAndCache(request, API_CACHE_NAME)
        .catch(() => {
          // Return empty response for API when offline
          return new Response(JSON.stringify({
            error: true,
            message: "Anda sedang offline. Data mungkin tidak terbaru."
          }), {
            headers: { 'Content-Type': 'application/json' }
          });
        })
    );
    return;
  }

  // Handle navigation requests (HTML pages)
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then(networkResponse => {
          // Update cache with fresh page
          caches.open(CACHE_NAME)
            .then(cache => cache.put(request, networkResponse.clone()));
          return networkResponse;
        })
        .catch(() => {
          // Return cached index.html when offline
          return caches.match('/index.html');
        })
    );
    return;
  }

  // Default cache-first strategy for other assets
  event.respondWith(
    caches.match(request)
      .then(cachedResponse => cachedResponse || fetchAndCache(request, CACHE_NAME))
  );
});

self.addEventListener('push', (event) => {
  const defaultNotification = {
    title: 'Story berhasil dibuat',
    options: {
      body: 'Anda telah membuat story baru.',
      icon: '/S.ico',
    }
  };

  event.waitUntil(
    (async () => {
      try {
        // Mendapatkan data dari push event
        let data;
        if (event.data) {
          try {
            data = event.data.json ? await event.data.json() : JSON.parse(await event.data.text());
          } catch (e) {
            console.error('Error parsing push data:', e);
            data = {};
          }
        }

        // Membangun notifikasi
        const title = data.title || defaultNotification.title;
        
        // Jika ada deskripsi dalam data, gunakan template yang ditentukan
        const body = data.description 
          ? `Anda telah membuat story baru dengan deskripsi: ${data.description}`
          : defaultNotification.options.body;

        const options = {
          ...defaultNotification.options,
          ...(data.options || {}) // Langsung gunakan body dari data.options jika ada
        };

        console.log('Showing notification with:', { title, options });
        return self.registration.showNotification(title, options);
        
      } catch (error) {
        console.error('Error in push handler:', error);
        return self.registration.showNotification(
          defaultNotification.title,
          defaultNotification.options
        );
      }
    })()
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  const urlToOpen = event.notification.data?.url || '/';
  
  event.waitUntil(
    clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    }).then((clientList) => {
      if (clientList.length > 0) {
        return clientList[0].focus();
      }
      return clients.openWindow(urlToOpen);
    })
  );
});

// Background Sync (optional)
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-stories') {
    console.log('Background sync triggered');
    // Implement sync logic here
  }
});

// Helper Functions
async function fetchAndCache(request, cacheName) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      await cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (err) {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    throw err;
  }
}