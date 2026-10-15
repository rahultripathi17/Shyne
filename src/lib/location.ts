import * as Location from 'expo-location';

import type { SavedLocation } from '../store/AppStore';

export type DetectResult = { ok: true; location: SavedLocation } | { ok: false; reason: 'denied' | 'unavailable' };

/** Asks for location permission, then turns the current position into a one-line address. */
export async function detectAddress(): Promise<DetectResult> {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') return { ok: false, reason: 'denied' };

    const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
    const [place] = await Location.reverseGeocodeAsync({
      latitude: pos.coords.latitude,
      longitude: pos.coords.longitude,
    });
    if (!place) return { ok: false, reason: 'unavailable' };

    const area = place.district || place.subregion || place.city || place.name || 'Current location';
    const parts = [place.name, place.street, place.district, place.city]
      .filter((p): p is string => !!p)
      .filter((p, i, all) => all.indexOf(p) === i);

    return {
      ok: true,
      location: { label: area, address: parts.join(', ') || area, detected: true },
    };
  } catch {
    return { ok: false, reason: 'unavailable' };
  }
}
