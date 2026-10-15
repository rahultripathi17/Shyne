import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useFocusEffect } from 'expo-router';
import { setStatusBarStyle } from 'expo-status-bar';
import { useCallback, useMemo, useState } from 'react';
import { Image, Pressable, ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Chips, Coin, fmt, GhostButton, R, YellowButton } from '../../components/rewards/RewardsKit';
import { fonts, noBounce } from '../../components/theme';
import { EARNED, INVITE_TEXT, LEDGER, type LedgerEntry, ON_THE_WAY, POINT_VALUE_INR } from '../../data/referEarn';
import { useRewardsState } from '../../data/referEarnStore';

// Hoora Points wallet: balance, where points came from, where they went.

const COINS = require('../../../assets/rewards/hub/coins-left.jpg');

type Filter = 'all' | 'earned' | 'redeemed' | 'pending';
const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'earned', label: 'Earned' },
  { key: 'redeemed', label: 'Redeemed' },
  { key: 'pending', label: 'On the way' },
];

const ICON: Record<LedgerEntry['kind'], { name: 'people' | 'gift' | 'hourglass' | 'star'; bg: string; fg: string }> = {
  earned: { name: 'people', bg: R.greenSoft, fg: R.green },
  redeemed: { name: 'gift', bg: '#F1F1ED', fg: R.text },
  pending: { name: 'hourglass', bg: R.amberSoft, fg: R.amber },
};

