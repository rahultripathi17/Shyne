import Ionicons from '@expo/vector-icons/Ionicons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import { Image, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { ADD_ONS, TRACK, WRONG_TAGS } from '../../data/serviceTracking';
import { Sheet } from '../rewards/ClaimForm';
import { fonts } from '../theme';
import { T } from './trackTheme';

// Bottom sheets of the tracking page (Figma 14519:1590): add-ons, tax breakdown, service
// instructions, rating, and reschedule / cancel.

const rupees = (n: number) => `₹${n.toLocaleString('en-IN')}`;

export function YellowButton({ label, onPress, disabled }: { label: string; onPress: () => void; disabled?: boolean }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      style={({ pressed }) => [pressed && { opacity: 0.85 }, disabled && { opacity: 0.45 }]}
    >
      <LinearGradient colors={T.yellow} start={{ x: 0.6, y: 0 }} end={{ x: 0.4, y: 1 }} style={styles.yellow}>
        <Text style={styles.yellowText}>{label}</Text>
      </LinearGradient>
    </Pressable>
  );
}

/** Add more services before the wash starts. */
export function AddOnsSheet({
  visible,
  added,
  onClose,
  onPay,
}: {
  visible: boolean;
  added: string[];
  onClose: () => void;
  onPay: (ids: string[]) => void;
}) {
  const [picked, setPicked] = useState<string[]>(added);
  const [openedWith, setOpenedWith] = useState(visible);
  if (visible !== openedWith) {
    setOpenedWith(visible);
    if (visible) setPicked(added);
  }
  const fresh = picked.filter((id) => !added.includes(id));
  const sub = ADD_ONS.filter((a) => fresh.includes(a.id)).reduce((s, a) => s + a.price, 0);
  const total = Math.round(sub * (1 + TRACK.gst));
  const toggle = (id: string) => {
    if (added.includes(id)) return;
    void Haptics.selectionAsync();
    setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
  };

  return (
    <Sheet visible={visible} onClose={onClose}>
      <Text style={styles.title}>Add ons</Text>
      <Text style={styles.sub}>Added to this booking and done in the same visit.</Text>
      <View style={styles.list}>
        {ADD_ONS.map((a, i) => {
          const on = picked.includes(a.id);
          return (
            <View key={a.id} style={[styles.addRow, i > 0 && styles.line]}>
              <Image source={a.image} style={styles.addThumb} />
              <View style={styles.flex}>
                <Text style={styles.addName}>{a.name}</Text>
                <Text style={styles.addMeta}>
                  {rupees(a.price)} · {a.mins} mins
                </Text>
              </View>
              <Pressable
                onPress={() => toggle(a.id)}
                accessibilityRole="button"
                accessibilityLabel={on ? `Remove ${a.name}` : `Add ${a.name}`}
                style={[styles.addBtn, on && styles.addBtnOn]}
              >
                <Text style={[styles.addBtnText, on && styles.addBtnTextOn]}>{on ? 'Added' : 'ADD'}</Text>
              </Pressable>
            </View>
          );
        })}
      </View>
      <View style={styles.payBar}>
        <View style={styles.flex}>
          <Text style={styles.payTotal}>
            {rupees(total)} <Text style={styles.payNote}>(incl. tax)</Text>
          </Text>
          <Text style={styles.payCount}>
            {fresh.length ? `${fresh.length} new add-on${fresh.length === 1 ? '' : 's'}` : 'Pick an add-on'}
          </Text>
        </View>
        <Pressable
          onPress={() => onPay(fresh)}
          disabled={!fresh.length}
          accessibilityRole="button"
          style={({ pressed }) => [styles.payBtn, !fresh.length && { opacity: 0.4 }, pressed && { opacity: 0.85 }]}
        >
          <Text style={styles.payBtnText}>Pay Now</Text>
        </Pressable>
      </View>
    </Sheet>
  );
}

