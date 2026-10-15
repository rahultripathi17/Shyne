import { Contact, requestPermissionsAsync } from 'expo-contacts';
import { presentContactPickerAsync } from 'expo-contacts/legacy';
import { Platform } from 'react-native';

export type PickedContact = { name: string; phone: string };
export type PickResult =
  { ok: true; contact: PickedContact } | { ok: false; reason: 'cancelled' | 'denied' | 'no-phone' | 'unavailable' };

/** Last 10 digits of an Indian mobile number, whatever the format (+91, spaces, dashes). */
const tenDigits = (n: string) => n.replace(/\D/g, '').slice(-10);
const firstMobile = (numbers: (string | undefined)[]) =>
  numbers.map((n) => tenDigits(n ?? '')).find((n) => n.length === 10);

/**
 * Asks for contacts access, opens the phone's own contact picker and returns the chosen person's
 * name and mobile number. The picker is the system one, so we never read the whole address book.
 *
 * iOS can only show the picker when nothing else is presented, so callers close their sheet first
 * (see `useContactPicker`).
 */
export async function pickContact(): Promise<PickResult> {
  if (Platform.OS === 'web') return { ok: false, reason: 'unavailable' };
  try {
    const { status } = await requestPermissionsAsync();
    // iOS's picker works without full access (the person picks one contact); Android needs it.
    if (status !== 'granted' && Platform.OS === 'android') return { ok: false, reason: 'denied' };

    // The classic picker returns the name and numbers in one go.
    try {
      const picked = await presentContactPickerAsync();
      if (!picked) return { ok: false, reason: 'cancelled' };
      const phone = firstMobile((picked.phoneNumbers ?? []).map((p) => p.number ?? p.digits));
      if (!phone) return { ok: false, reason: 'no-phone' };
      const name = picked.name || [picked.firstName, picked.lastName].filter(Boolean).join(' ');
      return { ok: true, contact: { name: name.trim(), phone } };
    } catch {
      // Fall back to the newer class-based picker.
      const picked = await Contact.presentPicker();
      if (!picked) return { ok: false, reason: 'cancelled' };
      const [name, phones] = await Promise.all([picked.getFullName(), picked.getPhones()]);
      const phone = firstMobile(phones.map((p) => p.number));
      if (!phone) return { ok: false, reason: 'no-phone' };
      return { ok: true, contact: { name: name.trim(), phone } };
    }
  } catch {
    return { ok: false, reason: 'unavailable' };
  }
}

export const pickError = (reason: Exclude<PickResult, { ok: true }>['reason']) =>
  reason === 'denied'
    ? 'Allow contacts for Hoora in Settings'
    : reason === 'no-phone'
      ? 'That contact has no mobile number'
      : reason === 'unavailable'
        ? 'Couldn’t open contacts. Type the number instead'
        : '';

/** Wait for a sheet's slide-down to finish before presenting the system picker. */
export const afterSheetCloses = () => new Promise((r) => setTimeout(r, 450));
