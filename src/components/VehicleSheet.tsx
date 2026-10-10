import Ionicons from '@expo/vector-icons/Ionicons';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Animated,
  Easing,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BRAND_LOGOS } from '../data/brandLogos';
import { type SavedCar, useAppStore } from '../store/AppStore';
import { PrimaryButton } from './Buttons';
import { ink } from './home/homeTheme';
import { formatPlate, isPlateComplete, PlateBadge, PlateField } from './PlateField';
import { fonts, noBounce, useAnimatedValue } from './theme';
import { VehiclePhoto } from './VehiclePhoto';

const titleOf = (v: SavedCar) => (v.type === 'bike' ? 'My Bike' : v.model);
const detailOf = (v: SavedCar) =>
  v.type === 'bike' ? '2 Wheeler' : [v.brandName, v.body].filter(Boolean).join(' · ');

type Props = {
  visible: boolean;
  onClose: () => void;
};

/**
 * One sheet for everything about the user's vehicles: pick the one in use, add or change its
 * number (on its own page inside the sheet), remove one, or add a new vehicle.
 */
export function VehicleSheet({ visible, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const { cars, selectedCar, selectCar, updateCar, removeCar } = useAppStore();
  const [mounted, setMounted] = useState(visible);
  const [menuFor, setMenuFor] = useState<string>();
  const [confirming, setConfirming] = useState<string>();
  const [numberFor, setNumberFor] = useState<SavedCar>();
  const [plate, setPlate] = useState('');
  const progress = useAnimatedValue(0);

  // Mount as soon as it should show; unmount only after the closing slide finishes.
  if (visible && !mounted) setMounted(true);

  useEffect(() => {
    if (visible) {
      Animated.timing(progress, {
        toValue: 1,
        duration: 280,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
      return;
    }
    Animated.timing(progress, {
      toValue: 0,
      duration: 200,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (!finished) return;
      setMounted(false);
      setMenuFor(undefined);
      setConfirming(undefined);
      setNumberFor(undefined);
    });
  }, [visible, progress]);

  const choose = (v: SavedCar) => {
    void Haptics.selectionAsync();
    selectCar(v.id);
    setTimeout(onClose, 160);
  };

  const addNew = () => {
    onClose();
    setTimeout(() => router.push('/add-car'), 220);
  };

  const openNumber = (v: SavedCar) => {
    setMenuFor(undefined);
    setPlate(formatPlate(v.plate ?? ''));
    setNumberFor(v);
  };

  const saveNumber = () => {
    if (!numberFor || !isPlateComplete(plate)) return;
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    updateCar(numberFor.id, { plate: plate.trim() });
    setNumberFor(undefined);
  };

  const remove = (id: string) => {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    removeCar(id);
    setConfirming(undefined);
  };

  if (!mounted) return null;

  const translateY = progress.interpolate({ inputRange: [0, 1], outputRange: [height * 0.6, 0] });

  const list = (
    <>
      <View style={styles.header}>
        <Text style={styles.title}>Your vehicles</Text>
        <Pressable onPress={onClose} hitSlop={8} style={styles.close} accessibilityRole="button" accessibilityLabel="Close">
          <Ionicons name="close" size={20} color={ink.text} />
        </Pressable>
      </View>
      <Text style={styles.hint}>Choose the vehicle you want serviced</Text>

      <ScrollView {...noBounce} keyboardShouldPersistTaps="handled" contentContainerStyle={styles.list}>
        {cars.map((v) => {
          const inUse = selectedCar?.id === v.id;
          const logo = v.type === 'car' ? BRAND_LOGOS[v.brand] : undefined;

          if (confirming === v.id) {
            return (
              <View key={v.id} style={[styles.card, styles.cardDanger]}>
                <View style={styles.confirm}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.name} numberOfLines={1}>
                      Remove {titleOf(v)}?
                    </Text>
                    <Text style={styles.detail}>Past bookings stay in your history.</Text>
                  </View>
                  <Pressable onPress={() => setConfirming(undefined)} style={styles.ghostBtn} accessibilityRole="button">
                    <Text style={styles.ghostText}>Keep</Text>
                  </Pressable>
                  <Pressable onPress={() => remove(v.id)} style={styles.dangerBtn} accessibilityRole="button">
                    <Text style={styles.dangerText}>Remove</Text>
                  </Pressable>
                </View>
              </View>
            );
          }

          return (
            <View key={v.id} style={[styles.card, inUse && styles.cardInUse]}>
              <View style={styles.row}>
                <Pressable
                  onPress={() => choose(v)}
                  style={({ pressed }) => [StyleSheet.absoluteFill, pressed && styles.rowPressed]}
                  accessibilityRole="radio"
                  accessibilityLabel={`Use ${titleOf(v)}`}
                  accessibilityState={{ selected: inUse }}
                />
                <View style={styles.photo} pointerEvents="none">
                  <VehiclePhoto vehicle={v} width={74} height={46} />
                </View>
                <View style={styles.info} pointerEvents="box-none">
                  <View style={styles.nameRow} pointerEvents="none">
                    {logo && <Image source={logo} resizeMode="contain" style={styles.logo} />}
                    <Text style={styles.name} numberOfLines={1}>
                      {titleOf(v)}
                    </Text>
                  </View>
                  <Text style={styles.detail} numberOfLines={1} pointerEvents="none">
                    {detailOf(v)}
                  </Text>
                  {v.plate ? (
                    <View pointerEvents="none" style={{ marginTop: 2 }}>
                      <PlateBadge plate={v.plate} />
                    </View>
                  ) : (
                    <Pressable onPress={() => openNumber(v)} hitSlop={8} style={styles.addNumber} accessibilityRole="button">
                      <Ionicons name="add" size={14} color={ink.text} />
                      <Text style={styles.addNumberText}>Add number</Text>
                    </Pressable>
                  )}
                </View>
                <View style={styles.side} pointerEvents="box-none">
                  <View style={[styles.radio, inUse && styles.radioOn]} pointerEvents="none">
                    {inUse && <Ionicons name="checkmark" size={14} color={ink.text} />}
                  </View>
                  <Pressable
                    onPress={() => setMenuFor(menuFor === v.id ? undefined : v.id)}
                    hitSlop={8}
                    style={styles.more}
                    accessibilityRole="button"
                    accessibilityLabel={`More options for ${titleOf(v)}`}
                  >
                    <Ionicons name="ellipsis-horizontal" size={18} color={ink.muted} />
                  </Pressable>
                </View>
              </View>

              {menuFor === v.id && (
                <View style={styles.actions}>
                  <Pressable onPress={() => openNumber(v)} style={styles.action} accessibilityRole="button">
                    <Ionicons name="create-outline" size={16} color={ink.text} />
                    <Text style={styles.actionText}>{v.plate ? 'Change number' : 'Add number'}</Text>
                  </Pressable>
                  {cars.length > 1 && (
                    <Pressable
                      onPress={() => {
                        setMenuFor(undefined);
                        setConfirming(v.id);
                      }}
                      style={styles.action}
                      accessibilityRole="button"
                    >
                      <Ionicons name="trash-outline" size={16} color={ink.red} />
                      <Text style={[styles.actionText, { color: ink.red }]}>Remove</Text>
                    </Pressable>
                  )}
                </View>
              )}
            </View>
          );
        })}

        <Pressable
          onPress={addNew}
          style={({ pressed }) => [styles.addCard, pressed && { backgroundColor: '#FAFAFB' }]}
          accessibilityRole="button"
          accessibilityLabel="Add a new vehicle"
        >
          <View style={styles.addIcon}>
            <Ionicons name="add" size={20} color={ink.text} />
          </View>
          <Text style={styles.addText}>Add a new vehicle</Text>
          <Ionicons name="chevron-forward" size={18} color={ink.muted} />
        </Pressable>
      </ScrollView>
    </>
  );

  const numberPage = numberFor && (
    <View style={styles.numberPage}>
      <View style={styles.pageBar}>
        <Pressable onPress={() => setNumberFor(undefined)} hitSlop={10} style={styles.pageBack} accessibilityRole="button" accessibilityLabel="Back">
          <Ionicons name="chevron-back" size={22} color={ink.text} />
        </Pressable>
        <Text style={styles.pageTitle}>{numberFor.plate ? 'Change vehicle number' : 'Add vehicle number'}</Text>
      </View>

      <View style={styles.summary}>
        <View style={styles.photo}>
          <VehiclePhoto vehicle={numberFor} width={74} height={46} />
        </View>
        <View style={{ flex: 1 }}>
          <View style={styles.nameRow}>
            {numberFor.type === 'car' && BRAND_LOGOS[numberFor.brand] && (
              <Image source={BRAND_LOGOS[numberFor.brand]} resizeMode="contain" style={styles.logo} />
            )}
            <Text style={styles.name}>{titleOf(numberFor)}</Text>
          </View>
          <Text style={styles.detail}>{detailOf(numberFor)}</Text>
        </View>
      </View>

      <Text style={styles.fieldLabel}>Registration number</Text>
      <PlateField value={plate} onChange={setPlate} autoFocus onSubmit={saveNumber} />
      <Text style={styles.fieldHint}>We use it to check challans and keep your service records.</Text>

      <PrimaryButton label="Save number" onPress={saveNumber} disabled={!isPlateComplete(plate)} style={{ marginTop: 18 }} />
    </View>
  );

  return (
    <Modal transparent visible animationType="none" statusBarTranslucent onRequestClose={onClose}>
      <Animated.View style={[styles.backdrop, { opacity: progress }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Close" />
      </Animated.View>

      <KeyboardAvoidingView
        style={styles.anchor}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        pointerEvents="box-none"
      >
        <Animated.View
          style={[
            styles.sheet,
            { maxHeight: height * 0.85, paddingBottom: Math.max(insets.bottom, 16), transform: [{ translateY }] },
          ]}
        >
          <View style={styles.handle} />
          {numberPage || list}
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(10,10,14,0.5)',
  },
  anchor: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    paddingTop: 8,
  },
  handle: {
    alignSelf: 'center',
    width: 38,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#DCDDE2',
    marginBottom: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
  },
  title: {
    fontFamily: fonts.extraBold,
    fontSize: 20,
    letterSpacing: -0.4,
    color: ink.text,
  },
  close: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#F2F3F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  hint: {
    marginTop: 2,
    marginBottom: 14,
    paddingHorizontal: 18,
    fontFamily: fonts.medium,
    fontSize: 13,
    color: ink.muted,
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 8,
    gap: 10,
  },
  card: {
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: ink.line,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
  },
  cardInUse: {
    borderColor: ink.yellowDeep,
    backgroundColor: '#FFFBE6',
  },
  cardDanger: {
    borderColor: '#F6C9C9',
    backgroundColor: '#FFF5F5',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingLeft: 10,
    paddingRight: 12,
    paddingVertical: 12,
  },
  rowPressed: {
    backgroundColor: 'rgba(0,0,0,0.03)',
  },
  photo: {
    width: 82,
    height: 56,
    borderRadius: 12,
    backgroundColor: '#F4F5F7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: {
    flex: 1,
    gap: 3,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  logo: {
    width: 22,
    height: 16,
  },
  name: {
    flexShrink: 1,
    fontFamily: fonts.extraBold,
    fontSize: 15,
    color: ink.text,
  },
  detail: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: ink.muted,
  },
  addNumber: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 2,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#B9BCC4',
  },
  addNumberText: {
    fontFamily: fonts.bold,
    fontSize: 11,
    color: ink.text,
  },
  side: {
    alignSelf: 'stretch',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#C9CBD2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOn: {
    backgroundColor: ink.yellowDeep,
    borderColor: ink.yellowDeep,
  },
  more: {
    width: 28,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actions: {
    flexDirection: 'row',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E2E3E8',
  },
  action: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 44,
  },
  actionText: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: ink.text,
  },
  confirm: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  ghostBtn: {
    height: 36,
    paddingHorizontal: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ghostText: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: ink.label,
  },
  dangerBtn: {
    height: 36,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: ink.red,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dangerText: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: '#FFFFFF',
  },
  addCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    height: 60,
    paddingHorizontal: 14,
    borderRadius: 18,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#C9CBD2',
  },
  addIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: ink.yellow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addText: {
    flex: 1,
    fontFamily: fonts.bold,
    fontSize: 15,
    color: ink.text,
  },
  numberPage: {
    paddingHorizontal: 16,
    paddingBottom: 4,
  },
  pageBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginLeft: -8,
    marginBottom: 14,
  },
  pageBack: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pageTitle: {
    flex: 1,
    fontFamily: fonts.extraBold,
    fontSize: 18,
    letterSpacing: -0.3,
    color: ink.text,
  },
  summary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 10,
    borderRadius: 16,
    backgroundColor: '#FAFAFB',
  },
  fieldLabel: {
    marginTop: 18,
    marginBottom: 10,
    fontFamily: fonts.bold,
    fontSize: 13,
    color: ink.text,
  },
  fieldHint: {
    marginTop: 10,
    fontFamily: fonts.medium,
    fontSize: 12,
    color: ink.muted,
  },
});
