import Ionicons from '@expo/vector-icons/Ionicons';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CarCard } from '../../components/CarCard';
import { colors, formatPrice, noBounce, shared } from '../../components/theme';
import { ADD_ONS, getService, TIER_LABEL, tierForBody } from '../../data/services';
import { useAppStore } from '../../store/AppStore';

const SLOT_HOURS = [7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18];

const toIsoDate = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

const slotLabel = (h: number) => {
  const suffix = h < 12 ? 'AM' : 'PM';
  const hour = h % 12 === 0 ? 12 : h % 12;
  return `${String(hour).padStart(2, '0')}:00 ${suffix}`;
};

function nextDays(count: number) {
  const today = new Date();
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() + i);
    return {
      iso: toIsoDate(d),
      day: i === 0 ? 'Today' : d.toLocaleDateString('en-IN', { weekday: 'short' }),
      date: d.getDate(),
      isToday: i === 0,
    };
  });
}

export default function BookServiceScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const service = getService(id);
  const { selectedCar, cars, selectCar, addBooking } = useAppStore();
  const insets = useSafeAreaInsets();

  const days = useMemo(() => nextDays(7), []);
  const [dateIso, setDateIso] = useState(days[0].iso);
  const [slotHour, setSlotHour] = useState<number>();
  const [addOnIds, setAddOnIds] = useState<string[]>([]);
  const [address, setAddress] = useState('');

  if (!service) {
    return (
      <View style={styles.center}>
        <Text style={shared.subtitle}>Service not found</Text>
      </View>
    );
  }

  const tier = selectedCar ? tierForBody(selectedCar.body) : 'small';
  const basePrice = service.prices[tier];
  const addOnTotal = ADD_ONS.filter((a) => addOnIds.includes(a.id)).reduce((s, a) => s + a.price, 0);
  const total = basePrice + addOnTotal;

  const isToday = dateIso === days[0].iso;
  const currentHour = new Date().getHours();
  const canConfirm = !!selectedCar && slotHour !== undefined && address.trim().length > 3;

  const toggleAddOn = (addOnId: string) =>
    setAddOnIds((prev) =>
      prev.includes(addOnId) ? prev.filter((x) => x !== addOnId) : [...prev, addOnId],
    );

  const confirm = () => {
    if (!canConfirm || !selectedCar || slotHour === undefined) return;
    addBooking({
      serviceId: service.id,
      car: selectedCar,
      date: dateIso,
      slot: slotLabel(slotHour),
      address: address.trim(),
      addOnIds,
      total,
    });
    router.back();
    router.navigate('/bookings');
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <Stack.Screen options={{ title: service.name }} />

      <ScrollView {...noBounce} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={[styles.hero, { backgroundColor: service.color }]}>
          <Ionicons name={service.icon} size={40} color="#FFFFFF" />
          <View style={{ flex: 1 }}>
            <Text style={styles.heroTitle}>{service.name}</Text>
            <Text style={styles.heroMeta}>
              ~{service.durationMins} min · at your doorstep
            </Text>
          </View>
        </View>

        <View style={shared.card}>
          {service.includes.map((item) => (
            <View key={item} style={styles.includeRow}>
              <Ionicons name="checkmark-circle" size={20} color={colors.success} />
              <Text style={styles.includeText}>{item}</Text>
            </View>
          ))}
        </View>

        <Text style={shared.sectionTitle}>Your car</Text>
        <CarCard car={selectedCar} onPress={() => router.push('/add-car')} actionLabel="Add new" />
        {cars.length > 1 && (
          <ScrollView {...noBounce} horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 10 }}>
            {cars.map((c) => (
              <Pressable
                key={c.id}
                onPress={() => selectCar(c.id)}
                style={[styles.chip, selectedCar?.id === c.id && styles.chipActive]}
              >
                <Text style={[styles.chipText, selectedCar?.id === c.id && styles.chipTextActive]}>
                  {c.model}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        )}
        {selectedCar && (
          <Text style={styles.tierNote}>Priced for {TIER_LABEL[tier]} size</Text>
        )}

        <Text style={shared.sectionTitle}>Pick a date</Text>
        <ScrollView {...noBounce} horizontal showsHorizontalScrollIndicator={false}>
          {days.map((d) => {
            const active = d.iso === dateIso;
            return (
              <Pressable
                key={d.iso}
                onPress={() => {
                  setDateIso(d.iso);
                  setSlotHour(undefined);
                }}
                style={[styles.dateChip, active && styles.chipActive]}
              >
                <Text style={[styles.dateDay, active && styles.chipTextActive]}>{d.day}</Text>
                <Text style={[styles.dateNum, active && styles.chipTextActive]}>{d.date}</Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <Text style={shared.sectionTitle}>Pick a time</Text>
        <View style={styles.slotGrid}>
          {SLOT_HOURS.map((h) => {
            const disabled = isToday && h <= currentHour;
            const active = slotHour === h;
            return (
              <Pressable
                key={h}
                disabled={disabled}
                onPress={() => setSlotHour(h)}
                style={[styles.slot, active && styles.chipActive, disabled && styles.slotDisabled]}
              >
                <Text
                  style={[
                    styles.chipText,
                    active && styles.chipTextActive,
                    disabled && { color: colors.border },
                  ]}
                >
                  {slotLabel(h)}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={shared.sectionTitle}>Add-ons</Text>
        <View style={[shared.card, { paddingVertical: 4 }]}>
          {ADD_ONS.map((a, i) => {
            const on = addOnIds.includes(a.id);
            return (
              <Pressable
                key={a.id}
                onPress={() => toggleAddOn(a.id)}
                style={[styles.addOnRow, i < ADD_ONS.length - 1 && styles.divider]}
              >
                <Ionicons
                  name={on ? 'checkbox' : 'square-outline'}
                  size={22}
                  color={on ? colors.brand : colors.textMuted}
                />
                <Text style={styles.addOnName}>{a.name}</Text>
                <Text style={styles.addOnPrice}>+{formatPrice(a.price)}</Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={shared.sectionTitle}>Where should we come?</Text>
        <TextInput
          value={address}
          onChangeText={setAddress}
          placeholder="Flat / house no., building, area"
          placeholderTextColor={colors.textMuted}
          style={styles.addressInput}
          multiline
        />
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <View>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.total}>{formatPrice(total)}</Text>
        </View>
        <Pressable
          onPress={confirm}
          disabled={!canConfirm}
          style={[shared.primaryButton, styles.confirm, !canConfirm && { opacity: 0.4 }]}
        >
          <Text style={shared.primaryButtonText}>Confirm booking</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  hero: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    borderRadius: 24,
    padding: 20,
    marginBottom: 12,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  heroMeta: {
    fontSize: 15,
    color: '#FFFFFFCC',
    marginTop: 4,
  },
  includeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 5,
  },
  includeText: {
    fontSize: 15,
    color: colors.text,
  },
  tierNote: {
    marginTop: 8,
    fontSize: 13,
    color: colors.textMuted,
  },
  chip: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: colors.card,
    marginRight: 8,
  },
  chipActive: {
    backgroundColor: colors.brand,
  },
  chipText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  chipTextActive: {
    color: '#FFFFFF',
  },
  dateChip: {
    width: 64,
    paddingVertical: 12,
    borderRadius: 16,
    backgroundColor: colors.card,
    alignItems: 'center',
    marginRight: 8,
  },
  dateDay: {
    fontSize: 13,
    color: colors.textMuted,
    fontWeight: '600',
  },
  dateNum: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text,
    marginTop: 2,
  },
  slotGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  slot: {
    width: '31.5%',
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: colors.card,
    alignItems: 'center',
  },
  slotDisabled: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  addOnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
  },
  divider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  addOnName: {
    flex: 1,
    fontSize: 15,
    color: colors.text,
  },
  addOnPrice: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  addressInput: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    minHeight: 80,
    fontSize: 16,
    color: colors.text,
    textAlignVertical: 'top',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingHorizontal: 20,
    paddingTop: 14,
    backgroundColor: colors.card,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  totalLabel: {
    fontSize: 13,
    color: colors.textMuted,
  },
  total: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.text,
  },
  confirm: {
    flex: 1,
  },
});
