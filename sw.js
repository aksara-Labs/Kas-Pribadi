/* Minimal service worker — biar Chrome boleh Install / full app */
self.addEventListener('install', function (e) {
  self.skipWaiting();
});
self.addEventListener('activate', function (e) {
  e.waitUntil(self.clients.claim());
});
self.addEventListener('fetch', function (e) {
  e.respondWith(fetch(e.request).catch(function () {
    return caches.match(e.request);
  }));
});
