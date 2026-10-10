import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { SavedCar } from '../store/AppStore';
import { colors } from './theme';
import { VehicleIcon } from './VehicleIcon';

type Props = {
  car: SavedCar | undefined;
  onPress: () => void;
  actionLabel?: string;
};

export function CarCard({ car, onPress, actionLabel = 'Change' }: Props) {
  if (!car) {
    return (
      <Pressable onPress={onPress} style={[styles.card, styles.empty]}>
        <View style={styles.addIcon}>
          <Ionicons name="add" size={26} color={colors.brand} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.model}>Add your vehicle</Text>
          <Text style={styles.meta}>Car or bike — see exact prices</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
      </Pressable>
    );
  }

  return (
    <Pressable onPress={onPress} style={styles.card}>
      <View style={styles.logoBox}>
        <VehicleIcon vehicle={car} size={44} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.model}>
          {car.brandName} {car.model}
        </Text>
        <Text style={styles.meta}>{car.body}</Text>
      </View>
      <Text style={styles.action}>{actionLabel}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 14,
  },
  empty: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.brand,
    backgroundColor: colors.brandLight,
  },
  addIcon: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoBox: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  model: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
  },
  meta: {
    fontSize: 14,
    color: colors.textMuted,
    marginTop: 2,
  },
  action: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.brand,
  },
});
