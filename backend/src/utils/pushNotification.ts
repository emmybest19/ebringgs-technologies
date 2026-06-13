import webpush from 'web-push';
import PushSubscription from '../models/PushSubscription.model';

const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
const vapidSubject = process.env.VAPID_SUBJECT || 'mailto:ebringgstechnologies@gmail.com';

const isPlaceholder = (v?: string) => !v || v.startsWith('your_') || v.includes('...');
const pushEnabled = !isPlaceholder(vapidPublicKey) && !isPlaceholder(vapidPrivateKey);

if (pushEnabled) {
  try {
    webpush.setVapidDetails(vapidSubject, vapidPublicKey!, vapidPrivateKey!);
  } catch (err) {
    console.warn('[push] Invalid VAPID keys — push notifications disabled:', (err as Error).message);
  }
} else {
  console.warn(
    '[push] VAPID keys not set — push notifications disabled. ' +
    'Generate keys with: npx web-push generate-vapid-keys'
  );
}

interface NotificationPayload {
  title: string;
  body: string;
  icon?: string;
  url?: string;
  tag?: string;
}

/**
 * Send a push notification to a specific user (all their subscribed devices).
 */
export async function sendPushToUser(userId: string, payload: NotificationPayload): Promise<void> {
  if (!pushEnabled) return;

  const subscriptions = await PushSubscription.find({ userId });
  if (!subscriptions.length) return;

  const data = JSON.stringify(payload);

  const results = await Promise.allSettled(
    subscriptions.map((sub) =>
      webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.keys.p256dh, auth: sub.keys.auth } },
        data,
      ),
    ),
  );

  // Remove subscriptions that are no longer valid (410 Gone or 404)
  for (let i = 0; i < results.length; i++) {
    const result = results[i];
    if (result.status === 'rejected') {
      const statusCode = (result.reason as { statusCode?: number })?.statusCode;
      if (statusCode === 404 || statusCode === 410) {
        await PushSubscription.findByIdAndDelete(subscriptions[i]._id);
      }
    }
  }
}

/**
 * Send a push notification to multiple users.
 */
export async function sendPushToUsers(userIds: string[], payload: NotificationPayload): Promise<void> {
  await Promise.allSettled(userIds.map((id) => sendPushToUser(id, payload)));
}

/**
 * Send a push notification to all users with a specific role.
 */
export async function sendPushToRole(role: string, payload: NotificationPayload): Promise<void> {
  // Lazy import to avoid circular dependency
  const User = (await import('../models/User.model')).default;
  const users = await User.find({ role }).select('_id').lean();
  const userIds = users.map((u) => u._id.toString());
  await sendPushToUsers(userIds, payload);
}
