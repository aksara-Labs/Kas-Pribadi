/* Catatan Kas — Service Worker v2 */
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
      if (self.clients.openWindow) {
        return self.clients.openWindow(target);
      }
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
