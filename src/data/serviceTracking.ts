import type { ImageSourcePropType } from 'react-native';

import type { BookingItem } from './bookingsDemo';

// Service booking tracking (Figma Dev File, section "08 Oct 2026", 14519:1590): one page whose top
// changes with the stage, and the same blocks underneath. SAMPLE data until the bookings API lands.

export type TrackStage =
  'confirmed' | 'assigned' | 'on_the_way' | 'delayed' | 'arrived' | 'in_progress' | 'completed' | 'cancelled';

/** Every stage in order — Configuration links to each one for previews. */
export const TRACK_STAGES: { key: TrackStage; label: string }[] = [
  { key: 'confirmed', label: 'Booking confirmed' },
  { key: 'assigned', label: 'Service partner assigned' },
  { key: 'on_the_way', label: 'Partner on the way' },
  { key: 'delayed', label: 'Partner running late' },
  { key: 'arrived', label: 'Partner arrived' },
  { key: 'in_progress', label: 'Wash in progress' },
  { key: 'completed', label: 'Service completed' },
  { key: 'cancelled', label: 'Booking cancelled' },
];

export const isTrackStage = (s: string | undefined): s is TrackStage => TRACK_STAGES.some((t) => t.key === s);

/** The stage a booking is in, from its status. */
export function stageFor(item: BookingItem): TrackStage {
  switch (item.status) {
    case 'Assigned':
      return 'assigned';
    case 'On the way':
      return item.alert ? 'delayed' : 'on_the_way';
    case 'Ongoing':
    case 'Started':
      return 'in_progress';
    case 'Completed':
      return 'completed';
    case 'Cancelled':
      return 'cancelled';
    default:
      return 'confirmed';
  }
}

const MAP = {
  confirmed: require('../../assets/booking/track/map-confirmed.jpg'),
  assigned: require('../../assets/booking/track/map-assigned.jpg'),
  route: require('../../assets/booking/track/map-on-the-way.jpg'),
  delayed: require('../../assets/booking/track/map-delayed.jpg'),
  arrived: require('../../assets/booking/track/map-arrived.jpg'),
};

/** Top of the page per stage: title, a line under it (with a bold part), and the map. */
export const STAGE_HEAD: Record<
  TrackStage,
  { title: string; sub: string; strong?: string; late?: boolean; map?: ImageSourcePropType }
> = {
  confirmed: { title: 'Booking Confirmed', sub: 'We will assign you a service partner soon', map: MAP.confirmed },
  assigned: { title: 'Service Partner Assigned', sub: 'will reach between ', strong: '9–10 am', map: MAP.assigned },
  on_the_way: { title: 'Service Partner is on the way', sub: 'will reach between ', strong: '9–10 am', map: MAP.route },
  delayed: {
    title: 'Service Partner is running late',
    sub: 'Expected arrival time ',
    strong: '10:30 AM',
    late: true,
    map: MAP.delayed,
  },
  arrived: { title: 'Service Partner has arrived', sub: 'He will start the service soon', map: MAP.arrived },
  in_progress: { title: 'Wash in progress', sub: 'About ', strong: '25 min left', map: MAP.arrived },
  completed: { title: 'Service Completed', sub: 'Your service has been completed.' },
  cancelled: { title: 'Booking Cancelled', sub: 'Your booking has been cancelled' },
};

const before = (s: TrackStage) => ['confirmed', 'assigned', 'on_the_way', 'delayed', 'arrived'].includes(s);
const live = (s: TrackStage) => s !== 'completed' && s !== 'cancelled';
const partnered = (s: TrackStage) => s !== 'confirmed' && s !== 'cancelled';

/** Which blocks a stage shows. */
export const showsFor = (s: TrackStage) => ({
  checklist: before(s),
  addOns: live(s),
  endOtp: live(s),
  instructions: before(s),
  partner: partnered(s),
  call: partnered(s) && s !== 'completed',
  rateTop: s === 'cancelled',
  rateAfterSaving: s === 'completed',
  calendar: s !== 'cancelled',
  recommended: s !== 'cancelled',
  manage: live(s),
});

