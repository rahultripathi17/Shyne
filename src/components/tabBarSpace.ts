import { useSyncExternalStore } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BOTTOM_BAR_HEIGHT } from './BottomTabBar';

// The tab bar and the booking dock above it float over the tab screens, so each screen pads its
// end by their combined height. The dock reports its height here (0 when hidden).
let dockHeight = 0;
const listeners = new Set<() => void>();

export function setDockHeight(height: number) {
  const next = Math.round(height);
  if (next === dockHeight) return;
  dockHeight = next;
  listeners.forEach((l) => l());
}

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
};
const read = () => dockHeight;

/** Bottom padding a tab screen needs so its last item (and any toast) clears the nav and the dock. */
export function useTabBarSpace() {
  const insets = useSafeAreaInsets();
  const dock = useSyncExternalStore(subscribe, read, read);
  return BOTTOM_BAR_HEIGHT + insets.bottom + dock + 20;
}
