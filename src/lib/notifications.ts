import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import { useEffect } from 'react';
import { Platform } from 'react-native';

import { type NotifData, type NotifKey, notifDef, SAMPLE_NOTIF } from '../data/notifications';

// Hoora notifications: one place builds, sends and routes them. Today they're local notifications
// (they work in Expo Go); a server push carries the same `key` + data, so taps and copy stay the same.

export type NotifPrefs = {
  /** Every notification switched off. */
  off?: boolean;
  /** Notifications switched off one by one, by key. */
  hidden?: string[];
};

const supported = Platform.OS === 'ios' || Platform.OS === 'android';

/** Booking updates ring and break through; rewards and packs arrive quietly. */
const CHANNEL = { bookings: 'bookings', updates: 'updates' } as const;
const channelFor = (key: NotifKey) => {
  const group = notifDef(key).group;
  return group === 'Booking' || group === 'Payment' ? CHANNEL.bookings : CHANNEL.updates;
};

let ready = false;

/** Call once at start-up: how notifications look while the app is open, and Android channels. */
export function setupNotifications() {
  if (!supported || ready) return;
  ready = true;
  // Show the banner even when the app is open, so a live update is never missed.
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
  if (Platform.OS === 'android') {
    void Notifications.setNotificationChannelAsync(CHANNEL.bookings, {
      name: 'Booking updates',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 200, 120, 200],
      lightColor: '#FFE300',
    });
    void Notifications.setNotificationChannelAsync(CHANNEL.updates, {
      name: 'Rewards and packs',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }
}

export type Permission = 'granted' | 'denied' | 'undetermined' | 'unsupported';

export async function getPermission(): Promise<Permission> {
  if (!supported) return 'unsupported';
  const { status } = await Notifications.getPermissionsAsync();
  return status as Permission;
}

/** Asks once; afterwards the user changes it in phone Settings. */
export async function requestPermission(): Promise<Permission> {
  if (!supported) return 'unsupported';
  const { status } = await Notifications.requestPermissionsAsync({
    ios: { allowAlert: true, allowBadge: true, allowSound: true },
  });
  return status as Permission;
}

export const isOn = (key: NotifKey, prefs?: NotifPrefs) => !prefs?.off && !prefs?.hidden?.includes(key);

/** The exact title and body a notification will show (Configuration previews use this too). */
export function notifContent(key: NotifKey, data: Partial<NotifData> = {}) {
  const def = notifDef(key);
  const d = { ...SAMPLE_NOTIF, ...data };
  return { ...def.build(d), url: def.url(d), timeSensitive: !!def.timeSensitive };
}

/**
 * Sends one notification now, or after `afterSeconds`. Skipped when it's switched off in
 * Configuration or notifications aren't allowed. Returns whether it was sent.
 */
export async function sendNotification(
  key: NotifKey,
  data: Partial<NotifData> = {},
  { prefs, afterSeconds, at }: { prefs?: NotifPrefs; afterSeconds?: number; at?: Date } = {},
) {
  if (!supported || !isOn(key, prefs)) return false;
  if ((await getPermission()) !== 'granted' && (await requestPermission()) !== 'granted') return false;

  const { title, body, url, timeSensitive } = notifContent(key, data);
  const channelId = channelFor(key);
  const trigger: Notifications.NotificationTriggerInput = at
    ? { type: Notifications.SchedulableTriggerInputTypes.DATE, date: at, channelId }
    : afterSeconds
      ? { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: afterSeconds, channelId }
      : Platform.OS === 'android'
        ? { channelId }
        : null;

  await Notifications.scheduleNotificationAsync({
    identifier: at ? `${key}-${data.bookingId ?? ''}` : undefined,
    content: {
      title,
      body,
      data: { url, key },
      sound: 'default',
      ...(timeSensitive ? { interruptionLevel: 'timeSensitive' as const } : null),
    },
    trigger,
  });
  return true;
}

/**
 * Sends a run of notifications a few seconds apart (scheduled, so they still arrive with the
 * phone locked). Returns how many were queued.
 */
export async function sendSequence(keys: NotifKey[], prefs?: NotifPrefs, gapSeconds = 4) {
  if (!supported) return 0;
  if ((await getPermission()) !== 'granted' && (await requestPermission()) !== 'granted') return 0;
  const on = keys.filter((k) => isOn(k, prefs));
  await Promise.all(on.map((k, i) => sendNotification(k, {}, { prefs, afterSeconds: gapSeconds * (i + 1) })));
  return on.length;
}

/** A new booking: "Booking confirmed" now, and a reminder an hour before the slot if that's still ahead. */
export async function notifyBookingPlaced(data: Partial<NotifData>, start: Date, prefs?: NotifPrefs) {
  await sendNotification('booking_confirmed', data, { prefs });
  const remindAt = new Date(start.getTime() - 60 * 60 * 1000);
  if (remindAt.getTime() > Date.now() + 60 * 1000) {
    await sendNotification('reminder', data, { prefs, at: remindAt });
  }
}

/** Clears notifications that haven't arrived yet (e.g. a cancelled booking's reminder). */
export async function cancelScheduled(identifier: string) {
  if (!supported) return;
  await Notifications.cancelScheduledNotificationAsync(identifier).catch(() => undefined);
}

/** Tapping a notification opens its screen — also when the tap launched the app. */
export function useNotificationRouting(enabled: boolean) {
  useEffect(() => {
    if (!supported || !enabled) return;
    const open = (n: Notifications.Notification) => {
      const url = n.request.content.data?.url;
      if (typeof url === 'string') router.push(url as never);
    };
    const last = Notifications.getLastNotificationResponse();
    if (last?.notification) {
      open(last.notification);
      void Notifications.clearLastNotificationResponseAsync?.();
    }
    const sub = Notifications.addNotificationResponseReceivedListener((r) => open(r.notification));
    return () => sub.remove();
  }, [enabled]);
}
