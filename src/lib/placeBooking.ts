import { router } from 'expo-router';

import { clearPendingBooking, type PendingBooking } from '../data/pendingBooking';
import { useAppStore } from '../store/AppStore';
import { notifyBookingPlaced } from './notifications';

/**
 * Saves the booking, sends its notifications and opens Booking Confirmed.
 * `paidVia` for Pay Now (e.g. "UPI"), `later` for Pay Later.
 */
export function usePlaceBooking() {
  const { addBooking, notifPrefs } = useAppStore();
  return (pending: PendingBooking, payment: { paidVia?: string; later?: boolean }) => {
    const id = addBooking({ ...pending.booking, payLater: payment.later, paidVia: payment.paidVia });
    void notifyBookingPlaced({ ...pending.notif, bookingId: id }, new Date(pending.start), notifPrefs);
    clearPendingBooking();
    // Close the booking screens (Car Services → Payment) so Back from here goes to the app, not checkout.
    if (router.canDismiss()) router.dismissAll();
    router.push({
      pathname: '/booking/confirmed',
      params: {
        id,
        saved: String(pending.saved),
        amount: String(pending.payable),
        pay: payment.later ? 'later' : (payment.paidVia ?? 'UPI'),
      },
    });
  };
}
