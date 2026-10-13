import Ionicons from '@expo/vector-icons/Ionicons';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { type ComponentProps, useEffect, useSyncExternalStore } from 'react';
import {
  ActivityIndicator,
  Animated,
  Easing,
  Image,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
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
            {item.kind === 'live' && item.stage === 'on_the_way' ? (
              <>
                Arriving in <Text style={styles.eta}>{item.etaMin ?? 0} min</Text>
              </>
            ) : (
              copy.title
            )}
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
  today: 'time',
  cart: 'cart',
};

const STARTER_PACK = require('../../assets/bookings/starter-pack.png');

function Lead({ item, tone }: { item: DockItem; tone: DockTone }) {
  const key = item.kind === 'live' ? item.stage : item.kind === 'upcoming' && item.today ? 'today' : item.kind;
  const { icon: color, bg } = TONE[tone];

  // Packs show the Hoora "Starter Pack" tickets from the design file instead of an icon.
  if (item.kind === 'pack') {
    return <Image source={STARTER_PACK} style={styles.packArt} resizeMode="contain" accessibilityIgnoresInvertColors />;
  }

  // Expert moving or at the door: solid disc glowing out in waves — the "live" moment.
  if (item.kind === 'live' && (item.stage === 'on_the_way' || item.stage === 'arrived')) {
    const arrived = item.stage === 'arrived';
    const glow = arrived ? ink.yellowDeep : GREEN;
    return (
      <View style={styles.lead}>
        <Pulse color={glow} />
        <Pulse color={glow} delay={800} />
        <View style={[styles.disc, { backgroundColor: arrived ? ink.yellow : GREEN }]}>
          {arrived ? <Ionicons name="location" size={17} color={ink.text} /> : <MovingArrow />}
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.lead, { backgroundColor: bg }]}>
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

/** A ring rippling out of the icon — "happening right now". Two, staggered, read as a live signal. */
/** The navigation arrow keeps edging forward (up-right) and settling back, with a soft blink. */
function MovingArrow() {
  const t = useAnimatedValue(0);
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(t, { toValue: 1, duration: 700, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.timing(t, { toValue: 0, duration: 700, easing: Easing.in(Easing.quad), useNativeDriver: true }),
        Animated.delay(200),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [t]);
  const shift = t.interpolate({ inputRange: [0, 1], outputRange: [0, 1.6] });
  return (
    <Animated.View
      style={[
        styles.arrow,
        {
          opacity: t.interpolate({ inputRange: [0, 1], outputRange: [1, 0.72] }),
          transform: [
            { translateX: shift },
            { translateY: Animated.multiply(shift, -1) },
            { scale: t.interpolate({ inputRange: [0, 1], outputRange: [1, 1.06] }) },
          ],
        },
      ]}
    >
      <Ionicons name="navigate" size={17} color="#FFFFFF" />
    </Animated.View>
  );
}

function Pulse({ color, delay = 0 }: { color: string; delay?: number }) {
  const t = useAnimatedValue(0);
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(t, { toValue: 1, duration: 1600, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        Animated.delay(Math.max(0, 800 - delay)),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [t, delay]);
  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.pulse,
        {
          backgroundColor: color,
          opacity: t.interpolate({ inputRange: [0, 0.1, 1], outputRange: [0, 0.45, 0] }),
          transform: [{ scale: t.interpolate({ inputRange: [0, 1], outputRange: [1, 1.6] }) }],
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
      >
        <Sweep />
      </Animated.View>
    </View>
  );
}

/** A soft highlight that keeps running along the progress line — the journey is moving. */
function Sweep() {
  const t = useAnimatedValue(0);
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(t, { toValue: 1, duration: 1400, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.delay(500),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [t]);
  return (
    <Animated.View
      style={[
        styles.sweep,
        { transform: [{ translateX: t.interpolate({ inputRange: [0, 1], outputRange: [-60, 320] }) }] },
      ]}
    >
      <LinearGradient
        colors={['rgba(255,255,255,0)', 'rgba(255,255,255,0.85)', 'rgba(255,255,255,0)']}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={StyleSheet.absoluteFill}
      />
    </Animated.View>
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
  // 240 × 163 artwork (stacked tickets), a little wider than the icon circles.
  packArt: {
    width: 50,
    height: 34,
    marginLeft: -2,
    marginRight: -3,
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
  // The arrow's weight sits ~1pt up-right of its box; nudge it back so it looks centred in the disc.
  arrow: {
    marginLeft: -1,
    marginTop: 1,
  },
  copy: {
    flex: 1,
    minWidth: 0,
    gap: 1,
  },
  disc: {
    width: RING,
    height: RING,
    borderRadius: RING / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eta: {
    color: GREEN,
  },
  sweep: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 60,
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
    height: 3,
    backgroundColor: '#E3E6EA',
  },
  fill: {
    height: 3,
    borderTopRightRadius: 2,
    borderBottomRightRadius: 2,
    backgroundColor: GREEN,
    overflow: 'hidden',
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
