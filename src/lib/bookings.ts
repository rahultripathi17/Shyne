import { useMemo } from 'react';

import { type BookingItem, SAMPLE_BOOKINGS, type Tone } from '../data/bookingsDemo';
import { washService } from '../data/bookingFlow';
import { getService } from '../data/services';
import { type Booking, useAppStore } from '../store/AppStore';

/** Status colours: one family per meaning, soft background with a readable text colour. */
export const TONES: Record<Tone, { bg: string; fg: string }> = {
  progress: { bg: '#F0EBFF', fg: '#5B3CC4' }, // service started / in progress / processing
  transit: { bg: '#E7F1FF', fg: '#1A5FD0' }, // on the way / shipped / out for delivery
  pending: { bg: '#FFF3DA', fg: '#9A5B00' }, // placed / assigned / scheduled
  active: { bg: '#E5F5EC', fg: '#17784A' }, // plan or pack in use
  attention: { bg: '#FFE9E9', fg: '#C22F2F' }, // payment due / on hold
  done: { bg: '#E9F5EF', fg: '#2B7A52' }, // completed / delivered / cleared
  closed: { bg: '#F1F2F4', fg: '#5F636B' }, // cancelled / expired
};

/** "Today, 11 Oct" for today, otherwise "Mon, 12 Oct". */
const fmtDate = (iso: string) => {
  const date = new Date(`${iso}T00:00:00`);
  const dayMonth = date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  const isToday = iso === new Date().toISOString().slice(0, 10);
  return `${isToday ? 'Today' : date.toLocaleDateString('en-IN', { weekday: 'short' })}, ${dayMonth}`;
};

// A live booking's stage, as the status Bookings and the tracking page read.
const STAGE_STATUS: Record<NonNullable<Booking['stage']> | 'none', { status: string; tone: Tone }> = {
  none: { status: 'Placed', tone: 'pending' },
  on_the_way: { status: 'On the way', tone: 'transit' },
  arrived: { status: 'Arrived', tone: 'transit' },
  in_progress: { status: 'Ongoing', tone: 'progress' },
};

/** Wash bookings made in the app, shown the same way as the rest. */
function fromStore(b: Booking): BookingItem {
  const wash = washService(b.serviceId);
  const addOns = (wash?.addOns ?? []).filter((a) => b.addOnIds.includes(a.id));
  const service = getService(b.serviceId);
  const car = b.car.type === 'bike' ? 'My Bike' : [b.car.brandName, b.car.model].filter(Boolean).join(' ');
  const done = b.status !== 'Confirmed';
  const live = STAGE_STATUS[b.status === 'Confirmed' ? (b.stage ?? 'none') : 'none'];
  return {
    id: b.id,
    vertical: 'washes',
    ref: `#HW-${b.id.slice(-5).toUpperCase()}`,
    status: b.status === 'Confirmed' ? live.status : b.status,
    tone: b.status === 'Confirmed' ? live.tone : b.status === 'Completed' ? 'done' : 'closed',
    eyebrow: 'One-time wash',
    title: b.title ?? wash?.name ?? service?.name ?? 'Car wash',
    photo: wash?.image,
    note: addOns.length ? `${addOns.length} add-on${addOns.length > 1 ? 's' : ''} included` : undefined,
    addOns: addOns.length ? addOns.map((a) => ({ name: a.name, qty: 1 })) : undefined,
    meta: [car, b.car.plate].filter(Boolean).join(' · '),
    when: { icon: 'calendar', title: `${fmtDate(b.date)} · ${b.slot}`, sub: b.address },
    placed: `Booked ${new Date(b.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}`,
    amount: b.total,
    amountDue: b.payLater ? true : undefined,
    due: b.payLater ? b.total - (b.paidUpfront ?? 0) : undefined,
    paidUpfront: b.paidUpfront,
    address: b.address,
    bookedFor: b.bookedFor,
    contact: b.contact,
    action: done ? 'Book again' : 'Track service',
    own: true,
    primary: false,
    history: done,
  };
}

/** Bookings made in the app first, then the sample bookings for every vertical. */
export function useAllBookings() {
  const { bookings } = useAppStore();
  return useMemo(() => [...bookings.map(fromStore), ...SAMPLE_BOOKINGS], [bookings]);
}

/** Actions that open the full booking page; the rest (pay, reorder, renew…) come later. */
export const opensDetails = (item: BookingItem) => /^(Track|View)/.test(item.action);

// What each status means to the customer, worded per vertical ("Placed" is a confirmed wash but a
// placed order). The raw status still drives the journey steps.
const STATUS_LABEL: Partial<Record<BookingItem['vertical'], Record<string, string>>> = {
  washes: {
    Placed: 'Booking confirmed',
    Assigned: 'Partner assigned',
    'On the way': 'Partner on the way',
    Arrived: 'Partner arrived',
    Ongoing: 'Wash in progress',
    'Service started': 'Wash in progress',
    Completed: 'Wash completed',
  },
  society: { Active: 'Plan active', Expired: 'Plan expired' },
  bundles: { Active: 'Pack active', 'In use': 'Pack in use', Expired: 'Pack expired' },
  products: { Placed: 'Order placed' },
  challans: { 'Payment pending': 'Payment due', Processing: 'Payment processing', Cleared: 'Challan cleared' },
  garage: { 'In progress': 'Service in progress', Scheduled: 'Pickup scheduled', Completed: 'Service completed' },
  qr: { 'On hold': 'Delivery on hold' },
};

export const statusLabel = (item: BookingItem) => STATUS_LABEL[item.vertical]?.[item.status] ?? item.status;
