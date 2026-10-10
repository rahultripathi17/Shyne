import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Text, View } from 'react-native';

import type { SavedCar } from '../../store/AppStore';
import { VehiclePhoto } from '../VehiclePhoto';
import { ink, type } from './homeTheme';
import { PressableScale } from './motion';

type Props = {
  addressLabel: string;
  address: string;
  vehicle: SavedCar | undefined;
  onLocationPress: () => void;
  onVehiclePress: () => void;
};

const vehicleLabel = (v: SavedCar | undefined) => {
  if (!v) return 'Add vehicle';
  if (v.type === 'bike') return 'My Bike';
  const full = [v.brandName, v.model].filter(Boolean).join(' ');
  // Long names (e.g. "Maruti Suzuki Vitara Brezza") show just the model so nothing is cut off.
  return full.length <= 14 ? full : v.model;
};

// Zomato-style location block: filled pin, bold saved-place name with a chevron,
// full address on one muted line. The vehicle sits on the right.
export function HomeHeader({ addressLabel, address, vehicle, onLocationPress, onVehiclePress }: Props) {
  return (
    <View style={styles.row}>
      <PressableScale
        onPress={onLocationPress}
        containerStyle={styles.location}
        scaleTo={0.98}
        accessibilityLabel="Change address"
      >
        <View style={styles.labelRow}>
          <Ionicons name="location-sharp" size={20} color={ink.yellow} />
          <Text style={styles.label} numberOfLines={1}>
            {addressLabel}
          </Text>
          <Ionicons name="chevron-down" size={16} color={ink.onDark} style={styles.chevron} />
        </View>
        <Text style={styles.address} numberOfLines={1}>
          {address}
        </Text>
      </PressableScale>

      <PressableScale onPress={onVehiclePress} style={styles.vehicle} accessibilityLabel="Change vehicle">
        <View style={styles.vehicleArt}>
          <VehiclePhoto vehicle={vehicle} width={66} height={40} />
        </View>
        <View style={styles.vehicleChip}>
          <Text style={styles.vehicleName} numberOfLines={1}>
            {vehicleLabel(vehicle)}
          </Text>
          <Ionicons name="chevron-down" size={11} color={ink.text} />
        </View>
      </PressableScale>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingHorizontal: 16,
    paddingTop: 6,
  },
  location: {
    flex: 1,
    minWidth: 0,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  label: {
    ...type.h2,
    color: ink.onDark,
    marginLeft: 3,
    flexShrink: 1,
  },
  chevron: {
    marginLeft: 3,
    marginTop: 2,
  },
  address: {
    ...type.body,
    color: ink.onDarkMuted,
    marginTop: 1,
    marginLeft: 23,
  },
  vehicle: {
    alignItems: 'center',
  },
  vehicleArt: {
    width: 66,
    height: 40,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  vehicleChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginTop: -3,
    maxWidth: 110,
    backgroundColor: '#FFFFFF',
    borderRadius: 6,
    paddingLeft: 7,
    paddingRight: 5,
    paddingVertical: 2,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  vehicleName: {
    fontFamily: type.label.fontFamily,
    fontSize: 10.5,
    color: ink.text,
    flexShrink: 1,
  },
});
