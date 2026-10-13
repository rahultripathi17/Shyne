import { useEffect, useState } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';

import { ink } from './home/homeTheme';
import { fonts, useAnimatedValue } from './theme';

const WORD = 'Vehicle 360';
const CHARS = [...WORD];
// Where each letter sits along the sweep (0 → 1), so the light passes through them in order.
const AT = CHARS.map((_, i) => 0.12 + (0.76 * i) / (CHARS.length - 1));
const SWEEP_MS = 1500;

// One line per Hoora vertical, said the Gen Z way. Not tied to any screen, so they read right
// on any delay, and they loop for as long as the wait lasts.
const LINES = [
  'Foam on, dirt gone', // car wash
  'Your bike’s glow-up is loading', // bike wash
  'Polishing till it’s main-character shiny', // detailing
  'Booking your society’s wash day', // society wash
  'Spanners out, mechanics locked in', // garage service
  'Erasing dents like they never happened', // denting & painting
  'Chilling the AC. Literally.', // AC service
  'No flat era. Checking your tyres', // tyres & wheels
  'Zero dead-battery drama', // batteries
  'Hunting down pending challans', // challan
  'Making sure your ride’s covered', // insurance
  'Keeping your PUC green, no cap', // pollution
  'FASTag topped up, tolls on easy mode', // FASTag
  'Restocking the drip for your car', // products & accessories
  'Roadside help, on speed dial', // roadside assistance
  'Finding chargers near you', // EV charging
  'Scouting cars worth the hype', // used cars & dealers
  'Stacking your Hoora Points', // rewards
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
      accessibilityLabel={`Vehicle 360. ${LINES[order[step]]}`}
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
      <Animated.Text
        numberOfLines={1}
        style={[
          styles.status,
          { opacity: line, transform: [{ translateY: line.interpolate({ inputRange: [0, 1], outputRange: [3, 0] }) }] },
        ]}
      >
        {LINES[order[step]]}
      </Animated.Text>
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
  status: {
    marginTop: 8,
    fontFamily: fonts.medium,
    fontSize: 13,
    color: ink.muted,
  },
});