export default function PointsScreen() {
  const insets = useSafeAreaInsets();
  const { balance, redeemed, redemptions } = useRewardsState();
  const [filter, setFilter] = useState<Filter>('all');

  useFocusEffect(
    useCallback(() => {
      setStatusBarStyle('light');
    }, []),
  );

  const entries = useMemo(() => {
    const spent: LedgerEntry[] = redemptions.map((r) => ({
      id: r.id,
      kind: 'redeemed',
      title: r.name,
      detail: r.code ? `Code ${r.code}` : 'Delivery in 5–7 days',
      date: r.date,
      month: 'This month',
      points: r.points,
    }));
    return [...spent, ...LEDGER].filter((e) => filter === 'all' || e.kind === filter);
  }, [redemptions, filter]);

  // Group under month headings, keeping order.
  const groups = useMemo(() => {
    const out: { month: string; items: LedgerEntry[] }[] = [];
    for (const e of entries) {
      const last = out[out.length - 1];
      if (last && last.month === e.month) last.items.push(e);
      else out.push({ month: e.month, items: [e] });
    }
    return out;
  }, [entries]);

  const back = () => (router.canGoBack() ? router.back() : router.replace('/rewards'));

  return (
    <View style={styles.screen}>
      <ScrollView
        {...noBounce}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 28 }}
      >
        <View style={[styles.top, { paddingTop: insets.top + 4 }]}>
          <Image source={COINS} style={styles.coins} />
          <View style={styles.bar}>
            <Pressable
              onPress={back}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel="Back"
              style={styles.back}
            >
              <Ionicons name="chevron-back" size={24} color={R.onNight} />
            </Pressable>
            <Text style={styles.barTitle}>Hoora Points</Text>
          </View>

          <Text style={styles.label}>Available balance</Text>
          <View style={styles.balance}>
            <Coin size={34} />
            <Text style={styles.balanceValue}>{fmt(balance)}</Text>
          </View>
          <Text style={styles.worth}>Worth ₹{fmt(balance * POINT_VALUE_INR)} in rewards · 1 point = ₹1</Text>

          <View style={styles.stats}>
            <Stat label="Earned" value={`+${fmt(EARNED)}`} />
            <View style={styles.divider} />
            <Stat label="Redeemed" value={redeemed > 0 ? `−${fmt(redeemed)}` : '0'} />
            <View style={styles.divider} />
            <Stat label="On the way" value={`+${fmt(ON_THE_WAY)}`} accent />
          </View>

          <View style={styles.actions}>
            <YellowButton
              label="Redeem points"
              icon="gift-outline"
              compact
              style={styles.flex}
              onPress={() => router.navigate({ pathname: '/rewards', params: { focus: 'redeem' } })}
            />
            <GhostButton
              label="Earn more"
              icon="add"
              compact
              dark
              style={styles.flex}
              onPress={() => Share.share({ message: INVITE_TEXT })}
            />
          </View>
        </View>

        <View style={styles.body}>
          <Text style={styles.heading}>History</Text>
          <Chips value={filter} options={FILTERS} onChange={setFilter} />

          {groups.length === 0 && (
            <View style={styles.empty}>
              <Ionicons name="receipt-outline" size={26} color={R.faint} />
              <Text style={styles.emptyText}>
                {filter === 'redeemed' ? 'Nothing redeemed yet. Your points are waiting!' : 'Nothing here yet.'}
              </Text>
            </View>
          )}

          {groups.map((g) => (
            <View key={g.month}>
              <Text style={styles.month}>{g.month}</Text>
              <View style={styles.list}>
                {g.items.map((e, i) => (
                  <Entry key={e.id} entry={e} last={i === g.items.length - 1} />
                ))}
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <View style={styles.stat}>
      <Text style={[styles.statValue, accent && { color: R.yellow }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function Entry({ entry, last }: { entry: LedgerEntry; last: boolean }) {
  const icon = entry.detail === 'Rate & Earn' ? { ...ICON.earned, name: 'star' as const } : ICON[entry.kind];
  const sign = entry.kind === 'redeemed' ? '−' : '+';
  return (
    <View style={[styles.entry, !last && styles.entryLine]}>
      <View style={[styles.entryIcon, { backgroundColor: icon.bg }]}>
        <Ionicons name={icon.name} size={16} color={icon.fg} />
      </View>
      <View style={styles.flex}>
        <Text style={styles.entryTitle} numberOfLines={1}>
          {entry.title}
        </Text>
        <Text style={styles.entryDetail} numberOfLines={1}>
          {entry.date} · {entry.detail}
        </Text>
      </View>
      <Text
        style={[
          styles.entryPoints,
          entry.kind === 'earned' && { color: R.green },
          entry.kind === 'pending' && { color: R.faint },
        ]}
      >
        {sign}
        {fmt(entry.points)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: R.canvas,
  },
  flex: {
    flex: 1,
  },
  top: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: R.night,
    borderBottomLeftRadius: 26,
    borderBottomRightRadius: 26,
    overflow: 'hidden',
  },
  coins: {
    position: 'absolute',
    right: -20,
    top: 34,
    width: 96,
    height: 197,
    opacity: 0.9,
    transform: [{ scaleX: -1 }],
  },
  bar: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginLeft: -8,
  },
  back: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  barTitle: {
    fontFamily: fonts.extraBold,
    fontSize: 18,
    letterSpacing: -0.3,
    color: R.onNight,
  },
  label: {
    marginTop: 12,
    fontFamily: fonts.semiBold,
    fontSize: 13,
    color: R.onNightMuted,
  },
  balance: {
    marginTop: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  balanceValue: {
    fontFamily: fonts.extraBold,
    fontSize: 42,
    letterSpacing: -1.4,
    color: R.onNight,
  },
  worth: {
    marginTop: 2,
    fontFamily: fonts.medium,
    fontSize: 12.5,
    color: R.onNightMuted,
  },
  stats: {
    marginTop: 18,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 11,
    borderRadius: 14,
    backgroundColor: R.nightRaised,
  },
  divider: {
    width: 1,
    height: 26,
    backgroundColor: R.nightLine,
  },
  stat: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  statValue: {
    fontFamily: fonts.extraBold,
    fontSize: 15,
    color: R.onNight,
  },
  statLabel: {
    fontFamily: fonts.medium,
    fontSize: 11,
    color: R.onNightMuted,
  },
  actions: {
    marginTop: 14,
    flexDirection: 'row',
    gap: 10,
  },
  body: {
    paddingHorizontal: 16,
    paddingTop: 22,
    gap: 14,
  },
  heading: {
    fontFamily: fonts.extraBold,
    fontSize: 18,
    letterSpacing: -0.4,
    color: R.text,
  },
  month: {
    marginBottom: 8,
    fontFamily: fonts.bold,
    fontSize: 12,
    letterSpacing: 0.3,
    color: R.muted,
  },
  list: {
    paddingHorizontal: 14,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: R.line,
    backgroundColor: R.card,
  },
  entry: {
    minHeight: 62,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  entryLine: {
    borderBottomWidth: 1,
    borderBottomColor: R.line,
  },
  entryIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  entryTitle: {
    fontFamily: fonts.bold,
    fontSize: 13.5,
    color: R.text,
  },
  entryDetail: {
    marginTop: 2,
    fontFamily: fonts.medium,
    fontSize: 11.5,
    color: R.muted,
  },
  entryPoints: {
    fontFamily: fonts.extraBold,
    fontSize: 14,
    color: R.text,
  },
  empty: {
    alignItems: 'center',
    gap: 8,
    paddingVertical: 32,
  },
  emptyText: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: R.muted,
  },
});
