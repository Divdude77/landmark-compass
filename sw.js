const CACHE_NAME = 'compass-cache-v2';
var urlsToCache = [
    '.',
    './compass.html',
    './css/style.css',
    './css/fontawesome.min.css',
    './css/solid.min.css',
    './script.js',
    './sw.js',
    './webfonts/fa-regular-400.ttf',
    './webfonts/fa-regular-400.woff2',
    './webfonts/fa-solid-900.ttf',
    './webfonts/fa-solid-900.woff2',
    './webfonts/fa-v4compatibility.ttf',
    './webfonts/fa-v4compatibility.woff2',
    './manifest.json'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    fetch(event.request).then(response => {
      if (!response) {
        throw Error("No response from fetch");
      }
      return caches.open(CACHE_NAME).then(cache => {
        cache.put(event.request, response.clone());
        return response;
      });
    }).catch(error => {
      return caches.match(event.request);
    })
  );
});

self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
