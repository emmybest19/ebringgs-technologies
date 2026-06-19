// Service Worker for Push Notifications
// This file must live in /public so it's served at the site root.

self.addEventListener('push', (event) => {
  if (!event.data) return;

  const data = event.data.json();

  const options = {
    body: data.body || '',
    icon: data.icon || '/vite.svg',
    badge: data.icon || '/vite.svg',
    tag: data.tag || 'ebringgs-notification',
    data: { url: data.url || '/' },
  };

  event.waitUntil(self.registration.showNotification(data.title || 'E-Bringgs', options));
});

// When the user clicks on a notification, open the target URL
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const targetUrl = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // If a window is already open, focus it and navigate
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.focus();
          client.navigate(targetUrl);
          return;
        }
      }
      // Otherwise open a new window
      return clients.openWindow(targetUrl);
    }),
  );
});
