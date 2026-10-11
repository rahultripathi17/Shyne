import Ionicons from '@expo/vector-icons/Ionicons';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ink } from '../../components/home/homeTheme';
import { FadeIn } from '../../components/home/motion';
import { ActionFooter, PrimaryButton } from '../../components/Buttons';
import { OnboardingHeader } from '../../components/onboarding/OnboardingHeader';
import { OnboardingTitle } from '../../components/onboarding/OnboardingLead';
import { SsoButton } from '../../components/SsoButton';
import { fonts } from '../../components/theme';
import { signInWith, SSO_PROVIDERS, type SsoProvider, ssoErrorMessage } from '../../lib/sso';
import { useAppStore } from '../../store/AppStore';

const LENGTH = 4;
const RESEND_SECONDS = 30;
const WHATSAPP_GREEN = '#25D366';

type Channel = 'sms' | 'whatsapp';

export default function OtpScreen() {
  const insets = useSafeAreaInsets();
  const { phone, activateDemoAccount } = useAppStore();
  const [code, setCode] = useState('');
  const [seconds, setSeconds] = useState(RESEND_SECONDS);
  const [channel, setChannel] = useState<Channel>('sms');
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (seconds <= 0) return;
    const t = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [seconds]);

  const verify = (value: string) => {
    if (value.length !== LENGTH) return;
    // Prototype: no SMS/WhatsApp backend yet, so any 4-digit code is accepted.
    activateDemoAccount();
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.push('/onboarding/location');
  };

  const onChange = (v: string) => {
    const next = v.replace(/\D/g, '').slice(0, LENGTH);
    setCode(next);
    if (next.length === LENGTH) verify(next);
  };

  const [ssoError, setSsoError] = useState('');
  const sso = async (provider: SsoProvider) => {
    setSsoError('');
    const result = await signInWith(provider);
    if (!result.ok) {
      setSsoError(ssoErrorMessage(result.reason));
      return;
    }
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    activateDemoAccount(provider);
    router.push('/onboarding/location');
  };

  const resend = (via: Channel) => {
    void Haptics.selectionAsync();
    setChannel(via);
    setCode('');
    setSeconds(RESEND_SECONDS);
    inputRef.current?.focus();
  };

  const complete = code.length === LENGTH;

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <OnboardingHeader title="OTP Verification" topInset={insets.top} />
      <View style={styles.body}>
        <OnboardingTitle title="Enter verification code" />
        <View style={styles.sentRow}>
          {channel === 'whatsapp' && <Ionicons name="logo-whatsapp" size={16} color={WHATSAPP_GREEN} />}
          <Text style={styles.sent}>
            {channel === 'whatsapp' ? 'We’ve sent a 4-digit code on WhatsApp to ' : 'We’ve sent a 4-digit code to '}
            <Text style={styles.phone}>{phone || 'your number'}</Text>
          </Text>
          <Pressable onPress={() => router.back()} hitSlop={8}>
            <Ionicons name="pencil" size={15} color={ink.text} />
          </Pressable>
        </View>

        <Pressable
          onPress={() => inputRef.current?.focus()}
          style={styles.boxes}
          accessibilityLabel="Verification code"
        >
          {Array.from({ length: LENGTH }, (_, i) => {
            const filled = i < code.length;
            const active = i === code.length;
            return (
              <View key={i} style={[styles.box, filled && styles.boxFilled, active && styles.boxActive]}>
                <Text style={styles.digit}>{code[i] ?? ''}</Text>
              </View>
            );
          })}
        </Pressable>
        <TextInput
          ref={inputRef}
          value={code}
          onChangeText={onChange}
          keyboardType="number-pad"
          textContentType="oneTimeCode"
          autoComplete="sms-otp"
          autoFocus
          maxLength={LENGTH}
          style={styles.hidden}
        />

        {seconds > 0 ? (
          <Text style={styles.timer}>
            Didn’t get it? Resend in <Text style={styles.timerStrong}>0:{String(seconds).padStart(2, '0')}</Text>
          </Text>
        ) : (
          <FadeIn style={styles.options}>
            <Text style={styles.optionsLabel}>Didn’t get the code?</Text>
            <Pressable
              onPress={() => resend('whatsapp')}
              style={({ pressed }) => [styles.whatsapp, pressed && { opacity: 0.85 }]}
              accessibilityRole="button"
            >
              <Ionicons name="logo-whatsapp" size={20} color="#FFFFFF" />
              <Text style={styles.whatsappText}>Get code on WhatsApp</Text>
            </Pressable>
            <Pressable onPress={() => resend('sms')} hitSlop={8} style={styles.smsLink} accessibilityRole="button">
              <Ionicons name="chatbubble-ellipses-outline" size={16} color={ink.text} />
              <Text style={styles.smsText}>Resend by SMS</Text>
            </Pressable>

            {/* Still no code? Skip OTP and sign in with the phone's own account. */}
            <View style={styles.orRow}>
              <View style={styles.orLine} />
              <Text style={styles.orText}>or</Text>
              <View style={styles.orLine} />
            </View>
            {SSO_PROVIDERS.map((provider) => (
              <SsoButton key={provider} provider={provider} onPress={() => void sso(provider)} />
            ))}
            {ssoError ? <Text style={styles.ssoError}>{ssoError}</Text> : null}
          </FadeIn>
        )}
      </View>

      <ActionFooter bottomInset={insets.bottom}>
        <PrimaryButton label="Verify" onPress={() => verify(code)} disabled={!complete} />
      </ActionFooter>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  orRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 6,
    marginBottom: 4,
  },
  orLine: {
    flex: 1,
    height: 1,
    backgroundColor: ink.line,
  },
  orText: {
    fontFamily: fonts.semiBold,
    fontSize: 13,
    color: ink.muted,
  },
  ssoError: {
    textAlign: 'center',
    fontFamily: fonts.semiBold,
    fontSize: 12,
    color: ink.red,
  },
  screen: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  body: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 4,
  },
  sentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 6,
  },
  sent: {
    fontFamily: fonts.medium,
    fontSize: 14,
    color: ink.muted,
  },
  phone: {
    fontFamily: fonts.bold,
    color: ink.text,
  },
  boxes: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 28,
  },
  box: {
    width: 62,
    height: 64,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#DADCE2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxFilled: {
    borderColor: '#B9BBC3',
  },
  boxActive: {
    borderColor: ink.text,
    borderWidth: 2,
  },
  digit: {
    fontFamily: fonts.extraBold,
    fontSize: 26,
    color: ink.text,
  },
  hidden: {
    position: 'absolute',
    opacity: 0,
    width: 1,
    height: 1,
  },
  timer: {
    marginTop: 24,
    fontFamily: fonts.medium,
    fontSize: 14,
    color: ink.muted,
  },
  timerStrong: {
    fontFamily: fonts.bold,
    color: ink.text,
  },
  options: {
    marginTop: 24,
    gap: 12,
  },
  optionsLabel: {
    fontFamily: fonts.semiBold,
    fontSize: 14,
    color: ink.muted,
  },
  whatsapp: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 50,
    borderRadius: 14,
    backgroundColor: WHATSAPP_GREEN,
  },
  whatsappText: {
    fontFamily: fonts.extraBold,
    fontSize: 15,
    color: '#FFFFFF',
  },
  smsLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 40,
  },
  smsText: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: ink.text,
  },
});
