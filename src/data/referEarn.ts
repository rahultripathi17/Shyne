import type { ImageSourcePropType } from 'react-native';

// Rewards (Refer & Earn) content. Flow and numbers follow the designer's Figma (Dev File, section
// 11461:5761) and the latest "Referral flow" designs. SAMPLE data until the rewards backend is live.

export const REFER_CODE = 'REFXYZ4626';
export const INVITE_TEXT = `I get my car washed at my doorstep with Hoora. Use my code ${REFER_CODE} and your first wash is FREE!`;

/** 1 Hoora Point is worth ₹1 in rewards (a ₹250 fuel voucher costs 250 points). */
export const POINT_VALUE_INR = 1;

/** "Refer a friend & get FREE …" — the prizes the Figma banner cycles through. */
export const HERO_SLIDES: { key: string; title: string; image: ImageSourcePropType }[] = [
  { key: 'fuel', title: 'Fuel Voucher', image: require('../../assets/rewards/refer/slide-fuel.png') },
  { key: 'dashcam', title: 'Dash Cam', image: require('../../assets/rewards/refer/slide-dashcam.png') },
  { key: 'vacuum', title: 'Vacuum Cleaner', image: require('../../assets/rewards/refer/slide-vacuum.png') },
  { key: 'duster', title: 'Car Duster', image: require('../../assets/rewards/refer/slide-duster.png') },
];

// ——— Friends you've invited ———

export type Referral = {
  id: string;
  name: string;
  joined: string;
  /** Their first completed service; undefined while they haven't booked yet. */
  service?: string;
  /** When that service was completed (points are credited then). */
  bookedOn?: string;
};

/** Newest first (from the Figma "Referrals" screen). */
export const REFERRALS: Referral[] = [
  { id: 'rs', name: 'Rahul Sharma', joined: '18 Oct', service: '360 Deep Cleaning', bookedOn: '20 Oct' },
  { id: 'pp', name: 'Priya Patel', joined: '12 Oct', service: 'Premium Pressure Wash', bookedOn: '14 Oct' },
  { id: 'av', name: 'Ananya Verma', joined: '08 Oct' },
  { id: 'dm', name: 'David Miller', joined: '02 Oct', service: 'Full Interior Detailing', bookedOn: '05 Oct' },
  { id: 'sr', name: 'Sneha Roy', joined: '29 Sep' },
  { id: 'ak', name: 'Arjun Kapoor', joined: '21 Sep', service: 'Premium Pressure Wash', bookedOn: '23 Sep' },
  { id: 'ka', name: 'Kavita Agarwal', joined: '15 Sep', service: 'Premium Pressure Wash', bookedOn: '17 Sep' },
  { id: 'rn', name: 'Rohan Nambiar', joined: '10 Sep' },
  { id: 'tm', name: 'Tanvi Mehra', joined: '03 Sep', service: 'Standard Foam Wash', bookedOn: '06 Sep' },
  { id: 'vs', name: 'Varun Singhania', joined: '28 Aug', service: 'Premium Pressure Wash', bookedOn: '30 Aug' },
  { id: 'mk', name: 'Megha Kapoor', joined: '20 Aug' },
];

export const BOOKED = REFERRALS.filter((r) => r.service);
export const PENDING = REFERRALS.filter((r) => !r.service);

// ——— Leagues (tiers) ———

export type TierId = 'bronze' | 'silver' | 'gold' | 'diamond' | 'platinum';

export type Tier = {
  id: TierId;
  name: string;
  /** Successful referrals that put you in this league (inclusive); `to` is null for the last one. */
  from: number;
  to: number | null;
  pointsPerReferral: number;
  /** Unlocked when you complete the league. */
  reward: string;
  color: string;
  badge: ImageSourcePropType;
  /** Badge width ÷ height. */
  badgeRatio: number;
};

// From the Figma "Journey". Platinum's 110 points (below Diamond's 120) is as designed; confirm with product.
export const TIERS: Tier[] = [
  {
    id: 'bronze',
    name: 'Bronze',
    from: 1,
    to: 5,
    pointsPerReferral: 80,
    reward: 'FREE Product 1',
    color: '#B8692F',
    badge: require('../../assets/rewards/tier-bronze.png'),
    badgeRatio: 223 / 250,
  },
  {
    id: 'silver',
    name: 'Silver',
    from: 6,
    to: 10,
    pointsPerReferral: 90,
    reward: 'FREE Premium Pressure Wash',
    color: '#7D8088',
    badge: require('../../assets/rewards/tier-silver.png'),
    badgeRatio: 217 / 250,
  },
  {
    id: 'gold',
    name: 'Gold',
    from: 11,
    to: 15,
    pointsPerReferral: 100,
    reward: 'FREE 360 Deep Cleaning',
    color: '#C99700',
    badge: require('../../assets/rewards/tier-gold.png'),
    badgeRatio: 260 / 230,
  },
  {
    id: 'diamond',
    name: 'Diamond',
    from: 16,
    to: 20,
    pointsPerReferral: 120,
    reward: 'FREE Monthly Package (2 times/month)',
    color: '#1E95BF',
    badge: require('../../assets/rewards/tier-diamond.png'),
    badgeRatio: 260 / 228,
  },
  {
    id: 'platinum',
    name: 'Platinum',
    from: 21,
    to: null,
    pointsPerReferral: 110,
    reward: 'FREE Product 2',
    color: '#4F6B8A',
    badge: require('../../assets/rewards/tier-platinum.png'),
    badgeRatio: 260 / 220,
  },
];

