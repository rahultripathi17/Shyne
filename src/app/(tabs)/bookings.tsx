import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useFocusEffect } from 'expo-router';
import { setStatusBarStyle } from 'expo-status-bar';
import { type ComponentProps, useCallback, useEffect, useState } from 'react';
import {
  Animated,
  Easing,
  Image,
  type ImageSourcePropType,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { KindIcon } from '../../components/booking/KindIcon';
import { BookingSheet } from '../../components/BookingSheet';
import { PrimaryButton } from '../../components/Buttons';
import { ink } from '../../components/home/homeTheme';
import { useTabBarSpace } from '../../components/tabBarSpace';
import { fonts, formatPrice, noBounce, useAnimatedValue } from '../../components/theme';
import { Toast, useToast } from '../../components/Toast';
import { type BookingItem, type Tone, type VerticalKey, VERTICALS } from '../../data/bookingsDemo';
import { payLaterCopy, payPhase } from '../../data/payLater';
import { useAdvanceBooking } from '../../lib/advanceBooking';
import { opensDetails, statusLabel, TONES, useAllBookings } from '../../lib/bookings';
import { useAppStore } from '../../store/AppStore';

// My Bookings: a soft lemon header fading to near-white, the verticals as icons over labels on a
// thin line, the selected one marked by a short dark bar (Blinkit's category row). Then a small
// Upcoming / History toggle and the cards.
//
// Every card, in every vertical, reads the same way:
//   the service — photo, name, and one quiet line (type · add-ons)
//   when, which vehicle, where (tap for the journey; calling the partner or the RM lives there)
//   price · the card's main action
// The status sits in a small tag in the card's top-right corner.

type IconName = ComponentProps<typeof Ionicons>['name'];
type TabIcon = ComponentProps<typeof MaterialCommunityIcons>['name'];

const HEADER_SHADE = ['#FFF593', '#FFF9AD', '#FEFAD4', '#FFFDEE'] as const;
const RULE_COLOR = 'rgba(120,96,0,0.16)';
const IDLE = '#55575E';
const PAGE = '#FFFFFF';

// One line icon per vertical; the selected tab shows the filled version. Washes use the car from
// the Car Services switch.
const TAB_ICON: Record<Exclude<VerticalKey, 'washes'>, [TabIcon, TabIcon]> = {
  society: ['office-building-outline', 'office-building'],
  products: ['shopping-outline', 'shopping'],
  bundles: ['ticket-confirmation-outline', 'ticket-confirmation'],
  challans: ['traffic-light-outline', 'traffic-light'],
  garage: ['wrench-outline', 'wrench'],
  qr: ['qrcode-scan', 'qrcode'],
};

function VerticalIcon({
  vertical,
  on,
  size,
  color,
}: {
  vertical: VerticalKey;
  on: boolean;
  size: number;
  color: string;
}) {
  if (vertical === 'washes') return <KindIcon kind="car" size={size} color={color} />;
  return <MaterialCommunityIcons name={TAB_ICON[vertical][on ? 1 : 0]} size={size} color={color} />;
}

// The status icon, so the meaning doesn't rest on colour alone.
const TONE_ICON: Record<Tone, IconName> = {
  progress: 'sync-circle',
  transit: 'navigate-circle',
  pending: 'time',
  active: 'checkmark-circle',
  attention: 'alert-circle',
  done: 'checkmark-done-circle',
  closed: 'close-circle',
};

// Product and service art for bookings without a photo.
const SERVICE_ART: Partial<Record<VerticalKey, ImageSourcePropType>> = {
  washes: require('../../../assets/home/v2/wash-icon.png'),
  garage: require('../../../assets/home/v2/garage-icon.png'),
  products: require('../../../assets/home/v2/accessories-icon.png'),
};
/** Wide pictures look small in a square, so they're drawn a little larger and clipped softly. */
const WIDE_ART = new Set<ImageSourcePropType>([
  require('../../../assets/home/challan-check.png'),
  require('../../../assets/home/connect-qr.png'),
]);

// What the vehicle line describes: the vehicle, or the items in an order.
const META_ICON: Record<VerticalKey, IconName> = {
  washes: 'car-outline',
  society: 'car-outline',
  bundles: 'car-outline',
  garage: 'car-outline',
  challans: 'car-outline',
  products: 'cube-outline',
  qr: 'qr-code-outline',
};

const WHEN_ICON: Record<BookingItem['when']['icon'], IconName> = {
  calendar: 'calendar-clear-outline',
  truck: 'cube-outline',
  receipt: 'calendar-clear-outline',
  pickup: 'car-outline',
};

/** "One-time wash · 2 add-ons": the type, then what's included, in one line. */
const subLine = (item: BookingItem) =>
  [item.eyebrow, item.note?.replace(/ included$/, '')].filter(Boolean).join('  ·  ');

function BookingCard({
  item,
  onAction,
  onSchedule,
  onAdvance,
}: {
  item: BookingItem;
  onAction: (item: BookingItem) => void;
  onSchedule: (item: BookingItem) => void;
  /** Preview build: long-press the main button to move one of your own bookings on a step. */
  onAdvance?: (item: BookingItem) => void;
}) {
  const used = item.usage ? item.usage.total - item.usage.left : 0;
  const vertical = VERTICALS.find((v) => v.key === item.vertical) ?? VERTICALS[0];
  const art = item.image ?? SERVICE_ART[item.vertical] ?? vertical.image;
  const tone = TONES[item.tone];
  // Pay Later: what's left after the upfront part.
  const due = item.due ?? 0;

  return (
    <View style={styles.card}>
      {/* Status, tucked into the corner */}
      <View style={[styles.tag, { backgroundColor: tone.bg }]}>
        <Ionicons name={TONE_ICON[item.tone]} size={13} color={tone.fg} />
        <Text style={[styles.tagText, { color: tone.fg }]} numberOfLines={1}>
          {statusLabel(item)}
        </Text>
      </View>

      {/* What: the service photo (or product art), its name, then type · add-ons */}
      <Pressable
        onPress={() => onAction(item)}
        style={styles.head}
        accessibilityRole="button"
        accessibilityLabel={item.title}
      >
        <View style={styles.art}>
          {item.photo ? (
            <Image source={item.photo} resizeMode="cover" style={styles.artPhoto} />
          ) : (
            <Image source={art} resizeMode="contain" style={WIDE_ART.has(art) ? styles.artImgWide : styles.artImg} />
          )}
        </View>
        <View style={styles.headText}>
          <Text style={styles.title} numberOfLines={2}>
            {item.title}
          </Text>
          <Text style={styles.sub} numberOfLines={1}>
            {subLine(item)}
          </Text>
        </View>
      </Pressable>

      {item.usage && (
        <View style={styles.usage}>
          <View style={styles.usageTrack}>
            <View style={[styles.usageFill, { width: `${(used / item.usage.total) * 100}%` }]} />
          </View>
          <Text style={styles.usageText}>
            <Text style={styles.usageStrong}>
              {item.usage.left} of {item.usage.total}
            </Text>{' '}
            {item.usage.label}
          </Text>
        </View>
      )}

      {/* When, which vehicle, where — one tappable box that opens the journey */}
      <Pressable
        onPress={() => onSchedule(item)}
        style={({ pressed }) => [styles.info, pressed && { backgroundColor: '#F1F2F4' }]}
        accessibilityRole="button"
        accessibilityLabel={`${item.when.title}. ${item.meta}. ${item.when.sub}. See journey`}
      >
        <View style={styles.infoRow}>
          <Ionicons name={WHEN_ICON[item.when.icon]} size={16} color={ink.text} />
          <Text style={styles.dateText} numberOfLines={1}>
            {item.when.title}
          </Text>
          <Ionicons name="chevron-forward" size={15} color={ink.faint} />
        </View>
        <View style={styles.infoRow}>
          <Ionicons name={META_ICON[item.vertical]} size={16} color={ink.muted} />
          <Text style={styles.infoText} numberOfLines={1}>
            {item.meta}
          </Text>
        </View>
        <View style={styles.infoRow}>
          <Ionicons
            name={item.subIsNote ? 'information-circle-outline' : 'location-outline'}
            size={16}
            color={ink.muted}
          />
          <Text style={styles.infoText} numberOfLines={1}>
            {item.when.sub}
          </Text>
        </View>
      </Pressable>

      {item.alert ? (
        <View style={styles.alert}>
          <Ionicons name="warning" size={14} color={TONES.attention.fg} />
          <Text style={styles.alertText}>{item.alert}</Text>
        </View>
      ) : null}

      <View style={styles.foot}>
        <View style={{ flex: 1 }}>
          <Text style={styles.amount}>{formatPrice(item.amount)}</Text>
          {due > 0 ? (
            <Text style={[styles.dueText, item.status === 'Completed' && styles.dueNow]}>
              {payLaterCopy(payPhase(item.status === 'Completed'), due, item.paidUpfront).short}
            </Text>
          ) : (
            <Text style={styles.placed}>{item.placed}</Text>
          )}
        </View>
        <Pressable
          onPress={() => onAction(item)}
          onLongPress={onAdvance ? () => onAdvance(item) : undefined}
          delayLongPress={450}
          hitSlop={8}
          style={({ pressed }) => [styles.cta, pressed && { backgroundColor: '#F4F5F7' }]}
          accessibilityRole="button"
        >
          <Text style={styles.ctaText}>{item.action}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const SEG_PAD = 3;
const SEG_W = 88;

/** Upcoming / History: a small pill toggle whose white thumb slides between the two. */
function Segmented({ history, onChange }: { history: boolean; onChange: (history: boolean) => void }) {
  const x = useAnimatedValue(history ? 1 : 0);
  useEffect(() => {
    Animated.timing(x, {
      toValue: history ? 1 : 0,
      duration: 220,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [history, x]);

  return (
    <View style={styles.seg}>
      <Animated.View
        style={[
          styles.thumb,
          { transform: [{ translateX: x.interpolate({ inputRange: [0, 1], outputRange: [0, SEG_W] }) }] },
        ]}
      />
      {[
        { key: false, label: 'Upcoming' },
        { key: true, label: 'History' },
      ].map((o) => {
        const on = history === o.key;
        return (
          <Pressable
            key={o.label}
            onPress={() => onChange(o.key)}
            style={styles.segItem}
            accessibilityRole="tab"
            accessibilityState={{ selected: on }}
          >
            <Text style={[styles.segText, on && styles.segTextOn]}>{o.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export default function BookingsScreen() {
  const insets = useSafeAreaInsets();
  const bottomSpace = useTabBarSpace();
  const toast = useToast();
  const { dockPreview } = useAppStore();
  const advanceBooking = useAdvanceBooking();
  const [filter, setFilter] = useState<VerticalKey>('washes');
  const [history, setHistory] = useState(false);
  const [open, setOpen] = useState<BookingItem>();

  useFocusEffect(
    useCallback(() => {
      setStatusBarStyle('dark');
    }, []),
  );

  const all = useAllBookings();
  const list = all.filter((b) => b.vertical === filter && b.history === history);
  const vertical = VERTICALS.find((v) => v.key === filter) ?? VERTICALS[0];

  const pick = (key: VerticalKey) => {
    void Haptics.selectionAsync();
    setFilter(key);
  };

  // Track / View open the full booking page; pay, reorder, renew and book-again come later.
  const showDetails = (item: BookingItem) => router.push(`/booking/${item.id}`);
  const onAction = (item: BookingItem) => {
    if (opensDetails(item)) showDetails(item);
    else toast.show(`${item.action} — coming soon`);
  };
  const onAdvance = (item: BookingItem) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const now = advanceBooking(item.id);
    toast.show(now ?? 'This booking is all done');
  };

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <ScrollView
        {...noBounce}
        style={styles.scroll}
        stickyHeaderIndices={[1]}
        contentInsetAdjustmentBehavior="never"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: bottomSpace }}
      >
        {/* Header: title, then the verticals as an icon row */}
        <LinearGradient colors={HEADER_SHADE} locations={[0, 0.35, 0.7, 1]} style={styles.header}>
          <View style={styles.titleRow}>
            <Text style={styles.screenTitle}>My Bookings</Text>
            <Pressable
              onPress={() => toast.show('Help & Support — coming soon')}
              style={({ pressed }) => [styles.help, pressed && { opacity: 0.7 }]}
              accessibilityRole="button"
              accessibilityLabel="Help"
            >
              <Ionicons name="headset-outline" size={16} color={ink.text} />
              <Text style={styles.helpText}>Help</Text>
            </Pressable>
          </View>

          <View style={styles.tabBar}>
            {/* A thin line under the whole row; the selected tab's bar sits on it */}
            <View style={styles.tabRule} />
            <ScrollView
              horizontal
              {...noBounce}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.tabs}
            >
              {VERTICALS.map((v) => {
                const on = filter === v.key;
                return (
                  <Pressable
                    key={v.key}
                    onPress={() => pick(v.key)}
                    style={styles.tab}
                    accessibilityRole="tab"
                    accessibilityState={{ selected: on }}
                    accessibilityLabel={v.label}
                  >
                    <View style={styles.tabIcon}>
                      <VerticalIcon vertical={v.key} on={on} size={24} color={on ? ink.text : IDLE} />
                    </View>
                    <Text style={[styles.tabText, on && styles.tabTextOn]} numberOfLines={1}>
                      {v.label}
                    </Text>
                    <View style={[styles.tabBarMark, on && styles.tabBarMarkOn]} />
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        </LinearGradient>

        {/* Upcoming / History — pinned while scrolling */}
        <View style={styles.switchWrap}>
          <Segmented
            history={history}
            onChange={(h) => {
              void Haptics.selectionAsync();
              setHistory(h);
            }}
          />
        </View>

        <View style={styles.body}>
          {list.length === 0 ? (
            <View style={styles.empty}>
              <View style={styles.emptyArt}>
                <VerticalIcon vertical={vertical.key} on={false} size={30} color={ink.muted} />
              </View>
              <Text style={styles.emptyTitle}>{history ? 'No past bookings yet' : 'No upcoming bookings'}</Text>
              <Text style={styles.emptyText}>
                {history
                  ? 'Completed and cancelled bookings will show up here.'
                  : `Your ${vertical.label.toLowerCase()} bookings will show up here.`}
              </Text>
              {!history && (
                <PrimaryButton
                  label={vertical.explore}
                  onPress={() => (filter === 'washes' ? router.push('/wash') : toast.show('Coming soon'))}
                  style={styles.emptyBtn}
                />
              )}
            </View>
          ) : (
            <View style={{ gap: 14 }}>
              {list.map((item) => (
                <BookingCard
                  key={item.id}
                  item={item}
                  onAction={onAction}
                  onSchedule={setOpen}
                  onAdvance={item.own && !dockPreview?.noAdvance ? onAdvance : undefined}
                />
              ))}
            </View>
          )}
        </View>
      </ScrollView>
      <BookingSheet
        item={open}
        onClose={() => setOpen(undefined)}
        onDetails={(item) => {
          setOpen(undefined);
          showDetails(item);
        }}
        onHelp={(what) => {
          setOpen(undefined);
          toast.show(`${what} — coming soon`);
        }}
      />
      <Toast toast={toast} bottom={bottomSpace} />
    </View>
  );
}

const RULE = 1;

const styles = StyleSheet.create({
  // The strip behind the status bar matches the top of the header.
  screen: {
    flex: 1,
    backgroundColor: HEADER_SHADE[0],
  },
  scroll: {
    flex: 1,
    backgroundColor: PAGE,
  },
  header: {
    paddingTop: 16,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  screenTitle: {
    fontFamily: fonts.bold,
    fontSize: 22,
    letterSpacing: -0.5,
    color: ink.text,
  },
  help: {
    height: 34,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 13,
    borderRadius: 17,
    backgroundColor: '#FFFFFF',
  },
  helpText: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: ink.text,
  },
  // Tabs: icons over labels; the selected one gets a short dark bar on the line.
  tabBar: {
    marginTop: 22,
  },
  tabRule: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: RULE,
    backgroundColor: RULE_COLOR,
  },
  tabs: {
    paddingHorizontal: 8,
  },
  tab: {
    minWidth: 78,
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  tabBarMark: {
    marginTop: 9,
    alignSelf: 'stretch',
    marginHorizontal: 6,
    height: 4,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  tabBarMarkOn: {
    backgroundColor: ink.text,
  },
  tabIcon: {
    height: 26,
    justifyContent: 'center',
  },
  tabText: {
    marginTop: 5,
    fontFamily: fonts.medium,
    fontSize: 12,
    color: IDLE,
  },
  tabTextOn: {
    fontFamily: fonts.semiBold,
    color: ink.text,
  },
  switchWrap: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 10,
    backgroundColor: PAGE,
  },
  seg: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    padding: SEG_PAD,
    borderRadius: 16,
    backgroundColor: '#F1F2F4',
  },
  thumb: {
    position: 'absolute',
    top: SEG_PAD,
    bottom: SEG_PAD,
    left: SEG_PAD,
    width: SEG_W,
    borderRadius: 13,
    backgroundColor: '#FFFFFF',
    shadowColor: '#0B0B0F',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  segItem: {
    width: SEG_W,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segText: {
    fontFamily: fonts.medium,
    fontSize: 12.5,
    color: '#5F626A',
  },
  segTextOn: {
    fontFamily: fonts.semiBold,
    color: ink.text,
  },
  body: {
    paddingHorizontal: 16,
    paddingTop: 4,
  },
  card: {
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E9EAEE',
    shadowColor: '#0B0B0F',
    shadowOpacity: 0.05,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
    overflow: 'hidden',
  },
  // History outcome, tucked into the top-right corner.
  tag: {
    position: 'absolute',
    top: 0,
    right: 0,
    zIndex: 1,
    maxWidth: '58%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingLeft: 10,
    paddingRight: 12,
    paddingVertical: 6,
    borderBottomLeftRadius: 12,
  },
  tagText: {
    flexShrink: 1,
    fontFamily: fonts.semiBold,
    fontSize: 11.5,
  },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingTop: 34,
  },
  art: {
    width: 60,
    height: 60,
    borderRadius: 12,
    backgroundColor: '#F4F5F7',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  artPhoto: {
    width: '100%',
    height: '100%',
  },
  artImg: {
    width: 48,
    height: 48,
  },
  artImgWide: {
    width: 72,
    height: 72,
  },
  headText: {
    flex: 1,
    gap: 4,
  },
  title: {
    fontFamily: fonts.semiBold,
    fontSize: 15.5,
    lineHeight: 20,
    letterSpacing: -0.2,
    color: ink.text,
  },
  sub: {
    fontFamily: fonts.medium,
    fontSize: 12.5,
    color: ink.muted,
  },
  info: {
    gap: 9,
    marginHorizontal: 14,
    marginTop: 12,
    padding: 11,
    borderRadius: 10,
    backgroundColor: '#F7F8FA',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  infoText: {
    flex: 1,
    fontFamily: fonts.medium,
    fontSize: 12.5,
    color: ink.label,
  },
  dateText: {
    flex: 1,
    fontFamily: fonts.semiBold,
    fontSize: 13,
    color: ink.text,
  },
  // A plain, quiet button: the card's one action.
  cta: {
    height: 36,
    paddingHorizontal: 14,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: '#D5D7DC',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaText: {
    fontFamily: fonts.semiBold,
    fontSize: 12.5,
    color: ink.text,
  },
  usage: {
    marginHorizontal: 16,
    marginTop: 12,
    gap: 6,
  },
  usageTrack: {
    height: 4,
    borderRadius: 2,
    backgroundColor: '#ECEDF1',
    overflow: 'hidden',
  },
  usageFill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: ink.text,
  },
  usageText: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: ink.muted,
  },
  usageStrong: {
    fontFamily: fonts.semiBold,
    color: ink.text,
  },
  alert: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginHorizontal: 16,
    marginTop: 10,
  },
  alertText: {
    fontFamily: fonts.semiBold,
    fontSize: 12,
    color: '#D93636',
  },
  foot: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 14,
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E6E7EB',
  },
  amount: {
    fontFamily: fonts.semiBold,
    fontSize: 15.5,
    color: ink.text,
  },
  placed: {
    marginTop: 2,
    fontFamily: fonts.medium,
    fontSize: 12,
    color: ink.muted,
  },
  dueText: {
    marginTop: 2,
    fontFamily: fonts.semiBold,
    fontSize: 12,
    color: '#B76E00',
  },
  // Wash done and still unpaid: clearer.
  dueNow: {
    color: '#C22F2F',
  },
  empty: {
    alignItems: 'center',
    paddingTop: 40,
    paddingHorizontal: 10,
  },
  emptyArt: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    marginTop: 16,
    fontFamily: fonts.semiBold,
    fontSize: 16,
    color: ink.text,
  },
  emptyText: {
    marginTop: 6,
    maxWidth: 290,
    textAlign: 'center',
    fontFamily: fonts.regular,
    fontSize: 13.5,
    lineHeight: 19,
    color: ink.muted,
  },
  emptyBtn: {
    marginTop: 22,
    alignSelf: 'stretch',
  },
});
