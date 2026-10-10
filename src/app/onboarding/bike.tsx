import * as Haptics from 'expo-haptics';
import { useState } from 'react';
import { Image, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ink } from '../../components/home/homeTheme';
import { ActionFooter, PrimaryButton, TextButton } from '../../components/Buttons';
import { FadeIn } from '../../components/home/motion';
import { OnboardingHeader } from '../../components/onboarding/OnboardingHeader';
import { OnboardingLead } from '../../components/onboarding/OnboardingLead';
import { isPlateComplete, PlateField } from '../../components/PlateField';
import { fonts, noBounce } from '../../components/theme';
import { useAppStore } from '../../store/AppStore';

const BIKE = require('../../../assets/onboarding/bike.webp');

// Bikes need no model — just the registration number (optional) for challan checks.
export default function BikeScreen() {
  const insets = useSafeAreaInsets();
  const { addCar, completeOnboarding } = useAppStore();
  const [plate, setPlate] = useState('');
  const done = isPlateComplete(plate);

  const finish = (withPlate: boolean) => {
    if (withPlate && !done) return;
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    addCar({
      type: 'bike',
      brand: '',
      brandName: '',
      model: 'My Bike',
      body: 'Bike',
      plate: withPlate ? plate.trim() : undefined,
    });
    completeOnboarding();
  };

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <OnboardingHeader title="Add your bike number" topInset={insets.top} />
      <ScrollView {...noBounce} keyboardShouldPersistTaps="handled" contentContainerStyle={styles.body}>
        <OnboardingLead>We’ll keep an eye on challans for you.</OnboardingLead>
        <FadeIn style={styles.stage}>
          <Image source={BIKE} resizeMode="contain" style={styles.bike} />
        </FadeIn>
        <Text style={styles.label}>Vehicle number</Text>
        <PlateField value={plate} onChange={setPlate} onSubmit={() => finish(true)} />
      </ScrollView>

      <ActionFooter bottomInset={insets.bottom}>
        <PrimaryButton label="Save & continue" onPress={() => finish(true)} disabled={!done} />
        <TextButton label="Skip for now" onPress={() => finish(false)} />
      </ActionFooter>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  body: {
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 24,
  },
  stage: {
    height: 190,
    marginTop: 22,
    borderRadius: 22,
    backgroundColor: '#F4F5F7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bike: {
    width: 240,
    height: 160,
  },
  label: {
    marginTop: 22,
    marginBottom: 10,
    fontFamily: fonts.bold,
    fontSize: 13,
    color: ink.text,
  },
});
