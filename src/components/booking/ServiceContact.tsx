import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { afterSheetCloses, pickContact, pickError } from '../../lib/pickContact';
import { type ContactLabel, useAppStore } from '../../store/AppStore';
import { fonts } from '../theme';
import { YellowButton } from '../tracking/TrackingSheets';
import { T } from '../tracking/trackTheme';
import { FormSheet } from './FormSheet';
import { useNotice } from './useNotice';

// Who our partner contacts for this service — one choice, like a ride app's "switch rider":
// you, the person the address is for, or someone you add (driver, security, family…).

export type ServiceContact = { id: string; name: string; phone: string; tag?: string };

const LABELS: ContactLabel[] = ['Driver', 'Security guard', 'Family', 'Friend', 'Other'];
/** Older saves said 'Security'. */
const labelText = (l?: ContactLabel) => (l === 'Security' ? 'Security guard' : l);
const initials = (name: string) =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('') || '?';

/**
 * Who can be the contact when you book for yourself: you, then the people you've added (driver,
 * security, family, friend). Booking for someone else has one contact only: that person (see
 * `receiverContact`).
 */
export function useContactOptions(): ServiceContact[] {
  const { name, phone, contacts = [] } = useAppStore();
  const me = { id: 'me', name: name ?? 'You', phone: (phone ?? '').replace(/\D/g, '').slice(-10), tag: 'You' };
  const list: ServiceContact[] = [me];
  for (const c of contacts) {
    if (c.phone !== me.phone) list.push({ id: c.id, name: c.name, phone: c.phone, tag: labelText(c.label) });
  }
  return list;
}

/** The receiver of an address saved for someone else: the booking's only contact. */
export const receiverContact = (r: { name: string; phone: string }): ServiceContact => ({
  id: 'receiver',
  name: r.name,
  phone: r.phone,
});

/** The one line that tells people who'll be called. */
export const contactNote = (c: ServiceContact) =>
  c.id === 'me'
    ? 'Our partner will call you on arrival.'
    : c.id === 'receiver'
      ? `Booking for ${c.name.split(' ')[0]}. Our partner will call ${c.name.split(' ')[0]} on arrival.`
      : `Our partner will call ${c.name.split(' ')[0]} on arrival.`;

/** Roles worth a tag. The address's receiver needs none — the card already says who they are. */
const showTag = (c: ServiceContact) => c.id !== 'me' && c.id !== 'receiver' && !!c.tag;

/** Checkout card: the one person our partner contacts, with Change. */
export function ContactCard({ contact, onChange }: { contact: ServiceContact; onChange?: () => void }) {
  const me = contact.id === 'me';
  const locked = !onChange;
  return (
    <Pressable
      onPress={onChange}
      disabled={locked}
      accessibilityRole={locked ? 'text' : 'button'}
      accessibilityLabel={`Contact person ${me ? 'you' : contact.name}${locked ? '' : '. Change'}`}
      style={({ pressed }) => [styles.card, pressed && !locked && { opacity: 0.85 }]}
    >
      <View style={styles.cardTop}>
        <View style={[styles.avatar, me && styles.avatarMe]}>
          {me ? (
            <Ionicons name="person" size={16} color={T.text} />
          ) : (
            <Text style={styles.avatarText}>{initials(contact.name)}</Text>
          )}
        </View>
        <View style={styles.flex}>
          <View style={styles.nameRow}>
            <Text style={styles.name} numberOfLines={1}>
              {me ? `${contact.name} (You)` : contact.name}
            </Text>
            {showTag(contact) ? (
              <View style={styles.tag}>
                <Text style={styles.tagText}>{contact.tag}</Text>
              </View>
            ) : null}
          </View>
          <Text style={styles.phone}>+91 {contact.phone}</Text>
        </View>
        {locked ? (
          <Ionicons name="lock-closed-outline" size={16} color={T.muted} />
        ) : (
          <Text style={styles.change}>Change</Text>
        )}
      </View>
      <View style={styles.cardNote}>
        <Ionicons name="call-outline" size={13} color={T.muted} />
        <Text style={styles.cardNoteText}>{contactNote(contact)}</Text>
      </View>
    </Pressable>
  );
}

