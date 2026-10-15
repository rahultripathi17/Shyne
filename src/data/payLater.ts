// Pay Later wording, in one place so every screen says the same thing.
//
// The rule: ₹99 confirms the booking; the rest can be paid at any point until the wash is complete.
// So while the service is still ahead or under way we nudge gently ("left to pay… before your wash
// is complete"), and once it's done we ask clearly and politely ("Payment due… please pay to close
// your booking"). Each message carries the amount and leads straight to paying.

const rupees = (n: number) => `₹${n.toLocaleString('en-IN')}`;

/** `open`: booked, partner on the way or washing — pay any time until it's done. `due`: wash complete. */
export type PayPhase = 'open' | 'due';

export const payPhase = (completed: boolean): PayPhase => (completed ? 'due' : 'open');

/** The terms, as Checkout and Payment explain them. */
export const PAY_LATER_TERMS = 'Pay the rest anytime before your wash is complete';

export function payLaterCopy(phase: PayPhase, amount: number, paidUpfront?: number) {
  const paid = paidUpfront ? `${rupees(paidUpfront)} paid` : undefined;
  return phase === 'open'
    ? {
        /** Card / dock headline. */
        title: `${rupees(amount)} left to pay`,
        /** One supporting line. */
        line: 'Pay now, or anytime before your wash is complete',
        /** Compact, for a list row: "₹505 to pay · ₹99 paid". */
        short: [`${rupees(amount)} to pay`, paid].filter(Boolean).join(' · '),
      }
    : {
        title: `Payment due · ${rupees(amount)}`,
        line: 'Your wash is complete. Please pay to close your booking',
        short: [`${rupees(amount)} due now`, paid].filter(Boolean).join(' · '),
      };
}
