// What the booking dock above the tab bar shows. SAMPLE data for the prototype — replace with the
// bookings / cart / packs APIs. Raw fields in, copy out (see `dockCopy`), so the API only has to
// send status and numbers.

/** A booking happening today, in journey order. */
export type LiveStage = 'finding' | 'assigned' | 'on_the_way' | 'arrived' | 'in_progress';

export type DockItem =
  | {
      kind: 'live';
      id: string;
      stage: LiveStage;
      service: string;
      vehicle: string;
      expert?: string;
      /** Booked slot, e.g. "2:30 PM". */
      slot: string;
      etaMin?: number;
      minutesLeft?: number;
      /** 0–1, how far along the journey is. */
      progress?: number;
      /** Start code the customer reads out when the expert arrives. */
      otp?: string;
    }
  | { kind: 'payment'; id: string; service: string; amount: number }
  | { kind: 'rate'; id: string; service: string; expert: string }
  | {
      kind: 'upcoming';
      id: string;
      service: string;
      vehicle: string;
      day: string;
      time: string;
      /** Booked for today but the expert hasn't set out yet — track it, don't reschedule it. */
      today?: boolean;
    }
  | { kind: 'cart'; id: string; count: number }
  | { kind: 'pack'; id: string; pack: string; left: number; total: number; expiresInDays: number };

export type DockTone = 'live' | 'attention' | 'neutral';

export type DockCopy = {
  title: string;
  detail: string;
  cta?: string;
  /** Reschedule is a soft action; everything else is the main next step. */
  ctaSoft?: boolean;
  tone: DockTone;
  dismissible?: boolean;
};

const rupees = (n: number) => `₹${n.toLocaleString('en-IN')}`;
const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

/** One status line first (what's happening), then one supporting line (what / who). */
export function dockCopy(item: DockItem): DockCopy {
  switch (item.kind) {
    case 'live': {
      const who = item.expert ?? 'Your expert';
      switch (item.stage) {
        case 'finding':
          return { title: 'Finding your expert', detail: `${item.service} · ${item.slot}`, cta: 'View', tone: 'live' };
        case 'assigned':
          return {
            title: `${who} is assigned`,
            detail: `Arrives at ${item.slot} · ${item.service}`,
            cta: 'Track',
            tone: 'live',
          };
        case 'on_the_way':
          return {
            title: `Arriving in ${plural(item.etaMin ?? 0, 'min', 'min')}`,
            detail: `${who} · ${item.service}`,
            cta: 'Track',
            tone: 'live',
          };
        case 'arrived':
          return {
            title: `${who} has arrived`,
            detail: item.otp ? `Share start code ${item.otp}` : item.service,
            cta: 'Track',
            tone: 'attention',
          };
        case 'in_progress':
          return {
            title: 'Wash in progress',
            detail: `About ${plural(item.minutesLeft ?? 0, 'min', 'min')} left · ${item.vehicle}`,
            cta: 'Track',
            tone: 'live',
          };
      }
      break;
    }
    case 'payment':
      return {
        title: `Pay ${rupees(item.amount)} to finish`,
        detail: `${item.service} is done`,
        cta: 'Pay',
        tone: 'attention',
      };
    case 'rate':
      return {
        title: 'How was your wash?',
        detail: `Rate ${item.expert} · ${item.service}`,
        cta: 'Rate',
        tone: 'neutral',
        dismissible: true,
      };
    case 'upcoming':
      if (item.today) {
        return {
          title: `Today · ${item.time}`,
          detail: `Expert starts soon · ${item.service}`,
          cta: 'Track',
          tone: 'neutral',
        };
      }
      return {
        title: `${item.day} · ${item.time}`,
        detail: `${item.service} · ${item.vehicle}`,
        cta: 'Reschedule',
        ctaSoft: true,
        tone: 'neutral',
      };
    case 'cart':
      return {
        // Kept plain: no prices, just a reminder and how many services are waiting.
        title: 'Your cart is waiting',
        detail: `${plural(item.count, 'service', 'services')} added`,
        cta: 'Go to cart',
        tone: 'neutral',
        dismissible: true,
      };
    case 'pack':
      return {
        title: `${item.left} of ${plural(item.total, 'wash', 'washes')} left`,
        detail: `${item.pack} · expires in ${plural(item.expiresInDays, 'day', 'days')}`,
        cta: 'Schedule',
        tone: item.expiresInDays <= 3 ? 'attention' : 'neutral',
      };
  }
  return { title: '', detail: '', tone: 'neutral' };
}

