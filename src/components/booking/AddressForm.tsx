import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { afterSheetCloses, pickContact, pickError } from '../../lib/pickContact';
import type { AddressTag, SavedAddress } from '../../store/AppStore';
import { fonts } from '../theme';
import { YellowButton } from '../tracking/TrackingSheets';
import { T } from '../tracking/trackTheme';
import { FormSheet } from './FormSheet';
import { useNotice } from './useNotice';

// "Save address details" over the map, as in the live app: who it's for at the top (with the
// receiver's name and number when it's someone else), then the tag, flat, floor, area, landmark
// and how to reach. Who the partner calls is chosen at checkout, not here.

const TAGS: { tag: AddressTag; icon: 'home-outline' | 'briefcase-outline' | 'location-outline' }[] = [
  { tag: 'Home', icon: 'home-outline' },
  { tag: 'Work', icon: 'briefcase-outline' },
  { tag: 'Other', icon: 'location-outline' },
];

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
  const [notice, setNotice] = useNotice();
  const [picking, setPicking] = useState(false);
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
  const receiverMissing = v.someoneElse && (v.name.trim().length < 2 || v.phone.length !== 10);

  const fromContacts = async () => {
    // iOS can't show the system picker over our sheet: step the sheet aside, pick, bring it back.
    setPicking(true);
    await afterSheetCloses();
    const res = await pickContact();
    setPicking(false);
    if (res.ok) setV((s) => ({ ...s, name: res.contact.name, phone: res.contact.phone }));
    else if (pickError(res.reason)) setNotice(pickError(res.reason));
  };

  const save = () => {
    setTried(true);
    if (flatMissing || receiverMissing) {
      setNotice(flatMissing ? 'Add your flat, house number or building' : 'Add the receiver’s name and number');
      return;
    }
    onSave({
      // Someone else's address is saved under their name, not as Home / Work.
      tag: v.someoneElse ? 'Other' : v.tag,
      flat: v.flat.trim(),
      floor: v.floor.trim() || undefined,
      area,
      landmark: v.landmark.trim() || undefined,
      howToReach: v.howToReach.trim() || undefined,
      contact: v.someoneElse ? { name: v.name.trim(), phone: v.phone } : undefined,
    });
  };

  return (
    <FormSheet
      visible={visible && !picking}
      title="Save address details"
      onClose={onClose}
      notice={notice}
      footer={<YellowButton label="Save Address" onPress={save} />}
    >
      <Text style={styles.label}>Who are you booking for?</Text>
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
              <View style={[styles.dot, on && styles.dotOn]}>{on && <View style={styles.dotInner} />}</View>
              <Text style={styles.radioText}>{who}</Text>
            </Pressable>
          );
        })}
      </View>

      {v.someoneElse && (
        <View style={styles.receiver}>
          <TextInput
            value={v.name}
            onChangeText={set('name')}
            placeholder="Receiver name *"
            placeholderTextColor={T.faint}
            autoCapitalize="words"
            style={[styles.input, styles.receiverInput, tried && v.name.trim().length < 2 && styles.inputError]}
          />
          <View
            style={[
              styles.input,
              styles.receiverInput,
              styles.phoneRow,
              tried && v.phone.length !== 10 && styles.inputError,
            ]}
          >
            <TextInput
              value={v.phone}
              onChangeText={(t) => set('phone')(t.replace(/[^0-9]/g, '').slice(0, 10))}
              placeholder="Receiver number *"
              placeholderTextColor={T.faint}
              keyboardType="phone-pad"
              style={styles.phoneInput}
            />
            <Pressable
              onPress={() => void fromContacts()}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel="Choose from your contacts"
            >
              <MaterialIcons name="contacts" size={22} color={T.muted} />
            </Pressable>
          </View>
        </View>
      )}

      {!v.someoneElse && <Text style={styles.label}>Save address as *</Text>}
      <View style={[styles.tags, v.someoneElse && styles.hidden]}>
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
              <Ionicons name={icon} size={16} color={on ? '#1A5FD0' : T.ink} />
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
      <View style={[styles.input, styles.areaRow]}>
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

      <Text style={styles.label}>How to reach (optional)</Text>
      <View style={[styles.input, styles.reach]}>
        <TextInput
          value={v.howToReach}
          onChangeText={set('howToReach')}
          placeholder="e.g. Car is in basement B2, slot 45"
          placeholderTextColor={T.faint}
          style={styles.reachInput}
          multiline
        />
        <Pressable
          onPress={() => setNotice('Voice directions — coming soon')}
          hitSlop={6}
          accessibilityRole="button"
          accessibilityLabel="Record directions"
        >
          <Ionicons name="mic-outline" size={19} color={T.muted} />
        </Pressable>
      </View>
    </FormSheet>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  error,
}: {
  label: string;
  value: string;
  onChange: (t: string) => void;
  placeholder: string;
  error?: string;
}) {
  return (
    <View>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={T.faint}
        style={[styles.input, !!error && styles.inputError]}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    marginTop: 16,
    marginBottom: 8,
    fontFamily: fonts.medium,
    fontSize: 12.5,
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
  dot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#C9CBD2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotOn: {
    borderColor: T.text,
    borderWidth: 2,
  },
  dotInner: {
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
  receiver: {
    marginTop: 14,
    gap: 10,
  },
  receiverInput: {
    height: 52,
    borderRadius: 12,
  },
  hidden: {
    display: 'none',
  },
  tags: {
    flexDirection: 'row',
    gap: 10,
  },
  tag: {
    height: 38,
    paddingHorizontal: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E3E5E9',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tagOn: {
    borderColor: '#9DBBF5',
    backgroundColor: '#EEF4FF',
  },
  tagText: {
    fontFamily: fonts.medium,
    fontSize: 13.5,
    color: T.text,
  },
  input: {
    minHeight: 46,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E3E5E9',
    backgroundColor: '#FFFFFF',
    fontFamily: fonts.regular,
    fontSize: 14,
    color: T.text,
  },
  inputError: {
    borderColor: '#C22F2F',
  },
  error: {
    marginTop: 5,
    fontFamily: fonts.medium,
    fontSize: 11,
    color: '#C22F2F',
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  phoneInput: {
    flex: 1,
    height: 46,
    fontFamily: fonts.regular,
    fontSize: 14,
    color: T.text,
  },
  areaRow: {
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
    color: '#1A5FD0',
  },
  reach: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  reachInput: {
    flex: 1,
    paddingVertical: 12,
    fontFamily: fonts.regular,
    fontSize: 14,
    color: T.text,
  },
});
