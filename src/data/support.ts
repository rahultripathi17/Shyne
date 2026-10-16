import { useSyncExternalStore } from 'react';

// Help & Support (Dev File → "Help & Support" page): what a ticket can be about, FAQs, and the
// customer's tickets. SAMPLE data for the prototype — replace with the support / ticketing API.

export const SUPPORT = {
  /** From the Figma invoice footer (HOORA Technologies Pvt. Ltd.). */
  email: 'support@hoora.in',
  phone: '+917350982181',
  agent: 'Hoora Support',
};

export type ServiceKey = 'wash' | 'products' | 'garage' | 'insurance' | 'qr' | 'roadside' | 'challan' | 'other';

/** “Select a service” — icon names are Ionicons, except `mci:` (MaterialCommunityIcons). */
export const SERVICES: { key: ServiceKey; label: string; short: string; icon: string }[] = [
  { key: 'wash', label: 'Car / Bike Wash', short: 'Car Wash', icon: 'car-outline' },
  { key: 'products', label: 'Products & Accessories', short: 'Products', icon: 'bag-handle-outline' },
  { key: 'garage', label: 'Car Servicing & Repair', short: 'Garage', icon: 'construct-outline' },
  { key: 'insurance', label: 'Insurance', short: 'Insurance', icon: 'shield-checkmark-outline' },
  { key: 'qr', label: 'Connect QR', short: 'Connect QR', icon: 'qr-code-outline' },
  { key: 'roadside', label: 'Roadside Assistance', short: 'Roadside', icon: 'mci:tow-truck' },
  { key: 'challan', label: 'Clear My Challan', short: 'Challan', icon: 'document-text-outline' },
  { key: 'other', label: 'Others', short: 'Other', icon: 'help-circle-outline' },
];

/** “Select an issue category” → “Select a reason”. */
export const ISSUES: { category: string; reasons: string[] }[] = [
  {
    category: 'Booking information',
    reasons: [
      'Booking Status',
      'Cancel Booking',
      'Reschedule Booking',
      'Change Address',
      'Service Partner Not Assigned',
    ],
  },
  {
    category: 'Live service issues',
    reasons: [
      'Partner is running late',
      'Partner asking for extra money',
      'Service not done properly',
      'Damage to my vehicle',
    ],
  },
  {
    category: 'Payment and refund related issues',
    reasons: [
      'Refund not received',
      'Payment failed but money deducted',
      'Charged more than shown',
      'Pay Later amount',
    ],
  },
  {
    category: 'Hoora Points and Wallet related issues',
    reasons: ['Points not credited', 'Referral reward not received', 'Unable to use points'],
  },
  {
    category: 'Monthly package related queries',
    reasons: ['Washes remaining', 'Pause or cancel package', 'Change wash days'],
  },
  {
    category: 'App-related issues',
    reasons: ['Unable to login', 'App not working', 'Notifications', 'Something else'],
  },
];

export const FAQS: { q: string; a: string }[] = [
  {
    q: 'What services does Hoora offer?',
    a: 'Doorstep car and bike washes, society packs, garage service with pickup and drop, car care products, challan payment, insurance and Connect QR tags.',
  },
  {
    q: 'What is included in a standard car cleaning service?',
    a: 'Bucket Wash - Basic covers an exterior ceramic wash and tyre polish. Add interior cleaning, dashboard polish and more at checkout.',
  },
  {
    q: 'Are Hoora professionals trained and verified?',
    a: 'Yes. Service partners are verified and trained by Hoora before they take bookings.',
  },
  {
    q: 'Can I schedule a service for a specific time?',
    a: 'Yes. Pick a 1-hour slot between 7 AM and 7 PM over the next 7 days, or choose Instant for a partner in about 30 minutes.',
  },
];

// ——— Tickets ———

export type TicketStatus = 'Open' | 'Resolved' | 'Closed';
export type Message = {
  id: string;
  from: 'me' | 'agent' | 'system';
  name?: string;
  text?: string;
  image?: string;
  at: number;
};
export type Ticket = {
  id: string;
  service: ServiceKey;
  category: string;
  reason: string;
  status: TicketStatus;
  createdAt: number;
  /** Raised from a booking. */
  booking?: { ref: string; title: string };
  messages: Message[];
};

export const ticketTitle = (t: Ticket) =>
  `${SERVICES.find((s) => s.key === t.service)?.short ?? 'Support'} - ${t.reason}`;

/** "15 Mar 2026 • 02:15 pm" */
export const ticketDate = (ms: number) => {
  const d = new Date(ms);
  return `${d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} • ${d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`;
};

const day = 24 * 60 * 60 * 1000;
const now = Date.now();
const at = (daysAgo: number, h: number, m: number) => {
  const d = new Date(now - daysAgo * day);
  d.setHours(h, m, 0, 0);
  return d.getTime();
};
let seq = 0;
const msg = (from: Message['from'], text: string, time: number, name?: string): Message => ({
  id: `m${++seq}`,
  from,
  text,
  at: time,
  name,
});

