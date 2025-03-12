// BrailleBuddy Service Worker
const CACHE_NAME = 'braillebuddy-cache-v1';

// Files to cache
const FILES_TO_CACHE = [
  '/',
  '/index.html',
  '/css/styles.css',
  '/js/script.js',
  '/js/haptic-feedback.js',
  '/js/braille-contractions.js',
  '/js/progress-tracker.js',
  '/js/adaptive-learning.js',
  '/js/mobile-optimization.js',
  '/js/games/memory-match.js',
  '/js/games/word-builder.js',
  '/js/games/speedster.js',
  '/images/favicon.svg',
  '/images/apple-touch-icon.svg',
  '/images/og-image.svg',
  'https://fonts.googleapis.com/css2?family=Comic+Neue:wght@400;700&display=swap'
];

// Install event - cache all static assets
self.addEventListener('install', event => {
  console.log('[ServiceWorker] Install');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[ServiceWorker] Pre-caching offline resources');
        return cache.addAll(FILES_TO_CACHE);
      })
      .then(() => {
        console.log('[ServiceWorker] Installation complete');
        return self.skipWaiting();
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  console.log('[ServiceWorker] Activate');
  
  event.waitUntil(
    caches.keys().then(keyList => {
      return Promise.all(keyList.map(key => {
        if (key !== CACHE_NAME) {
          console.log('[ServiceWorker] Removing old cache', key);
          return caches.delete(key);
        }
      }));
    })
    .then(() => {
      console.log('[ServiceWorker] Claiming clients');
      return self.clients.claim();
    })
  );
});

// Fetch event - serve from cache, fall back to network
self.addEventListener('fetch', event => {
  console.log('[ServiceWorker] Fetch', event.request.url);
  
  // Skip cross-origin requests
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .catch(() => {
          console.log('[ServiceWorker] Fetch failed; returning offline page instead.');
          return caches.open(CACHE_NAME)
            .then(cache => {
              return cache.match('index.html');
            });
        })
    );
    return;
  }
  
  // Use cache-first strategy for static assets
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          console.log('[ServiceWorker] Found in cache', event.request.url);
          return response;
        }
        
        console.log('[ServiceWorker] Network request for', event.request.url);
        return fetch(event.request)
          .then(response => {
            // If valid response, clone it and store in cache
            if (response && response.status === 200 && response.type === 'basic') {
              console.log('[ServiceWorker] Caching new resource', event.request.url);
              const responseToCache = response.clone();
              caches.open(CACHE_NAME)
                .then(cache => {
                  cache.put(event.request, responseToCache);
                });
            }
            return response;
          })
          .catch(error => {
            console.log('[ServiceWorker] Fetch failed; returning offline fallback.', error);
            // If the request is for an image, you could return a default offline image
            // For now, we'll just return whatever we have in the cache
            return caches.match(event.request);
          });
      })
  );
});

// Handle messages from the main thread
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
