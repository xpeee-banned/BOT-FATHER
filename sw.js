const CACHE_NAME = 'botfather-rewards-cache-v1';
const urlsToCache = [
  './',
  './index.html',
  'https://cdn.jsdelivr.net/npm/canvas-confetti@1.6.0/dist/confetti.browser.min.js',
  'https://d3js.org/d3.v7.min.js',
  'https://cdn.jsdelivr.net/npm/sweetalert2@11'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response;
        }
        return fetch(event.request);
      })
  );
});
