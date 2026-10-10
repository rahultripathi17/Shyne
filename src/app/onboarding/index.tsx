import { router, useFocusEffect } from 'expo-router';
import { setStatusBarStyle } from 'expo-status-bar';
import { useCallback, useRef, useState } from 'react';
import {
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
import { HooraMark } from '../../components/HooraLogo';
import { ink } from '../../components/home/homeTheme';
import { FadeIn } from '../../components/home/motion';
import { BrandPattern } from '../../components/onboarding/BrandPattern';
import { fonts } from '../../components/theme';
import { useAppStore } from '../../store/AppStore';

// Login, in the style of Blinkit / Zomato: a lively brand collage on top that melts into a calm,
// centred form. The form is anchored to the bottom, so when the keyboard opens the collage shrinks
// and the number field sits right above the keyboard.
export default function WelcomeScreen() {
  const insets = useSafeAreaInsets();
  const { setPhone } = useAppStore();
  const [digits, setDigits] = useState('');
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<TextInput>(null);

  useFocusEffect(
    useCallback(() => {
      setStatusBarStyle('dark');
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
      <View style={styles.hero}>
        <BrandPattern />
      </View>

      <View style={[styles.form, { paddingBottom: Math.max(insets.bottom, 14) }]}>
        <FadeIn>
          <View style={styles.badge}>
            <HooraMark size={38} />
          </View>
          <Text style={styles.heading}>India’s #1 Car & Bike Care App</Text>
          <Text style={styles.subheading}>Log in to continue</Text>

          <Pressable onPress={() => inputRef.current?.focus()} style={[styles.phone, (focused || digits.length > 0) && styles.phoneActive]}>
            <Text style={styles.cc}>+91</Text>
            <View style={styles.ccRule} />
            <TextInput
              ref={inputRef}
              value={digits}
              onChangeText={onDigits}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              placeholder="Enter mobile number"
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
        </FadeIn>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  hero: {
    flex: 1,
    overflow: 'hidden',
  },
  form: {
    paddingHorizontal: 22,
    backgroundColor: '#FFFFFF',
  },
  badge: {
    alignSelf: 'center',
    width: 64,
    height: 64,
    marginTop: -40,
    borderRadius: 20,
    backgroundColor: ink.text,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  heading: {
    marginTop: 16,
    textAlign: 'center',
    fontFamily: fonts.extraBold,
    fontSize: 23,
    lineHeight: 30,
    letterSpacing: -0.5,
    color: ink.text,
  },
  subheading: {
    marginTop: 4,
    textAlign: 'center',
    fontFamily: fonts.semiBold,
    fontSize: 15,
    color: ink.muted,
  },
  phone: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 56,
    marginTop: 22,
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
