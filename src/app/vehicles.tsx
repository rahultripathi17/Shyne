import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { type ComponentProps, type ReactNode, useEffect, useState } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PrimaryButton } from '../components/Buttons';
import { ink } from '../components/home/homeTheme';
import { formatPlate, isPlateComplete, PlateDisplay, PlateField } from '../components/PlateField';
import { fonts, noBounce } from '../components/theme';
import { Toast, useToast } from '../components/Toast';
import { TopBar } from '../components/TopBar';
import { VehiclePhoto } from '../components/VehiclePhoto';
import { MODELS } from '../data/cars';
import { type SavedCar, useAppStore } from '../store/AppStore';

type IconName = ComponentProps<typeof Ionicons>['name'];
type Tone = 'good' | 'warn' | 'none';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/**
 * What the RC lookup returns for a number. Sample values derived from the plate until the
 * lookup is connected, so each number always shows the same details.
 */
function lookup(plate: string, owner: string) {
  const raw = plate.replace(/\s/g, '');
  const h = [...raw].reduce((n, ch) => (n * 31 + ch.charCodeAt(0)) % 100000, 7);
  const year = 2017 + (h % 7);
  const day = (h % 27) + 1;
  const digits = raw.replace(/\D/g, '').padStart(4, '0').slice(-4);
  const challans = h % 3 === 0 ? 1 : 0;
  return {
    owner: owner || 'Vehicle owner',
    registered: `${day} ${MONTHS[h % 12]} ${year}`,
    rcValid: `${day} ${MONTHS[h % 12]} ${year + 15}`,
    chassis: `MA3••••••${digits}`,
    engine: `K12••••${String(h % 1000).padStart(3, '0')}`,
    transmission: h % 2 ? 'Manual' : 'Automatic',
    status: {
      challan: challans
        ? { value: '1 pending', sub: '₹500 to pay', tone: 'warn' as Tone }
        : { value: 'Clear', sub: 'No pending challans', tone: 'good' as Tone },
      puc: { value: 'Valid', sub: `till ${(h % 24) + 3} ${MONTHS[(h + 8) % 12]} 2027`, tone: 'good' as Tone },
      insurance: { value: 'Active', sub: `till ${(h % 26) + 1} ${MONTHS[(h + 4) % 12]} 2027`, tone: 'good' as Tone },
    },
  };
}

/** FASTag isn't live yet: same card, "Coming soon" with or without a number. */
const SOON = { value: 'Coming soon', sub: 'Recharge & track balance', tone: 'none' as Tone };

const STATUS: {
  key: 'challan' | 'insurance' | 'puc' | 'fastag';
  label: string;
  icon: IconName;
  tint: string;
  bg: string;
}[] = [
  { key: 'challan', label: 'Challans', icon: 'receipt-outline', tint: '#C2410C', bg: '#FFF3EC' },
  { key: 'insurance', label: 'Insurance', icon: 'shield-checkmark-outline', tint: '#1D4ED8', bg: '#EEF3FF' },
  { key: 'puc', label: 'Pollution', icon: 'leaf-outline', tint: '#15803D', bg: '#ECF8F0' },
  { key: 'fastag', label: 'FASTag', icon: 'pricetag-outline', tint: '#7C3AED', bg: '#F4EFFF' },
];

const SEATS_BY_BODY: Record<string, number> = { MUV: 7 };
const modelName = (v: SavedCar) => (v.type === 'bike' ? v.model || 'My Bike' : v.model);

const chipStyle = (tone: Tone) =>
  tone === 'warn'
    ? ([styles.chipWarn, styles.chipTextWarn] as const)
    : tone === 'none'
      ? ([styles.chipSoon, styles.chipTextSoon] as const)
      : ([styles.chipGood, styles.chipTextGood] as const);

