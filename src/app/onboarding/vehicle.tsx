import Ionicons from '@expo/vector-icons/Ionicons';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ink } from '../../components/home/homeTheme';
import { FadeIn, PressableScale } from '../../components/home/motion';
import { ActionFooter, PrimaryButton } from '../../components/Buttons';
import { OnboardingHeader } from '../../components/onboarding/OnboardingHeader';
import { OnboardingTitle } from '../../components/onboarding/OnboardingLead';
import { fonts } from '../../components/theme';
import type { VehicleType } from '../../store/AppStore';

const OPTIONS: { type: VehicleType; title: string; image: number; w: number; h: number }[] = [
  { type: 'car', title: '4 Wheeler', image: require('../../../assets/onboarding/car.webp'), w: 176, h: 68 },
  { type: 'bike', title: '2 Wheeler', image: require('../../../assets/onboarding/bike.webp'), w: 134, h: 94 },
];

export default function VehicleTypeScreen() {
  const insets = useSafeAreaInsets();
  const [choice, setChoice] = useState<VehicleType>();

  const next = () => {
    if (!choice) return;
    router.push(choice === 'bike' ? '/onboarding/bike' : '/onboarding/car');
  };

  return (
    <View style={styles.screen}>
      <OnboardingHeader title="Choose your vehicle" topInset={insets.top} />
      <View style={styles.body}>
        <OnboardingTitle title="What do you drive?">
          Pick one to start. You can add more vehicles later.
        </OnboardingTitle>

        <View style={styles.cards}>
          {OPTIONS.map((o, i) => {
            const on = choice === o.type;
            return (
              <FadeIn key={o.type} delay={80 * (i + 1)}>
                <PressableScale
                  onPress={() => {
                    void Haptics.selectionAsync();
                    setChoice(o.type);
                  }}
                  scaleTo={0.98}
                  style={[styles.card, on && styles.cardOn]}
                  accessibilityLabel={o.title}
                >
                  <View style={[styles.radio, on && styles.radioOn]}>
                    {on && <Ionicons name="checkmark" size={14} color={ink.text} />}
                  </View>
                  <Text style={styles.cardTitle}>{o.title}</Text>
                  <Image source={o.image} resizeMode="contain" style={{ width: o.w, height: o.h }} />
                </PressableScale>
              </FadeIn>
            );
          })}
        </View>
      </View>

      <ActionFooter bottomInset={insets.bottom}>
        <PrimaryButton label="Next" onPress={next} disabled={!choice} />
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
  cards: {
    gap: 14,
    marginTop: 24,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    height: 112,
    paddingLeft: 16,
    paddingRight: 8,
    borderRadius: 20,
    backgroundColor: '#F6F7F9',
    borderWidth: 2,
    borderColor: '#ECEDF1',
    overflow: 'hidden',
  },
  // Light selected state keeps the black car / bike photos clearly visible.
  cardOn: {
    backgroundColor: '#FFFBE6',
    borderColor: ink.yellowDeep,
  },
  radio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#C9CBD2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOn: {
    backgroundColor: ink.yellowDeep,
    borderColor: ink.yellowDeep,
  },
  cardTitle: {
    flex: 1,
    fontFamily: fonts.extraBold,
    fontSize: 18,
    letterSpacing: -0.3,
    color: ink.text,
  },
});
