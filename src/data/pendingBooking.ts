import type { NotifData } from './notifications';
import type { Booking } from '../store/AppStore';

// The booking Checkout hands to Payment (Pay Now) or confirms straight away (Pay Later).

export type PendingBooking = {
  booking: Omit<Booking, 'id' | 'status' | 'createdAt' | 'payLater' | 'paidVia'>;
  notif: Partial<NotifData>;
  /** When the service starts, for the reminder notification. */
  start: number;
  payable: number;
  saved: number;
  /** "Wash Booking" or "Package Booking", shown on the payment screen. */
  kind: string;
};

let pending: PendingBooking | null = null;

export const setPendingBooking = (p: PendingBooking) => {
  pending = p;
};
export const getPendingBooking = () => pending;
export const clearPendingBooking = () => {
  pending = null;
};

/** "#HW-28A9F" from a booking id, as Bookings shows it. */
export const bookingRef = (id: string) => `#HW-${id.slice(-5).toUpperCase()}`;
