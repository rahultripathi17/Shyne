// Every notification Hoora sends, in the order a customer meets them. Only moments that change what
// the customer does next, or confirm something they care about — no cart or marketing nudges.
//
// Copy is built from data (`build`), so the backend only sends a key and the booking's fields; the
// same template serves a local notification today and a server push later.

export type NotifKey =
  | 'booking_confirmed'
  | 'reminder'
  | 'on_the_way'
  | 'arrived'
  | 'started'
  | 'completed'
  | 'payment_due'
  | 'payment_done'
  | 'rate'
  | 'cancelled'
  | 'referral_points'
  | 'prize_won'
  | 'pack_expiring';

export type NotifGroup = 'Booking' | 'Payment' | 'Rewards' | 'Packs';

/** Fields a notification can use. The backend fills what the template needs. */
export type NotifData = {
  bookingId: string;
  service: string;
  vehicle: string;
  expert: string;
  /** e.g. "today at 2:30 PM" */
  when: string;
  slot: string;
  etaMin: number;
  minutes: number;
  endCode: string;
  amount: number;
  friend: string;
  points: number;
  prize: string;
  rank: number;
  month: string;
  pack: string;
  left: number;
  expiresOn: string;
};

export type NotifDef = {
  key: NotifKey;
  group: NotifGroup;
  /** When it is sent, in plain words (Configuration). */
  trigger: string;
  /** Shown above everything else on iOS and breaks through Focus (like Uber's "Time sensitive"). */
  timeSensitive?: boolean;
  build: (d: NotifData) => { title: string; body: string };
  /** Where a tap opens. */
  url: (d: NotifData) => string;
};

const rupees = (n: number) => `₹${n.toLocaleString('en-IN')}`;
const booking = (d: NotifData) => `/booking/${d.bookingId}`;

export const NOTIFICATIONS: NotifDef[] = [
  {
    key: 'booking_confirmed',
    group: 'Booking',
    trigger: 'When a booking is placed',
    build: (d) => ({ title: 'Booking confirmed', body: `${d.service} for your ${d.vehicle}, ${d.when}.` }),
    url: booking,
  },
  {
    key: 'reminder',
    group: 'Booking',
    trigger: '1 hour before the slot',
    build: (d) => ({
      title: `Your wash is at ${d.slot}`,
      body: `Keep your ${d.vehicle} accessible. ${d.expert} will be there on time.`,
    }),
    url: booking,
  },
  {
    key: 'on_the_way',
    group: 'Booking',
    trigger: 'When the expert starts driving to you',
    timeSensitive: true,
    build: (d) => ({ title: `${d.expert} is on the way`, body: `Arriving in ${d.etaMin} min for your ${d.service}.` }),
    url: booking,
  },
  {
    key: 'arrived',
    group: 'Booking',
    trigger: 'When the expert reaches your car',
    timeSensitive: true,
    build: (d) => ({ title: `${d.expert} has arrived`, body: `Meet him at your ${d.vehicle}.` }),
    url: booking,
  },
  {
    key: 'started',
    group: 'Booking',
    trigger: 'When the wash starts',
    build: (d) => ({ title: 'Your wash has started', body: `About ${d.minutes} min. We’ll tell you when it’s done.` }),
    url: booking,
  },
  {
    key: 'completed',
    group: 'Booking',
    trigger: 'When the wash is finished',
    build: (d) => ({
      title: 'Your wash is done',
      body: `Your ${d.vehicle} is sparkling. Share end code ${d.endCode} to close the service.`,
    }),
    url: booking,
  },
  {
    key: 'payment_due',
    group: 'Payment',
    trigger: 'Pay Later booking, when the service is done',
    timeSensitive: true,
    build: (d) => ({
      title: `Complete your ${rupees(d.amount)} payment`,
      body: `Your Pay Later for ${d.service} is due.`,
    }),
    url: booking,
  },
  {
    key: 'payment_done',
    group: 'Payment',
    trigger: 'When a payment goes through',
    build: (d) => ({ title: 'Payment received', body: `${rupees(d.amount)} paid. Your invoice is ready in Bookings.` }),
    url: booking,
  },
  {
    key: 'rate',
    group: 'Booking',
    trigger: 'After the service is closed',
    build: (d) => ({
      title: 'Rate your wash',
      body: `Thanks for booking with ${d.expert}! Rate your wash, and you can also add a tip.`,
    }),
    url: booking,
  },
  {
    key: 'cancelled',
    group: 'Booking',
    trigger: 'When a booking is cancelled',
    build: (d) => ({
      title: 'Booking cancelled',
      body: `Your ${d.service} is cancelled. ${rupees(d.amount)} refund reaches you in 3–5 days.`,
    }),
    url: () => '/bookings',
  },
  {
    key: 'referral_points',
    group: 'Rewards',
    trigger: 'When a friend completes their first wash',
    build: (d) => ({
      title: `You earned ${d.points} Hoora Points`,
      body: `${d.friend} booked their first wash with your code.`,
    }),
    url: () => '/refer/points',
  },
  {
    key: 'prize_won',
    group: 'Rewards',
    trigger: 'When the monthly leaderboard closes',
    build: (d) => ({
      title: `You won a ${d.prize}`,
      body: `You finished #${d.rank} in ${d.month}. Tap to claim it.`,
    }),
    url: () => '/refer/leaderboard',
  },
  {
    key: 'pack_expiring',
    group: 'Packs',
    trigger: '3 days before a pack expires',
    build: (d) => ({
      title: `${d.left} washes left in your ${d.pack}`,
      body: `Use them before ${d.expiresOn}.`,
    }),
    url: () => '/wash',
  },
];

export const notifDef = (key: NotifKey) => NOTIFICATIONS.find((n) => n.key === key)!;

/** A booking day, start to finish — "Play a booking day" in Configuration sends these in order. */
export const BOOKING_DAY: NotifKey[] = [
  'booking_confirmed',
  'reminder',
  'on_the_way',
  'arrived',
  'started',
  'completed',
  'payment_due',
  'payment_done',
  'rate',
];

/** SAMPLE values for previews (the dock's sample booking). */
export const SAMPLE_NOTIF: NotifData = {
  bookingId: 'w2',
  service: 'Exterior Foam Wash',
  vehicle: 'Honda City',
  expert: 'Sandeep',
  when: 'today at 2:30 PM',
  slot: '2:30 PM',
  etaMin: 12,
  minutes: 40,
  endCode: '4821',
  amount: 549,
  friend: 'Priya',
  points: 90,
  prize: 'Premium Car Duster',
  rank: 3,
  month: 'September',
  pack: 'Starter Pack',
  left: 2,
  expiresOn: '25 Oct',
};
