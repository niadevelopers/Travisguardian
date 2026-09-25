/* =========================================================
   Travis Guardian — Service Worker
   Purpose: make the entire company site work offline
   Version: 1.0.0
   Scope:   offline caching only (no install / PWA features)
   ========================================================= */

const CACHE_NAME = 'travis-guardian-v1.0.0';

/* Every page in the repo root that should be available offline */
const PRECACHE_URLS = [
  './',
  './index.html',
  './about.html',
  './team.html',
  './product.html',
  './pricing.html',
  './security.html',
  './contact.html',
  './privacy.html',
  './terms.html',
  './refund.html',
  './landing.html',   // if you uploaded the landing page
  './travis.html',    // present in your repo
  './test.html',      // present in your repo
  './offline.html'    // fallback page
];

/* =========================================================
   INSTALL — precache all pages on first visit
   ========================================================= */
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        // Add each URL individually so one failure doesn't abort the whole install
        return Promise.all(
          PRECACHE_URLS.map((url) =>
            cache.add(url).catch((err) => {
              console.warn('[SW] Failed to cache:', url, err);
            })
          )
        );
      })
      .then(() => self.skipWaiting())
  );
});

/* =========================================================
   ACTIVATE — clean up old cache versions
   ========================================================= */
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

/* =========================================================
   FETCH — cache-first with network fallback
   ========================================================= */
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Only handle GET requests
  if (request.method !== 'GET') return;

  // Skip cross-origin requests (e.g. your TRAVIS app on vercel.app)
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    caches.match(request).then((cached) => {
      // Serve from cache if available
      if (cached) return cached;

      // Otherwise fetch from network and cache the response
      return fetch(request)
        .then((response) => {
          if (response && response.status === 200 && response.type === 'basic') {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(() => {
          // Offline + not cached → show offline page for navigations
          if (request.mode === 'navigate') {
            return caches.match('./offline.html');
          }
          return new Response('Offline', { status: 503, statusText: 'Offline' });
        });
    })
  );
});

/* =========================================================
   MESSAGE — allow pages to trigger an immediate update
   ========================================================= */
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
