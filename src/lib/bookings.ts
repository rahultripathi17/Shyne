import { useMemo } from 'react';

import { type BookingItem, SAMPLE_BOOKINGS, type Tone } from '../data/bookingsDemo';
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

/** What the date box is about, written above the date so it reads at a glance. */
export const WHEN_CAPTION: Record<BookingItem['when']['icon'], string> = {
  calendar: 'Scheduled for',
  truck: 'Delivery',
  receipt: 'Date',
  pickup: 'Pickup',
};

const fmtDate = (iso: string) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });

/** Wash bookings made in the app, shown the same way as the rest. */
function fromStore(b: Booking): BookingItem {
  const service = getService(b.serviceId);
  const car = b.car.type === 'bike' ? 'My Bike' : [b.car.brandName, b.car.model].filter(Boolean).join(' ');
  const done = b.status !== 'Confirmed';
  return {
    id: b.id,
    vertical: 'washes',
    ref: `#HW-${b.id.slice(-5).toUpperCase()}`,
    status: b.status === 'Confirmed' ? 'Placed' : b.status,
    tone: b.status === 'Confirmed' ? 'pending' : b.status === 'Completed' ? 'done' : 'closed',
    eyebrow: 'One-time wash',
    title: service?.name ?? 'Car wash',
    meta: [car, b.car.plate].filter(Boolean).join(' · '),
    when: { icon: 'calendar', title: `${fmtDate(b.date)} · ${b.slot}`, sub: b.address },
    placed: `Booked ${new Date(b.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}`,
    amount: b.total,
    action: done ? 'Book again' : 'View details',
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
