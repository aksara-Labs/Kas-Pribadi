/* Catatan Kas — Service Worker */
self.addEventListener('install', function (e) {
  self.skipWaiting();
});

self.addEventListener('activate', function (e) {
  e.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', function (e) {
  e.respondWith(
    fetch(e.request).catch(function () {
      return caches.match(e.request);
    })
  );
});

/* Notifikasi lokal dari halaman app */
self.addEventListener('message', function (e) {
  var data = e.data || {};
  if (data.type === 'SHOW_NOTIFICATION' && data.title) {
    e.waitUntil(
      self.registration.showNotification(data.title, {
        body: data.body || '',
        icon: data.icon || './icon-192.png',
        badge: data.badge || './icon-192.png',
        tag: data.tag || 'kas-notif',
        renotify: !!data.renotify,
        data: data.url ? { url: data.url } : {},
        requireInteraction: !!data.requireInteraction
      })
    );
  }
});

/* Klik notifikasi → buka app */
self.addEventListener('notificationclick', function (e) {
  e.notification.close();
  var target = (e.notification.data && e.notification.data.url) || './';
  e.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (list) {
      for (var i = 0; i < list.length; i++) {
        var c = list[i];
        if (c.url && 'focus' in c) {
          return c.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(target);
      }
    })
  );
});

/* Hook push (siap jika nanti ada server push) */
self.addEventListener('push', function (e) {
  var title = 'Catatan Kas';
  var body = 'Ada pengingat jatuh tempo';
  var tag = 'kas-push';
  try {
    if (e.data) {
      var json = e.data.json();
      if (json.title) title = json.title;
      if (json.body) body = json.body;
      if (json.tag) tag = json.tag;
    }
  } catch (err) {
    try {
      body = e.data ? e.data.text() : body;
    } catch (e2) {}
  }
  e.waitUntil(
    self.registration.showNotification(title, {
      body: body,
      icon: './icon-192.png',
      badge: './icon-192.png',
      tag: tag
    })
  );
});
