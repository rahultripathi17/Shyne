import LottieView from 'lottie-react-native';
import { useEffect, useState } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { Animated, Easing, StyleSheet, View } from 'react-native';

import { ink } from './home/homeTheme';
import { fonts, useAnimatedValue } from './theme';

const CAR_ANIMATION = require('../../assets/animations/car-loading.json');

// The animation is drawn on a 1920 × 1920 canvas: skyline, car and road sit in the lower middle
// (about x 300–1620, y 400–1580). We crop to that area, and soft white fades on the sides hide
// where the scrolling skyline and road enter and leave.
const CANVAS = 1920;
const FOCUS = { x: 960, y: 990, w: 1320, h: 1180 };
const VIEW_W = 210;
const SCALE = VIEW_W / FOCUS.w;
const VIEW_H = Math.round(FOCUS.h * SCALE);
const LOTTIE = CANVAS * SCALE;

// One short line at a time, changing while the user waits.
const STEPS = ['Refreshing your profile', 'Syncing your vehicles', 'Almost there'];
const STEP_MS = 1000;

/**
 * Long-wait screen for Profile's pull to refresh: the screen turns white and the car animation
 * plays in the middle on a loop, with one short status line that changes and a thin progress
 * line. (Home's quick refresh uses the shimmer skeleton instead.)
 */
export function CarLoader({ visible }: { visible: boolean }) {
  const show = useAnimatedValue(0);
  const line = useAnimatedValue(1);
  const bar = useAnimatedValue(0);
  const [mounted, setMounted] = useState(visible);
  const [step, setStep] = useState(0);
  const [wasVisible, setWasVisible] = useState(visible);
  if (visible !== wasVisible) {
    setWasVisible(visible);
    if (visible) {
      setMounted(true);
      setStep(0);
    }
  }

  // Fade the screen in (with a slight settle) and out.
  useEffect(() => {
    Animated.timing(show, {
      toValue: visible ? 1 : 0,
      duration: visible ? 240 : 320,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished && !visible) setMounted(false);
    });
  }, [visible, show]);

  // Thin progress line sliding under the text.
  useEffect(() => {
    if (!mounted) return;
    const loop = Animated.loop(
      Animated.timing(bar, { toValue: 1, duration: 1200, easing: Easing.inOut(Easing.cubic), useNativeDriver: true }),
    );
    loop.start();
    return () => loop.stop();
  }, [mounted, bar]);

  // Next status line, with a quick fade and lift.
  useEffect(() => {
    if (!visible || step >= STEPS.length - 1) return;
    const t = setTimeout(() => {
      Animated.timing(line, { toValue: 0, duration: 140, useNativeDriver: true }).start(() => {
        setStep((s) => s + 1);
        Animated.timing(line, {
          toValue: 1,
          duration: 220,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }).start();
      });
    }, STEP_MS);
    return () => clearTimeout(t);
  }, [visible, step, line]);

  if (!mounted) return null;

  const offset = { left: -(FOCUS.x - FOCUS.w / 2) * SCALE, top: -(FOCUS.y - FOCUS.h / 2) * SCALE };

  return (
    <Animated.View
      pointerEvents="none"
      accessibilityRole="progressbar"
      accessibilityLabel={STEPS[step]}
      accessibilityLiveRegion="polite"
      style={[styles.screen, { opacity: show }]}
    >
      <Animated.View
        style={{ transform: [{ scale: show.interpolate({ inputRange: [0, 1], outputRange: [0.94, 1] }) }] }}
      >
        <View style={styles.stage}>
          <LottieView
            source={CAR_ANIMATION}
            autoPlay
            loop
            speed={1.1}
            resizeMode="contain"
            style={[styles.lottie, offset]}
            webStyle={{ position: 'absolute', width: LOTTIE, height: LOTTIE, ...offset }}
          />
          <LinearGradient
            colors={['#FFFFFF', 'rgba(255,255,255,0)']}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={[styles.edge, { left: 0 }]}
          />
          <LinearGradient
            colors={['rgba(255,255,255,0)', '#FFFFFF']}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={[styles.edge, { right: 0 }]}
          />
        </View>
      </Animated.View>

      <Animated.Text
        style={[
          styles.status,
          { opacity: line, transform: [{ translateY: line.interpolate({ inputRange: [0, 1], outputRange: [4, 0] }) }] },
        ]}
      >
        {STEPS[step]}
      </Animated.Text>
      <View style={styles.barTrack}>
        <Animated.View
          style={[
            styles.barFill,
            { transform: [{ translateX: bar.interpolate({ inputRange: [0, 1], outputRange: [-36, 96] }) }] },
          ]}
        />
      </View>
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
  stage: {
    width: VIEW_W,
    height: VIEW_H,
    overflow: 'hidden',
  },
  lottie: {
    position: 'absolute',
    width: LOTTIE,
    height: LOTTIE,
  },
  edge: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 34,
  },
  status: {
    marginTop: 14,
    fontFamily: fonts.semiBold,
    fontSize: 13.5,
    letterSpacing: 0.1,
    color: ink.muted,
  },
  barTrack: {
    width: 96,
    height: 2,
    marginTop: 12,
    borderRadius: 1,
    overflow: 'hidden',
    backgroundColor: '#EEEFF2',
  },
  barFill: {
    width: 36,
    height: 2,
    borderRadius: 1,
    backgroundColor: ink.text,
  },
});
