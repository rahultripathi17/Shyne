import { LinearGradient } from 'expo-linear-gradient';
import { router, useFocusEffect } from 'expo-router';
import { setStatusBarStyle } from 'expo-status-bar';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PrimaryButton } from '../../components/Buttons';
import { BANNERS } from '../../components/home/HeroBanner';
import { HooraLogo } from '../../components/HooraLogo';
import { ink } from '../../components/home/homeTheme';
import { fonts, useAnimatedValue } from '../../components/theme';
import { useAppStore } from '../../store/AppStore';

// The same banners as Home, cross-fading on their own.
const SLIDES = BANNERS;
/** All banners are 1290 × 1188. */
const BANNER_ASPECT = 1290 / 1188;
const SLIDE_MS = 4500;

function LoginBanners() {
  const [box, setBox] = useState({ w: 0, h: 0 });
  const [index, setIndex] = useState(0);
  const fade = useAnimatedValue(1);
  const progress = useAnimatedValue(0);

  // Same rhythm as Home: the active dot fills like a progress line, then the next banner fades in.
  useEffect(() => {
    progress.setValue(0);
    const timer = Animated.timing(progress, {
      toValue: 1,
      duration: SLIDE_MS,
      easing: Easing.linear,
      useNativeDriver: true,
    });
    timer.start(({ finished }) => {
      if (!finished) return;
      fade.setValue(0);
      setIndex((i) => (i + 1) % SLIDES.length);
      Animated.timing(fade, {
        toValue: 1,
        duration: 600,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }).start();
    });
    return () => timer.stop();
  }, [index, fade, progress]);

  const prev = (index + SLIDES.length - 1) % SLIDES.length;
  // Fill the area's height (or width, if it's ever wider) and slide sideways to the focus point.
  const place = (x: number) => {
    const height = Math.max(box.h, box.w / BANNER_ASPECT);
    const width = height * BANNER_ASPECT;
    return { position: 'absolute' as const, top: (box.h - height) / 2, left: -(width - box.w) * x, width, height };
  };
  return (
    <View
      style={StyleSheet.absoluteFill}
      onLayout={(e) => setBox({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}
    >
      {/* Full-bleed: each banner fills the whole top area, shifted so its subject stays in view. */}
      <Image source={SLIDES[prev].source} style={place(SLIDES[prev].loginX)} />
      <Animated.Image source={SLIDES[index].source} style={[place(SLIDES[index].loginX), { opacity: fade }]} />
      <LinearGradient colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.45)']} style={styles.bottomShade} />
      <View style={styles.dots}>
        {SLIDES.map((_, i) =>
          i === index ? (
            <View key={i} style={styles.track}>
              <Animated.View style={[styles.fill, { transform: [{ scaleX: progress }] }]} />
            </View>
          ) : (
            <View key={i} style={styles.dot} />
          ),
        )}
      </View>
    </View>
  );
}

// Login: clean photo banners that change on their own, and a white sheet below with just the
// number field. The sheet is anchored to the bottom, so when the
// keyboard opens the photo shrinks and the field sits right above the keyboard.
export default function WelcomeScreen() {
  const insets = useSafeAreaInsets();
  const { setPhone } = useAppStore();
  const [digits, setDigits] = useState('');
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<TextInput>(null);

  // The photo runs under the status bar, so its icons go white here.
  useFocusEffect(
    useCallback(() => {
      setStatusBarStyle('light');
      return () => setStatusBarStyle('dark');
    }, []),
  );

  const valid = digits.length === 10;

  // A full 10-digit number needs nothing more from the keyboard, so put it away.
  const onDigits = (v: string) => {
    const d = v.replace(/\D/g, '').slice(0, 10);
    setDigits(d);
    if (d.length === 10) Keyboard.dismiss();
  };

  const next = () => {
    if (!valid) return;
    Keyboard.dismiss();
    setPhone(`+91 ${digits.slice(0, 5)} ${digits.slice(5)}`);
    router.push('/onboarding/otp');
  };

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <Pressable style={styles.hero} onPress={Keyboard.dismiss} accessible={false}>
        <LoginBanners />
        <LinearGradient
          pointerEvents="none"
          colors={['rgba(0,0,0,0.55)', 'rgba(0,0,0,0)']}
          style={[styles.statusShade, { height: insets.top + 60 }]}
        />
      </Pressable>

      <Pressable
        style={[styles.form, { paddingBottom: Math.max(insets.bottom, 14) }]}
        onPress={Keyboard.dismiss}
        accessible={false}
      >
        <View style={styles.brand}>
          <HooraLogo width={104} />
        </View>
        <Text style={styles.heading}>Log in</Text>
        <Text style={styles.subheading}>Enter your mobile number to continue</Text>

        <Pressable
          onPress={() => inputRef.current?.focus()}
          style={[styles.phone, (focused || digits.length > 0) && styles.phoneActive]}
        >
          <Text style={styles.cc}>+91</Text>
          <View style={styles.ccRule} />
          <TextInput
            ref={inputRef}
            value={digits}
            onChangeText={onDigits}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder="Mobile number"
            placeholderTextColor={ink.faint}
            keyboardType="number-pad"
            textContentType="telephoneNumber"
            autoComplete="tel"
            style={styles.phoneInput}
            accessibilityLabel="Mobile number"
          />
        </Pressable>

        <PrimaryButton label="Continue" onPress={next} disabled={!valid} style={styles.cta} />

        <Text style={styles.terms}>
          By continuing, you agree to our <Text style={styles.link}>Terms of Service</Text> &{' '}
          <Text style={styles.link}>Privacy Policy</Text>
        </Text>
      </Pressable>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    // White under the keyboard while it slides in.
    backgroundColor: '#FFFFFF',
  },
  hero: {
    flex: 1,
    overflow: 'hidden',
    backgroundColor: '#000000',
  },
  bottomShade: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 140,
  },
  statusShade: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
  },
  dots: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 40,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  track: {
    width: 28,
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.35)',
  },
  fill: {
    ...StyleSheet.absoluteFill,
    borderRadius: 3,
    backgroundColor: '#FFFFFF',
    transformOrigin: 'left',
  },
  // White sheet that overlaps the photo with rounded top corners.
  form: {
    marginTop: -26,
    paddingTop: 26,
    paddingHorizontal: 22,
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    backgroundColor: '#FFFFFF',
  },
  brand: {
    marginBottom: 14,
  },
  heading: {
    fontFamily: fonts.extraBold,
    fontSize: 24,
    lineHeight: 30,
    letterSpacing: -0.5,
    color: ink.text,
  },
  subheading: {
    marginTop: 4,
    fontFamily: fonts.medium,
    fontSize: 14,
    color: ink.muted,
  },
  phone: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 56,
    marginTop: 20,
    paddingLeft: 16,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#DADCE2',
  },
  phoneActive: {
    borderColor: ink.text,
  },
  cc: {
    fontFamily: fonts.bold,
    fontSize: 16,
    color: ink.text,
  },
  ccRule: {
    width: 1,
    height: 24,
    marginLeft: 12,
    backgroundColor: ink.line,
  },
  phoneInput: {
    flex: 1,
    height: '100%',
    paddingHorizontal: 12,
    fontFamily: fonts.semiBold,
    fontSize: 17,
    letterSpacing: 0.5,
    color: ink.text,
  },
  cta: {
    marginTop: 12,
  },
  terms: {
    marginTop: 16,
    textAlign: 'center',
    fontFamily: fonts.medium,
    fontSize: 11,
    lineHeight: 17,
    color: ink.faint,
  },
  link: {
    fontFamily: fonts.semiBold,
    color: ink.muted,
    textDecorationLine: 'underline',
  },
});