/** What the total is made of. */
export function BillSheet({
  visible,
  service,
  serviceMrp,
  servicePrice,
  addOns,
  onClose,
}: {
  visible: boolean;
  service: string;
  serviceMrp: number;
  servicePrice: number;
  addOns: { name: string; price: number }[];
  onClose: () => void;
}) {
  const addOnsTotal = addOns.reduce((s, a) => s + a.price, 0);
  const base = servicePrice + addOnsTotal;
  const gst = Math.round(base * TRACK.gst);
  return (
    <Sheet visible={visible} onClose={onClose}>
      <Text style={styles.title}>Tax Breakdown</Text>
      <View style={styles.bill}>
        <BillRow label={service} value={rupees(serviceMrp)} />
        <BillRow label="Discount" value={`−${rupees(serviceMrp - servicePrice)}`} green />
        {addOns.map((a) => (
          <BillRow key={a.name} label={a.name} value={rupees(a.price)} />
        ))}
        <BillRow label="Government Taxes (GST)" value={rupees(gst)} />
        <View style={styles.billLine} />
        <BillRow label="Total Amount" value={rupees(base + gst)} bold />
      </View>
      <Pressable
        onPress={onClose}
        accessibilityRole="button"
        style={({ pressed }) => [styles.blackBtn, pressed && { opacity: 0.85 }]}
      >
        <Text style={styles.blackBtnText}>OKAY</Text>
      </Pressable>
    </Sheet>
  );
}

function BillRow({ label, value, bold, green }: { label: string; value: string; bold?: boolean; green?: boolean }) {
  return (
    <View style={styles.billRow}>
      <Text style={[styles.billLabel, bold && styles.billBold]} numberOfLines={1}>
        {label}
      </Text>
      <Text style={[styles.billValue, bold && styles.billBold, green && { color: T.green }]}>{value}</Text>
    </View>
  );
}

/** Where things are, so the partner doesn't have to call. */
export function InstructionsSheet({
  visible,
  onClose,
  onSubmit,
}: {
  visible: boolean;
  onClose: () => void;
  onSubmit: (notes: Record<string, string>) => void;
}) {
  const [v, setV] = useState({ parked: '', water: '', keys: '', notes: '' });
  const [recording, setRecording] = useState(false);
  const set = (k: keyof typeof v) => (text: string) => setV((s) => ({ ...s, [k]: text }));
  return (
    <Sheet visible={visible} onClose={onClose}>
      <Text style={styles.title}>Service Instructions</Text>
      <View style={styles.addressBox}>
        <Text style={styles.addressText}>{TRACK.addressShort}</Text>
      </View>
      <Field
        label="Where is your vehicle parked?"
        placeholder="E.g. Building A, Level 2, Slot 45"
        value={v.parked}
        onChange={set('parked')}
      />
      <Field
        label="Where can we find the water source?"
        placeholder="E.g. Near security cabin, garden tap"
        value={v.water}
        onChange={set('water')}
      />
      <Field
        label="Where are the vehicle keys?"
        placeholder="E.g. With security guard, under mat"
        value={v.keys}
        onChange={set('keys')}
      />
      <Pressable
        onPressIn={() => setRecording(true)}
        onPressOut={() => setRecording(false)}
        accessibilityRole="button"
        accessibilityLabel="Tap and hold to record a voice note"
        style={[styles.record, recording && styles.recordOn]}
      >
        <Text style={styles.recordText}>{recording ? 'Recording… release to save' : 'Tap and hold to record'}</Text>
        <View style={styles.mic}>
          <Ionicons name="mic" size={14} color={T.ink} />
        </View>
      </Pressable>
      <Text style={styles.fieldLabel}>Add Instructions</Text>
      <TextInput
        value={v.notes}
        onChangeText={set('notes')}
        placeholder="Add here…"
        placeholderTextColor={T.faint}
        multiline
        textAlignVertical="top"
        style={[styles.input, styles.inputMulti]}
      />
      <View style={styles.upload}>
        <Ionicons name="cloud-upload" size={20} color={T.gold} />
        <Text style={styles.uploadText}>Add a photo. It helps our partner find your exact spot faster.</Text>
      </View>
      <View style={styles.gapTop}>
        <YellowButton label="Submit" onPress={() => onSubmit(v)} />
      </View>
    </Sheet>
  );
}

function Field({
  label,
  placeholder,
  value,
  onChange,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (t: string) => void;
}) {
  return (
    <View>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={T.faint}
        style={styles.input}
      />
    </View>
  );
}

