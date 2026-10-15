import Ionicons from '@expo/vector-icons/Ionicons';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { type ComponentProps, type ReactNode, useEffect, useState } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { DockCard, restoreDismissed, useDismissedCount } from '../components/BookingDock';
import { HooraMark } from '../components/HooraLogo';
import { ink } from '../components/home/homeTheme';
import { fonts, noBounce } from '../components/theme';
import { Toast, useToast } from '../components/Toast';
import { TopBar } from '../components/TopBar';
import { DOCK_STATES } from '../data/bookingDock';
import { BOOKING_DAY, type NotifGroup, type NotifKey, NOTIFICATIONS } from '../data/notifications';
import { TRACK_STAGES } from '../data/serviceTracking';
import {
  getPermission,
  isOn,
  notifContent,
  type Permission,
  requestPermission,
  sendNotification,
  sendSequence,
} from '../lib/notifications';
import { useAppStore } from '../store/AppStore';

type IconName = ComponentProps<typeof Ionicons>['name'];

const TRACK = { false: '#D9DBE1', true: ink.text };

/**
 * Configuration — preview-build switches (Profile → Edit profile → Configuration): the Hoora Black
 * member preview, the booking dock above the nav (every card in order, switchable one by one) and
 * every notification Hoora sends (switchable, with a preview and a "send now").
 */
