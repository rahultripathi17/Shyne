import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { setStatusBarStyle } from 'expo-status-bar';
import { useCallback, useState } from 'react';
import { Linking, Pressable, ScrollView, Share, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { RedeemSheet } from '../../components/rewards/RedeemSheet';
import { RewardCard } from '../../components/rewards/RewardCard';
import { Coin, fmt, R, Segmented } from '../../components/rewards/RewardsKit';
import { fonts, noBounce } from '../../components/theme';
import { CATALOG, type CatalogItem, INVITE_TEXT } from '../../data/referEarn';
import { useRewardsState } from '../../data/referEarnStore';

// Everything Hoora Points can buy ("View all" from the Rewards tab; the Figma's in-app eStore).

type Shelf = 'product' | 'voucher';
const SHELVES: { key: Shelf; label: string }[] = [
  { key: 'product', label: 'Products' },
  { key: 'voucher', label: 'Vouchers' },
];

export default function RewardsStoreScreen() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const params = useLocalSearchParams<{ shelf?: string }>();
  const { balance } = useRewardsState();
  const [shelf, setShelf] = useState<Shelf>(params.shelf === 'voucher' ? 'voucher' : 'product');
  const [selected, setSelected] = useState<CatalogItem | null>(null);

  useFocusEffect(
    useCallback(() => {
      setStatusBarStyle('dark');
    }, []),
  );

  // What you can redeem now comes first, then the closest ones.
  const items = CATALOG.filter((c) => c.kind === shelf).sort(
    (a, b) => Number(b.cost <= balance) - Number(a.cost <= balance) || a.cost - b.cost,
  );
  const cardW = (Math.min(width, 620) - 32 - 12) / 2;
  const back = () => (router.canGoBack() ? router.back() : router.replace('/rewards'));
  const invite = async () => {
    const url = `whatsapp://send?text=${encodeURIComponent(INVITE_TEXT)}`;
    if (await Linking.canOpenURL(url).catch(() => false)) await Linking.openURL(url);
    else await Share.share({ message: INVITE_TEXT });
  };

  return (
    <View style={styles.screen}>
      <View style={[styles.bar, { paddingTop: insets.top + 4 }]}>
        <Pressable onPress={back} hitSlop={10} accessibilityRole="button" accessibilityLabel="Back" style={styles.back}>
          <Ionicons name="chevron-back" size={24} color={R.text} />
        </Pressable>
        <Text style={styles.title}>Rewards store</Text>
        <Pressable
          onPress={() => router.push('/refer/points')}
          accessibilityRole="button"
          accessibilityLabel={`${balance} Hoora Points. Open wallet and history`}
          style={({ pressed }) => [styles.pill, pressed && { opacity: 0.75 }]}
        >
          <Coin size={16} />
          <Text style={styles.pillText}>{fmt(balance)}</Text>
        </Pressable>
      </View>
      <View style={styles.tabs}>
        <Segmented value={shelf} options={SHELVES} onChange={setShelf} stretch />
      </View>
      <ScrollView
        {...noBounce}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.grid, { paddingBottom: insets.bottom + 24 }]}
      >
        {items.map((item) => (
          <RewardCard key={item.id} item={item} width={cardW} balance={balance} onPress={() => setSelected(item)} />
        ))}
      </ScrollView>
      <RedeemSheet
        item={selected}
        balance={balance}
        onClose={() => setSelected(null)}
        onEarnMore={() => {
          setSelected(null);
          setTimeout(() => void invite(), 350);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: R.canvas,
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
    flex: 1,
    fontFamily: fonts.extraBold,
    fontSize: 18,
    letterSpacing: -0.3,
    color: R.text,
  },
  pill: {
    marginRight: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    height: 34,
    paddingHorizontal: 11,
    borderRadius: 17,
    backgroundColor: R.night,
  },
  pillText: {
    fontFamily: fonts.extraBold,
    fontSize: 13.5,
    color: R.onNight,
  },
  tabs: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 12,
  },
  grid: {
    width: '100%',
    maxWidth: 620,
    alignSelf: 'center',
    paddingHorizontal: 16,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
});