/** Stars, what went wrong (for 1–3 stars) and a review. */
export function RateSheet({
  visible,
  initial,
  title,
  onClose,
  onSubmit,
}: {
  visible: boolean;
  initial: number;
  title: string;
  onClose: () => void;
  onSubmit: (stars: number) => void;
}) {
  const [stars, setStars] = useState(initial);
  const [tags, setTags] = useState<string[]>([]);
  const [review, setReview] = useState('');
  const [openedWith, setOpenedWith] = useState(visible);
  if (visible !== openedWith) {
    setOpenedWith(visible);
    if (visible) setStars(initial);
  }
  return (
    <Sheet visible={visible} onClose={onClose}>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.stars}>
        {[1, 2, 3, 4, 5].map((n) => (
          <Pressable
            key={n}
            onPress={() => setStars(n)}
            hitSlop={6}
            accessibilityRole="button"
            accessibilityLabel={`${n} stars`}
          >
            <Ionicons name={n <= stars ? 'star' : 'star-outline'} size={30} color={n <= stars ? T.star : '#C9CACF'} />
          </Pressable>
        ))}
      </View>
      {stars > 0 && stars <= 3 && (
        <>
          <Text style={styles.fieldLabel}>What went wrong?</Text>
          <View style={styles.tags}>
            {WRONG_TAGS.map((t) => {
              const on = tags.includes(t);
              return (
                <Pressable
                  key={t}
                  onPress={() => setTags((s) => (on ? s.filter((x) => x !== t) : [...s, t]))}
                  style={[styles.tag, on && styles.tagOn]}
                >
                  <Text style={[styles.tagText, on && styles.tagTextOn]}>{t}</Text>
                </Pressable>
              );
            })}
          </View>
        </>
      )}
      <Text style={styles.fieldLabel}>Add detailed review</Text>
      <TextInput
        value={review}
        onChangeText={setReview}
        placeholder="Type your detailed review here"
        placeholderTextColor={T.faint}
        multiline
        textAlignVertical="top"
        maxLength={1500}
        style={[styles.input, styles.inputMulti]}
      />
      <View style={styles.gapTop}>
        <YellowButton label="Continue" onPress={() => onSubmit(stars)} disabled={stars === 0} />
      </View>
    </Sheet>
  );
}

