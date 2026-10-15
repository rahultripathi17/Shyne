import { washService } from '../data/bookingFlow';
import { useAppStore } from '../store/AppStore';
import { sendNotification } from './notifications';

/**
 * Preview build: move one of your bookings to its next step (long-press in the dock or My Bookings).
 * When a Pay Later wash is completed, the "Payment due" notification goes out, as it would live.
 */
export function useAdvanceBooking() {
  const { advanceBooking, bookings, notifPrefs } = useAppStore();
  return (id: string) => {
    const before = bookings.find((b) => b.id === id);
    const now = advanceBooking(id);
    if (before?.payLater && before.status === 'Confirmed' && now === 'Wash completed') {
      void sendNotification(
        'payment_due',
        {
          bookingId: id,
          service: before.title ?? washService(before.serviceId)?.name ?? 'wash',
          amount: before.total - (before.paidUpfront ?? 0),
        },
        { prefs: notifPrefs },
      );
    }
    return now;
  };
}
