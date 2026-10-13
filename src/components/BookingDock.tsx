import Ionicons from '@expo/vector-icons/Ionicons';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { type ComponentProps, useEffect, useSyncExternalStore } from 'react';
import { Animated, Easing, Image, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { DOCK_STATES, type DockEntry, type DockItem, type DockTone, dockCopy } from '../data/bookingDock';
import { useAppStore } from '../store/AppStore';
import { ink } from './home/homeTheme';
import { PressableScale } from './home/motion';
import { setDockHeight } from './tabBarSpace';
import { fonts, useAnimatedValue } from './theme';

type IconName = ComponentProps<typeof Ionicons>['name'];

const SIDE = 10;
const CARD_H = 60;
/** The row's own soft surface inside the white nav panel. */
const ROW_BG = '#F4F5F7';
const GREEN = '#0E9F5A';
/** Icon colour and the soft circle behind it, by urgency. */
const TONE: Record<DockTone, { icon: string; bg: string }> = {
  live: { icon: GREEN, bg: '#E9F7EF' },
  neutral: { icon: ink.text, bg: '#FFFFFF' },
};

// Cards the user closed (cart nudge, rating) stay closed for this session, until Configuration
// brings them back.
const dismissed = new Set<string>();
const listeners = new Set<() => void>();
const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
};
let version = 0;
const readVersion = () => version;
const notify = () => {
  version += 1;
  listeners.forEach((l) => l());
};
function dismiss(key: string) {
  dismissed.add(key);
  notify();
}

/** How many dock cards were closed with ✕ this session. */
export function useDismissedCount() {
  useSyncExternalStore(subscribe, readVersion, readVersion);
  return dismissed.size;
}

/** Brings back every card closed with ✕ (Configuration). */
export function restoreDismissed() {
  dismissed.clear();
  notify();
}

/** Dock cards to show: switched on in Configuration and not closed this session, in order. */
export function useVisibleDock(entries: DockEntry[] = DOCK_STATES) {
  const { dockPreview } = useAppStore();
  useSyncExternalStore(subscribe, readVersion, readVersion);
  if (dockPreview?.off) return [];
  const hidden = new Set(dockPreview?.hidden ?? []);
  return entries.filter((e) => !hidden.has(e.key) && !dismissed.has(e.key));
}

/**
 * Booking dock — a slim row attached to the top of the bottom navigation (one white panel, like
 * iOS 26's tab-bar accessory or a live order on a delivery app). Status first ("Arriving in 12 min"),
 * one supporting line, one action. Several cards swipe sideways, in the order given.
 */
export function BookingDock({ entries }: { entries: DockEntry[] }) {
  const { width } = useWindowDimensions();
  const scrollX = useAnimatedValue(0);
  const enter = useAnimatedValue(0);
  const many = entries.length > 1;

  useEffect(() => {
    Animated.spring(enter, { toValue: 1, useNativeDriver: true, speed: 14, bounciness: 4, delay: 150 }).start();
  }, [enter]);

  // Nothing to show: give the space back to the screen.
  useEffect(() => {
    if (entries.length === 0) setDockHeight(0);
  }, [entries.length]);
  useEffect(() => () => setDockHeight(0), []);

  if (entries.length === 0) return null;

  return (
    <Animated.View
      pointerEvents="box-none"
      onLayout={(e) => setDockHeight(e.nativeEvent.layout.height)}
      style={[
        styles.dock,
        {
          opacity: enter,
          transform: [{ translateY: enter.interpolate({ inputRange: [0, 1], outputRange: [8, 0] }) }],
        },
      ]}
    >
      <Animated.ScrollView
        horizontal
        pagingEnabled
        scrollEnabled={many}
        showsHorizontalScrollIndicator={false}
        decelerationRate="fast"
        scrollEventThrottle={16}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], { useNativeDriver: false })}
      >
        {entries.map((entry, i) => (
          <View key={entry.key} style={{ width, paddingHorizontal: SIDE }}>
            <DockCard
              item={entry.item}
              position={many ? `${i + 1} of ${entries.length}` : undefined}
              onDismiss={() => dismiss(entry.key)}
            />
          </View>
        ))}
      </Animated.ScrollView>
      {many && <Dots count={entries.length} width={width} scrollX={scrollX} />}
    </Animated.View>
  );
}