/** Reschedule or cancel; cancelling asks once more. */
export function ManageSheet({
  visible,
  onClose,
  onReschedule,
  onCancel,
}: {
  visible: boolean;
  onClose: () => void;
  onReschedule: () => void;
  onCancel: () => void;
}) {
  const [confirming, setConfirming] = useState(false);
  const [openedWith, setOpenedWith] = useState(visible);
  if (visible !== openedWith) {
    setOpenedWith(visible);
    if (visible) setConfirming(false);
  }
  return (
    <Sheet visible={visible} onClose={onClose}>
      {confirming ? (
        <>
          <Text style={styles.title}>Cancel this booking?</Text>
          <Text style={styles.sub}>
            No fee up to 6 hours before your slot. The refund goes back to your payment method in 3–5 days.
          </Text>
          <Pressable
            onPress={onCancel}
            accessibilityRole="button"
            style={({ pressed }) => [styles.dangerBtn, pressed && { opacity: 0.85 }]}
          >
            <Text style={styles.dangerText}>Yes, cancel booking</Text>
          </Pressable>
          <Pressable onPress={() => setConfirming(false)} accessibilityRole="button" style={styles.keepBtn}>
            <Text style={styles.keepText}>Keep my booking</Text>
          </Pressable>
        </>
      ) : (
        <>
          <Text style={styles.title}>Manage booking</Text>
          <Pressable onPress={onReschedule} accessibilityRole="button" style={styles.manageRow}>
            <Ionicons name="calendar-outline" size={20} color={T.ink} />
            <Text style={styles.manageText}>Reschedule booking</Text>
            <Ionicons name="chevron-forward" size={18} color={T.faint} />
          </Pressable>
          <Pressable
            onPress={() => setConfirming(true)}
            accessibilityRole="button"
            style={[styles.manageRow, styles.line]}
          >
            <Ionicons name="close-circle-outline" size={20} color={T.red} />
            <Text style={[styles.manageText, { color: T.red }]}>Cancel booking</Text>
            <Ionicons name="chevron-forward" size={18} color={T.faint} />
          </Pressable>
        </>
      )}
    </Sheet>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: 18,
    color: T.ink,
  },
  sub: {
    marginTop: 4,
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 19,
    color: T.muted,
  },
  line: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: T.border,
  },
  list: {
    marginTop: 14,
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: T.border,
    paddingHorizontal: 12,
  },
  addRow: {
    minHeight: 66,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  addThumb: {
    width: 44,
    height: 46,
    borderRadius: 8,
  },
  addName: {
    fontFamily: fonts.semiBold,
    fontSize: 14,
    color: T.ink,
  },
  addMeta: {
    marginTop: 2,
    fontFamily: fonts.regular,
    fontSize: 12,
    color: T.muted,
  },
  addBtn: {
    minWidth: 70,
    height: 30,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: T.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtnOn: {
    borderColor: T.yellowSolid,
    backgroundColor: T.yellowSolid,
  },
  addBtnText: {
    fontFamily: fonts.semiBold,
    fontSize: 12,
    color: T.ink,
  },
  addBtnTextOn: {
    color: T.ink,
  },
  payBar: {
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  payTotal: {
    fontFamily: fonts.bold,
    fontSize: 16,
    color: T.ink,
  },
  payNote: {
    fontFamily: fonts.regular,
    fontSize: 11,
    color: T.muted,
  },
  payCount: {
    marginTop: 2,
    fontFamily: fonts.medium,
    fontSize: 12,
    color: T.muted,
  },
  payBtn: {
    height: 46,
    paddingHorizontal: 28,
    borderRadius: 8,
    backgroundColor: T.ink,
    justifyContent: 'center',
  },
  payBtnText: {
    fontFamily: fonts.semiBold,
    fontSize: 14,
    color: '#FFFFFF',
  },
  bill: {
    marginTop: 14,
    gap: 12,
  },
  billRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  billLabel: {
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: 13,
    color: T.muted,
  },
  billValue: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: T.ink,
  },
  billBold: {
    fontFamily: fonts.bold,
    fontSize: 15,
    color: T.ink,
  },
  billLine: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: T.border,
  },
  blackBtn: {
    marginTop: 20,
    height: 48,
    borderRadius: 8,
    backgroundColor: T.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  blackBtnText: {
    fontFamily: fonts.semiBold,
    fontSize: 14,
    letterSpacing: 0.5,
    color: '#FFFFFF',
  },
  addressBox: {
    marginTop: 14,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#FDF8E8',
  },
  addressText: {
    fontFamily: fonts.medium,
    fontSize: 13,
    lineHeight: 19,
    color: T.ink,
  },
  fieldLabel: {
    marginTop: 16,
    marginBottom: 8,
    fontFamily: fonts.medium,
    fontSize: 13,
    color: T.ink,
  },
  input: {
    height: 46,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 0.5,
    borderColor: T.border,
    fontFamily: fonts.medium,
    fontSize: 13,
    color: T.ink,
  },
  inputMulti: {
    height: 84,
    paddingTop: 12,
  },
  record: {
    marginTop: 16,
    height: 46,
    paddingLeft: 12,
    paddingRight: 8,
    borderRadius: 8,
    borderWidth: 0.5,
    borderColor: T.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  recordOn: {
    borderColor: T.gold,
    backgroundColor: '#FFFBE6',
  },
  recordText: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: T.ink,
  },
  mic: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: T.yellowSolid,
    alignItems: 'center',
    justifyContent: 'center',
  },
  upload: {
    marginTop: 14,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 8,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: T.border,
    alignItems: 'center',
    gap: 6,
  },
  uploadText: {
    textAlign: 'center',
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 17,
    color: T.muted,
  },
  gapTop: {
    marginTop: 18,
    marginBottom: 6,
  },
  yellow: {
    height: 50,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  yellowText: {
    fontFamily: fonts.semiBold,
    fontSize: 15,
    color: T.ink,
  },
  stars: {
    marginTop: 12,
    flexDirection: 'row',
    gap: 10,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    paddingHorizontal: 12,
    height: 32,
    borderRadius: 8,
    borderWidth: 0.5,
    borderColor: T.border,
    justifyContent: 'center',
  },
  tagOn: {
    backgroundColor: T.ink,
    borderColor: T.ink,
  },
  tagText: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: T.muted,
  },
  tagTextOn: {
    color: '#FFFFFF',
  },
  dangerBtn: {
    marginTop: 20,
    height: 48,
    borderRadius: 8,
    backgroundColor: T.red,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dangerText: {
    fontFamily: fonts.semiBold,
    fontSize: 14,
    color: '#FFFFFF',
  },
  keepBtn: {
    alignSelf: 'center',
    paddingVertical: 14,
  },
  keepText: {
    fontFamily: fonts.semiBold,
    fontSize: 14,
    color: T.ink,
  },
  manageRow: {
    marginTop: 8,
    minHeight: 54,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  manageText: {
    flex: 1,
    fontFamily: fonts.medium,
    fontSize: 14,
    color: T.ink,
  },
});
