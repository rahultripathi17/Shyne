import Ionicons from '@expo/vector-icons/Ionicons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useFocusEffect } from 'expo-router';
import { setStatusBarStyle } from 'expo-status-bar';
import { type ComponentProps, useCallback, useState } from 'react';
import { Image, type ImageSourcePropType, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BookingSheet } from '../../components/BookingSheet';
import { PrimaryButton } from '../../components/Buttons';
import { ink } from '../../components/home/homeTheme';
import { useTabBarSpace } from '../../components/tabBarSpace';
import { fonts, formatPrice, noBounce } from '../../components/theme';
import { Toast, useToast } from '../../components/Toast';
import { type BookingItem, type Tone, type VerticalKey, VERTICALS } from '../../data/bookingsDemo';
import { opensDetails, TONES, useAllBookings } from '../../lib/bookings';

// My Bookings — pick a vertical on top, then Upcoming or History. Every card reads the same way:
// the service, the vehicle and its type; when & where (tap it for the journey); then the price and
// one action that opens the full booking page.

type IconName = ComponentProps<typeof Ionicons>['name'];

// Service pictures for the card: square-padded versions of the wide artwork, so they fill the tile.
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

// What the line under the title describes: the vehicle, or the items in an order.
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

/** Status as a strip tucked into the card's top-right corner. */
function StatusStrip({ label, tone }: { label: string; tone: Tone }) {
  const t = TONES[tone];
  return (
    <View style={[styles.pill, { backgroundColor: t.bg }]}>
      <View style={[styles.pillDot, { backgroundColor: t.fg }]} />
      <Text style={[styles.pillText, { color: t.fg }]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

function BookingCard({
  item,
  onAction,
  onSchedule,
}: {
  item: BookingItem;
  onAction: (item: BookingItem) => void;
  onSchedule: (item: BookingItem) => void;
}) {
  const used = item.usage ? item.usage.total - item.usage.left : 0;
  const vertical = VERTICALS.find((v) => v.key === item.vertical) ?? VERTICALS[0];
  const art = item.image ?? SERVICE_ART[item.vertical] ?? vertical.image;

  return (
    <View style={styles.card}>
      <StatusStrip label={item.status} tone={item.tone} />

      {/* What: service picture, name and type */}
      <Pressable
        onPress={() => onAction(item)}
        style={styles.head}
        accessibilityRole="button"
        accessibilityLabel={item.title}
      >
        <View style={styles.art}>
          <Image source={art} resizeMode="contain" style={WIDE_ART.has(art) ? styles.artImgWide : styles.artImg} />
        </View>
        <View style={styles.headText}>
          <Text style={styles.title} numberOfLines={2}>
            {item.title}
          </Text>
          <Text style={styles.typeText} numberOfLines={1}>
            {item.eyebrow}
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

      {/* For whom, where, when — one tappable box that opens the journey */}
      <Pressable
        onPress={() => onSchedule(item)}
        style={({ pressed }) => [styles.info, pressed && { backgroundColor: '#EEF0F3' }]}
        accessibilityRole="button"
        accessibilityLabel={`${item.meta}. ${item.when.sub}. ${item.when.title}. See journey`}
      >
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
        <View style={styles.infoRow}>
          <Ionicons name={WHEN_ICON[item.when.icon]} size={16} color={ink.text} />
          <Text style={styles.dateText} numberOfLines={1}>
            {item.when.title}
          </Text>
          <Ionicons name="chevron-forward" size={15} color={ink.faint} />
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
          <Text style={[styles.amount, item.amountDue && { color: TONES.attention.fg }]}>
            {item.amountDue ? <Text style={styles.due}>Due </Text> : null}
            {formatPrice(item.amount)}
          </Text>
          <Text style={styles.placed}>{item.placed}</Text>
        </View>
        <Pressable
          onPress={() => onAction(item)}
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

export default function BookingsScreen() {
  const insets = useSafeAreaInsets();
  const bottomSpace = useTabBarSpace();
  const toast = useToast();
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
        {/* Title + verticals on a soft yellow header */}
        <LinearGradient colors={['#FFF3B8', '#FFFBE8', '#FFFFFF']} locations={[0, 0.6, 1]} style={styles.header}>
          <View style={styles.titleRow}>
            <Text style={styles.screenTitle}>My Bookings</Text>
            <Pressable
              onPress={() => toast.show('Help & Support — coming soon')}
              style={({ pressed }) => [styles.help, pressed && { opacity: 0.7 }]}
              accessibilityRole="button"
              accessibilityLabel="Help"
            >
              <Ionicons name="headset-outline" size={17} color={ink.text} />
              <Text style={styles.helpText}>Help</Text>
            </Pressable>
          </View>

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
                  style={[styles.tab, on && styles.tabOn]}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: on }}
                  accessibilityLabel={v.label}
                >
                  <Image source={v.image} resizeMode="contain" style={[styles.tabImg, !on && styles.tabImgOff]} />
                  <Text style={[styles.tabText, on && styles.tabTextOn]} numberOfLines={1}>
                    {v.label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </LinearGradient>

        {/* Upcoming / History switch — stays pinned while scrolling */}
        <View style={styles.switchWrap}>
          <View style={styles.switch}>
            {[
              { key: false, label: 'Upcoming' },
              { key: true, label: 'History' },
            ].map((t) => {
              const on = history === t.key;
              return (
                <Pressable
                  key={t.label}
                  onPress={() => {
                    void Haptics.selectionAsync();
                    setHistory(t.key);
                  }}
                  style={[styles.seg, on && styles.segOn]}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: on }}
                >
                  <Text style={[styles.segText, on && styles.segTextOn]}>{t.label}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.body}>
          {list.length === 0 ? (
            <View style={styles.empty}>
              <View style={styles.emptyArt}>
                <Image source={vertical.image} resizeMode="contain" style={styles.emptyImg} />
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
            <View style={{ gap: 16 }}>
              {list.map((item) => (
                <BookingCard key={item.id} item={item} onAction={onAction} onSchedule={setOpen} />
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

const styles = StyleSheet.create({
  // The strip behind the status bar matches the top of the yellow header.
  screen: {
    flex: 1,
    backgroundColor: '#FFF3B8',
  },
  scroll: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    paddingTop: 10,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
  },
  screenTitle: {
    fontFamily: fonts.extraBold,
    fontSize: 20,
    letterSpacing: -0.5,
    color: ink.text,
  },
  help: {
    height: 34,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EADFA8',
  },
  helpText: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: ink.text,
  },
  // Verticals as flat folder tabs: the selected one is a white tab joined to the page.
  tabs: {
    paddingHorizontal: 10,
    paddingTop: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E8DFB0',
  },
  tab: {
    minWidth: 86,
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingTop: 8,
    paddingBottom: 10,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: 'transparent',
    marginBottom: -1,
  },
  tabOn: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E8DFB0',
  },
  tabImg: {
    width: 40,
    height: 32,
  },
  tabImgOff: {
    opacity: 0.85,
  },
  tabText: {
    marginTop: 5,
    fontFamily: fonts.semiBold,
    fontSize: 12.5,
    color: ink.label,
  },
  tabTextOn: {
    fontFamily: fonts.extraBold,
    color: ink.text,
  },
  // Upcoming / History: one segmented switch.
  switchWrap: {
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 8,
    backgroundColor: '#FFFFFF',
  },
  switch: {
    flexDirection: 'row',
    padding: 3,
    borderRadius: 10,
    backgroundColor: '#F4F5F7',
  },
  seg: {
    flex: 1,
    height: 34,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: 8,
  },
  segOn: {
    backgroundColor: '#FFFFFF',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#DADCE2',
  },
  segText: {
    fontFamily: fonts.medium,
    fontSize: 13.5,
    color: ink.muted,
  },
  segTextOn: {
    fontFamily: fonts.bold,
    color: ink.text,
  },
  body: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  card: {
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EBECF0',
    shadowColor: '#0B0B0F',
    shadowOpacity: 0.04,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 1,
    overflow: 'hidden',
  },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingTop: 22,
  },
  art: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: '#F4F5F7',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  artImg: {
    width: 46,
    height: 46,
  },
  artImgWide: {
    width: 72,
    height: 72,
  },
  headText: {
    flex: 1,
    gap: 2,
  },
  pill: {
    position: 'absolute',
    top: 0,
    right: 0,
    zIndex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingLeft: 10,
    paddingRight: 12,
    paddingVertical: 4,
    borderBottomLeftRadius: 12,
  },
  pillDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  pillText: {
    fontFamily: fonts.bold,
    fontSize: 11,
  },
  info: {
    gap: 8,
    marginHorizontal: 14,
    marginTop: 12,
    padding: 10,
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
    fontFamily: fonts.bold,
    fontSize: 13,
    color: ink.text,
  },
  title: {
    fontFamily: fonts.semiBold,
    fontSize: 15,
    lineHeight: 20,
    letterSpacing: -0.2,
    color: ink.text,
  },
  typeText: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: ink.muted,
  },
  // A plain, quiet button: the card's one action.
  cta: {
    height: 34,
    paddingHorizontal: 14,
    borderRadius: 8,
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
    fontFamily: fonts.bold,
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
    fontFamily: fonts.bold,
    fontSize: 12,
    color: '#D93636',
  },
  foot: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E6E7EB',
  },
  placed: {
    marginTop: 2,
    fontFamily: fonts.medium,
    fontSize: 12,
    color: ink.muted,
  },
  amount: {
    fontFamily: fonts.extraBold,
    fontSize: 15,
    color: ink.text,
  },
  due: {
    fontFamily: fonts.bold,
    fontSize: 12,
  },
  empty: {
    alignItems: 'center',
    paddingTop: 36,
    paddingHorizontal: 10,
  },
  emptyArt: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: '#F4F5F7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyImg: {
    width: 110,
    height: 96,
  },
  emptyTitle: {
    marginTop: 18,
    fontFamily: fonts.extraBold,
    fontSize: 17,
    color: ink.text,
  },
  emptyText: {
    marginTop: 6,
    maxWidth: 290,
    textAlign: 'center',
    fontFamily: fonts.medium,
    fontSize: 14,
    lineHeight: 20,
    color: ink.muted,
  },
  emptyBtn: {
    marginTop: 22,
    alignSelf: 'stretch',
  },
});