function target(item: DockItem) {
  return item.kind === 'cart' || item.kind === 'pack' ? '/wash' : `/booking/${item.id}`;
}

/** One dock card. Exported for the Configuration screen's previews. */
export function DockCard({ item, position, onDismiss }: { item: DockItem; position?: string; onDismiss?: () => void }) {
  const copy = dockCopy(item);
  const leave = useAnimatedValue(1);
  const open = () => router.push(target(item));
  const close = () => {
    void Haptics.selectionAsync();
    Animated.timing(leave, { toValue: 0, duration: 180, easing: Easing.in(Easing.quad), useNativeDriver: true }).start(
      () => onDismiss?.(),
    );
  };
  const label = `${copy.title}. ${copy.detail}.${position ? ` Card ${position}.` : ''}`;

  return (
    <Animated.View
      style={{
        opacity: leave,
        transform: [{ translateY: leave.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) }],
      }}
    >
      <Pressable
        onPress={open}
        accessibilityRole="button"
        accessibilityLabel={label}
        style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      >
        <Lead item={item} tone={copy.tone} />

        <View style={styles.copy}>
          <Text style={styles.title} numberOfLines={1}>
            {item.kind === 'live' && item.stage === 'on_the_way' ? (
              <>
                Arriving in <Text style={styles.eta}>{item.etaMin ?? 0} min</Text>
              </>
            ) : (
              copy.title
            )}
          </Text>
          <Detail item={item} text={copy.detail} />
        </View>

        {copy.cta && (
          <PressableScale onPress={open} accessibilityLabel={copy.cta} style={styles.cta}>
            <Text style={styles.ctaText}>{copy.cta}</Text>
          </PressableScale>
        )}
        {copy.dismissible && onDismiss && (
          <Pressable
            onPress={close}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel="Dismiss"
            style={styles.close}
          >
            <Ionicons name="close" size={18} color={ink.faint} />
          </Pressable>
        )}
      </Pressable>
    </Animated.View>
  );
}

// ——— Leading icon: one glyph per state, colour = urgency ———

const ICON: Record<string, IconName> = {
  scheduled: 'time',
  on_the_way: 'navigate',
  arrived: 'location',
  in_progress: 'water',
  rate: 'star',
  cart: 'cart',
};

const STARTER_PACK = require('../../assets/bookings/starter-pack.png');

function Lead({ item, tone }: { item: DockItem; tone: DockTone }) {
  const key = item.kind === 'live' ? item.stage : item.kind;
  const { icon: color, bg } = TONE[tone];

  // Packs show the Hoora "Starter Pack" tickets from the design file instead of an icon.
  if (item.kind === 'pack') {
    return <Image source={STARTER_PACK} style={styles.packArt} resizeMode="contain" accessibilityIgnoresInvertColors />;
  }

  // Rate the wash: a solid black star on white, matching the black "Rate" button beside it.
  if (item.kind === 'rate') {
    return (
      <View style={[styles.lead, styles.leadWhite]}>
        <Ionicons name="star" size={18} color={ink.text} />
      </View>
    );
  }

  // Booked for today, not started: a green clock on white, inside the empty track of the same
  // progress ring the next stages fill in. No motion.
  if (item.kind === 'live' && item.stage === 'scheduled') {
    return (
      <View style={[styles.lead, styles.leadWhite]}>
        <Ring value={0} />
        <Ionicons name="time" size={19} color={GREEN} />
      </View>
    );
  }

  // On the way, arrived and washing all share one look: the green progress ring round the icon.
  const ring = item.kind === 'live' && item.stage !== 'scheduled';
  return (
    <View style={[styles.lead, { backgroundColor: bg }]}>
      {ring && <Ring value={item.progress ?? 0} />}
      <Ionicons
        name={ICON[key]}
        size={17}
        color={color}
        style={item.kind === 'live' && item.stage === 'on_the_way' ? styles.arrow : undefined}
      />
    </View>
  );
}

