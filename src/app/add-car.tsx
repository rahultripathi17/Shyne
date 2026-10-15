import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useState } from 'react';
import { Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ActionFooter, PrimaryButton, TextButton } from '../components/Buttons';
import { CarPicker } from '../components/CarPicker';
import { ink } from '../components/home/homeTheme';
import { isPlateComplete, PlateField } from '../components/PlateField';
import { fonts, noBounce } from '../components/theme';
import { TopBar } from '../components/TopBar';
import { useAppStore, type VehicleType } from '../store/AppStore';

const BIKE = require('../../assets/onboarding/bike.webp');

export default function AddVehicleScreen() {
  const { addCar } = useAppStore();
  const insets = useSafeAreaInsets();
  const [type, setType] = useState<VehicleType>('car');
  const [plate, setPlate] = useState('');
  const plateDone = isPlateComplete(plate);

  const addBike = (withPlate: boolean) => {
    if (withPlate && !plateDone) return;
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    addCar({
      type: 'bike',
      brand: '',
      brandName: '',
      model: 'My Bike',
      body: 'Bike',
      plate: withPlate ? plate.trim() : undefined,
    });
    router.back();
  };

  const segment = (
    <View style={styles.segment}>
      {(['car', 'bike'] as const).map((t) => (
        <Pressable
          key={t}
          onPress={() => {
            void Haptics.selectionAsync();
            setType(t);
          }}
          style={[styles.segmentItem, type === t && styles.segmentOn]}
          accessibilityRole="tab"
          accessibilityState={{ selected: type === t }}
        >
          <Text style={[styles.segmentText, type === t && styles.segmentTextOn]}>{t === 'car' ? 'Car' : 'Bike'}</Text>
        </Pressable>
      ))}
    </View>
  );

  return (
    <View style={styles.container}>
      {type === 'car' ? (
        <CarPicker
          title="Add vehicle"
          topInset={insets.top}
          bottomInset={insets.bottom}
          onExit={() => router.back()}
          accessory={segment}
          onDone={(car) => {
            addCar(car);
            router.back();
          }}
        />
      ) : (
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <TopBar title="Add vehicle" topInset={insets.top} onBack={() => router.back()} />
          {segment}
          <ScrollView {...noBounce} keyboardShouldPersistTaps="handled" contentContainerStyle={styles.bike}>
            <View style={styles.bikeStage}>
              <Image source={BIKE} resizeMode="contain" style={styles.bikeImg} />
            </View>
            <Text style={styles.label}>Vehicle number</Text>
            <PlateField value={plate} onChange={setPlate} />
          </ScrollView>
          <ActionFooter bottomInset={insets.bottom}>
            <PrimaryButton label="Add my bike" onPress={() => addBike(true)} disabled={!plateDone} />
            <TextButton label="Skip for now" onPress={() => addBike(false)} />
          </ActionFooter>
        </KeyboardAvoidingView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  segment: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 4,
    marginBottom: 12,
    padding: 4,
    borderRadius: 14,
    backgroundColor: '#E9E9EE',
  },
  segmentItem: {
    flex: 1,
    height: 38,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentOn: {
    backgroundColor: ink.card,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  segmentText: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: ink.muted,
  },
  segmentTextOn: {
    color: ink.text,
  },
  bike: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 24,
  },
  bikeStage: {
    height: 190,
    borderRadius: 22,
    backgroundColor: '#F4F5F7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bikeImg: {
    width: 260,
    height: 170,
  },
  label: {
    marginTop: 22,
    marginBottom: 10,
    fontFamily: fonts.bold,
    fontSize: 13,
    color: ink.text,
  },
});
