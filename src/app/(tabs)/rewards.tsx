import Ionicons from '@expo/vector-icons/Ionicons';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { setStatusBarStyle } from 'expo-status-bar';
import { Fragment, useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Image,
  Linking,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { RedeemSheet } from '../../components/rewards/RedeemSheet';
import { RewardCard } from '../../components/rewards/RewardCard';
import { Coin, fmt, ProgressBar, R, Segmented, TierBadge } from '../../components/rewards/RewardsKit';
import { useTabBarSpace } from '../../components/tabBarSpace';
import { fonts, noBounce, useAnimatedValue } from '../../components/theme';
import {
  BOOKED,
  CATALOG,
  type CatalogItem,
  HERO_SLIDES,
  INVITE_TEXT,
  ME,
  MY_TIER,
  PENDING,
  REFER_CODE,
  TIERS,
} from '../../data/referEarn';
import { useRewardsState } from '../../data/referEarnStore';

// Refer & Earn (Rewards tab), mapped from the Figma (Dev File, section 11461:5761) and laid out
// like Home: a full-bleed black hero, then a light sheet.
//   Hero   title + Hoora Points (wallet & history) · "Refer a friend & get FREE …" · how it works
//   Sheet  invite (code, share, my referrals) → your league (progress, leaderboard) → redeem points
// Every fact appears once; the leaderboard, leagues, store and wallet each open their own screen.

const IMG = {
  stepShare: require('../../../assets/rewards/hub/how-refer.png'),
  stepBook: require('../../../assets/rewards/hub/how-book.png'),
  stepEarn: require('../../../assets/rewards/hub/how-earn.png'),
};

type Shelf = 'product' | 'voucher';
const SHELVES: { key: Shelf; label: string }[] = [
  { key: 'product', label: 'Products' },
  { key: 'voucher', label: 'Vouchers' },
];

const SHEET_OVERLAP = 26;
const SLIDE_MS = 2600;

export default function RewardsScreen() {
  const insets = useSafeAreaInsets();
  const bottomSpace = useTabBarSpace();
  const { width } = useWindowDimensions();
  const { balance } = useRewardsState();
  const params = useLocalSearchParams<{ focus?: string }>();
  const scroll = useRef<ScrollView>(null);
  const heroH = useRef(0);
  const redeemY = useRef(0);
  const darkBar = useRef(false);
  const cover = useAnimatedValue(0);
  const [shelf, setShelf] = useState<Shelf>('product');
  const [selected, setSelected] = useState<CatalogItem | null>(null);
  const [copied, setCopied] = useState(false);

  const { tier, left, goal, index } = MY_TIER;

  // Light status bar over the black hero; dark once the sheet scrolls under it.
  useFocusEffect(
    useCallback(() => {
      setStatusBarStyle(darkBar.current ? 'dark' : 'light');
      return () => setStatusBarStyle('dark');
    }, []),
  );
  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const past = e.nativeEvent.contentOffset.y > heroH.current - insets.top - SHEET_OVERLAP;
    if (past !== darkBar.current) {
      darkBar.current = past;
      setStatusBarStyle(past ? 'dark' : 'light');
      Animated.timing(cover, { toValue: past ? 1 : 0, duration: 160, useNativeDriver: true }).start();
    }
  };

  // "Redeem points" in the wallet lands here, on the shelf.
  useEffect(() => {
    if (params.focus !== 'redeem') return;
    const t = setTimeout(
      () => scroll.current?.scrollTo({ y: heroH.current - SHEET_OVERLAP + redeemY.current - 12, animated: true }),
      250,
    );
    router.setParams({ focus: undefined });
    return () => clearTimeout(t);
  }, [params.focus]);

  const copyCode = async () => {
    await Clipboard.setStringAsync(REFER_CODE);
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };
  const share = () => Share.share({ message: INVITE_TEXT });
  const whatsapp = async () => {
    void Haptics.selectionAsync();
    const url = `whatsapp://send?text=${encodeURIComponent(INVITE_TEXT)}`;
    if (await Linking.canOpenURL(url).catch(() => false)) await Linking.openURL(url);
    else await share();
  };

  // What you can redeem now comes first, then the closest ones.
  const items = CATALOG.filter((c) => c.kind === shelf).sort(
    (a, b) => Number(b.cost <= balance) - Number(a.cost <= balance) || a.cost - b.cost,
  );
  const cardW = (Math.min(width, 620) - 32 - 12) / 2;

  return (
    <View style={styles.screen}>
      <ScrollView
        ref={scroll}
        {...noBounce}
        showsVerticalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={32}
        contentContainerStyle={styles.scrollContent}
      >
        {/* ——— Hero ——— */}
        <View
          style={[styles.hero, { paddingTop: insets.top + 4 }]}
          onLayout={(e) => {
            heroH.current = e.nativeEvent.layout.height;
          }}
        >
          <View style={styles.header}>
            <Text style={styles.title}>Refer & Earn</Text>
            <Pressable
              onPress={() => router.push('/refer/points')}
              accessibilityRole="button"
              accessibilityLabel={`${balance} Hoora Points. Open wallet and history`}
              style={({ pressed }) => [styles.pointsPill, pressed && styles.pressed]}
            >
              <Coin size={18} />
              <Text style={styles.pointsText}>{fmt(balance)}</Text>
              <Ionicons name="chevron-forward" size={14} color={R.onNightMuted} />
            </Pressable>
          </View>

          <HeroSlides />

          <View style={styles.how}>
            <HowStep image={IMG.stepShare} text="Share your code" />
            <Ionicons name="chevron-forward" size={13} color="rgba(255,255,255,0.35)" style={styles.howArrow} />
            <HowStep image={IMG.stepBook} text="Friend books a service" />
            <Ionicons name="chevron-forward" size={13} color="rgba(255,255,255,0.35)" style={styles.howArrow} />
            <HowStep image={IMG.stepEarn} text={`You earn ${tier.pointsPerReferral} points`} />
          </View>
        </View>

        {/* ——— Sheet ——— */}
        <View style={[styles.sheet, { paddingBottom: bottomSpace + 24 }]}>
          {/* Invite */}
          <View style={styles.card}>
            <Text style={styles.inviteTitle}>
              Invite friends and earn <Text style={styles.strong}>{tier.pointsPerReferral} Hoora Points</Text> each
            </Text>
            <View style={styles.codeRow}>
              <Text style={styles.code} selectable>
                {REFER_CODE}
              </Text>
              <Pressable
                onPress={copyCode}
                hitSlop={6}
                accessibilityRole="button"
                accessibilityLabel="Copy referral code"
                style={({ pressed }) => [styles.copy, pressed && styles.pressed]}
              >
                <Ionicons name={copied ? 'checkmark' : 'copy-outline'} size={15} color={R.text} />
                <Text style={styles.copyText}>{copied ? 'Copied' : 'Copy'}</Text>
              </Pressable>
            </View>
            <View style={styles.shareRow}>
              <Pressable
                onPress={whatsapp}
                accessibilityRole="button"
                style={({ pressed }) => [styles.whatsapp, pressed && styles.pressed]}
              >
                <Ionicons name="logo-whatsapp" size={18} color="#FFFFFF" />
                <Text style={styles.whatsappText}>WhatsApp</Text>
              </Pressable>
              <Pressable
                onPress={share}
                accessibilityRole="button"
                style={({ pressed }) => [styles.other, pressed && styles.pressed]}
              >
                <Ionicons name="share-social-outline" size={17} color={R.text} />
                <Text style={styles.otherText}>Other</Text>
              </Pressable>
            </View>
            <Pressable
              onPress={() => router.push('/refer/referrals')}
              accessibilityRole="button"
              style={({ pressed }) => [styles.cardRow, pressed && styles.pressed]}
            >
              <Text style={styles.cardRowTitle}>My referrals</Text>
              <View style={styles.chips}>
                <View style={styles.chip}>
                  <View style={[styles.dot, { backgroundColor: R.green }]} />
                  <Text style={styles.chipText}>{BOOKED.length} booked</Text>
                </View>
                <View style={styles.chip}>
                  <View style={[styles.dot, { backgroundColor: R.gold }]} />
                  <Text style={styles.chipText}>{PENDING.length} pending</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={16} color={R.faint} />
            </Pressable>
          </View>

          {/* Your league */}
          <View>
            <Text style={styles.sectionTitle}>Your league</Text>
            <View style={styles.card}>
              <Pressable
                onPress={() => router.push('/refer/leagues')}
                accessibilityRole="button"
                accessibilityLabel={`${tier.name} league. ${left} more referrals to your next reward`}
                style={({ pressed }) => [pressed && styles.pressed]}
              >
                <View style={styles.ladder}>
                  {TIERS.map((t, i) => (
                    <Fragment key={t.id}>
                      {i > 0 && <View style={[styles.rung, i <= index && styles.rungOn]} />}
                      <View style={styles.rungItem}>
                        <View style={[styles.rungBadge, i > index && styles.rungFuture]}>
                          <TierBadge tier={t} height={i === index ? 40 : 26} />
                        </View>
                        <Text style={[styles.rungName, i === index && styles.rungNameOn]}>{t.name}</Text>
                      </View>
                    </Fragment>
                  ))}
                </View>
                <Text style={styles.leagueHeadline}>
                  {left > 0 ? `${left} more to a free ${tier.reward.replace('FREE ', '')}` : `${tier.reward} unlocked`}
                </Text>
                <View style={styles.bar}>
                  <View style={styles.flex}>
                    <ProgressBar value={ME.successful / goal} height={8} track="#EEEDE8" />
                  </View>
                  <Text style={styles.barCount}>
                    {ME.successful}/{goal}
                  </Text>
                </View>
              </Pressable>
              <View style={styles.buttons}>
                <Pressable
                  onPress={() => router.push('/refer/leagues')}
                  accessibilityRole="button"
                  style={({ pressed }) => [styles.btn, pressed && styles.pressed]}
                >
                  <Ionicons name="ribbon-outline" size={16} color={R.text} />
                  <Text style={styles.btnText}>All leagues</Text>
                </Pressable>
                <Pressable
                  onPress={() => router.push('/refer/leaderboard')}
                  accessibilityRole="button"
                  accessibilityLabel={`Leaderboard, you are number ${ME.rank}`}
                  style={({ pressed }) => [styles.btn, pressed && styles.pressed]}
                >
                  <Ionicons name="trophy-outline" size={16} color={R.text} />
                  <Text style={styles.btnText}>Leaderboard</Text>
                  <Text style={styles.btnRank}>#{ME.rank}</Text>
                </Pressable>
              </View>
            </View>
          </View>

          {/* Redeem points */}
          <View
            onLayout={(e) => {
              redeemY.current = e.nativeEvent.layout.y;
            }}
          >
            <Text style={styles.sectionTitle}>Redeem points</Text>
            <Segmented value={shelf} options={SHELVES} onChange={setShelf} stretch />
            <View style={styles.grid}>
              {items.slice(0, 2).map((item) => (
                <RewardCard
                  key={item.id}
                  item={item}
                  width={cardW}
                  balance={balance}
                  onPress={() => setSelected(item)}
                />
              ))}
            </View>
            <Pressable
              onPress={() => router.push({ pathname: '/refer/store', params: { shelf } })}
              accessibilityRole="button"
              style={({ pressed }) => [styles.viewAll, pressed && styles.pressed]}
            >
              <Text style={styles.viewAllText}>
                View all {shelf === 'product' ? 'products' : 'vouchers'} ({items.length})
              </Text>
              <Ionicons name="chevron-forward" size={16} color={R.text} />
            </Pressable>
          </View>
        </View>
      </ScrollView>

      {/* Solid strip behind the status bar once the sheet scrolls under it */}
      <Animated.View pointerEvents="none" style={[styles.topCover, { height: insets.top, opacity: cover }]} />

      <RedeemSheet
        item={selected}
        balance={balance}
        onClose={() => setSelected(null)}
        onEarnMore={() => {
          setSelected(null);
          setTimeout(() => void whatsapp(), 350);
        }}
      />
    </View>
  );
}

