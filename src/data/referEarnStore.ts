import { useSyncExternalStore } from 'react';

import { CATALOG, EARNED, type TierId } from './referEarn';

// What the user has done in Rewards this session. In memory (SAMPLE, resets on reload) until the
// rewards backend owns it.

export type Redemption = {
  id: string;
  itemId: string;
  name: string;
  points: number;
  date: string;
  /** Voucher code, for fuel vouchers. */
  code?: string;
};

type RewardsState = {
  /** Leagues whose reward has been claimed. */
  claimedTiers: TierId[];
  /** Last month's leader-board prize. */
  prizeClaimed: boolean;
  redemptions: Redemption[];
};

let state: RewardsState = { claimedTiers: ['bronze'], prizeClaimed: false, redemptions: [] };
const listeners = new Set<() => void>();

function set(patch: Partial<RewardsState>) {
  state = { ...state, ...patch };
  listeners.forEach((l) => l());
}

export const claimTier = (id: TierId) => {
  if (!state.claimedTiers.includes(id)) set({ claimedTiers: [...state.claimedTiers, id] });
};

export const claimPrize = () => set({ prizeClaimed: true });

const today = () => new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });

/** Spends points on a catalog item. Returns the redemption (with a voucher code when relevant). */
export function redeem(itemId: string): Redemption | null {
  const item = CATALOG.find((c) => c.id === itemId);
  if (!item || balanceOf(state) < item.cost) return null;
  const redemption: Redemption = {
    id: `${itemId}-${Date.now()}`,
    itemId,
    name: item.name,
    points: item.cost,
    date: today(),
    code:
      item.kind === 'voucher'
        ? `HRA-${Math.random().toString(36).slice(2, 6).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`
        : undefined,
  };
  set({ redemptions: [redemption, ...state.redemptions] });
  return redemption;
}

const balanceOf = (s: RewardsState) => EARNED - s.redemptions.reduce((sum, r) => sum + r.points, 0);

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
};
const get = () => state;

export function useRewardsState() {
  const s = useSyncExternalStore(subscribe, get, get);
  const redeemed = s.redemptions.reduce((sum, r) => sum + r.points, 0);
  return { ...s, balance: EARNED - redeemed, redeemed };
}
