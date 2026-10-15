import Ionicons from '@expo/vector-icons/Ionicons';
import * as Haptics from 'expo-haptics';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { setStatusBarStyle } from 'expo-status-bar';
import { useCallback, useState } from 'react';
import { Linking, Pressable, ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Avatar, Coin, R, Segmented } from '../../components/rewards/RewardsKit';
import { fonts, noBounce } from '../../components/theme';
import { BOOKED, INVITE_TEXT, LEDGER, PENDING, type Referral, REFERRALS } from '../../data/referEarn';

// My referrals: a simple history. Booked friends (with the points they earned you) and pending
// friends (with a reminder), one list at a time.

type ListTab = 'booked' | 'pending';

const pointsFor = (id: string) => LEDGER.find((e) => e.id === `ref-${id}`)?.points ?? 0;
const toneOf = (r: Referral) => REFERRALS.indexOf(r);

export default function ReferralsScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ tab?: string }>();
  const [tab, setTab] = useState<ListTab>(params.tab === 'pending' ? 'pending' : 'booked');
  const [reminded, setReminded] = useState<string[]>([]);

  useFocusEffect(
    useCallback(() => {
      setStatusBarStyle('dark');
    }, []),
  );

  const back = () => (router.canGoBack() ? router.back() : router.replace('/rewards'));
  const remind = async (r: Referral) => {
    void Haptics.selectionAsync();
    setReminded((s) => [...s, r.id]);
    const message = `Hi ${r.name.split(' ')[0]}, your first Hoora doorstep wash is still FREE. ${INVITE_TEXT}`;
    const url = `whatsapp://send?text=${encodeURIComponent(message)}`;
    if (await Linking.canOpenURL(url).catch(() => false)) await Linking.openURL(url);
    else await Share.share({ message });
  };

  const rows = tab === 'booked' ? BOOKED : PENDING;

  return (
    <View style={styles.screen}>
      <View style={[styles.bar, { paddingTop: insets.top + 4 }]}>
        <Pressable onPress={back} hitSlop={10} accessibilityRole="button" accessibilityLabel="Back" style={styles.back}>
          <Ionicons name="chevron-back" size={24} color={R.text} />
        </Pressable>
        <Text style={styles.title}>My referrals</Text>
      </View>

      <View style={styles.tabs}>
        <Segmented
          value={tab}
          options={[
            { key: 'booked', label: `Booked (${BOOKED.length})` },
            { key: 'pending', label: `Pending (${PENDING.length})` },
          ]}
          onChange={setTab}
          stretch
        />
      </View>

      <ScrollView
        {...noBounce}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}
      >
        {rows.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="people-outline" size={28} color={R.faint} />
            <Text style={styles.emptyText}>
              {tab === 'booked' ? 'No bookings from your friends yet' : 'Everyone you invited has booked'}
            </Text>
          </View>
        ) : (
          <View style={styles.list}>
            {rows.map((r, i) => {
              const sent = reminded.includes(r.id);
              return (
                <View key={r.id} style={[styles.row, i < rows.length - 1 && styles.line]}>
                  <Avatar name={r.name} size={40} index={toneOf(r)} />
                  <View style={styles.who}>
                    <Text style={styles.name} numberOfLines={1}>
                      {r.name}
                    </Text>
                    <Text style={styles.date}>{tab === 'booked' ? r.bookedOn : `Joined ${r.joined}`}</Text>
                  </View>
                  {tab === 'booked' ? (
                    <View style={styles.points}>
                      <Text style={styles.pointsText}>+{pointsFor(r.id)}</Text>
                      <Coin size={14} />
                    </View>
                  ) : (
                    <Pressable
                      onPress={() => void remind(r)}
                      disabled={sent}
                      accessibilityRole="button"
                      accessibilityLabel={sent ? `Reminder sent to ${r.name}` : `Remind ${r.name} on WhatsApp`}
                      style={({ pressed }) => [styles.remind, sent && styles.remindSent, pressed && styles.pressed]}
                    >
                      <Ionicons
                        name={sent ? 'checkmark' : 'logo-whatsapp'}
                        size={14}
                        color={sent ? R.muted : R.whatsapp}
                      />
                      <Text style={[styles.remindText, sent && styles.remindTextSent]}>
                        {sent ? 'Reminded' : 'Remind'}
                      </Text>
                    </Pressable>
                  )}
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: R.canvas,
  },
  pressed: {
    opacity: 0.75,
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingBottom: 6,
  },
  back: {
    width: 40,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontFamily: fonts.extraBold,
    fontSize: 17,
    letterSpacing: -0.3,
    color: R.text,
  },
  tabs: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 14,
  },
  content: {
    paddingHorizontal: 16,
  },
  list: {
    paddingHorizontal: 14,
    borderRadius: 18,
    backgroundColor: R.card,
  },
  row: {
    minHeight: 66,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  line: {
    borderBottomWidth: 1,
    borderBottomColor: R.line,
  },
  who: {
    flex: 1,
    gap: 2,
  },
  name: {
    fontFamily: fonts.bold,
    fontSize: 14.5,
    color: R.text,
  },
  date: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: R.muted,
  },
  points: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  pointsText: {
    fontFamily: fonts.extraBold,
    fontSize: 14,
    color: R.green,
  },
  remind: {
    height: 34,
    paddingHorizontal: 12,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: '#E2E1DB',
    backgroundColor: R.card,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  remindSent: {
    borderColor: 'transparent',
    backgroundColor: '#F1F0EB',
  },
  remindText: {
    fontFamily: fonts.bold,
    fontSize: 12,
    color: R.text,
  },
  remindTextSent: {
    fontFamily: fonts.semiBold,
    color: R.muted,
  },
  empty: {
    alignItems: 'center',
    gap: 10,
    paddingVertical: 48,
  },
  emptyText: {
    fontFamily: fonts.medium,
    fontSize: 13.5,
    color: R.muted,
  },
});
