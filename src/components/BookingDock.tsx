import Ionicons from '@expo/vector-icons/Ionicons';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { type ComponentProps, useEffect, useSyncExternalStore } from 'react';
import {
  ActivityIndicator,
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { type DockItem, type DockTone, dockCopy, SAMPLE_DOCK } from '../data/bookingDock';
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
const AMBER = '#B54708';
/** Icon colour and the soft circle behind it, by urgency. */
const TONE: Record<DockTone, { icon: string; bg: string }> = {
  live: { icon: GREEN, bg: '#E9F7EF' },
  attention: { icon: ink.gold, bg: ink.yellowSoft },
  neutral: { icon: ink.text, bg: '#FFFFFF' },
};

// Cards the user closed (cart nudge, rating) stay closed for this session.
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
function dismiss(id: string) {
  dismissed.add(id);
  version += 1;
  listeners.forEach((l) => l());
}

/** Dock items still showing (not dismissed this session). */
export function useVisibleDock(items: DockItem[] = SAMPLE_DOCK) {
  useSyncExternalStore(subscribe, readVersion, readVersion);
  return items.filter((i) => !dismissed.has(i.id));
}

/**
 * Booking dock — a slim row attached to the top of the bottom navigation (one white panel, like
 * iOS 26's tab-bar accessory or a live order on a delivery app). Status first ("Arriving in 12 min"), one supporting line, one action. Several
 * items swipe sideways in priority order: live service, payment, rating, upcoming, cart, packs.
 */
export function BookingDock({ items = SAMPLE_DOCK }: { items?: DockItem[] }) {
  const { width } = useWindowDimensions();
  const scrollX = useAnimatedValue(0);
  const enter = useAnimatedValue(0);
  const visible = useVisibleDock(items);
  const many = visible.length > 1;

  useEffect(() => {
    Animated.spring(enter, { toValue: 1, useNativeDriver: true, speed: 14, bounciness: 4, delay: 150 }).start();
  }, [enter]);

  // Nothing to show: give the space back to the screen.
  useEffect(() => {
    if (visible.length === 0) setDockHeight(0);
  }, [visible.length]);
  useEffect(() => () => setDockHeight(0), []);

  if (visible.length === 0) return null;

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
        {visible.map((item, i) => (
          <View key={item.id} style={{ width, paddingHorizontal: SIDE }}>
            <DockCard
              item={item}
              position={many ? `${i + 1} of ${visible.length}` : undefined}
              onDismiss={() => dismiss(item.id)}
            />
          </View>
        ))}
      </Animated.ScrollView>
      {many && <Dots count={visible.length} width={width} scrollX={scrollX} />}
    </Animated.View>
  );
}

function target(item: DockItem) {
  return item.kind === 'cart' || item.kind === 'pack' ? '/wash' : `/booking/${item.id}`;
}

/** One dock card. Exported for the states preview screen. */
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
  const progress = item.kind === 'live' && item.stage !== 'in_progress' ? item.progress : undefined;
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
        onLongPress={__DEV__ ? () => router.push('/dock-states') : undefined}
        accessibilityRole="button"
        accessibilityLabel={label}
        style={({ pressed }) => [
          styles.card,
          copy.tone === 'attention' && styles.cardAttention,
          pressed && styles.cardPressed,
        ]}
      >
        <Lead item={item} tone={copy.tone} />

        <View style={styles.copy}>
          <Text style={styles.title} numberOfLines={1}>
            {copy.title}
          </Text>
          <Detail item={item} text={copy.detail} tone={copy.tone} />
        </View>

        {copy.cta && (
          <PressableScale
            onPress={open}
            accessibilityLabel={copy.cta}
            style={[styles.cta, copy.ctaSoft && styles.ctaSoft]}
          >
            <Text style={[styles.ctaText, copy.ctaSoft && styles.ctaTextSoft]}>{copy.cta}</Text>
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

        {progress !== undefined && <ProgressLine value={progress} />}
      </Pressable>
    </Animated.View>
  );
}

// ——— Leading icon: one glyph per state, colour = urgency ———

const ICON: Record<string, IconName> = {
  assigned: 'person',
  on_the_way: 'navigate',
  arrived: 'location',
  in_progress: 'water',
  payment: 'wallet',
  rate: 'star',
  upcoming: 'calendar-clear',
  cart: 'cart',
  pack: 'ticket',
};

function Lead({ item, tone }: { item: DockItem; tone: DockTone }) {
  const key = item.kind === 'live' ? item.stage : item.kind;
  const { icon: color, bg } = TONE[tone];
  const pulse = item.kind === 'live' && (item.stage === 'on_the_way' || item.stage === 'arrived');

  return (
    <View style={[styles.lead, { backgroundColor: bg }]}>
      {pulse && <Pulse color={color} />}
      {item.kind === 'live' && item.stage === 'in_progress' && <Ring value={item.progress ?? 0} />}
      {key === 'finding' ? (
        <ActivityIndicator size="small" color={GREEN} />
      ) : (
        <Ionicons name={ICON[key]} size={17} color={color} />
      )}
    </View>
  );
}

function Detail({ item, text, tone }: { item: DockItem; text: string; tone: DockTone }) {
  // The start code is the one thing to read out at the door — make it stand out.
  if (item.kind === 'live' && item.stage === 'arrived' && item.otp) {
    return (
      <Text style={styles.detail} numberOfLines={1}>
        Share start code <Text style={styles.code}>{item.otp}</Text>
      </Text>
    );
  }
  const warn = item.kind === 'pack' && tone === 'attention';
  return (
    <Text style={[styles.detail, warn && { color: AMBER }]} numberOfLines={1}>
      {text}
    </Text>
  );
}

// ——— Motion ———

/** Soft ring breathing out of the icon — "happening right now". */
function Pulse({ color }: { color: string }) {
  const t = useAnimatedValue(0);
  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(t, { toValue: 1, duration: 1600, easing: Easing.out(Easing.quad), useNativeDriver: true }),
    );
    loop.start();
    return () => loop.stop();
  }, [t]);
  return (
    <Animated.View
      style={[
        styles.pulse,
        {
          backgroundColor: color,
          opacity: t.interpolate({ inputRange: [0, 1], outputRange: [0.28, 0] }),
          transform: [{ scale: t.interpolate({ inputRange: [0, 1], outputRange: [1, 1.55] }) }],
        },
      ]}
    />
  );
}

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

/** Journey progress along the card's bottom edge; fills in when the card appears. */
function ProgressLine({ value }: { value: number }) {
  const t = useAnimatedValue(0);
  useEffect(() => {
    Animated.timing(t, {
      toValue: value,
      duration: 900,
      delay: 250,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [t, value]);
  return (
    <View style={styles.track} pointerEvents="none">
      <Animated.View
        style={[styles.fill, { width: t.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) }]}
      />
    </View>
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
  cardAttention: {
    backgroundColor: '#FFF8E1',
  },
  cardPressed: {
    opacity: 0.85,
  },
  lead: {
    width: RING,
    height: RING,
    borderRadius: RING / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulse: {
    ...StyleSheet.absoluteFill,
    borderRadius: RING / 2,
  },
  copy: {
    flex: 1,
    minWidth: 0,
    gap: 1,
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
  ctaSoft: {
    paddingHorizontal: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E4E8',
  },
  ctaText: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: '#FFFFFF',
  },
  ctaTextSoft: {
    color: ink.text,
  },
  close: {
    width: 24,
    height: 32,
    marginLeft: -4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  track: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 2,
    backgroundColor: '#E6E8EC',
  },
  fill: {
    height: 2,
    backgroundColor: GREEN,
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
