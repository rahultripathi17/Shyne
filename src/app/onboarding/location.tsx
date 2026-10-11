import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ink } from '../../components/home/homeTheme';
import { FadeIn } from '../../components/home/motion';
import { ActionFooter, PrimaryButton, TextButton } from '../../components/Buttons';
import { OnboardingHeader } from '../../components/onboarding/OnboardingHeader';
import { OnboardingTitle } from '../../components/onboarding/OnboardingLead';
import { fonts, useAnimatedValue } from '../../components/theme';
import { detectAddress } from '../../lib/location';
import { useAppStore } from '../../store/AppStore';

const REASONS = [
  { icon: 'home-outline' as const, text: 'Fills in your address automatically' },
  { icon: 'car-outline' as const, text: 'Our expert comes to your doorstep' },
  { icon: 'pricetag-outline' as const, text: 'Shows services and offers near you' },
];

/** Simple street-map illustration with a pulsing pin. */
function MapArt() {
  const pulse = useAnimatedValue(0);

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(pulse, { toValue: 1, duration: 1800, easing: Easing.out(Easing.quad), useNativeDriver: true }),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  return (
    <View style={styles.map}>
      <View style={[styles.road, { top: 46, left: -20, right: -20, height: 14 }]} />
      <View style={[styles.road, { top: 128, left: -20, right: -20, height: 10 }]} />
      <View style={[styles.road, { left: 70, top: -20, bottom: -20, width: 12 }]} />
      <View style={[styles.road, { right: 64, top: -20, bottom: -20, width: 16 }]} />
      <View style={[styles.block, { top: 72, left: 96, width: 70, height: 42 }]} />
      <View style={[styles.block, { top: 8, left: 96, width: 52, height: 26 }]} />
      <View style={[styles.block, { top: 150, right: 96, width: 60, height: 30 }]} />

      <Animated.View
        style={[
          styles.ring,
          {
            opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.35, 0] }),
            transform: [{ scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1.6] }) }],
          },
        ]}
      />
      <View style={styles.pin}>
        <Ionicons name="location-sharp" size={28} color={ink.text} />
      </View>
    </View>
  );
}

export default function LocationScreen() {
  const insets = useSafeAreaInsets();
  const { setLocation } = useAppStore();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const detect = async () => {
    setBusy(true);
    setError('');
    const result = await detectAddress();
    setBusy(false);
    if (result.ok) {
      setLocation(result.location);
      router.push('/onboarding/vehicle');
    } else {
      setError(
        result.reason === 'denied'
          ? 'Location is turned off for Hoora. You can allow it in Settings, or add your address later.'
          : 'We couldn’t find your address. Please try again, or add it later.',
      );
    }
  };

  return (
    <View style={styles.screen}>
      <OnboardingHeader title="Location permission" topInset={insets.top} />
      <View style={styles.body}>
        <OnboardingTitle title="Share your location">We use it only while you’re using the app.</OnboardingTitle>

        <FadeIn delay={80} style={{ marginTop: 20 }}>
          <MapArt />
        </FadeIn>

        <FadeIn delay={160} style={styles.reasons}>
          {REASONS.map((r) => (
            <View key={r.text} style={styles.reason}>
              <View style={styles.reasonIcon}>
                <Ionicons name={r.icon} size={18} color={ink.text} />
              </View>
              <Text style={styles.reasonText}>{r.text}</Text>
            </View>
          ))}
        </FadeIn>

        {error ? <Text style={styles.error}>{error}</Text> : null}
      </View>

      <ActionFooter bottomInset={insets.bottom}>
        <PrimaryButton
          label="Allow location access"
          onPress={detect}
          loading={busy}
          icon={<Ionicons name="navigate" size={18} color="#FFFFFF" />}
        />
        <TextButton label="Enter address manually" onPress={() => router.push('/onboarding/vehicle')} />
      </ActionFooter>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  body: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 4,
  },
  map: {
    height: 190,
    borderRadius: 22,
    backgroundColor: '#F1F2F5',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  road: {
    position: 'absolute',
    backgroundColor: '#FFFFFF',
    borderRadius: 4,
  },
  block: {
    position: 'absolute',
    backgroundColor: '#E4E6EB',
    borderRadius: 8,
  },
  ring: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: ink.yellow,
  },
  pin: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 3,
    borderColor: '#FFFFFF',
    backgroundColor: ink.yellow,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  reasons: {
    marginTop: 22,
    gap: 14,
  },
  reason: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  reasonIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#F1F2F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  reasonText: {
    flex: 1,
    fontFamily: fonts.semiBold,
    fontSize: 14,
    color: ink.label,
  },
  error: {
    marginTop: 18,
    fontFamily: fonts.semiBold,
    fontSize: 13,
    lineHeight: 18,
    color: '#B42318',
  },
});