/** A plain bottom sheet: handle, title row with close, then its content. */
function Sheet({
  visible,
  title,
  onClose,
  children,
}: {
  visible: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <KeyboardAvoidingView style={styles.sheetWrap} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Pressable style={styles.backdrop} onPress={onClose} accessibilityRole="button" accessibilityLabel="Close" />
        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          <View style={styles.handle} />
          <View style={styles.sheetHead}>
            <Text style={styles.sheetTitle} numberOfLines={1}>
              {title}
            </Text>
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
          {children}
          {/* Keeps the area under the sheet white while the keyboard slides in */}
          <View style={styles.sheetFill} pointerEvents="none" />
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

/** One row of a details list: icon, label, value (or a blank bar while locked). */
function Row({ icon, label, value, last }: { icon: IconName; label: string; value?: string; last?: boolean }) {
  return (
    <View style={[styles.row, !last && styles.rowLine]}>
      <View style={styles.rowIcon}>
        <Ionicons name={icon} size={17} color={ink.label} />
      </View>
      <Text style={styles.rowLabel}>{label}</Text>
      {value ? (
        <Text style={styles.rowValue} numberOfLines={1}>
          {value}
        </Text>
      ) : (
        <View style={styles.blank} />
      )}
    </View>
  );
}

/**
 * My Vehicles. The selected vehicle is the one used for bookings, so tapping a vehicle in the
 * row switches to it. Every vehicle uses the same fixed layout, so switching never moves the
 * page; without a number its RC details stay locked behind "add number".
 */
export default function VehiclesScreen() {
  const { cars, selectedCar, selectCar, updateCar, removeCar, name } = useAppStore();
  const params = useLocalSearchParams<{ id?: string; edit?: string }>();
  const insets = useSafeAreaInsets();
  const toast = useToast();

  // Opened for a specific vehicle (e.g. "Add number" from Home): switch to it once.
  useEffect(() => {
    if (params.id && cars.some((c) => c.id === params.id)) selectCar(params.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const vehicle = selectedCar ?? cars[0];
  const [numberOpen, setNumberOpen] = useState(params.edit === '1');
  const [removeOpen, setRemoveOpen] = useState(false);
  const [plate, setPlate] = useState('');

  const choose = (v: SavedCar) => {
    if (v.id === vehicle?.id) return;
    void Haptics.selectionAsync();
    selectCar(v.id);
  };
  const openNumber = () => {
    setPlate(formatPlate(vehicle?.plate ?? ''));
    setNumberOpen(true);
  };
  const closeNumber = () => {
    Keyboard.dismiss();
    setNumberOpen(false);
  };
  const saveNumber = () => {
    if (!vehicle || !isPlateComplete(plate)) return;
    updateCar(vehicle.id, { plate: formatPlate(plate) });
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    closeNumber();
    toast.show('Number saved');
  };
  const remove = () => {
    if (!vehicle) return;
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    removeCar(vehicle.id);
    setRemoveOpen(false);
    toast.show(`${modelName(vehicle)} removed`);
  };

  if (!vehicle) {
    return (
      <View style={styles.screen}>
        <StatusBar style="dark" />
        <TopBar title="My Vehicles" topInset={insets.top} onBack={() => router.back()} />
        <View style={styles.empty}>
          <VehiclePhoto vehicle={{ type: 'car' }} width={200} height={120} />
          <Text style={styles.emptyTitle}>No vehicles yet</Text>
          <Text style={styles.emptyText}>Add your car or bike to get started.</Text>
          <PrimaryButton label="Add a vehicle" onPress={() => router.push('/add-car')} style={styles.emptyButton} />
        </View>
      </View>
    );
  }

  const catalog = MODELS.find((m) => m.image === vehicle.image);
  const rc = vehicle.plate ? lookup(vehicle.plate, name ?? '') : undefined;
  const bike = vehicle.type === 'bike';
  const seats = bike ? 2 : (SEATS_BY_BODY[vehicle.body] ?? 5);

  return (
    <View style={styles.screen}>
      <StatusBar style="dark" />
      <ScrollView {...noBounce} contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}>
        {/* Soft grey header: the vehicle, its brand, model and type. The rest of the page stays white */}
        <LinearGradient colors={['#ECEEF2', '#F6F7F9']} style={styles.band}>
          <TopBar
            title="My Vehicles"
            topInset={insets.top}
            onBack={() => router.back()}
            right={
              <Pressable
                onPress={() => setRemoveOpen(true)}
                hitSlop={6}
                style={({ pressed }) => [styles.deleteBtn, pressed && styles.pressed]}
                accessibilityRole="button"
                accessibilityLabel={`Remove ${modelName(vehicle)}`}
              >
                <MaterialCommunityIcons name="trash-can-outline" size={19} color={ink.red} />
              </Pressable>
            }
          />
          <View style={styles.photo}>
            <VehiclePhoto vehicle={vehicle} width={270} height={150} />
          </View>
          <View style={styles.nameBlock}>
            <Text style={styles.brand} numberOfLines={1}>
              {vehicle.brandName || (bike ? 'Two-wheeler' : 'Car')}
            </Text>
            <Text style={styles.model} numberOfLines={1} adjustsFontSizeToFit>
              {modelName(vehicle)}
            </Text>
          </View>
        </LinearGradient>

        {/* The number, or a dashed box to add it (same size either way) */}
        <View style={styles.identity}>
          <Pressable
            onPress={openNumber}
            style={({ pressed }) => [styles.plateSlot, pressed && styles.pressed]}
            accessibilityRole="button"
            accessibilityLabel={vehicle.plate ? 'Change vehicle number' : 'Add vehicle number'}
          >
            {vehicle.plate ? (
              <PlateDisplay plate={vehicle.plate} />
            ) : (
              <View style={styles.platePlaceholder}>
                <Ionicons name="add" size={18} color={ink.text} />
                <Text style={styles.platePlaceholderText}>Add vehicle number</Text>
              </View>
            )}
          </Pressable>
        </View>

        {/* Switch vehicle; "Add" comes first so it's always in view */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.strip}>
          <Pressable
            onPress={() => router.push('/add-car')}
            style={styles.tile}
            accessibilityRole="button"
            accessibilityLabel="Add vehicle"
          >
            <View style={[styles.circle, styles.addCircle]}>
              <Ionicons name="add" size={26} color={ink.text} />
            </View>
            <Text style={styles.tileLabel}>Add</Text>
          </Pressable>
          {cars.map((v) => {
            const on = v.id === vehicle.id;
            return (
              <Pressable
                key={v.id}
                onPress={() => choose(v)}
                style={styles.tile}
                accessibilityRole="radio"
                accessibilityState={{ selected: on }}
                accessibilityLabel={modelName(v)}
              >
                <View style={[styles.circle, on && styles.circleOn]}>
                  <VehiclePhoto vehicle={v} width={50} height={34} />
                </View>
                <Text style={[styles.tileLabel, on && styles.tileLabelOn]} numberOfLines={1}>
                  {modelName(v)}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <View style={styles.body}>
          {/* Status and registration come from the number; locked until it's added */}
          <View>
            <Text style={styles.section}>Status</Text>
            <View style={styles.statusGrid}>
              {STATUS.map((s) => {
                const soon = s.key === 'fastag';
                const st = s.key === 'fastag' ? SOON : rc?.status[s.key];
                return (
                  <Pressable
                    key={s.key}
                    onPress={() => (rc || soon ? toast.show(`${s.label} — coming soon`) : openNumber())}
                    style={({ pressed }) => [styles.statusCard, pressed && styles.pressed]}
                    accessibilityRole="button"
                    accessibilityLabel={s.label}
                  >
                    <View style={styles.statusTop}>
                      <View style={[styles.statusIcon, { backgroundColor: s.bg }]}>
                        <Ionicons name={s.icon} size={18} color={s.tint} />
                      </View>
                      {st && (
                        <View style={[styles.chip, chipStyle(st.tone)[0]]}>
                          <Text style={[styles.chipText, chipStyle(st.tone)[1]]}>{st.value}</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.statusLabel}>{s.label}</Text>
                    {st ? (
                      <Text style={styles.statusSub} numberOfLines={1}>
                        {st.sub}
                      </Text>
                    ) : (
                      <View style={[styles.blank, styles.blankLeft, { width: '70%' }]} />
                    )}
                  </Pressable>
                );
              })}
            </View>

            <Text style={styles.section}>Registration</Text>
            <View style={styles.card}>
              <Row icon="person-outline" label="Owner" value={rc?.owner} />
              <Row icon="calendar-outline" label="Registered on" value={rc?.registered} />
              <Row icon="document-text-outline" label="RC valid till" value={rc?.rcValid} />
              <Row icon="barcode-outline" label="Chassis no." value={rc?.chassis} />
              <Row icon="cog-outline" label="Engine no." value={rc?.engine} last />
            </View>

            {!rc && (
              <View style={styles.lock}>
                <Pressable
                  onPress={openNumber}
                  style={({ pressed }) => [styles.lockBtn, pressed && styles.pressed]}
                  accessibilityRole="button"
                >
                  <Ionicons name="lock-closed" size={15} color="#FFFFFF" />
                  <Text style={styles.lockBtnText}>Add number to unlock</Text>
                </Pressable>
              </View>
            )}
          </View>

          {/* Known from the model itself, number or not */}
          <View>
            <Text style={styles.section}>Vehicle</Text>
            <View style={styles.card}>
              <Row icon="ribbon-outline" label="Brand" value={vehicle.brandName || '\u2014'} />
              <Row icon="car-sport-outline" label="Model" value={modelName(vehicle)} />
              <Row icon="grid-outline" label="Category" value={bike ? 'Two-wheeler' : vehicle.body || '\u2014'} />
              <Row icon="flash-outline" label="Fuel type" value={catalog?.fuel || '\u2014'} />
              <Row icon="swap-horizontal-outline" label="Transmission" value={rc?.transmission ?? '\u2014'} />
              <Row icon="people-outline" label="Seating" value={`${seats} seater`} last />
            </View>
          </View>
        </View>
      </ScrollView>

      <Sheet visible={numberOpen} title={vehicle.plate ? 'Change number' : 'Add number'} onClose={closeNumber}>
        <Text style={styles.sheetSub}>{[vehicle.brandName, modelName(vehicle)].filter(Boolean).join(' ')}</Text>
        <View style={styles.sheetField}>
          <PlateField value={plate} onChange={setPlate} autoFocus onSubmit={saveNumber} />
        </View>
        <PrimaryButton label="Save" onPress={saveNumber} disabled={!isPlateComplete(plate)} style={styles.sheetBtn} />
      </Sheet>

      <Sheet visible={removeOpen} title={`Remove ${modelName(vehicle)}?`} onClose={() => setRemoveOpen(false)}>
        <Text style={styles.sheetSub}>You can add it again anytime.</Text>
        <View style={styles.sheetRow}>
          <Pressable
            onPress={() => setRemoveOpen(false)}
            style={[styles.sheetAction, styles.keep]}
            accessibilityRole="button"
          >
            <Text style={styles.keepText}>Keep</Text>
          </Pressable>
          <Pressable onPress={remove} style={[styles.sheetAction, styles.removeBtn]} accessibilityRole="button">
            <Text style={styles.removeText}>Remove</Text>
          </Pressable>
        </View>
      </Sheet>

      <Toast toast={toast} bottom={insets.bottom + 16} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#FFFFFF' },
  band: { borderBottomLeftRadius: 28, borderBottomRightRadius: 28, paddingBottom: 14 },
  deleteBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photo: { height: 160, alignItems: 'center', justifyContent: 'flex-end' },
  identity: { alignItems: 'center', paddingHorizontal: 20, paddingTop: 20 },
  nameBlock: { height: 56, marginTop: 8, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
  brand: { fontFamily: fonts.semiBold, fontSize: 13, color: ink.muted },
  model: { marginTop: 1, fontFamily: fonts.extraBold, fontSize: 21, letterSpacing: -0.5, color: ink.text },
  plateSlot: { width: 236, height: 52 },
  platePlaceholder: {
    flex: 1,
    borderRadius: 10,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#B4B7BF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  platePlaceholderText: { fontFamily: fonts.bold, fontSize: 14, color: ink.text },
  strip: { gap: 12, paddingHorizontal: 20, paddingTop: 24, paddingBottom: 4, flexGrow: 1, justifyContent: 'center' },
  tile: { width: 66, alignItems: 'center' },
  circle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#F5F6F8',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  circleOn: { backgroundColor: '#FFFFFF', borderColor: ink.text },
  addCircle: { backgroundColor: '#FFFFFF', borderWidth: 1.5, borderStyle: 'dashed', borderColor: '#B4B7BF' },
  tileLabel: { marginTop: 6, fontFamily: fonts.medium, fontSize: 11.5, color: ink.muted },
  tileLabelOn: { fontFamily: fonts.bold, color: ink.text },
  body: { paddingHorizontal: 16, paddingTop: 6 },
  section: {
    marginTop: 22,
    marginBottom: 10,
    marginLeft: 2,
    fontFamily: fonts.extraBold,
    fontSize: 16,
    letterSpacing: -0.2,
    color: ink.text,
  },
  statusGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  statusCard: {
    width: '48.5%',
    flexGrow: 1,
    height: 116,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#ECEDF1',
    backgroundColor: '#FFFFFF',
  },
  statusTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  statusIcon: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  statusLabel: { marginTop: 12, fontFamily: fonts.bold, fontSize: 14.5, color: ink.text },
  statusSub: { marginTop: 3, fontFamily: fonts.medium, fontSize: 12, color: ink.muted },
  card: { paddingHorizontal: 14, borderRadius: 16, borderWidth: 1, borderColor: '#ECEDF1', backgroundColor: '#FFFFFF' },
  row: { height: 54, flexDirection: 'row', alignItems: 'center', gap: 12 },
  rowLine: { borderBottomWidth: 1, borderBottomColor: '#F1F2F4' },
  rowIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#F5F6F8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowLabel: { flex: 1, fontFamily: fonts.medium, fontSize: 13.5, color: ink.muted },
  rowValue: { maxWidth: '55%', fontFamily: fonts.bold, fontSize: 13.5, color: ink.text },
  blank: { width: 90, height: 10, borderRadius: 5, backgroundColor: '#EEEFF2' },
  blankLeft: { marginTop: 8 },
  // Covers the locked sections; the button sits in the gap between the status rows.
  lock: {
    ...StyleSheet.absoluteFill,
    top: 32,
    alignItems: 'center',
    paddingTop: 118,
    backgroundColor: 'rgba(255,255,255,0.45)',
  },
  lockBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    height: 46,
    paddingHorizontal: 20,
    borderRadius: 23,
    backgroundColor: ink.text,
    shadowColor: '#0B0B0F',
    shadowOpacity: 0.18,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  lockBtnText: { fontFamily: fonts.bold, fontSize: 14, color: '#FFFFFF' },
  chip: { height: 24, paddingHorizontal: 9, borderRadius: 12, justifyContent: 'center' },
  chipGood: { backgroundColor: '#E8F7EE' },
  chipWarn: { backgroundColor: '#FFF2DD' },
  chipText: { fontFamily: fonts.bold, fontSize: 11.5 },
  chipTextGood: { color: '#0E7A47' },
  chipTextWarn: { color: '#B45309' },
  chipSoon: { backgroundColor: '#F2F3F5' },
  chipTextSoon: { color: ink.muted },
  sheetWrap: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(11,11,15,0.55)' },
  sheet: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 20 },
  sheetFill: { position: 'absolute', left: 0, right: 0, top: '100%', height: 600, backgroundColor: '#FFFFFF' },
  handle: { width: 36, height: 4, borderRadius: 2, backgroundColor: '#D6D7DB', alignSelf: 'center', marginTop: 8 },
  sheetHead: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingTop: 12 },
  sheetTitle: { flex: 1, fontFamily: fonts.extraBold, fontSize: 17, letterSpacing: -0.4, color: ink.text },
  close: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F2F3F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetSub: { marginTop: 4, fontFamily: fonts.medium, fontSize: 13, color: ink.muted },
  sheetField: { marginTop: 18 },
  sheetBtn: { marginTop: 16 },
  sheetRow: { flexDirection: 'row', gap: 10, marginTop: 20 },
  sheetAction: { flex: 1, height: 50, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  keep: { borderWidth: 1, borderColor: '#DADCE2' },
  keepText: { fontFamily: fonts.bold, fontSize: 15, color: ink.text },
  removeBtn: { backgroundColor: ink.red },
  removeText: { fontFamily: fonts.bold, fontSize: 15, color: '#FFFFFF' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, paddingBottom: 60 },
  emptyTitle: { marginTop: 18, fontFamily: fonts.extraBold, fontSize: 18, color: ink.text },
  emptyText: {
    marginTop: 6,
    fontFamily: fonts.medium,
    fontSize: 13.5,
    lineHeight: 20,
    color: ink.muted,
    textAlign: 'center',
  },
  emptyButton: { alignSelf: 'stretch', marginTop: 24 },
  pressed: { opacity: 0.7 },
});
