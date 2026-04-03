self.addEventListener('push', (event) => {
  if (!event) {
    return;
  }

  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch (error) {
    payload = {};
  }

  const title = payload.title || 'LocalQuest';
  const body = payload.body || '새 알림이 도착했습니다.';
  const data = payload.data || {};
  const notificationType = String(data.type || '').toUpperCase();
  const shouldKeepVisible = notificationType === 'LUNCH';

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon: '/logo192.png',
      badge: '/logo192.png',
      data,
      requireInteraction: shouldKeepVisible,
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  const notification = event.notification;
  const data = (notification && notification.data) || {};

  if (notification) {
    notification.close();
  }

  event.waitUntil((async () => {
    const origin = self.location.origin;
    const targetUrl = new URL(data.targetUrl || '/main', origin).toString();

    if (data.notificationId) {
      try {
        await fetch('/api/push/click', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ notificationId: data.notificationId }),
        });
      } catch (error) {
        // ignore click log errors
      }
    }

    const clientList = await clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const client of clientList) {
      if (client.url === targetUrl && 'focus' in client) {
        await client.focus();
        return;
      }
    }

    if (clients.openWindow) {
      await clients.openWindow(targetUrl);
    }
  })());
});
