// sw.js
const APP_CACHE = 'passenger-pwa-v1';
const TILE_CACHE = 'passenger-tiles-v1';
const APP_SHELL = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(APP_CACHE).then(cache => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);

  // runtime cache for tile providers (OpenStreetMap, Esri, Stamen, OpenTopo)
  if (url.hostname.endsWith('tile.openstreetmap.org') ||
      url.hostname.includes('server.arcgisonline.com') ||
      url.hostname.includes('stamen-tiles') ||
      url.hostname.includes('tile.opentopomap.org')) {
    e.respondWith(
      caches.open(TILE_CACHE).then(cache =>
        cache.match(e.request).then(resp => resp || fetch(e.request).then(fetchResp => {
          cache.put(e.request, fetchResp.clone());
          return fetchResp;
        }))
      )
    );
    return;
  }

  // app shell cache-first
  e.respondWith(
    caches.match(e.request).then(resp => resp || fetch(e.request))
  );
});
