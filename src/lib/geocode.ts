import * as Location from 'expo-location';
import { Platform } from 'react-native';

// Address lookup for the map, on open data: OpenStreetMap's Nominatim for search and as a fallback
// for reverse lookup (the phone's own geocoder is tried first on iOS/Android).
// Nominatim's public server is fine for a prototype (max ~1 request/second, attribution required);
// move to a hosted geocoder before launch.

export type LatLng = { lat: number; lng: number };
export type Place = LatLng & { title: string; line: string };

/** Nagpur, Hoora's home city: where the map opens before we know better. */
export const DEFAULT_CENTER: LatLng = { lat: 21.1458, lng: 79.0882 };

const NOMINATIM = 'https://nominatim.openstreetmap.org';
const HEADERS = { 'Accept-Language': 'en', ...(Platform.OS === 'web' ? {} : { 'User-Agent': 'HooraApp/1.0' }) };

type NominatimAddress = Partial<
  Record<
    | 'house_number'
    | 'road'
    | 'neighbourhood'
    | 'suburb'
    | 'quarter'
    | 'city_district'
    | 'city'
    | 'town'
    | 'village'
    | 'state_district'
    | 'state'
    | 'postcode',
    string
  >
>;

function fromNominatim(a: NominatimAddress | undefined, fallback: string) {
  const area = a?.neighbourhood || a?.suburb || a?.quarter || a?.city_district;
  const city = a?.city || a?.town || a?.village || a?.state_district;
  const street = [a?.house_number, a?.road].filter(Boolean).join(' ');
  const title = street || area || city || fallback.split(',')[0];
  const line = [street && area, city, a?.state, a?.postcode]
    .filter((p): p is string => !!p && p !== title)
    .filter((p, i, all) => all.indexOf(p) === i)
    .join(', ');
  return { title, line: line || fallback };
}

/** What's at a point: a short title (street or area) and the rest of the address. */
export async function reverseGeocode(p: LatLng): Promise<{ title: string; line: string } | null> {
  if (Platform.OS !== 'web') {
    try {
      const [place] = await Location.reverseGeocodeAsync({ latitude: p.lat, longitude: p.lng });
      if (place) {
        const street = [place.streetNumber, place.street].filter(Boolean).join(' ');
        const area = place.district || place.subregion || place.name || '';
        const title = street || area || place.city || 'Pinned location';
        const line = [street ? area : '', place.city, place.region, place.postalCode]
          .filter((x): x is string => !!x && x !== title)
          .filter((x, i, all) => all.indexOf(x) === i)
          .join(', ');
        return { title, line };
      }
    } catch {
      // fall through to OpenStreetMap
    }
  }
  try {
    const res = await fetch(`${NOMINATIM}/reverse?format=jsonv2&addressdetails=1&zoom=18&lat=${p.lat}&lon=${p.lng}`, {
      headers: HEADERS,
    });
    const json = (await res.json()) as { display_name?: string; address?: NominatimAddress };
    if (!json.display_name) return null;
    return fromNominatim(json.address, json.display_name);
  } catch {
    return null;
  }
}

/** Places matching a typed query, in India. */
export async function searchPlaces(query: string): Promise<Place[]> {
  const q = query.trim();
  if (q.length < 3) return [];
  try {
    const res = await fetch(
      `${NOMINATIM}/search?format=jsonv2&addressdetails=1&countrycodes=in&limit=6&q=${encodeURIComponent(q)}`,
      { headers: HEADERS },
    );
    const json = (await res.json()) as { lat: string; lon: string; display_name: string; address?: NominatimAddress }[];
    return json.map((r) => ({ lat: Number(r.lat), lng: Number(r.lon), ...fromNominatim(r.address, r.display_name) }));
  } catch {
    return [];
  }
}

/** The phone's current position, asking for permission when needed. */
export async function currentPosition(): Promise<
  { ok: true; at: LatLng } | { ok: false; reason: 'denied' | 'unavailable' }
> {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') return { ok: false, reason: 'denied' };
    const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
    return { ok: true, at: { lat: pos.coords.latitude, lng: pos.coords.longitude } };
  } catch {
    return { ok: false, reason: 'unavailable' };
  }
}
