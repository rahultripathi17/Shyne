import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useAppStore } from '../../store/AppStore';
import { fonts } from '../theme';
import { T } from '../tracking/trackTheme';

const open = () => router.push('/address');

/** The Home-style address block (bold place + chevron, address under it) for light screens. */
export function AddressBar() {
  const { location } = useAppStore();
  return (
    <Pressable
      onPress={open}
      accessibilityRole="button"
      accessibilityLabel="Change address"
      style={({ pressed }) => [styles.bar, pressed && { opacity: 0.7 }]}
    >
      <View style={styles.labelRow}>
        <Ionicons name="location-sharp" size={18} color={T.gold} />
        <Text style={styles.label} numberOfLines={1}>
          {location?.label ?? 'Set your location'}
        </Text>
        <Ionicons name="chevron-down" size={15} color={T.ink} />
      </View>
      <Text style={styles.address} numberOfLines={1}>
        {location?.address ?? 'Tap to add the address for your service'}
      </Text>
    </Pressable>
  );
}

/** One line at the bottom of Slot and Checkout: where the partner will come. */
export function AddressRow() {
  const { location } = useAppStore();
  return (
    <Pressable onPress={open} accessibilityRole="button" accessibilityLabel="Change address" style={styles.row}>
      <Ionicons name="location-outline" size={17} color={T.ink} />
      <Text style={styles.rowText} numberOfLines={1}>
        {location ? `${location.label} - ${location.address}` : 'Add the address for your service'}
      </Text>
      <Text style={styles.change}>Change</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  bar: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  label: {
    flexShrink: 1,
    fontFamily: fonts.bold,
    fontSize: 16,
    color: T.ink,
  },
  address: {
    marginTop: 2,
    marginLeft: 22,
    fontFamily: fonts.regular,
    fontSize: 12.5,
    color: T.muted,
  },
  row: {
    minHeight: 44,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  rowText: {
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: 13,
    color: T.ink,
  },
  change: {
    fontFamily: fonts.semiBold,
    fontSize: 13,
    color: '#1A5FD0',
  },
});
