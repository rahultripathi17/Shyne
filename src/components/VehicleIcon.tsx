import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Image, StyleSheet } from 'react-native';

import { BRAND_LOGOS } from '../data/brandLogos';
import type { SavedCar } from '../store/AppStore';

type Props = {
  vehicle: Pick<SavedCar, 'type' | 'brand'> | undefined;
  /** Width of the logo / icon box. Logos keep the dataset's 8:5 canvas. */
  size: number;
  color?: string;
};

// Brand logo for cars from the dataset; a plain car or bike icon otherwise.
export function VehicleIcon({ vehicle, size, color = '#202020' }: Props) {
  const logo = vehicle?.type === 'car' ? BRAND_LOGOS[vehicle.brand] : undefined;
  if (logo) {
    return <Image source={logo} resizeMode="contain" style={[styles.logo, { width: size, height: size * 0.625 }]} />;
  }
  return (
    <MaterialCommunityIcons
      name={vehicle?.type === 'bike' ? 'motorbike' : 'car-side'}
      size={size * 0.8}
      color={color}
    />
  );
}

const styles = StyleSheet.create({
  logo: {
    alignSelf: 'center',
  },
});