/** SAMPLE booking details (the designs' booking). */
export const TRACK = {
  partner: 'Hamza',
  partnerPhoto: require('../../assets/booking/track/partner.png'),
  pin: '4324',
  endOtp: '4691',
  supportPhone: '+918045678900',
  address: 'C-045, Sector 63 Rd, C Block, Sector 63, Noida, Uttar Pradesh, 201301, India',
  addressShort: 'Home - 123, Block B, Parshvanth Greenville, Trimurti Nagar Chowk, Nagpur, Maharashtra',
  extras: [
    { name: 'Rat Repellent', qty: 1 },
    { name: 'Odour Eliminator', qty: 1 },
  ],
  /** Before discount, and how much the customer saved. */
  mrp: 1144,
  saved: 412,
  gst: 0.18,
};

export const CHECKLIST: {
  icon: 'car-outline' | 'water-outline' | 'shield-checkmark-outline' | 'business-outline' | 'call-outline';
  text: string;
}[] = [
  { icon: 'car-outline', text: 'Park your vehicle in an open area or shade' },
  { icon: 'water-outline', text: 'Keep 2 buckets of water ready' },
  { icon: 'shield-checkmark-outline', text: 'Remove valuables from the vehicle' },
  { icon: 'business-outline', text: 'Allow lift access (if applicable)' },
  { icon: 'call-outline', text: 'Be available to answer calls' },
];

export type AddOn = { id: string; name: string; price: number; mins: number; image: ImageSourcePropType };

const CAR = require('../../assets/booking/track/addon-car.png');
const THUMB = require('../../assets/booking/track/addon-thumb.png');

/** Add-ons that can still be added before the service starts (SAMPLE). */
export const ADD_ONS: AddOn[] = [
  { id: 'interior', name: 'Normal Interior Cleaning', price: 54, mins: 40, image: THUMB },
  { id: 'dashboard', name: 'Dashboard Polish', price: 99, mins: 30, image: THUMB },
  { id: 'tyre', name: 'Tyre Dressing', price: 79, mins: 20, image: THUMB },
  { id: 'rat', name: 'Rat Repellent', price: 149, mins: 10, image: THUMB },
  { id: 'odour', name: 'Odour Eliminator', price: 129, mins: 10, image: THUMB },
  { id: 'glass', name: 'Glass Coating', price: 199, mins: 25, image: THUMB },
];

/** "Recommended for you" — ask the partner to add these on the spot. */
export const RECOMMENDED: { name: string; mins: number; image: ImageSourcePropType }[] = [
  { name: 'Dashboard Polish', mins: 30, image: CAR },
  { name: 'Bucket Bike Ceramic Wash', mins: 15, image: CAR },
  { name: 'Tyre Dressing', mins: 20, image: CAR },
  { name: 'Rat Repellent', mins: 10, image: CAR },
];

export const TIPS = [20, 30, 50];

export const WRONG_TAGS = ['On-time arrival', 'Value for money', 'Partner behaviour', 'Attention to detail', 'Other'];

export const FAQS: { q: string; a: string }[] = [
  {
    q: 'Do I need to be at home during the wash?',
    a: 'No. Keep the vehicle accessible, share where the keys and water are in Service Instructions, and share the end OTP once the wash is done.',
  },
  {
    q: 'How much water does the wash need?',
    a: 'Two buckets are enough for a car. Our partner brings the cleaning products, tools and microfibre cloths.',
  },
  {
    q: 'Can I add services after booking?',
    a: 'Yes. Use Add ons before the service starts, or ask your partner to add recommended services on the spot.',
  },
  {
    q: 'What if my partner is late?',
    a: 'You will see the new arrival time here. If the delay is long, you can reschedule or cancel for free.',
  },
  {
    q: 'How do I cancel or reschedule?',
    a: 'Use Reschedule Booking / Cancel Booking on this page. There is no fee up to 6 hours before the slot.',
  },
];