const RANK: Record<DockItem['kind'], number> = { live: 0, payment: 1, rate: 2, upcoming: 3, cart: 4, pack: 5 };
// Today's booking that hasn't started yet sits right after live ones.
const rank = (i: DockItem) => (i.kind === 'upcoming' && i.today ? 0.5 : RANK[i.kind]);
const STAGE_RANK: Record<LiveStage, number> = { arrived: 0, in_progress: 1, on_the_way: 2, assigned: 3, finding: 4 };

/**
 * Most time-critical first: a live service (expert at the door before anything else), then a
 * booking later today, then money owed, then feedback, upcoming bookings, the cart nudge and finally packs.
 */
export function sortDock(items: DockItem[]) {
  return [...items].sort(
    (a, b) =>
      rank(a) - rank(b) || (a.kind === 'live' && b.kind === 'live' ? STAGE_RANK[a.stage] - STAGE_RANK[b.stage] : 0),
  );
}

/** A typical day: a wash on its way, one booked for later, a forgotten cart and a pack. */
export const SAMPLE_DOCK: DockItem[] = sortDock([
  { kind: 'pack', id: 'b1', pack: 'Starter Pack', left: 2, total: 4, expiresInDays: 10 },
  { kind: 'cart', id: 'cart', count: 2 },
  {
    kind: 'upcoming',
    id: 'w3',
    service: 'Interior Deep Cleaning',
    vehicle: 'Honda Elevate',
    day: 'Thu, 15 Oct',
    time: '10:00 AM',
  },
  {
    kind: 'live',
    id: 'w2',
    stage: 'on_the_way',
    service: 'Exterior Foam Wash',
    vehicle: 'Honda City',
    expert: 'Sandeep',
    slot: '2:30 PM',
    etaMin: 12,
    progress: 0.45,
  },
]);

/** Every state the dock can show, one card each — for the states preview screen. */
export const ALL_DOCK_STATES: { label: string; item: DockItem }[] = [
  {
    label: 'Live · finding an expert',
    item: {
      kind: 'live',
      id: 'w2',
      stage: 'finding',
      service: 'Exterior Foam Wash',
      vehicle: 'Honda City',
      slot: 'Today, 2:30 PM',
      progress: 0.08,
    },
  },
  {
    label: 'Live · expert assigned',
    item: {
      kind: 'live',
      id: 'w2',
      stage: 'assigned',
      service: 'Exterior Foam Wash',
      vehicle: 'Honda City',
      expert: 'Sandeep',
      slot: '2:30 PM',
      progress: 0.25,
    },
  },
  {
    label: 'Live · on the way',
    item: {
      kind: 'live',
      id: 'w2',
      stage: 'on_the_way',
      service: 'Exterior Foam Wash',
      vehicle: 'Honda City',
      expert: 'Sandeep',
      slot: '2:30 PM',
      etaMin: 12,
      progress: 0.45,
    },
  },
  {
    label: 'Live · arrived (needs you)',
    item: {
      kind: 'live',
      id: 'w2',
      stage: 'arrived',
      service: 'Exterior Foam Wash',
      vehicle: 'Honda City',
      expert: 'Sandeep',
      slot: '2:30 PM',
      otp: '4821',
      progress: 0.6,
    },
  },
  {
    label: 'Live · in progress',
    item: {
      kind: 'live',
      id: 'w1',
      stage: 'in_progress',
      service: 'Ceramic Maintenance Wash',
      vehicle: 'Honda WR-V',
      expert: 'Sandeep',
      slot: '11:15 AM',
      minutesLeft: 25,
      progress: 0.75,
    },
  },
  {
    label: 'Today · expert not started yet',
    item: {
      kind: 'upcoming',
      id: 'w3',
      service: 'Interior Deep Cleaning',
      vehicle: 'Honda Elevate',
      day: 'Today',
      time: '4:00 PM',
      today: true,
    },
  },
  { label: 'Payment due', item: { kind: 'payment', id: 'w1', service: 'Ceramic Maintenance Wash', amount: 534 } },
  {
    label: 'Rate the service',
    item: { kind: 'rate', id: 'w1', service: 'Ceramic Maintenance Wash', expert: 'Sandeep' },
  },
  {
    label: 'Upcoming booking',
    item: {
      kind: 'upcoming',
      id: 'w3',
      service: 'Interior Deep Cleaning',
      vehicle: 'Honda Elevate',
      day: 'Tomorrow',
      time: '10:00 AM',
    },
  },
  { label: 'Cart left behind', item: { kind: 'cart', id: 'cart', count: 2 } },
  {
    label: 'Pack with washes left',
    item: { kind: 'pack', id: 'b1', pack: 'Starter Pack', left: 2, total: 4, expiresInDays: 10 },
  },
  {
    label: 'Pack expiring soon',
    item: { kind: 'pack', id: 'b1', pack: 'Monthly Pack', left: 1, total: 4, expiresInDays: 2 },
  },
];
