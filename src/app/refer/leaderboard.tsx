import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useFocusEffect } from 'expo-router';
import { setStatusBarStyle } from 'expo-status-bar';
import { useCallback, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ClaimForm, Sheet } from '../../components/rewards/ClaimForm';
import { CongratsModal } from '../../components/rewards/CongratsModal';
import { Avatar, fmt, R, Segmented } from '../../components/rewards/RewardsKit';
import { fonts, noBounce } from '../../components/theme';
import { type Board, BOARD_RESET, LAST_MONTH, LEADERS, type Leader, PRIZES, YEARLY_LIST } from '../../data/referEarn';
import { claimPrize, useRewardsState } from '../../data/referEarnStore';

// Leaderboard: this month's / this year's top referrers, with your own rank pinned at the bottom.
// What the top places win opens from the Prizes button (Figma "Leader board" and "Rewards").

const BOARDS: { key: Board; label: string }[] = [
  { key: 'monthly', label: 'This month' },
  { key: 'yearly', label: 'This year' },
];

const CROWN = require('../../../assets/rewards/hub/crown.png');
const MEDAL = ['#E9AE00', '#A9ADB6', '#C0814F'];
const ORD = ['1st', '2nd', '3rd'];

export default function LeaderboardScreen() {
  const insets = useSafeAreaInsets();
  const [board, setBoard] = useState<Board>('monthly');
  const [prizesOpen, setPrizesOpen] = useState(false);
  const [wonOpen, setWonOpen] = useState(false);
  const [claimOpen, setClaimOpen] = useState(false);
  const { prizeClaimed } = useRewardsState();

  useFocusEffect(
    useCallback(() => {
      setStatusBarStyle('dark');
    }, []),
  );

  const back = () => (router.canGoBack() ? router.back() : router.replace('/rewards'));
  const rows = LEADERS[board];
  const [first, second, third] = rows;
  const rest = rows.filter((r) => r.rank >= 4 && r.rank <= 10);
  const me = rows.find((l) => l.me);

  return (
    <View style={styles.screen}>
      <View style={[styles.bar, { paddingTop: insets.top + 4 }]}>
        <Pressable onPress={back} hitSlop={10} accessibilityRole="button" accessibilityLabel="Back" style={styles.back}>
          <Ionicons name="chevron-back" size={24} color={R.text} />
        </Pressable>
        <Text style={styles.title}>Leaderboard</Text>
        <Pressable
          onPress={() => setPrizesOpen(true)}
          accessibilityRole="button"
          accessibilityLabel="See prizes"
          style={({ pressed }) => [styles.prizesBtn, pressed && styles.pressed]}
        >
          <Ionicons name="gift-outline" size={16} color={R.text} />
          <Text style={styles.prizesBtnText}>Prizes</Text>
        </Pressable>
      </View>

      <ScrollView
        {...noBounce}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, { paddingBottom: 110 + insets.bottom }]}
      >
        {!prizeClaimed && (
          <Pressable
            onPress={() => setWonOpen(true)}
            accessibilityRole="button"
            style={({ pressed }) => [styles.won, pressed && styles.pressed]}
          >
            <Image source={CROWN} style={styles.wonCrown} />
            <Text style={styles.wonText} numberOfLines={1}>
              You won a {LAST_MONTH.prize.name}
            </Text>
            <View style={styles.wonCta}>
              <Text style={styles.wonCtaText}>Claim</Text>
            </View>
          </Pressable>
        )}

        <View style={styles.boardHead}>
          <Segmented value={board} options={BOARDS} onChange={setBoard} />
          <Text style={styles.reset}>{board === 'monthly' ? 'Resets month end' : 'Resets 31 Dec'}</Text>
        </View>

        <View style={styles.podium}>
          <Spot leader={second} place={2} />
          <Spot leader={first} place={1} />
          <Spot leader={third} place={3} />
        </View>

        <View style={styles.list}>
          {rest.map((r, i) => (
            <View key={r.rank} style={[styles.row, i < rest.length - 1 && styles.line]}>
              <Text style={styles.rowRank}>{r.rank}</Text>
              <Avatar name={r.name} size={34} index={r.rank} />
              <Text style={styles.rowName} numberOfLines={1}>
                {r.name}
              </Text>
              <Text style={styles.rowPoints}>{fmt(r.points)} pts</Text>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Your own rank, always in view */}
      {me && (
        <View style={[styles.mePin, { paddingBottom: insets.bottom + 10 }]}>
          <View style={styles.meRow}>
            <Text style={styles.meRank}>#{me.rank}</Text>
            <Avatar name="You" size={34} index={0} ring={R.yellow} />
            <View style={styles.flex}>
              <Text style={styles.meName}>You</Text>
              <Text style={styles.meSub}>{gapText(board, me)}</Text>
            </View>
            <Text style={styles.mePoints}>{fmt(me.points)} pts</Text>
          </View>
        </View>
      )}

      {/* Prizes */}
      <Sheet visible={prizesOpen} onClose={() => setPrizesOpen(false)}>
        <Text style={styles.sheetTitle}>Prizes</Text>
        <Text style={styles.sheetSub}>{BOARD_RESET[board]}. Prizes are delivered free.</Text>
        <View style={styles.sheetToggle}>
          <Segmented value={board} options={BOARDS} onChange={setBoard} stretch />
        </View>
        {PRIZES[board].map((p, i) => (
          <View key={p.rank} style={[styles.prize, i < 2 && styles.line]}>
            <View style={styles.prizeArt}>
              <Image source={p.image} resizeMode="contain" style={styles.prizeImage} />
            </View>
            <View style={styles.flex}>
              <Text style={[styles.prizeOrd, { color: MEDAL[p.rank - 1] }]}>{ORD[p.rank - 1]} place</Text>
              <Text style={styles.prizeName}>{p.name}</Text>
            </View>
          </View>
        ))}
        {board === 'yearly' &&
          YEARLY_LIST.map((name, i) => (
            <View key={name} style={[styles.yearRow, styles.line]}>
              <Text style={styles.rowRank}>{i + 4}</Text>
              <Text style={styles.rowName} numberOfLines={1}>
                {name}
              </Text>
            </View>
          ))}
        <View style={styles.sheetEnd} />
      </Sheet>

      <CongratsModal
        visible={wonOpen}
        month={LAST_MONTH.month}
        rank={LAST_MONTH.rank}
        prize={LAST_MONTH.prize}
        claimed={prizeClaimed}
        onClaim={() => {
          setWonOpen(false);
          setTimeout(() => setClaimOpen(true), 350);
        }}
        onClose={() => setWonOpen(false)}
      />
      <ClaimForm
        visible={claimOpen}
        prize={LAST_MONTH.prize.name}
        onClose={() => setClaimOpen(false)}
        onSubmit={() => {
          claimPrize();
          setClaimOpen(false);
          setTimeout(() => setWonOpen(true), 350);
        }}
      />
    </View>
  );
}