/** "Refer a friend & get FREE …" — cycles through the prizes, as in the Figma banner. */
function HeroSlides() {
  const [i, setI] = useState(0);
  const fade = useAnimatedValue(1);

  useEffect(() => {
    const timer = setInterval(() => {
      Animated.timing(fade, { toValue: 0, duration: 220, useNativeDriver: true }).start(() => {
        setI((n) => (n + 1) % HERO_SLIDES.length);
        Animated.timing(fade, { toValue: 1, duration: 320, useNativeDriver: true }).start();
      });
    }, SLIDE_MS);
    return () => clearInterval(timer);
  }, [fade]);

  const slide = HERO_SLIDES[i];
  const lift = fade.interpolate({ inputRange: [0, 1], outputRange: [6, 0] });

  return (
    <View style={styles.slides}>
      <View style={styles.flex}>
        <Text style={styles.kicker}>Refer a friend & get</Text>
        <Text style={styles.free}>FREE</Text>
        <Animated.Text style={[styles.prize, { opacity: fade, transform: [{ translateY: lift }] }]} numberOfLines={1}>
          {slide.title}
        </Animated.Text>
        <View style={styles.dots}>
          {HERO_SLIDES.map((s, n) => (
            <View key={s.key} style={[styles.dotSlide, n === i && styles.dotSlideOn]} />
          ))}
        </View>
      </View>
      <View style={styles.art}>
        <View style={styles.disc} />
        <Animated.Image
          source={slide.image}
          resizeMode="contain"
          style={[styles.artImage, { opacity: fade, transform: [{ translateY: lift }] }]}
        />
      </View>
    </View>
  );
}