export const tierRange = (t: Tier) => (t.to === null ? `${t.from}+` : `${t.from}–${t.to}`);

/** The league a successful-referral count sits in (Bronze until the first one lands). */
export function tierFor(successful: number) {
  const found = TIERS.findIndex((t) => successful >= t.from && (t.to === null || successful <= t.to));
  const index = Math.max(0, found);
  const tier = TIERS[index];
  const next = TIERS[index + 1] ?? null;
  // Referrals still needed to finish this league (and unlock its reward).
  const goal = tier.to ?? tier.from;
  const left = Math.max(0, goal - successful);
  const size = tier.to === null ? 1 : tier.to - tier.from + 1;
  const done = tier.to === null ? 1 : Math.max(0, Math.min(size, successful - tier.from + 1));
  return { tier, next, index, goal, left, size, done };
}

/** Points a referral earned: the rate of the league you were in when it landed. */
const rateForNth = (n: number) => tierFor(n).tier.pointsPerReferral;

export const ME = {
  name: 'You',
  successful: BOOKED.length,
  invited: REFERRALS.length,
  rank: 34,
  rankNote: 'TOP 5% THIS MONTH',
};

export const MY_TIER = tierFor(ME.successful);

// ——— Hoora Points ledger ———

export type LedgerEntry = {
  id: string;
  kind: 'earned' | 'redeemed' | 'pending';
  title: string;
  detail: string;
  date: string;
  /** Month heading for the history list. */
  month: string;
  points: number;
};

const monthOf = (d: string) => {
  const m = d.split(' ')[1];
  return { Aug: 'August', Sep: 'September', Oct: 'October' }[m] ?? m;
};

// Oldest booked referral first, so each one earns the rate of the league it landed in.
const booked = [...BOOKED].reverse();

export const LEDGER: LedgerEntry[] = [
  ...PENDING.map((r) => ({
    id: `pending-${r.id}`,
    kind: 'pending' as const,
    title: `${r.name.split(' ')[0]} joined with your code`,
    detail: 'Credited after their first wash',
    date: r.joined,
    month: 'On the way',
    points: MY_TIER.tier.pointsPerReferral,
  })),
  ...booked
    .map((r, i) => ({
      id: `ref-${r.id}`,
      kind: 'earned' as const,
      title: `Referral · ${r.name}`,
      detail: r.service ?? '',
      date: r.bookedOn ?? r.joined,
      month: monthOf(r.bookedOn ?? r.joined),
      points: rateForNth(i + 1),
    }))
    .reverse(),
];

export const EARNED = LEDGER.filter((e) => e.kind === 'earned').reduce((s, e) => s + e.points, 0);
export const ON_THE_WAY = LEDGER.filter((e) => e.kind === 'pending').reduce((s, e) => s + e.points, 0);

// ——— What points buy ———

export type CatalogItem = {
  id: string;
  kind: 'product' | 'voucher';
  name: string;
  detail: string;
  cost: number;
  image: ImageSourcePropType;
  /** Image box inside the card art, as a share of its width. */
  scale?: number;
  tag?: 'New';
};

