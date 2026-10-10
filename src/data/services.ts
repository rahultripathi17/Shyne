import type Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps } from 'react';

type IconName = ComponentProps<typeof Ionicons>['name'];

// All prices below are SAMPLE values for the prototype — replace with real pricing.

export type SizeTier = 'small' | 'medium' | 'large';

export const TIER_LABEL: Record<SizeTier, string> = {
  small: 'Hatchback',
  medium: 'Sedan',
  large: 'SUV / MPV',
};

export function tierForBody(body: string): SizeTier {
  switch (body) {
    case 'Hatchback':
    case 'Bike':
      return 'small';
    case 'SUV':
    case 'MPV':
    case 'Pickup':
    case 'Van':
      return 'large';
    default:
      return 'medium';
  }
}

export type Service = {
  id: string;
  name: string;
  tagline: string;
  icon: IconName;
  color: string;
  durationMins: number;
  prices: Record<SizeTier, number>;
  includes: string[];
};

export const SERVICES: Service[] = [
  {
    id: 'exterior-foam',
    name: 'Exterior Foam Wash',
    tagline: 'Foam + pressure wash',
    icon: 'water',
    color: '#0A66FF',
    durationMins: 30,
    prices: { small: 299, medium: 349, large: 399 },
    includes: ['Snow foam pre-wash', 'Pressure rinse', 'Tyre & rim cleaning', 'Microfibre dry'],
  },
  {
    id: 'interior',
    name: 'Interior Cleaning',
    tagline: 'Vacuum + dashboard',
    icon: 'brush',
    color: '#7C3AED',
    durationMins: 40,
    prices: { small: 349, medium: 399, large: 449 },
    includes: ['Full vacuum', 'Dashboard polish', 'Floor mat cleaning', 'Door panel wipe'],
  },
  {
    id: 'complete-360',
    name: '360° Complete Care',
    tagline: 'Inside + outside',
    icon: 'sparkles',
    color: '#00A389',
    durationMins: 60,
    prices: { small: 549, medium: 649, large: 749 },
    includes: ['Exterior foam wash', 'Interior vacuum', 'Dashboard polish', 'Tyre shine'],
  },
  {
    id: 'waterless',
    name: 'Waterless Eco Wash',
    tagline: 'Saves water',
    icon: 'leaf',
    color: '#16A34A',
    durationMins: 25,
    prices: { small: 249, medium: 299, large: 349 },
    includes: ['Waterless spray clean', 'Glass cleaning', 'Microfibre buff'],
  },
  {
    id: 'deep-clean',
    name: 'Deep Cleaning',
    tagline: 'Shampoo + odour removal',
    icon: 'color-wand',
    color: '#EA580C',
    durationMins: 120,
    prices: { small: 1499, medium: 1799, large: 2099 },
    includes: ['Seat shampoo', 'Roof cleaning', 'Odour eliminator', 'Underbody wash'],
  },
  {
    id: 'ceramic',
    name: 'Hybrid Ceramic Coating',
    tagline: 'Long-lasting shine',
    icon: 'shield-checkmark',
    color: '#0F172A',
    durationMins: 150,
    prices: { small: 2999, medium: 3499, large: 3999 },
    includes: ['Paint decontamination', 'Ceramic layer', 'Glass & trim protection'],
  },
];

export type AddOn = { id: string; name: string; price: number };

export const ADD_ONS: AddOn[] = [
  { id: 'underbody', name: 'Underbody cleaning', price: 199 },
  { id: 'alloy', name: 'Alloy wheel cleaning', price: 99 },
  { id: 'odour', name: 'Odour eliminator', price: 149 },
  { id: 'rain', name: 'Rain repellent coating', price: 199 },
  { id: 'trim', name: 'Trim restoration', price: 249 },
];

export type Package = {
  id: string;
  name: string;
  price: number;
  period: string;
  perks: string[];
  badge?: string;
};

export const PACKAGES: Package[] = [
  {
    id: 'monthly',
    name: 'Monthly',
    price: 1299,
    period: '/month',
    perks: ['4 exterior washes', '1 interior clean'],
  },
  {
    id: 'quarterly',
    name: 'Quarterly',
    price: 3499,
    period: '/3 months',
    perks: ['12 exterior washes', '3 interior cleans'],
    badge: 'Save 10%',
  },
  {
    id: 'yearly',
    name: 'Yearly',
    price: 12999,
    period: '/year',
    perks: ['48 exterior washes', '12 interior cleans', '1 deep clean'],
    badge: 'Best value',
  },
];

export const MORE_SERVICES: { id: string; name: string; icon: IconName }[] = [
  { id: 'fastag', name: 'FASTag', icon: 'card' },
  { id: 'challan', name: 'Challan check', icon: 'document-text' },
  { id: 'insurance', name: 'Insurance', icon: 'shield-half' },
  { id: 'accessories', name: 'Accessories', icon: 'cart' },
];

export const getService = (id: string) => SERVICES.find((s) => s.id === id);
