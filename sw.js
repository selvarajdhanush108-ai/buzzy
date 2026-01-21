const CACHE_NAME = 'buzzy-v2';
const STATIC_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './buzzer.mp3'
];

self.addEventListener('install', (evt) => {
  evt.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (evt) => {
  evt.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (evt) => {
  const url = new URL(evt.request.url);

  // Strategy for Tiles: Cache First, fallback to Network
  if(url.href.includes('tile.openstreetmap') || url.href.includes('arcgisonline')) {
     evt.respondWith(
       caches.open('buzzy-tiles').then(cache => 
         cache.match(evt.request).then(resp => {
           return resp || fetch(evt.request).then(netResp => {
             cache.put(evt.request, netResp.clone());
             return netResp;
           });
         })
       )
     );
     return;
  }

  // Strategy for App Shell: Network First (for realtime updates), fallback to Cache
  evt.respondWith(
    fetch(evt.request)
      .catch(() => caches.match(evt.request))
  );
});
