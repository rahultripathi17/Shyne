import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import type { AddressTag, SavedAddress } from '../../store/AppStore';
import { Sheet } from '../rewards/ClaimForm';
import { fonts } from '../theme';
import { YellowButton } from '../tracking/TrackingSheets';
import { T } from '../tracking/trackTheme';

// "Save address details" sheet over the map (live app, Oct 2026): who it's for, the tag, flat,
// floor, area from the pin, landmark and how to reach.

const TAGS: { tag: AddressTag; icon: 'home-outline' | 'briefcase-outline' | 'person-outline' }[] = [
  { tag: 'Home', icon: 'home-outline' },
  { tag: 'Work', icon: 'briefcase-outline' },
  { tag: 'Other', icon: 'person-outline' },
];

const BLUE = '#1A5FD0';

type Draft = Omit<SavedAddress, 'id'>;

export function AddressForm({
  visible,
  area,
  initial,
  onChangeArea,
  onClose,
  onSave,
}: {
  visible: boolean;
  area: string;
  initial?: SavedAddress;
  onChangeArea: () => void;
  onClose: () => void;
  onSave: (address: Draft) => void;
}) {
  const [v, setV] = useState({
    tag: initial?.tag ?? ('Home' as AddressTag),
    flat: initial?.flat ?? '',
    floor: initial?.floor ?? '',
    landmark: initial?.landmark ?? '',
    howToReach: initial?.howToReach ?? '',
    someoneElse: !!initial?.contact,
    name: initial?.contact?.name ?? '',
    phone: initial?.contact?.phone ?? '',
  });
  const [tried, setTried] = useState(false);
  const set =
    <K extends keyof typeof v>(k: K) =>
    (val: (typeof v)[K]) =>
      setV((s) => ({ ...s, [k]: val }));

  const flatMissing = !v.flat.trim();
  const contactMissing = v.someoneElse && (!v.name.trim() || v.phone.replace(/\D/g, '').length !== 10);

  const save = () => {
    setTried(true);
    if (flatMissing || contactMissing) return;
    onSave({
      tag: v.tag,
      flat: v.flat.trim(),
      floor: v.floor.trim() || undefined,
      area,
      landmark: v.landmark.trim() || undefined,
      howToReach: v.howToReach.trim() || undefined,
      contact: v.someoneElse ? { name: v.name.trim(), phone: v.phone.replace(/\D/g, '') } : undefined,
    });
  };

  return (
    <Sheet visible={visible} onClose={onClose}>
      <Text style={styles.title}>Save address details</Text>

      <Text style={styles.label}>Who you are booking for?</Text>
      <View style={styles.radios}>
        {(['Myself', 'Someone else'] as const).map((who) => {
          const on = (who === 'Someone else') === v.someoneElse;
          return (
            <Pressable
              key={who}
              onPress={() => set('someoneElse')(who === 'Someone else')}
              accessibilityRole="radio"
              accessibilityState={{ selected: on }}
              style={styles.radio}
            >
              <View style={[styles.radioDot, on && styles.radioDotOn]}>{on && <View style={styles.radioInner} />}</View>
              <Text style={styles.radioText}>{who}</Text>
            </Pressable>
          );
        })}
      </View>
      {v.someoneElse && (
        <>
          <Field
            label="Receiver’s name *"
            value={v.name}
            onChange={set('name')}
            placeholder="Full name"
            error={tried && !v.name.trim() ? 'Name is required' : undefined}
          />
          <Field
            label="Receiver’s number *"
            value={v.phone}
            onChange={(t) => set('phone')(t.replace(/[^0-9]/g, '').slice(0, 10))}
            placeholder="10-digit mobile number"
            keyboardType="phone-pad"
            error={tried && v.phone.length !== 10 ? 'Enter a 10-digit number' : undefined}
          />
        </>
      )}

      <Text style={styles.label}>Save address as *</Text>
      <View style={styles.tags}>
        {TAGS.map(({ tag, icon }) => {
          const on = v.tag === tag;
          return (
            <Pressable
              key={tag}
              onPress={() => set('tag')(tag)}
              accessibilityRole="radio"
              accessibilityState={{ selected: on }}
              style={[styles.tag, on && styles.tagOn]}
            >
              <Ionicons name={icon} size={18} color={on ? BLUE : T.ink} />
              <Text style={styles.tagText}>{tag}</Text>
            </Pressable>
          );
        })}
      </View>

      <Field
        label="Flat / House no / Building name *"
        value={v.flat}
        onChange={set('flat')}
        placeholder="Flat / House no / Building name"
        error={tried && flatMissing ? 'Flat / House no is required' : undefined}
      />
      <Field label="Floor (optional)" value={v.floor} onChange={set('floor')} placeholder="Floor" />

      <Text style={styles.label}>Area / Sector / Locality *</Text>
      <View style={[styles.input, styles.areaBox]}>
        <Text style={styles.areaText} numberOfLines={1}>
          {area}
        </Text>
        <Pressable onPress={onChangeArea} hitSlop={8} accessibilityRole="button">
          <Text style={styles.change}>Change</Text>
        </Pressable>
      </View>

      <Field
        label="Nearby landmark (optional)"
        value={v.landmark}
        onChange={set('landmark')}
        placeholder="Nearby landmark"
      />

      <Text style={styles.label}>How to Reach (Instructions) (Optional)</Text>
      <View style={[styles.input, styles.reach]}>
        <TextInput
          value={v.howToReach}
          onChangeText={set('howToReach')}
          placeholder="Add How to Reach (Instructions)"
          placeholderTextColor={T.faint}
          style={styles.reachInput}
          multiline
        />
        <Ionicons name="camera-outline" size={20} color={T.gold} />
        <View style={styles.mic}>
          <Ionicons name="mic-outline" size={18} color={T.gold} />
        </View>
      </View>

      <View style={styles.footer}>
        <YellowButton label="Save Address" onPress={save} />
      </View>
    </Sheet>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  error,
  keyboardType,
}: {
  label: string;
  value: string;
  onChange: (t: string) => void;
  placeholder: string;
  error?: string;
  keyboardType?: 'phone-pad';
}) {
  return (
    <View>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={T.faint}
        keyboardType={keyboardType}
        style={[styles.input, !!error && styles.inputError]}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  title: {
    fontFamily: fonts.bold,
    fontSize: 18,
    color: T.text,
  },
  label: {
    marginTop: 16,
    marginBottom: 8,
    fontFamily: fonts.medium,
    fontSize: 13,
    color: '#4B5563',
  },
  radios: {
    flexDirection: 'row',
    gap: 22,
  },
  radio: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minHeight: 32,
  },
  radioDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#C9CBD2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioDotOn: {
    borderColor: T.text,
    borderWidth: 2,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: T.text,
  },
  radioText: {
    fontFamily: fonts.medium,
    fontSize: 14,
    color: T.text,
  },
  tags: {
    flexDirection: 'row',
    gap: 10,
  },
  tag: {
    height: 40,
    paddingHorizontal: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E3E5E9',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tagOn: {
    borderColor: '#9DBBF5',
    backgroundColor: '#EEF4FF',
  },
  tagText: {
    fontFamily: fonts.medium,
    fontSize: 14,
    color: T.text,
  },
  input: {
    minHeight: 48,
    paddingHorizontal: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E3E5E9',
    fontFamily: fonts.regular,
    fontSize: 14,
    color: T.text,
  },
  inputError: {
    borderColor: '#C22F2F',
  },
  error: {
    marginTop: 6,
    fontFamily: fonts.medium,
    fontSize: 11,
    color: '#C22F2F',
  },
  areaBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  areaText: {
    flex: 1,
    fontFamily: fonts.medium,
    fontSize: 14,
    color: T.text,
  },
  change: {
    fontFamily: fonts.semiBold,
    fontSize: 13,
    color: BLUE,
  },
  reach: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingRight: 6,
  },
  reachInput: {
    flex: 1,
    paddingVertical: 12,
    fontFamily: fonts.regular,
    fontSize: 14,
    color: T.text,
  },
  mic: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFF6D6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  footer: {
    marginTop: 22,
    marginBottom: 4,
  },
});
