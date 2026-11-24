import { ReminderItem } from '../types/app';
import { getTodayDateStr } from './storage';

export type PermissionStateLabel = NotificationPermission | 'unsupported';

export function getNotificationPermission(): PermissionStateLabel {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }
  return Notification.permission;
}

export async function requestNotificationPermission(): Promise<PermissionStateLabel> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }
  try {
    return await Notification.requestPermission();
  } catch {
    return Notification.permission;
  }
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export async function subscribeToWebPush(userId: string): Promise<{
  ok: boolean;
  message: string;
  persistentVapid?: boolean;
}> {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator) || !('PushManager' in window)) {
    return { ok: false, message: 'ამ ბრაუზერში Web Push მხარდაჭერილი არ არის.' };
  }
  if (getNotificationPermission() !== 'granted') {
    return { ok: false, message: 'ჯერ მიეცით შეტყობინებების ნებართვა.' };
  }

  try {
    const healthRes = await fetch('/api/health');
    const health = await healthRes.json();
    if (!health.vapidPublicKey) {
      return { ok: false, message: 'სერვერის VAPID გასაღები ვერ მოიძებნა.' };
    }

    const registration = await navigator.serviceWorker.ready;
    let subscription = await registration.pushManager.getSubscription();
    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(health.vapidPublicKey) as BufferSource,
      });
    }

    const subRes = await fetch('/api/push/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, subscription }),
    });
    if (!subRes.ok) {
      return { ok: false, message: 'Push გამოწერის შენახვა ვერ მოხერხდა.' };
    }
    const subData = await subRes.json();
    return {
      ok: true,
      persistentVapid: subData.persistentVapid,
      message: subData.persistentVapid
        ? 'Web Push გამოწერა გააქტიურდა.'
        : 'Web Push გააქტიურდა (დროებითი სერვერული გასაღებით).',
    };
  } catch {
    return { ok: false, message: 'Push გამოწერის დროს მოხდა შეცდომა.' };
  }
}

export async function sendTestPush(userId: string): Promise<{ ok: boolean; message: string }> {
  try {
    const res = await fetch('/api/push/test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        title: 'SmartLearn AI — შეხსენების ტესტი',
        body: 'დროა დღევანდელი სწავლისა და განვითარების!',
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      return { ok: false, message: data.error || 'ტესტ Push ვერ გაიგზავნა.' };
    }
    return { ok: true, message: 'ტესტ Push შეტყობინება გაიგზავნა.' };
  } catch {
    return { ok: false, message: 'სერვერთან კავშირი ვერ მოხერხდა.' };
  }
}

function isWithinQuietHours(nowMinutes: number, startStr: string, endStr: string): boolean {
  const [sh, sm] = startStr.split(':').map(Number);
  const [eh, em] = endStr.split(':').map(Number);
  if (Number.isNaN(sh) || Number.isNaN(eh)) return false;
  const start = sh * 60 + (sm || 0);
  const end = eh * 60 + (em || 0);
  if (start <= end) {
    return nowMinutes >= start && nowMinutes < end;
  }
  return nowMinutes >= start || nowMinutes < end;
}

export function checkDueReminders(reminders: ReminderItem[], now = new Date()): ReminderItem[] {
  const todayStr = getTodayDateStr(now);
  const currentDay = now.getDay();
  const currentHHMM = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  return reminders.filter((rem) => {
    if (!rem.enabled) return false;
    if (rem.lastTriggeredDate === todayStr) return false;
    if (isWithinQuietHours(nowMinutes, rem.quietHoursStart, rem.quietHoursEnd)) return false;

    if (rem.snoozedUntil) {
      const snoozeTime = new Date(rem.snoozedUntil);
      if (now >= snoozeTime) return true;
      return false;
    }

    const dayAllowed =
      rem.repeat === 'daily' ||
      (rem.repeat === 'weekdays' && currentDay >= 1 && currentDay <= 5) ||
      (rem.repeat === 'weekends' && (currentDay === 0 || currentDay === 6)) ||
      rem.daysOfWeek.includes(currentDay);

    if (!dayAllowed) return false;
    return currentHHMM === rem.time;
  });
}

export function triggerForegroundNotification(rem: ReminderItem) {
  if (getNotificationPermission() === 'granted') {
    try {
      new Notification(`SmartLearn AI — ${rem.title}`, {
        body: rem.description || 'სწავლის დროა!',
        icon: '/pwa-192x192.png',
      });
    } catch {
      // Ignore Notification constructor restriction on certain mobile browsers
    }
  }
}
