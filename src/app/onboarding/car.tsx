import { router } from 'expo-router';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CarPicker } from '../../components/CarPicker';
import { useAppStore } from '../../store/AppStore';

export default function CarScreen() {
  const insets = useSafeAreaInsets();
  const { addCar, completeOnboarding } = useAppStore();

  return (
    <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
      <CarPicker
        title="Select your car"
        topInset={insets.top}
        bottomInset={insets.bottom}
        onExit={() => router.back()}
        saveLabel="Save & continue"
        onDone={(car) => {
          addCar(car);
          completeOnboarding();
        }}
      />
    </View>
  );
}