export const CATALOG: CatalogItem[] = [
  {
    id: 'foam',
    kind: 'product',
    name: 'Hoora Foam Fusion',
    detail: '1 pc, 500 ml',
    cost: 590,
    image: require('../../assets/rewards/refer/product-foam.png'),
    scale: 0.45,
  },
  {
    id: 'dash',
    kind: 'product',
    name: 'Hoora Dash Dazzle',
    detail: '1 pc, 500 ml',
    cost: 590,
    image: require('../../assets/rewards/refer/product-dash.png'),
    scale: 0.5,
  },
  // SAMPLE: the prizes from the Figma banner, until the eStore catalogue is connected.
  {
    id: 'duster',
    kind: 'product',
    name: 'Hoora Car Duster',
    detail: '1 pc, microfibre',
    cost: 450,
    image: require('../../assets/rewards/refer/slide-duster.png'),
    scale: 0.8,
  },
  {
    id: 'vacuum',
    kind: 'product',
    name: 'Vacuum Cleaner',
    detail: 'Wet and dry, 1 pc',
    cost: 1800,
    image: require('../../assets/rewards/refer/slide-vacuum.png'),
    scale: 0.8,
  },
  {
    id: 'dashcam',
    kind: 'product',
    name: 'Dash Cam',
    detail: '1080p front camera',
    cost: 2500,
    image: require('../../assets/rewards/refer/slide-dashcam.png'),
    scale: 0.55,
  },
  {
    id: 'bpcl-250',
    kind: 'voucher',
    name: 'BPCL Fuel Voucher',
    detail: 'Worth ₹250',
    cost: 250,
    image: require('../../assets/rewards/refer/slide-fuel.png'),
    scale: 0.86,
    tag: 'New',
  },
  {
    id: 'bpcl-100',
    kind: 'voucher',
    name: 'BPCL Fuel Voucher',
    detail: 'Worth ₹100',
    cost: 100,
    image: require('../../assets/rewards/refer/slide-fuel.png'),
    scale: 0.86,
    tag: 'New',
  },
  {
    id: 'bpcl-500',
    kind: 'voucher',
    name: 'BPCL Fuel Voucher',
    detail: 'Worth ₹500',
    cost: 500,
    image: require('../../assets/rewards/refer/slide-fuel.png'),
    scale: 0.86,
  },
];

// ——— League boards and prizes ———

export type Board = 'monthly' | 'yearly';
export type Leader = { rank: number; name: string; points: number; me?: boolean };

export const LEADERS: Record<Board, Leader[]> = {
  monthly: [
    { rank: 1, name: 'Rahul K.', points: 640 },
    { rank: 2, name: 'Amol D.', points: 560 },
    { rank: 3, name: 'Ankit S.', points: 520 },
    { rank: 4, name: 'Ramesh P.', points: 450 },
    { rank: 5, name: 'Somesh G.', points: 410 },
    { rank: 6, name: 'Nisha R.', points: 380 },
    { rank: 7, name: 'Kailash V.', points: 360 },
    { rank: 8, name: 'Kiran M.', points: 320 },
    { rank: 9, name: 'Priya S.', points: 290 },
    { rank: 10, name: 'Anita B.', points: 270 },
    { rank: 34, name: 'You', points: 180, me: true },
  ],
  yearly: [
    { rank: 1, name: 'Rahul K.', points: 4620 },
    { rank: 2, name: 'Amol D.', points: 4180 },
    { rank: 3, name: 'Ankit S.', points: 3950 },
    { rank: 4, name: 'Ramesh P.', points: 3410 },
    { rank: 5, name: 'Somesh G.', points: 3020 },
    { rank: 6, name: 'Nisha R.', points: 2870 },
    { rank: 7, name: 'Kailash V.', points: 2610 },
    { rank: 8, name: 'Priya S.', points: 2380 },
    { rank: 9, name: 'Kiran M.', points: 2240 },
    { rank: 10, name: 'Anita B.', points: 2100 },
    { rank: 22, name: 'You', points: 880, me: true },
  ],
};

export const BOARD_RESET: Record<Board, string> = {
  monthly: 'Resets on the last day of every month',
  yearly: 'Resets on 31 Dec every year',
};

export type Prize = { rank: number; name: string; image: ImageSourcePropType };

export const PRIZES: Record<Board, Prize[]> = {
  monthly: [
    { rank: 1, name: 'Wet & Dry Vacuum', image: require('../../assets/rewards/hub/prize-vacuum.png') },
    { rank: 2, name: 'Helmet', image: require('../../assets/rewards/hub/prize-helmet.png') },
    { rank: 3, name: 'Premium Car Duster', image: require('../../assets/rewards/hub/prize-duster.png') },
  ],
  yearly: [
    { rank: 1, name: 'Wet & Dry Vacuum', image: require('../../assets/rewards/hub/prize-vacuum.png') },
    { rank: 2, name: 'Tyre Inflator', image: require('../../assets/rewards/hub/prize-inflator.png') },
    { rank: 3, name: 'Duster', image: require('../../assets/rewards/hub/prize-kit.png') },
  ],
};

/** Yearly prizes for ranks 4–10. */
export const YEARLY_LIST = [
  'All Weather Universal Car Cover',
  'Universal Rubber Car Floor Mats',
  'Tail Bone Pillow',
  'Hybrid Ceramic Spray Coat',
  'Ceramic Wax-Infused Car Duster',
  'Ceramic Car Shampoo',
  'Foam Car Wash Shampoo',
];

/** Last month's league result: you finished #3 and won its prize. */
export const LAST_MONTH = { month: 'September', rank: 3, prize: PRIZES.monthly[2] };
