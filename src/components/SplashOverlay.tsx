import { useEffect } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HooraLogo } from './HooraLogo';
import { useAnimatedValue } from './theme';

// Splash, as designed (Dev File, "Spalsh Screen" 6194:1152): the official Hoora logo on cream,
// "Vehicle 360", and "Born and Engineered in Nagpur, India" at the bottom. The native splash
// (app.json → expo-splash-screen) shows the same logo on the same cream, so the hand-off is seamless.

const SHOW_MS = 2200;
const FADE_OUT_MS = 400;
export const SPLASH_BG = '#FEFCE8';
const INK = '#15161A';

export function SplashOverlay({ onDone }: { onDone: () => void }) {
  const insets = useSafeAreaInsets();
  const scale = useAnimatedValue(0.92);
  const contentOpacity = useAnimatedValue(0);
  const overlayOpacity = useAnimatedValue(1);

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale, { toValue: 1, friction: 6, useNativeDriver: true }),
      Animated.timing(contentOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
    ]).start();

    const timer = setTimeout(() => {
      Animated.timing(overlayOpacity, {
        toValue: 0,
        duration: FADE_OUT_MS,
        useNativeDriver: true,
      }).start(() => onDone());
    }, SHOW_MS);
    return () => clearTimeout(timer);
  }, [scale, contentOpacity, overlayOpacity, onDone]);

  // System font on purpose: the splash can show before Plus Jakarta Sans has loaded.
  return (
    <Animated.View style={[styles.overlay, { opacity: overlayOpacity }]}>
      <Animated.View style={[styles.center, { opacity: contentOpacity, transform: [{ scale }] }]}>
        <HooraLogo width={232} />
        <View style={styles.tagline}>
          <Text style={styles.tag}>Vehicle 360</Text>
          <Text style={styles.spark}>✦</Text>
        </View>
      </Animated.View>

      <Animated.View style={[styles.footer, { bottom: insets.bottom + 28, opacity: contentOpacity }]}>
        <Text style={styles.born}>Born and Engineered in Nagpur, India 🇮🇳</Text>
        <Text style={styles.claim}>India’s #1 Car & Bike Care App</Text>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: SPLASH_BG,
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: {
    alignItems: 'center',
    marginTop: -60,
  },
  tagline: {
    marginTop: 18,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  tag: {
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: -0.2,
    color: INK,
  },
  spark: {
    marginLeft: 1,
    marginTop: -7,
    fontSize: 12,
    color: '#F5C400',
  },
  footer: {
    position: 'absolute',
    left: 20,
    right: 20,
    alignItems: 'center',
    gap: 6,
  },
  born: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.2,
    color: INK,
    textAlign: 'center',
  },
  claim: {
    fontSize: 12,
    color: '#3D3F45',
    textAlign: 'center',
  },
});
