import Ionicons from '@expo/vector-icons/Ionicons';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { Modal, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { type SavedCar, useAppStore } from '../store/AppStore';
import { ink } from './home/homeTheme';
import { formatPlate } from './PlateField';
import { fonts, noBounce } from './theme';
import { VehiclePhoto } from './VehiclePhoto';

type Props = { visible: boolean; onClose: () => void };

const vehicleName = (vehicle: SavedCar) =>
  vehicle.type === 'bike' ? vehicle.model || 'My Bike' : [vehicle.brandName, vehicle.model].filter(Boolean).join(' ');

/**
 * Quick switcher from Home: pick the vehicle for the next service. A vehicle without a number
 * gets a quiet "Add number" text nudge; everything else (details, number, remove) lives on My Vehicles.
 */
export function VehicleSheet({ visible, onClose }: Props) {
  const { cars, selectedCar, selectCar } = useAppStore();
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();

  // Let the native modal finish closing before the next screen slides in.
  const go = (to: Parameters<typeof router.push>[0]) => {
    onClose();
    setTimeout(() => router.push(to), 280);
  };

  const choose = (vehicle: SavedCar) => {
    void Haptics.selectionAsync();
    selectCar(vehicle.id);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} accessibilityRole="button" accessibilityLabel="Close" />
        <View style={[styles.sheet, { maxHeight: height * 0.8, paddingBottom: Math.max(insets.bottom, 12) }]}>
          <View style={styles.handle} />
          <View style={styles.header}>
            <Text style={styles.title}>Select vehicle</Text>
            <Pressable
              onPress={onClose}
              hitSlop={8}
              style={styles.close}
              accessibilityRole="button"
              accessibilityLabel="Close"
            >
              <Ionicons name="close" size={18} color={ink.text} />
            </Pressable>
          </View>

          <ScrollView {...noBounce} style={styles.list} contentContainerStyle={styles.listContent}>
            {cars.map((vehicle) => {
              const active = selectedCar?.id === vehicle.id;
              return (
                <Pressable
                  key={vehicle.id}
                  onPress={() => choose(vehicle)}
                  style={({ pressed }) => [styles.row, active && styles.rowActive, pressed && styles.pressed]}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: active }}
                  accessibilityLabel={vehicleName(vehicle)}
                >
                  <View style={styles.photo}>
                    <VehiclePhoto vehicle={vehicle} width={60} height={40} />
                  </View>
                  <View style={styles.copy}>
                    <Text style={styles.name} numberOfLines={1}>
                      {vehicleName(vehicle)}
                    </Text>
                    {vehicle.plate ? (
                      <Text style={styles.number}>{formatPlate(vehicle.plate)}</Text>
                    ) : (
                      <Pressable
                        onPress={() => go({ pathname: '/vehicles', params: { id: vehicle.id, edit: '1' } })}
                        hitSlop={6}
                        style={({ pressed }) => [styles.nudge, pressed && styles.pressed]}
                        accessibilityRole="button"
                        accessibilityLabel={`Add number for ${vehicleName(vehicle)}`}
                      >
                        {/* A quiet text nudge, not a boxed button: the row stays about choosing */}
                        <Text style={styles.nudgeText}>Add number</Text>
                        <Ionicons name="chevron-forward" size={11} color={ink.muted} />
                      </Pressable>
                    )}
                  </View>
                  <View style={[styles.radio, active && styles.radioOn]}>
                    {active && <Ionicons name="checkmark" size={14} color={ink.text} />}
                  </View>
                </Pressable>
              );
            })}
          </ScrollView>

          <View style={styles.footer}>
            <Pressable
              onPress={() => go('/add-car')}
              style={({ pressed }) => [styles.footBtn, pressed && styles.pressed]}
              accessibilityRole="button"
            >
              <Ionicons name="add" size={18} color={ink.text} />
              <Text style={styles.footText}>Add vehicle</Text>
            </Pressable>
            {cars.length > 0 && (
              <Pressable
                onPress={() => go('/vehicles')}
                style={({ pressed }) => [styles.footBtn, pressed && styles.pressed]}
                accessibilityRole="button"
              >
                <Ionicons name="options-outline" size={17} color={ink.text} />
                <Text style={styles.footText}>Manage</Text>
              </Pressable>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(11,11,15,0.55)' },
  sheet: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 24, borderTopRightRadius: 24 },
  handle: { width: 36, height: 4, borderRadius: 2, backgroundColor: '#D6D7DB', alignSelf: 'center', marginTop: 8 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 20,
    paddingRight: 16,
    paddingTop: 12,
    paddingBottom: 12,
  },
  title: { flex: 1, fontFamily: fonts.extraBold, fontSize: 19, letterSpacing: -0.4, color: ink.text },
  close: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F2F3F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: { flexGrow: 0 },
  listContent: { paddingHorizontal: 12, paddingBottom: 6, gap: 4 },
  row: {
    minHeight: 68,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'transparent',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  rowActive: { borderColor: '#D9DBE0', backgroundColor: '#FAFAFB' },
  photo: {
    width: 68,
    height: 50,
    borderRadius: 12,
    backgroundColor: '#F4F5F7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: { flex: 1, minWidth: 0, gap: 3 },
  name: { fontFamily: fonts.bold, fontSize: 15, color: ink.text },
  number: { fontFamily: fonts.semiBold, fontSize: 12.5, letterSpacing: 0.4, color: ink.muted },
  nudge: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 2 },
  nudgeText: { fontFamily: fonts.semiBold, fontSize: 12, color: ink.muted },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: '#C8C9CE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOn: { backgroundColor: ink.yellow, borderColor: ink.yellow },
  footer: { flexDirection: 'row', gap: 10, paddingHorizontal: 16, paddingTop: 12 },
  footBtn: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#DADCE2',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  footText: { fontFamily: fonts.bold, fontSize: 14, color: ink.text },
  pressed: { opacity: 0.72 },
});
