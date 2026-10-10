import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect } from 'react';
import { Animated, StyleSheet } from 'react-native';

import { ink } from './home/homeTheme';
import { useAnimatedValue } from './theme';

const SHOW_MS = 2200;
const FADE_OUT_MS = 400;

export function SplashOverlay({ onDone }: { onDone: () => void }) {
  const scale = useAnimatedValue(0.6);
  const contentOpacity = useAnimatedValue(0);
  const overlayOpacity = useAnimatedValue(1);

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale, { toValue: 1, friction: 5, useNativeDriver: true }),
      Animated.timing(contentOpacity, { toValue: 1, duration: 600, useNativeDriver: true }),
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
      <Animated.View style={[styles.logo, { opacity: contentOpacity, transform: [{ scale }] }]}>
        <Ionicons name="car-sport" size={60} color={ink.bg} />
      </Animated.View>
      <Animated.Text style={[styles.title, { opacity: contentOpacity }]}>Hoora</Animated.Text>
      <Animated.Text style={[styles.subtitle, { opacity: contentOpacity }]}>
        India’s #1 Car & Bike Care App
      </Animated.Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: ink.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 112,
    height: 112,
    borderRadius: 30,
    backgroundColor: ink.yellow,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 22,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 40,
    fontWeight: '800',
    letterSpacing: -1,
  },
  subtitle: {
    color: ink.onDarkMuted,
    fontSize: 14,
    marginTop: 6,
  },
});
