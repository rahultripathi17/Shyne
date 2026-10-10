import { Image, type ImageStyle, type StyleProp } from 'react-native';

import { MODEL_IMAGES } from '../data/modelImages';
import type { SavedCar } from '../store/AppStore';

const GENERIC = {
  car: require('../../assets/onboarding/car.webp'),
  bike: require('../../assets/onboarding/bike.webp'),
};

type Props = {
  vehicle: Pick<SavedCar, 'type' | 'image'> | undefined;
  width: number;
  height: number;
  style?: StyleProp<ImageStyle>;
};

/** The model's own photo when we know it; a clean generic car or bike otherwise. */
export function VehiclePhoto({ vehicle, width, height, style }: Props) {
  const source =
    (vehicle?.type === 'car' && vehicle.image && MODEL_IMAGES[vehicle.image]) ||
    (vehicle?.type === 'bike' ? GENERIC.bike : GENERIC.car);
  return <Image source={source} resizeMode="contain" style={[{ width, height }, style]} />;
}