/** How far you are from the top 10, in plain words. */
function gapText(board: Board, me: Leader) {
  const tenth = LEADERS[board].find((l) => l.rank === 10);
  if (!tenth || me.rank <= 10) return 'You’re in the top 10';
  return `${fmt(tenth.points - me.points)} pts to reach the top 10`;
}

function Spot({ leader, place }: { leader: Leader; place: 1 | 2 | 3 }) {
  const top = place === 1;
  return (
    <View style={styles.spot}>
      {top ? <Image source={CROWN} style={styles.crown} /> : <View style={styles.crownSpace} />}
      <Avatar name={leader.name} size={top ? 64 : 52} index={place + 2} ring={MEDAL[place - 1]} />
      <Text style={styles.spotName} numberOfLines={1}>
        {leader.name}
      </Text>
      <Text style={styles.spotPoints}>{fmt(leader.points)} pts</Text>
      <View style={[styles.plinth, { height: top ? 54 : place === 2 ? 40 : 30 }]}>
        <Text style={[styles.plinthText, { color: MEDAL[place - 1] }]}>{place}</Text>
      </View>
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
  pressed: {
    opacity: 0.78,
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
    fontSize: 17,
    letterSpacing: -0.3,
    color: R.text,
  },
  prizesBtn: {
    marginRight: 8,
    height: 34,
    paddingHorizontal: 12,
    borderRadius: 17,
    backgroundColor: R.card,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  prizesBtnText: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: R.text,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 8,
    gap: 14,
  },
  won: {
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingLeft: 12,
    paddingRight: 6,
    borderRadius: 14,
    backgroundColor: R.card,
  },
  wonCrown: {
    width: 26,
    height: 20,
  },
  wonText: {
    flex: 1,
    fontFamily: fonts.semiBold,
    fontSize: 13,
    color: R.text,
  },
  wonCta: {
    height: 36,
    paddingHorizontal: 16,
    borderRadius: 18,
    backgroundColor: R.yellow,
    justifyContent: 'center',
  },
  wonCtaText: {
    fontFamily: fonts.extraBold,
    fontSize: 12.5,
    color: R.text,
  },
  boardHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  reset: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: R.muted,
  },
  podium: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    paddingTop: 16,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: R.card,
    overflow: 'hidden',
  },
  spot: {
    flex: 1,
    alignItems: 'center',
  },
  crown: {
    width: 32,
    height: 25,
    marginBottom: 4,
  },
  crownSpace: {
    height: 29,
  },
  spotName: {
    marginTop: 8,
    fontFamily: fonts.bold,
    fontSize: 13,
    color: R.text,
  },
  spotPoints: {
    marginTop: 1,
    fontFamily: fonts.medium,
    fontSize: 11.5,
    color: R.muted,
  },
  plinth: {
    marginTop: 10,
    alignSelf: 'stretch',
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    backgroundColor: '#F4F3EE',
    alignItems: 'center',
    paddingTop: 6,
  },
  plinthText: {
    fontFamily: fonts.extraBoldItalic,
    fontSize: 16,
  },
  list: {
    paddingHorizontal: 14,
    borderRadius: 18,
    backgroundColor: R.card,
  },
  line: {
    borderBottomWidth: 1,
    borderBottomColor: R.line,
  },
  row: {
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  rowRank: {
    width: 22,
    textAlign: 'center',
    fontFamily: fonts.extraBold,
    fontSize: 13,
    color: R.muted,
  },
  rowName: {
    flex: 1,
    fontFamily: fonts.semiBold,
    fontSize: 14,
    color: R.text,
  },
  rowPoints: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: R.text,
  },
  mePin: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 16,
    paddingTop: 10,
    backgroundColor: R.canvas,
  },
  meRow: {
    height: 64,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    borderRadius: 18,
    backgroundColor: R.night,
  },
  meRank: {
    minWidth: 36,
    fontFamily: fonts.extraBoldItalic,
    fontSize: 17,
    color: R.yellow,
  },
  meName: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: R.onNight,
  },
  meSub: {
    marginTop: 1,
    fontFamily: fonts.medium,
    fontSize: 11.5,
    color: R.onNightMuted,
  },
  mePoints: {
    fontFamily: fonts.extraBold,
    fontSize: 13.5,
    color: R.onNight,
  },
  sheetTitle: {
    fontFamily: fonts.extraBold,
    fontSize: 17,
    letterSpacing: -0.4,
    color: R.text,
  },
  sheetSub: {
    marginTop: 3,
    fontFamily: fonts.medium,
    fontSize: 12.5,
    color: R.muted,
  },
  sheetToggle: {
    marginTop: 14,
    marginBottom: 4,
  },
  prize: {
    minHeight: 88,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  prizeArt: {
    width: 68,
    height: 68,
    borderRadius: 14,
    backgroundColor: '#F4F3EE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  prizeImage: {
    width: 56,
    height: 56,
  },
  prizeOrd: {
    fontFamily: fonts.extraBoldItalic,
    fontSize: 13,
  },
  prizeName: {
    marginTop: 2,
    fontFamily: fonts.extraBold,
    fontSize: 15,
    color: R.text,
  },
  yearRow: {
    minHeight: 46,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sheetEnd: {
    height: 8,
  },
});