/** "Who should we contact?" — pick one, or add a new contact. */
export function ContactSheet({
  visible,
  options,
  selected,
  onClose,
  onSelect,
}: {
  visible: boolean;
  options: ServiceContact[];
  selected: string;
  onClose: () => void;
  onSelect: (id: string) => void;
}) {
  const { saveContact, removeContact } = useAppStore();
  const [notice, setNotice] = useNotice();
  const [picking, setPicking] = useState(false);
  const [pick, setPick] = useState(selected);
  const [adding, setAdding] = useState(false);
  // Edit mode (iOS-style): the list stays clean; "Edit" reveals Remove on the contacts you added.
  const [editing, setEditing] = useState(false);
  const hasAdded = options.some((o) => o.id !== 'me');
  const [draft, setDraft] = useState({ name: '', phone: '', label: 'Driver' as ContactLabel });
  const [openedWith, setOpenedWith] = useState(visible);
  if (visible !== openedWith) {
    setOpenedWith(visible);
    if (visible) {
      setPick(selected);
      setAdding(false);
      setEditing(false);
    }
  }

  const fromPhone = async () => {
    // iOS can't show the system picker over our sheet: step the sheet aside, pick, bring it back.
    setPicking(true);
    await afterSheetCloses();
    const res = await pickContact();
    setPicking(false);
    if (res.ok) setDraft((d) => ({ ...d, name: res.contact.name, phone: res.contact.phone }));
    else if (pickError(res.reason)) setNotice(pickError(res.reason));
  };

  const add = () => {
    if (draft.name.trim().length < 2 || draft.phone.length !== 10) {
      setNotice('Add a name and 10-digit mobile number');
      return;
    }
    const id = saveContact({ name: draft.name.trim(), phone: draft.phone, label: draft.label });
    setPick(id);
    setAdding(false);
    setDraft({ name: '', phone: '', label: 'Driver' });
  };

  return (
    <FormSheet
      visible={visible && !picking}
      title={adding ? 'Add contact' : 'Who should we contact?'}
      subtitle={
        adding
          ? 'Someone who’ll be with the vehicle, like your driver.'
          : 'Our partner will call this person on arrival and for any updates.'
      }
      onClose={adding ? () => setAdding(false) : onClose}
      notice={notice}
      footer={
        adding ? (
          <YellowButton label="Add contact" onPress={add} />
        ) : (
          <YellowButton
            label={editing ? 'Done editing' : 'Done'}
            onPress={() => (editing ? setEditing(false) : onSelect(pick))}
          />
        )
      }
    >
      {!adding ? (
        <View style={styles.list}>
          {hasAdded && (
            <View style={styles.listHead}>
              <Text style={styles.listHeadText}>Your contacts</Text>
              <Pressable onPress={() => setEditing((e) => !e)} hitSlop={10} accessibilityRole="button">
                <Text style={styles.editLink}>{editing ? 'Done' : 'Edit'}</Text>
              </Pressable>
            </View>
          )}
          {options.map((o, i) => {
            const on = pick === o.id;
            const me = o.id === 'me';
            return (
              <View key={o.id} style={[styles.row, i > 0 && styles.rowLine]}>
                <Pressable
                  onPress={() => setPick(o.id)}
                  disabled={editing}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: on }}
                  style={styles.rowMain}
                >
                  <View style={[styles.avatar, me && styles.avatarMe]}>
                    {me ? (
                      <Ionicons name="person" size={16} color={T.text} />
                    ) : (
                      <Text style={styles.avatarText}>{initials(o.name)}</Text>
                    )}
                  </View>
                  <View style={styles.flex}>
                    <View style={styles.nameRow}>
                      <Text style={styles.name} numberOfLines={1}>
                        {me ? 'Me' : o.name}
                      </Text>
                      {!me && o.tag ? (
                        <View style={styles.tag}>
                          <Text style={styles.tagText}>{o.tag}</Text>
                        </View>
                      ) : null}
                    </View>
                    <Text style={styles.phone}>+91 {o.phone}</Text>
                  </View>
                </Pressable>
                {editing && !me ? (
                  <Pressable
                    onPress={() => {
                      removeContact(o.id);
                      if (pick === o.id) setPick('me');
                      if (options.filter((x) => x.id !== 'me').length <= 1) setEditing(false);
                      setNotice(`${o.name.split(' ')[0]} removed`);
                    }}
                    hitSlop={6}
                    accessibilityRole="button"
                    accessibilityLabel={`Remove ${o.name}`}
                    style={({ pressed }) => [styles.remove, pressed && styles.removePressed]}
                  >
                    <Text style={styles.removeText}>Remove</Text>
                  </Pressable>
                ) : (
                  <Pressable
                    onPress={() => setPick(o.id)}
                    disabled={editing}
                    hitSlop={8}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: on }}
                    accessibilityLabel={me ? 'Me' : o.name}
                    style={editing && styles.dim}
                  >
                    <View style={[styles.radio, on && styles.radioOn]}>{on && <View style={styles.radioInner} />}</View>
                  </Pressable>
                )}
              </View>
            );
          })}
          {!editing && (
            <Pressable onPress={() => setAdding(true)} accessibilityRole="button" style={[styles.row, styles.rowLine]}>
              <View style={styles.addIcon}>
                <Ionicons name="person-add-outline" size={17} color={T.text} />
              </View>
              <View style={styles.flex}>
                <Text style={styles.name}>Add new contact</Text>
                <Text style={styles.phone}>Your driver, security guard or a family member</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={T.muted} />
            </Pressable>
          )}
        </View>
      ) : (
        <View style={styles.add}>
          <TextInput
            value={draft.name}
            onChangeText={(t) => setDraft((d) => ({ ...d, name: t }))}
            placeholder="Name *"
            placeholderTextColor={T.faint}
            autoCapitalize="words"
            style={styles.input}
          />
          <View style={[styles.input, styles.phoneRow]}>
            <TextInput
              value={draft.phone}
              onChangeText={(t) => setDraft((d) => ({ ...d, phone: t.replace(/[^0-9]/g, '').slice(0, 10) }))}
              placeholder="Mobile number *"
              placeholderTextColor={T.faint}
              keyboardType="phone-pad"
              style={styles.phoneInput}
            />
            <Pressable
              onPress={() => void fromPhone()}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel="Choose from your contacts"
            >
              <MaterialIcons name="contacts" size={22} color={T.muted} />
            </Pressable>
          </View>
          <Text style={styles.labelHead}>This person is your</Text>
          <View style={styles.labels}>
            {LABELS.map((l) => {
              const on = draft.label === l;
              return (
                <Pressable
                  key={l}
                  onPress={() => setDraft((d) => ({ ...d, label: l }))}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: on }}
                  style={[styles.label, on && styles.labelOn]}
                >
                  <Text style={[styles.labelText, on && styles.labelTextOn]}>{l}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      )}
    </FormSheet>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  card: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E3E5E9',
    backgroundColor: '#FFFFFF',
  },
  cardTop: {
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cardNote: {
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#ECEDF0',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cardNoteText: {
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: 12,
    color: T.muted,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#1A5FD0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarMe: {
    backgroundColor: '#FFF1B8',
  },
  avatarText: {
    fontFamily: fonts.semiBold,
    fontSize: 13.5,
    color: '#FFFFFF',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  name: {
    flexShrink: 1,
    fontFamily: fonts.semiBold,
    fontSize: 14.5,
    color: T.text,
  },
  tag: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
    backgroundColor: '#F2F3F5',
  },
  tagText: {
    fontFamily: fonts.medium,
    fontSize: 10.5,
    color: T.ink,
  },
  phone: {
    marginTop: 1,
    fontFamily: fonts.regular,
    fontSize: 12,
    color: T.muted,
  },
  change: {
    fontFamily: fonts.semiBold,
    fontSize: 13,
    color: '#1A5FD0',
  },
  list: {
    marginTop: 4,
  },
  row: {
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  rowMain: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  listHead: {
    paddingTop: 6,
    paddingBottom: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  listHeadText: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: T.muted,
  },
  editLink: {
    fontFamily: fonts.semiBold,
    fontSize: 13,
    color: '#1A5FD0',
  },
  remove: {
    height: 30,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#F3C9C9',
    justifyContent: 'center',
  },
  removePressed: {
    backgroundColor: '#FDF2F2',
  },
  removeText: {
    fontFamily: fonts.semiBold,
    fontSize: 12.5,
    color: '#C22F2F',
  },
  dim: {
    opacity: 0.35,
  },
  rowLine: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E6E7EB',
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#C9CBD2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOn: {
    borderColor: T.text,
    borderWidth: 2,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: T.text,
  },
  addIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: '#E3E5E9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  add: {
    marginTop: 14,
    gap: 10,
  },
  input: {
    height: 52,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E3E5E9',
    fontFamily: fonts.regular,
    fontSize: 14,
    color: T.text,
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
  labelHead: {
    marginTop: 4,
    fontFamily: fonts.medium,
    fontSize: 12.5,
    color: '#4B5563',
  },
  labels: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  label: {
    height: 34,
    paddingHorizontal: 14,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: '#E3E5E9',
    justifyContent: 'center',
  },
  labelOn: {
    borderColor: T.text,
    backgroundColor: T.text,
  },
  labelText: {
    fontFamily: fonts.medium,
    fontSize: 12.5,
    color: T.ink,
  },
  labelTextOn: {
    color: '#FFFFFF',
  },
});