function Detail({ item, text }: { item: DockItem; text: string }) {
  // The service end code is what the customer shares to close the service — make it stand out.
  if (item.kind === 'live' && item.stage === 'arrived' && item.endCode) {
    return (
      <Text style={styles.detail} numberOfLines={1}>
        Service end code <Text style={styles.code}>{item.endCode}</Text>
      </Text>
    );
  }
  return (
    <Text style={styles.detail} numberOfLines={1}>
      {text}
    </Text>
  );
}

// ——— Motion ———

const RING = 38;
const RING_R = 17.5;
const RING_C = 2 * Math.PI * RING_R;
/** Progress ring round the icon while the wash is under way. */
function Ring({ value }: { value: number }) {
  return (
    <Svg width={RING} height={RING} style={StyleSheet.absoluteFill}>
      <Circle cx={RING / 2} cy={RING / 2} r={RING_R} stroke="#DCE9E1" strokeWidth={2.5} fill="none" />
      <Circle
        cx={RING / 2}
        cy={RING / 2}
        r={RING_R}
        stroke={GREEN}
        strokeWidth={2.5}
        fill="none"
        strokeLinecap="round"
        strokeDasharray={`${RING_C} ${RING_C}`}
        strokeDashoffset={RING_C * (1 - value)}
        transform={`rotate(-90 ${RING / 2} ${RING / 2})`}
      />
    </Svg>
  );
}

function Dots({ count, width, scrollX }: { count: number; width: number; scrollX: Animated.Value }) {
  return (
    <View
      style={styles.dots}
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      {Array.from({ length: count }, (_, i) => {
        const range = [(i - 1) * width, i * width, (i + 1) * width];
        return (
          <Animated.View
            key={i}
            style={[
              styles.dot,
              {
                width: scrollX.interpolate({ inputRange: range, outputRange: [5, 14, 5], extrapolate: 'clamp' }),
                backgroundColor: scrollX.interpolate({
                  inputRange: range,
                  outputRange: ['#C9CBD1', ink.text, '#C9CBD1'],
                  extrapolate: 'clamp',
                }),
              },
            ]}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  dock: {
    paddingTop: 10,
    paddingBottom: 8,
  },
  card: {
    height: CARD_H,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    paddingLeft: 11,
    paddingRight: 10,
    borderRadius: 16,
    backgroundColor: ROW_BG,
    overflow: 'hidden',
  },
  cardPressed: {
    opacity: 0.85,
  },
  // 240 × 163 artwork (stacked tickets), a little wider than the icon circles.
  packArt: {
    width: 50,
    height: 34,
    marginLeft: -2,
    marginRight: -3,
  },
  overlay: {
    position: 'absolute',
    left: 0,
    top: 0,
  },
  leadWhite: {
    backgroundColor: '#FFFFFF',
  },
  lead: {
    width: RING,
    height: RING,
    borderRadius: RING / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // The arrow's weight sits ~1pt up-right of its box; nudge it back so it looks centred in the ring.
  arrow: {
    marginLeft: -1,
    marginTop: 1,
  },
  copy: {
    flex: 1,
    minWidth: 0,
    gap: 1,
  },
  eta: {
    color: GREEN,
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: 14.5,
    lineHeight: 19,
    letterSpacing: -0.2,
    color: ink.text,
  },
  detail: {
    fontFamily: fonts.medium,
    fontSize: 12.5,
    lineHeight: 16,
    color: ink.muted,
  },
  code: {
    fontFamily: fonts.extraBold,
    letterSpacing: 1.5,
    color: ink.text,
  },
  cta: {
    height: 32,
    paddingHorizontal: 14,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: ink.text,
  },
  ctaText: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: '#FFFFFF',
  },
  close: {
    width: 24,
    height: 32,
    marginLeft: -4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dots: {
    alignSelf: 'center',
    marginTop: 7,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dot: {
    height: 5,
    borderRadius: 2.5,
  },
});
