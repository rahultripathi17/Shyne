import type { ImageSourcePropType } from 'react-native';
import { useSyncExternalStore } from 'react';

// Wash booking flow (Figma Dev File → "Car wash & Care" → "New flow 02/08/2026"):
// Car Services → service card (make your service, pick a plan) → slot → checkout → confirmed.
// All prices and ratings are SAMPLE values until the pricing API lands.

export type VehicleKind = 'car' | 'bike';

export type ServiceItem = { id: string; name: string; price: number };

export type WashService = {
  id: string;
  kind: VehicleKind;
  name: string;
  from: number;
  rating: number;
  ratings: string;
  image: ImageSourcePropType;
  /** Card footer tint, as in the designs. */
  tint: string;
  /** The base service, always included. */
  base: ServiceItem;
  /** Add-ons; `on` ones are part of the recommended service. */
  addOns: (ServiceItem & { on?: boolean })[];
  /** How many more add-ons hide behind "1 More Add On". */
  shown: number;
};

const IMG = {
  basic: require('../../assets/booking/flow/svc-basic.jpg'),
  premium: require('../../assets/booking/flow/svc-premium.jpg'),
  deep: require('../../assets/booking/flow/svc-360.jpg'),
  basicBike: require('../../assets/booking/flow/svc-basic-bike.jpg'),
  premiumBike: require('../../assets/booking/flow/svc-premium-bike.jpg'),
};

const CAR_ADD_ONS = (interior: number) => [
  { id: 'interior', name: 'Normal Interior Cleaning', price: interior, on: true },
  { id: 'dashboard', name: 'Dashboard Polish', price: 39, on: true },
  { id: 'freshener', name: '30 Days Air Freshener', price: 89 },
  { id: 'tissue', name: 'Tissue Box', price: 89 },
  { id: 'tyre', name: 'Tyre Dressing', price: 79 },
];

const BIKE_ADD_ONS = [
  { id: 'chain', name: 'Chain Cleaning & Lube', price: 49, on: true },
  { id: 'polish', name: 'Body Polish', price: 59 },
  { id: 'helmet', name: 'Helmet Sanitisation', price: 39 },
];

export const WASH_SERVICES: WashService[] = [
  {
    id: 'basic',
    kind: 'car',
    name: 'Bucket Wash - Basic',
    from: 93,
    rating: 3.9,
    ratings: '2.5k',
    image: IMG.basic,
    tint: '#F7F7F7',
    base: { id: 'base', name: '(Bucket Wash) Exterior Ceramic Wash & Tyre Polish', price: 269 },
    addOns: CAR_ADD_ONS(119),
    shown: 4,
  },
  {
    id: 'premium',
    kind: 'car',
    name: 'Pressure Wash - Premium',
    from: 182,
    rating: 4.6,
    ratings: '6.8k',
    image: IMG.premium,
    tint: '#EEF4FF',
    base: { id: 'base', name: '(Pressure Wash) Exterior Foam Wash & Tyre Polish', price: 349 },
    addOns: CAR_ADD_ONS(149),
    shown: 4,
  },
  {
    id: 'deep-360',
    kind: 'car',
    name: '360 Deep Cleaning',
    from: 669,
    rating: 4.4,
    ratings: '3.2k',
    image: IMG.deep,
    tint: '#FFF8E6',
    base: { id: 'base', name: '360 Deep Cleaning (Interior + Exterior)', price: 669 },
    addOns: [
      { id: 'seat', name: 'Seat Shampoo', price: 299 },
      { id: 'roof', name: 'Roof Cleaning', price: 149 },
      { id: 'odour', name: 'Odour Eliminator', price: 129, on: true },
    ],
    shown: 3,
  },
  {
    id: 'bike-basic',
    kind: 'bike',
    name: 'Bike Bucket Wash - Basic',
    from: 79,
    rating: 4.2,
    ratings: '1.8k',
    image: IMG.basicBike,
    tint: '#F7F7F7',
    base: { id: 'base', name: '(Bucket Wash) Bike Exterior Wash', price: 99 },
    addOns: BIKE_ADD_ONS,
    shown: 3,
  },
  {
    id: 'bike-premium',
    kind: 'bike',
    name: 'Bike Pressure Wash - Premium',
    from: 129,
    rating: 4.5,
    ratings: '2.1k',
    image: IMG.premiumBike,
    tint: '#EEF4FF',
    base: { id: 'base', name: '(Pressure Wash) Bike Foam Wash', price: 149 },
    addOns: BIKE_ADD_ONS,
    shown: 3,
  },
];

export const washService = (id: string | undefined) => WASH_SERVICES.find((s) => s.id === id);

/** Society packages (cars only, in partner societies). */
export const SOCIETY_PACKS = [
  {
    id: 'soc-basic',
    name: 'Basic Wash',
    price: 429,
    mrp: 710,
    rating: 4.9,
    ratings: '22k',
    image: IMG.basic,
    tint: '#FFFFFF',
    includes: ['Exterior Foam Wash', 'Tyre Polish'],
  },
  {
    id: 'soc-premium',
    name: 'Premium Wash',
    price: 599,
    mrp: 980,
    rating: 4.9,
    ratings: '22k',
    image: IMG.premium,
    tint: '#EEF4FF',
    includes: ['Exterior Foam Wash', 'Tyre Polish', 'Dashboard Cleaning', 'Glass Cleaning'],
  },
];

