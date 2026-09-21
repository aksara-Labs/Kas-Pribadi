/* Catatan Kas — Service Worker v3 (offline shell) */
var CACHE = 'kas-shell-v3';
var PRECACHE = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icon-192.png',
  './icon-512.png',
  './icon-maskable-192.png',
  './icon-maskable-512.png',
  './apple-touch-icon.png',
  './splash-logo.png',
  './badge-72.png'
];

self.addEventListener('install', function (e) {
  e.waitUntil(
    caches.open(CACHE).then(function (c) {
      return c.addAll(PRECACHE.map(function (u) {
        return new Request(u, { cache: 'reload' });
      })).catch(function () {
        // partial OK
        return Promise.all(PRECACHE.map(function (u) {
          return c.add(u).catch(function () {});
        }));
      });
    }).then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.map(function (k) {
        if (k !== CACHE) return caches.delete(k);
      }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;

  var url = new URL(req.url);
  // Jangan cache API Google Apps Script
  if (/script\.google\.com|googleapis\.com/i.test(url.href)) {
    e.respondWith(fetch(req));
    return;
  }

  // HTML: network first, fallback cache
  if (req.mode === 'navigate' || (req.headers.get('accept') || '').indexOf('text/html') !== -1) {
    e.respondWith(
      fetch(req).then(function (res) {
        var copy = res.clone();
        caches.open(CACHE).then(function (c) { c.put(req, copy); });
        return res;
      }).catch(function () {
        return caches.match('./index.html').then(function (r) {
          return r || caches.match('./');
        });
      })
    );
    return;
  }

  // Aset statis: cache first
  e.respondWith(
    caches.match(req).then(function (hit) {
      if (hit) return hit;
      return fetch(req).then(function (res) {
        if (res && res.ok && url.origin === self.location.origin) {
          var copy = res.clone();
          caches.open(CACHE).then(function (c) { c.put(req, copy); });
        }
        return res;
      }).catch(function () {
        return hit;
      });
    })
  );
});

self.addEventListener('message', function (e) {
  var data = e.data || {};
  if (data.type === 'SHOW_NOTIFICATION' && data.title) {
    e.waitUntil(
      self.registration.showNotification(data.title, {
        body: data.body || '',
        icon: data.icon || './icon-192.png',
        badge: data.badge || './badge-72.png',
        tag: data.tag || 'kas-notif',
        renotify: !!data.renotify,
        data: { url: data.url || './' },
        requireInteraction: !!data.requireInteraction
      })
    );
  }
});

self.addEventListener('notificationclick', function (e) {
  e.notification.close();
  var target = (e.notification.data && e.notification.data.url) || self.registration.scope || './';
  e.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (list) {
      for (var i = 0; i < list.length; i++) {
        var c = list[i];
        if (c.url && 'focus' in c) {
          if (c.navigate) try { c.navigate(target); } catch (err) {}
          return c.focus();
        }
      }
      if (self.clients.openWindow) return self.clients.openWindow(target);
    })
  );
});

self.addEventListener('push', function (e) {
  var title = 'Catatan Kas';
  var body = 'Ada pengingat';
  var tag = 'kas-push';
  try {
    if (e.data) {
      var json = e.data.json();
      if (json.title) title = json.title;
      if (json.body) body = json.body;
      if (json.tag) tag = json.tag;
    }
  } catch (err) {
    try { body = e.data ? e.data.text() : body; } catch (e2) {}
  }
  e.waitUntil(
    self.registration.showNotification(title, {
      body: body,
      icon: './icon-192.png',
      badge: './badge-72.png',
      tag: tag,
      data: { url: './' }
    })
  );
});