let tickets: Ticket[] = [
  {
    id: '36482',
    service: 'wash',
    category: 'Live service issues',
    reason: 'Partner asking for extra money',
    status: 'Open',
    createdAt: at(1, 10, 36),
    booking: { ref: '#HW-28472', title: 'Pressure Wash - Premium' },
    messages: [
      msg(
        'me',
        'Hello, I have an issue with my recent booking. The partner is asking for extra money beyond what was shown in the app.',
        at(1, 10, 36),
      ),
      msg(
        'agent',
        'Hello! We’re sorry to hear about this. Can you please share your booking ID?',
        at(1, 10, 38),
        'Surya Pratap',
      ),
      msg('me', 'Yes, my booking ID is HW-28472.', at(1, 10, 39)),
      msg(
        'agent',
        'Thanks, I’ve found your booking. All charges are included in the price you paid — please don’t pay anything extra. We’re speaking to the partner now.',
        at(1, 10, 41),
        'Surya Pratap',
      ),
    ],
  },
  {
    id: '36421',
    service: 'wash',
    category: 'Payment and refund related issues',
    reason: 'Refund not received',
    status: 'Open',
    createdAt: at(3, 14, 15),
    messages: [
      msg('me', 'My booking was cancelled but the refund hasn’t reached my account yet.', at(3, 14, 15)),
      msg(
        'agent',
        'We’ve raised it with the payments team. Refunds reach the original payment method in 5–7 working days.',
        at(3, 14, 32),
        'Hoora Support',
      ),
    ],
  },
  {
    id: '36399',
    service: 'challan',
    category: 'Booking information',
    reason: 'Wrong vehicle assigned',
    status: 'Open',
    createdAt: at(4, 11, 30),
    messages: [msg('me', 'The challan check is showing a different vehicle number from mine.', at(4, 11, 30))],
  },
  {
    id: '35910',
    service: 'garage',
    category: 'Payment and refund related issues',
    reason: 'Refund not received',
    status: 'Resolved',
    createdAt: at(12, 16, 5),
    messages: [
      msg('me', 'I was charged for a garage pickup that never happened.', at(12, 16, 5)),
      msg(
        'agent',
        'Sorry about that — we’ve refunded ₹499 to your UPI. You should see it within 48 hours.',
        at(12, 16, 40),
        'Hoora Support',
      ),
      msg('system', 'This conversation is marked as Resolved', at(11, 10, 0)),
    ],
  },
  {
    id: '35577',
    service: 'other',
    category: 'App-related issues',
    reason: 'Unable to login',
    status: 'Closed',
    createdAt: at(20, 9, 45),
    messages: [
      msg('me', 'I’m not getting the OTP to log in.', at(20, 9, 45)),
      msg('agent', 'We’ve fixed an SMS delay on our side. Please try again now.', at(20, 10, 2), 'Hoora Support'),
      msg('system', 'This conversation is marked as Closed', at(19, 9, 0)),
    ],
  },
];

const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());
const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
};
const read = () => tickets;

/** All tickets, newest first. */
export const useTickets = () => useSyncExternalStore(subscribe, read, read);

const update = (id: string, fn: (t: Ticket) => Ticket) => {
  tickets = tickets.map((t) => (t.id === id ? fn(t) : t));
  emit();
};

export function raiseTicket(input: {
  service: ServiceKey;
  category: string;
  reason: string;
  description: string;
  images: string[];
  booking?: Ticket['booking'];
}): string {
  const id = String(Math.max(...tickets.map((t) => Number(t.id))) + 1);
  const t0 = Date.now();
  const opening = input.description.trim() || `${input.category}: ${input.reason}`;
  const messages: Message[] = [
    msg('me', opening, t0),
    ...input.images.map((image, i) => ({ id: `m${++seq}`, from: 'me' as const, image, at: t0 + i + 1 })),
    msg(
      'agent',
      'Thanks for reaching out. We’ve got your ticket and will reply here shortly.',
      t0 + 1000,
      SUPPORT.agent,
    ),
  ];
  tickets = [
    {
      id,
      service: input.service,
      category: input.category,
      reason: input.reason,
      status: 'Open',
      createdAt: t0,
      booking: input.booking,
      messages,
    },
    ...tickets,
  ];
  emit();
  return id;
}

export function sendMessage(id: string, content: { text?: string; image?: string }) {
  update(id, (t) => ({ ...t, messages: [...t.messages, { id: `m${++seq}`, from: 'me', ...content, at: Date.now() }] }));
  // Prototype: a support reply arrives a moment later.
  setTimeout(
    () =>
      update(id, (t) =>
        t.status === 'Open'
          ? {
              ...t,
              messages: [
                ...t.messages,
                msg(
                  'agent',
                  'Thanks, we’ve noted this. A support specialist will update you here.',
                  Date.now(),
                  SUPPORT.agent,
                ),
              ],
            }
          : t,
      ),
    1500,
  );
}

export function setTicketStatus(id: string, status: TicketStatus) {
  update(id, (t) => ({
    ...t,
    status,
    messages: [
      ...t.messages,
      msg('system', status === 'Open' ? 'Ticket reopened' : `This conversation is marked as ${status}`, Date.now()),
    ],
  }));
}