export default function ConfigurationScreen() {
  const insets = useSafeAreaInsets();
  const { blackMember, setProfile, dockPreview, setDockPreview, notifPrefs, setNotifPrefs } = useAppStore();
  const [permission, setPermission] = useState<Permission>('undetermined');

  useEffect(() => {
    void getPermission().then(setPermission);
  }, []);
  const toast = useToast();
  const closed = useDismissedCount();

  const dockOn = !dockPreview?.off;
  const hidden = new Set(dockPreview?.hidden ?? []);
  const onCount = DOCK_STATES.filter((s) => !hidden.has(s.key)).length;

  const toggleState = (key: string, on: boolean) => {
    void Haptics.selectionAsync();
    const next = new Set(hidden);
    if (on) next.delete(key);
    else next.add(key);
    setDockPreview({ hidden: [...next] });
  };

  const notifOn = !notifPrefs?.off;
  const notifHidden = new Set(notifPrefs?.hidden ?? []);
  const toggleNotif = (key: NotifKey, on: boolean) => {
    void Haptics.selectionAsync();
    const next = new Set(notifHidden);
    if (on) next.delete(key);
    else next.add(key);
    setNotifPrefs({ hidden: [...next] });
  };
  const allow = async () => {
    if (permission === 'denied') {
      void Linking.openSettings();
      return;
    }
    setPermission(await requestPermission());
  };
  const sendOne = async (key: NotifKey) => {
    if (permission === 'unsupported') return toast.show('Open the app on your phone to get notifications');
    const sent = await sendNotification(key, {}, { prefs: notifPrefs });
    setPermission(await getPermission());
    toast.show(sent ? 'Sent. Check your notifications' : 'Allow notifications to preview them');
  };
  const playDay = async () => {
    if (permission === 'unsupported') return toast.show('Open the app on your phone to get notifications');
    const count = await sendSequence(BOOKING_DAY, notifPrefs, 4);
    setPermission(await getPermission());
    toast.show(
      count ? `${count} notifications, 4 seconds apart. Lock your phone to watch` : 'Allow notifications first',
    );
  };
  const groups: NotifGroup[] = ['Booking', 'Payment', 'Rewards', 'Packs'];

  return (
    <View style={styles.screen}>
      <TopBar title="Configuration" topInset={insets.top} onBack={() => router.back()} />
      <ScrollView {...noBounce} contentContainerStyle={[styles.body, { paddingBottom: insets.bottom + 32 }]}>
        <Text style={styles.intro}>Preview build — switch demo features on and off. Changes apply right away.</Text>

        <Text style={styles.section}>Hoora Black</Text>
        <View style={styles.card}>
          <SwitchRow
            icon="diamond-outline"
            title="Hoora Black member"
            sub="Show the member profile and card"
            value={!!blackMember}
            onChange={(v) => setProfile({ blackMember: v })}
          />
        </View>

        <Text style={styles.section}>Booking tracking</Text>
        <View style={styles.card}>
          {[
            { key: 'success', label: 'Booking success screen', go: () => router.push('/booking/confirmed?id=w2') },
            ...TRACK_STAGES.map((s) => ({
              key: s.key,
              label: s.label,
              go: () => router.push({ pathname: '/booking/[id]', params: { id: 'w2', stage: s.key } }),
            })),
          ].map((s, i) => (
            <View key={s.key}>
              {i > 0 && <View style={styles.rule} />}
              <Pressable
                onPress={s.go}
                style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
                accessibilityRole="link"
              >
                <View style={styles.step}>
                  <Text style={styles.stepText}>{i + 1}</Text>
                </View>
                <Text style={styles.rowTitle}>{s.label}</Text>
                <Ionicons name="chevron-forward" size={18} color={ink.muted} />
              </Pressable>
            </View>
          ))}
        </View>

        <Text style={styles.section}>Booking dock</Text>
        <View style={styles.card}>
          <SwitchRow
            icon="albums-outline"
            title="Show booking dock"
            sub="The strip above the nav on Home, Rewards and Profile"
            value={dockOn}
            onChange={(v) => setDockPreview({ off: !v })}
          />
          {closed > 0 && (
            <>
              <View style={styles.rule} />
              <Pressable
                onPress={() => {
                  restoreDismissed();
                  toast.show('Closed cards are back');
                }}
                style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
                accessibilityRole="button"
              >
                <Ionicons name="refresh" size={20} color={ink.text} />
                <Text style={styles.rowTitle}>
                  Show closed cards again <Text style={styles.count}>({closed})</Text>
                </Text>
              </Pressable>
            </>
          )}
        </View>

        <View style={styles.listHead}>
          <Text style={[styles.section, styles.sectionInline]}>Dock cards · in order</Text>
          <Text style={styles.listCount}>
            {onCount} of {DOCK_STATES.length} on
          </Text>
        </View>
        <View style={[styles.states, !dockOn && styles.dim]} pointerEvents={dockOn ? 'auto' : 'none'}>
          {DOCK_STATES.map((s, i) => {
            const on = !hidden.has(s.key);
            return (
              <View key={s.key} style={[styles.stateCard, i > 0 && styles.stateGap]}>
                <View style={styles.stateHead}>
                  <View style={styles.step}>
                    <Text style={styles.stepText}>{i + 1}</Text>
                  </View>
                  <Text style={styles.stateLabel} numberOfLines={1}>
                    {s.label}
                  </Text>
                  <Switch
                    value={on}
                    onValueChange={(v) => toggleState(s.key, v)}
                    trackColor={TRACK}
                    thumbColor="#FFFFFF"
                    accessibilityLabel={`${s.label} card`}
                  />
                </View>
                {/* Live preview of the card exactly as the dock draws it */}
                <View style={!on && styles.off} pointerEvents="none">
                  <DockCard item={s.item} />
                </View>
              </View>
            );
          })}
        </View>
        {!dockOn && <Text style={styles.note}>Turn on “Show booking dock” to choose cards.</Text>}

        <Text style={styles.section}>Notifications</Text>
        <View style={styles.card}>
          <SwitchRow
            icon="notifications-outline"
            title="Send notifications"
            sub="Booking updates, payments, rewards and packs"
            value={notifOn}
            onChange={(v) => setNotifPrefs({ off: !v })}
          />
          <View style={styles.rule} />
          <View style={styles.row}>
            <Ionicons name="phone-portrait-outline" size={20} color={ink.text} />
            <Text style={styles.rowTitle}>On this phone</Text>
            {permission === 'granted' ? (
              <Text style={styles.allowed}>Allowed</Text>
            ) : permission === 'unsupported' ? (
              <Text style={styles.count}>Phone only</Text>
            ) : (
              <Pressable onPress={() => void allow()} accessibilityRole="button" style={styles.smallBtn}>
                <Text style={styles.smallBtnText}>{permission === 'denied' ? 'Open settings' : 'Allow'}</Text>
              </Pressable>
            )}
          </View>
          <View style={styles.rule} />
          <Pressable
            onPress={() => void playDay()}
            disabled={!notifOn}
            style={({ pressed }) => [styles.row, pressed && styles.rowPressed, !notifOn && styles.dim]}
            accessibilityRole="button"
          >
            <Ionicons name="play-circle-outline" size={20} color={ink.text} />
            <Text style={styles.rowTitle}>Play a booking day</Text>
            <Text style={styles.count}>{BOOKING_DAY.length} in order</Text>
          </Pressable>
        </View>

        {groups.map((group) => (
          <View key={group}>
            <Text style={styles.section}>{group}</Text>
            <View style={[styles.states, !notifOn && styles.dim]} pointerEvents={notifOn ? 'auto' : 'none'}>
              {NOTIFICATIONS.filter((n) => n.group === group).map((n, i) => {
                const on = isOn(n.key, { hidden: [...notifHidden] });
                return (
                  <View key={n.key} style={[styles.stateCard, i > 0 && styles.stateGap]}>
                    <View style={styles.stateHead}>
                      <Text style={styles.stateLabel} numberOfLines={1}>
                        {n.trigger}
                      </Text>
                      <Pressable
                        onPress={() => void sendOne(n.key)}
                        disabled={!on}
                        hitSlop={6}
                        accessibilityRole="button"
                        accessibilityLabel={`Send: ${n.trigger}`}
                        style={[styles.sendBtn, !on && styles.off]}
                      >
                        <Ionicons name="paper-plane-outline" size={13} color={ink.text} />
                        <Text style={styles.sendText}>Send</Text>
                      </Pressable>
                      <Switch
                        value={on}
                        onValueChange={(v) => toggleNotif(n.key, v)}
                        trackColor={TRACK}
                        thumbColor="#FFFFFF"
                        accessibilityLabel={`${n.trigger} notification`}
                      />
                    </View>
                    <View style={!on && styles.off} pointerEvents="none">
                      <NotifPreview notifKey={n.key} />
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        ))}
      </ScrollView>
      <Toast toast={toast} bottom={insets.bottom + 24} />
    </View>
  );
}

/** How the notification looks on the lock screen (iOS style), with the real copy. */
function NotifPreview({ notifKey }: { notifKey: NotifKey }) {
  const { title, body, timeSensitive } = notifContent(notifKey);
  return (
    <View style={styles.notif}>
      <View style={styles.notifIcon}>
        <HooraMark size={24} />
      </View>
      <View style={styles.notifCopy}>
        <View style={styles.notifTop}>
          <Text style={styles.notifApp}>{timeSensitive ? 'TIME SENSITIVE' : 'HOORA'}</Text>
          <Text style={styles.notifTime}>now</Text>
        </View>
        <Text style={styles.notifTitle}>{title}</Text>
        <Text style={styles.notifBody}>{body}</Text>
      </View>
    </View>
  );
}

function SwitchRow({
  icon,
  title,
  sub,
  value,
  onChange,
}: {
  icon: IconName;
  title: string;
  sub: string;
  value: boolean;
  onChange: (v: boolean) => void;
}): ReactNode {
  return (
    <View style={styles.switchRow}>
      <Ionicons name={icon} size={20} color={ink.text} />
      <View style={styles.switchCopy}>
        <Text style={styles.rowTitle}>{title}</Text>
        <Text style={styles.rowSub}>{sub}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={(v) => {
          void Haptics.selectionAsync();
          onChange(v);
        }}
        trackColor={TRACK}
        thumbColor="#FFFFFF"
        accessibilityLabel={title}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F6F7F9',
  },
  body: {
    paddingHorizontal: 16,
  },
  intro: {
    marginTop: 4,
    marginHorizontal: 4,
    fontFamily: fonts.medium,
    fontSize: 13,
    lineHeight: 18,
    color: ink.muted,
  },
  section: {
    marginTop: 20,
    marginBottom: 8,
    marginLeft: 4,
    fontFamily: fonts.bold,
    fontSize: 13,
    color: ink.muted,
  },
  sectionInline: {
    marginTop: 0,
    marginBottom: 0,
  },
  card: {
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: ink.line,
    overflow: 'hidden',
  },
  rule: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 50,
    backgroundColor: '#E2E3E8',
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    minHeight: 64,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  switchCopy: {
    flex: 1,
    gap: 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    height: 50,
    paddingHorizontal: 16,
  },
  rowPressed: {
    backgroundColor: '#FAFAFB',
  },
  rowTitle: {
    flex: 1,
    fontFamily: fonts.semiBold,
    fontSize: 14,
    color: ink.text,
  },
  rowSub: {
    fontFamily: fonts.medium,
    fontSize: 12.5,
    lineHeight: 17,
    color: ink.muted,
  },
  count: {
    color: ink.muted,
  },
  listHead: {
    marginTop: 20,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  listCount: {
    marginRight: 4,
    fontFamily: fonts.semiBold,
    fontSize: 12.5,
    color: ink.faint,
  },
  states: {
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: ink.line,
    padding: 10,
  },
  dim: {
    opacity: 0.45,
  },
  stateCard: {
    gap: 8,
  },
  stateGap: {
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E2E3E8',
  },
  stateHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 4,
  },
  step: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F2F3F5',
  },
  stepText: {
    fontFamily: fonts.bold,
    fontSize: 11.5,
    color: ink.text,
  },
  stateLabel: {
    flex: 1,
    fontFamily: fonts.semiBold,
    fontSize: 14,
    color: ink.text,
  },
  off: {
    opacity: 0.35,
  },
  allowed: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: '#0E9F5A',
  },
  smallBtn: {
    height: 32,
    paddingHorizontal: 14,
    borderRadius: 16,
    justifyContent: 'center',
    backgroundColor: ink.text,
  },
  smallBtnText: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: '#FFFFFF',
  },
  sendBtn: {
    height: 30,
    paddingHorizontal: 11,
    borderRadius: 15,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#F2F3F5',
  },
  sendText: {
    fontFamily: fonts.bold,
    fontSize: 12,
    color: ink.text,
  },
  notif: {
    flexDirection: 'row',
    gap: 11,
    padding: 12,
    borderRadius: 18,
    backgroundColor: '#1E1E21',
  },
  notifIcon: {
    width: 36,
    height: 36,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0B0B0F',
  },
  notifCopy: {
    flex: 1,
    gap: 1,
  },
  notifTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  notifApp: {
    fontFamily: fonts.semiBold,
    fontSize: 11,
    letterSpacing: 0.4,
    color: 'rgba(255,255,255,0.55)',
  },
  notifTime: {
    fontFamily: fonts.medium,
    fontSize: 11.5,
    color: 'rgba(255,255,255,0.55)',
  },
  notifTitle: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: '#FFFFFF',
  },
  notifBody: {
    fontFamily: fonts.medium,
    fontSize: 13,
    lineHeight: 18,
    color: 'rgba(255,255,255,0.85)',
  },
  note: {
    marginTop: 10,
    marginHorizontal: 4,
    fontFamily: fonts.medium,
    fontSize: 12.5,
    color: ink.muted,
  },
});