function HowStep({ image, text }: { image: number; text: string }) {
  return (
    <View style={styles.howStep}>
      <View style={styles.howIcon}>
        <Image source={image} resizeMode="contain" style={styles.howImage} />
      </View>
      <Text style={styles.howText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: R.night,
  },
  flex: {
    flex: 1,
  },
  strong: {
    fontFamily: fonts.extraBold,
    color: R.text,
  },
  pressed: {
    opacity: 0.78,
  },

  // Hero
  hero: {
    backgroundColor: R.night,
    paddingHorizontal: 20,
    paddingBottom: SHEET_OVERLAP + 18,
  },
  header: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontFamily: fonts.extraBold,
    fontSize: 21,
    letterSpacing: -0.5,
    color: R.onNight,
  },
  pointsPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 36,
    paddingLeft: 10,
    paddingRight: 8,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  pointsText: {
    fontFamily: fonts.extraBold,
    fontSize: 14.5,
    color: R.onNight,
  },
  slides: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 130,
  },
  kicker: {
    fontFamily: fonts.semiBold,
    fontSize: 14,
    color: R.onNightMuted,
  },
  free: {
    marginTop: 2,
    fontFamily: fonts.extraBoldItalic,
    fontSize: 42,
    lineHeight: 48,
    color: R.yellow,
  },
  prize: {
    fontFamily: fonts.extraBold,
    fontSize: 19,
    letterSpacing: -0.3,
    color: R.onNight,
  },
  dots: {
    marginTop: 12,
    flexDirection: 'row',
    gap: 5,
  },
  dotSlide: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  dotSlideOn: {
    width: 14,
    backgroundColor: R.yellow,
  },
  art: {
    width: 150,
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disc: {
    position: 'absolute',
    width: 116,
    height: 116,
    borderRadius: 58,
    backgroundColor: R.yellow,
  },
  artImage: {
    width: 148,
    height: 96,
  },
  how: {
    marginTop: 22,
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
    paddingHorizontal: 6,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  howArrow: {
    marginTop: 12,
  },
  howStep: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
  },
  howIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: R.card,
  },
  howImage: {
    width: 20,
    height: 20,
  },
  howText: {
    textAlign: 'center',
    fontFamily: fonts.medium,
    fontSize: 11,
    lineHeight: 14,
    color: R.onNightMuted,
  },

  // Sheet
  scrollContent: {
    flexGrow: 1,
  },
  sheet: {
    flexGrow: 1,
    marginTop: -SHEET_OVERLAP,
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 24,
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    backgroundColor: R.canvas,
  },
  sectionTitle: {
    marginBottom: 10,
    fontFamily: fonts.extraBold,
    fontSize: 17,
    letterSpacing: -0.4,
    color: R.text,
  },
  card: {
    padding: 16,
    borderRadius: 20,
    backgroundColor: R.card,
  },
  cardRow: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: R.line,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  cardRowTitle: {
    flex: 1,
    fontFamily: fonts.bold,
    fontSize: 13.5,
    color: R.text,
  },

  // Invite
  inviteTitle: {
    fontFamily: fonts.semiBold,
    fontSize: 13,
    color: R.muted,
  },
  codeRow: {
    marginTop: 12,
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 14,
    paddingRight: 5,
    borderRadius: 12,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#E6DDB8',
    backgroundColor: '#FBF8EC',
  },
  code: {
    flex: 1,
    fontFamily: fonts.extraBold,
    fontSize: 16.5,
    letterSpacing: 1.6,
    color: R.text,
  },
  copy: {
    height: 36,
    paddingHorizontal: 12,
    borderRadius: 9,
    backgroundColor: R.card,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  copyText: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: R.text,
  },
  shareRow: {
    marginTop: 10,
    flexDirection: 'row',
    gap: 10,
  },
  whatsapp: {
    flex: 1,
    height: 46,
    borderRadius: 13,
    backgroundColor: R.whatsapp,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  whatsappText: {
    fontFamily: fonts.extraBold,
    fontSize: 14.5,
    color: '#FFFFFF',
  },
  other: {
    height: 46,
    paddingHorizontal: 18,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: '#E2E2DC',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  otherText: {
    fontFamily: fonts.bold,
    fontSize: 13.5,
    color: R.text,
  },
  chips: {
    flexDirection: 'row',
    gap: 6,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 26,
    paddingHorizontal: 9,
    borderRadius: 13,
    backgroundColor: '#F4F3EF',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  chipText: {
    fontFamily: fonts.semiBold,
    fontSize: 11.5,
    color: R.text,
  },

  // Your league
  ladder: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 18,
  },
  rung: {
    flex: 1,
    height: 2,
    marginBottom: 26,
    borderRadius: 1,
    backgroundColor: '#E6E5DF',
  },
  rungOn: {
    backgroundColor: R.gold,
  },
  rungItem: {
    width: 54,
    alignItems: 'center',
    gap: 5,
  },
  rungBadge: {
    height: 40,
    justifyContent: 'flex-end',
  },
  rungFuture: {
    opacity: 0.35,
  },
  rungName: {
    fontFamily: fonts.medium,
    fontSize: 10.5,
    color: R.faint,
  },
  rungNameOn: {
    fontFamily: fonts.extraBold,
    color: R.text,
  },
  leagueHeadline: {
    fontFamily: fonts.extraBold,
    fontSize: 16.5,
    lineHeight: 22,
    letterSpacing: -0.4,
    color: R.text,
  },
  buttons: {
    marginTop: 16,
    flexDirection: 'row',
    gap: 10,
  },
  btn: {
    flex: 1,
    height: 44,
    borderRadius: 13,
    backgroundColor: '#F4F3EF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  btnText: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: R.text,
  },
  btnRank: {
    fontFamily: fonts.extraBold,
    fontSize: 13,
    color: R.goldDeep,
  },
  bar: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  barCount: {
    fontFamily: fonts.bold,
    fontSize: 12.5,
    color: R.text,
  },

  // Redeem points
  grid: {
    marginTop: 12,
    flexDirection: 'row',
    gap: 12,
  },
  viewAll: {
    marginTop: 12,
    height: 46,
    borderRadius: 14,
    backgroundColor: R.card,
    borderWidth: 1,
    borderColor: '#E4E3DD',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  viewAllText: {
    fontFamily: fonts.bold,
    fontSize: 13.5,
    color: R.text,
  },

  topCover: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    backgroundColor: R.canvas,
  },
});