export type PlanPeriod = 'monthly' | 'quarterly';
export type PlanFreq = 'weekly' | 'alternate';

/** "Choose your wash plan" sheet. */
export const PLANS: Record<
  PlanPeriod,
  { id: PlanFreq; name: string; washes: number; perWash: number; mrp: number; save: number; badge?: string }[]
> = {
  monthly: [
    { id: 'weekly', name: 'Once a Week', washes: 4, perWash: 203, mrp: 463, save: 1038 },
    { id: 'alternate', name: 'Alternate Days', washes: 12, perWash: 179, mrp: 433, save: 3046, badge: 'MOST BOOKED' },
  ],
  quarterly: [
    { id: 'weekly', name: 'Once a Week', washes: 12, perWash: 189, mrp: 463, save: 3288 },
    { id: 'alternate', name: 'Alternate Days', washes: 36, perWash: 165, mrp: 433, save: 9648, badge: 'MOST BOOKED' },
  ],
};

/** "Need some carcare add-on?" — the Special Deal bundle at checkout. */
export const SPECIAL_DEAL = {
  price: 177,
  mrp: 354,
  items: [
    { name: 'Air Freshener', image: require('../../assets/booking/flow/deal-freshener.png') },
    { name: '340GSM Microfiber', image: require('../../assets/booking/flow/deal-microfiber.png') },
    { name: 'Wet Wipes', image: require('../../assets/booking/flow/deal-wipes.png') },
  ],
};

export const BLACK = { price: 499, mrp: 1200, saves: 60 };
export const TIPS = [20, 30, 50];
export const HOORA_POINTS = 143;
/** Booking more vehicles in the same visit: price per vehicle. */
export const MULTI_VEHICLE = [1531, 1277, 1192, 1105];

/** Start hours for slots, 7 AM – 6 PM. */
export const SLOT_HOURS = [7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18];

const h12 = (h: number) => `${((h + 11) % 12) + 1}`;
const ampm = (h: number) => (h < 12 ? 'AM' : 'PM');
/** "7–8 AM", "12–1 PM". */
export const slotRange = (h: number) => `${h12(h)}–${h12(h + 1)} ${ampm(h + 1)}`;

/** The next 7 days, today first. */
export function nextDays(from: Date) {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(from.getFullYear(), from.getMonth(), from.getDate() + i);
    return {
      iso: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`,
      day: d.toLocaleDateString('en-IN', { weekday: 'short' }),
      date: d.getDate(),
      label:
        i === 0
          ? 'Today'
          : i === 1
            ? 'Tomorrow'
            : d.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' }),
      short: d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' }),
    };
  });
}

export const isValidPlate = (p: string) => /^[A-Z]{2}\s?\d{1,2}\s?[A-Z]{0,3}\s?\d{4}$/.test(p.trim().toUpperCase());

/** Set by the map screen after saving, so Address Selection steps back to where it was opened. */
export const closeAfterSave = { current: false };

// ——— The booking being made, shared by Car Services → Slot → Checkout ———

export type BookingDraft = {
  kind: VehicleKind;
  serviceId?: string;
  /** Picked add-on ids for the service. */
  addOns: string[];
  plan: 'one-time' | 'package';
  period: PlanPeriod;
  freq: PlanFreq;
  /** Instant ("in 30 mins") or a scheduled day + start hour. */
  instant: boolean;
  date?: string;
  hour?: number;
};

let draft: BookingDraft = {
  kind: 'car',
  addOns: [],
  plan: 'one-time',
  period: 'monthly',
  freq: 'alternate',
  instant: true,
};
const listeners = new Set<() => void>();

export const getDraft = () => draft;
export function setDraft(patch: Partial<BookingDraft>) {
  draft = { ...draft, ...patch };
  listeners.forEach((l) => l());
}
export function useDraft() {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    getDraft,
    getDraft,
  );
}

/** What the draft costs: the service plus add-ons (one-time), or the plan total (package). */
export function draftPrice(d: BookingDraft) {
  const svc = washService(d.serviceId);
  if (!svc) return { items: [] as ServiceItem[], total: 0, mrp: 0 };
  if (d.plan === 'package') {
    const p = PLANS[d.period].find((x) => x.id === d.freq) ?? PLANS[d.period][0];
    const total = p.perWash * p.washes;
    return {
      items: [{ id: 'plan', name: `${svc.name} · ${p.name} (${p.washes} washes)`, price: total }],
      total,
      mrp: p.mrp * p.washes,
    };
  }
  const items = [svc.base, ...svc.addOns.filter((a) => d.addOns.includes(a.id))];
  const total = items.reduce((s, i) => s + i.price, 0);
  return { items, total, mrp: Math.round(total * 1.85) };
}
