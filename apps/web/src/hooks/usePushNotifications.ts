import { useState, useEffect, useCallback } from 'react';
import api from '@ebringgs/api';

type PermissionState = NotificationPermission | 'unsupported';

function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  // Allocate an explicit ArrayBuffer (not SharedArrayBuffer) so the result
  // satisfies BufferSource for pushManager.subscribe under strict TS lib types.
  const buffer = new ArrayBuffer(rawData.length);
  const outputArray = new Uint8Array(buffer);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function usePushNotifications() {
  const [permission, setPermission] = useState<PermissionState>(() => {
    if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported';
    return Notification.permission;
  });
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Check existing subscription on mount
  useEffect(() => {
    if (permission === 'unsupported') return;
    navigator.serviceWorker?.ready.then((reg) => {
      reg.pushManager.getSubscription().then((sub) => {
        setIsSubscribed(!!sub);
      });
    });
  }, [permission]);

  const subscribe = useCallback(async () => {
    if (permission === 'unsupported') return;
    setIsLoading(true);

    try {
      // 1. Ask browser for notification permission
      const result = await Notification.requestPermission();
      setPermission(result);
      if (result !== 'granted') return;

      // 2. Register service worker
      const registration = await navigator.serviceWorker.register('/sw-push.js');
      await navigator.serviceWorker.ready;

      // 3. Get VAPID public key from backend
      const { data } = await api.get('/push/vapid-key');
      const vapidKey = data.publicKey;

      // 4. Subscribe to push via the browser
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey),
      });

      // 5. Send subscription to backend
      const subJson = subscription.toJSON();
      await api.post('/push/subscribe', {
        endpoint: subJson.endpoint,
        keys: subJson.keys,
      });

      setIsSubscribed(true);
    } catch (err) {
      console.error('Push subscription failed:', err);
    } finally {
      setIsLoading(false);
    }
  }, [permission]);

  const unsubscribe = useCallback(async () => {
    setIsLoading(true);
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        await api.delete('/push/unsubscribe', { data: { endpoint: subscription.endpoint } });
        await subscription.unsubscribe();
      }
      setIsSubscribed(false);
    } catch (err) {
      console.error('Push unsubscribe failed:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { permission, isSubscribed, isLoading, subscribe, unsubscribe };
}
