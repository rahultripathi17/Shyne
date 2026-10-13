import Ionicons from '@expo/vector-icons/Ionicons';
import { type ComponentProps, useEffect, useState } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';

import { ink } from './home/homeTheme';
import { fonts, useAnimatedValue } from './theme';

type IconName = ComponentProps<typeof Ionicons>['name'];

const WORD = 'Vehicle 360';
const CHARS = [...WORD];
// Where each letter sits along the sweep (0 → 1), so the light passes through them in order.
const AT = CHARS.map((_, i) => 0.12 + (0.76 * i) / (CHARS.length - 1));
const SWEEP_MS = 1500;
const TRACK_W = 44;

// One line per Hoora vertical, said the Gen Z way. Not tied to any screen, so they read right
// on any delay, and they loop for as long as the wait lasts.
const LINES: { text: string; icon: IconName }[] = [
  { text: 'Foam on, dirt gone', icon: 'water-outline' }, // car wash
  { text: 'Your bike’s glow-up is loading', icon: 'bicycle-outline' }, // bike wash
  { text: 'Polishing till it’s main-character shiny', icon: 'sparkles-outline' }, // detailing
  { text: 'Booking your society’s wash day', icon: 'business-outline' }, // society wash
  { text: 'Spanners out, mechanics locked in', icon: 'construct-outline' }, // garage service
  { text: 'Erasing dents like they never happened', icon: 'color-palette-outline' }, // denting & painting
  { text: 'Chilling the AC. Literally.', icon: 'snow-outline' }, // AC service
  { text: 'No flat era. Checking your tyres', icon: 'disc-outline' }, // tyres & wheels
  { text: 'Zero dead-battery drama', icon: 'battery-charging-outline' }, // batteries
  { text: 'Hunting down pending challans', icon: 'receipt-outline' }, // challan
  { text: 'Making sure your ride’s covered', icon: 'shield-checkmark-outline' }, // insurance
  { text: 'Keeping your PUC green, no cap', icon: 'leaf-outline' }, // pollution
  { text: 'FASTag topped up, tolls on easy mode', icon: 'pricetag-outline' }, // FASTag
  { text: 'Restocking the drip for your car', icon: 'bag-handle-outline' }, // products & accessories
  { text: 'Roadside help, on speed dial', icon: 'navigate-outline' }, // roadside assistance
  { text: 'Finding chargers near you', icon: 'flash-outline' }, // EV charging
  { text: 'Scouting cars worth the hype', icon: 'car-sport-outline' }, // used cars & dealers
  { text: 'Stacking your Hoora Points', icon: 'gift-outline' }, // rewards
];
const LINE_MS = 1800;

/** The lines in a fresh random order, so each wait starts somewhere new. */
const shuffled = () => {
  const order = LINES.map((_, i) => i);
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  return order;
};

/**
 * Loading state: just the words "Vehicle 360", with a soft light passing through the letters on
 * a loop, and a quiet line about one of Hoora's services under it, changing every couple of
 * seconds. No spinner.
 */
export function Vehicle360Loader({ visible }: { visible: boolean; duration?: number }) {
  const show = useAnimatedValue(0);
  const sweep = useAnimatedValue(0);
  const line = useAnimatedValue(1);
  const [mounted, setMounted] = useState(visible);
  const [step, setStep] = useState(0);
  const [order, setOrder] = useState(shuffled);
  const [wasVisible, setWasVisible] = useState(visible);
  if (visible !== wasVisible) {
    setWasVisible(visible);
    if (visible) {
      setMounted(true);
      setStep(0);
      setOrder(shuffled());
    }
  }

  useEffect(() => {
    Animated.timing(show, {
      toValue: visible ? 1 : 0,
      duration: visible ? 200 : 260,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished && !visible) setMounted(false);
    });
  }, [visible, show]);

  useEffect(() => {
    if (!mounted) return;
    sweep.setValue(0);
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(sweep, {
          toValue: 1,
          duration: SWEEP_MS,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.delay(250),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [mounted, sweep]);

  // Status line cycles (and wraps round) with a quick fade.
  useEffect(() => {
    if (!visible) return;
    const t = setTimeout(() => {
      Animated.timing(line, { toValue: 0, duration: 160, useNativeDriver: true }).start(() => {
        setStep((s) => (s + 1) % LINES.length);
        Animated.timing(line, {
          toValue: 1,
          duration: 220,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }).start();
      });
    }, LINE_MS);
    return () => clearTimeout(t);
  }, [visible, step, line]);

  if (!mounted) return null;

  return (
    <Animated.View
      pointerEvents="none"
      accessibilityRole="progressbar"
      accessibilityLabel={`Vehicle 360. ${LINES[order[step]].text}`}
      accessibilityLiveRegion="polite"
      style={[styles.screen, { opacity: show }]}
    >
      <View style={styles.word} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        {CHARS.map((ch, i) => {
          const at = AT[i];
          const glow = sweep.interpolate({
            inputRange: [at - 0.16, at, at + 0.16],
            outputRange: [0, 1, 0],
            extrapolate: 'clamp',
          });
          return ch === ' ' ? (
            <View key={i} style={styles.space} />
          ) : (
            <Animated.Text
              key={i}
              style={[
                styles.char,
                i > 7 && styles.num,
                {
                  opacity: glow.interpolate({ inputRange: [0, 1], outputRange: [0.32, 1] }),
                  transform: [{ translateY: glow.interpolate({ inputRange: [0, 1], outputRange: [0, -1.5] }) }],
                },
              ]}
            >
              {ch}
            </Animated.Text>
          );
        })}
      </View>
      {/* A short track with the same light running through it, in Hoora yellow */}
      <View style={styles.track}>
        <Animated.View
          style={[
            styles.trackLight,
            { transform: [{ translateX: sweep.interpolate({ inputRange: [0, 1], outputRange: [-16, TRACK_W] }) }] },
          ]}
        />
      </View>
      <Animated.View
        style={[
          styles.statusRow,
          { opacity: line, transform: [{ translateY: line.interpolate({ inputRange: [0, 1], outputRange: [3, 0] }) }] },
        ]}
      >
        <View style={styles.statusIcon}>
          <Ionicons name={LINES[order[step]].icon} size={13} color={ink.text} />
        </View>
        <Text numberOfLines={1} style={styles.status}>
          {LINES[order[step]].text}
        </Text>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  screen: {
    ...StyleSheet.absoluteFill,
    zIndex: 50,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 40,
  },
  word: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  char: {
    fontFamily: fonts.bold,
    fontSize: 24,
    lineHeight: 30,
    letterSpacing: -0.4,
    color: ink.text,
  },
  num: {
    fontFamily: fonts.extraBold,
  },
  space: {
    width: 7,
  },
  track: {
    width: TRACK_W,
    height: 2,
    marginTop: 18,
    borderRadius: 1,
    overflow: 'hidden',
    backgroundColor: '#EEEFF2',
  },
  trackLight: {
    width: 16,
    height: 2,
    borderRadius: 1,
    backgroundColor: ink.yellowDeep,
  },
  statusRow: {
    marginTop: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    maxWidth: 320,
  },
  statusIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F4F5F7',
  },
  status: {
    flexShrink: 1,
    fontFamily: fonts.medium,
    fontSize: 13.5,
    color: ink.muted,
  },
});
