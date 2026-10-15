import { useEffect } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HooraLogo } from './HooraLogo';
import { fonts, useAnimatedValue } from './theme';

// Splash, as designed (Dev File, "Spalsh Screen" 6194:1152): the official Hoora logo on cream,
// "Vehicle 360", and "Born and Engineered in Nagpur, India" at the bottom.
//
// Hand-off from the native splash (app.json → expo-splash-screen) must not jump: that one draws
// assets/splash-icon.png (the logo, cropped tight) 240 wide in the exact centre of the screen, so
// this overlay draws the same logo at the same size in the same place from its first frame. Only
// the tagline and footer animate in, once the app font has loaded.

const SHOW_MS = 2200;
const FADE_OUT_MS = 380;
export const SPLASH_BG = '#FEFCE8';
const LOGO_W = 240;
const LOGO_H = LOGO_W * (40.9373 / 135.571);
const INK = '#15161A';

export function SplashOverlay({ onDone, fontsReady }: { onDone: () => void; fontsReady: boolean }) {
  const insets = useSafeAreaInsets();
  const textIn = useAnimatedValue(0);
  const out = useAnimatedValue(0);

  // Tagline and footer rise in once the font is ready (so they never flash in the system font).
  useEffect(() => {
    if (!fontsReady) return;
    Animated.timing(textIn, {
      toValue: 1,
      duration: 450,
      delay: 120,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [fontsReady, textIn]);

  useEffect(() => {
    const timer = setTimeout(() => {
      Animated.timing(out, {
        toValue: 1,
        duration: FADE_OUT_MS,
        easing: Easing.in(Easing.quad),
        useNativeDriver: true,
      }).start(() => onDone());
    }, SHOW_MS);
    return () => clearTimeout(timer);
  }, [out, onDone]);

  const rise = { transform: [{ translateY: textIn.interpolate({ inputRange: [0, 1], outputRange: [6, 0] }) }] };
  const font = (family: string) => (fontsReady ? { fontFamily: family } : null);

  return (
    <Animated.View style={[styles.overlay, { opacity: out.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }) }]}>
      {/* Logo: dead centre, same size as the native splash */}
      <Animated.View
        style={[
          styles.logo,
          { transform: [{ scale: out.interpolate({ inputRange: [0, 1], outputRange: [1, 1.04] }) }] },
        ]}
      >
        <HooraLogo width={LOGO_W} />
      </Animated.View>

      <Animated.View style={[styles.tagline, { opacity: textIn }, rise]}>
        <Text style={[styles.tag, font(fonts.semiBold)]}>Vehicle 360</Text>
        <Text style={styles.spark}>✦</Text>
      </Animated.View>

      <Animated.View style={[styles.footer, { bottom: insets.bottom + 28, opacity: textIn }, rise]}>
        <View style={styles.bornRow}>
          <Text style={[styles.born, font(fonts.bold)]}>Born and Engineered in Nagpur, India</Text>
          <IndiaFlag />
        </View>
        <Text style={[styles.claim, font(fonts.regular)]}>India’s #1 Car & Bike Care App</Text>
      </Animated.View>
    </Animated.View>
  );
}

/** The tricolour, drawn — the flag emoji shows as "IN" on some phones. */
function IndiaFlag() {
  return (
    <View style={styles.flag} accessibilityLabel="India">
      <View style={[styles.stripe, { backgroundColor: '#FF9933' }]} />
      <View style={[styles.stripe, styles.white]}>
        <View style={styles.chakra} />
      </View>
      <View style={[styles.stripe, { backgroundColor: '#138808' }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: SPLASH_BG,
  },
  logo: {
    position: 'absolute',
    left: '50%',
    top: '50%',
    marginLeft: -LOGO_W / 2,
    marginTop: -LOGO_H / 2,
  },
  tagline: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: '50%',
    marginTop: LOGO_H / 2 + 14,
    flexDirection: 'row',
    justifyContent: 'center',
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
  bornRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
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
  flag: {
    width: 18,
    height: 12,
    borderRadius: 2,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#D9D9D9',
  },
  stripe: {
    flex: 1,
  },
  white: {
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chakra: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#000080',
  },
});
