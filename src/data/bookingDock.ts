// What the booking dock above the tab bar shows. SAMPLE data for the prototype — replace with the
// bookings / cart / packs APIs. Raw fields in, copy out (see `dockCopy`), so the API only has to
// send status and numbers.

/**
 * Today's service, step by step: booked for today → expert on the way → expert at the car →
 * washing. Only today's bookings appear in the dock; later days live in Bookings.
 */
export type LiveStage = 'scheduled' | 'on_the_way' | 'arrived' | 'in_progress';

export type DockItem =
  | {
      kind: 'live';
      id: string;
      stage: LiveStage;
      service: string;
      vehicle: string;
      expert?: string;
      /** Booked slot today, e.g. "2:30 PM". */
      slot: string;
      etaMin?: number;
      minutesLeft?: number;
      /** 0–1, how far along the journey is. */
      progress?: number;
      /** Service end code — the customer shares it with the expert to close the service. */
      endCode?: string;
    }
  | { kind: 'rate'; id: string; service: string; expert: string }
  | { kind: 'cart'; id: string; count: number }
  | { kind: 'pack'; id: string; pack: string; left: number; total: number; expiresInDays: number };

export type DockTone = 'live' | 'neutral';

export type DockCopy = {
  title: string;
  detail: string;
  cta?: string;
  tone: DockTone;
  dismissible?: boolean;
};

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

/** One status line first (what's happening), then one supporting line (what / who). */
export function dockCopy(item: DockItem): DockCopy {
  switch (item.kind) {
    case 'live': {
      const who = item.expert ?? 'Your expert';
      switch (item.stage) {
        case 'scheduled':
          return {
            title: `Today · ${item.slot}`,
            detail: `Expert starts soon · ${item.service}`,
            cta: 'Track',
            tone: 'neutral',
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
            detail: item.endCode ? `Service end code ${item.endCode}` : item.service,
            cta: 'Track',
            tone: 'live',
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
    case 'rate':
      return {
        title: 'How was your wash?',
        detail: `Rate ${item.expert} · ${item.service}`,
        cta: 'Rate',
        tone: 'neutral',
        dismissible: true,
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
        tone: 'neutral',
      };
  }
  return { title: '', detail: '', tone: 'neutral' };
}

const RANK: Record<DockItem['kind'], number> = { live: 0, rate: 1, cart: 2, pack: 3 };
// The furthest-along service first: the expert at your car beats one still on the way.
const STAGE_RANK: Record<LiveStage, number> = { in_progress: 0, arrived: 1, on_the_way: 2, scheduled: 3 };

/** Today's service first (furthest along), then the rating, the cart nudge and finally packs. */
export function sortDock(items: DockItem[]) {
  return [...items].sort(
    (a, b) =>
      RANK[a.kind] - RANK[b.kind] ||
      (a.kind === 'live' && b.kind === 'live' ? STAGE_RANK[a.stage] - STAGE_RANK[b.stage] : 0),
  );
}

const TODAY = {
  kind: 'live',
  id: 'w2',
  service: 'Exterior Foam Wash',
  vehicle: 'Honda City',
  expert: 'Sandeep',
} as const;

export type DockEntry = { key: string; label: string; item: DockItem };

/**
 * Preview build: every state the dock can show, with sample data, in the exact order a day goes —
 * booked today → expert on the way → arrived → washing → rate, then the cart reminder and packs.
 * Each one can be switched off in Profile → Edit profile → Configuration.
 */
export const DOCK_STATES: DockEntry[] = [
  { key: 'today', label: 'Today · expert not started yet', item: { ...TODAY, stage: 'scheduled', slot: '2:30 PM' } },
  {
    key: 'on_the_way',
    label: 'Expert on the way',
    item: { ...TODAY, stage: 'on_the_way', slot: '2:30 PM', etaMin: 12, progress: 0.45 },
  },
  {
    key: 'arrived',
    label: 'Expert arrived',
    item: { ...TODAY, stage: 'arrived', slot: '2:30 PM', endCode: '4821', progress: 0.6 },
  },
  {
    key: 'in_progress',
    label: 'Wash in progress',
    item: { ...TODAY, stage: 'in_progress', slot: '2:30 PM', minutesLeft: 25, progress: 0.75 },
  },
  {
    key: 'rate',
    label: 'Rate the service',
    item: { kind: 'rate', id: 'w2', service: 'Exterior Foam Wash', expert: 'Sandeep' },
  },
  { key: 'cart', label: 'Cart left behind', item: { kind: 'cart', id: 'cart', count: 2 } },
  {
    key: 'pack',
    label: 'Pack with washes left',
    item: { kind: 'pack', id: 'b1', pack: 'Starter Pack', left: 2, total: 4, expiresInDays: 10 },
  },
];
