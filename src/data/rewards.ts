import type { ImageSourcePropType } from 'react-native';

// Hoora Rewards — from the Figma "Gamification" page, with the tier order fixed
// (Bronze → Silver → Gold → Platinum → Diamond) and one clear promise per referral.
//
// Placeholder business numbers until the backend exists: points per action, item prices in
// points and what a point is worth are not decided yet.

export const REFERRAL_CODE = 'HOORA100';
export const FRIEND_DISCOUNT = 100; // ₹ off the friend's first service

/** The signed-in user's numbers. Zero until the rewards backend is connected. */
export const MY_REWARDS = { points: 0, referrals: 0, monthPoints: 0 };

export type Tier = {
  key: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';
  name: string;
  from: number; // referrals needed to reach it
  to?: number;
  pointsPerReferral: number;
  reward: string;
  badge: ImageSourcePropType;
  color: string;
};

export const TIERS: Tier[] = [
  {
    key: 'bronze',
    name: 'Bronze',
    from: 1,
    to: 5,
    pointsPerReferral: 80,
    reward: 'Free car care product',
    badge: require('../../assets/rewards/tier-bronze.png'),
    color: '#B8692F',
  },
  {
    key: 'silver',
    name: 'Silver',
    from: 6,
    to: 10,
    pointsPerReferral: 90,
    reward: 'Free premium pressure wash',
    badge: require('../../assets/rewards/tier-silver.png'),
    color: '#8A8D95',
  },
  {
    key: 'gold',
    name: 'Gold',
    from: 11,
    to: 15,
    pointsPerReferral: 100,
    reward: 'Free 360° deep cleaning',
    badge: require('../../assets/rewards/tier-gold.png'),
    color: '#C08A00',
  },
  {
    key: 'platinum',
    name: 'Platinum',
    from: 16,
    to: 20,
    pointsPerReferral: 110,
    reward: 'Free monthly pack (2 washes)',
    badge: require('../../assets/rewards/tier-platinum.png'),
    color: '#5A6B8C',
  },
  {
    key: 'diamond',
    name: 'Diamond',
    from: 21,
    pointsPerReferral: 120,
    reward: 'Hoora Premium Car Care Kit',
    badge: require('../../assets/rewards/tier-diamond.png'),
    color: '#2A9FD0',
  },
];

/** Current tier (undefined before the first referral) and the next one to reach. */
export function tierProgress(referrals: number) {
  const current = [...TIERS].reverse().find((t) => referrals >= t.from);
  const next = TIERS.find((t) => referrals < t.from);
  const base = current ? current.from - 1 : 0;
  const goal = next ? next.from - 1 : referrals;
  const progress = next ? Math.min(1, (referrals - base) / Math.max(1, goal - base)) : 1;
  return { current, next, toNext: next ? next.from - referrals : 0, progress };
}

export const WAYS_TO_EARN = [
  { key: 'refer', icon: 'people-outline', title: 'Refer a friend', points: TIERS[0].pointsPerReferral },
  { key: 'book', icon: 'car-sport-outline', title: 'Book any service', points: 50 },
  { key: 'rate', icon: 'star-outline', title: 'Rate the app', points: 50 },
  { key: 'profile', icon: 'person-circle-outline', title: 'Complete your profile', points: 20 },
] as const;

export type RedeemItem = {
  id: string;
  kind: 'product' | 'voucher';
  name: string;
  detail: string;
  points: number;
  image?: ImageSourcePropType;
  icon?: string;
};

export const REDEEM: RedeemItem[] = [
  {
    id: 'spray',
    kind: 'product',
    name: 'Ceramic Spray Coat',
    detail: '500 ml',
    points: 590,
    image: require('../../assets/home/acc-product2.png'),
  },
  {
    id: 'kit',
    kind: 'product',
    name: 'Premium Car Care Kit',
    detail: '8-in-1 kit',
    points: 1490,
    image: require('../../assets/rewards/prize-carekit.png'),
  },
  {
    id: 'cushion',
    kind: 'product',
    name: 'Back Support Cushion',
    detail: 'Memory foam',
    points: 790,
    image: require('../../assets/home/acc-product3.png'),
  },
  {
    id: 'dashcam',
    kind: 'product',
    name: 'Dash Camera',
    detail: 'Full HD',
    points: 2990,
    image: require('../../assets/home/acc-product2b.png'),
  },
  {
    id: 'fuel',
    kind: 'voucher',
    name: '₹100 Fuel Voucher',
    detail: 'At partner pumps',
    points: 1000,
    icon: 'speedometer-outline',
  },
  {
    id: 'wash',
    kind: 'voucher',
    name: 'Free Foam Wash',
    detail: 'Any car or bike',
    points: 1200,
    icon: 'water-outline',
  },
  {
    id: 'off',
    kind: 'voucher',
    name: '₹150 off any service',
    detail: 'Min. bill ₹499',
    points: 1500,
    icon: 'pricetag-outline',
  },
  {
    id: 'interior',
    kind: 'voucher',
    name: 'Free Interior Clean',
    detail: 'Cars only',
    points: 1800,
    icon: 'sparkles-outline',
  },
];

export const MONTHLY_PRIZES: { rank: number; name: string; image: ImageSourcePropType }[] = [
  { rank: 1, name: 'Wet & Dry Vacuum', image: require('../../assets/rewards/prize-vacuum.png') },
  { rank: 2, name: 'Tyre Inflator', image: require('../../assets/rewards/prize-inflator.png') },
  { rank: 3, name: 'Car Care Kit', image: require('../../assets/rewards/prize-carekit.png') },
];

/**
 * SAMPLE leaderboard for the prototype — replace with the API. First name + initial only,
 * no photos, so other customers' identities stay private.
 */
export const SAMPLE_LEADERBOARD = [
  { name: 'Rahul S.', points: 1240 },
  { name: 'Amol K.', points: 1180 },
  { name: 'Priya M.', points: 1020 },
  { name: 'Ramesh T.', points: 960 },
  { name: 'Anita D.', points: 910 },
  { name: 'Kiran P.', points: 880 },
  { name: 'Nisha R.', points: 840 },
  { name: 'Somesh B.', points: 800 },
];
